#!/usr/bin/env node

/**
 * 测试合约加载功能
 */

const ContractService = require('./contracts');

async function testContracts() {
  console.log('🧪 测试合约加载...');
  
  const contractService = new ContractService();
  
  try {
    const success = await contractService.init();
    
    if (success) {
      console.log('✅ 合约服务初始化成功');
      console.log(`📊 已加载合约数量: ${Object.keys(contractService.contracts).length}`);
      console.log('📋 已加载的合约:', Object.keys(contractService.contracts));
    } else {
      console.log('⚠️  合约服务初始化失败或跳过');
    }
    
  } catch (error) {
    console.error('❌ 合约测试失败:', error.message);
  }
}

testContracts();
