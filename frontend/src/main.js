import './styles/global.css';
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Import Naive UI
import naive from 'naive-ui'

// Buffer polyfill for browser compatibility
import { Buffer } from 'buffer'
window.Buffer = Buffer

createApp(App).use(router).use(naive).mount('#app')
