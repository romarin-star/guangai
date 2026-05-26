const { setCorsHeaders, jsonError, handleOptions } = require('../utils')
const { requestJson, buildQueryString } = require('../yzl')

module.exports = async (req, res) => {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    return jsonError(res, 405, 'Method Not Allowed')
  }

  try {
    const { apiKey, skipCount = 0, maxResultCount = 500, pollingTag } = req.query
    if (!apiKey) {
      return jsonError(res, 400, 'API Key is required')
    }

    const params = {
      SkipCount: parseInt(skipCount, 10),
      MaxResultCount: parseInt(maxResultCount, 10)
    }
    let url = 'https://open.yzlkj.com/open/device/list'
    if (pollingTag !== undefined) {
      url = 'https://open.yzlkj.com/open/device/all'
      params.PollingTag = pollingTag
    }

    const fullUrl = `${url}?${buildQueryString(params)}`
    const result = await requestJson(fullUrl, {
      'content-type': 'application/json',
      'YZLIOT-APIKEY': apiKey
    })

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  } catch (error) {
    console.error('获取设备列表失败:', error.message)
    jsonError(res, 500, error.message)
  }
}
