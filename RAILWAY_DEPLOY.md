# Railway 部署指南

## 前置要求
- Railway 账户（https://railway.app）
- GitHub 账户（推荐使用GitHub授权）
- Git 命令行工具

## 部署步骤

### 1. 准备项目
```bash
# 确保所有依赖已安装
npm install

# 本地测试构建
npm run build
npm start
```

### 2. 推送代码到 GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 3. Railway 部署方式（二选一）

#### 方式 A：使用 Railway CLI（推荐）
```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录 Railway
railway login

# 初始化项目
railway init

# 部署
railway up
```

#### 方式 B：使用 Railway Web 界面
1. 访问 https://railway.app
2. 登录账户
3. 点击 "New Project"
4. 选择 "Deploy from GitHub"
5. 连接你的 GitHub 仓库
6. 选择此项目分支
7. 配置环境变量（见下方）
8. 点击部署

### 4. 配置环境变量

在 Railway 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PORT` | 服务器端口 | `3000`（Railway会自动设置） |
| 其他配置 | 根据需要添加 | - |

> 注：检查代码中的 `config` 对象，如需要涂鸦API配置，添加相应环境变量

### 5. 验证部署

部署完成后：
1. Railway 会自动为您生成一个公网 URL
2. 访问该 URL 查看是否正常运行
3. 检查 Railway Logs 查看任何错误

## 配置说明

### package.json 脚本
- `npm start` - 启动生产服务器
- `npm run build` - 构建 Vue 前端
- `npm run build && node server.js` - 完整的部署命令

### Procfile
```
web: npm run build && node server.js
```

此配置会：
1. 编译 Vue 前端到 `dist` 文件夹
2. 启动 Express 服务器
3. 服务器自动提供前端静态文件

### 服务器配置
- 服务器文件：`server.js`
- 前端构建输出：`dist/`
- 环境变量 PORT：默认 3000（Railway 会覆盖）

## 故障排除

### 构建失败
```
查看 Railway 日志：
- Logs 选项卡中查看完整错误信息
- 检查 node_modules 是否正确安装
```

### 端口错误
```
确保使用 process.env.PORT 而不是硬编码端口
```

### 环境变量问题
```
1. Railway 设置 → Variables
2. 检查所有必需变量是否已添加
3. 重新部署项目
```

### 前端资源无法加载
```
检查 server.js 中的静态文件配置：
app.use(express.static(path.join(__dirname, 'dist')))
```

## 更新部署

当代码有更新时：
```bash
git add .
git commit -m "Update message"
git push origin main
```

Railway 会自动检测代码变化并重新部署。

## 自定义域名

1. 在 Railway 项目中选择 Settings
2. 找到 Domains 配置
3. 点击 Generate Domain 或添加自定义域名
4. 按照说明配置 DNS 记录

## 常见问题

**Q: 如何查看实时日志？**
- A: Railway 控制面板 → Logs 标签页

**Q: 如何回滚到之前的版本？**
- A: Railway 项目 → Deployments，选择之前的版本点击 Redeploy

**Q: 如何增加资源？**
- A: Railway 项目 → Settings → Resources，调整计算资源

## 联系支持
- Railway 文档：https://docs.railway.app
- Railway 社区：https://railway.app/discord
