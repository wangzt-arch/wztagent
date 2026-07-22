<template>
  <div class="chat-tab">
    <!-- 会话侧边栏 -->
    <div class="sessions-sidebar">
      <div class="sessions-header">
        <h3>对话列表</h3>
        <button class="btn-icon" @click="store.createChatSession" title="新建对话">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
      <div class="sessions-list">
        <div
          v-for="session in store.chatSessions.value"
          :key="session.id"
          :class="['session-item', { active: session.id === store.currentChatSessionId.value }]"
          @click="store.switchChatSession(session.id)"
        >
          <div class="session-info">
            <div class="session-title">{{ session.title }}</div>
            <div class="session-meta">
              {{ session.messages.length }} 条消息
            </div>
          </div>
          <button class="btn-icon delete-btn" @click.stop="store.deleteChatSession(session.id)" title="删除对话">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 对话主区域 -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="header-title">
          <h2>AI 对话</h2>
          <p class="page-desc">与 Agnes-2.0-Flash 进行实时对话</p>
        </div>
        <div class="header-actions">
          <button v-if="store.chatMessages.value.length > 0" class="btn-secondary" @click="store.clearChat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            清空对话
          </button>
        </div>
      </div>

      <div class="chat-container">
        <div ref="messagesContainer" class="messages-list">
          <div v-if="store.chatMessages.value.length === 0" class="empty-chat">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>开始与 AI 对话</p>
            <p class="empty-hint">输入你的问题，Agnes-2.0-Flash 将为你提供帮助</p>
          </div>

          <div
            v-for="(msg, idx) in store.chatMessages.value"
            :key="msg.id || idx"
            :class="['message-item', msg.role]"
          >
            <div class="message-avatar">
              <svg v-if="msg.role === 'user'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9.87 16.17 4.93-4.93-4.93 4.93z"/><path d="M12 12c2-2 2-2 5-2s2 2 3 5-2 2-5 5-3-2-5-5 2-3 5-3z"/><path d="M12 12c-2-2-2-2-5-2s-2 2-3 5 2 2 5 5 3-2 5-5-2-3-5-3z"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="role-label">{{ msg.role === 'user' ? '你' : 'Agnes' }}</span>
                <span v-if="msg.role === 'assistant'" class="model-label">agnes-2.0-flash</span>
              </div>
              <div class="message-body" v-html="renderMessage(msg, idx)"></div>
              <div v-if="msg.role === 'assistant' && store.chatLoading.value && idx === store.chatMessages.value.length - 1 && !(msg.displayContent || msg.content)" class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="input-wrapper">
            <textarea
              v-model="inputMessage"
              placeholder="输入你的问题,回车发送..."
              rows="3"
              @keydown.enter="sendMessage"
              :disabled="store.chatLoading.value"
            ></textarea>
            <button class="clear-input" v-if="inputMessage" @click="inputMessage = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="input-actions">
            <button class="btn-primary send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || store.chatLoading.value">
              <svg v-if="!store.chatLoading.value" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/>
              </svg>
              <svg v-else class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ store.chatLoading.value ? '思考中...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { marked } from 'marked'
import { useAppStore } from '../../composables/useAppStore.js'

const store = useAppStore()
const inputMessage = ref('')
const messagesContainer = ref(null)

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

/**
 * 渲染消息内容
 * 推送中：增量更新（只处理新增部分），避免重复扫描全文
 * 推送完成后：完整 Markdown 渲染（带缓存）
 */
const renderCache = new WeakMap()

function renderMessage(msg, idx) {
  const content = msg.displayContent || msg.content
  if (!content) return ''

  const isLastAssistant = msg.role === 'assistant' && idx === store.chatMessages.value.length - 1
  const isStreaming = isLastAssistant && store.chatLoading.value

  if (isStreaming) {
    // 推送中：增量更新，只处理新增部分
    const cached = renderCache.get(msg)
    if (cached && cached.source.length <= content.length && content.startsWith(cached.source)) {
      // 只处理新增部分
      const newPart = content.slice(cached.source.length)
      const newHtml = newPart.replace(/\n/g, '<br>')
      cached.source = content
      cached.html = cached.html + newHtml
      return cached.html
    }
    // 缓存失效（内容回退或首次）：全量处理
    const html = content.replace(/\n/g, '<br>')
    renderCache.set(msg, { source: content, html })
    return html
  }

  // 推送完成：Markdown 渲染（带缓存）
  if (msg.role === 'assistant') {
    const cached = renderCache.get(msg)
    if (cached && cached.source === content && cached.completed) {
      return cached.html
    }
    const html = marked.parse(content)
    renderCache.set(msg, { source: content, html, completed: true })
    return html
  }

  // 用户消息：简单文本
  return content.replace(/\n/g, '<br>')
}

async function sendMessage() {
  const text = inputMessage.value.trim()
  if (!text || store.chatLoading.value) return

  await store.sendMessage(text)
  inputMessage.value = ''
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听消息内容变化（推送过程中频繁更新）
watch(() => {
  const msgs = store.chatMessages.value
  if (msgs.length === 0) return 0
  const last = msgs[msgs.length - 1]
  return (last.displayContent || last.content || '').length
}, () => {
  scrollToBottom()
})

// 监听消息数量变化
watch(() => store.chatMessages.value.length, () => {
  scrollToBottom()
})

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-tab {
  display: flex;
  gap: 1.5rem;
  height: 100%;
  min-height: 0;
  animation: tab-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tab-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 会话侧边栏 */
.sessions-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 130px);
}

.sessions-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sessions-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.375rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--bg-input);
  color: var(--accent-purple);
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.sessions-list::-webkit-scrollbar {
  width: 4px;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.session-item {
  padding: 0.75rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.session-item:hover {
  background: var(--bg-input);
}

.session-item.active {
  background: var(--gradient-primary);
}

.session-item.active .session-title,
.session-item.active .session-meta {
  color: rgba(255, 255, 255, 0.9);
}

.session-info {
  flex: 1;
  overflow: hidden;
}

.session-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.session-item.active .delete-btn {
  color: rgba(255, 255, 255, 0.8);
}

/* 对话主区域 */
.chat-main {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title h2 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.page-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px);
  min-height: 500px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  background: var(--bg-input);
}

.messages-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  color: var(--accent-purple);
  margin-bottom: 1.25rem;
  opacity: 0.2;
}

.empty-chat > p:first-of-type {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.85rem;
  opacity: 0.7;
}

.message-item {
  display: flex;
  gap: 0.75rem;
  animation: message-enter 0.3s ease;
}

@keyframes message-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background: var(--gradient-primary);
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.message-item.user .message-avatar {
  color: var(--accent-purple);
}

.message-item.assistant .message-avatar {
  color: var(--accent-blue);
}

.message-content {
  max-width: 70%;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.message-item.user .message-content {
  border-radius: var(--radius-md) 0 var(--radius-md) var(--radius-md);
}

.message-item.assistant .message-content {
  border-radius: 0 var(--radius-md) var(--radius-md) var(--radius-md);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.role-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.message-item.user .role-label {
  color: rgba(255, 255, 255, 0.8);
}

.model-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  background: var(--bg-input);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
}

.message-body {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-primary);
  word-wrap: break-word;
}

.message-item.user .message-body {
  color: #fff;
}

/* Markdown 渲染样式 */
.message-body :deep(p) {
  margin: 0.5rem 0;
}

.message-body :deep(p:first-child) {
  margin-top: 0;
}

.message-body :deep(p:last-child) {
  margin-bottom: 0;
}

.message-body :deep(h1),
.message-body :deep(h2),
.message-body :deep(h3),
.message-body :deep(h4) {
  margin: 1rem 0 0.5rem;
  font-weight: 600;
  line-height: 1.4;
}

.message-body :deep(h1) { font-size: 1.3rem; }
.message-body :deep(h2) { font-size: 1.15rem; }
.message-body :deep(h3) { font-size: 1.05rem; }

.message-body :deep(ul),
.message-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.message-body :deep(li) {
  margin: 0.25rem 0;
}

.message-body :deep(blockquote) {
  border-left: 3px solid var(--accent-purple);
  padding: 0.5rem 1rem;
  margin: 0.5rem 0;
  background: rgba(124, 58, 237, 0.05);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.message-body :deep(code) {
  background: rgba(124, 58, 237, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.82rem;
}

.message-item.user :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-body :deep(pre) {
  background: var(--bg-primary);
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-body :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.82rem;
  line-height: 1.6;
}

.message-body :deep(table) {
  border-collapse: collapse;
  margin: 0.5rem 0;
  width: 100%;
}

.message-body :deep(th),
.message-body :deep(td) {
  border: 1px solid var(--border-color);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.message-body :deep(th) {
  background: var(--bg-input);
  font-weight: 600;
}

.message-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1rem 0;
}

.message-body :deep(a) {
  color: var(--accent-purple);
  text-decoration: none;
}

.message-body :deep(a:hover) {
  text-decoration: underline;
}

.message-body :deep(strong) {
  font-weight: 600;
}

.message-body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

/* 旧的内联代码和代码块样式保留兼容 */
.message-body :deep(code.inline-code) {
  background: rgba(124, 58, 237, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
}

.message-item.user :deep(code.inline-code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-body :deep(pre.code-block) {
  background: var(--bg-primary);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-body :deep(pre.code-block code) {
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding-top: 0.5rem;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-purple);
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-area {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
}

.input-wrapper {
  position: relative;
  margin-bottom: 0.75rem;
}

.input-wrapper textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  resize: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.input-wrapper textarea:focus {
  outline: none;
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.input-wrapper textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-input {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.clear-input:hover {
  color: var(--accent-purple);
  background: rgba(124, 58, 237, 0.1);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.send-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .chat-tab {
    flex-direction: column;
    min-height: 0;
  }

  .sessions-sidebar {
    width: 100%;
    max-height: 160px;
    flex-shrink: 0;
  }

  .chat-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chat-container {
    flex: 1;
    height: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .messages-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .message-content {
    max-width: 85%;
  }

  .chat-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .chat-input-area {
    flex-shrink: 0;
  }
}
</style>