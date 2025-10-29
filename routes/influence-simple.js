const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 简化的影响力API - 用于演示
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log(`🔍 获取用户 ${userId} 的影响力数据`);
    
    // 获取用户基本信息
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ 找到用户:', user.username);

    // 简化的积分计算
    let publicationScore = 0;
    let datasetScore = 0;
    let projectScore = 0;
    let nftScore = 0;
    
    const contributions = {
      publications: [],
      datasets: [],
      projects: [],
      nfts: []
    };

    try {
      // 查询论文
      const publications = await db.allAsync(`
        SELECT id, title, status, created_at 
        FROM publications 
        WHERE author_id = ?
      `, [userId]);
      
      publications.forEach(pub => {
        if (pub.status === 'Published') {
          publicationScore += 100;
          contributions.publications.push({
            id: pub.id,
            title: pub.title,
            score: 100,
            type: 'published',
            date: pub.created_at
          });
        }
      });
      console.log(`📚 论文贡献: ${publications.length} 篇, 得分: ${publicationScore}`);
    } catch (err) {
      console.log('论文查询跳过:', err.message);
    }

    try {
      // 查询数据集
      const datasets = await db.allAsync(`
        SELECT id, title, created_at 
        FROM datasets 
        WHERE owner_id = ?
      `, [userId]);
      
      datasets.forEach(dataset => {
        datasetScore += 80;
        contributions.datasets.push({
          id: dataset.id,
          title: dataset.title,
          score: 80,
          type: 'uploaded',
          date: dataset.created_at
        });
      });
      console.log(`💾 数据集贡献: ${datasets.length} 个, 得分: ${datasetScore}`);
    } catch (err) {
      console.log('数据集查询跳过:', err.message);
    }

    try {
      // 查询项目
      const projects = await db.allAsync(`
        SELECT id, title, status, created_at 
        FROM projects 
        WHERE owner_id = ?
      `, [userId]);
      
      projects.forEach(project => {
        if (project.status === 'Completed') {
          projectScore += 120;
          contributions.projects.push({
            id: project.id,
            title: project.title,
            score: 120,
            type: 'completed',
            date: project.created_at
          });
        }
      });
      console.log(`🚀 项目贡献: ${projects.length} 个, 得分: ${projectScore}`);
    } catch (err) {
      console.log('项目查询跳过:', err.message);
    }

    try {
      // 查询NFT
      const nfts = await db.allAsync(`
        SELECT id, token_id, asset_type, created_at 
        FROM nfts 
        WHERE owner_id = ? AND on_chain = 1
      `, [userId]);
      
      nfts.forEach(nft => {
        nftScore += 60;
        contributions.nfts.push({
          id: nft.id,
          tokenId: nft.token_id,
          assetType: nft.asset_type,
          score: 60,
          type: 'minted',
          date: nft.created_at
        });
      });
      console.log(`🎨 NFT贡献: ${nfts.length} 个, 得分: ${nftScore}`);
    } catch (err) {
      console.log('NFT查询跳过:', err.message);
    }

    // 权重配置
    const weights = {
      publication: 3000,
      review: 2000,
      data: 2500,
      collaboration: 1500,
      governance: 1000
    };

    // 各项得分
    const scores = {
      publications: publicationScore,
      reviews: Math.floor(Math.random() * 3) * 40, // 模拟评审得分
      datasets: datasetScore,
      collaborations: Math.floor(Math.random() * 5) * 30, // 模拟协作得分
      governance: 50 // 基础治理得分
    };

    // 计算总积分
    const totalScore = Math.floor(
      (scores.publications * weights.publication +
       scores.reviews * weights.review +
       scores.datasets * weights.data +
       scores.collaborations * weights.collaboration +
       scores.governance * weights.governance) / 10000
    );

    // 计算等级
    let level;
    if (totalScore >= 1000) level = { level: 5, name: 'Research Leader', nextLevelAt: null };
    else if (totalScore >= 500) level = { level: 4, name: 'Senior Researcher', nextLevelAt: 1000 };
    else if (totalScore >= 200) level = { level: 3, name: 'Active Contributor', nextLevelAt: 500 };
    else if (totalScore >= 50) level = { level: 2, name: 'Contributor', nextLevelAt: 200 };
    else level = { level: 1, name: 'Newcomer', nextLevelAt: 50 };

    const influenceData = {
      userId: parseInt(userId),
      username: user.username || 'Anonymous',
      walletAddress: user.wallet_address || '0x742d35Cc6634C0532925a3b8D4f25177F9E5C4B8',
      totalScore,
      level,
      rank: {
        current: Math.floor(Math.random() * 100) + 1,
        total: 500,
        percentile: 85
      },
      weights,
      scores,
      contributions,
      recentActivities: [],
      lastUpdated: new Date().toISOString(),
      networkName: "Hardhat（本地）",
      status: "Verified"
    };

    console.log(`🎯 总积分: ${totalScore}, 等级: ${level.name}`);
    res.json(influenceData);
    
  } catch (error) {
    console.error('❌ 影响力计算错误:', error);
    res.status(500).json({ 
      error: 'Failed to calculate influence score',
      details: error.message 
    });
  }
});

// 排行榜API
router.get('/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const users = await db.allAsync('SELECT id, username, wallet_address FROM users LIMIT 10');
    const leaderboard = users.map((user, index) => ({
      userId: user.id,
      username: user.username || 'Anonymous',
      walletAddress: user.wallet_address || '0x' + Math.random().toString(16).substr(2, 40),
      totalScore: Math.floor(Math.random() * 1000) + 100,
      level: { level: Math.floor(Math.random() * 5) + 1, name: 'Contributor' },
      rank: index + 1
    }));
    
    // 按积分排序
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    
    res.json({
      leaderboard: leaderboard.slice(0, limit),
      totalUsers: leaderboard.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('排行榜生成错误:', error);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});

module.exports = router;
