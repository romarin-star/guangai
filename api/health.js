const { setCorsHeaders, handleOptions } = require('./utils')

module.exports = async (req, res) => {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    message: '智灌管家后端服务运行中',
    version: '1.0.0',
    endpoints: {
      deviceInfo: '/api/device/info?deviceId=xxx',
      deviceStatus: '/api/device/status?deviceId=xxx',
      deviceCommand: 'POST /api/device/command',
      yzlDevices: '/api/yzl/devices?apiKey=xxx',
      yzlHistory: '/api/yzl/history?apiKey=xxx&facilityId=xxx'
    }
  }))
}
