/**
 * API 模块统一导出
 * 通过此文件导入所有 API 方法，避免分散引用
 */
export { setApiKey, setBaseUrl, DEFAULT_BASE_URL } from './client.js'
export { generateImage, testConnection } from './images.js'
export { createVideo, getVideoStatus, getVideoResult, getVideoUrl, extractVideoUrl } from './videos.js'
export { chat } from './chat.js'