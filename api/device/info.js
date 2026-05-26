const { setCorsHeaders, handleOptions, jsonError } = require('../utils')
const { setConfigFromHeaders, getAccessToken, sendTuyaRequest } = require('../tuya')

module.exports = async (req, res) => {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    return jsonError(res, 405, 'Method Not Allowed')
  }

  try {
    const deviceId = req.query.deviceId
    if (!deviceId) {
      return jsonError(res, 400, 'deviceId is required')
    }

    setConfigFromHeaders(req)
    await getAccessToken()
    const result = await sendTuyaRequest('GET', `/v1.0/devices/${deviceId}`, {}, {}, null, true)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result.data))
  } catch (error) {
    console.error('获取设备信息失败:', error.message)
    jsonError(res, 500, error.message)
  }
}
