package api

import (
	"net/http"
	"strconv"

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
