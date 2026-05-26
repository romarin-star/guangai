# Railway 部署前检查清单

## 📋 部署前准备

### 代码检查
- [ ] 所有代码已提交到 Git
- [ ] `.env.local` 等本地文件未提交（已在 .gitignore 中）
- [ ] 无调试代码或 console.log 残留

### 依赖检查
- [ ] `npm install` 已运行
- [ ] `package.json` 中所有必需依赖已列出
- [ ] 无冲突的依赖版本

### 构建检查
- [ ] `npm run build` 成功运行
- [ ] `dist/` 文件夹已生成
- [ ] 前端资源正确构建

### 服务器检查
- [ ] `server.js` 使用 `process.env.PORT`
- [ ] 静态文件服务配置正确
- [ ] 所有 API 端点已验证

### 环境变量检查
- [ ] 已确定所有必需的环境变量
- [ ] Tuya API 凭证已准备（如需要）
- [ ] 敏感信息不在代码中硬编码

## 🚀 部署步骤

### 快速部署
```bash
# Windows
railway-deploy.bat

# macOS/Linux
bash railway-deploy.sh
```

### 手动部署
```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up
```

## 🔍 部署后验证

- [ ] 应用启动无错误
- [ ] 可以访问应用首页
- [ ] API 端点正常响应
- [ ] 静态资源（CSS/JS）正确加载
- [ ] 控制台无错误消息

## 🌐 日志检查

访问 Railway 控制面板：
- [ ] 查看 Build 日志（构建过程）
- [ ] 查看 Deploy 日志（部署过程）
- [ ] 查看 Runtime Logs（运行时日志）
- [ ] 检查是否有错误或警告

## 📊 性能优化

### 可选优化
- [ ] 压缩/最小化前端资源
- [ ] 启用 gzip 压缩
- [ ] 优化 API 响应时间
- [ ] 添加缓存策略

## 🔐 安全性检查

- [ ] 环境变量已正确设置
- [ ] 敏感信息不暴露
- [ ] CORS 配置适当
- [ ] API 限流已实施（如需要）

## 📱 跨浏览器测试

部署后测试：
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] 移动浏览器（如有）

## 🆘 常见问题处理

### 如果部署失败
1. 检查 Railway 构建日志
2. 确保 Procfile 正确
3. 验证 package.json 中的脚本
4. 检查依赖是否正确安装

### 如果应用启动但无法访问
1. 检查防火墙/网络设置
2. 确认 PORT 环境变量
3. 查看运行时日志

### 如果前端资源无法加载
1. 验证 `dist` 文件夹已生成
2. 检查 server.js 静态文件配置
3. 确保 index.html 路由正确配置

## 🔗 有用链接

- Railway 控制面板: https://railway.app
- Railway 文档: https://docs.railway.app
- 部署指南: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
- 项目配置: [package.json](./package.json)

---
**最后更新**: 2026-05-26
