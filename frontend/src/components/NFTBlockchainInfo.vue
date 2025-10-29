<template>
  <div class="blockchain-info">
    <n-card title="Blockchain Information" class="info-card">
      <template #header-extra>
        <n-tag type="success" v-if="nftInfo.onChain">
          <template #icon>
            <n-icon :component="CheckmarkCircleOutline" />
          </template>
          On-Chain
        </n-tag>
        <n-tag type="warning" v-else>
          <template #icon>
            <n-icon :component="WarningOutline" />
          </template>
          Off-Chain
        </n-tag>
      </template>

      <div class="info-grid" v-if="nftInfo.onChain">
        <!-- Token ID -->
        <div class="info-item">
          <div class="info-label">Token ID</div>
          <div class="info-value">
            <span class="token-id">#{{ nftInfo.tokenId }}</span>
            <n-button 
              text 
              size="small" 
              @click="copyToClipboard(nftInfo.tokenId)"
            >
              <template #icon>
                <n-icon :component="CopyOutline" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Contract Address -->
        <div class="info-item">
          <div class="info-label">Contract Address</div>
          <div class="info-value">
            <span class="address">{{ shortAddress(contractAddress) }}</span>
            <n-button 
              text 
              size="small" 
              @click="copyToClipboard(contractAddress)"
            >
              <template #icon>
                <n-icon :component="CopyOutline" />
              </template>
            </n-button>
            <n-button 
              text 
              size="small" 
              @click="openEtherscan('address', contractAddress)"
            >
              <template #icon>
                <n-icon :component="OpenOutline" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Owner Address -->
        <div class="info-item">
          <div class="info-label">Owner</div>
          <div class="info-value">
            <span class="address">{{ shortAddress(nftInfo.owner?.walletAddress) }}</span>
            <n-button 
              text 
              size="small" 
              @click="copyToClipboard(nftInfo.owner?.walletAddress)"
            >
              <template #icon>
                <n-icon :component="CopyOutline" />
              </template>
            </n-button>
            <n-button 
              text 
              size="small" 
              @click="openEtherscan('address', nftInfo.owner?.walletAddress)"
            >
              <template #icon>
                <n-icon :component="OpenOutline" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Transaction Hash -->
        <div class="info-item" v-if="nftInfo.txHash">
          <div class="info-label">Mint Transaction</div>
          <div class="info-value">
            <span class="address">{{ shortAddress(nftInfo.txHash) }}</span>
            <n-button 
              text 
              size="small" 
              @click="copyToClipboard(nftInfo.txHash)"
            >
              <template #icon>
                <n-icon :component="CopyOutline" />
              </template>
            </n-button>
            <n-button 
              text 
              size="small" 
              @click="openEtherscan('tx', nftInfo.txHash)"
            >
              <template #icon>
                <n-icon :component="OpenOutline" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Block Number -->
        <div class="info-item" v-if="nftInfo.blockNumber">
          <div class="info-label">Block Number</div>
          <div class="info-value">
            <span class="block-number">#{{ nftInfo.blockNumber }}</span>
            <n-button 
              text 
              size="small" 
              @click="openEtherscan('block', nftInfo.blockNumber)"
            >
              <template #icon>
                <n-icon :component="OpenOutline" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Gas Used -->
        <div class="info-item" v-if="nftInfo.gasUsed">
          <div class="info-label">Gas Used</div>
          <div class="info-value">
            <span class="gas-used">{{ formatGas(nftInfo.gasUsed) }}</span>
          </div>
        </div>

        <!-- Network -->
        <div class="info-item">
          <div class="info-label">Network</div>
          <div class="info-value">
            <n-tag :type="getNetworkType(networkInfo.chainId)">
              {{ networkInfo.name || 'Unknown' }}
            </n-tag>
          </div>
        </div>

        <!-- Metadata URI -->
        <div class="info-item" v-if="nftInfo.metadataURI">
          <div class="info-label">Metadata URI</div>
          <div class="info-value">
            <span class="address">{{ shortAddress(nftInfo.metadataURI) }}</span>
            <n-button 
              text 
              size="small" 
              @click="copyToClipboard(nftInfo.metadataURI)"
            >
              <template #icon>
                <n-icon :component="CopyOutline" />
              </template>
            </n-button>
            <n-button 
              text 
              size="small" 
              @click="openIPFS(nftInfo.metadataURI)"
            >
              <template #icon>
                <n-icon :component="OpenOutline" />
              </template>
            </n-button>
          </div>
        </div>
      </div>

      <!-- Author Shares (如果是链上NFT) -->
      <div v-if="nftInfo.onChain && authorShares.length > 0" class="author-shares">
        <n-divider>Author Contribution Shares</n-divider>
        <div class="shares-list">
          <div 
            v-for="(share, index) in authorShares" 
            :key="index"
            class="share-item"
          >
            <div class="author-info">
              <span class="author-address">{{ shortAddress(share.address) }}</span>
              <n-button 
                text 
                size="small" 
                @click="copyToClipboard(share.address)"
              >
                <template #icon>
                  <n-icon :component="CopyOutline" />
                </template>
              </n-button>
            </div>
            <div class="share-percentage">
              {{ (share.share / 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 快速链接 -->
      <div class="quick-links" v-if="nftInfo.onChain">
        <n-divider>Quick Links</n-divider>
        <n-space>
          <n-button 
            type="primary" 
            @click="openEtherscan('token', `${contractAddress}?a=${nftInfo.tokenId}`)"
          >
            <template #icon>
              <n-icon :component="OpenOutline" />
            </template>
            View on Etherscan
          </n-button>
          <n-button 
            @click="openOpenSea"
            v-if="isMainnet"
          >
            <template #icon>
              <n-icon :component="OpenOutline" />
            </template>
            View on OpenSea
          </n-button>
          <n-button 
            @click="refreshBlockchainData"
            :loading="isRefreshing"
          >
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            Refresh Data
          </n-button>
        </n-space>
      </div>

      <!-- 离线状态提示 -->
      <div v-else class="offline-notice">
        <n-alert type="info" title="Off-Chain NFT">
          This NFT exists only in the local database and has not been minted on the blockchain yet.
        </n-alert>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  NCard, NTag, NButton, NIcon, NSpace, NDivider, NAlert, useMessage 
} from 'naive-ui'
import { 
  CheckmarkCircleOutline, 
  WarningOutline, 
  CopyOutline, 
  OpenOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import { useResearchNFT } from '../composables/useResearchNFT'
import contractsConfig from '../contracts.json'

const props = defineProps({
  nftInfo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const message = useMessage()
const { getNFTInfo, getEtherscanLink, getNetworkInfo } = useResearchNFT()

const isRefreshing = ref(false)
const authorShares = ref([])
const networkInfo = ref({})

// 合约地址
const contractAddress = contractsConfig.contracts?.ResearchNFT?.address || '0x0000000000000000000000000000000000000000'

// 计算属性
const isMainnet = computed(() => networkInfo.value.chainId === 1)

// 方法
const shortAddress = (address) => {
  if (!address || typeof address !== 'string') return ''
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatGas = (gas) => {
  if (!gas) return '0'
  return parseInt(gas).toLocaleString()
}

const getNetworkType = (chainId) => {
  switch (chainId) {
    case 1: return 'success'      // Mainnet
    case 31337: return 'info'     // Localhost
    default: return 'warning'     // Testnet
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('Copied to clipboard!')
  } catch (err) {
    message.error('Failed to copy to clipboard')
  }
}

const openEtherscan = (type, value) => {
  // 在本地开发环境中使用我们的本地区块链浏览器
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  if (isLocalhost) {
    const localExplorerUrl = `http://localhost:5173/etherscan-local.html?type=${type}&value=${encodeURIComponent(value)}`
    window.open(localExplorerUrl, '_blank')
  } else {
    const link = getEtherscanLink(value, type)
    window.open(link, '_blank')
  }
}

const openIPFS = (uri) => {
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '')
    window.open(`https://ipfs.io/ipfs/${hash}`, '_blank')
  } else {
    window.open(uri, '_blank')
  }
}

const openOpenSea = () => {
  if (isMainnet.value && props.nftInfo.tokenId) {
    const url = `https://opensea.io/assets/ethereum/${contractAddress}/${props.nftInfo.tokenId}`
    window.open(url, '_blank')
  }
}

const refreshBlockchainData = async () => {
  if (!props.nftInfo.onChain || !props.nftInfo.tokenId) return
  
  isRefreshing.value = true
  try {
    // 从区块链获取最新数据
    const chainData = await getNFTInfo(props.nftInfo.tokenId)
    
    // 获取作者份额
    authorShares.value = chainData.authorAddresses.map((address, index) => ({
      address,
      share: parseInt(chainData.authorShares[index])
    }))
    
    message.success('Blockchain data refreshed!')
    emit('refresh', chainData)
  } catch (error) {
    console.error('Failed to refresh blockchain data:', error)
    message.error('Failed to refresh blockchain data')
  } finally {
    isRefreshing.value = false
  }
}

// 初始化
onMounted(async () => {
  try {
    // 获取网络信息
    networkInfo.value = await getNetworkInfo()
    
    // 如果是链上NFT，获取作者份额信息
    if (props.nftInfo.onChain && props.nftInfo.tokenId) {
      await refreshBlockchainData()
    }
  } catch (error) {
    console.error('Failed to initialize blockchain info:', error)
  }
})
</script>

<style scoped>
.blockchain-info {
  margin-top: 24px;
}

.info-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.info-grid {
  display: grid;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #30363d;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #8b949e;
  min-width: 120px;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.token-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #58a6ff;
  font-size: 1.1rem;
}

.address {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #c9d1d9;
  font-size: 0.9rem;
}

.block-number {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #58a6ff;
}

.gas-used {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #f85149;
}

.author-shares {
  margin-top: 20px;
}

.shares-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-address {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #c9d1d9;
}

.share-percentage {
  font-weight: 600;
  color: #58a6ff;
}

.quick-links {
  margin-top: 20px;
}

.offline-notice {
  margin-top: 20px;
}
</style>
