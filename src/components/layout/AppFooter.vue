<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span>Agnes Creator Studio</span>
      </div>
      <div class="footer-divider"></div>
      <p class="footer-text">Powered by Agnes AI</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--border-color);
  margin-top: 3rem;
  padding: 0 2rem;
  background: rgba(10, 10, 15, 0.5);
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 56px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.footer-divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--border-color);
}

.footer-text {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .app-footer { padding: 0 1rem; margin-top: 2rem; }
  .footer-inner { height: 48px; flex-direction: column; gap: 0.25rem; }
  .footer-divider { display: none; }
}
</style>
