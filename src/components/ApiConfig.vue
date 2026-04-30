<!-- AI辅助生成：qwen ,2026-4-28 -->
<!-- API配置组件 - 管理涂鸦和YZL平台的API凭证 -->
<template>
  <div class="api-config-container">
    <el-tabs v-model="activeTab" type="border-card" class="config-tabs">
      <!-- 涂鸦灌溉器配置选项卡 -->
      <el-tab-pane label="涂鸦灌溉器" name="tuya">
        <el-form :model="tuyaConfig" label-width="120px" class="config-form">
          <el-alert
            title="涂鸦云平台配置"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px"
          >
            <template #default>
              用于控制智能灌溉器开关，需要Client ID、Secret和设备ID
            </template>
          </el-alert>

          <el-form-item label="Client ID">
            <el-input 
              v-model="tuyaConfig.clientId" 
              placeholder="请输入涂鸦Client ID"
              clearable
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="Secret">
            <el-input 
              v-model="tuyaConfig.secret" 
              type="password" 
              placeholder="请输入Secret" 
              show-password
              clearable
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="设备ID">
            <el-input 
              v-model="tuyaConfig.deviceId" 
              placeholder="请输入设备ID"
              clearable
            >
              <template #prefix>
                <el-icon><Cpu /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="saveTuyaConfig" :loading="saving">
              <el-icon><Check /></el-icon>保存涂鸦配置
            </el-button>
            <el-button @click="loadTuyaDefault">
              <el-icon><Refresh /></el-icon>加载默认
            </el-button>
            <el-button type="success" @click="testTuyaConnection" :loading="testing">
              <el-icon><Connection /></el-icon>测试连接
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- YZL检测器配置选项卡 -->
      <el-tab-pane label="YZL检测器" name="yzl">
        <el-form label-width="120px" class="config-form">
          <el-alert
            title="YZL物联网平台配置"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 20px"
          >
            <template #default>
              用于监控传感器数据（温度、湿度、土壤水分等），支持多个API Key
            </template>
          </el-alert>

          <el-form-item label="添加 API Key">
            <el-input 
              v-model="draftApiKey" 
              placeholder="输入新的 YZL API Key"
              clearable
              style="width: 400px"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="addApiKey" style="margin-left: 10px">
              <el-icon><Plus /></el-icon>添加
            </el-button>
          </el-form-item>

          <el-form-item label="当前 API Key">
            <el-select 
              v-model="activeApiKey" 
              placeholder="选择已有 API Key"
              @change="onApiKeyChange"
              style="width: 400px"
              clearable
            >
              <el-option
                v-for="(key, index) in apiKeys"
                :key="index"
                :label="maskApiKey(key)"
                :value="key"
              >
                <span>{{ maskApiKey(key) }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ key.substring(0, 8) }}...</span>
              </el-option>
            </el-select>
            <el-button type="danger" @click="removeApiKey" style="margin-left: 10px" :disabled="!activeApiKey">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </el-form-item>

          <el-form-item label="已保存 Keys">
            <el-tag 
              v-for="(key, index) in apiKeys" 
              :key="index"
              :type="key === activeApiKey ? 'success' : 'info'"
              closable
              @close="removeApiKeyByIndex(index)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ maskApiKey(key) }}
            </el-tag>
            <span v-if="apiKeys.length === 0" style="color: #909399">暂无保存的 API Key</span>
          </el-form-item>

          <el-form-item>
            <el-button type="success" @click="testYzlConnection" :loading="testing">
              <el-icon><Connection /></el-icon>测试连接
            </el-button>
            <el-button @click="reloadYzlDevices">
              <el-icon><Refresh /></el-icon>刷新设备
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<!-- AI辅助生成：qwen ,2026-4-28 -->
<script setup>
// 导入Vue核心API
import { ref, onMounted } from 'vue'
// 导入Element Plus消息组件
import { ElMessage } from 'element-plus'
// 导入图标
import {
  Setting, Key, Lock, Cpu, Check, Refresh,
  Connection, Plus, Delete
} from '@element-plus/icons-vue'
// 导入HTTP客户端
import axios from 'axios'

// ==================== 状态变量定义 ====================

// 当前激活的Tab（tuya/yzl）
const activeTab = ref('tuya')

/**
 * 涂鸦云平台配置对象
 */
const tuyaConfig = ref({
  clientId: '',      // Client ID
  secret: '',        // Secret密钥
  deviceId: '',      // 设备ID
  baseUrl: 'https://openapi.tuyacn.com'  // API基础URL
})

// 保存操作进行中标志
const saving = ref(false)
// 测试连接进行中标志
const testing = ref(false)

// YZL API Keys列表
const apiKeys = ref([])
// 当前活跃的API Key
const activeApiKey = ref('')
// 待添加的API Key（输入框中的值）
const draftApiKey = ref('')

// ==================== 涂鸦配置管理函数 ====================

/**
 * 从localStorage加载涂鸦配置
 */
const loadTuyaConfig = () => {
  const stored = localStorage.getItem('irrigation_config')
  if (stored) {
    try {
      tuyaConfig.value = JSON.parse(stored)
    } catch (e) {
      console.error('加载涂鸦配置失败:', e)
    }
  }
}

/**
 * 保存涂鸦配置到localStorage
 * 并触发配置更新事件通知其他组件
 */
const saveTuyaConfig = async () => {
  if (!tuyaConfig.value.clientId || !tuyaConfig.value.secret || !tuyaConfig.value.deviceId) {
    ElMessage.warning('请填写完整的涂鸦配置信息')
    return
  }

  saving.value = true
  try {
    localStorage.setItem('irrigation_config', JSON.stringify(tuyaConfig.value))
    ElMessage.success('涂鸦配置保存成功')
    // 触发配置更新事件
    window.dispatchEvent(new CustomEvent('tuya-config-updated', { detail: tuyaConfig.value }))
  } catch (error) {
    ElMessage.error('配置保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

/**
 * 清空涂鸦配置（恢复默认值）
 */
const loadTuyaDefault = () => {
  tuyaConfig.value = {
    clientId: '',
    secret: '',
    deviceId: '',
    baseUrl: 'https://openapi.tuyacn.com'
  }
  ElMessage.info('已清空涂鸦配置')
}

/**
 * 测试涂鸦API连接
 * 验证Client ID、Secret和设备ID是否正确
 */
const testTuyaConnection = async () => {
  if (!tuyaConfig.value.clientId || !tuyaConfig.value.secret) {
    ElMessage.warning('请先填写Client ID和Secret')
    return
  }

  testing.value = true
  try {
    // 设置涂鸦配置请求头
    const headers = {}
    if (tuyaConfig.value.clientId && tuyaConfig.value.secret) {
      headers['tuya-client-id'] = tuyaConfig.value.clientId
      headers['tuya-secret'] = tuyaConfig.value.secret
    }
    
    const response = await axios.get('/api/device/info', {
      params: { deviceId: tuyaConfig.value.deviceId },
      headers
    })
    
    if (response.data.success) {
      ElMessage.success('涂鸦连接成功！设备: ' + response.data.result.name)
    } else {
      ElMessage.error('连接失败: ' + (response.data.msg || response.data.error))
    }
  } catch (error) {
    ElMessage.error('连接测试失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// ==================== YZL配置管理函数 ====================

/**
 * 从localStorage加载YZL API Keys
 */
const loadYzlApiKeys = () => {
  const stored = localStorage.getItem('apiKeys')
  if (stored) {
    try {
      apiKeys.value = JSON.parse(stored)
    } catch (e) {
      console.error('加载API Keys失败:', e)
    }
  }
  activeApiKey.value = localStorage.getItem('activeApiKey') || ''
}

/**
 * 保存YZL API Keys到localStorage
 */
const saveYzlApiKeys = () => {
  localStorage.setItem('apiKeys', JSON.stringify(apiKeys.value))
  localStorage.setItem('activeApiKey', activeApiKey.value)
}

/**
 * 添加新的YZL API Key
 * 检查重复并设置为当前活跃Key
 */
const addApiKey = () => {
  if (!draftApiKey.value.trim()) {
    ElMessage.warning('请输入 API Key')
    return
  }

  if (apiKeys.value.includes(draftApiKey.value)) {
    ElMessage.warning('该 API Key 已存在')
    return
  }

  apiKeys.value.push(draftApiKey.value)
  activeApiKey.value = draftApiKey.value
  draftApiKey.value = ''
  saveYzlApiKeys()
  ElMessage.success('API Key 已添加')
  
  // 触发重新加载
  window.dispatchEvent(new CustomEvent('yzl-apikey-updated', { detail: activeApiKey.value }))
}

/**
 * 移除当前选中的YZL API Key
 */
const removeApiKey = () => {
  if (!activeApiKey.value) {
    ElMessage.warning('请先选择一个 API Key')
    return
  }

  const index = apiKeys.value.indexOf(activeApiKey.value)
  if (index > -1) {
    apiKeys.value.splice(index, 1)
    activeApiKey.value = apiKeys.value[0] || ''
    saveYzlApiKeys()
    ElMessage.success('API Key 已删除')
    
    // 触发重新加载
    window.dispatchEvent(new CustomEvent('yzl-apikey-updated', { detail: activeApiKey.value }))
  }
}

/**
 * 通过索引移除YZL API Key
 * @param {number} index - 要移除的Key的索引
 */
const removeApiKeyByIndex = (index) => {
  const key = apiKeys.value[index]
  apiKeys.value.splice(index, 1)
  
  if (key === activeApiKey.value) {
    activeApiKey.value = apiKeys.value[0] || ''
  }
  
  saveYzlApiKeys()
  ElMessage.success('API Key 已删除')
  
  // 触发重新加载
  window.dispatchEvent(new CustomEvent('yzl-apikey-updated', { detail: activeApiKey.value }))
}

/**
 * 处理API Key选择改变事件
 * 保存并触发重新加载
 */
const onApiKeyChange = () => {
  saveYzlApiKeys()
  // 触发重新加载
  window.dispatchEvent(new CustomEvent('yzl-apikey-updated', { detail: activeApiKey.value }))
}

/**
 * 掩码显示API Key（保护敏感信息）
 * @param {string} key - API Key
 * @returns {string} 掩码后的Key
 */
const maskApiKey = (key) => {
  if (!key || key.length < 16) return key
  return key.substring(0, 8) + '****' + key.substring(key.length - 4)
}

/**
 * 测试YZL API连接
 * 验证API Key是否有效
 */
const testYzlConnection = async () => {
  if (!activeApiKey.value) {
    ElMessage.warning('请先选择或添加一个 API Key')
    return
  }

  testing.value = true
  try {
    const response = await axios.get('/api/yzl/devices', {
      params: {
        apiKey: activeApiKey.value,
        skipCount: 0,
        maxResultCount: 1
      }
    })

    if (response.data.code === 0) {
      let count = 0
      if (Array.isArray(response.data.data)) {
        count = response.data.data.length
      } else if (response.data.data?.items) {
        count = response.data.data.items.length
      }
      ElMessage.success(`YZL连接成功！找到 ${count} 个设备`)
    } else {
      ElMessage.error('连接失败: ' + (response.data.msg || '未知错误'))
    }
  } catch (error) {
    ElMessage.error('连接测试失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

/**
 * 触发YZL设备重新加载事件
 */
const reloadYzlDevices = () => {
  if (!activeApiKey.value) {
    ElMessage.warning('请先选择 API Key')
    return
  }
  window.dispatchEvent(new CustomEvent('yzl-reload-devices'))
  ElMessage.info('正在刷新设备列表...')
}

// 初始化
onMounted(() => {
  loadTuyaConfig()
  loadYzlApiKeys()
})

// 暴露方法供父组件调用
defineExpose({
  tuyaConfig,
  activeApiKey,
  apiKeys
})
</script>

<style scoped>
.api-config-container {
  padding: 10px;
}

.config-tabs {
  border-radius: 16px;
  overflow: hidden;
}

.config-form {
  padding: 20px 10px 10px;
}

:deep(.el-tabs--border-card) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.el-tabs__content) {
  padding: 20px 0 !important;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #10b981 inset;
}

:deep(.el-button) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

:deep(.el-alert) {
  border-radius: 12px;
  border: none;
}
</style>
