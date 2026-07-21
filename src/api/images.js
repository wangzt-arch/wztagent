/**
 * 图片生成 API 模块
 * 封装与图片生成相关的接口调用
 */
import { request } from './client.js'

/**
 * 生成图片
 * @param {object} body - 请求体
 * @param {string} body.model - 模型名称
 * @param {string} body.prompt - 提示词
 * @param {string} body.size - 图片尺寸
 * @param {string} [body.negative_prompt] - 负面提示词
 * @param {string} [body.image] - 参考图片（图生图模式）
 * @param {function} [onRetry] - 重试回调函数
 * @returns {Promise<string>} 生成的图片 URL
 * @throws {Error} 请求失败或未获取到图片 URL
 */
export async function generateImage(body, onRetry) {
  const res = await request('/images/generations', {
    method: 'POST',
    body: JSON.stringify(body)
  }, { onRetry })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  let url = null

  // 兼容多种返回格式：OpenAI 格式 / 自定义格式
  if (data.data?.[0]?.url) {
    url = data.data[0].url
  } else if (data.data?.[0]?.b64_json) {
    url = 'data:image/png;base64,' + data.data[0].b64_json
  } else if (data.url) {
    url = data.url
  } else if (data.output_url) {
    url = data.output_url
  }

  if (!url) throw new Error('未获取到图片 URL')
  return url
}

/**
 * 测试 API 连接状态
 * 调用 /models 接口验证 API Key 是否有效
 * @returns {Promise<boolean>} 连接是否成功
 */
export async function testConnection() {
  const res = await request('/models')
  return res.ok
}