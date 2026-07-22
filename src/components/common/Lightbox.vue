<template>
  <Transition name="lightbox">
    <div v-if="lightboxIdx >= 0" class="lightbox" @click.self="$emit('close')">
      <img :src="imageUrl" alt="">
      <button class="lightbox-close" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lightboxIdx: Number,
  galleryItems: Array
})

defineEmits(['close'])

const imageUrl = computed(() => {
  if (props.lightboxIdx >= 0 && props.galleryItems[props.lightboxIdx]) {
    return props.galleryItems[props.lightboxIdx].mediaUrl
  }
  return ''
})
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox img {
  max-width: 92%;
  max-height: 90vh;
  border-radius: var(--radius-md);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  animation: lightbox-img-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes lightbox-img-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.lightbox-close {
  position: absolute;
  top: 3rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: rotate(90deg);
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: all 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
