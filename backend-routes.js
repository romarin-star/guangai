// backend-routes.js - 后端 API 路由模块
const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const https = require('https')

const router = express.Router()

let config = {
  url: 'https://openapi.tuyacn.com',
  client_id: '',
  secret: ''
}

let accessToken = ''
let tokenExpireTime = 0

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

router.get('/device/info', async (req, res) => {
  try {
    const deviceId = req.query.deviceId
    
    if (req.headers['tuya-client-id'] && req.headers['tuya-secret']) {
      const newClientId = req.headers['tuya-client-id']
      const newSecret = req.headers['tuya-secret']
      
      if (config.client_id !== newClientId || config.secret !== newSecret) {
        accessToken = ''
        tokenExpireTime = 0
        console.log('检测到配置变化，已清除旧Token')
      }
      
      config.client_id = newClientId
      config.secret = newSecret
    }
    
    await getAccessToken()
    const result = await sendTuyaRequest('GET', `/v1.0/devices/${deviceId}`, {}, {}, null, true)
    res.json(result.data)
  } catch (error) {
    console.error('获取设备信息失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

router.get('/device/status', async (req, res) => {
  try {
    const deviceId = req.query.deviceId
    
    if (req.headers['tuya-client-id'] && req.headers['tuya-secret']) {
      const newClientId = req.headers['tuya-client-id']
      const newSecret = req.headers['tuya-secret']
      
      if (config.client_id !== newClientId || config.secret !== newSecret) {
        accessToken = ''
        tokenExpireTime = 0
        console.log('检测到配置变化，已清除旧Token')
      }
      
      config.client_id = newClientId
      config.secret = newSecret
    }
    
    await getAccessToken()
    const result = await sendTuyaRequest('GET', `/v1.0/devices/${deviceId}/status`, {}, {}, null, true)
    res.json(result.data)
  } catch (error) {
    console.error('获取设备状态失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// API: 控制设备
router.post('/device/command', async (req, res) => {
  try {
    const { deviceId, code, value } = req.body
    
    // 从请求头获取涂鸦配置
    if (req.headers['tuya-client-id'] && req.headers['tuya-secret']) {
      const newClientId = req.headers['tuya-client-id']
      const newSecret = req.headers['tuya-secret']
      
      // 如果配置发生变化，清除旧token
      if (config.client_id !== newClientId || config.secret !== newSecret) {
        accessToken = ''
        tokenExpireTime = 0
        console.log('检测到配置变化，已清除旧Token')
      }
      
      config.client_id = newClientId
      config.secret = newSecret
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

// API: 获取设备列表（YZL）
router.get('/yzl/devices', async (req, res) => {
  try {
    const { apiKey, skipCount = 0, maxResultCount = 500, pollingTag } = req.query
    
    console.log('收到设备列表请求:', { apiKey: apiKey ? apiKey.substring(0, 8) + '...' : '未提供', skipCount, maxResultCount })
    
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

    // 构建查询字符串
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const fullUrl = `${url}?${queryString}`

    console.log('调用YZL API:', fullUrl)

    // 发送HTTPS请求
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
            console.log('YZL API响应:', JSON.stringify(parsedData, null, 2).substring(0, 500))
            resolve(parsedData)
          } catch (e) {
            console.error('解析响应失败:', e.message)
            resolve({ error: 'Failed to parse response' })
          }
        })
      }).on('error', (err) => {
        console.error('HTTPS请求错误:', err.message)
        reject(err)
      })
    })

    res.json(result)
  } catch (error) {
    console.error('获取设备列表失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// API: 获取历史数据（YZL）
router.get('/yzl/history', async (req, res) => {
  try {
    const { apiKey, facilityId, startTime, endTime, maxCount = 24 } = req.query
    
    console.log('收到历史数据请求:', { 
      apiKey: apiKey ? apiKey.substring(0, 8) + '...' : '未提供', 
      facilityId,
      startTime,
      endTime,
      maxCount 
    })
    
    if (!apiKey || !facilityId) {
      console.error('缺少必要参数:', { apiKey: !!apiKey, facilityId: !!facilityId })
      return res.status(400).json({ error: 'API Key and facilityId are required' })
    }

    // 构建查询字符串
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

    console.log('调用YZL历史API:', fullUrl)

    // 发送HTTPS请求
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
            console.log('YZL历史API响应:', JSON.stringify(parsedData, null, 2).substring(0, 500))
            if (response.statusCode === 403) {
              resolve({ 
                code: -1, 
                msg: '无历史数据权限',
                __silentStatus: 403 
              })
            } else {
              resolve(parsedData)
            }
          } catch (e) {
            console.error('解析历史响应失败:', e.message)
            resolve({ error: 'Failed to parse response' })
          }
        })
      }).on('error', (err) => {
        console.error('历史HTTPS请求错误:', err.message)
        reject(err)
      })
    })

    res.json(result)
  } catch (error) {
    console.error('获取历史数据失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
