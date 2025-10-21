<template>
  <div class="data-verification">
    <div class="page-header">
      <h1>🔍 数据验证中心</h1>
      <p>验证平台数据的区块链一致性和完整性</p>
    </div>

    <!-- Go服务状态检查 -->
    <n-card class="service-status" :bordered="false">
      <template #header>
        <n-space align="center">
          <n-icon size="20" :color="goServiceHealthy ? '#18a058' : '#d03050'">
            <div>{{ goServiceHealthy ? '🟢' : '🔴' }}</div>
          </n-icon>
          <span>Go验证服务状态</span>
        </n-space>
      </template>
      
      <div v-if="goServiceHealthy">
        <n-tag type="success">服务正常运行</n-tag>
        <span class="ml-2">可以进行数据验证</span>
      </div>
      <div v-else>
        <n-tag type="error">服务不可用</n-tag>
        <span class="ml-2">请检查Go服务是否启动</span>
      </div>
    </n-card>

    <!-- 统计面板 -->
    <n-grid :cols="4" :x-gap="16" class="stats-grid">
      <n-grid-item>
        <n-card>
          <n-statistic label="Node.js项目" :value="stats?.nodejs_stats?.total_projects || 0" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="Node.js NFTs" :value="stats?.nodejs_stats?.total_nfts || 0" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="区块链记录" :value="stats?.blockchain_stats?.total_research_records || 0" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="事件日志" :value="stats?.blockchain_stats?.total_event_logs || 0" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- NFT验证列表 -->
    <n-card title="📋 NFT数据验证" class="nft-verification">
      <template #header-extra>
        <n-button @click="refreshData" :loading="loading">
          <template #icon>
            <n-icon><div>🔄</div></n-icon>
          </template>
          刷新数据
        </n-button>
      </template>

      <n-data-table
        :columns="nftColumns"
        :data="hybridNFTs"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :row-key="row => row.id"
      />
    </n-card>

    <!-- 数据源对比 -->
    <n-card title="⚖️ 数据源一致性对比" class="data-comparison">
      <n-data-table
        :columns="comparisonColumns"
        :data="comparisonResults"
        :loading="loading"
        :pagination="false"
      />
    </n-card>

    <!-- NFT详细验证对话框 -->
    <n-modal v-model:show="showVerificationModal">
      <n-card
        style="width: 600px"
        title="🔍 NFT详细验证"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div v-if="selectedVerification">
          <n-descriptions :column="2" bordered>
            <n-descriptions-item label="Token ID">
              {{ selectedVerification.token_id }}
            </n-descriptions-item>
            <n-descriptions-item label="验证状态">
              <n-tag :type="selectedVerification.is_consistent ? 'success' : 'error'">
                {{ selectedVerification.is_consistent ? '✅ 一致' : '❌ 不一致' }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="验证时间">
              {{ formatDate(selectedVerification.verification_time) }}
            </n-descriptions-item>
          </n-descriptions>

          <div v-if="selectedVerification.issues && selectedVerification.issues.length > 0" class="mt-4">
            <h4>⚠️ 发现的问题：</h4>
            <n-ul>
              <n-li v-for="issue in selectedVerification.issues" :key="issue">
                {{ issue }}
              </n-li>
            </n-ul>
          </div>

          <div class="mt-4">
            <n-tabs type="line">
              <n-tab-pane name="nodejs" tab="Node.js数据">
                <pre>{{ JSON.stringify(selectedVerification.nodejs_data, null, 2) }}</pre>
              </n-tab-pane>
              <n-tab-pane name="blockchain" tab="区块链数据">
                <pre>{{ JSON.stringify(selectedVerification.blockchain_data, null, 2) }}</pre>
              </n-tab-pane>
            </n-tabs>
          </div>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showVerificationModal = false">关闭</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { 
  NCard, NGrid, NGridItem, NStatistic, NDataTable, NButton, 
  NIcon, NSpace, NTag, NModal, NDescriptions, NDescriptionsItem,
  NUl, NLi, NTabs, NTabPane
} from 'naive-ui'
import { useHybridData } from '@/composables/useHybridData'

const {
  loading,
  error,
  getHybridNFTList,
  getHybridStats,
  compareDataSources,
  verifyNFTIntegrity,
  checkGoServiceHealth
} = useHybridData()

const goServiceHealthy = ref(false)
const stats = ref(null)
const hybridNFTs = ref([])
const comparisonResults = ref([])
const showVerificationModal = ref(false)
const selectedVerification = ref(null)

// NFT表格列定义
const nftColumns = [
  {
    title: 'Token ID',
    key: 'token_id',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: '资产类型',
    key: 'asset_type'
  },
  {
    title: '创建时间',
    key: 'created_at',
    render: (row) => formatDate(row.created_at)
  },
  {
    title: '区块链数据',
    key: 'has_blockchain_data',
    render: (row) => h(NTag, 
      { type: row.has_blockchain_data ? 'success' : 'warning' },
      { default: () => row.has_blockchain_data ? '✅ 有' : '⚠️ 无' }
    )
  },
  {
    title: '验证状态',
    key: 'is_verified',
    render: (row) => h(NTag,
      { type: row.is_verified ? 'success' : 'error' },
      { default: () => row.is_verified ? '✅ 已验证' : '❌ 未验证' }
    )
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) => h(NButton, 
      { 
        size: 'small',
        onClick: () => showNFTVerification(row.token_id)
      },
      { default: () => '详细验证' }
    )
  }
]

// 对比表格列定义
const comparisonColumns = [
  { title: 'Token ID', key: 'token_id' },
  { title: 'Node.js数据', key: 'has_nodejs_data', render: (row) => row.has_nodejs_data ? '✅' : '❌' },
  { title: '区块链数据', key: 'has_blockchain_data', render: (row) => row.has_blockchain_data ? '✅' : '❌' },
  { title: '数据匹配', key: 'data_match', render: (row) => row.data_match ? '✅' : '❌' },
  { title: '创建时间', key: 'created_at' }
]

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 显示NFT详细验证
const showNFTVerification = async (tokenId) => {
  const verification = await verifyNFTIntegrity(tokenId)
  if (verification) {
    selectedVerification.value = verification
    showVerificationModal.value = true
  }
}

// 刷新所有数据
const refreshData = async () => {
  await Promise.all([
    loadStats(),
    loadHybridNFTs(),
    loadComparison()
  ])
}

// 加载统计数据
const loadStats = async () => {
  const result = await getHybridStats()
  if (result) {
    stats.value = result
  }
}

// 加载混合NFT列表
const loadHybridNFTs = async () => {
  const result = await getHybridNFTList(20, 0)
  if (result) {
    hybridNFTs.value = result.nfts || []
  }
}

// 加载数据源对比
const loadComparison = async () => {
  const result = await compareDataSources()
  if (result) {
    comparisonResults.value = result.comparison_results || []
  }
}

// 检查Go服务健康状态
const checkServiceHealth = async () => {
  const health = await checkGoServiceHealth()
  goServiceHealthy.value = !!health
}

// 页面初始化
onMounted(async () => {
  await checkServiceHealth()
  if (goServiceHealthy.value) {
    await refreshData()
  }
})
</script>

<style scoped>
.data-verification {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.service-status {
  margin-bottom: 24px;
}

.stats-grid {
  margin-bottom: 24px;
}

.nft-verification {
  margin-bottom: 24px;
}

.data-comparison {
  margin-bottom: 24px;
}

.ml-2 {
  margin-left: 8px;
}

.mt-4 {
  margin-top: 16px;
}

pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
