<template>
  <div
    class="upload-area"
    :class="{ 'drag-over': isDragOver }"
    @click="$refs.fileInput?.click()"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display:none"
      @change="handleChange"
    >
    <div v-if="!preview" class="upload-placeholder">
      <div class="upload-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
      </div>
      <p>点击或拖拽上传图片</p>
      <span class="upload-hint">支持 JPG、PNG、WEBP</span>
    </div>
    <div v-else class="upload-preview">
      <img :src="preview" alt="预览">
      <button class="remove-btn" @click.stop="$emit('remove')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['preview'])
const emit = defineEmits(['upload', 'remove'])

const isDragOver = ref(false)

function handleChange(e) {
  emit('upload', e)
}

function handleDrop(e) {
  isDragOver.value = false
  emit('drop', e)
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 2.5rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: rgba(124, 58, 237, 0.02);
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

.upload-preview {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.upload-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.remove-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 28px;
  height: 28px;
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
}

.remove-btn:hover {
  transform: scale(1.15) rotate(90deg);
  background: #dc2626;
}
</style>
