/**
 * 应用状态管理 Store
 * 使用 Vue 3 Composition API 的组合式函数模式
 * 负责管理全局状态、业务逻辑和用户交互
 */
import { ref, computed, watch } from 'vue'
import { setApiKey, setBaseUrl, generateImage, testConnection, createVideo, getVideoStatus, getVideoUrl, chat } from '../api/index.js'

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

/** 正在生成中的图片任务数量（支持并发） */
const imageGeneratingCount = ref(0)
/** 是否正在生成图片（只要有任务在跑就为 true，用于 loading 占位） */
const isImageGenerating = computed(() => imageGeneratingCount.value > 0)
/** 是否正在生成视频 */
const isVideoGenerating = ref(false)
/** 是否正在生成（兼容旧逻辑）*/
const isGenerating = computed(() => isImageGenerating.value || isVideoGenerating.value)
/** 进度条宽度百分比（仅展示最新一次任务的进度） */
const progressWidth = ref(0)
/** 进度提示文字（仅展示最新一次任务的进度） */
const progressText = ref('准备中...')
/** 生成标题 */
const generationTitle = ref('生成中...')
/** 当前预览区追踪的最新图片任务 id（用于判断进度/结果是否应写入预览区） */
let latestImageTaskId = null
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

/**
 * 演示作品列表（始终展示在画廊最前面，不可删除）
 * 使用 src/images 下的本地图片：dog.png（3D盲盒公仔）、fox.png（狐狸）、cat.png（小猫法师）
 */
const demoItems = ref([
  {
    id: 'demo_dog',
    type: 'text-to-image',
    status: 'completed',
    prompt: '3D blind box toy design, cute Shiba Inu astronaut, wearing a white puffy spacesuit, transparent gold visor, holding a blue planet lollipop in mouth, sitting on the cratered lunar surface, deep blue space with tiny stars in background, soft cute big eyes, chibi proportion (2-head tall), bright studio soft lighting, pastel blue and white color scheme, smooth PVC plastic texture with matte fabric, super adorable clay figure style, C4D render, Octane render, white background with soft shadows, high detail, 8k, blind box display angle',
    mediaUrl: new URL('../images/dog.png', import.meta.url).href,
    createdAt: '2026-07-21T00:00:00.000Z',
    isDemo: true
  },
  {
    id: 'demo_fox',
    type: 'text-to-image',
    status: 'completed',
    prompt: '狐狸，森林，魔幻风格，唯美',
    mediaUrl: new URL('../images/fox.png', import.meta.url).href,
    createdAt: '2026-07-21T00:00:01.000Z',
    isDemo: true
  },
  {
    id: 'demo_cat',
    type: 'text-to-image',
    status: 'completed',
    prompt: '小猫法师，魔法帽，可爱，奇幻',
    mediaUrl: new URL('../images/cat.png', import.meta.url).href,
    createdAt: '2026-07-21T00:00:02.000Z',
    isDemo: true
  }
])

/** 用户真实的画廊作品列表（持久化到 localStorage） */
const userGalleryItems = ref([])

/**
 * 合并后的画廊作品列表（demo 始终在最前）
 * 通过 computed 自动响应用户作品变化
 */
const galleryItems = computed(() => [...demoItems.value, ...userGalleryItems.value])

/** Lightbox 索引（-1 表示关闭）*/
const lightboxIdx = ref(-1)

// ==================== 项目与模板状态 ====================

/** 创作项目，承载简报、模板和作品版本 */
const projects = ref([])
/** 当前项目 ID */
const currentProjectId = ref(null)
/** 当前项目 */
const currentProject = computed(() => projects.value.find(project => project.id === currentProjectId.value) || null)
/** 当前项目中的生成版本，最新版本排在前面 */
const currentProjectVersions = computed(() => {
  if (!currentProjectId.value) return []
  return userGalleryItems.value
    .filter(item => item.projectId === currentProjectId.value)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

/** 可直接带入创作表单的内容模板 */
const contentTemplates = [
  {
    id: 'product-launch',
    title: '新品发布',
    description: '产品主视觉与卖点短片',
    imagePrompt: '为一款新品制作高级商业广告主视觉，突出产品材质、核心卖点和干净的留白构图，专业棚拍光线，品牌感强',
    videoPrompt: '新品悬浮在简洁的品牌空间中，镜头缓慢推进，光线扫过产品细节，最后定格在清晰的产品主视觉上',
    imageSize: '1024x1024',
    videoDuration: '121'
  },
  {
    id: 'social-cover',
    title: '社媒封面',
    description: '抓住注意力的竖版视觉',
    imagePrompt: '为社交媒体制作醒目的竖版封面，主体明确，色彩有冲击力，留出标题文字空间，现代编辑设计风格',
    videoPrompt: '竖版社交媒体短片开场，主体快速进入画面，镜头有节奏地推进，形成强烈的第一秒视觉吸引力',
    imageSize: '720x1280',
    videoDuration: '81'
  },
  {
    id: 'brand-story',
    title: '品牌故事',
    description: '具备统一情绪的品牌叙事',
    imagePrompt: '以电影感画面讲述一个温暖而真实的品牌故事，人物与产品自然互动，统一色彩语言，富有情绪和细节',
    videoPrompt: '电影感品牌故事短片，人物与产品在自然光中互动，镜头缓慢移动，氛围温暖克制，结尾留出品牌表达空间',
    imageSize: '1024x768',
    videoDuration: '209'
  },
  {
    id: 'character-concept',
    title: '角色设定',
    description: '角色视觉与动态概念',
    imagePrompt: '原创角色概念设计，全身视角，清晰的服装、材质和道具细节，统一世界观，角色设定稿风格，高细节',
    videoPrompt: '原创角色站在其所属世界中，镜头缓慢环绕，衣物和环境有细微动态，呈现角色的气质和故事感',
    imageSize: '768x1024',
    videoDuration: '121'
  }
]

// ==================== 对话状态 ====================

const CHAT_RESPONSE_PROTOCOL = `当用户需要图像或视频生成提示词时，必须使用以下 Markdown 结构：

## 生图提示词
\`\`\`prompt
只放可直接发送给图像模型的完整正向提示词。
\`\`\`
## 生图反向提示词
\`\`\`negative-prompt
只放需要排除的内容；没有时保持空代码块。
\`\`\`

## 生视频提示词
\`\`\`prompt
只放可直接发送给视频模型的完整正向提示词。
\`\`\`
## 生视频反向提示词
\`\`\`negative-prompt
只放需要排除的内容；没有时保持空代码块。
\`\`\`

普通回答无需使用提示词区块。严禁在其他位置输出可提取提示词，也不要省略标题或代码块。`

/** 新建对话时可选择的固定角色 */
const chatRoles = [
  {
    id: 'default',
    name: '普通对话',
    description: '自然问答与通用协作',
    systemPrompt: '你是一个可靠、自然的通用 AI 助手。直接回答用户问题；只有用户明确需要创作提示词时才提供提示词区块。'
  },
  {
    id: 'prompt-assistant',
    name: '提示词助手',
    description: '将想法转成可生成提示词',
    systemPrompt: '你是专业提示词助手。先澄清创作目标，再给出适合目标媒介的高质量正向与反向提示词，覆盖主体、风格、构图、光线和质感。'
  },
  {
    id: 'visual-director',
    name: '视觉导演',
    description: '定义构图、风格与镜头语言',
    systemPrompt: '你是视觉导演。围绕品牌、受众和情绪提出构图、色彩、光线、镜头和参考方向，并在结尾给出可直接生成的提示词。'
  },
  {
    id: 'storyboard',
    name: '视频分镜师',
    description: '拆解镜头、动作与节奏',
    systemPrompt: '你是视频分镜师。把创意拆成清晰的镜头运动、主体动作、节奏和时长建议，并优先给出可直接用于视频生成的提示词。'
  },
  {
    id: 'brand-copywriter',
    name: '品牌文案师',
    description: '提炼品牌表达与内容方向',
    systemPrompt: '你是品牌文案师。根据品牌、受众和渠道提炼简报、传播主张和文案方向；需要视觉素材时，再给出匹配的生成提示词。'
  }
]

/** 对话会话列表 */
const chatSessions = ref([])
/** 当前激活的会话 ID */
const currentChatSessionId = ref(null)
/** 是否正在发送消息 */
const chatLoading = ref(false)

/**
 * 获取当前激活会话的消息列表
 * @returns {Array} 消息数组
 */
const chatMessages = computed(() => {
  const session = chatSessions.value.find(s => s.id === currentChatSessionId.value)
  return session ? session.messages : []
})

const currentChatRole = computed(() => {
  const session = chatSessions.value.find(s => s.id === currentChatSessionId.value)
  return getChatRole(session?.roleId)
})

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
  userGalleryItems.value = raw.map(normalizeGalleryItem)

  const savedProjects = JSON.parse(localStorage.getItem('agnes_projects') || '[]')
  projects.value = savedProjects
  if (projects.value.length === 0 && userGalleryItems.value.length > 0) {
    const legacyProject = {
      id: 'legacy-project',
      name: '历史创作',
      brief: '自动归档的历史作品',
      templateId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    projects.value = [legacyProject]
    userGalleryItems.value.forEach((item, index) => {
      item.projectId = legacyProject.id
      item.version = item.version || index + 1
    })
    saveProjects()
    saveGallery()
  }
  const savedProjectId = localStorage.getItem('agnes_current_project_id')
  currentProjectId.value = projects.value.some(project => project.id === savedProjectId)
    ? savedProjectId
    : projects.value[0]?.id || null
  setApiKey(apiKey.value)
  setBaseUrl(baseUrl.value)

  // 加载对话会话
  const savedSessions = JSON.parse(localStorage.getItem('agnes_chat_sessions') || '[]')
  chatSessions.value = savedSessions.map(session => ({
    ...session,
    roleId: chatRoles.some(role => role.id === session.roleId) ? session.roleId : 'default',
    messages: session.messages.map(msg => ({
      ...msg,
      displayContent: msg.displayContent || msg.content
    }))
  }))
  // 如果有保存的会话，激活第一个；否则创建新会话
  if (savedSessions.length > 0) {
    currentChatSessionId.value = savedSessions[0].id
  } else {
    createChatSession()
  }
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

  // 并发支持：每次生成都独立追踪，预览区只展示最新任务
  const taskId = Date.now()
  latestImageTaskId = taskId
  imageGeneratingCount.value++
  progressWidth.value = 0
  progressText.value = '正在创建任务...'
  errorMsg.value = ''
  generatedImage.value = false

  const promptText = imagePrompt.value || editPrompt.value
  const galleryType = imageMode.value === 'img2img' ? 'image-to-image' : 'text-to-image'

  // 图片同步生成，无真正的任务ID，taskId 传 null；用返回的引用更新，避免并发错乱
  const newItem = addToGallery(galleryType, null, promptText, null, 'generating')

  toastMsg.value = '任务已创建，进度将在画廊中显示'
  setTimeout(() => { toastMsg.value = '' }, 3000)

  // 启动进度模拟（仅对最新任务生效，旧任务的进度更新会被忽略）
  startProgressSimulation(taskId)

  try {
    const body = {
      model: modelName.value,
      prompt: promptText,
      size: imageSize.value
    }
    if (negativePrompt.value) body.negative_prompt = negativePrompt.value
    if (imageMode.value === 'img2img') {
      body.extra_body = {
        image: [refImageUrl.value || refImagePreview.value],
        response_format: 'url'
      }
      if (editPrompt.value) body.prompt = editPrompt.value
    }

    const url = await generateImage(body, (attempt, max, status) => {
      // 只有最新任务才更新预览区进度
      if (latestImageTaskId === taskId) {
        progressText.value = `服务繁忙，第 ${attempt}/${max} 次重试... (${status})`
      }
    })

    // 画廊项独立更新（无论是否为最新任务）
    newItem.mediaUrl = url
    newItem.status = 'completed'
    saveGallery()

    // 只有最新任务才更新预览区
    if (latestImageTaskId === taskId) {
      progressWidth.value = 100
      progressText.value = '生成完成'
      generatedImage.value = true
      generatedImageUrl.value = url
    }
  } catch (err) {
    console.error(err)
    // 错误信息只对最新任务展示到预览区
    if (latestImageTaskId === taskId) {
      errorMsg.value = err.message
    }
    newItem.status = 'failed'
    saveGallery()
  } finally {
    stopProgressSimulation(taskId)
    imageGeneratingCount.value = Math.max(0, imageGeneratingCount.value - 1)
    // 最新任务结束时，若没有其他任务在跑，清理预览区的 loading 标记
    if (latestImageTaskId === taskId && imageGeneratingCount.value === 0) {
      latestImageTaskId = null
    }
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
        const item = userGalleryItems.value.find(i => i.taskId === taskId)
        if (item) {
          item.mediaUrl = data.output?.video_url || data.video_url
          item.status = 'completed'
          saveGallery()
        }
        return
      }

      if (data.status === 'failed') {
        stopPolling(taskId)
        const item = userGalleryItems.value.find(i => i.taskId === taskId)
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

/** 启动画廊中所有生成中任务的轮询（仅用户作品） */
function startGalleryPolling() {
  userGalleryItems.value.forEach(item => {
    if (item.status === 'generating' && item.taskId) {
      startPolling(item.taskId)
    }
  })
}

/**
 * 启动进度模拟（用于图片生成的视觉反馈）
 * 8 秒内从 0% 递增到 90%
 * @param {number} [taskId] - 关联的图片任务 id，用于并发场景下判断是否仍为最新任务
 */
function startProgressSimulation(taskId) {
  if (progressTimer) clearInterval(progressTimer)
  if (latestImageTaskId !== taskId) return  // 非最新任务，不启动进度模拟
  progressWidth.value = 0
  const startTime = Date.now()
  const duration = 8000

  progressTimer = setInterval(() => {
    // 若已不是最新任务，停止更新预览区进度
    if (latestImageTaskId !== taskId) {
      clearInterval(progressTimer)
      progressTimer = null
      return
    }
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
function stopProgressSimulation(taskId) {
  // 并发场景：只有最新任务停止时才真正清除定时器
  if (taskId && latestImageTaskId !== taskId) return
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
  const project = ensureCurrentProject()
  const latestVersion = userGalleryItems.value
    .filter(item => item.projectId === project.id)
    .reduce((max, item) => Math.max(max, item.version || 0), 0)
  const item = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    type,
    mediaUrl,
    prompt,
    taskId,
    status: status || 'generating',
    projectId: project.id,
    version: latestVersion + 1,
    createdAt: new Date().toISOString()
  }
  userGalleryItems.value.unshift(item)
  saveGallery()
  // 返回数组中的响应式代理对象（而非原始普通对象），确保后续属性修改能触发视图更新
  return userGalleryItems.value[0]
}

/** 保存用户作品到 localStorage（demo 不保存） */
function saveGallery() {
  localStorage.setItem('agnes_gallery', JSON.stringify(userGalleryItems.value.slice(0, 100)))
}

/** 清空用户作品（demo 不受影响） */
function clearGallery() {
  if (confirm('确定清空所有作品？')) {
    userGalleryItems.value = []
    localStorage.removeItem('agnes_gallery')
  }
}

/**
 * 删除单个画廊作品（demo 不可删除）
 * @param {object} item - 作品对象
 */
function removeGalleryItem(item) {
  if (item.isDemo) {
    alert('演示作品不可删除')
    return
  }
  const idx = userGalleryItems.value.findIndex(i => i.id === item.id)
  if (idx !== -1) {
    userGalleryItems.value.splice(idx, 1)
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
  const generatingItems = userGalleryItems.value.filter(item => item.status === 'generating' && item.taskId)
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
    // 项目与模板
    projects,
    currentProjectId,
    currentProject,
    currentProjectVersions,
    contentTemplates,
    // 对话
    chatMessages,
    chatLoading,
    chatRoles,
    currentChatRole,
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
    // 项目与模板方法
    createProject,
    selectProject,
    updateCurrentProject,
    deleteProject,
    applyTemplate,
    useChatPrompt,
    hasChatPrompt,
    getProjectName,
    openProject,
    downloadImage,
    downloadVideo,
    useAsReference,
    getTypeLabel,
    getStatusLabel,
    formatTime,
    openLightbox,
    sendMessage,
    clearChat,
    // 会话管理
    chatSessions,
    currentChatSessionId,
    createChatSession,
    deleteChatSession,
    switchChatSession,
    updateChatSessionTitle,
    getChatRole
  }
}

/**
 * 发送对话消息
 * @param {string} text - 用户输入的消息内容
 */
async function sendMessage(text) {
  if (!apiKey.value) { errorMsg.value = '请先在设置中配置 API Key'; return }
  if (!text.trim()) return

  const session = chatSessions.value.find(s => s.id === currentChatSessionId.value)
  if (!session) return

  chatLoading.value = true

  const userMsg = {
    id: Date.now(),
    role: 'user',
    content: text,
    createdAt: new Date().toISOString()
  }
  session.messages.push(userMsg)

  const assistantMsg = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    displayContent: '',
    createdAt: new Date().toISOString()
  }
  session.messages.push(assistantMsg)

  // 通过 session.messages 索引获取 reactive 引用
  const msgIndex = session.messages.length - 1

  // 更新会话标题（用第一条消息的前20个字符）
  if (session.messages.length === 2) {
    session.title = text.slice(0, 20) + (text.length > 20 ? '...' : '')
  }
  session.updatedAt = new Date().toISOString()
  saveChatSessions()

  try {
    const role = getChatRole(session.roleId)
    const messages = [
      {
        role: 'system',
        content: `${role.systemPrompt}\n\n${CHAT_RESPONSE_PROTOCOL}`
      },
      ...session.messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ]

    await chat({ messages }, (chunk, fullContent) => {
      // SSE 流式期间：用 rAF 节流，避免每个 chunk 都触发响应式更新
      const reactiveMsg = session.messages[msgIndex]
      reactiveMsg.content = fullContent
      if (!reactiveMsg._rafId) {
        reactiveMsg._rafId = requestAnimationFrame(() => {
          reactiveMsg.displayContent = reactiveMsg.content
          reactiveMsg._rafId = null
        })
      }
    })
  } catch (err) {
    console.error(err)
    errorMsg.value = err.message
    const reactiveMsg = session.messages[msgIndex]
    reactiveMsg.content = '抱歉，发生了错误：' + err.message
    reactiveMsg.displayContent = reactiveMsg.content
  } finally {
    chatLoading.value = false
    const reactiveMsg = session.messages[msgIndex]
    if (reactiveMsg._rafId) {
      cancelAnimationFrame(reactiveMsg._rafId)
      reactiveMsg._rafId = null
    }
    reactiveMsg.displayContent = reactiveMsg.content
    saveChatSessions()
  }
}

/**
 * 清空当前对话记录
 */
function clearChat() {
  const session = chatSessions.value.find(s => s.id === currentChatSessionId.value)
  if (!session) return
  if (confirm('确定清空当前对话？')) {
    session.messages = []
    session.title = '新对话'
    session.updatedAt = new Date().toISOString()
    saveChatSessions()
  }
}

/**
 * 保存对话会话到 localStorage
 */
function saveChatSessions() {
  localStorage.setItem('agnes_chat_sessions', JSON.stringify(chatSessions.value))
}

/**
 * 创建新对话会话
 * @returns {object} 新创建的会话对象
 */
function createChatSession(roleId = 'default') {
  const role = getChatRole(roleId)
  const newSession = {
    id: Date.now(),
    title: role.id === 'default' ? '新对话' : `${role.name}对话`,
    roleId: role.id,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  chatSessions.value.unshift(newSession)
  currentChatSessionId.value = newSession.id
  saveChatSessions()
  return newSession
}

/**
 * 删除对话会话
 * @param {string} sessionId - 会话 ID
 */
function deleteChatSession(sessionId) {
  const idx = chatSessions.value.findIndex(s => s.id === sessionId)
  if (idx === -1) return

  if (!confirm('确定删除该对话？')) return

  chatSessions.value.splice(idx, 1)
  saveChatSessions()

  // 如果删除的是当前激活的会话，切换到第一个或创建新会话
  if (sessionId === currentChatSessionId.value) {
    if (chatSessions.value.length > 0) {
      currentChatSessionId.value = chatSessions.value[0].id
    } else {
      createChatSession()
    }
  }
}

/**
 * 切换到指定会话
 * @param {string} sessionId - 会话 ID
 */
function switchChatSession(sessionId) {
  currentChatSessionId.value = sessionId
}

/**
 * 更新会话标题
 * @param {string} sessionId - 会话 ID
 * @param {string} title - 新标题
 */
function updateChatSessionTitle(sessionId, title) {
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (session) {
    session.title = title
    session.updatedAt = new Date().toISOString()
    saveChatSessions()
  }
}

function getChatRole(roleId = 'default') {
  return chatRoles.find(role => role.id === roleId) || chatRoles[0]
}

// ==================== 项目与模板管理 ====================

function saveProjects() {
  localStorage.setItem('agnes_projects', JSON.stringify(projects.value))
  if (currentProjectId.value) localStorage.setItem('agnes_current_project_id', currentProjectId.value)
  else localStorage.removeItem('agnes_current_project_id')
}

function createProject(name = '未命名项目', options = {}) {
  const now = new Date().toISOString()
  const project = {
    id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || '未命名项目',
    brief: options.brief || '',
    templateId: options.templateId || null,
    createdAt: now,
    updatedAt: now
  }
  projects.value.unshift(project)
  currentProjectId.value = project.id
  saveProjects()
  return project
}

function ensureCurrentProject() {
  return currentProject.value || createProject()
}

function selectProject(projectId) {
  if (!projects.value.some(project => project.id === projectId)) return
  currentProjectId.value = projectId
  saveProjects()
}

function updateCurrentProject(patch) {
  const project = currentProject.value
  if (!project) return
  Object.assign(project, patch, { updatedAt: new Date().toISOString() })
  saveProjects()
}

function deleteProject(projectId) {
  const index = projects.value.findIndex(project => project.id === projectId)
  if (index === -1) return
  projects.value.splice(index, 1)
  userGalleryItems.value.forEach(item => {
    if (item.projectId === projectId) item.projectId = null
  })
  if (currentProjectId.value === projectId) currentProjectId.value = projects.value[0]?.id || null
  saveProjects()
  saveGallery()
}

function applyTemplate(template) {
  const project = currentProject.value || createProject(template.title, {
    brief: template.description,
    templateId: template.id
  })
  updateCurrentProject({
    name: project.name === '未命名项目' ? template.title : project.name,
    brief: project.brief || template.description,
    templateId: template.id
  })
  imagePrompt.value = template.imagePrompt
  imageSize.value = template.imageSize
  videoPrompt.value = template.videoPrompt
  videoDuration.value = template.videoDuration
  mediaType.value = 'image'
  imageMode.value = 'txt2img'
  currentTab.value = 'create'
  toastMsg.value = `已应用“${template.title}”模板`
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

function useChatPrompt(content, target = 'image') {
  const prompt = extractChatPrompt(content, target)
  if (!prompt) {
    errorMsg.value = target === 'video'
      ? '未找到“生视频提示词”区块，请让 AI 按提示词格式重新输出。'
      : '未找到“生图提示词”区块，请让 AI 按提示词格式重新输出。'
    return
  }
  const extractedNegativePrompt = extractChatNegativePrompt(content, target)
  ensureCurrentProject()
  if (target === 'video') {
    mediaType.value = 'video'
    videoMode.value = 'txt2vid'
    videoPrompt.value = prompt
    videoNegPrompt.value = extractedNegativePrompt
  } else {
    mediaType.value = 'image'
    imageMode.value = 'txt2img'
    imagePrompt.value = prompt
    negativePrompt.value = extractedNegativePrompt
  }
  currentTab.value = 'create'
  toastMsg.value = extractedNegativePrompt ? '已提取正向与反向提示词' : '已提取提示词并清空反向提示词'
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

/**
 * 从 AI 回复中提取明确标注的生成提示词，不允许将整段对话带入创作。
 * 仅接受“生图提示词 / 生视频提示词”标题后紧接的 prompt 代码块。
 */
function extractChatPrompt(content, target) {
  const text = content?.replace(/\r/g, '').trim()
  if (!text) return ''

  const labels = target === 'video'
    ? '(?:生视频|视频|video)\\s*(?:提示词|prompt)'
    : '(?:生图|图片|图像|image)\\s*(?:提示词|prompt)'
  const labeledBlock = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*{1,2})?${labels}(?:\\*{1,2})?\\s*[:：]?\\s*`, 'i')
  const match = labeledBlock.exec(text)
  if (!match) return ''

  const afterLabel = text.slice(match.index + match[0].length)
  const fenced = afterLabel.match(/^\s*```prompt\s*\n([\s\S]*?)\n?```/i)
  return fenced?.[1]?.trim() || ''
}

function hasChatPrompt(content, target) {
  return Boolean(extractChatPrompt(content, target))
}

/** 从固定的反向提示词区块提取排除内容；未提供时返回空字符串。 */
function extractChatNegativePrompt(content, target) {
  const text = content?.replace(/\r/g, '').trim()
  if (!text) return ''

  const labels = target === 'video'
    ? '(?:生视频|视频|video)\\s*(?:反向提示词|negative\\s*prompt)'
    : '(?:生图|图片|图像|image)\\s*(?:反向提示词|negative\\s*prompt)'
  const labeledBlock = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*{1,2})?${labels}(?:\\*{1,2})?\\s*[:：]?\\s*`, 'i')
  const match = labeledBlock.exec(text)
  if (!match) return ''

  const afterLabel = text.slice(match.index + match[0].length)
  const fenced = afterLabel.match(/^\s*```negative-prompt\s*\n([\s\S]*?)\n?```/i)
  return fenced?.[1]?.trim() || ''
}

function getProjectName(projectId) {
  return projects.value.find(project => project.id === projectId)?.name || '未归档'
}

function openProject(projectId) {
  selectProject(projectId)
  currentTab.value = 'projects'
}
