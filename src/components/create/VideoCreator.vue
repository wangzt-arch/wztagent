<template>
  <div class="creation-panel">
    <div class="panel-layout">
      <!-- Left: Controls -->
      <div class="controls-column">
        <div class="card">
          <!-- Video Mode Tabs -->
          <div class="sub-tabs">
            <button
              v-for="mode in videoModes"
              :key="mode.key"
              :class="['sub-tab', { active: store.videoMode.value === mode.key }]"
              @click="store.videoMode.value = mode.key"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="mode.svg"></svg>
              {{ mode.label }}
            </button>
          </div>

          <Transition name="mode-fade" mode="out-in">
            <!-- Text to Video -->
            <div v-if="store.videoMode.value === 'txt2vid'" key="txt2vid">
              <div class="form-group">
                <label>视频描述</label>
                <textarea
                  v-model="store.videoPrompt.value"
                  placeholder="描述你想要的视频内容...&#10;例如：一只猫咪在阳光下悠闲地散步，镜头缓缓推进，暖色调，电影感"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <!-- Image to Video -->
            <div v-else key="img2vid">
              <div class="form-group">
                <label>参考图片 URL</label>
                <input v-model="store.videoRefUrl.value" type="text" placeholder="https://example.com/reference.jpg">
              </div>
              <div class="form-group">
                <label>或上传参考图片</label>
                <UploadArea
                  :preview="store.vidImagePreview.value"
                  @upload="store.handleVidImageUpload"
                  @drop="store.handleVidImageDrop"
                  @remove="store.removeVidImage"
                />
              </div>
              <div class="form-group">
                <label>运动描述（可选）</label>
                <textarea
                  v-model="store.motionPrompt.value"
                  placeholder="描述图片中想要的动态效果..."
                  rows="3"
                ></textarea>
              </div>
            </div>
          </Transition>

          <!-- Duration -->
          <div class="form-group">
            <label>时长</label>
            <select v-model="store.videoDuration.value">
              <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- FPS & Negative Prompt -->
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0">
              <label>帧率</label>
              <select v-model="store.videoFps.value">
                <option :value="24">24 fps (电影)</option>
                <option :value="30">30 fps</option>
                <option :value="60">60 fps (流畅)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label>反向提示词</label>
              <input v-model="store.videoNegPrompt.value" type="text" placeholder="可选">
            </div>
          </div>

          <button class="btn-primary" @click="store.generateVideo" :disabled="store.isGenerating.value">
            <span class="btn-content">
              <svg v-if="!store.isGenerating.value" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
              </svg>
              <svg v-else class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ store.isGenerating.value ? '生成中...' : '生成视频' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Right: Preview -->
      <div class="preview-column">
        <Transition name="preview-fade" mode="out-in">
          <div v-if="store.generatedVideo.value" key="result" class="preview-card">
            <video :src="store.generatedVideoUrl.value" controls class="preview-media"></video>
            <div class="preview-overlay">
              <button class="btn-secondary" @click="store.downloadVideo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                下载
              </button>
            </div>
          </div>
          <div v-else key="empty" class="preview-empty">
            <div class="preview-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
              </svg>
            </div>
            <p>生成的视频将显示在这里</p>
            <span class="preview-hint">在左侧填写描述并点击生成</span>
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

const videoModes = [
  { key: 'txt2vid', label: '文生视频', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>' },
  { key: 'img2vid', label: '图生视频', svg: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>' }
]

const durationOptions = [
  { value: '81', label: '约 3.4 秒 (81帧)' },
  { value: '121', label: '约 5 秒 (121帧，推荐)' },
  { value: '209', label: '约 8.7 秒 (209帧)' },
  { value: '441', label: '约 18.4 秒 (441帧，最长)' }
]
</script>

<style scoped>
.panel-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.controls-column { min-width: 0; }

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

@media (max-width: 900px) {
  .panel-layout { grid-template-columns: 1fr; }
  .preview-column {
    position: static;
    order: -1;
  }
  .preview-empty { min-height: 260px; }
}
</style>
