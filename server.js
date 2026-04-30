// AI辅助生成：全栈服务器 - 同时服务前端和后端API
const express = require('express')
const path = require('path')
const cors = require('cors')
const crypto = require('crypto')
const https = require('https')

const app = express()
const PORT = process.env.PORT || 3000

// 启用 CORS 和 JSON 解析
app.use(cors())
app.use(express.json())

// 后端配置
let config = {
  url: 'https://openapi.tuyacn.com',
  client_id: '',
  secret: ''
}

let accessToken = ''
let tokenExpireTime = 0

// 涂鸦 API 签名函数
function generateTokenSign(clientId, timestamp, nonce, signStr, secret) {
  const str = clientId + timestamp + nonce + signStr
  const hash = crypto.createHmac('sha256', secret).update(str).digest('hex')
  return hash.toUpperCase()
}

function generateBusinessSign(clientId, accessToken, timestamp, nonce, signStr, secret) {
  const str = clientId + accessToken + timestamp + nonce + signStr
  const hash = crypto.createHmac('sha256', secret).update(str).digest('hex')
  return hash.toUpperCase()
}

function generateStringToSign(method, headers, body, path, queryParams) {
  const bodyStr = body ? JSON.stringify(body) : ''
  const sha256 = crypto.createHash('sha256').update(bodyStr).digest('hex')
  
  let url = path
  if (queryParams && Object.keys(queryParams).length > 0) {
    const sortedKeys = Object.keys(queryParams).sort()
    const queryStr = sortedKeys.map(key => `${key}=${queryParams[key]}`).join('&')
    url += '?' + queryStr
  }
  
  let headersStr = ''
  if (headers['Signature-Headers']) {
    const signHeaderKeys = headers['Signature-Headers'].split(':')
    signHeaderKeys.forEach(key => {
      const value = headers[key] || ''
      headersStr += `${key}:${value}\n`
    })
  }
  
  return `${method}\n${sha256}\n${headersStr}\n${url}`
}

function sendTuyaRequest(method, path, queryParams = {}, headers = {}, body = null, useBusinessSign = false) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString()
    const nonce = Math.random().toString(36).substring(2, 15)
    
    const requestHeaders = {
      'client_id': config.client_id,
      't': timestamp,
      'sign_method': 'HMAC-SHA256',
      'nonce': nonce,
      ...headers
    }
    
    if (accessToken) {
      requestHeaders['access_token'] = accessToken
    }
    
    const stringToSign = generateStringToSign(method, requestHeaders, body, path, queryParams)
    let sign
    if (useBusinessSign && accessToken) {
      sign = generateBusinessSign(config.client_id, accessToken, timestamp, nonce, stringToSign, config.secret)
    } else {
      sign = generateTokenSign(config.client_id, timestamp, nonce, stringToSign, config.secret)
    }
    requestHeaders['sign'] = sign
    
    let fullUrl = config.url + path
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryStr = Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`).join('&')
      fullUrl += '?' + queryStr
    }
    
    const urlObj = new URL(fullUrl)
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: requestHeaders
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) })
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data })
        }
      })
    })
    
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpireTime - 5 * 60 * 1000) {
    return accessToken
  }

  if (!config.client_id || !config.secret) {
    throw new Error('涂鸦配置未设置，请先在系统配置中填写Client ID和Secret')
  }

  const result = await sendTuyaRequest('GET', '/v1.0/token', { grant_type: '1' })
  
  if (result.data.success) {
    accessToken = result.data.result.access_token
    tokenExpireTime = Date.now() + (result.data.result.expire_time || 7200) * 1000
    console.log('涂鸦Token已刷新')
    return accessToken
  } else {
    throw new Error(result.data.msg || '获取Token失败')
  }
}

// ==================== API 路由 ====================

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '智灌管家全栈服务运行中',
    version: '1.0.0',
    frontend: '已启用',
    backend: '已启用',
    endpoints: {
      deviceInfo: '/api/device/info?deviceId=xxx',
      deviceStatus: '/api/device/status?deviceId=xxx',
      deviceCommand: 'POST /api/device/command',
      yzlDevices: '/api/yzl/devices?apiKey=xxx',
      yzlHistory: '/api/yzl/history?apiKey=xxx&facilityId=xxx'
    }
  })
})

// 涂鸦 API 路由
app.get('/api/device/info', async (req, res) => {
  try {
    const deviceId = req.query.deviceId
    
    if (req.headers['tuya-client-id'] && req.headers['tuya-secret']) {
      config.client_id = req.headers['tuya-client-id']
      config.secret = req.headers['tuya-secret']
      accessToken = ''
    }
    
    await getAccessToken()
    const result = await sendTuyaRequest('GET', `/v1.0/devices/${deviceId}`, {}, {}, null, true)
    res.json(result.data)
  } catch (error) {
    console.error('获取设备信息失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/device/status', async (req, res) => {
  try {
    const deviceId = req.query.deviceId
    
    if (req.headers['tuya-client-id'] && req.headers['tuya-secret']) {
      config.client_id = req.headers['tuya-client-id']
      config.secret = req.headers['tuya-secret']
      accessToken = ''
    }
    
    await getAccessToken()
    const result = await sendTuyaRequest('GET', `/v1.0/devices/${deviceId}/status`, {}, {}, null, true)
    res.json(result.data)
  } catch (error) {
    console.error('获取设备状态失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/device/command', async (req, res) => {
  try {
    const { deviceId, code, value } = req.body
    
    if (req.headers['tuya-client-id'] && req.headers['tuya-secret']) {
      config.client_id = req.headers['tuya-client-id']
      config.secret = req.headers['tuya-secret']
      accessToken = ''
    }
    
    await getAccessToken()
    const body = { commands: [{ code, value }] }
    const result = await sendTuyaRequest('POST', `/v1.0/devices/${deviceId}/commands`, {}, {}, body, true)
    res.json(result.data)
  } catch (error) {
    console.error('控制设备失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// YZL API 路由
app.get('/api/yzl/devices', async (req, res) => {
  try {
    const { apiKey, skipCount = 0, maxResultCount = 500, pollingTag } = req.query
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' })
    }

    let url = 'https://open.yzlkj.com/open/device/list'
    const params = {
      SkipCount: parseInt(skipCount),
      MaxResultCount: parseInt(maxResultCount)
    }

    if (pollingTag !== undefined) {
      url = 'https://open.yzlkj.com/open/device/all'
      params.PollingTag = pollingTag
    }

    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const fullUrl = `${url}?${queryString}`

    const result = await new Promise((resolve, reject) => {
      https.get(fullUrl, {
        headers: {
          'content-type': 'application/json',
          'YZLIOT-APIKEY': apiKey
        },
        timeout: 15000
      }, (response) => {
        let data = ''
        response.on('data', chunk => { data += chunk })
        response.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve({ error: 'Failed to parse response' })
          }
        })
      }).on('error', reject)
    })

    res.json(result)
  } catch (error) {
    console.error('获取设备列表失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/yzl/history', async (req, res) => {
  try {
    const { apiKey, facilityId, startTime, endTime, maxCount = 24 } = req.query
    
    if (!apiKey || !facilityId) {
      return res.status(400).json({ error: 'API Key and facilityId are required' })
    }

    const params = {
      facilityId,
      StartTime: startTime,
      EndTime: endTime,
      MaxCount: parseInt(maxCount)
    }
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const fullUrl = `https://open.yzlkj.com/open/history?${queryString}`

    const result = await new Promise((resolve, reject) => {
      https.get(fullUrl, {
        headers: {
          'content-type': 'application/json',
          'YZLIOT-APIKEY': apiKey
        },
        timeout: 15000
      }, (response) => {
        let data = ''
        response.on('data', chunk => { data += chunk })
        response.on('end', () => {
          try {
            const parsedData = JSON.parse(data)
            if (response.statusCode === 403) {
              resolve({ code: -1, msg: '无历史数据权限', __silentStatus: 403 })
            } else {
              resolve(parsedData)
            }
          } catch (e) {
            resolve({ error: 'Failed to parse response' })
          }
        })
      }).on('error', reject)
    })

    res.json(result)
  } catch (error) {
    console.error('获取历史数据失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 前端静态文件服务
app.use(express.static(path.join(__dirname, 'dist')))

// 所有其他路由返回前端 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`)
  console.log(`  智灌管家全栈服务已启动`)
  console.log(`  端口: http://0.0.0.0:${PORT}`)
  console.log(`  前端: 已启用`)
  console.log(`  后端: 已启用`)
  console.log(`========================================\n`)
})
