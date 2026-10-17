<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { claimStatuses, type ClaimFilters, type ClaimPriority, type ClaimStatus, type SortOrder } from '../types/claim'

defineProps<{
  filters: ClaimFilters
  sortOrder: SortOrder
  statusCounts: Record<ClaimStatus | 'All', number>
  disabled: boolean
}>()
const emit = defineEmits<{
  change: [filters: Partial<ClaimFilters>]
  sort: [order: SortOrder]
}>()
const statuses: (ClaimStatus | 'All')[] = ['All', ...claimStatuses]
const priorities = [{ label: 'All priorities', value: 'All' }, { label: 'High priority', value: 'High' }, { label: 'Normal priority', value: 'Normal' }]
const sorts = [{ label: 'Due soonest', value: 'due-soonest' }, { label: 'Newest first', value: 'newest' }, { label: 'Highest amount', value: 'amount-highest' }]
function setPriority(priority: ClaimPriority | 'All') { emit('change', { priority }) }
function setSort(order: SortOrder) { emit('sort', order) }
</script>

<template>
  <div class="worklist-filters">
    <div class="status-tabs" role="group" aria-label="Filter claims by status">
      <button
        v-for="status in statuses"
        :key="status"
        type="button"
        class="status-tab"
        :class="{ active: filters.status === status }"
        :aria-pressed="filters.status === status"
        :disabled="disabled"
        @click="emit('change', { status })"
      >
        {{ status === 'All' ? 'All claims' : status }}
        <span class="tab-count">{{ statusCounts[status] }}</span>
      </button>
    </div>
    <p class="sr-only">Status counts show all records in the demo workspace, before search and priority filters.</p>
    <div class="filter-controls">
      <div class="search-field">
        <i class="pi pi-search" aria-hidden="true"></i>
        <label class="sr-only" for="claim-search">Search claims</label>
        <InputText
          id="claim-search"
          type="search"
          :model-value="filters.query"
          placeholder="Search claim, member, or provider"
          :disabled="disabled"
          autocomplete="off"
          @update:model-value="emit('change', { query: $event ?? '' })"
        />
      </div>
      <Select
        input-id="priority-filter"
        :model-value="filters.priority"
        :options="priorities"
        option-label="label"
        option-value="value"
        aria-label="Filter by priority"
        :disabled="disabled"
        class="priority-select"
        @update:model-value="setPriority"
      />
      <Select
        input-id="sort-order"
        :model-value="sortOrder"
        :options="sorts"
        option-label="label"
        option-value="value"
        aria-label="Sort claims"
        :disabled="disabled"
        class="sort-select"
        @update:model-value="setSort"
      />
    </div>
  </div>
</template>
