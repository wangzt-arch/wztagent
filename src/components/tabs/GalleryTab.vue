<template>
  <div class="gallery-tab">
    <div class="gallery-header">
      <div class="header-title">
        <h2>创作画廊</h2>
        <p class="page-desc">{{ store.galleryItems.value.length }} 件作品</p>
      </div>
      <div class="header-actions">
        <button v-if="store.galleryItems.value.length > 0" class="btn-danger" @click="store.clearGallery">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          清空
        </button>
        <button v-if="hasGeneratingItems" class="btn-secondary" @click="refreshAllStatus">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="m16 16 5 5"/>
          </svg>
          刷新状态
        </button>
      </div>
    </div>

    <div v-if="store.galleryItems.value.length === 0" class="empty-gallery">
      <div class="empty-icon">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </div>
      <p>还没有作品</p>
      <p class="empty-hint">去创作页面生成你的第一张图片/视频吧！</p>
    </div>

    <template v-else>
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="category-tab"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          <svg v-if="cat.icon === 'all'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>
          </svg>
          <svg v-else-if="cat.icon === 'image'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
          </svg>
          {{ cat.label }}
          <span class="count">{{ cat.count }}</span>
        </button>
      </div>

      <div v-if="filteredGalleryItems.length === 0" class="empty-gallery empty-category">
        <p>当前分类下没有作品</p>
      </div>

      <div v-else class="gallery-grid">
        <div
          v-for="(item, idx) in filteredGalleryItems"
          :key="item.id || idx"
          class="gallery-item"
        >
        <div class="gallery-media" :class="'media-' + item.type">
          <img
            v-if="item.mediaUrl && item.type.includes('image') && item.status === 'completed'"
            :src="item.mediaUrl"
            alt=""
            @click="store.openLightbox(idx)"
            loading="lazy"
          >
          <video
            v-else-if="item.type.includes('video') && item.status === 'completed' && playingIdx === idx && currentVideoUrl"
            :src="currentVideoUrl"
            controls
            autoplay
            :muted="false"
            @ended="onVideoEnded"
            @click.stop
          ></video>
          <video
            v-else-if="item.type.includes('video') && item.status === 'completed' && item.mediaUrl && playingIdx !== idx"
            :src="item.mediaUrl + '#t=0.1'"
            preload="metadata"
            muted
            class="poster-video"
          ></video>
          <div class="media-placeholder" v-else>
            <svg v-if="item.type.includes('image')" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
            </svg>
          </div>
          <div v-if="item.status === 'generating'" class="media-overlay">
            <span class="overlay-spinner"></span>
            <span class="overlay-text">生成中...</span>
          </div>
          <div v-if="loadingIdx === idx" class="media-overlay">
            <span class="overlay-spinner"></span>
            <span class="overlay-text">加载中...</span>
          </div>
          <div v-if="item.type.includes('video') && item.status === 'completed' && playingIdx !== idx && loadingIdx !== idx" class="play-overlay" @click="playVideo(idx, item)">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.5)"/>
              <path d="M8 5v14l11-7z" fill="white"/>
            </svg>
          </div>
        </div>
        <div class="gallery-meta">
          <div class="meta-tags">
            <span class="badge" :class="item.type">{{ store.getTypeLabel(item.type) }}</span>
            <span class="badge status-badge" :class="item.status" @click="showStatusDetail(item)">
              <span v-if="item.status === 'generating'" class="status-spinner"></span>
              {{ store.getStatusLabel(item.status) }}
            </span>
          </div>
          <p class="meta-prompt">{{ item.prompt || '无描述' }}</p>
          <span class="meta-time">{{ store.formatTime(item.createdAt) }}</span>
          <div class="gallery-actions">
            <div v-if="item.status === 'failed' && item.taskId" class="action-group">
              <button class="btn-secondary btn-sm" @click="store.resumeGalleryItem(item)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                恢复
              </button>
              <button class="btn-secondary btn-sm" @click="store.checkGalleryItem(item)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                检查
              </button>
            </div>
            <button class="btn-danger btn-sm delete-btn" @click="store.removeGalleryItem(item)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
      </div>
    </template>

    <div v-if="statusDetail" class="status-modal" @click="statusDetail = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-status" :class="statusDetail.status">
            <span v-if="statusDetail.status === 'generating'" class="modal-spinner"></span>
            {{ store.getStatusLabel(statusDetail.status) }}
          </div>
          <button class="modal-close" @click="statusDetail = null">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">类型</span>
            <span class="detail-value">{{ store.getTypeLabel(statusDetail.type) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提示词</span>
            <span class="detail-value">{{ statusDetail.prompt || '无' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ store.formatTime(statusDetail.createdAt) }}</span>
          </div>
          <div v-if="statusDetail.taskId" class="detail-row">
            <span class="detail-label">任务ID</span>
            <span class="detail-value">{{ statusDetail.taskId }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="statusDetail.status === 'generating' && statusDetail.taskId" class="btn-secondary" @click="store.checkGalleryItem(statusDetail); statusDetail = null">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            刷新状态
          </button>
          <button v-if="statusDetail.status === 'failed' && statusDetail.taskId" class="btn-primary" @click="store.resumeGalleryItem(statusDetail); statusDetail = null">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            重新生成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../composables/useAppStore.js'

const store = useAppStore()
const statusDetail = ref(null)
const playingIdx = ref(-1)
const loadingIdx = ref(-1)
const currentVideoUrl = ref('')

/** 进入画廊时：1. 刷新一次状态 2. 启动轮询 */
onMounted(() => {
  store.refreshGalleryStatuses()
  store.startGalleryPolling()
})

/** 离开画廊时：停止所有轮询 */
onUnmounted(() => {
  store.stopAllPolling()
})

/** 当前激活的分类：all | image | video */
const activeCategory = ref('all')

/** 画廊分类配置（带数量统计） */
const categories = computed(() => {
  const items = store.galleryItems.value
  return [
    { key: 'all', label: '全部', icon: 'all', count: items.length },
    { key: 'image', label: '图片', icon: 'image', count: items.filter(i => i.type.includes('image')).length },
    { key: 'video', label: '视频', icon: 'video', count: items.filter(i => i.type.includes('video')).length }
  ]
})

/** 按当前分类过滤后的画廊列表 */
const filteredGalleryItems = computed(() => {
  const items = store.galleryItems.value
  if (activeCategory.value === 'image') return items.filter(i => i.type.includes('image'))
  if (activeCategory.value === 'video') return items.filter(i => i.type.includes('video'))
  return items
})

const hasGeneratingItems = computed(() => {
  return store.galleryItems.value.some(item => item.status === 'generating' && item.taskId)
})

function showStatusDetail(item) {
  statusDetail.value = { ...item }
}

function refreshAllStatus() {
  store.refreshGalleryStatuses()
}

function onVideoEnded() {
  playingIdx.value = -1
  currentVideoUrl.value = ''
}

async function playVideo(idx, item) {
  loadingIdx.value = idx
  try {
    const url = await store.fetchVideoUrl(item)
    if (url) {
      currentVideoUrl.value = url
      playingIdx.value = idx
    } else {
      alert('未能获取视频地址')
    }
  } catch (err) {
    alert('加载失败: ' + err.message)
  } finally {
    loadingIdx.value = -1
  }
}
</script>

<style scoped>
.gallery-tab {
  animation: tab-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tab-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  width: fit-content;
  flex-wrap: wrap;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--radius-md) - 4px);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-tab:hover {
  color: var(--text-primary);
  background: var(--bg-input);
}

.category-tab.active {
  color: var(--text-primary);
  background: var(--bg-input);
  border-color: var(--border-active);
  box-shadow: 0 0 0 1px var(--border-active), 0 4px 16px rgba(0, 0, 0, 0.25);
}

.category-tab .count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.25rem;
  padding: 0 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--bg-input);
  border-radius: 999px;
  color: var(--text-muted);
  transition: all 0.25s ease;
}

.category-tab.active .count {
  background: var(--accent-purple);
  color: #fff;
}

.empty-category {
  padding: 4rem 2rem;
}

.header-title h2 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.empty-gallery {
  text-align: center;
  padding: 6rem 2rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.empty-icon {
  color: var(--accent-purple);
  margin-bottom: 1.25rem;
  opacity: 0.2;
}

.empty-gallery > p:first-of-type {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.85rem;
  opacity: 0.7;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.gallery-item {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.gallery-item:hover {
  border-color: var(--border-active);
  transform: translateY(-6px);
  box-shadow: var(--shadow-glow), 0 12px 40px rgba(0, 0, 0, 0.3);
}

.gallery-media {
  aspect-ratio: 1;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.gallery-media img,
.gallery-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.gallery-item:hover .gallery-media img,
.gallery-item:hover .gallery-media video {
  transform: scale(1.05);
}

.gallery-media img {
  cursor: zoom-in;
}

.media-placeholder {
  color: var(--text-muted);
  opacity: 0.4;
}

.gallery-meta {
  padding: 1rem;
}

.meta-tags {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.meta-prompt {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-bottom: 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.meta-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.gallery-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.action-group {
  display: flex;
  gap: 0.375rem;
}

.delete-btn {
  margin-left: auto;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

@media (max-width: 900px) {
  .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}

@media (max-width: 768px) {
  .gallery-grid { grid-template-columns: 1fr; }
  .gallery-header { flex-direction: column; align-items: stretch; }
  .header-title h2 { font-size: 1.5rem; }
}

.status-badge {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
}

.status-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.badge.generating {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  backdrop-filter: blur(4px);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.play-overlay:hover svg {
  transform: scale(1.15);
}

.play-overlay svg {
  transition: transform 0.2s;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.gallery-media video {
  cursor: pointer;
}

.poster-video {
  pointer-events: none;
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.overlay-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--accent-purple);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.overlay-text {
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 0.2s ease;
  padding: 1rem;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.modal-status.generating { color: #fb923c; }
.modal-status.completed { color: #22c55e; }
.modal-status.failed { color: #ef4444; }

.modal-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(251, 146, 60, 0.3);
  border-top-color: #fb923c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.detail-value {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-input);
}

.modal-footer .btn-secondary,
.modal-footer .btn-primary {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}
</style>
