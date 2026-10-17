import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { claimsApi } from '../services/claimsApi'
import { DEMO_REVIEWER, validateClaimUpdate, type Claim, type ClaimFilters, type ClaimStatus, type ClaimUpdate, type SortOrder } from '../types/claim'

const defaultFilters = (): ClaimFilters => ({ query: '', status: 'All', priority: 'All', mineOnly: false })

export const useClaimsStore = defineStore('claims', () => {
  const claims = ref<Claim[]>([])
  const filters = ref<ClaimFilters>(defaultFilters())
  const sortOrder = ref<SortOrder>('due-soonest')
  const selectedId = ref<string | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const loadError = ref<string | null>(null)
  const updateError = ref<string | null>(null)
  const notice = ref<string | null>(null)
  const failNextSave = ref(false)

  const filteredClaims = computed(() => {
    const query = filters.value.query.trim().toLowerCase()
    const results = claims.value.filter((claim) => {
      const matchesQuery = !query || [claim.id, claim.memberName, claim.memberId, claim.provider, claim.service].some((value) => value.toLowerCase().includes(query))
      return matchesQuery
        && (filters.value.status === 'All' || claim.status === filters.value.status)
        && (filters.value.priority === 'All' || claim.priority === filters.value.priority)
        && (!filters.value.mineOnly || claim.owner === DEMO_REVIEWER)
    })
    return results.sort((a, b) => {
      if (sortOrder.value === 'newest') return b.receivedAt.localeCompare(a.receivedAt) || a.id.localeCompare(b.id)
      if (sortOrder.value === 'amount-highest') return b.amount - a.amount || a.id.localeCompare(b.id)
      // Resolved claims follow active work when sorting by due date.
      const resolvedOrder = Number(a.status === 'Resolved') - Number(b.status === 'Resolved')
      return resolvedOrder || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)
    })
  })

  const selectedClaim = computed(() => claims.value.find((claim) => claim.id === selectedId.value) ?? null)
  const activeFilterCount = computed(() => Number(Boolean(filters.value.query.trim())) + Number(filters.value.status !== 'All') + Number(filters.value.priority !== 'All') + Number(filters.value.mineOnly))
  const statusCounts = computed(() => {
    const counts: Record<ClaimStatus | 'All', number> = { All: claims.value.length, New: 0, 'In review': 0, 'Needs information': 0, Resolved: 0 }
    for (const claim of claims.value) counts[claim.status]++
    return counts
  })
  const stats = computed(() => ({
    open: claims.value.filter((claim) => claim.status !== 'Resolved').length,
    needsInformation: statusCounts.value['Needs information'],
    highPriority: claims.value.filter((claim) => claim.priority === 'High' && claim.status !== 'Resolved').length,
    mine: claims.value.filter((claim) => claim.owner === DEMO_REVIEWER).length,
  }))

  function selectClaim(id: string | null) {
    selectedId.value = id
    updateError.value = null
  }

  watch(filteredClaims, (results) => {
    if (selectedId.value && !results.some((claim) => claim.id === selectedId.value)) selectClaim(null)
  })

  function setFilters(next: Partial<ClaimFilters>) {
    filters.value = { ...filters.value, ...next }
  }

  function resetFilters() {
    filters.value = defaultFilters()
  }

  async function loadClaims() {
    if (loading.value || saving.value) return
    loading.value = true
    loadError.value = null
    try {
      claims.value = await claimsApi.listClaims()
      if (!selectedId.value && !activeFilterCount.value) selectedId.value = filteredClaims.value[0]?.id ?? null
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'The worklist could not be loaded. Please try again.'
    } finally {
      loading.value = false
    }
  }

  async function updateClaim(id: string, update: ClaimUpdate): Promise<boolean> {
    if (saving.value || loading.value) return false
    const existing = claims.value.find((claim) => claim.id === id)
    if (!existing) {
      updateError.value = 'This claim is no longer available. Refresh the worklist.'
      return false
    }
    const validationError = validateClaimUpdate(existing, update)
    if (validationError) {
      updateError.value = validationError
      return false
    }
    saving.value = true
    updateError.value = null
    notice.value = null
    try {
      if (failNextSave.value) {
        claimsApi.failNext('update')
        failNextSave.value = false
      }
      const updated = await claimsApi.updateClaim(id, update)
      claims.value = claims.value.map((claim) => claim.id === id ? updated : claim)
      notice.value = `${id} moved to ${update.status.toLowerCase()}. Review note saved.`
      return true
    } catch (error) {
      updateError.value = error instanceof Error ? error.message : 'The update could not be saved. Please try again.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function simulateLoadError() {
    if (loading.value || saving.value) return
    claimsApi.failNext('list')
    await loadClaims()
  }

  return {
    claims, filters, sortOrder, selectedId, loading, saving, loadError, updateError, notice, failNextSave,
    filteredClaims, selectedClaim, activeFilterCount, statusCounts, stats,
    selectClaim, setFilters, resetFilters, loadClaims, updateClaim, simulateLoadError,
  }
})
