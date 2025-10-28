<template>
  <div class="wallet-test-page">
    <h1>钱包连接测试</h1>
    
    <div class="test-section">
      <h2>检测结果</h2>
      <ul>
        <li>MetaMask 安装状态: {{ metamaskInstalled ? '✅ 已安装' : '❌ 未安装' }}</li>
        <li>连接状态: {{ isConnected ? '✅ 已连接' : '❌ 未连接' }}</li>
        <li>账户地址: {{ account || '无' }}</li>
        <li>连接错误: {{ connectionError || '无' }}</li>
      </ul>
    </div>

    <div class="test-actions">
      <n-button 
        @click="testConnect" 
        type="primary" 
        :loading="connecting"
        :disabled="!metamaskInstalled"
      >
        测试连接钱包
      </n-button>
      
      <n-button 
        @click="testDisconnect" 
        secondary
        :disabled="!isConnected"
      >
        断开连接
      </n-button>
      
      <n-button @click="checkMetaMask" secondary>
        重新检测 MetaMask
      </n-button>
    </div>

    <div class="debug-info">
      <h3>调试信息</h3>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { NButton } from 'naive-ui'
import { useWeb3 } from '../composables/useWeb3'

const { connectWallet, disconnectWallet, account, isConnected, connectionError } = useWeb3()

const metamaskInstalled = ref(false)
const connecting = ref(false)
const debugInfo = ref('')

const checkMetaMask = () => {
  metamaskInstalled.value = typeof window.ethereum !== 'undefined'
  debugInfo.value = `
检测时间: ${new Date().toLocaleString()}
window.ethereum: ${typeof window.ethereum}
ethereum.isMetaMask: ${window.ethereum?.isMetaMask}
ethereum.selectedAddress: ${window.ethereum?.selectedAddress}
  `
}

const testConnect = async () => {
  connecting.value = true
  debugInfo.value += '\n开始连接...'
  
  try {
    const result = await connectWallet()
    debugInfo.value += `\n连接结果: ${JSON.stringify(result, null, 2)}`
  } catch (error) {
    debugInfo.value += `\n连接错误: ${error.message}`
  } finally {
    connecting.value = false
  }
}

const testDisconnect = async () => {
  await disconnectWallet()
  debugInfo.value += '\n已断开连接'
}

onMounted(() => {
  checkMetaMask()
})
</script>

<style scoped>
.wallet-test-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #c9d1d9;
}

.test-section {
  background: #161b22;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.test-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.debug-info {
  background: #0d1117;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.debug-info pre {
  color: #7d8590;
  font-size: 12px;
  white-space: pre-wrap;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 5px 0;
  border-bottom: 1px solid #30363d;
}
</style>
