<template>
  <div class="transaction-status">
    <!-- 交易进行中 -->
    <n-card v-if="isLoading" class="status-card">
      <div class="status-content">
        <n-spin size="large">
          <template #icon>
            <n-icon :component="DiamondOutline" />
          </template>
        </n-spin>
        <h3>Minting NFT on Blockchain</h3>
        <p>Please confirm the transaction in your wallet...</p>
        <div v-if="txHash" class="tx-info">
          <p>Transaction Hash:</p>
          <n-button 
            text 
            type="primary" 
            @click="openEtherscan"
            class="tx-hash"
          >
            {{ shortTxHash }}
            <template #icon>
              <n-icon :component="OpenOutline" />
            </template>
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 交易成功 -->
    <n-card v-else-if="success" class="status-card success">
      <div class="status-content">
        <n-icon :component="CheckmarkCircleOutline" class="success-icon" />
        <h3>NFT Minted Successfully!</h3>
        <div class="success-details">
          <div class="detail-item">
            <span class="label">Token ID:</span>
            <span class="value">{{ tokenId }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Transaction:</span>
            <n-button 
              text 
              type="primary" 
              @click="openEtherscan"
              size="small"
            >
              View on Etherscan
              <template #icon>
                <n-icon :component="OpenOutline" />
              </template>
            </n-button>
          </div>
          <div class="detail-item">
            <span class="label">Gas Used:</span>
            <span class="value">{{ gasUsed }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Block:</span>
            <span class="value">#{{ blockNumber }}</span>
          </div>
        </div>
        <div class="action-buttons">
          <n-button type="primary" @click="viewNFT">
            View NFT Details
          </n-button>
          <n-button @click="$emit('close')">
            Close
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 交易失败 -->
    <n-card v-else-if="error" class="status-card error">
      <div class="status-content">
        <n-icon :component="CloseCircleOutline" class="error-icon" />
        <h3>Transaction Failed</h3>
        <p class="error-message">{{ error }}</p>
        <div class="action-buttons">
          <n-button type="primary" @click="$emit('retry')">
            Try Again
          </n-button>
          <n-button @click="$emit('close')">
            Close
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NCard, NButton, NIcon, NSpin } from 'naive-ui'
import { 
  DiamondOutline, 
  CheckmarkCircleOutline, 
  CloseCircleOutline,
  OpenOutline 
} from '@vicons/ionicons5'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  success: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  txHash: {
    type: String,
    default: null
  },
  tokenId: {
    type: String,
    default: null
  },
  gasUsed: {
    type: String,
    default: null
  },
  blockNumber: {
    type: String,
    default: null
  },
  etherscanLink: {
    type: String,
    default: null
  },
  nftId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'retry', 'viewNFT'])

const shortTxHash = computed(() => {
  if (!props.txHash) return ''
  return `${props.txHash.slice(0, 10)}...${props.txHash.slice(-8)}`
})

const openEtherscan = () => {
  if (props.etherscanLink) {
    window.open(props.etherscanLink, '_blank')
  }
}

const viewNFT = () => {
  emit('viewNFT', props.nftId || props.tokenId)
}
</script>

<style scoped>
.transaction-status {
  max-width: 500px;
  margin: 0 auto;
}

.status-card {
  text-align: center;
  border-radius: 16px;
}

.status-card.success {
  border: 2px solid #52c41a;
}

.status-card.error {
  border: 2px solid #ff4d4f;
}

.status-content {
  padding: 24px;
}

.status-content h3 {
  margin: 16px 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.status-content p {
  margin: 8px 0;
  color: #8b949e;
}

.tx-info {
  margin: 16px 0;
  padding: 12px;
  background: #161b22;
  border-radius: 8px;
  border: 1px solid #30363d;
}

.tx-hash {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
}

.success-icon {
  font-size: 4rem;
  color: #52c41a;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 4rem;
  color: #ff4d4f;
  margin-bottom: 16px;
}

.success-details {
  margin: 20px 0;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #30363d;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #c9d1d9;
}

.value {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #58a6ff;
}

.error-message {
  color: #ff4d4f;
  background: #2d1b1b;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}
</style>
