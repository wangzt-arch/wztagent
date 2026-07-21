/**
 * API 客户端基础模块
 * 负责封装底层请求逻辑、鉴权处理和重试机制
 */
import { ref } from 'vue'

// 判断是否为开发环境
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

// API 配置状态（响应式）
const apiKey = ref('')
const baseUrl = ref('https://apihub.agnes-ai.com/v1')

/**
 * 设置 API Key（用于鉴权）
 * @param {string} key - API 密钥
 */
export function setApiKey(key) { apiKey.value = key }

/**
 * 设置 API 基础地址
 * @param {string} url - API 服务地址
 */
export function setBaseUrl(url) { baseUrl.value = url }

/**
 * 获取 API 基础 URL
 * 开发环境走 Vite 代理，生产环境使用配置的地址
 * @returns {string} API 基础地址
 */
function getApiBaseUrl() {
  if (isDev) return '/api'
  return baseUrl.value
}

/**
 * 带重试机制的 fetch 请求
 * 支持指数退避策略，自动处理可重试状态码（502/503/504/429）
 * @param {string} url - 请求地址
 * @param {object} options - fetch 选项
 * @param {object} retryConfig - 重试配置
 * @param {number} retryConfig.maxRetries - 最大重试次数（默认3）
 * @param {function} retryConfig.onRetry - 重试回调 (attempt, max, status)
 * @returns {Promise<Response>} 响应对象
 */
async function fetchWithRetry(url, options, { maxRetries = 3, onRetry } = {}) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res

      // 判断是否为可重试的状态码
      const isRetryable = res.status === 503 || res.status === 502 || res.status === 504 || res.status === 429
      if (!isRetryable || attempt === maxRetries) {
        return res
      }

      // 指数退避：1s → 2s → 4s → 最大8s
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      if (onRetry) onRetry(attempt + 1, maxRetries, res.status)
      await new Promise(r => setTimeout(r, delay))
    } catch (err) {
      lastError = err
      if (attempt === maxRetries) throw err
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      if (onRetry) onRetry(attempt + 1, maxRetries, 'network')
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastError || new Error('Max retries exceeded')
}

/**
 * 统一请求方法
 * 自动拼接基础 URL、添加鉴权头和 Content-Type
 * @param {string} path - 接口路径（如 /images/generations）
 * @param {object} options - fetch 选项（不含 headers）
 * @param {object} retryConfig - 重试配置
 * @returns {Promise<Response>} 响应对象
 */
export async function request(path, options = {}, retryConfig = {}) {
  const url = getApiBaseUrl() + path
  const headers = {
    Authorization: 'Bearer ' + apiKey.value,
    'Content-Type': 'application/json',
    ...options.headers
  }
  return fetchWithRetry(url, { ...options, headers }, retryConfig)
}