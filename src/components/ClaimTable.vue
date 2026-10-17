<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import StatusBadge from './StatusBadge.vue'
import { formatCurrency, formatDate } from '../lib/format'
import type { Claim } from '../types/claim'

const props = defineProps<{
  claims: Claim[]
  selectedId: string | null
  loading: boolean
  disabled: boolean
  filtersActive: boolean
}>()
const emit = defineEmits<{ select: [id: string]; reset: [] }>()
const page = ref(1)
const pageSize = 6
const pageCount = computed(() => Math.max(1, Math.ceil(props.claims.length / pageSize)))
const pageClaims = computed(() => props.claims.slice((page.value - 1) * pageSize, page.value * pageSize))
const startIndex = computed(() => props.claims.length ? (page.value - 1) * pageSize + 1 : 0)
const endIndex = computed(() => Math.min(page.value * pageSize, props.claims.length))
watch(() => props.claims.map((claim) => claim.id).join(','), () => { page.value = 1 })

function select(id: string) {
  if (!props.disabled) emit('select', id)
}
</script>

<template>
  <section class="queue-panel" aria-label="Claims results" :aria-busy="loading">
    <div class="queue-heading">
      <div><h2>Worklist <span class="result-count">{{ claims.length }}</span></h2><p>{{ filtersActive ? 'Filtered results' : 'All records in this demo workspace' }}</p></div>
      <span v-if="loading && claims.length" class="refreshing" role="status"><i class="pi pi-spin pi-spinner" aria-hidden="true"></i> Refreshing</span>
      <span v-else class="queue-hint"><span class="small-dot" aria-hidden="true"></span> {{ filtersActive ? 'Filters applied' : 'Ready for review' }}</span>
    </div>

    <div v-if="loading && !claims.length" class="loading-table" role="status" aria-label="Loading claims">
      <div class="skeleton-header"><Skeleton width="5rem" height="0.8rem" /><Skeleton width="6rem" height="0.8rem" /><Skeleton width="5rem" height="0.8rem" /></div>
      <div v-for="row in 6" :key="row" class="skeleton-row"><div><Skeleton width="5rem" height="0.85rem" /><Skeleton width="7rem" height="0.7rem" /></div><Skeleton width="6rem" height="1.5rem" /><Skeleton width="3.5rem" height="0.85rem" /></div>
    </div>

    <div v-else-if="!claims.length" class="empty-state">
      <span class="empty-icon"><i class="pi pi-search" aria-hidden="true"></i></span>
      <h3>{{ filtersActive ? 'No matching claims' : 'No claims to show' }}</h3>
      <p>{{ filtersActive ? 'Try another search or clear your filters to see the worklist.' : 'Use Refresh to load the fictional worklist.' }}</p>
      <Button v-if="filtersActive" label="Clear filters" severity="secondary" outlined @click="emit('reset')" />
    </div>

    <div v-else class="table-scroll">
      <table class="claims-table">
        <caption class="sr-only">Claims worklist. Choose a claim identifier to open its details.</caption>
        <thead><tr><th scope="col">Claim / member</th><th scope="col">Status</th><th scope="col" class="amount-cell">Amount</th><th scope="col" class="due-column">Review by</th><th scope="col" class="row-end"><span class="sr-only">Priority</span></th></tr></thead>
        <tbody>
          <tr v-for="claim in pageClaims" :key="claim.id" :class="{ selected: selectedId === claim.id }" @click="select(claim.id)">
            <td class="identity-cell">
              <button type="button" class="claim-link" :data-claim-id="claim.id" :disabled="disabled" :aria-label="`View claim ${claim.id} for ${claim.memberName}`" :aria-current="selectedId === claim.id ? 'true' : undefined" @click.stop="select(claim.id)">{{ claim.id }}</button>
              <span class="member-name">{{ claim.memberName }}</span>
              <span class="mobile-claim-meta">{{ claim.type }} · {{ formatDate(claim.dueDate) }}</span>
            </td>
            <td><StatusBadge :status="claim.status" /><span class="table-service">{{ claim.type }}</span></td>
            <td class="amount-cell"><span class="claim-amount">{{ formatCurrency(claim.amount) }}</span></td>
            <td class="due-column"><span class="due-date">{{ formatDate(claim.dueDate) }}</span><span class="table-service">2026</span></td>
            <td class="row-end"><span v-if="claim.priority === 'High'" class="priority-flag" title="High priority"><i class="pi pi-flag-fill" aria-hidden="true"></i><span class="sr-only">High priority</span></span><i v-else class="pi pi-angle-right row-chevron" aria-hidden="true"></i></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <span aria-live="polite">Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ claims.length }}</strong></span>
      <div class="pagination" aria-label="Claims pagination">
        <Button icon="pi pi-angle-left" text severity="secondary" aria-label="Previous page" :disabled="page <= 1 || disabled || loading" @click="page--" />
        <span>{{ page }} <span class="page-divider">/</span> {{ pageCount }}</span>
        <Button icon="pi pi-angle-right" text severity="secondary" aria-label="Next page" :disabled="page >= pageCount || disabled || loading" @click="page++" />
      </div>
    </div>
  </section>
</template>
