/**
 * API 模块统一导出
 * 通过此文件导入所有 API 方法，避免分散引用
 */
export { setApiKey, setBaseUrl } from './client.js'
export { generateImage, testConnection } from './images.js'
export { createVideo, getVideoStatus, getVideoUrl } from './videos.js'
export { chat } from './chat.js'