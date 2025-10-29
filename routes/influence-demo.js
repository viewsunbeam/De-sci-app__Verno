const express = require('express');
const router = express.Router();

// 演示用的影响力API - 返回模拟数据
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  console.log(`🎯 获取用户 ${userId} 的影响力数据`);
  
  // 模拟用户数据
  const mockUsers = {
    '2': { username: 'Mars', walletAddress: '0x0048CF81b35fF0fBe1192B19b3b32C9C23a7643A' },
    '6': { username: 'dr_alice_ai', walletAddress: '0x742d35Cc6634C0532925a3b8D4f25177F9E5C4B8' },
    '7': { username: 'blockchain_bob', walletAddress: '0x8ba1f109551bD432803012645Hac136c5b3F5F99' }
  };
  
  const user = mockUsers[userId] || { username: 'Demo User', walletAddress: '0x742d35Cc6634C0532925a3b8D4f25177F9E5C4B8' };
  
  // 模拟贡献数据
  const contributions = {
    publications: [
      {
        id: 1,
        title: 'AI in Climate Research',
        score: 100,
        type: 'published',
        date: '2024-10-15'
      },
      {
        id: 2,
        title: 'Blockchain for Science',
        score: 100,
        type: 'published',
        date: '2024-09-20'
      }
    ],
    datasets: [
      {
        id: 1,
        title: 'Climate Satellite Data 2024',
        score: 80,
        type: 'uploaded',
        date: '2024-10-10'
      }
    ],
    projects: [
      {
        id: 1,
        title: 'DeSci Platform Development',
        score: 120,
        type: 'completed',
        date: '2024-10-01'
      }
    ],
    nfts: [
      {
        id: 1,
        tokenId: 'NFT_12345',
        assetType: 'Publication',
        score: 60,
        type: 'minted',
        date: '2024-10-29'
      }
    ]
  };
  
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
    publications: 200, // 2篇论文 × 100分
    reviews: 120,      // 3次评审 × 40分
    datasets: 80,      // 1个数据集 × 80分
    collaborations: 90, // 3次协作 × 30分
    governance: 50     // 基础治理得分
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
    username: user.username,
    walletAddress: user.walletAddress,
    totalScore,
    level,
    rank: {
      current: 42,
      total: 500,
      percentile: 92
    },
    weights,
    scores,
    contributions,
    recentActivities: [
      { type: 'nft', name: 'NFT_12345', created_at: '2024-10-29 21:30:00' },
      { type: 'publication', name: 'AI in Climate Research', created_at: '2024-10-15 14:20:00' },
      { type: 'dataset', name: 'Climate Satellite Data 2024', created_at: '2024-10-10 09:15:00' }
    ],
    lastUpdated: new Date().toISOString(),
    networkName: "Hardhat（本地）",
    status: "Verified"
  };
  
  console.log(`✅ 返回用户 ${user.username} 的影响力数据，总积分: ${totalScore}`);
  res.json(influenceData);
});

// 排行榜API
router.get('/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const leaderboard = [
    {
      userId: 6,
      username: 'dr_alice_ai',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4f25177F9E5C4B8',
      totalScore: 540,
      level: { level: 4, name: 'Senior Researcher' },
      rank: 1
    },
    {
      userId: 7,
      username: 'blockchain_bob',
      walletAddress: '0x8ba1f109551bD432803012645Hac136c5b3F5F99',
      totalScore: 420,
      level: { level: 3, name: 'Active Contributor' },
      rank: 2
    },
    {
      userId: 2,
      username: 'Mars',
      walletAddress: '0x0048CF81b35fF0fBe1192B19b3b32C9C23a7643A',
      totalScore: 380,
      level: { level: 3, name: 'Active Contributor' },
      rank: 3
    }
  ];
  
  res.json({
    leaderboard: leaderboard.slice(0, limit),
    totalUsers: leaderboard.length,
    generatedAt: new Date().toISOString()
  });
});

// 模拟新活动API
router.post('/user/:userId/activity', async (req, res) => {
  const { userId } = req.params;
  const { activityType, details } = req.body;
  
  const scoreMap = {
    'PUBLICATION_PUBLISHED': 100,
    'NFT_MINTED': 60,
    'DATASET_UPLOADED': 80,
    'PROJECT_COMPLETED': 120
  };
  
  const scoreAdded = scoreMap[activityType] || 0;
  
  console.log(`🔄 用户 ${userId} 新活动: ${activityType}, 增加积分: ${scoreAdded}`);
  
  res.json({
    success: true,
    activityType,
    scoreAdded,
    newTotalScore: 540 + scoreAdded, // 模拟新总分
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
