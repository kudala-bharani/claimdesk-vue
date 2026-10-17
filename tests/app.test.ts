import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from '../src/App.vue'
import { claimsApi, createClaimsApi } from '../src/services/claimsApi'

// Keep the real Vue, Pinia and PrimeVue components; replace only the service's
// latency and per-test database so interactions remain deterministic and fast.
let wrapper: VueWrapper | undefined

async function settleRequests() {
  await new Promise<void>((resolve) => setTimeout(resolve, 5))
  await flushPromises()
}

async function renderApp() {
  wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [createPinia(), [PrimeVue, { unstyled: true }]] },
  })
  await settleRequests()
  return wrapper
}

describe('worklist interactions', () => {
  beforeEach(() => {
    const api = createClaimsApi({ delayMs: 0 })
    vi.spyOn(claimsApi, 'listClaims').mockImplementation(() => api.listClaims())
    vi.spyOn(claimsApi, 'updateClaim').mockImplementation((id, update) => api.updateClaim(id, update))
    vi.spyOn(claimsApi, 'failNext').mockImplementation((kind) => api.failNext(kind))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  })

  it('searches visible records, shows an empty state, and restores the list through Clear filters', async () => {
    const app = await renderApp()
    await app.get('#claim-search').setValue('Avery Bennett')
    expect(app.findAll('.claims-table tbody tr')).toHaveLength(1)
    expect(app.get('.claims-table').text()).toContain('CLM-1041')
    expect(app.find('#claim-details').exists()).toBe(false)

    await app.get('#claim-search').setValue('No matching member')
    expect(app.get('.empty-state h3').text()).toBe('No matching claims')
    await app.get('.empty-state button').trigger('click')
    expect((app.get('#claim-search').element as HTMLInputElement).value).toBe('')
    expect(app.findAll('.claims-table tbody tr')).toHaveLength(6)
    expect(app.get('.table-footer').text()).toContain('of 12')
  })

  it('updates a selected claim and removes it from a status filter it no longer matches', async () => {
    const app = await renderApp()
    const newTab = app.findAll('.status-tab').find((button) => button.text().startsWith('New'))!
    await newTab.trigger('click')
    await app.get('[data-claim-id="CLM-1041"]').trigger('click')
    expect(app.get('#detail-heading').text()).toBe('CLM-1041')
    const note = 'Reviewed the service form and started documentation review.'
    await app.get('#review-note').setValue(note)
    await app.get('.review-form').trigger('submit')
    expect(app.get('.save-button').attributes('disabled')).toBeDefined()
    await settleRequests()

    expect(app.get('.success-banner').text()).toContain('CLM-1041 moved to in review')
    expect(app.find('[data-claim-id="CLM-1041"]').exists()).toBe(false)
    expect(app.find('#claim-details').exists()).toBe(false)
    const reviewTab = app.findAll('.status-tab').find((button) => button.text().startsWith('In review'))!
    await reviewTab.trigger('click')
    await app.get('[data-claim-id="CLM-1041"]').trigger('click')
    expect(app.get('.detail-title .status-badge').text()).toBe('In review')
    expect(app.get('.activity-section').text()).toContain(note)
    expect(app.get('.claim-facts').text()).toContain('Demo reviewer')
  })

  it('validates notes, preserves a failed save draft, and successfully retries it once', async () => {
    const app = await renderApp()
    await app.get('#review-note').setValue('Short')
    await app.get('.review-form').trigger('submit')
    expect(app.get('#review-error').text()).toContain('at least 10 characters')
    expect(claimsApi.updateClaim).not.toHaveBeenCalled()

    const note = 'Requested the missing itemized service document.'
    await app.get('#review-note').setValue(note)
    await app.get('.demo-controls summary').trigger('click')
    await app.get('.simulation-toggle input').setValue(true)
    await app.get('.review-form').trigger('submit')
    await settleRequests()
    expect(app.get('#review-error').text()).toContain('could not save')
    expect((app.get('#review-note').element as HTMLTextAreaElement).value).toBe(note)
    expect(app.get('.detail-title .status-badge').text()).toBe('In review')
    expect((app.get('.simulation-toggle input').element as HTMLInputElement).checked).toBe(false)

    await app.get('.review-form').trigger('submit')
    await settleRequests()
    expect(app.find('#review-error').exists()).toBe(false)
    expect(app.get('.detail-title .status-badge').text()).toBe('Needs information')
    expect(app.get('.activity-section').text()).toContain(note)
    expect((app.get('#review-note').element as HTMLTextAreaElement).value).toBe('')
    expect(claimsApi.updateClaim).toHaveBeenCalledTimes(2)
  })

  it('keeps the current page and an unsaved note through a refresh failure and retry', async () => {
    const app = await renderApp()
    await app.get('button[aria-label="Next page"]').trigger('click')
    const claimButton = app.findAll('.claim-link')[0]!
    const claimId = claimButton.text()
    await claimButton.trigger('click')
    const note = 'Draft review note that has not been submitted yet.'
    await app.get('#review-note').setValue(note)
    const simulate = app.findAll('.demo-controls button').find((button) => button.text().includes('Simulate refresh error'))!
    await simulate.trigger('click')
    await settleRequests()
    expect(app.get('.error-banner').text()).toContain('Unable to refresh claims')
    expect(app.get('.table-footer').text()).toContain('7–12')
    expect((app.get('#review-note').element as HTMLTextAreaElement).value).toBe(note)

    await app.get('.error-banner button').trigger('click')
    await settleRequests()
    expect(app.find('.error-banner').exists()).toBe(false)
    expect(app.get('.table-footer').text()).toContain('7–12')
    expect(app.get('#detail-heading').text()).toBe(claimId)
    expect((app.get('#review-note').element as HTMLTextAreaElement).value).toBe(note)
  })

  it('keeps the assignment badge consistent and restores keyboard focus when closing details', async () => {
    const app = await renderApp()
    const assignedButton = app.get('button[aria-label="Assigned to me"]')
    const assignedCount = assignedButton.get('.nav-count').text()
    await assignedButton.trigger('click')
    expect(app.get('.result-count').text()).toBe(assignedCount)
    expect(app.findAll('.claims-table tbody tr')).toHaveLength(Number(assignedCount))

    const recordButton = app.findAll('.claim-link')[0]!
    await recordButton.trigger('click')
    await app.get('button[aria-label="Close claim details"]').trigger('click')
    expect(app.find('#claim-details').exists()).toBe(false)
    expect(document.activeElement).toBe(recordButton.element)
  })
})
