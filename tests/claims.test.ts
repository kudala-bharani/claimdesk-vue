import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { claimFixtures } from '../src/data/claims'
import { claimsApi, createClaimsApi } from '../src/services/claimsApi'
import { useClaimsStore } from '../src/stores/claims'
import { DEMO_REVIEWER, type Claim } from '../src/types/claim'

describe('asynchronous demo service', () => {
  it('saves distinct activity entries when secure-context UUID APIs are unavailable', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID')
    Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: undefined })
    try {
      const api = createClaimsApi({ delayMs: 0 })
      const first = await api.updateClaim('CLM-1041', {
        status: 'In review', note: 'Started reviewing the supporting service details.',
      })
      const second = await api.updateClaim('CLM-1041', {
        status: 'Resolved', note: 'Completed this fictional documentation review.',
      })
      expect(first.status).toBe('In review')
      expect(second.status).toBe('Resolved')
      expect(second.activity).toHaveLength(3)
      expect(second.activity[0]?.id).not.toBe(first.activity[0]?.id)
    } finally {
      if (originalDescriptor) Object.defineProperty(globalThis.crypto, 'randomUUID', originalDescriptor)
      else Reflect.deleteProperty(globalThis.crypto, 'randomUUID')
    }
  })

  it('rejects invalid transitions and short notes before changing a record', async () => {
    const api = createClaimsApi({ delayMs: 0 })
    await expect(api.updateClaim('CLM-1041', {
      status: 'Resolved', note: 'Reviewed the submission and its supporting documents.',
    })).rejects.toThrow('cannot move directly')
    await expect(api.updateClaim('CLM-1041', {
      status: 'In review', note: '   short   ',
    })).rejects.toThrow('at least 10 characters')
    expect((await api.listClaims()).find((claim) => claim.id === 'CLM-1041')?.status).toBe('New')

    const updated = await api.updateClaim('CLM-1041', {
      status: 'In review', note: '  Checked the attached service details.  ',
    })
    expect(updated.status).toBe('In review')
    expect(updated.owner).toBe(DEMO_REVIEWER)
    expect(updated.activity[0]?.note).toBe('Checked the attached service details.')
    expect(updated.activity[0]?.author).toBe(DEMO_REVIEWER)
  })

  it('isolates returned records and consumes a simulated failure once', async () => {
    const api = createClaimsApi({ delayMs: 0 })
    const returned = await api.listClaims()
    returned[0]!.memberName = 'Accidental local edit'
    expect((await api.listClaims())[0]?.memberName).toBe('Morgan Ellis')

    api.failNext('update')
    const update = { status: 'Needs information' as const, note: 'Requested the missing service attachment.' }
    await expect(api.updateClaim('CLM-1042', update)).rejects.toThrow('note is preserved')
    expect((await api.listClaims()).find((claim) => claim.id === 'CLM-1042')?.status).toBe('In review')
    await expect(api.updateClaim('CLM-1042', update)).resolves.toMatchObject({ status: 'Needs information' })
  })
})

describe('shared worklist state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const api = createClaimsApi({ delayMs: 0 })
    vi.spyOn(claimsApi, 'listClaims').mockImplementation(() => api.listClaims())
    vi.spyOn(claimsApi, 'updateClaim').mockImplementation((id, update) => api.updateClaim(id, update))
    vi.spyOn(claimsApi, 'failNext').mockImplementation((kind) => api.failNext(kind))
  })

  it('combines search, status, priority and assignment filters, and sorts results', async () => {
    const store = useClaimsStore()
    await store.loadClaims()
    store.setFilters({ query: '  EVERGREEN  ', status: 'In review', priority: 'High', mineOnly: true })
    expect(store.filteredClaims.map((claim) => claim.id)).toEqual(['CLM-1042'])
    expect(store.activeFilterCount).toBe(4)

    store.setFilters({ query: 'No matching member' })
    await nextTick()
    expect(store.filteredClaims).toEqual([])
    expect(store.selectedId).toBeNull()

    store.resetFilters()
    store.sortOrder = 'amount-highest'
    expect(store.filteredClaims.slice(0, 3).map((claim) => claim.id)).toEqual(['CLM-1040', 'CLM-1035', 'CLM-1042'])
    store.sortOrder = 'newest'
    expect(store.filteredClaims[0]?.id).toBe('CLM-1034')
    store.sortOrder = 'due-soonest'
    expect(store.filteredClaims[0]?.id).toBe('CLM-1042')
    expect(store.filteredClaims.slice(-2).every((claim) => claim.status === 'Resolved')).toBe(true)
  })

  it('retains loaded records after a refresh failure and clears the error on retry', async () => {
    const store = useClaimsStore()
    await store.loadClaims()
    const before = structuredClone(store.claims.map((claim) => ({ id: claim.id, status: claim.status })))
    await store.simulateLoadError()
    expect(store.loadError).toContain('could not refresh')
    expect(store.claims.map((claim) => ({ id: claim.id, status: claim.status }))).toEqual(before)
    expect(store.loading).toBe(false)

    await store.loadClaims()
    expect(store.loadError).toBeNull()
    expect(store.claims).toHaveLength(claimFixtures.length)
  })

  it('prevents a second save or refresh from racing an outstanding update', async () => {
    const store = useClaimsStore()
    await store.loadClaims()
    let finishUpdate!: (claim: Claim) => void
    vi.mocked(claimsApi.updateClaim).mockImplementationOnce(() => new Promise((resolve) => { finishUpdate = resolve }))
    const update = { status: 'Needs information' as const, note: 'Requested the supporting service document.' }
    const firstSave = store.updateClaim('CLM-1042', update)
    expect(store.saving).toBe(true)
    await expect(store.updateClaim('CLM-1042', update)).resolves.toBe(false)
    await store.loadClaims()
    expect(claimsApi.updateClaim).toHaveBeenCalledTimes(1)
    expect(claimsApi.listClaims).toHaveBeenCalledTimes(1)

    finishUpdate({ ...structuredClone(claimFixtures[0]!), status: 'Needs information' })
    await expect(firstSave).resolves.toBe(true)
    expect(store.saving).toBe(false)
    expect(store.selectedClaim?.status).toBe('Needs information')
  })
})
