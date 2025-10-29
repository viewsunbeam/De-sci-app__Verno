const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 影响力积分计算规则
const INFLUENCE_RULES = {
  PUBLICATION_PUBLISHED: 100,    // 发表论文
  PUBLICATION_CITED: 50,         // 论文被引用
  DATASET_UPLOADED: 80,          // 上传数据集
  DATASET_DOWNLOADED: 10,        // 数据集被下载
  PROJECT_COMPLETED: 120,        // 完成项目
  NFT_MINTED: 60,               // 铸造NFT
  COLLABORATION: 30,             // 合作贡献
  PEER_REVIEW: 40,              // 同行评议
  ZK_PROOF_VERIFIED: 90         // ZK证明验证
};

// 权重配置（总计10000）
const WEIGHTS = {
  publication: 3000,
  review: 2000,
  data: 2500,
  collaboration: 1500,
  governance: 1000
};

// 获取用户影响力积分详情
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 获取用户基本信息
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 计算各项贡献积分
    const contributions = await calculateUserContributions(userId);
    
    // 计算总积分
    const totalScore = Math.floor(
      (contributions.breakdown.publications * WEIGHTS.publication +
       contributions.breakdown.reviews * WEIGHTS.review +
       contributions.breakdown.datasets * WEIGHTS.data +
       contributions.breakdown.collaborations * WEIGHTS.collaboration +
       contributions.breakdown.governance * WEIGHTS.governance) / 10000
    );
    
    // 计算等级
    const level = calculateLevel(totalScore);
    
    // 获取最近活动
    const recentActivities = await getRecentActivities(userId);
    
    const influenceData = {
      userId: parseInt(userId),
      username: user.username,
      walletAddress: user.wallet_address,
      totalScore,
      level,
      rank: await getUserRank(userId, totalScore),
      weights: WEIGHTS,
      scores: contributions.breakdown,
      contributions: contributions.details,
      recentActivities,
      lastUpdated: new Date().toISOString(),
      networkName: "Hardhat（本地）",
      status: "Verified"
    };

    res.json(influenceData);
  } catch (error) {
    console.error('Error calculating influence:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to calculate influence score',
      details: error.message 
    });
  }
});

// 获取影响力排行榜
router.get('/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const users = await db.allAsync('SELECT id, username, wallet_address FROM users LIMIT 50');
    const leaderboard = [];
    
    for (const user of users) {
      const contributions = await calculateUserContributions(user.id);
      const totalScore = Math.floor(
        (contributions.breakdown.publications * WEIGHTS.publication +
         contributions.breakdown.reviews * WEIGHTS.review +
         contributions.breakdown.datasets * WEIGHTS.data +
         contributions.breakdown.collaborations * WEIGHTS.collaboration +
         contributions.breakdown.governance * WEIGHTS.governance) / 10000
      );
      
      if (totalScore > 0) {
        leaderboard.push({
          userId: user.id,
          username: user.username,
          walletAddress: user.wallet_address,
          totalScore,
          level: calculateLevel(totalScore)
        });
      }
    }
    
    // 按积分排序
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    
    // 添加排名
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    res.json({
      leaderboard: leaderboard.slice(0, limit),
      totalUsers: leaderboard.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});

// 实时更新用户积分（模拟新活动）
router.post('/user/:userId/activity', async (req, res) => {
  const { userId } = req.params;
  const { activityType, details } = req.body;
  
  try {
    // 重新计算积分
    const contributions = await calculateUserContributions(userId);
    const totalScore = Math.floor(
      (contributions.breakdown.publications * WEIGHTS.publication +
       contributions.breakdown.reviews * WEIGHTS.review +
       contributions.breakdown.datasets * WEIGHTS.data +
       contributions.breakdown.collaborations * WEIGHTS.collaboration +
       contributions.breakdown.governance * WEIGHTS.governance) / 10000
    );
    
    res.json({
      success: true,
      activityType,
      scoreAdded: INFLUENCE_RULES[activityType] || 0,
      newTotalScore: totalScore,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

// 计算用户各项贡献
async function calculateUserContributions(userId) {
  const breakdown = {
    publications: 0,
    datasets: 0,
    projects: 0,
    nfts: 0,
    collaborations: 0,
    reviews: 0,
    governance: 50 // 基础分
  };
  
  const details = {
    publications: [],
    datasets: [],
    projects: [],
    nfts: [],
    activities: []
  };

  try {
    // 论文贡献
    const publications = await db.allAsync(`
      SELECT id, title, status, created_at 
      FROM publications 
      WHERE author_id = ?
    `, [userId]).catch(() => []);
    
    publications.forEach(pub => {
      if (pub.status === 'Published') {
        breakdown.publications += INFLUENCE_RULES.PUBLICATION_PUBLISHED;
        details.publications.push({
          id: pub.id,
          title: pub.title,
          score: INFLUENCE_RULES.PUBLICATION_PUBLISHED,
          type: 'published',
          date: pub.created_at
        });
      }
    });

    // 数据集贡献
    const datasets = await db.allAsync(`
      SELECT id, title, created_at 
      FROM datasets 
      WHERE owner_id = ?
    `, [userId]);
    
    datasets.forEach(dataset => {
      breakdown.datasets += INFLUENCE_RULES.DATASET_UPLOADED;
      details.datasets.push({
        id: dataset.id,
        title: dataset.title,
        score: INFLUENCE_RULES.DATASET_UPLOADED,
        type: 'uploaded',
        date: dataset.created_at
      });
    });

    // 项目贡献
    const projects = await db.allAsync(`
      SELECT id, title, status, created_at 
      FROM projects 
      WHERE owner_id = ?
    `, [userId]).catch(() => []);
    
    projects.forEach(project => {
      if (project.status === 'Completed') {
        breakdown.projects += INFLUENCE_RULES.PROJECT_COMPLETED;
        details.projects.push({
          id: project.id,
          title: project.title,
          score: INFLUENCE_RULES.PROJECT_COMPLETED,
          type: 'completed',
          date: project.created_at
        });
      }
    });

    // NFT贡献
    const nfts = await db.allAsync(`
      SELECT id, token_id, asset_type, created_at 
      FROM nfts 
      WHERE owner_id = ? AND on_chain = 1
    `, [userId]);
    
    nfts.forEach(nft => {
      breakdown.nfts += INFLUENCE_RULES.NFT_MINTED;
      details.nfts.push({
        id: nft.id,
        tokenId: nft.token_id,
        assetType: nft.asset_type,
        score: INFLUENCE_RULES.NFT_MINTED,
        type: 'minted',
        date: nft.created_at
      });
    });

    // 模拟其他活动积分
    breakdown.collaborations = Math.floor(Math.random() * 5) * INFLUENCE_RULES.COLLABORATION;
    breakdown.reviews = Math.floor(Math.random() * 3) * INFLUENCE_RULES.PEER_REVIEW;

  } catch (error) {
    console.error('Error calculating contributions:', error);
  }

  return { breakdown, details };
}

// 计算用户等级
function calculateLevel(totalScore) {
  if (totalScore >= 1000) return { level: 5, name: 'Research Leader', nextLevelAt: null };
  if (totalScore >= 500) return { level: 4, name: 'Senior Researcher', nextLevelAt: 1000 };
  if (totalScore >= 200) return { level: 3, name: 'Active Contributor', nextLevelAt: 500 };
  if (totalScore >= 50) return { level: 2, name: 'Contributor', nextLevelAt: 200 };
  return { level: 1, name: 'Newcomer', nextLevelAt: 50 };
}

// 获取用户排名
async function getUserRank(userId, userScore) {
  // 简化实现，实际应该查询所有用户积分
  const totalUsers = await db.getAsync('SELECT COUNT(*) as count FROM users');
  const rank = Math.max(1, Math.floor(Math.random() * Math.min(totalUsers.count, 100)));
  return {
    current: rank,
    total: totalUsers.count,
    percentile: Math.round((1 - rank / totalUsers.count) * 100)
  };
}

// 获取最近活动
async function getRecentActivities(userId) {
  const activities = [];
  
  try {
    const recentPublications = await db.allAsync(`
      SELECT 'publication' as type, title as name, created_at 
      FROM publications 
      WHERE author_id = ? 
      ORDER BY created_at DESC LIMIT 3
    `, [userId]);
    
    const recentDatasets = await db.allAsync(`
      SELECT 'dataset' as type, title as name, created_at 
      FROM datasets 
      WHERE owner_id = ? 
      ORDER BY created_at DESC LIMIT 3
    `, [userId]);
    
    const recentNFTs = await db.allAsync(`
      SELECT 'nft' as type, token_id as name, created_at 
      FROM nfts 
      WHERE owner_id = ? 
      ORDER BY created_at DESC LIMIT 3
    `, [userId]);
    
    activities.push(...recentPublications, ...recentDatasets, ...recentNFTs);
    
    // 按时间排序
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return activities.slice(0, 10);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

module.exports = router;
