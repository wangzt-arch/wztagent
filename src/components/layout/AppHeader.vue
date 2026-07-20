<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="logo-text">
          <h1>Agnes Creator</h1>
          <span class="subtitle">AI Image & Video Studio</span>
        </div>
      </div>
      <nav class="header-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['nav-btn', { active: currentTab === tab.key }]"
          @click="$emit('switch-tab', tab.key)"
        >
          <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tab.svg"></svg>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
defineProps(['currentTab'])
defineEmits(['switch-tab'])

const tabs = [
  {
    key: 'create',
    label: '创作',
    svg: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>'
  },
  {
    key: 'gallery',
    label: '画廊',
    svg: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'
  },
  {
    key: 'settings',
    label: '设置',
    svg: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
  }
]
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 15, 0.75);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border-bottom: 1px solid var(--border-color);
  padding: 0 2rem;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.35);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.logo-icon:hover {
  transform: rotate(12deg) scale(1.05);
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.5);
}

.logo-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.logo-text .subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.header-nav {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-secondary);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.nav-btn {
  padding: 0.5rem 1.1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-btn:hover {
  color: var(--text-primary);
  background: rgba(124, 58, 237, 0.1);
}

.nav-btn.active {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35);
}

.nav-icon-svg {
  display: inline-block;
  vertical-align: middle;
}

@media (max-width: 768px) {
  .app-header { padding: 0 1rem; }
  .header-inner { height: 56px; }
  .logo-text .subtitle { display: none; }
  .header-nav { gap: 0; }
  .nav-btn { padding: 0.45rem 0.75rem; font-size: 0.8rem; }
}
</style>
