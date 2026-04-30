<!-- AI辅助生成：qwen ,2026-4-28 -->
<!-- 应用主入口组件 - 智灌管家 -->
<template>
  <div class="app-container">
    <!-- 固定标题栏 - 始终显示在页面顶部 -->
    <header class="fixed-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <span>智灌管家</span>
          </h1>
          <p class="page-subtitle">实时监控与远程管理</p>
        </div>
        <div class="header-right">
          <el-button 
            type="primary" 
            size="large"
            @click="handleConfigClick"
            class="config-btn"
          >
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </el-button>
        </div>
      </div>
    </header>

    <!-- 系统配置对话框 - 点击配置按钮时弹出 -->
    <el-dialog
      v-model="showConfigDialog"
      width="800px"
      :close-on-click-modal="false"
      class="config-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon :size="24" color="#10b981"><Setting /></el-icon>
          <span>系统配置</span>
        </div>
      </template>
      <ApiConfig ref="apiConfigRef" />
      <template #footer>
        <el-button @click="showConfigDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 主内容区域 - 包含设备监控和控制功能 -->
    <main class="main-content">
      <!-- 设备监控和控制组件 -->
      <DeviceMonitor />
    </main>

    <!-- 页尾 - 显示版权和学校信息 -->
    <footer class="app-footer">
      <div class="footer-content">
        <p class="footer-text">
          <span>智灌管家 © {{ new Date().getFullYear() }}</span>
        </p>
        <p class="footer-subtitle">实时监控 · 智能管理 · 绿色节能</p>
        <p class="footer-school">西昌学院</p>
      </div>
    </footer>
  </div>
</template>

<!-- AI辅助生成：qwen ,2026-4-28 -->
<script setup>
// 导入Vue核心API
import { ref } from 'vue'
// 导入Element Plus图标
import { Setting } from '@element-plus/icons-vue'
// 导入子组件
import ApiConfig from './components/ApiConfig.vue'
import DeviceMonitor from './components/DeviceMonitor.vue'

// 配置组件引用
const apiConfigRef = ref(null)
// 控制配置对话框显示状态
const showConfigDialog = ref(false)

/**
 * 处理配置按钮点击事件
 * 打开系统配置对话框
 */
const handleConfigClick = () => {
  showConfigDialog.value = true
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 固定标题栏 */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(16, 185, 129, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px 30px;
  transition: all 0.3s ease;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-right {
  flex-shrink: 0;
}

.page-title {
  display: flex;
  align-items: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  margin: 0;
  font-weight: 400;
}

.config-btn {
  font-weight: 600;
  border-radius: 12px;
  padding: 12px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.2) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}

.config-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.config-btn .el-icon {
  font-size: 18px;
}

/* 主内容区域 */
.main-content {
  max-width: 1800px;
  margin: 0 auto;
  padding-top: 100px;
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* 配置对话框 */
:deep(.config-dialog) {
  border-radius: 16px;
}

:deep(.config-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 2px solid rgba(16, 185, 129, 0.1);
  margin: 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

:deep(.config-dialog .el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.config-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 2px solid rgba(16, 185, 129, 0.1);
}

/* 背景装饰 */
.app-container::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: float 20s ease-in-out infinite;
}

.app-container::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: float 25s ease-in-out infinite reverse;
}

/* 页尾样式 */
.app-footer {
  max-width: 1800px;
  margin: 0 auto;
  padding: 30px;
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.footer-content {
  text-align: center;
  padding: 24px;
  background: transparent;
  transition: all 0.3s ease;
}

.footer-content:hover {
  transform: translateY(-2px);
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.footer-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  margin: 0 0 12px 0;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.footer-school {
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -30px) scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fixed-header {
    padding: 12px 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .page-subtitle {
    font-size: 12px;
    margin-left: 32px;
  }
  
  .main-content {
    padding-top: 120px;
    padding-left: 15px;
    padding-right: 15px;
    gap: 16px;
  }
  
  .config-btn {
    width: 100%;
  }
}
</style>
