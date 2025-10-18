package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"desci-backend/internal/api"
	"desci-backend/internal/config"
	"desci-backend/internal/listener"
	"desci-backend/internal/model"
	"desci-backend/internal/repository"
	"desci-backend/internal/service"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库Repository
	repo, err := repository.NewRepository(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected successfully")

	// 创建演示数据（如果数据库为空）
	if err := createDemoData(repo); err != nil {
		log.Printf("⚠️  Failed to create demo data: %v", err)
	}

	// 初始化Service层
	svc := service.NewService(repo)

	// 初始化API处理器
	handler := api.NewHandler(svc)

	// 设置HTTP路由
	router := handler.SetupRoutes()

	// 启动HTTP服务器
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// 启动区块链事件监听器
	contractAddresses := []string{
		cfg.DeSciRegistryAddress,
		cfg.ResearchNFTAddress,
		cfg.DatasetManagerAddress,
		cfg.InfluenceRankingAddress,
		cfg.DeSciPlatformAddress,
	}

	// 过滤掉空地址
	var validAddresses []string
	for _, addr := range contractAddresses {
		if addr != "" {
			validAddresses = append(validAddresses, addr)
		}
	}

	if len(validAddresses) > 0 {
		// 从数据库续接区块高度（优先使用DB记录，其次使用配置）
		resumeBlock := cfg.StartBlock
		if lastBlock, err := repo.GetLastEventBlock(); err == nil && lastBlock > resumeBlock {
			resumeBlock = lastBlock + 1
		}

		eventListener, err := listener.NewEventListener(cfg.EthereumRPC, validAddresses, resumeBlock, cfg.ContractsConfigPath)
		if err != nil {
			log.Printf("⚠️  Failed to create event listener: %v", err)
			log.Println("🚀 Starting server without blockchain listener...")
		} else {
			log.Println("✅ Event listener created successfully")

			// 设置事件处理器 - 使用闭包捕获repo和svc
			eventListener.SetEventHandler(func(event *model.ParsedEvent) error {
				log.Printf("📡 Processing blockchain event: %s", event.EventName)

				// 规范化事件名称
				normalized := event.EventName
				switch event.EventName {
				case "ResearchMinted":
					normalized = "ResearchCreated"
				case "DatasetUploaded":
					normalized = "DatasetCreated"
				}

				// 构造标准化载荷
				var payload map[string]interface{}
				switch normalized {
				case "ResearchCreated":
					payload = map[string]interface{}{
						"tokenId":      event.TokenID,
						"authors": func() []string {
							if len(event.Authors) > 0 { return event.Authors }
							if event.Author != "" { return []string{event.Author} }
							return []string{}
						}(),
						"title":        event.Title,
						"contentHash":  event.DataHash,
						"metadataHash": event.MetadataHash,
					}
				case "DatasetCreated":
					payload = map[string]interface{}{
						"datasetId":   event.TokenID,
						"title":       event.Title,
						"description": event.Description,
						"owner":       event.Author,
						"ipfsHash":    event.DataHash,
					}
				default:
					payload = map[string]interface{}{
						"tokenId":     event.TokenID,
						"title":       event.Title,
						"description": event.Description,
					}
				}

				b, err := json.Marshal(payload)
				if err != nil {
					log.Printf("⚠️  Failed to marshal event payload: %v", err)
					return err
				}

				// 插入事件日志到 event_logs 表
				eventLog := &model.EventLog{
					TxHash:       event.TxHash,
					LogIndex:     uint(event.LogIndex),
					BlockNumber:  event.Block,
					EventName:    normalized,
					ContractAddr: event.Contract,
					PayloadRaw:   string(b),
					Processed:    false,
					CreatedAt:    time.Now(),
				}

				if err := repo.InsertEventLog(eventLog); err != nil {
					log.Printf("⚠️  Failed to insert event log: %v", err)
					return err
				}
				log.Printf("📝 Event log inserted: %s", normalized)

				// 交由服务层处理，并标记处理完成
				switch normalized {
				case "ResearchCreated", "DatasetCreated":
					if err := svc.ProcessEvent(eventLog); err != nil {
						log.Printf("⚠️  Service processing failed: %v", err)
						return err
					}
					if err := repo.MarkEventProcessed(eventLog.ID); err != nil {
						log.Printf("⚠️  Mark processed failed: %v", err)
					} else {
						log.Printf("✅ Service processed and marked event: %s", normalized)
					}
				default:
					log.Printf("ℹ️  Event logged only: %s", normalized)
				}

				return nil
			})

			// 在goroutine中启动事件监听
			go func() {
				if err := eventListener.Start(); err != nil {
					log.Printf("❌ Event listener error: %v", err)
				}
			}()
			log.Println("🔄 Blockchain event listener started")
		}
	} else {
		log.Println("⚠️  No contract addresses configured, starting server without blockchain listener...")
	}

	// 启动HTTP服务器
	go func() {
		log.Printf("🚀 Server starting on :%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server failed to start: %v", err)
		}
	}()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Server shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("❌ Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited")
}

// createDemoData 创建演示数据（如果数据库为空）
func createDemoData(repo *repository.Repository) error {
	// 检查是否已有演示数据
	existing, err := repo.GetResearchData("demo-token-123")
	if err == nil && existing != nil {
		log.Println("📋 Demo data already exists, skipping creation")
		return nil
	}

	log.Println("📋 Creating demo data...")

	// 创建演示研究数据
	demoResearch := &model.ResearchData{
		TokenID:      "demo-token-123",
		Title:        "区块链在科学数据管理中的应用研究",
		Authors:      model.StringArray{"0x742d35Cc6731C0532925a3b8D4Ca78fC6fD7F4dC", "0x8ba1f109551bD432803012645Hac136c"},
		ContentHash:  "0xa7c617352ec25c35382e0f0190cbe99c6aba8e3d30b910d58c85a6e4782da079",
		MetadataHash: "0xabcdef1234567890abcdef1234567890abcdef12",
		BlockNumber:  18500000,
	}

	if err := repo.InsertResearchData(demoResearch); err != nil {
		return err
	}

	// 创建演示数据集
	demoDataset := &model.DatasetRecord{
		DatasetID:   "dataset-456",
		Title:       "区块链交易数据集",
		Description: "包含以太坊主网2023年交易数据的综合数据集",
		Owner:       "0x742d35Cc6634C0532925a3b8D3AC92F3B1a3C",
		DataHash:    "QmX7VmP8K9Z1N2M3B4A5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := repo.InsertDatasetRecord(demoDataset); err != nil {
		return err
	}

	// 创建演示事件日志
	demoEvent := &model.EventLog{
		EventName:    "ResearchCreated",
		ContractAddr: "0x1234567890123456789012345678901234567890",
		TxHash:       "0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
		BlockNumber:  18500000,
		LogIndex:     0,
		PayloadRaw:   `{"tokenId":"demo-token-123","title":"区块链在科学数据管理中的应用研究","authors":["张三","李四","王五"]}`,
		Processed:    true,
	}

	if err := repo.InsertEventLog(demoEvent); err != nil {
		return err
	}

	log.Println("✅ Demo data created successfully")
	log.Println("📋 Demo Research Token ID: demo-token-123")
	log.Println("📋 Demo Dataset ID: dataset-456")

	return nil
}
