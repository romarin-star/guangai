<!-- AI辅助生成：qwen ,2026-4-28 -->
<!-- 设备监控组件 - 显示YZL传感器数据和涂鸦灌溉器控制 -->
<template>
  <div class="device-monitor">
    <!-- YZL传感器实时数据区域 -->
    <el-card class="realtime-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>实时指标</span>
          <el-button type="primary" size="small" @click="reloadAll" :loading="loading">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </template>
      
      <div v-if="devices.length" class="devices-container">
        <div v-for="(device, index) in devices" :key="index" class="device-card">
          <div class="device-header">
            <span class="device-name">{{ device.name || device.id }}</span>
            <el-tag :type="getDeviceStatusTag(device.status)" size="small">
              {{ getDeviceStatusText(device.status) }}
            </el-tag>
          </div>
          
          <div class="metrics-grid">
            <!-- 信号强度 -->
            <div class="metric-item icon-metric">
              <div class="metric-label">信号强度</div>
              <div class="icon-row">
                <div class="signal-icon">
                  <div class="signal-bar s1" :class="{ active: device.__signalLevel >= 1 }"></div>
                  <div class="signal-bar s2" :class="{ active: device.__signalLevel >= 2 }"></div>
                  <div class="signal-bar s3" :class="{ active: device.__signalLevel >= 3 }"></div>
                  <div class="signal-bar s4" :class="{ active: device.__signalLevel >= 4 }"></div>
                </div>
                <span class="icon-text">{{ device.__mapped.signal || '--' }}</span>
              </div>
            </div>

            <!-- 电池电压 -->
            <div class="metric-item icon-metric">
              <div class="metric-label">电压</div>
              <div class="icon-row">
                <div class="battery-icon" :class="device.__batteryUI.batteryColor">
                  <div class="battery-head" :class="device.__batteryUI.batteryColor"></div>
                  <div class="battery-body" :class="device.__batteryUI.batteryColor">
                    <div 
                      class="battery-fill" 
                      :class="device.__batteryUI.batteryColor"
                      :style="{ width: device.__batteryUI.batteryPercent + '%' }"
                    ></div>
                  </div>
                </div>
                <span class="icon-text">{{ device.__mapped.voltage || '--' }}</span>
              </div>
            </div>

            <!-- 温度 -->
            <div class="metric-item">
              <div class="metric-label">温度 (°C)</div>
              <div class="metric-value temp">{{ device.__mapped.temperature || '--' }}</div>
            </div>

            <!-- 湿度 -->
            <div class="metric-item">
              <div class="metric-label">湿度 (%)</div>
              <div class="metric-value humidity">{{ device.__mapped.humidity || '--' }}</div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无设备数据，请刷新或检查 API Key" />
    </el-card>

    <!-- 涂鸦灌溉器设备状态显示 -->
    <el-card class="irrigation-status-card" shadow="hover" style="margin-top: 24px">
      <template #header>
        <div class="card-header">
          <span>灌溉器设备状态</span>
          <el-button type="primary" size="small" @click="refreshIrrigationStatus" :loading="irrigationRefreshing">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </template>
      
      <div v-if="filteredIrrigationStatus.length > 0" class="status-grid">
        <div v-for="status in filteredIrrigationStatus" :key="status.code" class="status-item">
          <div class="status-label">{{ getIrrigationStatusLabel(status.code) }}</div>
          <div class="status-value">{{ formatIrrigationStatusValue(status.code, status.value) }}</div>
        </div>
      </div>
      
      <el-empty v-else description="暂无灌溉器数据，请在系统配置中设置涂鸦设备" />
    </el-card>

    <!-- 涂鸦灌溉器手动控制面板 -->
    <el-card class="control-card" shadow="hover" style="margin-top: 24px">
      <template #header>
        <div class="card-header">
          <span>灌溉器控制面板</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover" class="control-item">
            <div class="control-content">
              <div class="control-label">开关1</div>
              <el-switch
                v-model="switch1"
                @change="handleSwitch1Change"
                :loading="controlling"
                active-text="开启"
                inactive-text="关闭"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="control-item">
            <div class="control-content">
              <div class="control-label">开关2</div>
              <el-switch
                v-model="switch2"
                @change="handleSwitch2Change"
                :loading="controlling"
                active-text="开启"
                inactive-text="关闭"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-divider />

      <!-- 自动灌溉智能控制设置 -->
      <div class="auto-irrigation-section">
        <h3>自动灌溉控制</h3>
        <el-form label-width="120px" size="small">
          <el-form-item label="启用自动控制">
            <el-switch v-model="autoIrrigation.enabled" @change="handleAutoIrrigationToggle" />
          </el-form-item>
          
          <el-form-item label="绑定设备">
            <div style="display: flex; gap: 8px; align-items: center; width: 100%">
              <el-select 
                v-model="autoIrrigation.deviceId" 
                placeholder="选择监控设备" 
                style="flex: 1"
                :disabled="devices.length === 0"
              >
                <el-option
                  v-for="(device, index) in devices"
                  :key="index"
                  :label="deviceNames[index] || device.id"
                  :value="index"
                />
              </el-select>
              <el-button 
                type="primary" 
                size="small" 
                @click="reloadAll"
                :loading="loading"
                :disabled="!activeApiKey"
              >
                <el-icon><Refresh /></el-icon>
                {{ devices.length > 0 ? '刷新' : '加载设备' }}
              </el-button>
            </div>
            <el-alert 
              v-if="devices.length === 0 && activeApiKey" 
              title="暂无设备，请点击右侧按钮加载设备列表" 
              type="info" 
              :closable="false" 
              style="margin-top: 8px"
            />
            <el-alert 
              v-if="!activeApiKey" 
              title="请先在顶部系统配置中设置YZL API Key" 
              type="warning" 
              :closable="false" 
              style="margin-top: 8px"
            />
          </el-form-item>
          
          <el-form-item label="湿度范围">
            <el-row :gutter="16" style="width: 100%">
              <el-col :span="12">
                <div class="input-with-unit">
                  <el-input-number 
                    v-model="autoIrrigation.minHumidity" 
                    :min="0" 
                    :max="100" 
                    :step="5"
                    :controls="false"
                    style="width: 100%"
                    :disabled="!autoIrrigation.enabled"
                    placeholder="下限"
                    @change="onAutoIrrigationConfigChange"
                  />
                  <span class="unit-badge">%</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="input-with-unit">
                  <el-input-number 
                    v-model="autoIrrigation.maxHumidity" 
                    :min="0" 
                    :max="100" 
                    :step="5"
                    :controls="false"
                    style="width: 100%"
                    :disabled="!autoIrrigation.enabled"
                    placeholder="上限"
                    @change="onAutoIrrigationConfigChange"
                  />
                  <span class="unit-badge">%</span>
                </div>
              </el-col>
            </el-row>
          </el-form-item>
          
          <el-form-item label="控制开关">
            <el-radio-group v-model="autoIrrigation.controlSwitch" :disabled="!autoIrrigation.enabled" @change="onAutoIrrigationConfigChange">
              <el-radio label="switch_1">开关1</el-radio>
              <el-radio label="switch_2">开关2</el-radio>
              <el-radio label="both">两个开关</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="当前状态">
            <el-tag :type="autoIrrigationStatus.type" size="large">
              {{ autoIrrigationStatus.text }}
            </el-tag>
          </el-form-item>
          
          <el-form-item label="最后检查">
            <span class="status-text">{{ autoIrrigation.lastCheckTime || '未执行' }}</span>
          </el-form-item>
        </el-form>
      </div>

      <el-divider />

      <div class="quick-actions">
        <h3>快捷操作</h3>
        <el-space wrap>
          <el-button type="success" @click="openAll" :loading="controlling">
            <el-icon><VideoPlay /></el-icon>全部开启
          </el-button>
          <el-button type="danger" @click="closeAll" :loading="controlling">
            <el-icon><VideoPause /></el-icon>全部关闭
          </el-button>
          <el-button type="warning" @click="refreshIrrigationStatus" :loading="irrigationRefreshing">
            <el-icon><Refresh /></el-icon>刷新状态
          </el-button>
        </el-space>
      </div>
    </el-card>

    <!-- 历史数据和图表区域 -->
    <el-card class="history-card" shadow="hover" style="margin-top: 24px">
      <template #header>
        <div class="card-header">
          <span>最近 7 天历史记录</span>
        </div>
      </template>

      <div class="history-controls">
        <el-select 
          v-model="selectedDeviceIndex" 
          placeholder="选择设备" 
          @change="onDeviceChange"
          style="width: 300px"
        >
          <el-option
            v-for="(name, index) in deviceNames"
            :key="index"
            :label="name"
            :value="index"
          />
        </el-select>

        <el-button 
          type="primary" 
          @click="refreshHistory" 
          :loading="historyLoading"
          :disabled="!deviceNames.length"
        >
          <el-icon><Refresh /></el-icon>刷新历史
        </el-button>
      </div>

      <el-alert 
        v-if="historyForbidden" 
        title="当前 API Key 无历史数据权限（403）" 
        type="warning" 
        :closable="false"
        style="margin-top: 16px"
      />

      <el-alert 
        v-if="historyError" 
        :title="historyError" 
        type="error" 
        :closable="false"
        style="margin-top: 16px"
      />

      <!-- 图表区域 -->
      <el-row :gutter="20" style="margin-top: 24px">
        <el-col :span="12">
          <el-card shadow="hover" class="chart-inner-card">
            <template #header>
              <div class="chart-header">
                <span>温度历史</span>
                <span class="chart-range">范围: {{ tempMin }}°C - {{ tempMax }}°C</span>
              </div>
            </template>
            <canvas ref="tempChartRef" class="chart-canvas" height="300"></canvas>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="hover" class="chart-inner-card">
            <template #header>
              <div class="chart-header">
                <span>湿度历史</span>
                <span class="chart-range">范围: {{ humidityMin }}% - {{ humidityMax }}%</span>
              </div>
            </template>
            <canvas ref="humidityChartRef" class="chart-canvas" height="300"></canvas>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<!-- AI辅助生成：qwen ,2026-4-28 -->
<script setup>
// 导入Vue核心API
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
// 导入Element Plus消息组件
import { ElMessage } from 'element-plus'
// 导入图标
import { Refresh, VideoPlay, VideoPause } from '@element-plus/icons-vue'
// 导入HTTP客户端
import axios from 'axios'

// ==================== 状态变量定义 ====================

// YZL设备加载状态
const loading = ref(false)
// 历史数据加载状态
const historyLoading = ref(false)
// 历史数据错误信息
const historyError = ref('')
// 历史数据权限禁止标志（403）
const historyForbidden = ref(false)
// 当前选中的设备索引
const selectedDeviceIndex = ref(0)

// 涂鸦灌溉器状态刷新标志
const irrigationRefreshing = ref(false)
// 涂鸦灌溉器状态数据
const irrigationStatus = ref([])
// 控制操作进行中标志
const controlling = ref(false)
// 开关1状态
const switch1 = ref(false)
// 开关2状态
const switch2 = ref(false)

/**
 * 过滤后的灌溉器状态（排除倒计时状态）
 */
const filteredIrrigationStatus = computed(() => {
  return irrigationStatus.value.filter(status => !status.code.startsWith('countdown'))
})

/**
 * 自动灌溉配置对象
 */
const autoIrrigation = ref({
  enabled: false,           // 是否启用自动控制
  deviceId: null,           // 绑定的监控设备ID
  minHumidity: 30,          // 湿度下限（低于此值开启灌溉）
  maxHumidity: 70,          // 湿度上限（高于此值关闭灌溉）
  controlSwitch: 'switch_1', // 控制的开关
  lastCheckTime: ''         // 最后检查时间
})

// 自动灌溉状态显示
const autoIrrigationStatus = ref({
  type: 'info',
  text: '未启用'
})

// 自动检查定时器
let autoCheckTimer = null

// 当前活跃的YZL API Key（从localStorage读取）
const activeApiKey = ref(localStorage.getItem('activeApiKey') || '')

// YZL设备列表
const devices = ref([])
// 设备名称列表
const deviceNames = ref([])

// 温度范围显示
const tempMin = ref('--')
const tempMax = ref('--')
// 湿度范围显示
const humidityMin = ref('--')
const humidityMax = ref('--')

// 图表Canvas引用
const tempChartRef = ref(null)
const humidityChartRef = ref(null)

// ==================== 工具函数 ====================

/**
 * 将值转换为数字，失败时返回默认值
 * @param {any} value - 要转换的值
 * @param {any} fallback - 失败时的默认值
 * @returns {number|null} 转换后的数字或null
 */
function toNumber(value, fallback = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * 判断设备状态文本（在线/休眠/离线）
 * @param {string|boolean} status - 设备状态
 * @returns {string} 状态文本
 */
function getDeviceStatusText(status) {
  if (status) {
    const statusLower = String(status).toLowerCase()
    if (statusLower === 'online' || statusLower === '1' || statusLower === 'true') {
      return '在线'
    }
    if (statusLower === 'sleep' || statusLower === '休眠' || statusLower === 'hibernate' || statusLower === '2') {
      return '休眠'
    }
    return '离线'
  }
  
  return '离线'
}

/**
 * 获取设备状态标签类型（用于Element Plus Tag组件）
 * @param {string|boolean} status - 设备状态
 * @returns {string} 标签类型：success/warning/info
 */
function getDeviceStatusTag(status) {
  const statusText = getDeviceStatusText(status)
  if (statusText === '在线') return 'success'
  if (statusText === '休眠') return 'warning'
  return 'info'
}

/**
 * 从字符串中提取数值
 * @param {any} value - 要提取的值
 * @returns {number|null} 提取的数值或null
 */
function extractNumeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = String(value || '')
  const match = text.match(/[-+]?\d*\.?\d+/)
  return match ? parseFloat(match[0]) : null
}

// ==================== YZL设备数据处理函数 ====================

/**
 * 标准化设备设施数据（处理不同API返回格式）
 * @param {Object} device - 设备对象
 * @returns {Array} 标准化的设施数组
 */
function normalizeFacilities(device) {
  const raw = device.facilitys || device.facilities || device.facilityList || []
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== 'object') return []
  return Object.keys(raw).map(key => {
    const item = raw[key]
    if (item && typeof item === 'object') {
      return {
        id: item.id || key,
        key: item.key || key,
        ...item
      }
    }
    return {
      id: key,
      key,
      name: key,
      value: item
    }
  })
}

/**
 * 获取设施的值（尝试多个可能的字段名）
 * @param {Object} facility - 设施对象
 * @returns {any} 设施的值
 */
function getFacilityValue(facility) {
  if (!facility || typeof facility !== 'object') return null
  const candidates = [
    facility.value,
    facility.currentValue,
    facility.latestValue,
    facility.realValue
  ]
  for (let i = 0; i < candidates.length; i++) {
    if (typeof candidates[i] !== 'undefined' && candidates[i] !== null && candidates[i] !== '') {
      return candidates[i]
    }
  }
  return null
}

/**
 * 将文本转换为小写
 * @param {any} value - 要转换的值
 * @returns {string} 小写字符串
 */
function lowerText(value) {
  return String(value || '').toLowerCase()
}

/**
 * 判断设施是否匹配关键词
 * @param {Object} facility - 设施对象
 * @param {Array} keywords - 关键词数组
 * @returns {boolean} 是否匹配
 */
function isLikelyFacility(facility, keywords) {
  const bag = [
    facility.name,
    facility.key,
    facility.identifying,
    JSON.stringify(facility.tags || '')
  ].join('|').toLowerCase()
  return keywords.some(k => bag.includes(k))
}

/**
 * 根据关键词查找设施
 * @param {Array} facilitys - 设施数组
 * @param {Array} keywords - 关键词数组
 * @returns {Object|undefined} 匹配的设施
 */
function pickFacility(facilitys, keywords) {
  return (facilitys || []).find(f => isLikelyFacility(f, keywords))
}

/**
 * 根据精确匹配查找设施
 * @param {Array} facilitys - 设施数组
 * @param {Array} exactKeys - 精确匹配的key数组
 * @param {Array} exactIdentifying - 精确匹配的identifying数组
 * @returns {Object|undefined} 匹配的设施
 */
function pickFacilityByExact(facilitys, exactKeys = [], exactIdentifying = []) {
  return (facilitys || []).find(f => {
    const key = lowerText(f && f.key)
    const identifying = lowerText(f && f.identifying)
    return exactKeys.includes(key) || exactIdentifying.includes(identifying)
  })
}

function mapDeviceValues(device) {
  const facilitys = normalizeFacilities(device)
  
  // 查找各种传感器
  const signalFacility = pickFacility(facilitys, ['signal', 'rssi', 'dbm', 'csq', '信号'])
  const moistureFacility = pickFacility(facilitys, ['moisture', 'water', '水分', '含水'])
  const tempFacility = 
    pickFacilityByExact(
      facilitys,
      ['wd', 'temp', 'temperature'],
      ['iot.fac.ed.temp.soil', 'iot.fac.ed.temp.air', 'iot.fac.temp']
    ) || pickFacility(facilitys, ['temperature', 'temp', '温度'])
  const humidityFacility =
    pickFacilityByExact(
      facilitys,
      ['sf', 'sd', 'hum', 'humidity'],
      ['iot.fac.ed.hum.soil', 'iot.fac.ed.hum.air', 'iot.fac.ed.humidity.soil', 'iot.fac.ed.humidity.air', 'iot.fac.humidity']
    ) || pickFacility(facilitys, ['humidity', '湿度'])
  const voltageFacility = pickFacility(facilitys, ['volt', 'battery', '电压', '电池'])
  const latFacility = pickFacility(facilitys, ['lat', 'latitude', '纬度'])
  const lngFacility = pickFacility(facilitys, ['lng', 'lon', 'longitude', '经度'])
  const locationFacility = pickFacility(facilitys, ['location', 'gps', '经纬度'])

  let latitude = toNumber(getFacilityValue(latFacility))
  let longitude = toNumber(getFacilityValue(lngFacility))

  const locationValue = getFacilityValue(locationFacility)
  if ((latitude === null || longitude === null) && typeof locationValue === 'string') {
    const parts = locationValue.split(/[,\s]+/).filter(Boolean)
    if (parts.length >= 2) {
      latitude = toNumber(parts[0])
      longitude = toNumber(parts[1])
    }
  }

  if (latitude !== null && Math.abs(latitude) > 90) latitude = null
  if (longitude !== null && Math.abs(longitude) > 180) longitude = null

  // 直接从设备对象获取的备用值
  const directSignal = device.signal || device.rssi || device.csq
  const directMoisture = device.moisture || device.water || device.waterContent
  const directTemperature = device.temperature || device.temp
  const directHumidity = device.humidity
  const directVoltage = device.voltage || device.batteryVoltage
  const directLatitude = toNumber(device.latitude || device.lat)
  const directLongitude = toNumber(device.longitude || device.lng || device.lon)

  if (latitude !== null && directLatitude !== null) latitude = directLatitude
  if (longitude !== null && directLongitude !== null) longitude = directLongitude

  return {
    signal: signalFacility ? getFacilityValue(signalFacility) : (directSignal || '--'),
    moisture: moistureFacility ? getFacilityValue(moistureFacility) : (directMoisture || '--'),
    temperature: tempFacility ? getFacilityValue(tempFacility) : (directTemperature || '--'),
    humidity: humidityFacility ? getFacilityValue(humidityFacility) : (directHumidity || '--'),
    voltage: voltageFacility ? getFacilityValue(voltageFacility) : (directVoltage || '--'),
    latitude,
    longitude,
    tempFacilityId: tempFacility ? tempFacility.id : '',
    humidityFacilityId: humidityFacility ? humidityFacility.id : ''
  }
}

// 计算电池UI
function computeBatteryUI(mapped) {
  const voltage = extractNumeric(mapped?.voltage)
  if (voltage === null) {
    return { batteryColor: 'gray', batteryPercent: 0 }
  }

  const minV = 3.0
  const maxV = 4.2
  const percent = Math.max(0, Math.min(100, ((voltage - minV) / (maxV - minV)) * 100))

  let color = 'green'
  if (percent < 20) color = 'red'
  else if (percent < 50) color = 'orange'

  return {
    batteryColor: color,
    batteryPercent: Math.round(percent)
  }
}

// 计算信号等级
function computeSignalLevel(mapped) {
  const signal = extractNumeric(mapped?.signal)
  if (signal === null) return 0

  if (signal >= -70) return 4
  if (signal >= -85) return 3
  if (signal >= -100) return 2
  return 1
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// ==================== YZL设备管理函数 ====================

/**
 * 重新加载所有YZL设备数据
 * 从YZL API获取设备列表并处理数据
 */
async function reloadAll() {
  if (!activeApiKey.value) {
    devices.value = []
    deviceNames.value = []
    return
  }

  loading.value = true
  try {
    const response = await axios.get('/api/yzl/devices', {
      params: {
        apiKey: activeApiKey.value,
        skipCount: 0,
        maxResultCount: 500
      }
    })

    if (response.data.code === 0) {
      let items = []
      if (Array.isArray(response.data.data)) {
        items = response.data.data
      } else if (response.data.data && typeof response.data.data === 'object') {
        items = response.data.data.items || response.data.data.data || response.data.data.devices || response.data.data.list || []
      }

      devices.value = items.map(device => {
        const mapped = mapDeviceValues(device)
        const batteryUI = computeBatteryUI(mapped)
        const signalLevel = computeSignalLevel(mapped)
        return {
          ...device,
          __mapped: mapped,
          __batteryUI: batteryUI,
          __signalLevel: signalLevel
        }
      })

      deviceNames.value = devices.value.map(d => d.name || d.id)
      selectedDeviceIndex.value = 0

      if (devices.value.length) {
        ElMessage.success(`成功加载 ${devices.value.length} 个设备`)
        
        // 如果自动灌溉已启用，重置状态并重新检查
        if (autoIrrigation.value.enabled) {
          lastIrrigationState = null // 重置状态，允许重新控制
          checkHumidityAndControl()
        }
      } else {
        ElMessage.info('当前 API Key 下没有设备')
      }
    } else {
      ElMessage.error('获取设备列表失败: ' + (response.data.msg || '未知错误'))
    }
  } catch (error) {
    console.error('加载设备失败:', error)
    ElMessage.error('加载设备失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

/**
 * 处理设备选择改变事件
 * 切换设备时刷新历史数据
 */
function onDeviceChange() {
  refreshHistory()
}

/**
 * 刷新选中设备的历史数据
 * 获取最近7天的温度和湿度历史记录并绘制图表
 */
async function refreshHistory() {
  if (!devices.value.length) {
    ElMessage.warning('请先刷新获取设备列表')
    return
  }

  const device = devices.value[selectedDeviceIndex.value]
  if (!device) {
    return
  }

  historyLoading.value = true
  historyError.value = ''
  historyForbidden.value = false

  try {
    const now = new Date()
    // 扩大时间范围到7天，增加找到数据的可能性
    const before = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startTime = formatDate(before)
    const endTime = formatDate(now)

    // 检查是否有有效的 facilityId
    const tempFacilityId = device.__mapped?.tempFacilityId
    const humidityFacilityId = device.__mapped?.humidityFacilityId

    if (!tempFacilityId && !humidityFacilityId) {
      historyError.value = '当前设备没有温度或湿度传感器，无法获取历史数据'
      ElMessage.warning(historyError.value)
      historyLoading.value = false
      return
    }

    // 获取温度和湿度历史
    const promises = []
    if (tempFacilityId) {
      promises.push(
        axios.get('/api/yzl/history', {
          params: {
            apiKey: activeApiKey.value,
            facilityId: tempFacilityId,
            startTime,
            endTime,
            maxCount: 24
          }
        }).catch(err => {
          console.error('获取温度历史失败:', err.message)
          return null
        })
      )
    } else {
      promises.push(Promise.resolve(null))
    }

    if (humidityFacilityId) {
      promises.push(
        axios.get('/api/yzl/history', {
          params: {
            apiKey: activeApiKey.value,
            facilityId: humidityFacilityId,
            startTime,
            endTime,
            maxCount: 24
          }
        }).catch(err => {
          console.error('获取湿度历史失败:', err.message)
          return null
        })
      )
    } else {
      promises.push(Promise.resolve(null))
    }

    const [tempResponse, humidityResponse] = await Promise.all(promises)

    // 检查403权限错误
    if (tempResponse?.data?.__silentStatus === 403 || humidityResponse?.data?.__silentStatus === 403) {
      historyForbidden.value = true
      historyError.value = ''
      historyLoading.value = false
      return
    }

    // YZL API返回格式: { code: 0, data: { values: [...] } }
    const tempSeries = tempResponse?.data?.data?.values || []
    const humiditySeries = humidityResponse?.data?.data?.values || []

    // 更新历史数据
    tempMin.value = tempSeries.length ? Math.min(...tempSeries.map(s => s.value)).toFixed(2) : '--'
    tempMax.value = tempSeries.length ? Math.max(...tempSeries.map(s => s.value)).toFixed(2) : '--'
    humidityMin.value = humiditySeries.length ? Math.min(...humiditySeries.map(s => s.value)).toFixed(2) : '--'
    humidityMax.value = humiditySeries.length ? Math.max(...humiditySeries.map(s => s.value)).toFixed(2) : '--'

    // 绘制图表
    await nextTick()
    drawChart(tempChartRef.value, tempSeries, '#f97316', '温度 (°C)')
    drawChart(humidityChartRef.value, humiditySeries, '#0ea5e9', '湿度 (%)')

    if (tempSeries.length || humiditySeries.length) {
      ElMessage.success('历史数据已刷新')
    } else {
      ElMessage.info('当前时间段内暂无历史数据')
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
    historyError.value = '加载历史数据失败: ' + (error.response?.data?.error || error.message)
  } finally {
    historyLoading.value = false
  }
}

/**
 * 绘制历史数据图表
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Array} series - 数据序列
 * @param {string} color - 线条颜色
 * @param {string} label - 图表标签
 */
function drawChart(canvas, series, color, label) {
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  if (!series.length) {
    ctx.fillStyle = '#999'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', width / 2, height / 2)
    return
  }

  // 设置边距
  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 计算数据范围
  const values = series.map(s => s.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1

  // 绘制网格线
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    // Y轴标签
    const value = maxValue - (range / 5) * i
    ctx.fillStyle = '#666'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(value.toFixed(1), padding.left - 10, y + 4)
  }

  // 绘制数据线
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()

  series.forEach((point, index) => {
    const x = padding.left + (chartWidth / (series.length - 1)) * index
    const y = padding.top + chartHeight - ((point.value - minValue) / range) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // 绘制数据点
  ctx.fillStyle = color
  series.forEach((point, index) => {
    const x = padding.left + (chartWidth / (series.length - 1)) * index
    const y = padding.top + chartHeight - ((point.value - minValue) / range) * chartHeight

    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  // 绘制X轴标签
  ctx.fillStyle = '#666'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'

  const step = Math.ceil(series.length / 6)
  series.forEach((point, index) => {
    if (index % step === 0 || index === series.length - 1) {
      const x = padding.left + (chartWidth / (series.length - 1)) * index
      const time = new Date(point.time)
      const timeStr = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`
      ctx.fillText(timeStr, x, height - padding.bottom + 20)
    }
  })

  // 绘制标题
  ctx.fillStyle = '#333'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label, padding.left, 20)
}

// 初始化
onMounted(() => {
  // 如果有API Key，自动刷新YZL设备
  if (activeApiKey.value) {
    reloadAll().then(() => {
      // 设备加载完成后，自动刷新一次历史记录
      if (devices.value.length > 0) {
        setTimeout(() => {
          refreshHistory()
        }, 500) // 延迟500ms，确保设备数据已准备好
      }
    })
  }
  
  // 如果有涂鸦配置，自动刷新灌溉器状态
  const config = localStorage.getItem('irrigation_config')
  if (config) {
    try {
      const configData = JSON.parse(config)
      if (configData.deviceId) {
        refreshIrrigationStatus()
      }
    } catch (e) {
      console.error('解析涂鸦配置失败:', e)
    }
  }
  
  // 加载自动灌溉配置
  loadAutoIrrigationConfig()
  
  // 监听API Key更新事件
  window.addEventListener('yzl-apikey-updated', handleApiKeyUpdate)
  window.addEventListener('yzl-reload-devices', reloadAll)
})

// 清理事件监听
onUnmounted(() => {
  window.removeEventListener('yzl-apikey-updated', handleApiKeyUpdate)
  window.removeEventListener('yzl-reload-devices', reloadAll)
  
  // 清理自动灌溉定时器
  stopAutoCheck()
})

// 处理API Key更新
function handleApiKeyUpdate(event) {
  activeApiKey.value = event.detail
  if (activeApiKey.value) {
    reloadAll()
  }
}

// ==================== 涂鸦灌溉器控制函数 ====================

/**
 * 获取涂鸦灌溉器设备状态
 * 从涂鸦API读取设备当前状态并更新UI
 */
async function refreshIrrigationStatus() {
  const config = localStorage.getItem('irrigation_config')
  if (!config) {
    irrigationStatus.value = []
    return
  }
  
  try {
    const configData = JSON.parse(config)
    if (!configData.deviceId) {
      irrigationStatus.value = []
      return
    }
    
    irrigationRefreshing.value = true
    
    // 设置涂鸦配置请求头
    const headers = {}
    if (configData.clientId && configData.secret) {
      headers['tuya-client-id'] = configData.clientId
      headers['tuya-secret'] = configData.secret
    }
    
    const response = await axios.get('/api/device/status', {
      params: { deviceId: configData.deviceId },
      headers
    })
    
    if (response.data.success) {
      irrigationStatus.value = response.data.result
      updateSwitchStates()
      ElMessage.success('灌溉器状态已刷新')
    }
  } catch (error) {
    console.error('获取灌溉器状态失败:', error)
    ElMessage.error('获取灌溉器状态失败: ' + error.message)
  } finally {
    irrigationRefreshing.value = false
  }
}

/**
 * 获取灌溉器状态项的显示标签
 * @param {string} code - 状态码
 * @returns {string} 显示标签
 */
function getIrrigationStatusLabel(code) {
  const labels = {
    'switch_1': '开关1',
    'switch_2': '开关2',
    'countdown_1': '倒计时1',
    'countdown_2': '倒计时2',
    'battery_percentage': '电池电量'
  }
  return labels[code] || code
}

/**
 * 格式化灌溉器状态值的显示
 * @param {string} code - 状态码
 * @param {any} value - 状态值
 * @returns {string} 格式化后的显示文本
 */
function formatIrrigationStatusValue(code, value) {
  if (code === 'battery_percentage') {
    return value + '%'
  }
  if (code.startsWith('switch')) {
    return value ? '开启' : '关闭'
  }
  return value
}

/**
 * 发送控制命令到涂鸦灌溉器
 * @param {string} code - 控制代码（switch_1/switch_2）
 * @param {boolean} value - 控制值（true/false）
 */
async function sendCommand(code, value) {
  const config = localStorage.getItem('irrigation_config')
  if (!config) {
    throw new Error('请先配置涂鸦设备信息')
  }
  
  const configData = JSON.parse(config)
  if (!configData.deviceId) {
    throw new Error('请先配置涂鸦设备ID')
  }
  
  // 设置涂鸦配置请求头
  const headers = {}
  if (configData.clientId && configData.secret) {
    headers['tuya-client-id'] = configData.clientId
    headers['tuya-secret'] = configData.secret
  }
  
  const response = await axios.post('/api/device/command', {
    deviceId: configData.deviceId,
    code,
    value
  }, {
    headers
  })

  if (!response.data.success) {
    throw new Error(response.data.msg || response.data.error)
  }
}

/**
 * 处理开关1状态改变事件
 * @param {boolean} value - 新的开关状态
 */
async function handleSwitch1Change(value) {
  controlling.value = true
  try {
    await sendCommand('switch_1', value)
    ElMessage.success(`开关1已${value ? '开启' : '关闭'}`)
  } catch (error) {
    ElMessage.error('控制失败: ' + error.message)
    switch1.value = !value
  } finally {
    controlling.value = false
  }
}

/**
 * 处理开关2状态改变事件
 * @param {boolean} value - 新的开关状态
 */
async function handleSwitch2Change(value) {
  controlling.value = true
  try {
    await sendCommand('switch_2', value)
    ElMessage.success(`开关2已${value ? '开启' : '关闭'}`)
  } catch (error) {
    ElMessage.error('控制失败: ' + error.message)
    switch2.value = !value
  } finally {
    controlling.value = false
  }
}

/**
 * 全部开启 - 同时开启两个开关
 */
async function openAll() {
  controlling.value = true
  try {
    await Promise.all([
      sendCommand('switch_1', true),
      sendCommand('switch_2', true)
    ])
    ElMessage.success('已全部开启')
    switch1.value = true
    switch2.value = true
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    controlling.value = false
  }
}

/**
 * 全部关闭 - 同时关闭两个开关
 */
async function closeAll() {
  controlling.value = true
  try {
    await Promise.all([
      sendCommand('switch_1', false),
      sendCommand('switch_2', false)
    ])
    ElMessage.success('已全部关闭')
    switch1.value = false
    switch2.value = false
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    controlling.value = false
  }
}

/**
 * 更新本地开关状态以匹配设备实际状态
 */
function updateSwitchStates() {
  if (irrigationStatus.value.length > 0) {
    switch1.value = irrigationStatus.value.find(s => s.code === 'switch_1')?.value || false
    switch2.value = irrigationStatus.value.find(s => s.code === 'switch_2')?.value || false
  }
}

// ==================== 自动灌溉智能控制函数 ====================

/**
 * 处理自动灌溉开关切换事件
 * @param {boolean} enabled - 是否启用自动控制
 */
function handleAutoIrrigationToggle(enabled) {
  if (enabled) {
    // 启动时检查配置
    if (autoIrrigation.value.deviceId === null || autoIrrigation.value.deviceId === undefined) {
      ElMessage.warning('请先选择监控设备')
      autoIrrigation.value.enabled = false
      updateAutoIrrigationStatus('warning', '请选择设备')
      return
    }
    
    if (devices.value.length === 0) {
      ElMessage.warning('请先加载设备列表')
      autoIrrigation.value.enabled = false
      updateAutoIrrigationStatus('warning', '请加载设备')
      return
    }
    
    // 启动定时器，每30秒检查一次
    startAutoCheck()
    ElMessage.success('自动灌溉已启用')
    updateAutoIrrigationStatus('success', '运行中')
  } else {
    // 停止定时器
    stopAutoCheck()
    ElMessage.info('自动灌溉已禁用')
    updateAutoIrrigationStatus('info', '未启用')
  }
  
  // 保存到 localStorage
  saveAutoIrrigationConfig()
}

/**
 * 启动自动检查定时器
 * 立即执行一次检查，然后每30秒检查一次
 */
function startAutoCheck() {
  // 立即执行一次检查
  checkHumidityAndControl()
  
  // 设置定时器，每30秒检查一次
  autoCheckTimer = setInterval(() => {
    checkHumidityAndControl()
  }, 30000)
}

/**
 * 停止自动检查定时器
 */
function stopAutoCheck() {
  if (autoCheckTimer) {
    clearInterval(autoCheckTimer)
    autoCheckTimer = null
  }
}

// 记录上一次的灌溉状态，避免重复控制
let lastIrrigationState = null

/**
 * 检查湿度并执行自动控制
 * 根据当前湿度值与设定范围比较，自动控制灌溉器开关
 */
async function checkHumidityAndControl() {
  try {
    // 检查是否仍然启用
    if (!autoIrrigation.value.enabled) {
      return
    }
    
    const deviceId = autoIrrigation.value.deviceId
    if (deviceId === null || deviceId === undefined || !devices.value[deviceId]) {
      console.warn('未选择有效的监控设备')
      updateAutoIrrigationStatus('warning', '设备无效')
      return
    }
    
    // 获取最新的设备数据
    const device = devices.value[deviceId]
    const mapped = mapDeviceValues(device)
    const currentHumidity = extractNumeric(mapped.humidity)
    
    if (currentHumidity === null || currentHumidity === undefined) {
      console.warn('无法获取湿度数据')
      updateAutoIrrigationStatus('warning', '无法获取湿度')
      return
    }
    
    const minHumidity = autoIrrigation.value.minHumidity
    const maxHumidity = autoIrrigation.value.maxHumidity
    const controlSwitch = autoIrrigation.value.controlSwitch
    
    // 判断是否需要控制
    let needControl = false
    let shouldTurnOn = false
    
    // 湿度低于下限，需要开启灌溉
    if (currentHumidity < minHumidity) {
      shouldTurnOn = true
      needControl = true
    }
    // 湿度高于或等于上限，需要关闭灌溉
    else if (currentHumidity >= maxHumidity) {
      shouldTurnOn = false
      needControl = true
    }
    
    // 只有在状态改变时才执行控制，避免重复操作
    if (needControl && lastIrrigationState !== shouldTurnOn) {
      await executeIrrigationControl(controlSwitch, shouldTurnOn, currentHumidity)
      lastIrrigationState = shouldTurnOn
      
      if (shouldTurnOn) {
        updateAutoIrrigationStatus('success', `湿度过低(${currentHumidity.toFixed(1)}%)，已开启灌溉`)
      } else {
        updateAutoIrrigationStatus('info', `湿度达标(${currentHumidity.toFixed(1)}%)，已关闭灌溉`)
      }
    } else if (!needControl) {
      // 湿度在正常范围内
      updateAutoIrrigationStatus('success', `湿度正常(${currentHumidity.toFixed(1)}%)`)
    }
    // 如果 needControl 为 true 但 lastIrrigationState === shouldTurnOn，说明已经控制过，无需重复操作
    
    // 更新最后检查时间
    autoIrrigation.value.lastCheckTime = new Date().toLocaleString('zh-CN')
    
  } catch (error) {
    console.error('自动灌溉检查失败:', error)
    updateAutoIrrigationStatus('danger', '检查失败')
  }
}

/**
 * 执行灌溉控制操作
 * @param {string} controlSwitch - 控制的开关（switch_1/switch_2/both）
 * @param {boolean} turnOn - 是否开启
 * @param {number} currentHumidity - 当前湿度值
 */
async function executeIrrigationControl(controlSwitch, turnOn, currentHumidity) {
  const switches = []
  
  if (controlSwitch === 'switch_1' || controlSwitch === 'both') {
    switches.push('switch_1')
  }
  if (controlSwitch === 'switch_2' || controlSwitch === 'both') {
    switches.push('switch_2')
  }
  
  if (switches.length === 0) {
    console.warn('没有指定要控制的开关')
    return
  }
  
  for (const switchCode of switches) {
    try {
      await sendCommand(switchCode, turnOn)
    } catch (error) {
      console.error(`控制 ${switchCode} 失败:`, error)
      ElMessage.error(`控制${switchCode === 'switch_1' ? '开关1' : '开关2'}失败`)
    }
  }
  
  // 刷新状态
  await refreshIrrigationStatus()
}

/**
 * 更新自动灌溉状态显示
 * @param {string} type - 状态类型（success/info/warning/danger）
 * @param {string} text - 状态文本
 */
function updateAutoIrrigationStatus(type, text) {
  autoIrrigationStatus.value = { type, text }
}

/**
 * 自动灌溉配置更改后的处理
 * 保存配置并立即执行一次检查
 */
function onAutoIrrigationConfigChange() {
  // 保存配置
  saveAutoIrrigationConfig()
  
  // 如果自动灌溉已启用，立即执行一次检查
  if (autoIrrigation.value.enabled) {
    checkHumidityAndControl()
    ElMessage.success('配置已更新，正在执行检查')
  }
}

/**
 * 保存自动灌溉配置到localStorage
 */
function saveAutoIrrigationConfig() {
  try {
    localStorage.setItem('auto_irrigation_config', JSON.stringify(autoIrrigation.value))
  } catch (e) {
    console.error('保存自动灌溉配置失败:', e)
  }
}

/**
 * 从localStorage加载自动灌溉配置
 * 如果之前启用了自动控制，则重新启动定时器
 */
function loadAutoIrrigationConfig() {
  try {
    const config = localStorage.getItem('auto_irrigation_config')
    if (config) {
      const parsed = JSON.parse(config)
      autoIrrigation.value = { ...autoIrrigation.value, ...parsed }
      
      // 如果之前启用了，重新启动
      if (autoIrrigation.value.enabled) {
        startAutoCheck()
        updateAutoIrrigationStatus('success', '运行中')
      }
    }
  } catch (e) {
    console.error('加载自动灌溉配置失败:', e)
  }
}
</script>

<style scoped>
.device-monitor {
  max-width: 1400px;
  margin: 0 auto;
}

.realtime-card,
.irrigation-status-card,
.control-card,
.history-card {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease-out;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 实时数据样式 */
.devices-container {
  display: grid;
  gap: 20px;
}

.device-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fadeInUp 0.5s ease-out 0.1s both;
}

.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(16, 185, 129, 0.15);
}

.device-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.025em;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  min-width: 800px;
}

.metric-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.metric-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.metric-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.metric-value.temp {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-value.humidity {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.icon-metric .icon-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-text {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

/* 灌溉器状态网格 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 8px;
}

.status-item {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.status-item:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.status-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 控制面板样式 */
.control-item {
  margin-bottom: 16px;
}

.control-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.control-content:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.control-label {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.quick-actions {
  margin-top: 20px;
}

.quick-actions h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

/* 自动灌溉设置样式 */
.auto-irrigation-section {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.auto-irrigation-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-irrigation-section h3::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  border-radius: 2px;
}

.unit-text {
  margin-left: 8px;
  color: #6b7280;
  font-size: 14px;
}

.status-text {
  color: #6b7280;
  font-size: 14px;
}

/* Element Plus 表单样式覆盖 */
:deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 带单位的输入框样式 */
.input-with-unit {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.unit-badge {
  flex-shrink: 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  transition: all 0.3s ease;
}

.unit-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

/* 信号图标 */
.signal-icon {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
  padding: 2px;
}

.signal-bar {
  width: 5px;
  background: #e5e7eb;
  border-radius: 3px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.signal-bar.s1 { height: 6px; }
.signal-bar.s2 { height: 12px; }
.signal-bar.s3 { height: 18px; }
.signal-bar.s4 { height: 24px; }

.signal-bar.active {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

/* 电池图标 */
.battery-icon {
  display: flex;
  align-items: center;
}

.battery-head {
  width: 4px;
  height: 10px;
  background: #d1d5db;
  border-radius: 2px 0 0 2px;
  margin-right: 2px;
  transition: all 0.3s ease;
}

.battery-body {
  width: 36px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.battery-fill {
  height: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.battery-head.green, .battery-body.green, .battery-fill.green {
  border-color: #10b981;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.battery-head.orange, .battery-body.orange, .battery-fill.orange {
  border-color: #f59e0b;
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.battery-head.red, .battery-body.red, .battery-fill.red {
  border-color: #ef4444;
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.battery-head.gray, .battery-body.gray, .battery-fill.gray {
  border-color: #9ca3af;
  background: linear-gradient(90deg, #9ca3af 0%, #6b7280 100%);
}

/* 历史数据样式 */
.history-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-range {
  font-size: 13px;
  color: #059669;
  font-weight: 500;
  padding: 4px 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.chart-range:hover {
  background: rgba(16, 185, 129, 0.15);
  transform: scale(1.05);
}

.chart-canvas {
  width: 100%;
  height: 300px;
}

.chart-inner-card {
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.chart-inner-card:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 按钮交互优化 */
:deep(.el-button) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

:deep(.el-button:active) {
  transform: translateY(0);
}

/* 输入框优化 */
:deep(.el-input__wrapper) {
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #10b981 inset;
}

/* 选择器优化 */
:deep(.el-select) {
  transition: all 0.3s ease;
}

/* 卡片头部图标 */
:deep(.el-card__header .el-icon) {
  color: #10b981;
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .device-card {
    padding: 16px;
  }
  
  .history-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
