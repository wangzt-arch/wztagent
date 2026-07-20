<template>
  <Transition name="fade-scale">
    <div v-if="isGenerating" class="progress-overlay">
      <div class="progress-backdrop"></div>
      <div class="progress-card">
        <div class="spinner-wrap">
          <div class="spinner"></div>
          <div class="spinner-ring"></div>
        </div>
        <h3>{{ generationTitle }}</h3>
        <p>{{ progressText }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }">
            <div class="progress-glow"></div>
          </div>
        </div>
        <p v-if="currentTaskId" class="task-id">任务 ID: {{ currentTaskId }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isGenerating: Boolean,
  progressWidth: Number,
  progressText: String,
  generationTitle: { type: String, default: '生成中...' },
  currentTaskId: { type: String, default: null }
})
</script>

<style scoped>
.progress-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.progress-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(8px);
}

.progress-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 2.5rem 2rem;
  text-align: center;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-lg), 0 0 60px rgba(124, 58, 237, 0.1);
  overflow: hidden;
}

.progress-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.spinner-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  margin: 0 auto;
}

.spinner {
  position: absolute;
  inset: 0;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-purple);
  border-right-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring {
  position: absolute;
  inset: -6px;
  border: 1px solid transparent;
  border-top-color: rgba(124, 58, 237, 0.2);
  border-radius: 50%;
  animation: spin 2.5s linear infinite reverse;
}

@keyframes spin { to { transform: rotate(360deg); } }

.progress-card h3 {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.progress-card p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  overflow: hidden;
  margin: 1.25rem 0;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 3px;
  position: relative;
}

.progress-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  animation: progress-shimmer 1.5s infinite;
}

@keyframes progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.task-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  word-break: break-all;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-family: 'SF Mono', 'Fira Code', monospace;
  border: 1px solid var(--border-color);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
