# ClaimDesk: architecture walkthrough

## Explain it in one minute

> ClaimDesk is a small Vue 3 and TypeScript worklist for fictional claims. It supports combined filters, sorting, record details, and a review workflow with required notes. Pinia holds shared state, while computed values derive the visible records and overview counts. The asynchronous service is an in-memory mock, which lets the app demonstrate loading, errors, and retries without pretending to have a real claims backend. PrimeVue supplies common form controls, and the worklist itself is a semantic HTML table.

Keep the description aligned with what you have reviewed and can explain. AI tools assisted with this implementation; do not describe the demo as employment experience or production claims-system work.

## Follow one user action through the code

1. **Search.** `WorklistFilters.vue` receives the current filters as props. An input update emits a partial filter change. `App.vue` calls the Pinia store's `setFilters` action.
2. **Derive the result.** The store's `filteredClaims` computed value applies query, status, priority, and owner conditions together. It then sorts the result without mutating the original records array. `ClaimTable.vue` receives those results as a prop.
3. **Select.** A claim's explicit button emits its identifier. The store changes `selectedId`; `selectedClaim` derives the selected record. On a narrow screen, the app moves focus and scrolls to the details heading.
4. **Edit.** `ClaimDetails.vue` holds a local note and next-status selection. It derives the allowed options from the current status. It validates the note before emitting an update.
5. **Save.** The store checks the update again, marks the request as saving, and calls the service. The service enforces the same domain rules and returns a copied updated record. Only a successful response replaces the store record. Computed counts and table rows then update automatically.
6. **Recover.** If the save fails, the record stays unchanged, the entered note remains, and an error is shown. The same form can retry. A failed refresh also retains previously loaded data.

## Vue concepts to be able to explain

| Concept | Example in the project | Why it is used |
| --- | --- | --- |
| `ref` | Search filters, records, selected identifier, form note | Holds reactive state. In script code a ref uses `.value`; templates unwrap it. |
| `computed` | `filteredClaims`, `selectedClaim`, counts, valid transitions | Derives values from current state instead of maintaining duplicate values manually. |
| `watch` | Detail fields reset when claim identity or status changes | Performs a side effect when specific primitive values change. An unchanged refresh does not clear the draft. |
| Props and emits | Filters emit changes; details emit validated updates | Keeps parent-owned data separate from component-local form state. |
| Pinia setup store | `useClaimsStore` | Shares records, filters, selection, and request state across the workspace. |
| `storeToRefs` | Store access in `App.vue` | Allows destructuring state and getters without losing their reactive connection. |
| Async actions | `loadClaims` and `updateClaim` | Centralizes request flags, error recovery, and successful record replacement. |

## Practice changes to make yourself

These are small enough to implement, inspect in the browser, and explain during an interview.

1. **Add a claim-type filter.** Extend `ClaimFilters`, update the computed predicate, add a PrimeVue select, and test a search combined with the new filter. This exercises types, props/emits, and shared state together.
2. **Change one visible behavior.** Add a “My claims” checkbox or change a table column. Trace the component event all the way to the store and explain which computed values update.
3. **Improve draft handling.** The current form preserves a draft across a failed save and an unchanged refresh. Extend it to retain separate drafts when switching between claims. Decide where that state belongs and how it should clear after a successful save.
4. **Replace the mock service in a branch.** Design the typed HTTP contract first, then implement a `ClaimsApi` adapter. Discuss cancellation, stale responses, server errors, authorization, and duplicate requests before adding a real backend.

Run `npm test` and `npm run build` after your change. Review the changed source and demonstrate the behavior yourself. The useful interview story is the behavior you understand, the tradeoffs you made, and how you checked it.
