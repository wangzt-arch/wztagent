<template>
  <div
    class="upload-area"
    :class="{ 'drag-over': isDragOver, 'has-images': previews.length > 0 }"
    @click="openFilePicker"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      :multiple="max > 1"
      style="display:none"
      @change="handleChange"
    >
    <!-- 空状态：完整尺寸的占位区 -->
    <div v-if="previews.length === 0" class="upload-placeholder">
      <div class="upload-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
      </div>
      <p>点击或拖拽上传图片</p>
      <span class="upload-hint">支持 JPG、PNG、WEBP{{ max > 1 ? `，最多 ${max} 张` : '' }}</span>
    </div>
    <!-- 有图状态：缩略图网格 + 添加更多 -->
    <div v-else class="upload-grid">
      <div
        v-for="(src, idx) in previews"
        :key="idx"
        class="upload-thumb"
        @click.stop
      >
        <img :src="src" :alt="`参考图 ${idx + 1}`">
        <span class="thumb-index">{{ idx + 1 }}</span>
        <button
          class="remove-btn"
          :title="`移除第 ${idx + 1} 张`"
          @click.stop="$emit('remove', idx)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>
      </div>
      <button
        v-if="previews.length < max"
        class="upload-add-tile"
        title="添加更多图片"
        @click.stop="openFilePicker"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        <span>添加</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  previews: { type: Array, default: () => [] },
  max: { type: Number, default: 1 }
})
const emit = defineEmits(['upload', 'drop', 'drop-url', 'remove'])

const isDragOver = ref(false)
const fileInput = ref(null)

function openFilePicker() {
  // 达到上限后不再弹出文件选择
  if (props.previews.length >= props.max) return
  fileInput.value?.click()
}

function handleChange(e) {
  emit('upload', e)
  // 清空 input 的 value，允许下次选择相同文件
  e.target.value = ''
}

function handleDrop(e) {
  isDragOver.value = false
  // 优先处理本地文件拖拽
  const hasFiles = e.dataTransfer?.files?.length > 0
  if (hasFiles) {
    emit('drop', e)
    return
  }
  // 没有文件时，尝试读取 URL（从生成图预览区或其他网页拖来的图片）
  // text/uri-list 可能包含多行 URL，取第一个非空行
  const rawUrl = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain') || ''
  const url = rawUrl.split(/\r?\n/).map(s => s.trim()).find(Boolean) || ''
  if (url) emit('drop-url', url)
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: rgba(124, 58, 237, 0.02);
}

/* 空状态：保持原有的较大尺寸 */
.upload-area:not(.has-images) {
  padding: 2.5rem 2rem;
  text-align: center;
}

/* 有图状态：紧凑网格 */
.upload-area.has-images {
  padding: 0.75rem;
}

.upload-area:hover {
  border-color: var(--accent-purple);
  background: rgba(124, 58, 237, 0.05);
}

.upload-area.drag-over {
  border-color: var(--accent-purple);
  background: rgba(124, 58, 237, 0.1);
  box-shadow: 0 0 24px rgba(124, 58, 237, 0.15);
  transform: scale(1.01);
}

.upload-placeholder {
  color: var(--text-secondary);
}

.upload-icon {
  color: var(--accent-purple);
  margin-bottom: 0.75rem;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.upload-area:hover .upload-icon {
  transform: translateY(-4px);
  opacity: 1;
}

.upload-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* 多图网格：自动平铺 */
.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 0.5rem;
}

.upload-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  cursor: default;
}

.upload-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-index {
  position: absolute;
  bottom: 4px;
  left: 4px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.7rem;
  line-height: 1.4;
  pointer-events: none;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--danger);
  color: #fff;
  border: 2px solid var(--bg-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  padding: 0;
}

.remove-btn:hover {
  transform: scale(1.15) rotate(90deg);
  background: #dc2626;
}

.upload-add-tile {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  background: transparent;
  font: inherit;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  padding: 0;
}

.upload-add-tile:hover {
  border-color: var(--accent-purple);
  color: var(--accent-purple);
  background: rgba(124, 58, 237, 0.05);
}
</style>
