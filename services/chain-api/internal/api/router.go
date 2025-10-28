package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"desci-backend/internal/repository"
	"desci-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *service.Service
	repo    repository.IRepository
}

func NewHandler(service *service.Service, repo repository.IRepository) *Handler {
	return &Handler{service: service, repo: repo}
}

func (h *Handler) SetupRoutes() *gin.Engine {
	r := gin.Default()

	// 添加CORS中间件
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// 健康检查
	r.GET("/health", h.healthCheck)

	// API路由组
	api := r.Group("/api")
	{
		// 研究数据API
		api.GET("/research/:id", h.getResearch)
		api.GET("/research/latest", h.getLatestResearch)
		api.GET("/research/by-author/:addr", h.getResearchByAuthor)
		api.POST("/research/:id/verify", h.verifyResearch)

		// 数据集API（保留现有功能）
		api.GET("/dataset/:datasetId", h.getDataset)
		
		// 数据集上传API
		api.POST("/datasets/upload", h.uploadDataset)
		api.GET("/datasets", h.getDatasets)
		api.GET("/datasets/:id", h.getDatasetDetail)
		api.DELETE("/datasets/:id", h.deleteDataset)
		api.GET("/projects", h.getUserProjects)
		
		// 用户管理API
		api.GET("/users/wallet/:address", h.getUserByWallet)
		api.GET("/users/wallet/:address/dashboard-stats", h.getDashboardStats)
	}

	// 混合查询API路由组
	hybridHandler := NewHybridHandler(h.repo)
	hybrid := r.Group("/api/hybrid")
	{
		// NFT数据验证
		hybrid.GET("/verify/:tokenId", hybridHandler.VerifyNFTData)
		// 混合NFT列表
		hybrid.GET("/nfts", hybridHandler.GetHybridNFTList)
		// 项目统计
		hybrid.GET("/stats", hybridHandler.GetProjectStats)
		// 数据源对比
		hybrid.GET("/compare", hybridHandler.CompareDataSources)
	}

	return r
}

// 健康检查
func (h *Handler) healthCheck(c *gin.Context) {
	lastEventBlock, err := h.service.GetLastEventBlock()
	response := gin.H{
		"status":  "ok",
		"service": "desci-backend",
		"db":      "ok",
	}

	if err != nil {
		response["last_event_block"] = 0
		response["db"] = "error"
	} else {
		response["last_event_block"] = lastEventBlock
	}

	c.JSON(http.StatusOK, response)
}

// 获取研究数据
func (h *Handler) getResearch(c *gin.Context) {
	tokenID := c.Param("id")

	research, err := h.service.GetResearchByTokenID(tokenID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Research not found",
		})
		return
	}

	c.JSON(http.StatusOK, research)
}

// 获取数据集
func (h *Handler) getDataset(c *gin.Context) {
	datasetID := c.Param("datasetId")

	dataset, err := h.service.GetDatasetByID(datasetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Dataset not found",
		})
		return
	}

	c.JSON(http.StatusOK, dataset)
}

// 验证研究内容
func (h *Handler) verifyResearch(c *gin.Context) {
	tokenID := c.Param("id")

	var req struct {
		RawContent string `json:"rawContent" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	isValid, err := h.service.VerifyResearchContent(tokenID, req.RawContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to verify content",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"match": isValid,
	})
}

// 获取最新研究列表
func (h *Handler) getLatestResearch(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	research, err := h.service.GetLatestResearch(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get research list",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"list":   research,
		"limit":  limit,
		"offset": offset,
		"count":  len(research),
	})
}

// 按作者获取研究列表
func (h *Handler) getResearchByAuthor(c *gin.Context) {
	author := c.Param("addr")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	research, err := h.service.GetResearchByAuthor(author, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get research by author",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"list":   research,
		"author": author,
		"limit":  limit,
		"count":  len(research),
	})
}

// 数据集上传处理
func (h *Handler) uploadDataset(c *gin.Context) {
	// 解析表单数据
	name := c.PostForm("name")
	description := c.PostForm("description")
	ownerWallet := c.PostForm("owner_wallet_address")
	privacyLevel := c.PostForm("privacy_level")
	category := c.PostForm("category")
	status := c.PostForm("status")
	
	if name == "" || ownerWallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Name and owner wallet address are required",
		})
		return
	}

	// 创建上传目录
	uploadDir := "../../uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create upload directory",
		})
		return
	}

	// 处理文件上传
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to parse multipart form",
		})
		return
	}

	files := form.File["datasets"]
	var filePaths []string
	
	for _, file := range files {
		// 生成唯一文件名
		timestamp := time.Now().Unix()
		filename := fmt.Sprintf("%d_%s", timestamp, file.Filename)
		dst := filepath.Join(uploadDir, filename)
		
		// 保存文件
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to open uploaded file",
			})
			return
		}
		defer src.Close()

		out, err := os.Create(dst)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create destination file",
			})
			return
		}
		defer out.Close()

		_, err = io.Copy(out, src)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to save file",
			})
			return
		}
		
		filePaths = append(filePaths, dst)
	}

	// 生成数据集ID
	datasetID := fmt.Sprintf("dataset_%d", time.Now().Unix())
	
	// 模拟保存到数据库（实际项目中应该保存到真实数据库）
	c.JSON(http.StatusOK, gin.H{
		"id":           datasetID,
		"name":         name,
		"description":  description,
		"owner":        ownerWallet,
		"privacy_level": privacyLevel,
		"category":     category,
		"status":       status,
		"files":        filePaths,
		"created_at":   time.Now(),
		"message":      "Dataset uploaded successfully",
	})
}

// 获取用户项目列表
func (h *Handler) getUserProjects(c *gin.Context) {
	walletAddress := c.Query("wallet_address")
	
	if walletAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "wallet_address parameter is required",
		})
		return
	}

	// 模拟项目数据（实际项目中应该从数据库查询）
	projects := []gin.H{
		{
			"id":          1,
			"name":        "AI Research Project",
			"description": "Machine learning research on medical data",
			"owner":       walletAddress,
			"created_at":  "2024-01-15T10:00:00Z",
		},
		{
			"id":          2,
			"name":        "Blockchain Analytics",
			"description": "Analysis of DeFi protocols",
			"owner":       walletAddress,
			"created_at":  "2024-02-20T14:30:00Z",
		},
	}

	c.JSON(http.StatusOK, projects)
}

// 获取数据集列表
func (h *Handler) getDatasets(c *gin.Context) {
	walletAddress := c.Query("wallet_address")
	
	if walletAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "wallet_address parameter is required",
		})
		return
	}

	// 模拟数据集数据（实际项目中应该从数据库查询）
	datasets := []gin.H{
		{
			"id":           "demo-dataset-1",
			"name":         "AI Research Dataset",
			"description":  "Machine learning dataset for medical image analysis",
			"category":     "AI",
			"privacy_level": "private",
			"status":       "ready",
			"file_size":    52428800, // 50MB
			"created_at":   "2024-10-28T12:00:00Z",
			"owner":        walletAddress,
		},
		{
			"id":           "demo-dataset-2",
			"name":         "Genomics Data Collection", 
			"description":  "Comprehensive genomics research data with privacy protection",
			"category":     "Healthcare",
			"privacy_level": "zk_proof_protected",
			"status":       "ready",
			"file_size":    125829120, // 120MB
			"created_at":   "2024-10-27T10:30:00Z",
			"owner":        walletAddress,
		},
		{
			"id":           "demo-dataset-3",
			"name":         "Climate Change Data",
			"description":  "Environmental data for climate research",
			"category":     "Research",
			"privacy_level": "public",
			"status":       "ready",
			"file_size":    78643200, // 75MB
			"created_at":   "2024-10-26T14:15:00Z",
			"owner":        walletAddress,
		},
	}

	c.JSON(http.StatusOK, datasets)
}

// 删除数据集
func (h *Handler) deleteDataset(c *gin.Context) {
	datasetID := c.Param("id")
	
	if datasetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dataset ID is required",
		})
		return
	}

	// 模拟删除操作
	c.JSON(http.StatusOK, gin.H{
		"message": "Dataset deleted successfully",
		"id":      datasetID,
	})
}

// 获取数据集详情
func (h *Handler) getDatasetDetail(c *gin.Context) {
	datasetID := c.Param("id")
	walletAddress := c.Query("wallet_address")
	
	if datasetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dataset ID is required",
		})
		return
	}

	// 模拟数据集详情数据
	dataset := gin.H{
		"id":           datasetID,
		"name":         "Demo Dataset",
		"description":  "This is a demo dataset for testing purposes",
		"category":     "Research",
		"privacy_level": "private",
		"status":       "ready",
		"file_size":    52428800, // 50MB
		"created_at":   "2024-10-28T12:00:00Z",
		"owner":        walletAddress,
		"files": []gin.H{
			{
				"name": "data.csv",
				"size": 1024000,
				"type": "text/csv",
			},
		},
	}

	c.JSON(http.StatusOK, dataset)
}

// 根据钱包地址获取用户信息
func (h *Handler) getUserByWallet(c *gin.Context) {
	address := c.Param("address")
	
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Wallet address is required",
		})
		return
	}

	// 模拟用户数据
	user := gin.H{
		"wallet_address": address,
		"username":       fmt.Sprintf("User_%s", address[len(address)-4:]),
		"user_role":      "researcher",
		"created_at":     "2024-10-28T10:00:00Z",
		"verified":       true,
	}

	c.JSON(http.StatusOK, user)
}

// 获取仪表板统计数据
func (h *Handler) getDashboardStats(c *gin.Context) {
	address := c.Param("address")
	
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Wallet address is required",
		})
		return
	}

	// 模拟仪表板统计数据
	stats := gin.H{
		"projects_count":     3,
		"datasets_count":     5,
		"publications_count": 2,
		"nfts_count":        4,
		"reviews_count":     7,
		"total_storage":     "245MB",
		"recent_activity": []gin.H{
			{
				"type":        "dataset_upload",
				"title":       "New dataset uploaded",
				"description": "AI Research Dataset",
				"timestamp":   "2024-10-28T14:30:00Z",
			},
			{
				"type":        "project_created",
				"title":       "Project created",
				"description": "Blockchain Analytics Project",
				"timestamp":   "2024-10-27T16:45:00Z",
			},
		},
	}

	c.JSON(http.StatusOK, stats)
}
