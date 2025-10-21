// 混合数据查询组合式API
import { ref, reactive } from 'vue'
import axios from 'axios'

const GO_SERVICE_BASE_URL = 'http://localhost:8088'
const NODE_SERVICE_BASE_URL = 'http://localhost:3000'

export function useHybridData() {
  const loading = ref(false)
  const error = ref(null)

  // 智能数据获取：优先Node.js，失败时使用Go服务
  const getSmartNFTData = async (tokenId) => {
    try {
      loading.value = true
      
      // 首先尝试从Node.js获取数据（快速响应）
      const nodeResponse = await axios.get(`${NODE_SERVICE_BASE_URL}/api/nfts/${tokenId}`)
      
      // 同时从Go服务获取验证数据
      const verificationResponse = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/verify/${tokenId}`)
      
      return {
        data: nodeResponse.data,
        verification: verificationResponse.data,
        source: 'hybrid'
      }
    } catch (nodeError) {
      try {
        // Node.js失败时，尝试从Go服务获取
        const goResponse = await axios.get(`${GO_SERVICE_BASE_URL}/api/research/${tokenId}`)
        return {
          data: goResponse.data,
          verification: null,
          source: 'go-service'
        }
      } catch (goError) {
        error.value = `Both services failed: Node.js (${nodeError.message}), Go (${goError.message})`
        return null
      }
    } finally {
      loading.value = false
    }
  }

  // 获取混合NFT列表（包含验证状态）
  const getHybridNFTList = async (limit = 10, offset = 0) => {
    try {
      loading.value = true
      const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/nfts`, {
        params: { limit, offset }
      })
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取平台统计信息（混合数据源）
  const getHybridStats = async () => {
    try {
      loading.value = true
      const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/stats`)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // 对比数据源一致性
  const compareDataSources = async () => {
    try {
      loading.value = true
      const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/compare`)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // 验证特定NFT的数据完整性
  const verifyNFTIntegrity = async (tokenId) => {
    try {
      loading.value = true
      const response = await axios.get(`${GO_SERVICE_BASE_URL}/api/hybrid/verify/${tokenId}`)
      return response.data
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // 检查Go服务可用性
  const checkGoServiceHealth = async () => {
    try {
      const response = await axios.get(`${GO_SERVICE_BASE_URL}/health`, { timeout: 3000 })
      return response.data
    } catch (err) {
      return null
    }
  }

  return {
    loading,
    error,
    getSmartNFTData,
    getHybridNFTList,
    getHybridStats,
    compareDataSources,
    verifyNFTIntegrity,
    checkGoServiceHealth
  }
}
