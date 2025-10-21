<template>
  <div class="data-verification">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">数据验证中心</h1>
          <p class="page-description">
            验证平台数据的区块链一致性和完整性，展示混合查询架构的完整功能
          </p>
        </div>
        <div class="header-actions">
          <n-button type="primary" @click="refreshAll" :loading="loading">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            刷新所有数据
          </n-button>
        </div>
      </div>
    </div>

    <!-- Service Status Alert -->
    <n-alert
      :type="goServiceHealthy ? 'success' : 'error'"
      :title="goServiceHealthy ? 'Go验证服务运行正常' : 'Go验证服务不可用'"
      class="service-alert"
      :show-icon="true"
    >
      <template v-if="goServiceHealthy">
        混合查询功能已就绪，可以进行数据验证和跨服务查询
      </template>
      <template v-else>
        请确保Go服务在8088端口运行：cd services/chain-api && PORT=8088 ./desci-backend
      </template>
      <template #action>
        <n-button size="small" @click="checkGoService" :loading="loading">
          重新检测
        </n-button>
      </template>
    </n-alert>

    <!-- Stats Cards -->
    <n-grid x-gap="24" y-gap="24" :cols="4" style="margin-bottom: 24px;">
      <n-gi>
        <n-card title="Node.js 项目" class="stats-card projects-card">
          <template #header-extra>
            <n-icon :component="FolderOutline" class="card-icon projects-icon" />
          </template>
          <n-statistic label="总项目数" :value="stats?.nodejs_stats?.total_projects || 0" />
          <template #footer>
            <n-text depth="3" style="font-size: 12px;">
              业务数据库统计
            </n-text>
          </template>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Node.js NFTs" class="stats-card nfts-card">
          <template #header-extra>
            <n-icon :component="DocumentTextOutline" class="card-icon nfts-icon" />
          </template>
          <n-statistic label="NFT总数" :value="stats?.nodejs_stats?.total_nfts || 0" />
          <template #footer>
            <n-text depth="3" style="font-size: 12px;">
              业务数据库统计
            </n-text>
          </template>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="区块链记录" class="stats-card blockchain-card">
          <template #header-extra>
            <n-icon :component="LinkOutline" class="card-icon blockchain-icon" />
          </template>
          <n-statistic label="研究记录" :value="stats?.blockchain_stats?.total_research_records || 0" />
          <template #footer>
            <n-text depth="3" style="font-size: 12px;">
              区块链数据统计
            </n-text>
          </template>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="事件日志" class="stats-card events-card">
          <template #header-extra>
            <n-icon :component="BarChartOutline" class="card-icon events-icon" />
          </template>
          <n-statistic label="事件总数" :value="stats?.blockchain_stats?.total_event_logs || 0" />
          <template #footer>
            <n-text depth="3" style="font-size: 12px;">
              区块链事件统计
            </n-text>
          </template>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- NFT Verification Section -->
    <n-card title="NFT数据验证" class="verification-card" style="margin-bottom: 24px;">
      <template #header-extra>
        <n-button @click="loadStats" size="small" :loading="loading">
          <template #icon>
            <n-icon :component="StatsChartOutline" />
          </template>
          更新统计
        </n-button>
      </template>
      
      <div class="verification-content">
        <div class="input-section">
          <n-input
            v-model:value="tokenId"
            placeholder="输入Token ID进行验证 (如: demo-token-123)"
            clearable
            class="token-input"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>
          <n-button type="primary" @click="verifyToken" :loading="loading">
            <template #icon>
              <n-icon :component="ShieldCheckmarkOutline" />
            </template>
            验证NFT
          </n-button>
        </div>

        <!-- Verification Result -->
        <div v-if="verification" class="verification-result">
          <n-alert
            :type="verification.is_consistent ? 'success' : 'error'"
            :title="verification.is_consistent ? '验证通过' : '验证失败'"
            :show-icon="true"
          >
            <template v-if="verification.is_consistent">
              NFT数据与区块链记录完全一致，数据可信度高
            </template>
            <template v-else>
              发现数据不一致，请检查详细信息
            </template>
          </n-alert>

          <div v-if="verification.issues?.length" class="issues-section">
            <h4>发现的问题：</h4>
            <n-list bordered>
              <n-list-item v-for="issue in verification.issues" :key="issue">
                <n-text type="error">{{ issue }}</n-text>
              </n-list-item>
            </n-list>
          </div>

          <!-- Data Comparison -->
          <n-grid x-gap="16" :cols="2" class="data-comparison">
            <n-gi>
              <n-card title="业务数据库" size="small">
                <template #header-extra>
                  <n-icon :component="ServerOutline" class="card-icon" />
                </template>
                <n-descriptions :column="1" size="small">
                  <n-descriptions-item label="Token ID">
                    {{ verification.nodejs_data?.token_id }}
                  </n-descriptions-item>
                  <n-descriptions-item label="合约地址">
                    {{ verification.nodejs_data?.contract_address }}
                  </n-descriptions-item>
                  <n-descriptions-item label="资产类型">
                    {{ verification.nodejs_data?.asset_type }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card title="区块链数据" size="small">
                <template #header-extra>
                  <n-icon :component="LinkOutline" class="card-icon" />
                </template>
                <n-descriptions :column="1" size="small">
                  <n-descriptions-item label="Token ID">
                    {{ verification.blockchain_data?.token_id }}
                  </n-descriptions-item>
                  <n-descriptions-item label="区块号">
                    {{ verification.blockchain_data?.block_number }}
                  </n-descriptions-item>
                  <n-descriptions-item label="标题">
                    {{ verification.blockchain_data?.title }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-gi>
          </n-grid>
        </div>
      </div>
    </n-card>

    <!-- NFT List Section -->
    <n-card title="混合NFT列表" class="nft-list-card">
      <template #header-extra>
        <n-button @click="loadNFTList" size="small" :loading="loading">
          <template #icon>
            <n-icon :component="RefreshOutline" />
          </template>
          刷新列表
        </n-button>
      </template>

      <n-data-table
        :columns="nftColumns"
        :data="nftList"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :row-key="row => row.token_id"
      />
    </n-card>

    <!-- Error Display -->
    <n-alert
      v-if="error"
      type="error"
      title="操作失败"
      :show-icon="true"
      style="margin-top: 16px;"
    >
      {{ error }}
    </n-alert>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { 
  NAlert, NButton, NCard, NGrid, NGi, NIcon, NStatistic, NText,
  NInput, NDataTable, NDescriptions, NDescriptionsItem, NList, NListItem
} from 'naive-ui'
import { 
  SearchOutline, RefreshOutline, ShieldCheckmarkOutline, BarChartOutline,
  FolderOutline, DocumentTextOutline, LinkOutline, CheckmarkCircleOutline,
  CloseCircleOutline, WarningOutline, ServerOutline, StatsChartOutline
} from '@vicons/ionicons5'
import axios from 'axios'

const GO_SERVICE_BASE_URL = 'http://localhost:8088'

// 响应式数据
const loading = ref(false)
const goServiceHealthy = ref(false)
const goStatus = ref(null)
const stats = ref(null)
const verification = ref(null)
const nftList = ref([])
const tokenId = ref('demo-token-123')
const error = ref('')

// NFT表格列定义
const nftColumns = [
  {
    title: 'Token ID',
    key: 'token_id',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true }
  },
  {
    title: '作者',
    key: 'authors',
    render: (row) => row.authors?.join(', ') || '-'
  },
  {
    title: '区块号',
    key: 'block_number'
  },
  {
    title: '验证状态',
    key: 'is_verified',
    render: (row) => h('div', 
      { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
      [
        h(NIcon, {
          component: row.is_verified ? CheckmarkCircleOutline : CloseCircleOutline,
          color: row.is_verified ? '#18a058' : '#d03050'
        }),
        h('span', 
          { style: { color: row.is_verified ? '#18a058' : '#d03050' } },
          row.is_verified ? '已验证' : '未验证'
        )
      ]
    )
  },
  {
    title: '创建时间',
    key: 'created_at',
    render: (row) => new Date(row.created_at).toLocaleString('zh-CN')
  }
]

// 检查Go服务状态
const checkGoService = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await axios.get(`${GO_SERVICE_BASE_URL}/health`)
    goStatus.value = response.data
    goServiceHealthy.value = true
  } catch (err) {
    error.value = `Go服务连接失败: ${err.message}`
    goServiceHealthy.value = false
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const loadStats = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/stats`)
    stats.value = response.data
  } catch (err) {
    error.value = `获取统计失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

// 验证NFT
const verifyToken = async () => {
  if (!tokenId.value) {
    error.value = '请输入Token ID'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/verify/${tokenId.value}`)
    verification.value = response.data
  } catch (err) {
    error.value = `验证失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

// 获取NFT列表
const loadNFTList = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/nfts`)
    nftList.value = response.data.nfts || []
  } catch (err) {
    error.value = `获取NFT列表失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

// 刷新所有数据
const refreshAll = async () => {
  await checkGoService()
  if (goServiceHealthy.value) {
    await Promise.all([
      loadStats(),
      loadNFTList()
    ])
  }
}

// 页面初始化
onMounted(async () => {
  await refreshAll()
})
</script>

<style scoped>
.data-verification {
  padding: 0;
}

/* Page Header */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--n-text-color-base);
  line-height: 1.2;
}

.page-description {
  font-size: 16px;
  color: var(--n-text-color-2);
  margin: 0;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Service Alert */
.service-alert {
  margin-bottom: 24px;
}

/* Stats Cards */
.stats-card {
  height: 100%;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-icon {
  font-size: 20px;
  opacity: 0.8;
}

.projects-card .card-icon {
  color: #18a058;
}

.nfts-card .card-icon {
  color: #2080f0;
}

.blockchain-card .card-icon {
  color: #f0a020;
}

.events-card .card-icon {
  color: #d03050;
}

/* Verification Section */
.verification-card {
  margin-bottom: 24px;
}

.verification-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-section {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.token-input {
  flex: 1;
  max-width: 400px;
}

.verification-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issues-section {
  margin-top: 16px;
}

.issues-section h4 {
  margin: 0 0 12px 0;
  color: var(--n-text-color-base);
  font-size: 14px;
  font-weight: 600;
}

.data-comparison {
  margin-top: 16px;
}

/* NFT List */
.nft-list-card {
  margin-bottom: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    font-size: 24px;
  }

  .input-section {
    flex-direction: column;
    align-items: stretch;
  }

  .token-input {
    max-width: none;
  }
}

@media (max-width: 1200px) {
  :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}

/* Loading States */
.n-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

/* Custom Alert Styles */
:deep(.n-alert) {
  border-radius: 8px;
}

/* Custom Card Styles */
:deep(.n-card) {
  border-radius: 12px;
  border: 1px solid var(--n-border-color);
}

:deep(.n-card-header) {
  padding: 20px 24px 16px;
}

:deep(.n-card__content) {
  padding: 0 24px 20px;
}

/* Custom Button Styles */
:deep(.n-button) {
  border-radius: 8px;
  font-weight: 500;
}

/* Custom Input Styles */
:deep(.n-input) {
  border-radius: 8px;
}

/* Custom Table Styles */
:deep(.n-data-table) {
  border-radius: 8px;
}

:deep(.n-data-table-th) {
  background-color: var(--n-table-header-color);
  font-weight: 600;
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-border-color);
}
</style>
