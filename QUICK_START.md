# 🚀 Railway 快速开始指南

## 5 分钟快速部署

### 步骤 1: 准备 GitHub 仓库
```bash
# 初始化 Git（如未初始化）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit for Railway deployment"

# 推送到 GitHub
git push origin main
```

### 步骤 2: 连接 Railway 账户
1. 访问 [Railway.app](https://railway.app)
2. 点击右上角 "Start a New Project"
3. 选择 "Deploy from GitHub"
4. 授权 Railway 访问你的 GitHub
5. 选择此项目所在的仓库

### 步骤 3: 配置部署
Railway 会自动检测 `Procfile`，无需额外配置

### 步骤 4: 设置环境变量（如需要）
在 Railway 控制面板的 Variables 选项卡中：
```
PORT=3000
TUYA_CLIENT_ID=your_id
TUYA_SECRET=your_secret
NODE_ENV=production
```

### 步骤 5: 开始部署
1. 点击 "Deploy"
2. 等待构建完成
3. 获取你的公网 URL

✅ **完成！** 您的应用现已上线

---

## 📝 项目文件说明

| 文件 | 说明 |
|------|------|
| `Procfile` | Railway 启动命令配置 |
| `package.json` | Node.js 依赖和脚本 |
| `server.js` | 主服务器文件（Express） |
| `vite.config.js` | Vue 前端构建配置 |
| `.env.example` | 环境变量模板 |
| `RAILWAY_DEPLOY.md` | 详细部署指南 |
| `DEPLOYMENT_CHECKLIST.md` | 部署检查清单 |

---

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建测试
npm run build
npm start
```

---

## 🐛 常见问题

**Q: 部署后无法访问？**
- A: 等待部署完成，检查 Railway 日志，确保无构建错误

**Q: 如何查看实时日志？**
- A: Railway 控制面板 → Logs 选项卡

**Q: 如何更新已部署的应用？**
- A: 推送代码到 GitHub，Railway 自动重新部署

**Q: 如何回滚到之前的版本？**
- A: Railway 控制面板 → Deployments → 选择之前的版本 → Redeploy

---

## 📚 更多资源

- [详细部署指南](./RAILWAY_DEPLOY.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [Railway 官方文档](https://docs.railway.app)
- [Railway 社区论坛](https://railway.app/community)

---

## 💡 部署优化建议

1. **首次部署可能较慢** - 需要安装依赖和构建前端
2. **后续部署更快** - Railway 会缓存依赖
3. **监控资源使用** - 检查 CPU 和内存占用
4. **定期检查日志** - 及时发现问题

---

## 🆘 获取帮助

- 遇到问题？检查 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- 查看 Railway 官方文档: https://docs.railway.app
- 联系 Railway 支持

**祝您部署顺利！** 🎉
