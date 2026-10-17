import { claimFixtures } from '../data/claims'
import { DEMO_REVIEWER, validateClaimUpdate, type Claim, type ClaimUpdate } from '../types/claim'

type RequestKind = 'list' | 'update'

// These IDs distinguish entries in the page's in-memory demo, not distributed records.
// A sequence also works when the browser does not expose secure-context crypto APIs.
let activitySequence = 0

export interface ClaimsApi {
  listClaims(): Promise<Claim[]>
  updateClaim(id: string, update: ClaimUpdate): Promise<Claim>
  failNext(kind: RequestKind): void
}

/** An in-memory asynchronous service boundary. It does not call a real claims API. */
export function createClaimsApi(options: { delayMs?: number; initialClaims?: Claim[] } = {}): ClaimsApi {
  const delayMs = options.delayMs ?? 450
  const database = structuredClone(options.initialClaims ?? claimFixtures)
  const pendingFailures = new Set<RequestKind>()

  async function request(kind: RequestKind): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
    if (pendingFailures.delete(kind)) {
      throw new Error(kind === 'list'
        ? 'The demo service could not refresh the worklist. Your current records are still available.'
        : 'The demo service could not save this update. Your note is preserved; please try again.')
    }
  }

  return {
    async listClaims() {
      await request('list')
      return structuredClone(database)
    },
    async updateClaim(id, update) {
      await request('update')
      const claim = database.find((record) => record.id === id)
      if (!claim) throw new Error('This claim could not be found. Refresh the worklist and try again.')
      const validationError = validateClaimUpdate(claim, update)
      if (validationError) throw new Error(validationError)
      const activity = {
        id: `${claim.id}-activity-${++activitySequence}`,
        at: new Date().toISOString(),
        author: DEMO_REVIEWER,
        description: `Moved to ${update.status.toLowerCase()}`,
        note: update.note.trim(),
      }
      claim.status = update.status
      if (claim.owner === 'Unassigned') claim.owner = DEMO_REVIEWER
      claim.activity.unshift(activity)
      return structuredClone(claim)
    },
    failNext(kind) {
      pendingFailures.add(kind)
    },
  }
}

export const claimsApi = createClaimsApi()
