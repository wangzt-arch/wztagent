/**
 * 应用状态管理 Store
 * 使用 Vue 3 Composition API 的组合式函数模式
 * 负责管理全局状态、业务逻辑和用户交互
 */
import { ref, computed, watch } from 'vue'
import { setApiKey, setBaseUrl, generateImage, testConnection, createVideo, getVideoStatus, getVideoUrl } from '../api/index.js'

// ==================== 导航状态 ====================

/** 当前选中的标签页：create | gallery | settings */
const currentTab = ref('create')
/** 当前媒体类型：image | video */
const mediaType = ref('image')
/** 图片生成模式：txt2img | img2img */
const imageMode = ref('txt2img')
/** 视频生成模式：txt2vid | img2vid */
const videoMode = ref('txt2vid')

// ==================== 图片生成状态 ====================

/** 图片提示词 */
const imagePrompt = ref('')
/** 图生图参考图片 URL */
const refImageUrl = ref('')
/** 参考图片预览（base64）*/
const refImagePreview = ref(null)
/** 图生图编辑提示词 */
const editPrompt = ref('')
/** 图片尺寸 */
const imageSize = ref('1024x1024')
/** 负面提示词 */
const negativePrompt = ref('')

// ==================== 视频生成状态 ====================

/** 视频提示词 */
const videoPrompt = ref('')
/** 图生视频参考图片 URL */
const videoRefUrl = ref('')
/** 视频参考图片预览（base64）*/
const vidImagePreview = ref(null)
/** 运动提示词 */
const motionPrompt = ref('')
/** 视频帧数 */
const videoDuration = ref('121')
/** 视频帧率 */
const videoFps = ref(24)
/** 视频负面提示词 */
const videoNegPrompt = ref('')

// ==================== 生成过程状态 ====================

/** 是否正在生成图片 */
const isImageGenerating = ref(false)
/** 是否正在生成视频 */
const isVideoGenerating = ref(false)
/** 是否正在生成（兼容旧逻辑）*/
const isGenerating = computed(() => isImageGenerating.value || isVideoGenerating.value)
/** 进度条宽度百分比 */
const progressWidth = ref(0)
/** 进度提示文字 */
const progressText = ref('准备中...')
/** 生成标题 */
const generationTitle = ref('生成中...')
/** 图片是否生成完成 */
const generatedImage = ref(false)
/** 生成的图片 URL */
const generatedImageUrl = ref(null)
/** 视频是否生成完成 */
const generatedVideo = ref(false)
/** 生成的视频 URL */
const generatedVideoUrl = ref(null)
/** 当前任务 ID */
const currentTaskId = ref(null)
/** 错误消息 */
const errorMsg = ref('')
/** 提示消息 */
const toastMsg = ref('')

// ==================== API 配置状态 ====================

/** API Key */
const apiKey = ref('')
/** API 基础地址 */
const baseUrl = ref('https://apihub.agnes-ai.com/v1')
/** 当前模型名称 */
const modelName = ref('agnes-image-2.1-flash')
/** 当前模型类型 */
const modelType = ref('image')
/** 连接状态：'' | 'ok' | 'error' */
const connStatus = ref('')

// ==================== 画廊状态 ====================

/** 画廊作品列表 */
const galleryItems = ref([])
/** Lightbox 索引（-1 表示关闭）*/
const lightboxIdx = ref(-1)

// ==================== 定时器引用 ====================

/** 轮询定时器 */
let pollTimer = null
/** 轮询间隔映射 */
const pollIntervals = {}
/** 进度模拟定时器 */
let progressTimer = null

// ==================== 监听与初始化 ====================

/**
 * 监听媒体类型变化，自动切换模型名称
 */
watch(mediaType, (newVal) => {
  if (newVal === 'image') modelName.value = 'agnes-image-2.1-flash'
  else modelName.value = 'agnes-video-v2.0'
})

/**
 * 加载用户设置
 * 从 localStorage 恢复 API Key、基础地址和画廊数据
 * 同时初始化 API 客户端配置，并对画廊数据做状态迁移
 */
function loadSettings() {
  apiKey.value = localStorage.getItem('agnes_api_key') || 'sk-Sf7UT27WPfgTY0n3lE3mpN1prY0XX2sbn8Zt0tMkXsC6Eu8H'
  baseUrl.value = localStorage.getItem('agnes_base_url') || 'https://apihub.agnes-ai.com/v1'
  const raw = JSON.parse(localStorage.getItem('agnes_gallery') || '[]')
  galleryItems.value = raw.map(normalizeGalleryItem)
  setApiKey(apiKey.value)
  setBaseUrl(baseUrl.value)
}

/**
 * 规范化画廊作品的状态字段（用于加载旧数据时的状态迁移）
 * 规则：
 * - 已有明确 status（generating/completed/failed）→ 保持
 * - 无 status 字段（旧数据）：有 mediaUrl → completed, 有 taskId → generating, 否则 failed
 * @param {object} item - 原始作品对象
 * @returns {object} 规范化后的作品对象
 */
function normalizeGalleryItem(item) {
  const validStatus = ['generating', 'completed', 'failed']
  let status = validStatus.includes(item.status) ? item.status : null
  if (status === null) {
    if (item.mediaUrl) status = 'completed'
    else if (item.taskId) status = 'generating'
    else status = 'failed'
  }
  return { ...item, status }
}

/**
 * 保存设置到 localStorage
 * @param {string} key - 设置项：api_key | base_url
 */
function saveSetting(key) {
  if (key === 'api_key') {
    localStorage.setItem('agnes_api_key', apiKey.value || '')
    setApiKey(apiKey.value)
  }
  if (key === 'base_url') {
    localStorage.setItem('agnes_base_url', baseUrl.value || '')
    setBaseUrl(baseUrl.value)
  }
}

/**
 * 测试 API 连接状态
 * 调用 /models 接口验证 API Key 是否有效
 */
async function _testConnection() {
  if (!apiKey.value) { connStatus.value = 'error'; return }
  try {
    connStatus.value = await testConnection() ? 'ok' : 'error'
  } catch { connStatus.value = 'error' }
}

// ==================== 文件上传处理 ====================

/**
 * 处理文件上传（input change 事件）
 * @param {Event} e - 事件对象
 * @param {Ref} propRef - 目标响应式引用
 */
function _handleUpload(e, propRef) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { propRef.value = ev.target.result }
  reader.readAsDataURL(file)
}

/**
 * 处理文件拖拽上传
 * @param {DragEvent} e - 拖拽事件对象
 * @param {Ref} propRef - 目标响应式引用
 */
function _handleDrop(e, propRef) {
  const file = e.dataTransfer.files[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (ev) => { propRef.value = ev.target.result }
  reader.readAsDataURL(file)
}

/** 处理参考图片上传 */
function handleRefImageUpload(e) { _handleUpload(e, refImagePreview) }
/** 处理视频参考图片上传 */
function handleVidImageUpload(e) { _handleUpload(e, vidImagePreview) }
/** 处理参考图片拖拽 */
function handleRefImageDrop(e) { _handleDrop(e, refImagePreview) }
/** 处理视频参考图片拖拽 */
function handleVidImageDrop(e) { _handleDrop(e, vidImagePreview) }

/** 移除参考图片 */
function removeRefImage() { refImagePreview.value = null; refImageUrl.value = '' }
/** 移除视频参考图片 */
function removeVidImage() { vidImagePreview.value = null; videoRefUrl.value = '' }

// ==================== 生成逻辑 ====================

/**
 * 生成图片（封装函数）
 * 包含表单验证、状态管理、API 调用和结果处理
 */
async function generateImageWrapper() {
  if (!apiKey.value) { errorMsg.value = '请先在设置中配置 API Key'; return }
  if (imageMode.value === 'txt2img' && !imagePrompt.value.trim()) { errorMsg.value = '请输入提示词'; return }
  if (imageMode.value === 'img2img' && !refImageUrl.value && !refImagePreview.value) { errorMsg.value = '请提供参考图片'; return }

  isImageGenerating.value = true
  progressWidth.value = 0
  progressText.value = '正在创建任务...'
  errorMsg.value = ''
  generatedImage.value = false

  const promptText = imagePrompt.value || editPrompt.value
  const galleryType = imageMode.value === 'img2img' ? 'image-to-image' : 'text-to-image'

  // 图片同步生成，无真正的任务ID，taskId 传 null
  const newItem = addToGallery(galleryType, null, promptText, null, 'generating')

  toastMsg.value = '任务已创建，进度将在画廊中显示'
  setTimeout(() => { toastMsg.value = '' }, 3000)
  isImageGenerating.value = false

  try {
    const body = {
      model: modelName.value,
      prompt: promptText,
      size: imageSize.value
    }
    if (negativePrompt.value) body.negative_prompt = negativePrompt.value
    if (imageMode.value === 'img2img') {
      body.image = refImageUrl.value || refImagePreview.value
      if (editPrompt.value) body.prompt = editPrompt.value
    }

    const url = await generateImage(body, (attempt, max, status) => {
      progressText.value = `服务繁忙，第 ${attempt}/${max} 次重试... (${status})`
    })

    newItem.mediaUrl = url
    newItem.status = 'completed'
    saveGallery()

    generatedImage.value = true
    generatedImageUrl.value = url
  } catch (err) {
    console.error(err)
    errorMsg.value = err.message
    newItem.status = 'failed'
    saveGallery()
  }
}

/**
 * 生成视频（封装函数）
 * 包含表单验证、状态管理、API 调用和轮询处理
 */
async function generateVideoWrapper() {
  if (!apiKey.value) { errorMsg.value = '请先在设置中配置 API Key'; return }
  if (videoMode.value === 'txt2vid' && !videoPrompt.value.trim()) { errorMsg.value = '请输入视频描述'; return }
  if (videoMode.value === 'img2vid' && !videoRefUrl.value && !vidImagePreview.value) { errorMsg.value = '请提供参考图片'; return }

  isVideoGenerating.value = true
  progressWidth.value = 0
  progressText.value = '正在创建任务...'
  errorMsg.value = ''
  generatedVideo.value = false

  try {
    const promptText = videoPrompt.value.trim() || motionPrompt.value.trim()
    const body = {
      model: modelName.value,
      prompt: promptText,
      num_frames: parseInt(videoDuration.value),
      frame_rate: videoFps.value
    }
    if (videoNegPrompt.value) body.negative_prompt = videoNegPrompt.value
    if (videoMode.value === 'img2vid') {
      body.image = videoRefUrl.value || vidImagePreview.value
    }

    const taskId = await createVideo(body, (attempt, max, status) => {
      progressText.value = `服务繁忙，第 ${attempt}/${max} 次重试... (${status})`
    })

    currentTaskId.value = taskId

    const type = videoMode.value === 'txt2vid' ? 'text-to-video' : 'image-to-video'
    addToGallery(type, null, videoPrompt.value || motionPrompt.value, taskId, 'generating')

    progressText.value = '任务已创建，去画廊查看进度'
    toastMsg.value = '任务已创建，进度将在画廊中显示'
    setTimeout(() => { toastMsg.value = '' }, 3000)
    isVideoGenerating.value = false

  } catch (err) {
    console.error(err)
    errorMsg.value = err.message
    isVideoGenerating.value = false
  }
}

/**
 * 启动单个任务的轮询（不影响进度条，仅更新画廊状态）
 * @param {string} taskId - 任务 ID
 */
function startPolling(taskId) {
  if (pollIntervals[taskId]) return

  const poll = async () => {
    try {
      const data = await getVideoStatus(taskId)

      if (data.status === 'completed' || data.output?.video_url) {
        stopPolling(taskId)
        const item = galleryItems.value.find(i => i.taskId === taskId)
        if (item) {
          item.mediaUrl = data.output?.video_url || data.video_url
          item.status = 'completed'
          saveGallery()
        }
        return
      }

      if (data.status === 'failed') {
        stopPolling(taskId)
        const item = galleryItems.value.find(i => i.taskId === taskId)
        if (item) { item.status = 'failed'; saveGallery() }
        return
      }

    } catch (err) {
      console.warn('Poll error:', taskId, err.message)
    }
  }

  poll()
  pollIntervals[taskId] = setInterval(poll, 5000)
}

/**
 * 停止单个任务的轮询
 * @param {string} taskId - 任务 ID
 */
function stopPolling(taskId) {
  if (pollIntervals[taskId]) {
    clearInterval(pollIntervals[taskId])
    delete pollIntervals[taskId]
  }
}

/** 停止所有轮询 */
function stopAllPolling() {
  Object.keys(pollIntervals).forEach(taskId => {
    clearInterval(pollIntervals[taskId])
    delete pollIntervals[taskId]
  })
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

/** 启动画廊中所有生成中任务的轮询 */
function startGalleryPolling() {
  galleryItems.value.forEach(item => {
    if (item.status === 'generating' && item.taskId) {
      startPolling(item.taskId)
    }
  })
}

/**
 * 启动进度模拟（用于图片生成的视觉反馈）
 * 8 秒内从 0% 递增到 90%
 */
function startProgressSimulation() {
  if (progressTimer) clearInterval(progressTimer)
  progressWidth.value = 0
  const startTime = Date.now()
  const duration = 8000

  progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min((elapsed / duration) * 100, 90)
    progressWidth.value = Math.round(progress)

    if (progress < 20) progressText.value = '正在处理提示词...'
    else if (progress < 40) progressText.value = '正在生成图像...'
    else if (progress < 60) progressText.value = '正在优化细节...'
    else if (progress < 80) progressText.value = '正在渲染...'
    else progressText.value = '即将完成...'
  }, 200)
}

/** 停止进度模拟 */
function stopProgressSimulation() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// ==================== 画廊管理 ====================

/**
 * 添加作品到画廊
 * @param {string} type - 类型：text-to-image | image-to-image | text-to-video | image-to-video
 * @param {string|null} mediaUrl - 媒体 URL
 * @param {string} prompt - 提示词
 * @param {string|null} taskId - 任务 ID（视频生成用，图片同步生成传 null）
 * @param {string} [status] - 状态：generating | completed | failed
 * @returns {object} 新创建的作品对象引用
 */
function addToGallery(type, mediaUrl, prompt, taskId, status) {
  const item = {
    id: Date.now(),
    type,
    mediaUrl,
    prompt,
    taskId,
    status: status || 'generating',
    createdAt: new Date().toISOString()
  }
  galleryItems.value.unshift(item)
  saveGallery()
  return item
}

/** 保存画廊到 localStorage */
function saveGallery() {
  localStorage.setItem('agnes_gallery', JSON.stringify(galleryItems.value.slice(0, 100)))
}

/** 清空画廊 */
function clearGallery() {
  if (confirm('确定清空所有作品？')) {
    galleryItems.value = []
    localStorage.removeItem('agnes_gallery')
  }
}

/**
 * 删除单个画廊作品
 * @param {object} item - 作品对象
 */
function removeGalleryItem(item) {
  const idx = galleryItems.value.findIndex(i => i.id === item.id)
  if (idx !== -1) {
    galleryItems.value.splice(idx, 1)
    saveGallery()
  }
}

/**
 * 检查画廊作品状态（手动触发）
 * @param {object} item - 作品对象
 */
async function checkGalleryItem(item) {
  if (!item.taskId) { alert('没有任务ID'); return }
  try {
    const data = await getVideoStatus(item.taskId)

    if (data.status === 'completed' || data.output?.video_url) {
      item.mediaUrl = data.output?.video_url || data.video_url
      item.status = 'completed'
      saveGallery()
      alert('✅ 视频已生成！')
    } else if (data.status === 'failed') {
      item.status = 'failed'
      saveGallery()
      alert('❌ 生成失败')
    } else {
      item.status = 'generating'
      saveGallery()
      alert('⏳ 仍在生成中，开始轮询...')
      startPolling(item.taskId, item.type)
    }
  } catch (err) {
    alert('检查失败: ' + err.message)
  }
}

/**
 * 获取视频 URL（播放时调用）
 * @param {object} item - 作品对象
 * @returns {Promise<string|null>} 视频 URL
 */
async function fetchVideoUrl(item) {
  if (!item.taskId) return null
  try {
    const url = await getVideoUrl(item.taskId)
    if (url) {
      item.mediaUrl = url
      item.status = 'completed'
      saveGallery()
      return url
    }
    const data = await getVideoStatus(item.taskId)
    if (data.status === 'failed') {
      item.status = 'failed'
      saveGallery()
    }
  } catch (err) {
    console.warn('获取视频URL失败:', err.message)
  }
  return null
}

/** 批量刷新画廊中所有生成中作品的状态 */
async function refreshGalleryStatuses() {
  const generatingItems = galleryItems.value.filter(item => item.status === 'generating' && item.taskId)
  if (generatingItems.length === 0) return

  for (const item of generatingItems) {
    try {
      const data = await getVideoStatus(item.taskId)
      if (data.status === 'completed' || data.output?.video_url) {
        item.mediaUrl = data.output?.video_url || data.video_url
        item.status = 'completed'
      } else if (data.status === 'failed') {
        item.status = 'failed'
      }
    } catch (err) {
      console.warn('刷新状态失败:', item.taskId, err.message)
    }
  }
  saveGallery()
}

/** 恢复失败的画廊作品（重新检查状态）*/
function resumeGalleryItem(item) {
  checkGalleryItem(item)
}

// ==================== 下载功能 ====================

/** 下载生成的图片 */
function downloadImage() {
  if (!generatedImageUrl.value) return
  const a = document.createElement('a')
  a.href = generatedImageUrl.value
  a.download = 'agnes-image-' + Date.now() + '.png'
  a.target = '_blank'
  a.click()
}

/** 下载生成的视频 */
function downloadVideo() {
  if (!generatedVideoUrl.value) return
  const a = document.createElement('a')
  a.href = generatedVideoUrl.value
  a.download = 'agnes-video-' + Date.now() + '.mp4'
  a.target = '_blank'
  a.click()
}

/** 将生成的图片作为视频参考图使用 */
function useAsReference() {
  mediaType.value = 'video'
  videoMode.value = 'img2vid'
  videoRefUrl.value = generatedImageUrl.value
}

// ==================== 工具函数 ====================

/**
 * 获取类型标签文本
 * @param {string} type - 类型代码
 * @returns {string} 中文标签
 */
function getTypeLabel(type) {
  const map = { 'text-to-video': '文生视频', 'image-to-video': '图生视频', 'image-to-image': '图生图', 'text-to-image': '文生图' }
  return map[type] || type
}

/**
 * 获取状态标签文本
 * @param {string} status - 状态代码
 * @returns {string} 中文标签
 */
function getStatusLabel(status) {
  const map = { generating: '生成中', completed: '已完成', failed: '失败' }
  return map[status] || status
}

/**
 * 格式化 ISO 时间字符串
 * @param {string} iso - ISO 时间字符串
 * @returns {string} 格式化后的时间
 */
function formatTime(iso) {
  return new Date(iso).toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

/**
 * 打开 Lightbox
 * @param {number} idx - 图片索引
 */
function openLightbox(idx) { lightboxIdx.value = idx }

/**
 * 导出 Store 接口
 * 返回所有响应式状态和方法
 */
export function useAppStore() {
  return {
    // 导航状态
    currentTab,
    mediaType,
    imageMode,
    videoMode,
    // 图片状态
    imagePrompt,
    refImageUrl,
    refImagePreview,
    editPrompt,
    imageSize,
    negativePrompt,
    // 视频状态
    videoPrompt,
    videoRefUrl,
    vidImagePreview,
    motionPrompt,
    videoDuration,
    videoFps,
    videoNegPrompt,
    // 生成状态
    isGenerating,
    progressWidth,
    progressText,
    generationTitle,
    generatedImage,
    generatedImageUrl,
    generatedVideo,
    generatedVideoUrl,
    currentTaskId,
    errorMsg,
    toastMsg,
    isImageGenerating,
    isVideoGenerating,
    // API 配置
    apiKey,
    baseUrl,
    modelName,
    modelType,
    connStatus,
    // 画廊
    galleryItems,
    lightboxIdx,
    // 方法
    loadSettings,
    saveSetting,
    testConnection: _testConnection,
    handleRefImageUpload,
    handleVidImageUpload,
    handleRefImageDrop,
    handleVidImageDrop,
    removeRefImage,
    removeVidImage,
    generateImage: generateImageWrapper,
    generateVideo: generateVideoWrapper,
    startPolling,
    stopPolling,
    stopAllPolling,
    startGalleryPolling,
    addToGallery,
    saveGallery,
    clearGallery,
    removeGalleryItem,
    checkGalleryItem,
    fetchVideoUrl,
    refreshGalleryStatuses,
    resumeGalleryItem,
    downloadImage,
    downloadVideo,
    useAsReference,
    getTypeLabel,
    getStatusLabel,
    formatTime,
    openLightbox
  }
}