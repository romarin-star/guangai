const { setCorsHeaders, jsonError, handleOptions } = require('../utils')
const { requestJson, buildQueryString } = require('../yzl')

module.exports = async (req, res) => {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    return jsonError(res, 405, 'Method Not Allowed')
  }

  try {
    const { apiKey, facilityId, startTime, endTime, maxCount = 24 } = req.query
    if (!apiKey || !facilityId) {
      return jsonError(res, 400, 'API Key and facilityId are required')
    }

    const params = {
      facilityId,
      StartTime: startTime,
      EndTime: endTime,
      MaxCount: parseInt(maxCount, 10)
    }
    const fullUrl = `https://open.yzlkj.com/open/history?${buildQueryString(params)}`
    const result = await requestJson(fullUrl, {
      'content-type': 'application/json',
      'YZLIOT-APIKEY': apiKey
    })

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  } catch (error) {
    console.error('获取历史数据失败:', error.message)
    jsonError(res, 500, error.message)
  }
}
