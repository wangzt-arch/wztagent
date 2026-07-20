<template>
  <div class="settings-tab">
    <div class="settings-card card">
      <div class="settings-header">
        <div class="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <h2>API 设置</h2>
      </div>

      <div class="form-group">
        <label>API Key</label>
        <div class="input-wrap">
          <input
            v-model="store.apiKey.value"
            type="password"
            placeholder="sk-xxxxxxxxxxx"
            @input="store.saveSetting('api_key')"
          >
          <div class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>API 地址</label>
        <div class="input-wrap">
          <input
            v-model="store.baseUrl.value"
            type="text"
            placeholder="https://apihub.agnes-ai.com/v1"
            @input="store.saveSetting('base_url')"
          >
          <div class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="test-section">
        <button class="btn-secondary" @click="store.testConnection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          测试连接
        </button>
        <Transition name="fade">
          <span v-if="store.connStatus.value" :class="['status-text', store.connStatus.value === 'ok' ? 'success' : 'error']">
            {{ store.connStatus.value === 'ok' ? '连接成功' : '连接失败' }}
          </span>
        </Transition>
      </div>

      <div class="info-box">
        <div class="info-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/>
          </svg>
          <h4>说明</h4>
        </div>
        <ul>
          <li>所有数据仅保存在浏览器本地，不会上传到任何服务器</li>
          <li>图片生成是同步操作，通常在几秒内完成</li>
          <li>视频生成是异步操作，提交后会在后台生成</li>
          <li>免费套餐：视频模型 2 RPM，图片模型 30 RPM</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../../composables/useAppStore.js'

const store = useAppStore()
</script>

<style scoped>
.settings-tab {
  animation: tab-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tab-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-card {
  max-width: 560px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.75rem;
}

.settings-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--gradient-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}

.settings-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.input-wrap {
  position: relative;
}

.input-wrap input {
  padding-right: 2.75rem;
}

.input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.test-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.status-text {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.status-text.success {
  color: var(--success);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-text.error {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.info-box {
  background: var(--bg-input);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid var(--border-color);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
  color: var(--accent-purple);
}

.info-header h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.info-box ul {
  padding-left: 1.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.info-box li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.info-box li:last-child { margin-bottom: 0; }

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
