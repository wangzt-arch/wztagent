<template>
  <Transition name="slide-in">
    <div v-if="errorMsg || successMsg" class="error-toast" @click="$emit('dismiss')">
      <div class="error-card" :class="{ success: successMsg }">
        <div class="error-icon">
          <svg v-if="errorMsg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="error-content">
          <h4>{{ errorMsg ? '出错了' : '成功' }}</h4>
          <p>{{ errorMsg || successMsg }}</p>
        </div>
        <button class="error-close" @click.stop="$emit('dismiss')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({ 
  errorMsg: String,
  successMsg: String
})
defineEmits(['dismiss'])
</script>

<style scoped>
.error-toast {
  position: fixed;
  top: 84px;
  right: 1.5rem;
  z-index: 200;
  cursor: pointer;
  max-width: 420px;
  width: calc(100% - 3rem);
}

.error-card {
  background: var(--bg-card);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  box-shadow: var(--shadow-lg), 0 0 30px rgba(239, 68, 68, 0.08);
  backdrop-filter: blur(12px);
}

.error-card.success {
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: var(--shadow-lg), 0 0 30px rgba(34, 197, 94, 0.08);
}

.error-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card.success .error-icon {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.error-content {
  flex: 1;
  min-width: 0;
}

.error-content h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--danger);
  margin-bottom: 0.25rem;
}

.error-card.success .error-content h4 {
  color: #22c55e;
}

.error-content p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  word-break: break-word;
  line-height: 1.5;
}

.error-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.error-close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter-from {
  transform: translateX(120%);
  opacity: 0;
}

.slide-in-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

@media (max-width: 768px) {
  .error-toast { right: 1rem; left: 1rem; width: auto; max-width: none; }
}
</style>
