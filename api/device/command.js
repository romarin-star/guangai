const { setCorsHeaders, handleOptions, jsonError } = require('../utils')
const { setConfigFromHeaders, getAccessToken, sendTuyaRequest } = require('../tuya')

module.exports = async (req, res) => {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method Not Allowed')
  }

  try {
    const { deviceId, code, value } = req.body || {}
    if (!deviceId || !code || value === undefined) {
      return jsonError(res, 400, 'deviceId, code and value are required')
    }

    setConfigFromHeaders(req)
    await getAccessToken()
    const body = { commands: [{ code, value }] }
    const result = await sendTuyaRequest('POST', `/v1.0/devices/${deviceId}/commands`, {}, {}, body, true)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result.data))
  } catch (error) {
    console.error('控制设备失败:', error.message)
    jsonError(res, 500, error.message)
  }
}
