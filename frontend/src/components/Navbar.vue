<template>
  <n-layout-header bordered class="navbar">
    <div class="navbar-left">
      <router-link to="/" class="logo">Verno</router-link>
    </div>
    <div class="navbar-center">
       <n-dropdown trigger="hover" :options="projectOptions" @select = 'handleDropdownSelect'>
        <n-a href="#">Projects</n-a>
      </n-dropdown>
      <n-dropdown trigger="hover" :options="datasetOptions" @select = 'handleDropdownSelect'>
        <n-a href="#">Datasets</n-a>
      </n-dropdown>
      <router-link to="/influence" class="nav-link">
        <n-a href="#">Influence</n-a>
      </router-link>
      <n-a href="#">Community</n-a>
      <n-a href="#">Docs</n-a>
    </div>
    <div class="navbar-right">
      <n-input placeholder="Search..." round clearable class="search-bar" />
      
      <!-- Web3 Connect Button -->
      <div v-if="!isConnected" @click="handleConnect">
        <n-button type="primary">Connect Wallet</n-button>
      </div>
      <div v-else>
        <n-dropdown trigger="click" :options="userDropdownOptions" @select="handleUserDropdownSelect">
            <n-button strong secondary class="user-info-button">
                <div class="user-info">
                  <div class="wallet-address">{{ displayName }}</div>
                  <div class="user-role">{{ userRole }}</div>
                </div>
            </n-button>
        </n-dropdown>
      </div>

      <!-- Show user role even when wallet not connected (for testing) -->
      <div v-if="!isConnected" class="test-user-info">
        <n-dropdown trigger="click" :options="testUserOptions" @select="handleTestUserSelect">
          <n-tag type="info" size="small" style="cursor: pointer;">
            {{ userRole }} (测试模式) ▼
          </n-tag>
        </n-dropdown>
      </div>

    </div>
  </n-layout-header>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { NLayoutHeader, NButton, NInput, NDropdown, NA, NTag } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useWeb3 } from '../composables/useWeb3';

const router = useRouter();
const { connectWallet, disconnectWallet, account, isConnected } = useWeb3();

// --- User Role State ---
const userRole = ref('研究员');
const username = ref('');
const displayName = computed(() => {
    return username.value || formattedAccount.value;
});

// --- Computed Properties for Display ---
const formattedAccount = computed(() => {
    if (!account.value) return '';
    return `${account.value.substring(0, 6)}...${account.value.substring(account.value.length - 4)}`;
});

// --- Fetch User Role ---
const fetchUserRole = async (walletAddress = null) => {
    const address = walletAddress || account.value;
    if (!address) return;

    try {
        const response = await fetch(`http://localhost:3000/api/users/wallet/${address}`);
        if (response.ok) {
            const user = await response.json();
            const roleMap = {
                'researcher': '研究员',
                'reviewer': '评审员',
                'admin': '管理员'
            };
            userRole.value = roleMap[user.user_role] || '研究员';
            username.value = user.username || '';
        }
    } catch (error) {
        console.warn('Failed to fetch user role:', error);
        userRole.value = '研究员';
        username.value = '';
    }
};

// --- Fallback for testing when wallet fails ---
const tryFallbackUserData = async () => {
    // Use known test wallet address when connection fails
    const testWalletAddress = '0x7D3f2C3635418e7BeB03548278da20c1434c86CA';
    await fetchUserRole(testWalletAddress);
};

const userDropdownOptions = computed(() => [
  { label: 'Go to Dashboard', key: 'dashboard' },
  { type: 'divider', key: 'd1' },
  { label: 'Disconnect', key: 'disconnect' },
]);

const testUserOptions = [
  { label: '👨‍🔬 研究员', key: 'researcher' },
  { label: '👨‍⚖️ 评审员', key: 'reviewer' },
  { label: '👨‍💼 管理员', key: 'admin' }
];


// --- Event Handlers ---
const handleConnect = async () => {
    if (isConnected.value) {
        console.log("Already connected.");
        return;
    }
    const user = await connectWallet();
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        await fetchUserRole();
        // No longer auto-redirecting. User can choose from dropdown.
    }
};

// --- Lifecycle ---
onMounted(() => {
    if (isConnected.value) {
        fetchUserRole();
    } else {
        // If wallet is not connected, try to load test user data
        tryFallbackUserData();
    }
});

const handleUserDropdownSelect = (key) => {
    if (key === 'disconnect') {
        disconnectWallet();
        router.push('/');
    } else if (key === 'dashboard') {
        router.push('/dashboard');
    }
};

const handleTestUserSelect = async (key) => {
    const roleMap = {
        'researcher': '研究员',
        'reviewer': '评审员',
        'admin': '管理员'
    };

    const walletMap = {
        'researcher': '0x7D3f2C3635418e7BeB03548278da20c1434c86CA',
        'reviewer': '0x1234567890abcdef1234567890abcdef12345678',
        'admin': '0xabcdef1234567890abcdef1234567890abcdef12'
    };

    userRole.value = roleMap[key];
    console.log(`切换到测试用户身份: ${userRole.value}`);

    // Optionally fetch real data for this test user
    await fetchUserRole(walletMap[key]);
};

const handleDropdownSelect = (key) => {
  router.push(key);
};


// --- Static Dropdown Options ---
const projectOptions = [
  { label: 'Explore All Projects', key: '/explore' },
  { label: 'Start a New Project', key: '/projects' }
];

const datasetOptions = [
  { label: 'Browse Datasets', key: '/explore' },
  { label: 'Submit a Dataset', key: '/datasets/upload' }
];
</script>

<style scoped>
/* Styles remain largely the same */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 64px;
}

.navbar-left .logo {
  font-weight: bold;
  font-size: 1.5rem;
  color: #f0f6fc;
  text-decoration: none;
}

.navbar-center {
  display: flex;
  gap: 2rem;
}

.navbar-center .n-a {
  color: #c9d1d9;
  text-decoration: none;
}

.nav-link {
  text-decoration: none;
}

.nav-link .n-a {
  color: #c9d1d9 !important;
  text-decoration: none;
  transition: color 0.3s;
}

.nav-link:hover .n-a {
  color: #1890ff !important;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.search-bar {
  width: 200px;
  margin-right: 1.5rem;
}

.user-info-button {
  min-width: 140px !important;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.wallet-address {
  font-size: 14px;
  font-weight: 600;
}

.user-role {
  font-size: 11px;
  color: #8a8a8a;
  font-weight: 400;
}

.test-user-info {
  margin-left: 12px;
}
</style> 