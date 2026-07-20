<template>
  <div class="gallery-tab">
    <div class="gallery-header">
      <div class="header-title">
        <h2>创作画廊</h2>
        <p class="page-desc">{{ store.galleryItems.value.length }} 件作品</p>
      </div>
      <button v-if="store.galleryItems.value.length > 0" class="btn-danger" @click="store.clearGallery">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
        清空
      </button>
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

    <div v-else class="gallery-grid">
      <div
        v-for="(item, idx) in store.galleryItems.value"
        :key="item.id || idx"
        class="gallery-item"
      >
        <div class="gallery-media" :class="'media-' + item.type">
          <img
            v-if="item.mediaUrl && item.type.includes('image')"
            :src="item.mediaUrl"
            alt=""
            @click="store.openLightbox(idx)"
            loading="lazy"
          >
          <video
            v-else-if="item.mediaUrl && item.type.includes('video')"
            :src="item.mediaUrl"
            muted
            loop
            @mouseenter="$event.target.play()"
            @mouseleave="$event.target.pause()"
          ></video>
          <div class="media-placeholder" v-if="!item.mediaUrl">
            <svg v-if="item.type.includes('image')" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
            </svg>
          </div>
        </div>
        <div class="gallery-meta">
          <div class="meta-tags">
            <span class="badge" :class="item.type">{{ store.getTypeLabel(item.type) }}</span>
            <span class="badge" :class="item.status">{{ store.getStatusLabel(item.status) }}</span>
          </div>
          <p class="meta-prompt">{{ item.prompt || '无描述' }}</p>
          <span class="meta-time">{{ store.formatTime(item.createdAt) }}</span>
          <div v-if="item.status === 'failed' && item.taskId" class="gallery-actions">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../../composables/useAppStore.js'

const store = useAppStore()
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
  gap: 0.375rem;
  margin-top: 0.5rem;
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
</style>
