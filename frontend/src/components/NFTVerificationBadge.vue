<template>
  <div class="nft-verification-badge">
    <!-- 验证状态指示器 -->
    <n-tooltip :show-arrow="false">
      <template #trigger>
        <n-tag 
          :type="getTagType()" 
          size="small"
          :bordered="false"
          class="verification-tag"
          @click="showVerificationDetails"
        >
          <template #icon>
            <n-icon>
              <div>{{ getStatusIcon() }}</div>
            </n-icon>
          </template>
          {{ getStatusText() }}
        </n-tag>
      </template>
      <div class="verification-tooltip">
        <div><strong>区块链验证状态</strong></div>
        <div>{{ getTooltipText() }}</div>
        <div class="click-hint">点击查看详情</div>
      </div>
    </n-tooltip>

    <!-- 验证详情模态框 -->
    <n-modal v-model:show="showModal">
      <n-card
        style="width: 600px"
        title="🔍 NFT区块链验证详情"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div v-if="verificationData">
          <!-- 验证结果概览 -->
          <n-alert
            :type="verificationData.is_consistent ? 'success' : 'error'"
            :show-icon="true"
            class="verification-result"
          >
            <template #header>
              {{ verificationData.is_consistent ? '✅ 验证通过' : '❌ 验证失败' }}
            </template>
            {{ verificationData.is_consistent 
              ? 'NFT数据与区块链记录完全一致' 
              : '发现数据不一致，请检查详细信息' }}
          </n-alert>

          <!-- 基本信息 -->
          <n-descriptions :column="2" bordered class="mt-4">
            <n-descriptions-item label="Token ID">
              <n-text code>{{ verificationData.token_id }}</n-text>
            </n-descriptions-item>
            <n-descriptions-item label="验证时间">
              {{ formatDate(verificationData.verification_time) }}
            </n-descriptions-item>
          </n-descriptions>

          <!-- 问题列表 -->
          <div v-if="verificationData.issues && verificationData.issues.length > 0" class="mt-4">
            <h4>⚠️ 发现的问题：</h4>
            <n-list bordered>
              <n-list-item v-for="issue in verificationData.issues" :key="issue">
                <n-text type="error">{{ issue }}</n-text>
              </n-list-item>
            </n-list>
          </div>

          <!-- 数据对比 -->
          <div class="mt-4">
            <n-tabs type="line" animated>
              <n-tab-pane name="comparison" tab="📊 数据对比">
                <n-grid :cols="2" :x-gap="16">
                  <n-grid-item>
                    <n-card title="💾 业务数据库" size="small">
                      <div v-if="verificationData.nodejs_data">
                        <n-descriptions :column="1" size="small">
                          <n-descriptions-item label="Token ID">
                            {{ verificationData.nodejs_data.token_id }}
                          </n-descriptions-item>
                          <n-descriptions-item label="合约地址">
                            {{ verificationData.nodejs_data.contract_address }}
                          </n-descriptions-item>
                          <n-descriptions-item label="创建时间">
                            {{ formatDate(verificationData.nodejs_data.created_at) }}
                          </n-descriptions-item>
                        </n-descriptions>
                      </div>
                      <n-empty v-else description="无业务数据" />
                    </n-card>
                  </n-grid-item>
                  <n-grid-item>
                    <n-card title="⛓️ 区块链数据" size="small">
                      <div v-if="verificationData.blockchain_data">
                        <n-descriptions :column="1" size="small">
                          <n-descriptions-item label="Token ID">
                            {{ verificationData.blockchain_data.token_id }}
                          </n-descriptions-item>
                          <n-descriptions-item label="区块号">
                            {{ verificationData.blockchain_data.block_number }}
                          </n-descriptions-item>
                          <n-descriptions-item label="创建时间">
                            {{ formatDate(verificationData.blockchain_data.created_at) }}
                          </n-descriptions-item>
                        </n-descriptions>
                      </div>
                      <n-empty v-else description="无区块链数据" />
                    </n-card>
                  </n-grid-item>
                </n-grid>
              </n-tab-pane>
              <n-tab-pane name="raw-data" tab="📄 原始数据">
                <n-tabs type="segment">
                  <n-tab-pane name="nodejs" tab="业务数据">
                    <pre class="json-data">{{ JSON.stringify(verificationData.nodejs_data, null, 2) }}</pre>
                  </n-tab-pane>
                  <n-tab-pane name="blockchain" tab="区块链数据">
                    <pre class="json-data">{{ JSON.stringify(verificationData.blockchain_data, null, 2) }}</pre>
                  </n-tab-pane>
                </n-tabs>
              </n-tab-pane>
            </n-tabs>
          </div>
        </div>

        <div v-else-if="loading" class="loading-container">
          <n-spin size="large">
            <template #description>正在验证NFT数据...</template>
          </n-spin>
        </div>

        <div v-else-if="error" class="error-container">
          <n-result status="error" title="验证失败" :description="error">
            <template #footer>
              <n-button @click="retryVerification">重试验证</n-button>
            </template>
          </n-result>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showModal = false">关闭</n-button>
            <n-button type="primary" @click="retryVerification" :loading="loading">
              重新验证
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  NTooltip, NTag, NIcon, NModal, NCard, NAlert, NDescriptions, 
  NDescriptionsItem, NText, NList, NListItem, NTabs, NTabPane,
  NGrid, NGridItem, NEmpty, NSpin, NResult, NButton, NSpace
} from 'naive-ui'
import { useHybridData } from '@/composables/useHybridData'

const props = defineProps({
  tokenId: {
    type: String,
    required: true
  },
  // 可选的初始验证状态
  initialStatus: {
    type: String,
    default: 'unknown' // unknown, verified, unverified, error
  }
})

const { verifyNFTIntegrity, loading, error } = useHybridData()

const showModal = ref(false)
const verificationData = ref(null)
const currentStatus = ref(props.initialStatus)

// 获取标签类型
const getTagType = () => {
  switch (currentStatus.value) {
    case 'verified': return 'success'
    case 'unverified': return 'error'
    case 'error': return 'warning'
    default: return 'info'
  }
}

// 获取状态图标
const getStatusIcon = () => {
  switch (currentStatus.value) {
    case 'verified': return '✅'
    case 'unverified': return '❌'
    case 'error': return '⚠️'
    default: return '🔍'
  }
}

// 获取状态文本
const getStatusText = () => {
  switch (currentStatus.value) {
    case 'verified': return '已验证'
    case 'unverified': return '未验证'
    case 'error': return '验证失败'
    default: return '待验证'
  }
}

// 获取提示文本
const getTooltipText = () => {
  switch (currentStatus.value) {
    case 'verified': return 'NFT数据已通过区块链验证'
    case 'unverified': return 'NFT数据与区块链记录不一致'
    case 'error': return '验证过程中出现错误'
    default: return '点击进行区块链数据验证'
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 显示验证详情
const showVerificationDetails = async () => {
  showModal.value = true
  await performVerification()
}

// 执行验证
const performVerification = async () => {
  verificationData.value = null
  const result = await verifyNFTIntegrity(props.tokenId)
  
  if (result) {
    verificationData.value = result
    // 更新状态
    if (result.is_consistent) {
      currentStatus.value = 'verified'
    } else {
      currentStatus.value = 'unverified'
    }
  } else {
    currentStatus.value = 'error'
  }
}

// 重试验证
const retryVerification = async () => {
  await performVerification()
}
</script>

<style scoped>
.nft-verification-badge {
  display: inline-block;
}

.verification-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.verification-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.verification-tooltip {
  text-align: center;
}

.click-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.verification-result {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.json-data {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
