import { ref, computed } from 'vue'
import { ethers } from 'ethers'
import contractsConfig from '../contracts.json'

// ResearchNFT合约ABI (基于实际合约)
const RESEARCH_NFT_ABI = [
  "function mintResearch(address[] memory _authors, uint256[] memory _authorShares, string memory _title, string memory _abstractText, string[] memory _keywords, string[] memory _researchFields, uint8 _pubType, string memory _contentHash, string memory _metadataHash, bool _isOpenAccess, uint256 _accessPrice, string memory _tokenURI) external returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function researches(uint256 tokenId) public view returns (uint256, address[], uint256[], string memory, string memory, string[] memory, string[] memory, uint8, string memory, string memory, uint256, uint8, uint8, uint256, uint256[], uint256[], uint256, uint256, bool, uint256)",
  "function getAuthorWorks(address _author) external view returns (uint256[] memory)",
  "event ResearchMinted(uint256 indexed tokenId, address[] authors, string title, uint8 pubType, uint256 timestamp)"
]

export function useResearchNFT() {
  const isLoading = ref(false)
  const error = ref(null)
  const txHash = ref(null)
  const tokenId = ref(null)
  
  // 获取合约实例
  const getContract = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed')
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    
    const contractAddress = contractsConfig.contracts.ResearchNFT.address
    if (!contractAddress) {
      throw new Error('ResearchNFT contract address not configured')
    }
    
    return new ethers.Contract(contractAddress, RESEARCH_NFT_ABI, signer)
  }
  
  // 获取网络信息 (支持真实网络)
  const getNetworkInfo = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const network = await provider.getNetwork()
        return {
          chainId: network.chainId,
          name: network.name,
          isLocalhost: network.chainId === 31337
        }
      } catch (error) {
        console.warn('Failed to get network info:', error)
      }
    }
    
    // 返回本地测试网络信息作为备选
    return {
      chainId: 31337,
      name: 'localhost',
      isLocalhost: true
    }
  }
  
  // 生成NFT元数据
  const generateMetadata = (mintData) => {
    return {
      name: mintData.title,
      description: mintData.description,
      image: mintData.coverImageCID,
      external_url: mintData.contentCID,
      attributes: [
        {
          trait_type: "Asset Type",
          value: mintData.assetType
        },
        {
          trait_type: "Category", 
          value: mintData.category
        },
        {
          trait_type: "Open Access",
          value: mintData.openAccess ? "Yes" : "No"
        },
        {
          trait_type: "Authors Count",
          value: mintData.authors.length
        }
      ],
      properties: {
        authors: mintData.authors,
        keywords: mintData.keywords,
        contentCID: mintData.contentCID,
        assetId: mintData.selectedAsset,
        assetType: mintData.assetType
      }
    }
  }
  
  // 铸造NFT (连接真实本地区块链)
  const mintNFT = async (mintData) => {
    isLoading.value = true
    error.value = null
    txHash.value = null
    tokenId.value = null
    
    try {
      console.log('🚀 Starting REAL blockchain NFT mint...')
      
      // 检查网络
      const network = await getNetworkInfo()
      console.log('📡 Network info:', network)
      
      // 获取合约实例
      const contract = await getContract()
      console.log('📋 Contract address:', contract.address)
      
      // 生成元数据
      const metadata = generateMetadata(mintData)
      console.log('📝 Generated metadata:', metadata)
      
      // 上传元数据到IPFS (模拟)
      const metadataURI = `ipfs://QmMetadata${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      console.log('🔗 Metadata URI:', metadataURI)
      
      // 准备作者地址和份额
      const authorAddresses = mintData.authors.map(author => author.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
      const authorShares = mintData.authors.map(author => author.share || 10000)
      
      console.log('👥 Authors:', authorAddresses)
      console.log('💰 Shares:', authorShares)
      
      // 获取当前用户地址
      const signer = await contract.signer.getAddress()
      console.log('🔑 Minter address:', signer)
      
      // 准备合约参数
      const pubType = getPublicationType(mintData.assetType)
      const keywords = mintData.keywords || []
      const researchFields = ['Computer Science']
      
      console.log('⛓️ Calling contract mintResearch function...')
      
      // 调用合约mintResearch函数
      const tx = await contract.mintResearch(
        authorAddresses,           // _authors
        authorShares,             // _authorShares  
        mintData.title,           // _title
        mintData.description,     // _abstractText
        keywords,                 // _keywords
        researchFields,           // _researchFields
        pubType,                  // _pubType
        mintData.contentCID,      // _contentHash
        metadataURI,              // _metadataHash
        mintData.openAccess || false, // _isOpenAccess
        ethers.utils.parseEther((mintData.accessPrice || 0).toString()), // _accessPrice
        metadataURI               // _tokenURI
      )
      
      txHash.value = tx.hash
      console.log('📄 Transaction hash:', tx.hash)
      console.log('⏳ Waiting for transaction confirmation...')
      
      // 等待交易确认
      const receipt = await tx.wait()
      console.log('✅ Transaction confirmed:', receipt)
      
      // 从事件中获取tokenId
      const mintEvent = receipt.events?.find(event => event.event === 'ResearchMinted')
      if (mintEvent) {
        tokenId.value = mintEvent.args.tokenId.toString()
        console.log('🎯 Minted NFT tokenId:', tokenId.value)
      } else {
        // 从日志中解析tokenId
        console.log('📋 Receipt logs:', receipt.logs)
        if (receipt.logs && receipt.logs.length > 0) {
          // 尝试从第一个日志解析tokenId
          const log = receipt.logs[0]
          if (log.topics && log.topics.length > 1) {
            tokenId.value = parseInt(log.topics[1], 16).toString()
            console.log('🎯 Parsed NFT tokenId from logs:', tokenId.value)
          }
        }
      }
      
      return {
        success: true,
        txHash: tx.hash,
        tokenId: tokenId.value,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        metadata,
        metadataURI
      }
    } catch (err) {
      console.error('❌ Blockchain mint failed:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // 获取发布类型枚举值
  const getPublicationType = (assetType) => {
    const typeMap = {
      'Publication': 0, // Paper
      'Dataset': 2,     // Dataset  
      'Project': 3      // Software
    }
    return typeMap[assetType] || 0
  }
  
  // 获取NFT信息 (本地测试版本)
  const getNFTInfo = async (tokenId) => {
    try {
      console.log('🔍 Getting mock NFT info for tokenId:', tokenId)
      
      // 返回模拟的NFT信息
      return {
        tokenId,
        tokenURI: `ipfs://QmMockMetadata${tokenId}`,
        owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        authors: ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
        authorShares: ['10000'],
        title: 'Mock Research NFT',
        abstractText: 'This is a mock research NFT for testing purposes',
        keywords: ['blockchain', 'research', 'nft'],
        researchFields: ['Computer Science'],
        pubType: '0',
        contentHash: `ipfs://QmMockContent${tokenId}`,
        metadataHash: `ipfs://QmMockMetadata${tokenId}`,
        timestamp: Date.now().toString(),
        reviewStatus: '0',
        impactLevel: '0',
        citationCount: '0',
        downloadCount: '0',
        revenueGenerated: '0',
        isOpenAccess: true,
        accessPrice: '0'
      }
    } catch (err) {
      console.error('Failed to get mock NFT info:', err)
      throw err
    }
  }
  
  // 获取用户的研究作品 (本地测试版本)
  const getUserWorks = async (address) => {
    try {
      console.log('🔍 Getting mock user works for address:', address)
      // 返回模拟的用户作品列表
      return ['1', '2', '3']
    } catch (err) {
      console.error('Failed to get mock user works:', err)
      throw err
    }
  }
  
  // 获取总供应量 (本地测试版本)
  const getTotalSupply = async () => {
    try {
      console.log('🔍 Getting mock total supply')
      // 返回模拟的总供应量
      return '100'
    } catch (err) {
      console.error('Failed to get mock total supply:', err)
      throw err
    }
  }
  
  // 生成Etherscan链接
  const getEtherscanLink = (txHashOrAddress, type = 'tx') => {
    const network = contractsConfig.network
    
    if (network.chainId === 31337) {
      // 本地网络，生成本地区块链浏览器链接
      console.log(`🔗 Local Blockchain Explorer: ${type}/${txHashOrAddress}`)
      return `http://localhost:5173/etherscan-local.html?type=${type}&value=${encodeURIComponent(txHashOrAddress)}`
    }
    
    // 根据网络ID生成对应的Etherscan链接
    const baseUrls = {
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      5: 'https://goerli.etherscan.io'
    }
    
    const baseUrl = baseUrls[network.chainId] || 'https://etherscan.io'
    
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${txHashOrAddress}`
      case 'address':
        return `${baseUrl}/address/${txHashOrAddress}`
      case 'token':
        return `${baseUrl}/token/${txHashOrAddress}`
      case 'block':
        return `${baseUrl}/block/${txHashOrAddress}`
      default:
        return `${baseUrl}/tx/${txHashOrAddress}`
    }
  }
  
  // 监听ResearchMinted事件
  const listenToMintEvents = (callback) => {
    return new Promise(async (resolve, reject) => {
      try {
        const contract = await getContract()
        
        const filter = contract.filters.ResearchMinted()
        
        contract.on(filter, (tokenId, owner, tokenURI, authors, shares, event) => {
          console.log('🎉 ResearchMinted event received:', {
            tokenId: tokenId.toString(),
            owner,
            tokenURI,
            authors,
            shares: shares.map(s => s.toString()),
            txHash: event.transactionHash
          })
          
          if (callback) {
            callback({
              tokenId: tokenId.toString(),
              owner,
              tokenURI,
              authors,
              shares: shares.map(s => s.toString()),
              txHash: event.transactionHash
            })
          }
          
          resolve(event)
        })
        
      } catch (err) {
        reject(err)
      }
    })
  }
  
  return {
    // 状态
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    txHash: computed(() => txHash.value),
    tokenId: computed(() => tokenId.value),
    
    // 方法
    mintNFT,
    getNFTInfo,
    getUserWorks,
    getTotalSupply,
    getEtherscanLink,
    getNetworkInfo,
    listenToMintEvents
  }
}
