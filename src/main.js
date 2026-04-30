import { createApp } from 'vue'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import './modern-theme.css'

console.log('应用开始初始化...')

axios.defaults.baseURL = import.meta.env.MODE === 'production' ? 'http://localhost:3000' : ''
axios.defaults.timeout = 15000

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)

console.log('应用挂载到 #app')
app.mount('#app')

console.log('应用挂载完成')
