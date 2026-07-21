/**
 * 视频生成 API 模块
 * 封装与视频生成相关的接口调用（创建任务、查询状态、获取结果）
 */
import { request } from './client.js'

/**
 * 创建视频生成任务
 * @param {object} body - 请求体
 * @param {string} body.model - 模型名称
 * @param {string} body.prompt - 视频描述
 * @param {number} body.num_frames - 帧数
 * @param {number} body.frame_rate - 帧率
 * @param {string} [body.negative_prompt] - 负面提示词
 * @param {string} [body.image] - 参考图片（图生视频模式）
 * @param {function} [onRetry] - 重试回调函数
 * @returns {Promise<string>} 任务 ID
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
  return data.id || data.task_id
}

/**
 * 查询视频任务状态
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
 * 获取视频 URL
 * @param {string} taskId - 任务 ID
 * @returns {Promise<string|null>} 视频 URL（可能为 null）
 */
export async function getVideoUrl(taskId) {
  const data = await getVideoStatus(taskId)
  return data?.metadata?.url || data.output?.video_url || data.video_url
}