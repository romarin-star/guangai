const crypto = require('crypto')
const https = require('https')

let config = {
  url: 'https://openapi.tuyacn.com',
  client_id: process.env.TUYA_CLIENT_ID || process.env.TUYA_CLIENTID || '',
  secret: process.env.TUYA_CLIENT_SECRET || process.env.TUYA_SECRET || ''
}

let accessToken = ''
let tokenExpireTime = 0

function generateTokenSign(clientId, timestamp, nonce, signStr, secret) {
  const str = clientId + timestamp + nonce + signStr
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase()
}

function generateBusinessSign(clientId, accessToken, timestamp, nonce, signStr, secret) {
  const str = clientId + accessToken + timestamp + nonce + signStr
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase()
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
      client_id: config.client_id,
      t: timestamp,
      sign_method: 'HMAC-SHA256',
      nonce: nonce,
      ...headers
    }

    if (accessToken) {
      requestHeaders.access_token = accessToken
    }

    const stringToSign = generateStringToSign(method, requestHeaders, body, path, queryParams)
    let sign
    if (useBusinessSign && accessToken) {
      sign = generateBusinessSign(config.client_id, accessToken, timestamp, nonce, stringToSign, config.secret)
    } else {
      sign = generateTokenSign(config.client_id, timestamp, nonce, stringToSign, config.secret)
    }
    requestHeaders.sign = sign

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
    throw new Error('涂鸦配置未设置，请先在系统配置中填写Client ID和Secret或在请求头中提供')
  }

  const result = await sendTuyaRequest('GET', '/v1.0/token', { grant_type: '1' })
  if (result.data && result.data.success) {
    accessToken = result.data.result.access_token
    tokenExpireTime = Date.now() + (result.data.result.expire_time || 7200) * 1000
    return accessToken
  }

  throw new Error(result.data?.msg || '获取Token失败')
}

function setConfigFromHeaders(req) {
  const headerClientId = req.headers['tuya-client-id']
  const headerSecret = req.headers['tuya-secret']

  if (headerClientId && headerSecret) {
    if (config.client_id !== headerClientId || config.secret !== headerSecret) {
      accessToken = ''
      tokenExpireTime = 0
    }
    config.client_id = headerClientId
    config.secret = headerSecret
  }
}

module.exports = {
  setConfigFromHeaders,
  getAccessToken,
  sendTuyaRequest
}
