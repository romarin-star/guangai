// 生产环境配置
const express = require('express')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

// 启用 CORS
app.use(cors())
app.use(express.json())

// 导入后端 API 路由
const backendRoutes = require('./backend-routes')
app.use('/api', backendRoutes)

// 服务静态文件（前端构建产物）
app.use(express.static(path.join(__dirname, 'dist')))

// 所有其他路由都返回 index.html（支持 Vue Router 的 history 模式）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`)
  console.log(`  智能灌溉器服务已启动`)
  console.log(`  端口: http://0.0.0.0:${PORT}`)
  console.log(`  环境: 生产环境`)
  console.log(`========================================\n`)
})
