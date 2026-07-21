<template>
  <div class="creation-panel">
    <div class="panel-layout">
      <!-- Left: Controls -->
      <div class="controls-column">
        <div class="card">
          <!-- Image Mode Tabs -->
          <div class="sub-tabs">
            <button
              v-for="mode in imageModes"
              :key="mode.key"
              :class="['sub-tab', { active: store.imageMode.value === mode.key }]"
              @click="store.imageMode.value = mode.key"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="mode.svg"></svg>
              {{ mode.label }}
            </button>
          </div>

          <div class="card-scroll">
          <Transition name="mode-fade" mode="out-in">
            <!-- Text to Image -->
            <div v-if="store.imageMode.value === 'txt2img'" key="txt2img">
              <div class="form-group">
                <div class="label-row">
                  <label>提示词</label>
                  <button class="clear-btn" @click="store.imagePrompt.value = ''">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                    清空
                  </button>
                </div>
                <textarea
                  v-model="store.imagePrompt.value"
                  placeholder="描述你想要的图片内容，越详细越好...&#10;例如：一只橘猫坐在窗台上，夕阳的余晖洒在它身上，室内暖色调，电影感光影"
                  rows="8"
                ></textarea>
              </div>
            </div>

            <!-- Image to Image -->
            <div v-else key="img2img">
              <div class="form-group">
                <label>参考图片 URL</label>
                <input v-model="store.refImageUrl.value" type="text" placeholder="https://example.com/reference.jpg">
              </div>
              <div class="form-group">
                <label>或上传参考图片</label>
                <UploadArea
                  :preview="store.refImagePreview.value"
                  @upload="store.handleRefImageUpload"
                  @drop="store.handleRefImageDrop"
                  @remove="store.removeRefImage"
                />
              </div>
              <div class="form-group">
                <div class="label-row">
                  <label>编辑提示词</label>
                  <button class="clear-btn" @click="store.editPrompt.value = ''">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                    清空
                  </button>
                </div>
                <textarea
                  v-model="store.editPrompt.value"
                  placeholder="描述你想要如何修改图片...&#10;例如：把背景换成海边日落，色调变暖"
                  rows="6"
                ></textarea>
              </div>
            </div>
          </Transition>

          <!-- Size -->
          <div class="form-group">
            <label>尺寸</label>
            <select v-model="store.imageSize.value">
              <option v-for="opt in sizeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- Negative Prompt -->
          <div class="form-group">
            <label>反向提示词（可选）</label>
            <input v-model="store.negativePrompt.value" type="text" placeholder="不想要的内容...">
          </div>
          </div>

          <button class="btn-primary" @click="store.generateImage" :disabled="store.isImageGenerating.value">
            <span class="btn-content">
              <svg v-if="!store.isImageGenerating.value" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              <svg v-else class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ store.isImageGenerating.value ? '生成中...' : '生成图片' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Right: Preview -->
      <div class="preview-column">
        <Transition name="preview-fade" mode="out-in">
          <div v-if="store.generatedImage.value" key="result" class="preview-card">
            <img :src="store.generatedImageUrl.value" alt="Generated" class="preview-media">
            <div class="preview-overlay">
              <button class="btn-secondary" @click="store.downloadImage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                下载
              </button>
              <button class="btn-secondary" @click="store.useAsReference">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
                </svg>
                用作参考
              </button>
            </div>
          </div>
          <div v-else-if="store.isImageGenerating.value" key="loading" class="preview-card preview-loading">
            <div class="loading-content">
              <div class="loading-spinner-wrap">
                <div class="loading-spinner"></div>
                <div class="loading-ring"></div>
              </div>
              <p class="loading-title">{{ store.progressText.value }}</p>
              <div class="loading-bar">
                <div class="loading-fill" :style="{ width: store.progressWidth.value + '%' }">
                  <div class="loading-glow"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else key="empty" class="preview-empty">
            <div class="preview-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.01 17.461 2 12 2z"/>
              </svg>
            </div>
            <p>生成的图片将显示在这里</p>
            <span class="preview-hint">在左侧填写提示词并点击生成</span>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import UploadArea from '../common/UploadArea.vue'
import { useAppStore } from '../../composables/useAppStore.js'

const store = useAppStore()

const imageModes = [
  { key: 'txt2img', label: '文生图', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>' },
  { key: 'img2img', label: '图生图', svg: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>' }
]

const sizeOptions = [
  { value: '1024x1024', label: '1024 × 1024 (方形)' },
  { value: '1024x768', label: '1024 × 768 (横版)' },
  { value: '768x1024', label: '768 × 1024 (竖版)' },
  { value: '1280x720', label: '1280 × 720 (宽屏)' },
  { value: '720x1280', label: '720 × 1280 (手机)' }
]
</script>

<style scoped>
.creation-panel {
  height: 100%;
}

.panel-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
  height: 100%;
}

.controls-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.controls-column .card {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 200px);
  padding: 1.5rem;
}

.card-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 0.5rem;
}

.card-scroll::-webkit-scrollbar {
  width: 6px;
}

.card-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.card-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.card-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.controls-column .btn-primary {
  flex-shrink: 0;
  margin-top: 1rem;
}

.preview-column {
  position: sticky;
  top: 88px;
}

.preview-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-md);
}

.preview-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--gradient-primary);
  z-index: 1;
}

.preview-media {
  width: 100%;
  display: block;
  border-radius: 0;
  transition: transform 0.5s ease;
}

.preview-card:hover .preview-media {
  transform: scale(1.02);
}

.preview-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 1.25rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.85));
  display: flex;
  gap: 0.625rem;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.preview-card:hover .preview-overlay { opacity: 1; }

.preview-empty {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.preview-empty::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-card);
  opacity: 0.5;
}

.preview-empty > * { position: relative; z-index: 1; }

.preview-icon {
  color: var(--accent-purple);
  margin-bottom: 1.25rem;
  opacity: 0.25;
}

.preview-empty p {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.preview-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.loading-content {
  text-align: center;
  padding: 2rem;
}

.loading-spinner-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
}

.loading-spinner {
  position: absolute;
  inset: 0;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-purple);
  border-right-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-ring {
  position: absolute;
  inset: -5px;
  border: 1px solid transparent;
  border-top-color: rgba(124, 58, 237, 0.2);
  border-radius: 50%;
  animation: spin 2.5s linear infinite reverse;
}

.loading-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.loading-bar {
  width: 100%;
  max-width: 240px;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto;
}

.loading-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
  position: relative;
}

.loading-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  animation: progress-shimmer 1.5s infinite;
}

@keyframes progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Mode content transition */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.mode-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.preview-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.label-row label {
  margin-bottom: 0;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: var(--accent-purple);
  border-color: var(--accent-purple);
  background: rgba(124, 58, 237, 0.05);
}

@media (max-width: 900px) {
  .panel-layout { grid-template-columns: 1fr; }
  .preview-column {
    position: static;
    order: -1;
  }
  .preview-empty { min-height: 260px; }
}
</style>
