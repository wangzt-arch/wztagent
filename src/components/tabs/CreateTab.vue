<template>
  <div class="create-tab">
    <!-- Media Type Tabs -->
    <div class="media-tabs">
      <button
        v-for="type in mediaTypes"
        :key="type.key"
        :class="['media-tab-btn', { active: store.mediaType.value === type.key }]"
        @click="store.mediaType.value = type.key"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="type.svg"></svg>
        {{ type.label }}
      </button>
    </div>

    <Transition name="fade-slide" mode="out-in">
      <ImageCreator v-if="store.mediaType.value === 'image'" key="image" />
      <VideoCreator v-else key="video" />
    </Transition>
  </div>
</template>

<script setup>
import { useAppStore } from '../../composables/useAppStore.js'
import ImageCreator from '../create/ImageCreator.vue'
import VideoCreator from '../create/VideoCreator.vue'

const store = useAppStore()

const mediaTypes = [
  {
    key: 'image',
    label: '图片生成',
    svg: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'
  },
  {
    key: 'video',
    label: '视频生成',
    svg: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>'
  }
]
</script>

<style scoped>
.create-tab {
  animation: tab-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tab-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.media-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.media-tab-btn {
  padding: 0.75rem 2rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.media-tab-btn:hover {
  border-color: var(--accent-purple);
  color: var(--text-primary);
  background: rgba(124, 58, 237, 0.05);
}

.media-tab-btn.active {
  background: var(--gradient-primary);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

@media (max-width: 768px) {
  .media-tabs { width: 100%; }
  .media-tab-btn { flex: 1; justify-content: center; padding: 0.6rem 1rem; font-size: 0.9rem; }
}
</style>
