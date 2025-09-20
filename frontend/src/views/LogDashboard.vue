<template>
  <div class="log-dashboard">
    <div class="dashboard-header">
      <n-h1>系统日志记录台</n-h1>
      <n-p>实时监控系统活动和事件记录</n-p>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <n-card class="stat-card">
        <n-statistic label="今日活动" :value="stats.todayCount" />
        <template #footer>
          <n-icon :component="TrendingUpOutline" size="16" />
          相比昨日 +{{ stats.todayGrowth }}%
        </template>
      </n-card>

      <n-card class="stat-card">
        <n-statistic label="错误事件" :value="stats.errorCount">
          <template #suffix>
            <n-tag type="error" size="small">{{ stats.errorPercentage }}%</n-tag>
          </template>
        </n-statistic>
      </n-card>

      <n-card class="stat-card">
        <n-statistic label="活跃用户" :value="stats.activeUsers" />
      </n-card>

      <n-card class="stat-card">
        <n-statistic label="总记录数" :value="stats.totalLogs" />
      </n-card>
    </div>

    <!-- Filter Controls -->
    <n-card class="filter-card">
      <div class="filter-row">
        <n-space>
          <n-select
            v-model:value="filters.severity"
            placeholder="严重级别"
            clearable
            style="width: 120px"
            :options="severityOptions"
          />

          <n-select
            v-model:value="filters.actionType"
            placeholder="操作类型"
            clearable
            style="width: 120px"
            :options="actionTypeOptions"
          />

          <n-select
            v-model:value="filters.resourceType"
            placeholder="资源类型"
            clearable
            style="width: 120px"
            :options="resourceTypeOptions"
          />

          <n-date-picker
            v-model:value="filters.dateRange"
            type="datetimerange"
            clearable
            style="width: 300px"
          />

          <n-input
            v-model:value="filters.search"
            placeholder="搜索描述、用户名..."
            clearable
            style="width: 200px"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>

          <n-button @click="applyFilters" type="primary">
            <template #icon>
              <n-icon :component="FilterOutline" />
            </template>
            应用过滤
          </n-button>

          <n-button @click="clearFilters">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            清除
          </n-button>
        </n-space>
      </div>

      <div class="filter-row">
        <n-space>
          <n-switch v-model:value="autoRefresh">
            <template #checked>自动刷新</template>
            <template #unchecked>手动刷新</template>
          </n-switch>

          <n-button @click="exportLogs" size="small">
            <template #icon>
              <n-icon :component="DownloadOutline" />
            </template>
            导出CSV
          </n-button>

          <n-popconfirm @positive-click="cleanupOldLogs" positive-text="确认清理" negative-text="取消">
            <template #trigger>
              <n-button size="small" type="warning">
                <template #icon>
                  <n-icon :component="TrashOutline" />
                </template>
                清理旧记录
              </n-button>
            </template>
            清理30天前的日志记录？
          </n-popconfirm>
        </n-space>
      </div>
    </n-card>

    <!-- Charts Section -->
    <div class="charts-grid">
      <n-card title="活动趋势" class="chart-card">
        <div id="activity-chart" style="height: 300px;"></div>
      </n-card>

      <n-card title="操作分布" class="chart-card">
        <div id="action-chart" style="height: 300px;"></div>
      </n-card>
    </div>

    <!-- Logs Table -->
    <n-card class="logs-table-card">
      <template #header>
        <div class="table-header">
          <span>活动记录</span>
          <n-space>
            <n-tag>共 {{ pagination.total }} 条记录</n-tag>
            <n-button @click="refreshLogs" size="small">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
              刷新
            </n-button>
          </n-space>
        </div>
      </template>

      <n-data-table
        ref="logsTable"
        :columns="tableColumns"
        :data="logs"
        :loading="loading"
        :pagination="paginationProps"
        :row-key="(row) => row.id"
        size="small"
        striped
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- Critical Logs Sidebar -->
    <n-drawer v-model:show="showCriticalLogs" width="400" placement="right">
      <n-drawer-content title="关键事件">
        <div class="critical-logs">
          <div v-for="log in criticalLogs" :key="log.id" class="critical-log-item">
            <div class="log-header">
              <n-tag :type="getSeverityType(log.severity)" size="small">
                {{ getSeverityLabel(log.severity) }}
              </n-tag>
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            </div>
            <div class="log-description">{{ log.action_description }}</div>
            <div class="log-meta">
              <n-icon :component="PersonOutline" size="14" />
              {{ log.username || '系统' }}
              <span class="log-resource">{{ log.resource_type }}</span>
            </div>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <!-- Floating Action Button -->
    <n-float-button
      :right="24"
      :bottom="24"
      type="error"
      @click="showCriticalLogs = true"
    >
      <template #icon>
        <n-badge :value="criticalCount" :max="99">
          <n-icon :component="WarningOutline" size="20" />
        </n-badge>
      </template>
    </n-float-button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick, h, watch } from 'vue'
import {
  NCard, NH1, NP, NStatistic, NTag, NSelect, NDatePicker, NInput, NButton,
  NSpace, NSwitch, NPopconfirm, NDataTable, NDrawer, NDrawerContent,
  NBadge, NFloatButton, NIcon, useMessage
} from 'naive-ui'
import {
  TrendingUpOutline, SearchOutline, FilterOutline, RefreshOutline,
  DownloadOutline, TrashOutline, PersonOutline, WarningOutline
} from '@vicons/ionicons5'
import * as echarts from 'echarts'

const message = useMessage()

// Data
const logs = ref([])
const criticalLogs = ref([])
const loading = ref(false)
const autoRefresh = ref(false)
const showCriticalLogs = ref(false)
let refreshInterval = null
let activityChart = null
let actionChart = null

// Statistics
const stats = reactive({
  todayCount: 0,
  todayGrowth: 0,
  errorCount: 0,
  errorPercentage: 0,
  activeUsers: 0,
  totalLogs: 0
})

// Filters
const filters = reactive({
  severity: null,
  actionType: null,
  resourceType: null,
  dateRange: null,
  search: null
})

// Pagination
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// Options
const severityOptions = [
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' }
]

const actionTypeOptions = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '登录', value: 'login' },
  { label: '上传', value: 'upload' },
  { label: '铸造', value: 'mint' },
  { label: '提交', value: 'submit' }
]

const resourceTypeOptions = [
  { label: '用户', value: 'user' },
  { label: '项目', value: 'project' },
  { label: '数据集', value: 'dataset' },
  { label: 'NFT', value: 'nft' },
  { label: '评审', value: 'review' },
  { label: '出版物', value: 'publication' }
]

// Table columns
const tableColumns = [
  {
    title: '时间',
    key: 'timestamp',
    width: 160,
    render: (row) => formatDateTime(row.timestamp)
  },
  {
    title: '级别',
    key: 'severity',
    width: 80,
    render: (row) => h(NTag, {
      type: getSeverityType(row.severity),
      size: 'small'
    }, { default: () => getSeverityLabel(row.severity) })
  },
  {
    title: '用户',
    key: 'username',
    width: 120,
    render: (row) => row.username || '系统'
  },
  {
    title: '操作',
    key: 'action_type',
    width: 80
  },
  {
    title: '资源',
    key: 'resource_type',
    width: 80
  },
  {
    title: '描述',
    key: 'action_description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'IP地址',
    key: 'ip_address',
    width: 120,
    render: (row) => row.ip_address || '-'
  }
]

// Computed
const paginationProps = computed(() => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  prefix: ({ itemCount }) => `共 ${itemCount} 条`
}))

const criticalCount = computed(() => {
  return criticalLogs.value.filter(log => log.severity === 'error').length
})

// Methods
const loadLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.pageSize
    })

    if (filters.severity) params.append('severity', filters.severity)
    if (filters.actionType) params.append('actionType', filters.actionType)
    if (filters.resourceType) params.append('resourceType', filters.resourceType)
    if (filters.search) params.append('search', filters.search)
    if (filters.dateRange) {
      params.append('startDate', new Date(filters.dateRange[0]).toISOString())
      params.append('endDate', new Date(filters.dateRange[1]).toISOString())
    }

    const response = await fetch(`http://localhost:3000/api/logs?${params}`)
    const data = await response.json()

    logs.value = data.logs
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages

  } catch (error) {
    console.error('Failed to load logs:', error)
    message.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/logs/stats?timeRange=24h')
    const data = await response.json()

    // Process statistics
    const severityData = data.severityStats.reduce((acc, item) => {
      acc[item.severity] = item.count
      return acc
    }, {})

    stats.todayCount = Object.values(severityData).reduce((sum, count) => sum + count, 0)
    stats.errorCount = severityData.error || 0
    stats.errorPercentage = stats.todayCount > 0
      ? Math.round((stats.errorCount / stats.todayCount) * 100)
      : 0
    stats.activeUsers = data.activeUsers.length
    stats.totalLogs = stats.todayCount // This could be improved with a separate total count API

    // Update charts
    updateCharts(data)

  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadCriticalLogs = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/logs/critical?limit=10')
    criticalLogs.value = await response.json()
  } catch (error) {
    console.error('Failed to load critical logs:', error)
  }
}

const updateCharts = (data) => {
  nextTick(() => {
    // Activity trend chart
    if (!activityChart) {
      activityChart = echarts.init(document.getElementById('activity-chart'))
    }

    const hourlyData = data.hourlyActivity || []
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
    const counts = hours.map(hour => {
      const found = hourlyData.find(item => item.hour === hour)
      return found ? found.count : 0
    })

    activityChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: hours.map(h => `${h}:00`)
      },
      yAxis: { type: 'value' },
      series: [{
        name: '活动数量',
        type: 'line',
        data: counts,
        smooth: true,
        areaStyle: {}
      }]
    })

    // Action distribution chart
    if (!actionChart) {
      actionChart = echarts.init(document.getElementById('action-chart'))
    }

    const actionData = data.actionStats || []
    actionChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: actionData.map(item => ({
          name: item.action_type,
          value: item.count
        }))
      }]
    })
  })
}

const applyFilters = () => {
  pagination.page = 1
  loadLogs()
}

const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = null
  })
  pagination.page = 1
  loadLogs()
}

const refreshLogs = () => {
  loadLogs()
  loadStats()
  loadCriticalLogs()
}

const exportLogs = async () => {
  try {
    const params = new URLSearchParams({ format: 'csv' })
    if (filters.dateRange) {
      params.append('startDate', new Date(filters.dateRange[0]).toISOString())
      params.append('endDate', new Date(filters.dateRange[1]).toISOString())
    }

    const response = await fetch(`http://localhost:3000/api/logs/export?${params}`)
    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    message.success('日志导出成功')
  } catch (error) {
    console.error('Failed to export logs:', error)
    message.error('导出失败')
  }
}

const cleanupOldLogs = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/logs/cleanup?olderThan=30d', {
      method: 'DELETE'
    })
    const data = await response.json()

    message.success(`成功清理 ${data.deletedRows} 条旧记录`)
    refreshLogs()
  } catch (error) {
    console.error('Failed to cleanup logs:', error)
    message.error('清理失败')
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadLogs()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadLogs()
}

// Utility functions
const getSeverityType = (severity) => {
  const types = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error'
  }
  return types[severity] || 'default'
}

const getSeverityLabel = (severity) => {
  const labels = {
    info: '信息',
    success: '成功',
    warning: '警告',
    error: '错误'
  }
  return labels[severity] || severity
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

// Auto-refresh functionality
const startAutoRefresh = () => {
  if (refreshInterval) return
  refreshInterval = setInterval(() => {
    refreshLogs()
  }, 30000) // Refresh every 30 seconds
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Watchers
watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// Lifecycle
onMounted(() => {
  loadLogs()
  loadStats()
  loadCriticalLogs()
})

onUnmounted(() => {
  stopAutoRefresh()
  if (activityChart) {
    activityChart.dispose()
  }
  if (actionChart) {
    actionChart.dispose()
  }
})
</script>

<style scoped>
.log-dashboard {
  padding: 24px;
  background: #0d1117;
  min-height: 100vh;
  color: #c9d1d9;
}

.dashboard-header {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.filter-card {
  margin-bottom: 24px;
  background: #161b22;
  border: 1px solid #30363d;
}

.filter-row {
  margin-bottom: 12px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.logs-table-card {
  background: #161b22;
  border: 1px solid #30363d;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.critical-logs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.critical-log-item {
  padding: 12px;
  background: #21262d;
  border-radius: 6px;
  border-left: 3px solid #f85149;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: #8b949e;
}

.log-description {
  margin-bottom: 8px;
  font-size: 14px;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8b949e;
}

.log-resource {
  background: #21262d;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>