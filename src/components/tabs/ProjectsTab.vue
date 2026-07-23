<template>
  <div class="projects-tab">
    <aside class="projects-sidebar">
      <div class="sidebar-heading">
        <div>
          <span class="eyebrow">WORKSPACE</span>
          <h2>创作项目</h2>
        </div>
        <button class="icon-btn" title="新建项目" @click="newProject">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div v-if="store.projects.value.length" class="project-list">
        <button
          v-for="project in store.projects.value"
          :key="project.id"
          class="project-list-item"
          :class="{ active: project.id === store.currentProjectId.value }"
          @click="store.selectProject(project.id)"
        >
          <span class="project-list-name">{{ project.name }}</span>
          <span>{{ projectCount(project.id) }} 个版本</span>
        </button>
      </div>
      <div v-else class="sidebar-empty">从一个项目开始，把灵感、版本和成片放在一起。</div>
    </aside>

    <section v-if="store.currentProject.value" class="project-workspace">
      <header class="project-header">
        <div class="project-title-group">
          <span class="eyebrow">CURRENT PROJECT</span>
          <input
            class="project-name-input"
            :value="store.currentProject.value.name"
            aria-label="项目名称"
            @change="updateProjectName"
          >
          <p>{{ store.currentProjectVersions.value.length }} 个创作版本 · 最近更新 {{ store.formatTime(store.currentProject.value.updatedAt) }}</p>
        </div>
        <div class="project-header-actions">
          <button class="btn-secondary" @click="store.currentTab.value = 'create'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
            开始创作
          </button>
          <button class="icon-btn danger" title="删除项目" @click="removeCurrentProject">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg>
          </button>
        </div>
      </header>

      <div class="workspace-scroll">
        <section class="brief-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">BRIEF</span>
              <h3>创作简报</h3>
            </div>
            <span class="section-note">用于记录目标、受众和风格</span>
          </div>
          <textarea
            class="brief-input"
            :value="store.currentProject.value.brief"
            placeholder="例如：为夏季新品制作一组温暖、轻盈的社媒视觉，面向 25-35 岁城市用户。"
            rows="3"
            @change="updateBrief"
          ></textarea>
        </section>

        <section>
          <div class="section-heading">
            <div>
              <span class="eyebrow">STARTER</span>
              <h3>内容模板</h3>
            </div>
            <span class="section-note">填入提示词和推荐画幅</span>
          </div>
          <div class="template-grid">
            <article v-for="template in store.contentTemplates" :key="template.id" class="template-card">
              <div>
                <h4>{{ template.title }}</h4>
                <p>{{ template.description }}</p>
              </div>
              <button class="template-action" @click="store.applyTemplate(template)">应用模板</button>
            </article>
          </div>
        </section>

        <section class="versions-section">
          <div class="section-heading">
            <div>
              <span class="eyebrow">ITERATIONS</span>
              <h3>版本对比</h3>
            </div>
            <span class="section-note">选择 1-2 个已完成版本进行对照</span>
          </div>

          <div v-if="!store.currentProjectVersions.value.length" class="versions-empty">
            <p>这个项目还没有生成版本。</p>
            <button class="btn-secondary" @click="store.currentTab.value = 'create'">去生成第一个版本</button>
          </div>
          <template v-else>
            <div class="version-picker">
              <button
                v-for="item in store.currentProjectVersions.value"
                :key="item.id"
                class="version-chip"
                :class="{ selected: selectedVersionIds.includes(item.id), disabled: item.status !== 'completed' }"
                :disabled="item.status !== 'completed'"
                @click="toggleVersion(item.id)"
              >
                <span>V{{ item.version || 1 }}</span>
                <small>{{ store.getTypeLabel(item.type) }}</small>
              </button>
            </div>

            <div v-if="selectedVersions.length" class="compare-grid" :class="{ single: selectedVersions.length === 1 }">
              <article v-for="item in selectedVersions" :key="item.id" class="comparison-card">
                <div class="comparison-media">
                  <img v-if="item.type.endsWith('-image')" :src="item.mediaUrl" :alt="`版本 ${item.version}`">
                  <video v-else :src="item.mediaUrl" controls preload="metadata"></video>
                </div>
                <div class="comparison-meta">
                  <div><span class="version-label">V{{ item.version || 1 }}</span><span class="media-label">{{ store.getTypeLabel(item.type) }}</span></div>
                  <p>{{ item.prompt }}</p>
                  <time>{{ store.formatTime(item.createdAt) }}</time>
                </div>
              </article>
            </div>
          </template>
        </section>
      </div>
    </section>

    <section v-else class="project-empty">
      <div class="project-empty-icon">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"/><path d="M12 10v6m-3-3h6"/></svg>
      </div>
      <h2>把每次创作放进一个项目</h2>
      <p>项目会保留创作简报、模板和生成版本，方便继续迭代。</p>
      <button class="btn-primary create-first" @click="newProject">新建项目</button>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../../composables/useAppStore.js'

const store = useAppStore()
const selectedVersionIds = ref([])

const selectedVersions = computed(() => store.currentProjectVersions.value
  .filter(item => selectedVersionIds.value.includes(item.id))
  .filter(item => item.status === 'completed'))

function newProject() {
  store.createProject('新项目')
  selectedVersionIds.value = []
}

function updateProjectName(event) {
  store.updateCurrentProject({ name: event.target.value.trim() || '未命名项目' })
}

function updateBrief(event) {
  store.updateCurrentProject({ brief: event.target.value })
}

function removeCurrentProject() {
  const project = store.currentProject.value
  if (!project || !confirm(`删除“${project.name}”吗？作品会保留在画廊中。`)) return
  store.deleteProject(project.id)
  selectedVersionIds.value = []
}

function projectCount(projectId) {
  return store.galleryItems.value.filter(item => item.projectId === projectId).length
}

function toggleVersion(id) {
  if (selectedVersionIds.value.includes(id)) {
    selectedVersionIds.value = selectedVersionIds.value.filter(value => value !== id)
  } else {
    selectedVersionIds.value = [...selectedVersionIds.value.slice(-1), id]
  }
}
</script>

<style scoped>
.projects-tab { display: grid; grid-template-columns: 250px minmax(0, 1fr); height: 100%; min-height: 0; border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden; }
.projects-sidebar { padding: 1.25rem; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; min-height: 0; }
.sidebar-heading, .project-header, .section-heading { display: flex; justify-content: space-between; gap: 1rem; }
.sidebar-heading { align-items: flex-start; margin-bottom: 1.25rem; }
.eyebrow { display: block; color: var(--accent-cyan); font-size: .68rem; font-weight: 700; letter-spacing: .08em; }
h2, h3, h4, p { margin: 0; }
.sidebar-heading h2 { font-size: 1.2rem; margin-top: .25rem; }
.icon-btn { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; padding: 0; color: var(--text-primary); background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; }
.icon-btn:hover { border-color: var(--accent-purple); color: #fff; background: var(--accent-purple); }
.icon-btn.danger:hover { background: var(--danger); border-color: var(--danger); }
.project-list { display: grid; gap: .4rem; overflow-y: auto; }
.project-list-item { width: 100%; border: 1px solid transparent; border-radius: var(--radius-sm); padding: .75rem; text-align: left; color: var(--text-muted); background: transparent; cursor: pointer; display: grid; gap: .3rem; font-size: .75rem; }
.project-list-item:hover { background: var(--bg-tertiary); color: var(--text-secondary); }
.project-list-item.active { background: rgba(124, 58, 237, .16); color: #d8ccff; border-color: rgba(167,139,250,.35); }
.project-list-name { color: var(--text-primary); font-size: .9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-empty { color: var(--text-muted); font-size: .82rem; line-height: 1.6; padding: .75rem 0; }
.project-workspace { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: var(--bg-primary); }
.project-header { align-items: center; padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--border-color); }
.project-title-group { min-width: 0; }
.project-name-input { width: 100%; min-width: 280px; max-width: 550px; border: 0; padding: .2rem 0; background: transparent; color: var(--text-primary); font-size: 1.5rem; font-weight: 700; outline: none; }
.project-name-input:focus { border-bottom: 1px solid var(--accent-purple); }
.project-title-group p, .section-note { color: var(--text-muted); font-size: .78rem; }
.project-header-actions { display: flex; gap: .5rem; align-items: center; flex-shrink: 0; }
.project-header-actions .btn-secondary { display: inline-flex; gap: .4rem; align-items: center; }
.workspace-scroll { overflow-y: auto; padding: 1.75rem; display: grid; gap: 2rem; }
.section-heading { align-items: end; margin-bottom: .85rem; }
.section-heading h3 { margin-top: .2rem; font-size: 1rem; }
.brief-input { box-sizing: border-box; display: block; width: 100%; resize: vertical; padding: .85rem 1rem; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font: inherit; font-size: .9rem; line-height: 1.55; }
.brief-input:focus { outline: none; border-color: var(--accent-purple); }
.template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.template-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 130px; padding: 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); }
.template-card:hover { border-color: rgba(167,139,250,.65); }
.template-card h4 { font-size: .95rem; }
.template-card p { margin-top: .35rem; color: var(--text-muted); font-size: .8rem; line-height: 1.5; }
.template-action { align-self: flex-start; margin-top: 1rem; padding: .35rem 0; color: #bdaaff; background: transparent; border: 0; font: inherit; font-size: .8rem; cursor: pointer; }
.template-action:hover { color: #fff; }
.versions-section { min-height: 0; }
.versions-empty { padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-md); }
.versions-empty .btn-secondary { margin-top: .9rem; }
.version-picker { display: flex; gap: .5rem; overflow-x: auto; padding-bottom: .5rem; }
.version-chip { flex: 0 0 auto; padding: .55rem .7rem; color: var(--text-secondary); border: 1px solid var(--border-color); background: var(--bg-card); border-radius: var(--radius-sm); cursor: pointer; display: grid; gap: .1rem; text-align: left; }
.version-chip small { color: var(--text-muted); font-size: .67rem; }
.version-chip.selected { color: #fff; border-color: var(--accent-purple); background: rgba(124,58,237,.25); }
.version-chip.disabled { opacity: .45; cursor: not-allowed; }
.compare-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: .5rem; }
.compare-grid.single { grid-template-columns: minmax(0, 1fr); max-width: 560px; }
.comparison-card { border: 1px solid var(--border-color); background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; }
.comparison-media { aspect-ratio: 16 / 10; background: var(--bg-input); display: grid; place-items: center; }
.comparison-media img, .comparison-media video { width: 100%; height: 100%; object-fit: contain; }
.comparison-meta { padding: .9rem; }
.comparison-meta > div { display: flex; gap: .45rem; align-items: center; }
.version-label { padding: .16rem .42rem; color: #d8ccff; background: rgba(124,58,237,.22); border-radius: 3px; font-size: .7rem; font-weight: 700; }
.media-label, .comparison-meta time { color: var(--text-muted); font-size: .72rem; }
.comparison-meta p { margin: .55rem 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.project-empty { height: 100%; display: grid; place-content: center; text-align: center; color: var(--text-muted); }
.project-empty-icon { color: var(--accent-purple); margin-bottom: 1rem; }
.project-empty h2 { color: var(--text-primary); font-size: 1.3rem; }
.project-empty p { max-width: 360px; margin: .65rem auto 1.25rem; font-size: .9rem; line-height: 1.6; }
.create-first { width: auto; justify-self: center; padding: .75rem 1.5rem; }
@media (max-width: 840px) { .projects-tab { grid-template-columns: 190px minmax(0,1fr); } .project-header { align-items: flex-start; flex-direction: column; } .template-grid { grid-template-columns: 1fr; } }
@media (max-width: 620px) { .projects-tab { display: block; overflow: auto; } .projects-sidebar { border-right: 0; border-bottom: 1px solid var(--border-color); } .project-list { display: flex; overflow-x: auto; } .project-list-item { min-width: 130px; } .project-workspace { min-height: auto; } .workspace-scroll { overflow: visible; padding: 1.25rem; } .project-header { padding: 1.25rem; } .project-name-input { min-width: 0; font-size: 1.25rem; } .compare-grid { grid-template-columns: 1fr; } }
</style>
