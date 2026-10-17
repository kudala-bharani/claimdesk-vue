<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import ClaimDetails from './components/ClaimDetails.vue'
import ClaimTable from './components/ClaimTable.vue'
import WorklistFilters from './components/WorklistFilters.vue'
import { useClaimsStore } from './stores/claims'
import { DEMO_SNAPSHOT_DATE, type ClaimUpdate } from './types/claim'
import { formatDate } from './lib/format'

const store = useClaimsStore()
const { claims, filters, sortOrder, selectedId, selectedClaim, loading, saving, loadError, updateError, notice, failNextSave, filteredClaims, activeFilterCount, statusCounts, stats } = storeToRefs(store)
const currentView = computed(() => filters.value.mineOnly ? 'mine' : filters.value.status === 'Needs information' ? 'information' : 'all')

function chooseView(view: 'all' | 'mine' | 'information') {
  store.resetFilters()
  if (view === 'mine') store.setFilters({ mineOnly: true })
  if (view === 'information') store.setFilters({ status: 'Needs information' })
}

async function saveUpdate(id: string, update: ClaimUpdate) {
  await store.updateClaim(id, update)
}

async function openClaim(id: string) {
  store.selectClaim(id)
  await nextTick()
  if (window.matchMedia('(max-width: 960px)').matches) {
    document.getElementById('detail-heading')?.focus({ preventScroll: true })
    document.getElementById('claim-details')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
}

async function closeDetails() {
  const previousId = selectedId.value
  store.selectClaim(null)
  await nextTick()
  if (previousId) document.querySelector<HTMLButtonElement>(`[data-claim-id="${previousId}"]`)?.focus()
}

onMounted(() => store.loadClaims())
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to claims worklist</a>
  <div class="app-shell">
    <aside class="sidebar" aria-label="Workspace navigation">
      <a class="brand" href="./" aria-label="ClaimDesk home"><span class="brand-mark"><i class="pi pi-file-check" aria-hidden="true"></i></span><span>ClaimDesk<span class="brand-dot">.</span></span></a>
      <div class="workspace-switch"><span class="workspace-avatar">D</span><div><strong>Demo workspace</strong><span>Claims operations</span></div><i class="pi pi-lock" aria-hidden="true"></i></div>
      <span class="nav-label">Workspace</span>
      <nav class="main-nav">
        <button type="button" aria-label="All claims" :class="{ active: currentView === 'all' }" :aria-pressed="currentView === 'all'" :disabled="saving" @click="chooseView('all')"><i class="pi pi-inbox" aria-hidden="true"></i><span>All claims</span><span class="nav-count">{{ claims.length }}</span></button>
        <button type="button" aria-label="Assigned to me" :class="{ active: currentView === 'mine' }" :aria-pressed="currentView === 'mine'" :disabled="saving" @click="chooseView('mine')"><i class="pi pi-user" aria-hidden="true"></i><span>Assigned to me</span><span class="nav-count">{{ stats.mine }}</span></button>
        <button type="button" aria-label="Needs information" :class="{ active: currentView === 'information' }" :aria-pressed="currentView === 'information'" :disabled="saving" @click="chooseView('information')"><i class="pi pi-clock" aria-hidden="true"></i><span>Needs information</span><span class="nav-count">{{ stats.needsInformation }}</span></button>
      </nav>
      <div class="sidebar-guide"><span class="guide-icon"><i class="pi pi-compass" aria-hidden="true"></i></span><h2>A little clarity.<br />A smoother review.</h2><p>Open a claim, review the details, and record the next step.</p></div>
      <div class="sidebar-bottom"><a href="https://github.com/kudala-bharani/claimdesk-vue" target="_blank" rel="noopener noreferrer"><i class="pi pi-github" aria-hidden="true"></i> View project <i class="pi pi-arrow-up-right" aria-hidden="true"></i></a><div class="reviewer"><span class="reviewer-avatar">DR</span><div><strong>Demo reviewer</strong><span>Fictional workspace</span></div></div></div>
    </aside>

    <div class="main-shell">
      <header class="topbar"><div class="breadcrumb"><i class="pi pi-th-large" aria-hidden="true"></i><span>Operations</span><i class="pi pi-angle-right" aria-hidden="true"></i><strong>Claims</strong></div><span class="demo-badge"><span aria-hidden="true"></span> Demo · fictional data</span></header>
      <main id="main-content" tabindex="-1">
        <section class="page-heading"><div><span class="eyebrow">Your workspace, in focus</span><h1>Claims worklist</h1><p>Review incoming claims and keep your queue moving.</p></div><Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" :disabled="loading || saving" @click="store.loadClaims()" /></section>

        <section class="metrics" aria-label="Overview of all loaded demo claims">
          <div class="metric-card"><div><span class="metric-label">Open claims</span><strong>{{ loading && !claims.length ? '—' : stats.open }}</strong><span class="metric-caption">Ready for the next step</span></div><span class="metric-icon teal"><i class="pi pi-inbox" aria-hidden="true"></i></span><div class="metric-bottom"><span class="metric-indicator teal" aria-hidden="true"></span>Across all reviewers</div></div>
          <div class="metric-card"><div><span class="metric-label">Needs information</span><strong>{{ loading && !claims.length ? '—' : stats.needsInformation }}</strong><span class="metric-caption">Waiting on documentation</span></div><span class="metric-icon amber"><i class="pi pi-clock" aria-hidden="true"></i></span><div class="metric-bottom"><span class="metric-indicator amber" aria-hidden="true"></span>A clear follow-up needed</div></div>
          <div class="metric-card"><div><span class="metric-label">High priority</span><strong>{{ loading && !claims.length ? '—' : stats.highPriority }}</strong><span class="metric-caption">Open claims flagged for attention</span></div><span class="metric-icon coral"><i class="pi pi-flag" aria-hidden="true"></i></span><div class="metric-bottom"><span class="metric-indicator coral" aria-hidden="true"></span>Review these first</div></div>
        </section>

        <div v-if="loadError" class="feedback-banner error-banner" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i><div><strong>Unable to refresh claims</strong><p>{{ loadError }}</p></div><Button label="Retry" icon="pi pi-refresh" severity="secondary" outlined :disabled="loading || saving" @click="store.loadClaims()" /></div>
        <div v-if="notice" class="feedback-banner success-banner" role="status"><i class="pi pi-check-circle" aria-hidden="true"></i><p>{{ notice }}</p><Button icon="pi pi-times" text rounded severity="secondary" aria-label="Dismiss saved confirmation" @click="notice = null" /></div>

        <div class="work-area">
          <div class="worklist-column">
            <div class="worklist-card">
              <WorklistFilters :filters="filters" :sort-order="sortOrder" :status-counts="statusCounts" :disabled="saving" @change="store.setFilters" @sort="sortOrder = $event" />
              <div v-if="activeFilterCount" class="active-filters"><span><i class="pi pi-filter" aria-hidden="true"></i>{{ filters.mineOnly ? 'Assigned to you' : `${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}` }}</span><button type="button" :disabled="saving" @click="store.resetFilters()">Clear filters <i class="pi pi-times" aria-hidden="true"></i></button></div>
              <ClaimTable :claims="filteredClaims" :selected-id="selectedId" :loading="loading" :disabled="saving" :filters-active="Boolean(activeFilterCount)" @select="openClaim" @reset="store.resetFilters()" />
            </div>
            <div class="worklist-footnote"><i class="pi pi-info-circle" aria-hidden="true"></i><p>All names and records are fictional. Amounts and counts come from this demo dataset.</p></div>
            <details class="demo-controls"><summary><i class="pi pi-sliders-h" aria-hidden="true"></i> Demo controls</summary><div><p>Explore how the worklist recovers from a failed request.</p><Button label="Simulate refresh error" icon="pi pi-refresh" severity="secondary" outlined size="small" :disabled="loading || saving" @click="store.simulateLoadError()" /><label class="simulation-toggle"><input v-model="failNextSave" type="checkbox" :disabled="saving" /> Fail the next save once</label><span class="snapshot-label">Fixture snapshot: {{ formatDate(DEMO_SNAPSHOT_DATE, true) }}</span></div></details>
          </div>

          <ClaimDetails v-if="selectedClaim" :claim="selectedClaim" :saving="saving" :busy="loading" :error="updateError" @update="saveUpdate" @close="closeDetails" />
          <aside v-else class="detail-panel detail-placeholder" aria-label="Claim details"><div class="placeholder-graphic"><i class="pi pi-file-check" aria-hidden="true"></i><span><i class="pi pi-arrow-up-right" aria-hidden="true"></i></span></div><span class="eyebrow">One claim at a time</span><h2>Select a claim</h2><p>Choose a record from the worklist to see its details and update the review.</p><div class="placeholder-steps"><span><i class="pi pi-check" aria-hidden="true"></i> Review the submission</span><span><i class="pi pi-check" aria-hidden="true"></i> Choose the next step</span><span><i class="pi pi-check" aria-hidden="true"></i> Leave a clear note</span></div></aside>
        </div>
        <footer class="page-footer"><span>ClaimDesk <span class="footer-divider">/</span> A focused frontend demo</span><span>Built with Vue 3 · TypeScript · PrimeVue</span></footer>
      </main>
    </div>
  </div>
</template>
