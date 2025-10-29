package config

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strconv"
)

type Config struct {
	// 服务器配置
	Port string

	// 区块链配置
	EthereumRPC string
	StartBlock  uint64
	PrivateKey  string

	// 数据库配置
	DatabaseURL string

	// 合约地址
	DeSciRegistryAddress    string
	ResearchNFTAddress      string
	DatasetManagerAddress   string
	InfluenceRankingAddress string
	DeSciPlatformAddress    string

	ContractsConfigPath string
}

func Load() *Config {
	cfg := &Config{
		Port:        getEnv("PORT", "8090"),
		EthereumRPC: getEnv("ETHEREUM_RPC", "http://localhost:8545"),
		StartBlock:  getEnvUint64("START_BLOCK", 0),
		PrivateKey:  getEnv("PRIVATE_KEY", ""),

		DatabaseURL: getEnv("DATABASE_URL", "sqlite://./desci.db"),

		DeSciRegistryAddress:    getEnv("DESCI_REGISTRY_ADDRESS", ""),
		ResearchNFTAddress:      getEnv("RESEARCH_NFT_ADDRESS", ""),
		DatasetManagerAddress:   getEnv("DATASET_MANAGER_ADDRESS", ""),
		InfluenceRankingAddress: getEnv("INFLUENCE_RANKING_ADDRESS", ""),
		DeSciPlatformAddress:    getEnv("DESCI_PLATFORM_ADDRESS", ""),
		ContractsConfigPath:     getEnv("CONTRACTS_CONFIG_PATH", filepath.Join("internal", "contracts", "contracts.json")),
	}

	cfg.applyContractsFromFile()
	return cfg
}

func (c *Config) applyContractsFromFile() {
	if c.ContractsConfigPath == "" {
		return
	}

	data, err := os.ReadFile(c.ContractsConfigPath)
	if err != nil {
		log.Printf("config: unable to read contracts config (%s): %v", c.ContractsConfigPath, err)
		return
	}

	var payload struct {
		Contracts map[string]struct {
			Address string `json:"address"`
		} `json:"contracts"`
	}

	if err := json.Unmarshal(data, &payload); err != nil {
		log.Printf("config: unable to parse contracts config (%s): %v", c.ContractsConfigPath, err)
		return
	}

	updateIfEmpty := func(current *string, key string) {
		if *current != "" {
			return
		}
		if entry, ok := payload.Contracts[key]; ok {
			*current = entry.Address
		}
	}

	updateIfEmpty(&c.DeSciRegistryAddress, "DeSciRegistry")
	updateIfEmpty(&c.ResearchNFTAddress, "ResearchNFT")
	updateIfEmpty(&c.DatasetManagerAddress, "DatasetManager")
	updateIfEmpty(&c.InfluenceRankingAddress, "InfluenceRanking")
	updateIfEmpty(&c.DeSciPlatformAddress, "DeSciPlatform")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvUint64(key string, defaultValue uint64) uint64 {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseUint(value, 10, 64); err == nil {
			return parsed
		}
	}
	return defaultValue
}
