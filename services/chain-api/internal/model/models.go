package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// ResearchData 研究数据记录
type ResearchData struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	TokenID      string      `gorm:"uniqueIndex" json:"token_id"`
	Title        string      `json:"title"`
	Authors      StringArray `gorm:"type:text" json:"authors"`
	ContentHash  string      `json:"content_hash"`
	MetadataHash string      `json:"metadata_hash"`
	BlockNumber  uint64      `json:"block_number"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

// NodeJSNFT Node.js数据库中的NFT记录（用于数据对比）
type NodeJSNFT struct {
	ID              int       `gorm:"primaryKey" json:"id"`
	ProjectID       int       `json:"project_id"`
	TokenID         string    `json:"token_id"`
	ContractAddress string    `json:"contract_address"`
	MetadataURI     string    `json:"metadata_uri"`
	OwnerID         int       `json:"owner_id"`
	AssetType       string    `json:"asset_type"`
	CreatedAt       time.Time `json:"created_at"`
}

// NodeJSProject Node.js数据库中的项目记录
type NodeJSProject struct {
	ID          int       `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Visibility  string    `json:"visibility"`
	Status      string    `json:"status"`
	Category    string    `json:"category"`
	OwnerID     int       `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// DataVerificationResult 数据验证结果
type DataVerificationResult struct {
	TokenID           string    `json:"token_id"`
	IsConsistent      bool      `json:"is_consistent"`
	NodeJSData        *NodeJSNFT `json:"nodejs_data"`
	BlockchainData    *ResearchData `json:"blockchain_data"`
	VerificationTime  time.Time `json:"verification_time"`
	Issues            []string  `json:"issues,omitempty"`
}

// DatasetRecord 数据集记录表结构
type DatasetRecord struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	DatasetID   string    `json:"dataset_id" gorm:"uniqueIndex;size:255"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Owner       string    `json:"owner" gorm:"index;size:255"`
	DataHash    string    `json:"data_hash"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// EventLog 事件日志表结构
type EventLog struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	TxHash       string    `json:"tx_hash" gorm:"index;size:255"`
	LogIndex     uint      `json:"log_index"`
	BlockNumber  uint64    `json:"block_number" gorm:"index"`
	EventName    string    `json:"event_name" gorm:"index;size:255"`
	ContractAddr string    `json:"contract_address"`
	PayloadRaw   string    `json:"payload_raw" gorm:"type:text"`
	Processed    bool      `json:"processed" gorm:"default:false"`
	CreatedAt    time.Time `json:"created_at"`
}

// ParsedEvent 解析后的事件结构（用于事件监听）
type ParsedEvent struct {
	TokenID     string   `json:"token_id"`
	Author      string   `json:"author"`
	Contract    string   `json:"contract"`
	Authors     []string `json:"authors,omitempty"`
	DataHash    string   `json:"data_hash"`
	MetadataHash string   `json:"metadata_hash,omitempty"`
	Block       uint64   `json:"block"`
	TxHash      string   `json:"tx_hash"`
	LogIndex    uint     `json:"log_index"`
	EventName   string   `json:"event_name"`
	Title       string   `json:"title,omitempty"`
	Description string   `json:"description,omitempty"`
}

// 复合唯一索引: tx_hash + log_index
func (EventLog) TableName() string {
	return "event_logs"
}

// uint256 类型别名，用于处理大整数
type uint256 = string

// StringArray 自定义字符串数组类型，兼容SQLite和PostgreSQL
type StringArray []string

// Value 实现 driver.Valuer 接口
func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

// Scan 实现 sql.Scanner 接口
func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		return errors.New("cannot scan into StringArray")
	}
}
