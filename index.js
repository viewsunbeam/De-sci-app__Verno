const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// 引入智能合约服务与链上配置
const ContractService = require('./contracts');
const {
  loadContractsConfig,
  getChainApiBaseUrl,
} = require('./config/blockchain');

const app = express();
const port = process.env.PORT || 3000;

// 初始化智能合约服务
const contractService = new ContractService();
let blockchainEnabled = false;
let chainApiHealthy = false;

async function probeChainApi() {
  const baseUrl = getChainApiBaseUrl().replace(/\/+$/, '');
  const healthUrl = `${baseUrl}/health`;

  try {
    const response = await axios.get(healthUrl, { timeout: 5000 });
    chainApiHealthy = true;
    console.log('✅ 链下同步服务可用:', response.data);
  } catch (error) {
    chainApiHealthy = false;
    const msg = error.response ? error.response.status : error.code || error.message;
    console.log('⚠️  链下同步服务暂不可用:', msg);
  }
}

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded files statically

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const kanbanRoutes = require('./routes/kanban');
const userRoutes = require('./routes/users');
const datasetRoutes = require('./routes/datasets');
const reviewRoutes = require('./routes/reviews');
const publicationRoutes = require('./routes/publications');
const publicationDatasetRoutes = require('./routes/publication-datasets');
const nftRoutes = require('./routes/nfts');
const logRoutes = require('./routes/logs');
const chainRoutes = require('./routes/chain');
// We will move repository logic into projects.js, so this is no longer needed.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/publication-datasets', publicationDatasetRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/chain', chainRoutes);

const likesRoutes = require('./routes/likes');
app.use('/api/likes', likesRoutes);

const influenceRoutes = require('./routes/influence-standalone');
app.use('/api/influence', influenceRoutes);

app.get('/api/download/:filename', (req, res) => {
  const fileName = req.params.filename
  const filePath = path.resolve('uploads', fileName)

  if (!filePath.startsWith(path.resolve('uploads'))) {
    return res.status(400).end()
  }

  if (!fs.existsSync(filePath)) 
    return res.status(404).json({ msg: 'File not found' })

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
})

app.get('/api/blockchain/status', (req, res) => {
  const contractsConfig = loadContractsConfig();

  res.json({
    enabled: blockchainEnabled,
    chainApiHealthy,
    network: contractService.getNetwork(),
    chainApiBaseUrl: getChainApiBaseUrl(),
    contracts: contractsConfig ? contractsConfig.contracts : {},
  });
});

// 启动服务器
app.listen(port, async () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);

  // 尝试初始化智能合约
  blockchainEnabled = await contractService.init();
  app.locals.contractService = contractService;
  app.locals.blockchainEnabled = blockchainEnabled;
  await probeChainApi();
  app.locals.chainApiHealthy = chainApiHealthy;

  if (blockchainEnabled) {
    console.log('✅ 智能合约服务已启用');
  } else {
    console.log('ℹ️  使用传统模式（无区块链）');
  }
});
