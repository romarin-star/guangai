# Railway 环境变量配置指南

## 📋 基本配置步骤

### 步骤 1: 登录 Railway
1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账户登录

### 步骤 2: 创建新项目
1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub"**
3. 连接并选择 `guangai` 仓库
4. 系统会自动检测到 `Procfile`

### 步骤 3: 配置环境变量
在项目设置中找到 **Variables** 选项卡，添加以下变量：

#### 必需变量
```
PORT=3000
NODE_ENV=production
```

#### 可选变量（如使用 Tuya API）
```
TUYA_CLIENT_ID=your_client_id_here
TUYA_SECRET=your_secret_here
TUYA_API_URL=https://openapi.tuyacn.com
```

---

## 🔧 具体配置方法

### 方法 1：通过 Railway Web 界面（推荐）

#### 1️⃣ 打开项目设置
```
Railway 仓库页 → 右上角 Settings → Variables
```

#### 2️⃣ 添加新变量
点击 **"+ New Variable"**，按以下格式填写：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境标志 |
| `PORT` | `3000` | 监听端口（Railway 会自动覆盖） |

#### 3️⃣ 保存并重新部署
- 变量保存后会自动生效
- 或点击 **"Redeploy"** 手动重新部署

### 方法 2：使用 Railway CLI

```bash
# 登录 Railway
railway login

# 切换到项目
railway switch

# 设置环境变量
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 查看所有环境变量
railway variables list

# 重新部署
railway up
```

---

## 🔐 敏感信息管理

### ⚠️ 重要提示
- ❌ **不要**在代码中硬编码敏感信息
- ✅ **必须**使用环境变量存储密钥和凭证
- ✅ 在 `.env.example` 中提供变量名称（不需要真实值）

### 如何安全处理敏感信息

1. **本地开发**：创建 `.env` 文件
   ```
   TUYA_CLIENT_ID=your_actual_id
   TUYA_SECRET=your_actual_secret
   ```

2. **Railway 部署**：在 Web 界面设置真实值
   - 不提交 `.env` 到 GitHub
   - 在 Railway 控制面板中设置真实凭证

3. **代码中使用**：
   ```javascript
   const clientId = process.env.TUYA_CLIENT_ID
   const secret = process.env.TUYA_SECRET
   ```

---

## 📝 当前项目所需配置

根据您的项目结构，建议配置的环境变量：

### 基础配置（必需）
```bash
NODE_ENV=production
PORT=3000
```

### Tuya API 配置（可选，如需要）
```bash
TUYA_CLIENT_ID=
TUYA_SECRET=
TUYA_API_URL=https://openapi.tuyacn.com
```

### 其他配置（根据需要）
```bash
# 添加其他应用所需的环境变量
# 例如：数据库 URL、API 密钥等
```

---

## ✅ 部署检查清单

部署前确认：
- [ ] 代码已推送到 GitHub ✅ (已完成)
- [ ] Railway 项目已创建
- [ ] 环境变量已配置
- [ ] Procfile 正确
- [ ] package.json 依赖完整

---

## 🚀 部署流程

1. **环境变量配置完成** → 点击 "Deploy" 或等待自动部署
2. **等待构建** → Railway 会：
   - ✅ 克隆代码
   - ✅ 安装依赖 (`npm install`)
   - ✅ 构建前端 (`npm run build`)
   - ✅ 启动服务器 (`node server.js`)
3. **获取访问 URL** → 部署完成后显示公网 URL
4. **访问应用** → 点击 URL 或通过浏览器访问

---

## 🔍 部署后验证

部署完成后检查：

### 查看日志
```
Railway 仓库 → Logs 选项卡
```

### 检查事项
- [ ] 无红色错误日志
- [ ] 应用已启动
- [ ] 可访问首页
- [ ] API 端点可响应

### 常见日志关键字
- ✅ "listening on port" - 服务器已启动
- ❌ "Cannot find module" - 依赖缺失
- ❌ "ENOENT" - 文件不存在

---

## 🆘 常见问题

### Q: 环境变量何时生效？
**A:** 保存后立即生效。如果需要立即看到效果，点击重新部署。

### Q: 如何更新环境变量？
**A:** 在 Variables 选项卡中点击变量名，修改值，然后重新部署。

### Q: 如何删除环境变量？
**A:** 点击变量旁边的 "×" 按钮删除。

### Q: 能看到环境变量的值吗？
**A:** 出于安全考虑，Railway 不显示敏感信息的完整值，仅显示前几个字符。

### Q: 本地开发如何使用环境变量？
**A:** 
```bash
# 创建 .env 文件
echo "TUYA_CLIENT_ID=your_id" > .env

# 安装 dotenv
npm install dotenv

# 在代码中使用
require('dotenv').config()
const clientId = process.env.TUYA_CLIENT_ID
```

---

## 📚 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速开始指南
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - 详细部署指南
- [.env.example](./.env.example) - 环境变量模板
- [Railway 官方文档](https://docs.railway.app/guides/environmentVariables)

---

## 📞 需要帮助？

1. **查看 Railway 日志** - 诊断部署问题
2. **检查 Procfile** - 确保启动命令正确
3. **验证 package.json** - 确保依赖完整
4. **联系 Railway 支持** - https://railway.app/support

**现在您可以开始部署了！🎉**
