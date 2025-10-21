package listener

import (
	"context"
	"log"
	"math/big"
	"encoding/json"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"

	"desci-backend/internal/model"
)

type EventListener struct {
	client       *ethclient.Client
	contracts    []common.Address
	startBlock   uint64
	eventChan    chan types.Log
	ctx          context.Context
	cancel       context.CancelFunc
	eventHandler func(*model.ParsedEvent) error
	contractABIs map[string]*abi.ABI
}

func NewEventListener(rpcURL string, contractAddresses []string, startBlock uint64, contractsConfigPath string) (*EventListener, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, err
	}

	var contracts []common.Address
	for _, addr := range contractAddresses {
		contracts = append(contracts, common.HexToAddress(addr))
	}

	ctx, cancel := context.WithCancel(context.Background())

	abis, _ := loadContractABIs(contractsConfigPath)

	return &EventListener{
		client:     client,
		contracts:  contracts,
		startBlock: startBlock,
		eventChan:  make(chan types.Log, 100),
		ctx:        ctx,
		cancel:     cancel,
		contractABIs: abis,
	}, nil
}

func (el *EventListener) SetEventHandler(handler func(*model.ParsedEvent) error) {
	el.eventHandler = handler
}

func (el *EventListener) Start() error {
	log.Printf("Starting event listener for %d contracts...", len(el.contracts))

	// 先获取历史事件
	go el.processHistoricalEvents()

	// 然后监听新事件
	go el.subscribeToNewEvents()

	// 处理事件
	go el.processEvents()

	return nil
}

func (el *EventListener) processHistoricalEvents() {
	log.Println("Fetching historical events...")

	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(el.startBlock)),
		ToBlock:   nil, // latest
		Addresses: el.contracts,
	}

	logs, err := el.client.FilterLogs(el.ctx, query)
	if err != nil {
		log.Printf("Error fetching historical logs: %v", err)
		return
	}

	log.Printf("Found %d historical events", len(logs))
	for _, vLog := range logs {
		select {
		case el.eventChan <- vLog:
		case <-el.ctx.Done():
			return
		}
	}
}

func (el *EventListener) subscribeToNewEvents() {
	for {
		query := ethereum.FilterQuery{Addresses: el.contracts}
		logsCh := make(chan types.Log, 100)
		sub, err := el.client.SubscribeFilterLogs(el.ctx, query, logsCh)
		if err != nil {
			log.Printf("Error subscribing to logs: %v", err)
			select {
			case <-time.After(3 * time.Second):
				continue
			case <-el.ctx.Done():
				return
			}
		}

		log.Println("Subscribed to new events...")

		for {
			select {
			case err := <-sub.Err():
				log.Printf("Subscription error: %v", err)
				sub.Unsubscribe()
				select {
				case <-time.After(2 * time.Second):
					break
				case <-el.ctx.Done():
					return
				}
				break
			case vLog := <-logsCh:
				log.Printf("New event received: block %d, tx %s", vLog.BlockNumber, vLog.TxHash.Hex())
				select {
				case el.eventChan <- vLog:
				case <-el.ctx.Done():
					return
				}
			case <-el.ctx.Done():
				sub.Unsubscribe()
				return
			}
		}
	}
}

func (el *EventListener) processEvents() {
	log.Println("Event processor started...")

	for {
		select {
		case vLog := <-el.eventChan:
			if err := el.parseAndHandleEvent(vLog); err != nil {
				log.Printf("Error processing event: %v", err)
			}
		case <-el.ctx.Done():
			return
		}
	}
}

func (el *EventListener) parseAndHandleEvent(vLog types.Log) error {
	if el.eventHandler == nil {
		log.Println("No event handler set, skipping event")
		return nil
	}

	eventName := "UnknownEvent"
	title := ""
	tokenStr := ""
	authorAddr := ""
	var authors []string

	addrKey := strings.ToLower(vLog.Address.Hex())
	if ab, ok := el.contractABIs[addrKey]; ok && len(vLog.Topics) > 0 {
		for name, ev := range ab.Events {
			if ev.ID == vLog.Topics[0] {
				eventName = name
				vals := map[string]interface{}{}
				_ = ev.Inputs.UnpackIntoMap(vals, vLog.Data)
				switch name {
				case "ResearchMinted":
					if len(vLog.Topics) > 1 {
						bi := new(big.Int).SetBytes(vLog.Topics[1].Bytes())
						tokenStr = bi.String()
					}
					if v, ok := vals["authors"]; ok {
						if arr, ok2 := v.([]common.Address); ok2 && len(arr) > 0 {
							authorAddr = arr[0].Hex()
							for _, a := range arr {
								authors = append(authors, a.Hex())
							}
						}
					}
					if v, ok := vals["title"].(string); ok {
						title = v
					}
				case "DatasetUploaded":
					if len(vLog.Topics) > 1 {
						bi := new(big.Int).SetBytes(vLog.Topics[1].Bytes())
						tokenStr = bi.String()
					}
					if len(vLog.Topics) > 2 {
						authorAddr = common.HexToAddress(vLog.Topics[2].Hex()).Hex()
					}
					if v, ok := vals["title"].(string); ok {
						title = v
					}
				case "UserRegistered":
					if len(vLog.Topics) > 1 {
						authorAddr = common.HexToAddress(vLog.Topics[1].Hex()).Hex()
					}
				}
				break
			}
		}
	}

	if title == "" {
		if eventName == "ResearchMinted" && tokenStr != "" {
			title = "Research #" + tokenStr
		} else if eventName == "DatasetUploaded" && tokenStr != "" {
			title = "Dataset #" + tokenStr
		} else {
			title = "Blockchain Event"
		}
	}

	parsedEvent := &model.ParsedEvent{
		TokenID:     tokenStr,
		Author:      authorAddr,
		DataHash:    vLog.TxHash.Hex(),
		Block:       vLog.BlockNumber,
		TxHash:      vLog.TxHash.Hex(),
		LogIndex:    uint(vLog.Index),
		EventName:   eventName,
		Title:       title,
		Description: "",
	}

	log.Printf("📡 Processing event: %s, TokenID=%s, Block=%d", eventName, parsedEvent.TokenID, parsedEvent.Block)

	return el.eventHandler(parsedEvent)
}

// 根据事件特征猜测事件类型
func (el *EventListener) guessEventType(vLog types.Log) string {
	// 简单的启发式判断
	if len(vLog.Topics) >= 2 {
		return "UserRegistered"
	} else if len(vLog.Data) > 32 {
		return "ResearchMinted"
	} else {
		return "DatasetUploaded"
	}
}

// 为事件生成标题
func (el *EventListener) generateTitleForEvent(eventName string) string {
	switch eventName {
	case "UserRegistered":
		return "新用户注册到平台"
	case "DatasetUploaded":
		return "科研数据集上传"
	case "ResearchMinted":
		return "研究成果NFT铸造"
	default:
		return "区块链事件"
	}
}

// 为事件生成描述
func (el *EventListener) generateDescriptionForEvent(eventName string) string {
	switch eventName {
	case "UserRegistered":
		return "用户成功注册到DeSci平台"
	case "DatasetUploaded":
		return "研究数据集已上传到平台"
	case "ResearchMinted":
		return "研究成果已铸造为NFT"
	default:
		return "来自区块链的事件数据"
	}
}

func (el *EventListener) Stop() {
	log.Println("Stopping event listener...")
	el.cancel()
	close(el.eventChan)
}

func (el *EventListener) GetEventChannel() <-chan types.Log {
	return el.eventChan
}

func loadContractABIs(configPath string) (map[string]*abi.ABI, error) {
	result := map[string]*abi.ABI{}
	if configPath == "" {
		return result, nil
	}
	b, err := os.ReadFile(configPath)
	if err != nil {
		return result, err
	}
	var payload struct {
		Contracts map[string]struct {
			Address string          `json:"address"`
			ABI     json.RawMessage `json:"abi"`
		} `json:"contracts"`
	}
	if err := json.Unmarshal(b, &payload); err != nil {
		return result, err
	}
	for _, c := range payload.Contracts {
		if c.Address == "" || len(c.ABI) == 0 {
			continue
		}
		ab, err := abi.JSON(strings.NewReader(string(c.ABI)))
		if err != nil {
			continue
		}
		result[strings.ToLower(common.HexToAddress(c.Address).Hex())] = &ab
	}
	return result, nil

}
