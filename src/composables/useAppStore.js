import { ref, computed, watch } from 'vue'

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

function getApiBaseUrl() {
  if (isDev) return '/api'
  return baseUrl.value || 'https://apihub.agnes-ai.com/v1'
}

async function fetchWithRetry(url, options, { maxRetries = 3, onRetry } = {}) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res

      const isRetryable = res.status === 503 || res.status === 502 || res.status === 504 || res.status === 429
      if (!isRetryable || attempt === maxRetries) {
        return res
      }

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

const currentTab = ref('create')
const mediaType = ref('image')
const imageMode = ref('txt2img')
const videoMode = ref('txt2vid')

// Image state
const imagePrompt = ref('')
const refImageUrl = ref('')
const refImagePreview = ref(null)
const editPrompt = ref('')
const imageSize = ref('1024x1024')
const negativePrompt = ref('')

// Video state
const videoPrompt = ref('')
const videoRefUrl = ref('')
const vidImagePreview = ref(null)
const motionPrompt = ref('')
const videoDuration = ref('121')
const videoFps = ref(24)
const videoNegPrompt = ref('')

// Generation state
const isGenerating = ref(false)
const progressWidth = ref(0)
const progressText = ref('准备中...')
const generationTitle = ref('生成中...')
const generatedImage = ref(false)
const generatedImageUrl = ref(null)
const generatedVideo = ref(false)
const generatedVideoUrl = ref(null)
const currentTaskId = ref(null)
const errorMsg = ref('')

// API state
const apiKey = ref('')
const baseUrl = ref('https://apihub.agnes-ai.com/v1')
const modelName = ref('agnes-image-2.1-flash')
const modelType = ref('image')
const connStatus = ref('')

// Gallery state
const galleryItems = ref([])
const lightboxIdx = ref(-1)

// Polling
let pollTimer = null
const pollIntervals = {}
let progressTimer = null

watch(mediaType, (newVal) => {
  if (newVal === 'image') modelName.value = 'agnes-image-2.1-flash'
  else modelName.value = 'agnes-video-v2.0'
})

function loadSettings() {
  apiKey.value = localStorage.getItem('agnes_api_key') || 'sk-Sf7UT27WPfgTY0n3lE3mpN1prY0XX2sbn8Zt0tMkXsC6Eu8H'
  baseUrl.value = localStorage.getItem('agnes_base_url') || 'https://apihub.agnes-ai.com/v1'
  galleryItems.value = JSON.parse(localStorage.getItem('agnes_gallery') || '[]')
}

function saveSetting(key) {
  if (key === 'api_key') localStorage.setItem('agnes_api_key', apiKey.value || '')
  if (key === 'base_url') localStorage.setItem('agnes_base_url', baseUrl.value || '')
}

async function testConnection() {
  if (!apiKey.value) { connStatus.value = 'error'; return }
  try {
    const res = await fetch(getApiBaseUrl() + '/models', {
      headers: { Authorization: 'Bearer ' + apiKey.value }
    })
    connStatus.value = res.ok ? 'ok' : 'error'
  } catch { connStatus.value = 'error' }
}

function _handleUpload(e, propRef) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { propRef.value = ev.target.result }
  reader.readAsDataURL(file)
}

function _handleDrop(e, propRef) {
  const file = e.dataTransfer.files[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (ev) => { propRef.value = ev.target.result }
  reader.readAsDataURL(file)
}

function handleRefImageUpload(e) { _handleUpload(e, refImagePreview) }
function handleVidImageUpload(e) { _handleUpload(e, vidImagePreview) }
function handleRefImageDrop(e) { _handleDrop(e, refImagePreview) }
function handleVidImageDrop(e) { _handleDrop(e, vidImagePreview) }

function removeRefImage() { refImagePreview.value = null; refImageUrl.value = '' }
function removeVidImage() { vidImagePreview.value = null; videoRefUrl.value = '' }

async function generateImage() {
  if (!apiKey.value) { errorMsg.value = '请先在设置中配置 API Key'; return }
  if (imageMode.value === 'txt2img' && !imagePrompt.value.trim()) { errorMsg.value = '请输入提示词'; return }
  if (imageMode.value === 'img2img' && !refImageUrl.value && !refImagePreview.value) { errorMsg.value = '请提供参考图片'; return }

  isGenerating.value = true
  progressWidth.value = 0
  progressText.value = '正在生成图片...'
  errorMsg.value = ''
  generatedImage.value = false
  startProgressSimulation()

  try {
    const body = {
      model: modelName.value,
      prompt: imagePrompt.value || editPrompt.value,
      size: imageSize.value
    }
    if (negativePrompt.value) body.negative_prompt = negativePrompt.value
    if (imageMode.value === 'img2img') {
      body.image = refImageUrl.value || refImagePreview.value
      if (editPrompt.value) body.prompt = editPrompt.value
    }

    const res = await fetchWithRetry(
      getApiBaseUrl() + '/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey.value,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      {
        onRetry: (attempt, max, status) => {
          progressText.value = `服务繁忙，第 ${attempt}/${max} 次重试... (${status})`
        }
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${res.status}`)
    }

    const data = await res.json()
    let url = null
    if (data.data?.[0]?.url) {
      url = data.data[0].url
    } else if (data.data?.[0]?.b64_json) {
      url = 'data:image/png;base64,' + data.data[0].b64_json
    } else if (data.url) {
      url = data.url
    } else if (data.output_url) {
      url = data.output_url
    }

    if (url) {
      progressWidth.value = 100
      progressText.value = '生成完成！'
      generatedImage.value = true
      generatedImageUrl.value = url
      const galleryType = imageMode.value === 'img2img' ? 'image-to-image' : 'text-to-image'
      addToGallery(galleryType, url, imagePrompt.value || editPrompt.value, null, 'completed')
    } else {
      throw new Error('未获取到图片 URL')
    }
  } catch (err) {
    console.error(err)
    errorMsg.value = err.message
  } finally {
    stopProgressSimulation()
    isGenerating.value = false
  }
}

async function generateVideo() {
  if (!apiKey.value) { errorMsg.value = '请先在设置中配置 API Key'; return }
  if (videoMode.value === 'txt2vid' && !videoPrompt.value.trim()) { errorMsg.value = '请输入视频描述'; return }
  if (videoMode.value === 'img2vid' && !videoRefUrl.value && !vidImagePreview.value) { errorMsg.value = '请提供参考图片'; return }

  isGenerating.value = true
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

    const res = await fetchWithRetry(
      getApiBaseUrl() + '/videos',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey.value,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      {
        onRetry: (attempt, max, status) => {
          progressText.value = `服务繁忙，第 ${attempt}/${max} 次重试... (${status})`
        }
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${res.status}`)
    }

    const data = await res.json()
    currentTaskId.value = data.id || data.task_id

    const type = videoMode.value === 'txt2vid' ? 'text-to-video' : 'image-to-video'
    addToGallery(type, null, videoPrompt.value || motionPrompt.value, currentTaskId.value, 'generating')

    progressText.value = '任务已创建，等待生成...'
    startPolling(currentTaskId.value, type)

  } catch (err) {
    console.error(err)
    errorMsg.value = err.message
    isGenerating.value = false
  }
}

function startPolling(taskId, type) {
  if (pollTimer) clearInterval(pollTimer)

  const poll = async () => {
    try {
      const res = await fetchWithRetry(
        getApiBaseUrl() + '/videos/' + taskId,
        { headers: { Authorization: 'Bearer ' + apiKey.value } },
        { maxRetries: 2 }
      )
      if (!res.ok) throw new Error('HTTP ' + res.status)

      const data = await res.json()

      if (data.status === 'completed' || data.output?.video_url) {
        stopPolling()
        isGenerating.value = false
        progressWidth.value = 100
        progressText.value = '生成完成！'
        generatedVideo.value = true
        generatedVideoUrl.value = data.output?.video_url || data.video_url

        const item = galleryItems.value.find(i => i.taskId === taskId)
        if (item) {
          item.mediaUrl = data.output?.video_url || data.video_url
          item.status = 'completed'
          saveGallery()
        }
        return
      }

      if (data.status === 'failed') {
        stopPolling()
        isGenerating.value = false
        errorMsg.value = data.error?.message || '生成失败'

        const item = galleryItems.value.find(i => i.taskId === taskId)
        if (item) { item.status = 'failed'; saveGallery() }
        return
      }

      const elapsed = Date.now() - (data.created_at ? new Date(data.created_at).getTime() : Date.now() - 60000)
      progressWidth.value = Math.min(90, (elapsed / 600000) * 100)

      if (elapsed < 60000) progressText.value = '排队中...'
      else if (elapsed < 180000) progressText.value = '生成中...'
      else progressText.value = '即将完成...'

    } catch (err) {
      console.warn('Poll error:', err.message)
    }
  }

  poll()
  pollTimer = setInterval(poll, 5000)

  setTimeout(() => {
    if (isGenerating.value && pollTimer) {
      progressText.value = '仍在生成中，请保持页面打开...'
    }
  }, 1800000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

function stopAllPolling() {
  Object.values(pollIntervals).forEach(clearInterval)
  stopPolling()
}

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

function stopProgressSimulation() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

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
}

function saveGallery() {
  localStorage.setItem('agnes_gallery', JSON.stringify(galleryItems.value.slice(0, 100)))
}

function clearGallery() {
  if (confirm('确定清空所有作品？')) {
    galleryItems.value = []
    localStorage.removeItem('agnes_gallery')
  }
}

async function checkGalleryItem(item) {
  if (!item.taskId) { alert('没有任务ID'); return }
  try {
    const res = await fetchWithRetry(
      getApiBaseUrl() + '/videos/' + item.taskId,
      { headers: { Authorization: 'Bearer ' + apiKey.value } },
      { maxRetries: 2 }
    )
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()

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

async function fetchVideoUrl(item) {
  if (!item.taskId) return null
  const res = await fetchWithRetry(
    getApiBaseUrl() + '/videos/' + item.taskId,
    { headers: { Authorization: 'Bearer ' + apiKey.value } },
    { maxRetries: 2 }
  )
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  // const url = data.output?.video_url || data.video_url
  const url= data?.metadata?.url
  if (url) {
    item.mediaUrl = url
    item.status = 'completed'
    saveGallery()
    return url
  }
  if (data.status === 'failed') {
    item.status = 'failed'
    saveGallery()
  }
  return null
}

async function refreshGalleryStatuses() {
  const generatingItems = galleryItems.value.filter(item => item.status === 'generating' && item.taskId)
  if (generatingItems.length === 0) return

  for (const item of generatingItems) {
    try {
      const res = await fetchWithRetry(
        getApiBaseUrl() + '/videos/' + item.taskId,
        { headers: { Authorization: 'Bearer ' + apiKey.value } },
        { maxRetries: 2 }
      )
      if (!res.ok) continue

      const data = await res.json()
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

function resumeGalleryItem(item) {
  checkGalleryItem(item)
}

function downloadImage() {
  if (!generatedImageUrl.value) return
  const a = document.createElement('a')
  a.href = generatedImageUrl.value
  a.download = 'agnes-image-' + Date.now() + '.png'
  a.target = '_blank'
  a.click()
}

function downloadVideo() {
  if (!generatedVideoUrl.value) return
  const a = document.createElement('a')
  a.href = generatedVideoUrl.value
  a.download = 'agnes-video-' + Date.now() + '.mp4'
  a.target = '_blank'
  a.click()
}

function useAsReference() {
  mediaType.value = 'video'
  videoMode.value = 'img2vid'
  videoRefUrl.value = generatedImageUrl.value
}

function getTypeLabel(type) {
  const map = { 'text-to-video': '文生视频', 'image-to-video': '图生视频', 'image-to-image': '图生图', 'text-to-image': '文生图' }
  return map[type] || type
}

function getStatusLabel(status) {
  const map = { generating: '生成中', completed: '已完成', failed: '失败' }
  return map[status] || status
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

function openLightbox(idx) { lightboxIdx.value = idx }

export function useAppStore() {
  return {
    currentTab,
    mediaType,
    imageMode,
    videoMode,
    imagePrompt,
    refImageUrl,
    refImagePreview,
    editPrompt,
    imageSize,
    negativePrompt,
    videoPrompt,
    videoRefUrl,
    vidImagePreview,
    motionPrompt,
    videoDuration,
    videoFps,
    videoNegPrompt,
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
    apiKey,
    baseUrl,
    modelName,
    modelType,
    connStatus,
    galleryItems,
    lightboxIdx,
    loadSettings,
    saveSetting,
    testConnection,
    handleRefImageUpload,
    handleVidImageUpload,
    handleRefImageDrop,
    handleVidImageDrop,
    removeRefImage,
    removeVidImage,
    generateImage,
    generateVideo,
    startPolling,
    stopPolling,
    stopAllPolling,
    addToGallery,
    saveGallery,
    clearGallery,
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
