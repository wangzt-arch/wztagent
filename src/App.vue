<template>
  <div class="app-container">
    <AppHeader :current-tab="store.currentTab.value" @switch-tab="store.currentTab.value = $event" />

    <main class="app-main">
      <Transition name="tab-switch" mode="out-in">
        <CreateTab v-if="store.currentTab.value === 'create'" key="create" />
        <GalleryTab v-else-if="store.currentTab.value === 'gallery'" key="gallery" />
        <SettingsTab v-else key="settings" />
      </Transition>
    </main>

    <AppFooter />

    <ErrorToast :error-msg="store.errorMsg.value" :success-msg="store.toastMsg.value" @dismiss="store.errorMsg.value = ''; store.toastMsg.value = ''" />

    <Lightbox
      :lightbox-idx="store.lightboxIdx.value"
      :gallery-items="store.galleryItems.value"
      @close="store.lightboxIdx.value = -1"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from './composables/useAppStore.js'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import CreateTab from './components/tabs/CreateTab.vue'
import GalleryTab from './components/tabs/GalleryTab.vue'
import SettingsTab from './components/tabs/SettingsTab.vue'
import ErrorToast from './components/common/ErrorToast.vue'
import Lightbox from './components/common/Lightbox.vue'

const store = useAppStore()

onMounted(() => {
  store.loadSettings()
})

onBeforeUnmount(() => {
  store.stopAllPolling()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-primary);
}

.app-main {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.tab-switch-enter-active,
.tab-switch-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-switch-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tab-switch-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .app-main { padding: 1.25rem; }
}
</style>
