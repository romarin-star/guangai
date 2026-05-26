const https = require('https')

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, tuya-client-id, tuya-secret')
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}

function buildQueryString(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

function requestJson(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers, timeout: 15000 }, (response) => {
      let data = ''
      response.on('data', (chunk) => { data += chunk })
      response.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (error) {
          reject(new Error('解析响应失败: ' + error.message))
        }
      })
    }).on('error', reject)
  })
}

module.exports = {
  handleOptions,
  requestJson,
  buildQueryString
}
