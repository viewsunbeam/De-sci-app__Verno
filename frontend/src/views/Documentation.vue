<template>
  <div class="docs-page">
    <div class="page-header">
      <h1>项目文档</h1>
      <p>集中查看平台文档、验证指南与测试套件说明。</p>
    </div>

    <n-grid :cols="3" x-gap="16" y-gap="16">
      <n-gi>
        <n-card title="README 与架构">
          <n-p>查看项目根目录下的总览文档与架构说明。</n-p>
          <n-button type="primary" secondary @click="openReadme">打开 README</n-button>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card title="数据验证中心">
          <n-p>了解混合查询（前端 + Go 服务）与链上验证的使用方法。</n-p>
          <router-link to="/verification">
            <n-button type="primary">进入验证页面</n-button>
          </router-link>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card title="完整测试套件">
          <n-p>运行完整测试、查看测试报告与结果输出位置。</n-p>
          <n-button @click="openTests">查看测试说明</n-button>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card title="快速命令">
      <n-code :code="commands" language="bash" word-wrap />
    </n-card>
  </div>
</template>

<script setup>
import { NGrid, NGi, NCard, NButton, NCode, NP } from 'naive-ui'

const commands = `# 启动 Go 服务
cd services/chain-api
PORT=8088 ./desci-backend

# 启动前端
cd frontend
npm run dev

# 运行完整测试
bash tests/verno-complete-tests/run_complete_tests.sh`

const openReadme = () => {
  // 直接打开根 README 的 GitHub 链接或本地路由提示
  window.open('https://github.com/viewsunbeam/De-sci-app__Verno#readme', '_blank')
}

const openTests = () => {
  // 指向测试套件目录的说明（仓库内文档）
  window.open('https://github.com/viewsunbeam/De-sci-app__Verno/tree/main/tests/verno-complete-tests', '_blank')
}
</script>

<style scoped>
.docs-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header h1 {
  margin: 0 0 8px;
}
</style>
