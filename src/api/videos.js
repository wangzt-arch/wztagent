/**
 * 视频生成 API 模块
 * 封装与视频生成相关的接口调用（创建任务、查询状态、获取结果）
 * 基于 Agnes Video V2.0 接口规范
 */
import { request, getBaseUrlRaw, getApiKeyRaw } from './client.js'

// 判断是否为开发环境
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

/**
 * 创建视频生成任务
 * 响应同时包含 task_id 和 video_id，推荐使用 video_id 查询结果
 * @param {object} body - 请求体
 * @param {string} body.model - 模型名称
 * @param {string} body.prompt - 视频描述
 * @param {number} body.num_frames - 帧数
 * @param {number} body.frame_rate - 帧率
 * @param {string} [body.negative_prompt] - 负面提示词
 * @param {string} [body.image] - 参考图片（图生视频模式）
 * @param {function} [onRetry] - 重试回调函数
 * @returns {Promise<{taskId: string, videoId: string}>} 任务 ID 和视频 ID（推荐使用 videoId 查询结果）
 * @throws {Error} 请求失败
 */
export async function createVideo(body, onRetry) {
  const res = await request('/videos', {
    method: 'POST',
    body: JSON.stringify(body)
  }, { onRetry })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const taskId = data.id || data.task_id
  const videoId = data.video_id || taskId
  return { taskId, videoId }
}

/**
 * 构建 /agnesapi 端点的完整 URL（此端点不在 /v1 路径下）
 * 开发环境：走 vite 的 /agnesapi 代理
 * 生产环境：从 baseUrl 去掉 /v1 后拼接 /agnesapi
 * @param {string} videoId - 视频 ID
 * @param {string} [modelName] - 可选模型名称
 * @returns {string} 完整 URL
 */
function buildAgnesApiUrl(videoId, modelName) {
  const query = 'video_id=' + encodeURIComponent(videoId) +
    (modelName ? '&model_name=' + encodeURIComponent(modelName) : '')
  if (isDev) {
    return '/agnesapi?' + query
  }
  const rawBase = getBaseUrlRaw() || 'https://api.agnes-ai.cn/v1'
  const root = rawBase.replace(/\/v1\/?$/, '')
  return root + '/agnesapi?' + query
}

/**
 * 使用 videoId 获取视频结果（推荐方式，v2.0 文档推荐端点）
 * 文档：GET /agnesapi?video_id=<VIDEO_ID>
 * @param {string} videoId - 视频 ID
 * @param {string} [modelName] - 可选模型名称
 * @returns {Promise<object>} 任务状态数据（status, progress, metadata.url 等）
 * @throws {Error} 请求失败
 */
export async function getVideoResult(videoId, modelName) {
  const url = buildAgnesApiUrl(videoId, modelName)
  const key = getApiKeyRaw()
  const headers = { Authorization: 'Bearer ' + key }

  let lastError
  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers })
      if (res.ok) return res.json()
      const isRetryable = res.status === 503 || res.status === 502 || res.status === 504 || res.status === 429
      if (!isRetryable || attempt === maxRetries) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise(r => setTimeout(r, delay))
    } catch (err) {
      lastError = err
      if (attempt === maxRetries) throw err
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastError || new Error('Max retries exceeded')
}

/**
 * 从视频状态响应中提取并清洗最终视频 URL
 * 兼容多种响应结构：
 *   新版推荐端点 /agnesapi → 顶层 data.url
 *   旧版 /videos/{taskId}  → metadata.url / output.video_url / video_url
 * 同时清洗 URL 中可能存在的反引号包裹字符（示例：`https://...mp4`）
 * @param {object} data - 接口响应数据
 * @returns {string|null} 清洗后的视频 URL，或 null
 */
function extractVideoUrl(data) {
  if (!data) return null
  const raw =
    data.url ||
    data?.metadata?.url ||
    data?.output?.video_url ||
    data?.video_url ||
    null
  if (!raw) return null
  // 去除可能存在的反引号包裹字符、首尾空白
  return String(raw).replace(/^`+|`+$/g, '').trim() || null
}

/**
 * 查询视频任务状态（兼容旧版：使用 taskId，端点 /v1/videos/{taskId}）
 * 保留用于向后兼容旧数据，新代码请使用 getVideoResult
 * @param {string} taskId - 任务 ID
 * @returns {Promise<object>} 任务状态数据
 * @throws {Error} 请求失败
 */
export async function getVideoStatus(taskId) {
  const res = await request('/videos/' + taskId, {}, { maxRetries: 2 })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

/**
 * 获取视频 URL（优先使用 videoId 走推荐端点，失败时回退到旧版 taskId）
 * @param {string} videoId - 视频 ID（推荐）
 * @param {string} [taskId] - 可选任务 ID（videoId 不存在或失败时回退）
 * @returns {Promise<string|null>} 视频 URL（可能为 null）
 */
export async function getVideoUrl(videoId, taskId) {
  let err1
  if (videoId) {
    try {
      const data = await getVideoResult(videoId)
      const url = extractVideoUrl(data)
      if (url) return url
    } catch (e) { err1 = e }
  }
  if (taskId) {
    try {
      const data = await getVideoStatus(taskId)
      const url = extractVideoUrl(data)
      if (url) return url
    } catch (e) {
      if (err1) throw err1
      throw e
    }
  }
  return null
}

export { extractVideoUrl }
