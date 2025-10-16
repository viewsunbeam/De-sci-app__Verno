<template>
  <n-layout class="main-layout">
    <Navbar />
    <n-layout-content class="main-content">
      <div class="hero-section">
        <n-h1>Verno · CCF 竞赛版</n-h1>
        <n-p>第四届 CCF 大学生区块链技术与创新应用竞赛参赛作品，呈现“链上可信 · 链下高效”的科研全流程。</n-p>
        <div class="hero-actions">
            <n-button type="primary" size="large" @click="$router.push('/dashboard')">
               进入控制台
             </n-button>
          <n-button
            ghost
            size="large"
            style="margin-left: 12px"
            @click="$router.push('/explore')"
          >
            浏览成果集
          </n-button>
        </div>
      </div>

      <!-- New Features Section -->
      <div class="features-section">
        <n-h2>竞赛亮点</n-h2>
        <n-grid x-gap="24" y-gap="24" :cols="3">
          <n-gi>
            <n-card title="链上确权">
              将科研成果铸造成 dNFT，生成不可篡改的链上凭证，支持竞赛评审快速核验。
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="链下高效协同">
              数据上链 Hash，全文存储在链下数据库，兼顾性能与隐私，适配真实科研场景。
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="公开评审激励">
              面向评审专家的透明评分与奖励机制，完整展示贡献、积分与激励的闭环。
            </n-card>
          </n-gi>
        </n-grid>
      </div>

      <!-- New Highlights Section -->
      <div class="highlights-section">
         <n-h2>竞赛场景演示</n-h2>
         <n-p>涵盖数据集上传、零知识验证、成果发布与代币激励，完整呈现团队（周子为 / 张家畅 / 朱妍琦 / 李佳凝）提交的竞赛方案。</n-p>
         <n-button type="tertiary" size="large" @click="$router.push('/roadmap')">查看 Demo 指南</n-button>
      </div>

    </n-layout-content>
  </n-layout>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import { NLayout, NLayoutContent, NH1, NP, NButton, NH2, NGrid, NGi, NCard } from 'naive-ui';
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.main-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8rem 2rem; /* Increased padding for more space */
  background-color: #101014; /* Slightly different shade for hero */
  min-height: 80vh; /* Give hero a significant portion of the view */
}

.features-section, .highlights-section {
  padding: 4rem 2rem;
  text-align: center;
}

.features-section {
  background-color: #0d1117;
}

.highlights-section {
    background-color: #161b22;
}

.n-h1 {
  font-size: 3.5rem !important;
  font-weight: 700 !important;
}

.n-h2 {
    font-size: 2.5rem !important;
    font-weight: 600 !important;
    margin-bottom: 2rem;
}

.n-p {
  font-size: 1.5rem !important;
  color: #c9d1d9 !important;
  margin-bottom: 2.5rem !important;
}

.n-card {
    text-align: left;
}
</style> 
