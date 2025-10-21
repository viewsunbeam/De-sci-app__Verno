package api

import (
	"net/http"
	"strconv"
	"time"

	"desci-backend/internal/model"
	"desci-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type HybridHandler struct {
	repo repository.IRepository
}

func NewHybridHandler(repo repository.IRepository) *HybridHandler {
	return &HybridHandler{repo: repo}
}

// VerifyNFTData 验证NFT数据一致性
func (h *HybridHandler) VerifyNFTData(c *gin.Context) {
	tokenID := c.Param("tokenId")
	if tokenID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token ID is required"})
		return
	}

	// 从区块链数据获取研究数据
	blockchainData, err := h.repo.GetResearchData(tokenID)
	var issues []string
	isConsistent := true

	if err != nil {
		issues = append(issues, "No blockchain data found for this token")
		isConsistent = false
	}

	// 模拟Node.js数据（实际应用中可以通过数据库查询获取）
	nodeNFT := &model.NodeJSNFT{
		TokenID:         tokenID,
		ContractAddress: "0x1234567890abcdef1234567890abcdef12345678",
		AssetType:       "Research",
		CreatedAt:       time.Now(),
	}

	// 数据一致性检查
	if blockchainData != nil {
		if blockchainData.TokenID != nodeNFT.TokenID {
			issues = append(issues, "Token ID mismatch")
			isConsistent = false
		}
	}

	result := model.DataVerificationResult{
		TokenID:          tokenID,
		IsConsistent:     isConsistent,
		NodeJSData:       nodeNFT,
		BlockchainData:   blockchainData,
		VerificationTime: time.Now(),
		Issues:           issues,
	}

	c.JSON(http.StatusOK, result)
}

// GetHybridNFTList 获取混合NFT列表（Node.js + 区块链验证状态）
func (h *HybridHandler) GetHybridNFTList(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	// 获取区块链研究数据
	researchData, err := h.repo.GetLatestResearchData(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch research data"})
		return
	}

	// 为每个研究数据添加验证状态
	type HybridNFT struct {
		TokenID           string    `json:"token_id"`
		Title             string    `json:"title"`
		Authors           []string  `json:"authors"`
		BlockNumber       uint64    `json:"block_number"`
		CreatedAt         time.Time `json:"created_at"`
		HasBlockchainData bool      `json:"has_blockchain_data"`
		IsVerified        bool      `json:"is_verified"`
		AssetType         string    `json:"asset_type"`
	}

	var hybridNFTs []HybridNFT
	for _, data := range researchData {
		hybridNFT := HybridNFT{
			TokenID:           data.TokenID,
			Title:             data.Title,
			Authors:           data.Authors,
			BlockNumber:       data.BlockNumber,
			CreatedAt:         data.CreatedAt,
			HasBlockchainData: true,
			IsVerified:        true,
			AssetType:         "Research",
		}
		hybridNFTs = append(hybridNFTs, hybridNFT)
	}

	c.JSON(http.StatusOK, gin.H{
		"nfts":   hybridNFTs,
		"count":  len(hybridNFTs),
		"limit":  limit,
		"offset": offset,
	})
}

// GetProjectStats 获取项目统计信息（混合数据源）
func (h *HybridHandler) GetProjectStats(c *gin.Context) {
	// 获取区块链数据统计
	researchData, _ := h.repo.GetLatestResearchData(100, 0)
	
	// 模拟Node.js统计数据
	nodeStats := struct {
		TotalProjects int `json:"total_projects"`
		TotalNFTs     int `json:"total_nfts"`
		TotalUsers    int `json:"total_users"`
	}{
		TotalProjects: 19,
		TotalNFTs:     43,
		TotalUsers:    22,
	}

	// 区块链数据统计
	blockchainStats := struct {
		TotalResearchRecords int `json:"total_research_records"`
		TotalEventLogs       int `json:"total_event_logs"`
	}{
		TotalResearchRecords: len(researchData),
		TotalEventLogs:       12,
	}

	c.JSON(http.StatusOK, gin.H{
		"nodejs_stats":     nodeStats,
		"blockchain_stats": blockchainStats,
		"generated_at":     time.Now(),
	})
}

// CompareDataSources 对比不同数据源的数据
func (h *HybridHandler) CompareDataSources(c *gin.Context) {
	// 获取区块链研究数据
	researchData, _ := h.repo.GetLatestResearchData(5, 0)

	type ComparisonResult struct {
		TokenID           string `json:"token_id"`
		HasNodeJSData     bool   `json:"has_nodejs_data"`
		HasBlockchainData bool   `json:"has_blockchain_data"`
		DataMatch         bool   `json:"data_match"`
		CreatedAt         string `json:"created_at"`
	}

	var results []ComparisonResult
	for _, data := range researchData {
		result := ComparisonResult{
			TokenID:           data.TokenID,
			HasNodeJSData:     false, // 模拟：大部分区块链数据在Node.js中没有对应记录
			HasBlockchainData: true,
			DataMatch:         false,
			CreatedAt:         data.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		// 模拟一些数据有匹配
		if data.TokenID == "demo-token-123" {
			result.HasNodeJSData = true
			result.DataMatch = true
		}

		results = append(results, result)
	}

	c.JSON(http.StatusOK, gin.H{
		"comparison_results": results,
		"total_compared":     len(results),
		"generated_at":       time.Now(),
	})
}
