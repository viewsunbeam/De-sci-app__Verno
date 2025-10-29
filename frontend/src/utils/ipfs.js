/**
 * IPFS工具函数
 * 处理IPFS URL转换和相关操作
 */

// IPFS网关配置
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
]

// 默认使用的网关
const DEFAULT_GATEWAY = IPFS_GATEWAYS[0]

/**
 * 将IPFS URL转换为HTTP网关URL
 * @param {string} ipfsUrl - IPFS URL (ipfs://QmXXX 或 QmXXX)
 * @param {string} gateway - 可选的网关URL
 * @returns {string|null} HTTP URL或null
 */
export function convertIPFSToHTTP(ipfsUrl, gateway = DEFAULT_GATEWAY) {
  if (!ipfsUrl) return null
  
  let hash = ipfsUrl
  
  // 处理 ipfs:// 协议
  if (ipfsUrl.startsWith('ipfs://')) {
    hash = ipfsUrl.replace('ipfs://', '')
  }
  
  // 验证是否是有效的IPFS哈希
  if (!isValidIPFSHash(hash)) {
    console.warn('Invalid IPFS hash:', hash)
    return null
  }
  
  return `${gateway}${hash}`
}

/**
 * 验证IPFS哈希是否有效
 * @param {string} hash - IPFS哈希
 * @returns {boolean} 是否有效
 */
export function isValidIPFSHash(hash) {
  if (!hash || typeof hash !== 'string') return false
  
  // CIDv0: 以Qm开头，长度46字符
  if (hash.startsWith('Qm') && hash.length === 46) {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }
  
  // CIDv1: 以b开头的base32编码
  if (hash.startsWith('b') && hash.length > 50) {
    return /^b[a-z2-7]{50,}$/.test(hash)
  }
  
  // 简化验证：至少10个字符，包含字母数字
  return hash.length >= 10 && /^[a-zA-Z0-9]+$/.test(hash)
}

/**
 * 获取图片URL，自动处理IPFS转换
 * @param {string} imagePath - 图片路径
 * @returns {string|null} 可访问的URL
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null

  // 转换IPFS URL
  if (imagePath.startsWith('ipfs://')) {
    return convertIPFSToHTTP(imagePath)
  }

  // HTTP URL直接返回
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // Data URL直接返回
  if (imagePath.startsWith('data:')) {
    return imagePath
  }

  // 本地上传路径
  if (imagePath.startsWith('/uploads/')) {
    return `http://localhost:3000${imagePath}`
  }

  // 可能是裸IPFS哈希
  if (isValidIPFSHash(imagePath)) {
    return convertIPFSToHTTP(`ipfs://${imagePath}`)
  }

  return imagePath
}

/**
 * 尝试多个IPFS网关加载图片
 * @param {string} ipfsUrl - IPFS URL
 * @returns {Promise<string>} 成功加载的网关URL
 */
export async function loadImageWithFallback(ipfsUrl) {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl
  }

  const hash = ipfsUrl.replace('ipfs://', '')
  
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${hash}`
      
      // 创建一个Promise来测试图片是否能加载
      await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
      
      return url
    } catch (error) {
      console.warn(`Failed to load from gateway: ${gateway}`)
      continue
    }
  }
  
  // 如果所有网关都失败，返回默认网关URL
  return convertIPFSToHTTP(ipfsUrl)
}

/**
 * 打开IPFS内容在新标签页
 * @param {string} ipfsUrl - IPFS URL
 */
export function openIPFSContent(ipfsUrl) {
  const httpUrl = convertIPFSToHTTP(ipfsUrl)
  if (httpUrl) {
    window.open(httpUrl, '_blank')
  }
}

/**
 * 复制IPFS URL到剪贴板
 * @param {string} ipfsUrl - IPFS URL
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyIPFSUrl(ipfsUrl) {
  try {
    await navigator.clipboard.writeText(ipfsUrl)
    return true
  } catch (error) {
    console.error('Failed to copy IPFS URL:', error)
    return false
  }
}

/**
 * 生成模拟的IPFS CID
 * @param {string} prefix - 可选前缀
 * @returns {string} 模拟的IPFS URL
 */
export function generateMockIPFSCID(prefix = '') {
  const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let randomPart = ''
  for (let i = 0; i < 44; i++) {
    randomPart += base58chars.charAt(Math.floor(Math.random() * base58chars.length))
  }
  return `ipfs://Qm${randomPart}`
}

export default {
  convertIPFSToHTTP,
  isValidIPFSHash,
  getImageUrl,
  loadImageWithFallback,
  openIPFSContent,
  copyIPFSUrl,
  generateMockIPFSCID
}
