<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import StatusBadge from './StatusBadge.vue'
import { allowedTransitions, validateClaimUpdate, type Claim, type ClaimStatus, type ClaimUpdate } from '../types/claim'
import { formatCurrency, formatDate, initials } from '../lib/format'

const props = defineProps<{ claim: Claim; saving: boolean; busy: boolean; error: string | null }>()
const emit = defineEmits<{ update: [id: string, update: ClaimUpdate]; close: [] }>()
const nextStatus = ref<ClaimStatus>('In review')
const note = ref('')
const attempted = ref(false)
const transitions = computed(() => allowedTransitions[props.claim.status])
const validationError = computed(() => attempted.value ? validateClaimUpdate(props.claim, { status: nextStatus.value, note: note.value }) : null)
const formError = computed(() => validationError.value ?? props.error)

watch([() => props.claim.id, () => props.claim.status], () => {
  nextStatus.value = allowedTransitions[props.claim.status][0] ?? 'In review'
  note.value = ''
  attempted.value = false
}, { immediate: true })

function submit() {
  if (props.saving || props.busy) return
  attempted.value = true
  if (validationError.value) return
  emit('update', props.claim.id, { status: nextStatus.value, note: note.value.trim() })
}
</script>

<template>
  <aside id="claim-details" class="detail-panel" aria-labelledby="detail-heading" :aria-busy="saving">
    <div class="detail-topline"><span class="eyebrow">Claim details</span><Button icon="pi pi-times" text rounded severity="secondary" aria-label="Close claim details" :disabled="saving" @click="emit('close')" /></div>
    <div class="detail-title"><h2 id="detail-heading" tabindex="-1">{{ claim.id }}</h2><StatusBadge :status="claim.status" /></div>
    <div class="member-block"><span class="member-avatar" aria-hidden="true">{{ initials(claim.memberName) }}</span><div><h3>{{ claim.memberName }}</h3><p>{{ claim.memberId }} · Fictional member</p></div></div>
    <div class="detail-summary-strip"><div><span>Submitted amount</span><strong>{{ formatCurrency(claim.amount) }}</strong></div><div><span>Priority</span><strong class="detail-priority" :class="{ high: claim.priority === 'High' }"><i :class="claim.priority === 'High' ? 'pi pi-flag-fill' : 'pi pi-minus'" aria-hidden="true"></i>{{ claim.priority }}</strong></div></div>

    <dl class="claim-facts">
      <div class="wide"><dt>Provider</dt><dd>{{ claim.provider }}</dd></div>
      <div class="wide"><dt>Service</dt><dd>{{ claim.service }} <span class="inline-type">{{ claim.type }}</span></dd></div>
      <div><dt>Service date</dt><dd>{{ formatDate(claim.serviceDate, true) }}</dd></div>
      <div><dt>Received</dt><dd>{{ formatDate(claim.receivedAt, true) }}</dd></div>
      <div><dt>Review by</dt><dd>{{ formatDate(claim.dueDate, true) }}</dd></div>
      <div><dt>Assigned to</dt><dd>{{ claim.owner }}</dd></div>
    </dl>

    <details class="review-context"><summary><i class="pi pi-file" aria-hidden="true"></i> Review context <i class="pi pi-angle-down" aria-hidden="true"></i></summary><p>{{ claim.summary }}</p></details>

    <form class="review-form" novalidate @submit.prevent="submit">
      <div class="form-heading"><h3>Update review</h3><span>Note required</span></div>
      <label for="next-status">Move claim to</label>
      <Select input-id="next-status" v-model="nextStatus" :options="transitions" :disabled="saving || busy" aria-describedby="workflow-hint" class="workflow-select" />
      <p id="workflow-hint" class="sr-only">Only the next valid steps in this demo workflow are available.</p>
      <label for="review-note">Review note</label>
      <Textarea id="review-note" v-model="note" rows="3" maxlength="500" placeholder="Describe what you reviewed and the next step…" :disabled="saving || busy" :invalid="Boolean(validationError)" :aria-invalid="Boolean(validationError)" :aria-describedby="formError ? 'note-help review-error' : 'note-help'" />
      <div id="note-help" class="note-help"><span>At least 10 characters</span><span>{{ note.length }}/500</span></div>
      <div v-if="formError" id="review-error" class="inline-error" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>{{ formError }}</span></div>
      <Button type="submit" :label="saving ? 'Saving update…' : 'Save update'" icon="pi pi-check" :loading="saving" :disabled="saving || busy" class="save-button" />
      <p class="session-note"><i class="pi pi-info-circle" aria-hidden="true"></i>Demo changes last until you reload this page.</p>
    </form>

    <details class="activity-section"><summary><span><i class="pi pi-history" aria-hidden="true"></i> Activity history</span><span class="activity-count">{{ claim.activity.length }}<i class="pi pi-angle-down" aria-hidden="true"></i></span></summary><ol><li v-for="event in claim.activity" :key="event.id"><span class="timeline-dot" aria-hidden="true"></span><h4>{{ event.description }}</h4><p v-if="event.note">{{ event.note }}</p><small>{{ event.author }} · {{ formatDate(event.at, true) }}</small></li></ol></details>
  </aside>
</template>
