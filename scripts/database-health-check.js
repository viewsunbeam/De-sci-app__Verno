#!/usr/bin/env node

/**
 * 数据库健康检查脚本
 * 检查并发访问和数据一致性
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../desci.db');

async function checkDatabaseHealth() {
  console.log('🔍 数据库健康检查...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 1. 检查数据库连接
    const result = db.prepare('SELECT 1 as test').get();
    console.log('✅ 数据库连接正常');
    
    // 2. 检查表完整性
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all();
    console.log(`📊 数据库表数量: ${tables.length}`);
    
    // 3. 检查关键表的记录数
    const stats = {};
    const keyTables = ['users', 'projects', 'nfts', 'datasets', 'research_data'];
    
    for (const table of keyTables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        stats[table] = count.count;
      } catch (error) {
        stats[table] = `Error: ${error.message}`;
      }
    }
    
    console.log('📈 表记录统计:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count}`);
    });
    
    // 4. 检查NFT与区块链记录的一致性
    const nftCount = db.prepare('SELECT COUNT(*) as count FROM nfts WHERE token_id IS NOT NULL').get().count;
    const researchCount = db.prepare('SELECT COUNT(*) as count FROM research_data').get().count;
    
    console.log('\n🔗 数据一致性检查:');
    console.log(`  - NFT记录: ${nftCount}`);
    console.log(`  - 区块链记录: ${researchCount}`);
    
    if (researchCount >= nftCount * 0.8) { // 允许20%的差异
      console.log('✅ 数据一致性良好');
    } else {
      console.log('⚠️  数据一致性需要改善');
    }
    
    // 5. 检查数据库文件大小
    const fs = require('fs');
    const stats_file = fs.statSync(DB_PATH);
    const fileSizeMB = (stats_file.size / (1024 * 1024)).toFixed(2);
    console.log(`💾 数据库文件大小: ${fileSizeMB} MB`);
    
    // 6. 检查WAL模式（推荐用于并发访问）
    const walMode = db.prepare('PRAGMA journal_mode').get();
    console.log(`📝 日志模式: ${walMode.journal_mode}`);
    
    if (walMode.journal_mode !== 'wal') {
      console.log('💡 建议启用WAL模式以提高并发性能');
      console.log('   执行: sqlite3 desci.db "PRAGMA journal_mode=WAL;"');
    }
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
  } finally {
    db.close();
  }
}

// 并发测试
async function concurrencyTest() {
  console.log('\n🔄 并发访问测试...');
  
  const promises = [];
  
  // 创建多个并发读取
  for (let i = 0; i < 5; i++) {
    promises.push(new Promise((resolve) => {
      const db = new Database(DB_PATH, { readonly: true });
      const start = Date.now();
      
      try {
        const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const duration = Date.now() - start;
        resolve({ success: true, duration, count: result.count });
      } catch (error) {
        resolve({ success: false, error: error.message });
      } finally {
        db.close();
      }
    }));
  }
  
  const results = await Promise.all(promises);
  const successful = results.filter(r => r.success).length;
  const avgDuration = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successful;
  
  console.log(`📊 并发测试结果: ${successful}/5 成功`);
  console.log(`⏱️  平均响应时间: ${avgDuration.toFixed(2)}ms`);
  
  if (successful === 5) {
    console.log('✅ 并发访问正常');
  } else {
    console.log('⚠️  并发访问可能有问题');
  }
}

async function main() {
  await checkDatabaseHealth();
  await concurrencyTest();
  console.log('\n🎉 健康检查完成');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDatabaseHealth, concurrencyTest };
