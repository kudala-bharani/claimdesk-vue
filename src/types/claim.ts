export const claimStatuses = ['New', 'In review', 'Needs information', 'Resolved'] as const
export type ClaimStatus = (typeof claimStatuses)[number]
export type ClaimPriority = 'High' | 'Normal'
export type ClaimType = 'Medical' | 'Dental' | 'Vision'
export type SortOrder = 'due-soonest' | 'newest' | 'amount-highest'

export interface ClaimActivity {
  id: string
  at: string
  author: string
  description: string
  note?: string
}

export interface Claim {
  id: string
  memberName: string
  memberId: string
  provider: string
  type: ClaimType
  service: string
  serviceDate: string
  receivedAt: string
  dueDate: string
  amount: number
  status: ClaimStatus
  priority: ClaimPriority
  owner: string
  summary: string
  activity: ClaimActivity[]
}

export interface ClaimUpdate {
  status: ClaimStatus
  note: string
}

export interface ClaimFilters {
  query: string
  status: ClaimStatus | 'All'
  priority: ClaimPriority | 'All'
  mineOnly: boolean
}

// This intentionally small workflow belongs to this demo, not to an insurer.
export const allowedTransitions: Record<ClaimStatus, ClaimStatus[]> = {
  New: ['In review'],
  'In review': ['Needs information', 'Resolved'],
  'Needs information': ['In review'],
  Resolved: ['In review'],
}

export const DEMO_REVIEWER = 'Demo reviewer'
export const DEMO_SNAPSHOT_DATE = '2026-10-17'

export function validateClaimUpdate(claim: Claim, update: ClaimUpdate): string | null {
  if (!allowedTransitions[claim.status].includes(update.status)) {
    return `A claim in ${claim.status.toLowerCase()} cannot move directly to ${update.status.toLowerCase()}.`
  }
  const note = update.note.trim()
  if (note.length < 10) return 'Add a review note of at least 10 characters.'
  if (note.length > 500) return 'Keep the review note to 500 characters or fewer.'
  return null
}
