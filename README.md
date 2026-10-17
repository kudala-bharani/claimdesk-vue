# ClaimDesk

[Open the live demo](https://kudala-bharani.github.io/claimdesk-vue/)

A focused claims worklist built with **Vue 3, TypeScript, Pinia, and PrimeVue**. The interface brings search, review context, valid workflow steps, and recoverable request states into one small application.

This is a portfolio demo with entirely fictional records. It is not affiliated with an insurer and does not perform coverage, payment, or medical decisions.

## Try the workflow

1. Search by claim identifier, member, provider, or service. Combine the search with a status tab, priority filter, or the **Assigned to me** view.
2. Sort the worklist by review date, received date, or amount. Use the pagination controls to browse the fixture records.
3. Select a claim to view the submitted details and activity history.
4. Choose a valid next status, write a note of 10–500 characters, and save. The table, overview counts, and activity history update together.
5. Expand **Demo controls** to simulate a failed refresh or make the next save fail once. A refresh failure retains the loaded records. A save failure retains the note so the operation can be retried.

The dataset contains 12 fictional claims. Overview cards and tab counts are calculated from all loaded records; search and filters narrow the worklist only. **High priority** counts open high-priority claims. **Assigned to me** includes all claims assigned to the fictional demo reviewer, including resolved records.

## Run locally

Use Node.js **22.12 or later**. The lockfile records the dependency versions used by the build.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. There are no credentials, environment variables, or backend services to configure.

```sh
npm test        # Focused API, store, and Vue interaction checks
npm run build  # Type-check Vue/TypeScript and build static assets
npm run preview
```

The production build is written to `dist/`. Vite uses relative asset paths, so the static build can also be hosted below a path such as `/claimdesk-vue/`.

### Publish a static update

`npm run build:pages` builds the app and refreshes the generated `docs/` folder. Commit the source changes together with `docs/`. GitHub Pages serves that folder from `main`; no backend credentials are needed. `docs/` contains generated assets, so make interface changes in `src/`.

## Implementation

| Layer | Responsibility |
| --- | --- |
| `src/types/claim.ts` | Typed claim records, filters, status transitions, and review-note validation. |
| `src/data/claims.ts` | Invented fixture records and initial activity history. |
| `src/services/claimsApi.ts` | An asynchronous, in-memory service with one-shot simulated failures. It returns copies rather than exposing its internal records. |
| `src/stores/claims.ts` | Pinia setup store for records, selection, filters, computed counts, sorting, and async actions. It keeps existing records on a load failure and updates them after a successful save. |
| `src/components/WorklistFilters.vue` | Search, status, priority, and sort controls that emit changes to the parent. |
| `src/components/ClaimTable.vue` | Semantic table, explicit keyboard-operable selection buttons, pagination, and loading/empty states. |
| `src/components/ClaimDetails.vue` | Typed props and emitted updates, note validation, review fields, activity history, and save-error recovery. |
| `src/App.vue` | Workspace composition, navigation, feedback banners, and responsive focus behavior. |

The app uses Vue single-file components with `<script setup lang="ts">`, `ref`, `computed`, `watch`, props, and emits. PrimeVue supplies the input, select, textarea, button, and skeleton components; the table uses native HTML semantics. Pinia's `storeToRefs` preserves reactivity when store properties are read in the root component.

See [INTERVIEW.md](./INTERVIEW.md) for an architecture walkthrough and small practice changes.

## Deliberate boundaries

- **The service is mocked.** It has asynchronous methods, not HTTP endpoints or a real REST integration. State lasts for the page session and resets on a full reload. Refresh reloads the in-memory service's current records.
- **There is no authentication or authorization.** “Demo reviewer” is a fixed fictional label. No OAuth, OIDC, token storage, or access control is implied.
- **The workflow is illustrative.** `New → In review → Needs information / Resolved`, with a return to review where defined. “Resolved” means the demo review is complete; it does not approve or deny a claim.
- **Data and dates are fixtures.** Review dates use the October 17, 2026 snapshot; newly added activity uses the browser's current time. No real member data, provider data, or documents are loaded.
- **This is a focused frontend sample.** Production work would need a verified API contract, authentication, authorization, server validation, durable storage, observability, and product-specific workflow rules.
- **Accessibility work is concrete but not a certification.** The implementation includes labels, semantic controls, visible focus, reduced-motion behavior, keyboard selection, and live feedback. It does not claim complete WCAG compliance.

Google Fonts is used for optional typography, with local system-font fallbacks. The app continues to work if fonts cannot be loaded. No analytics or tracking is included.

## Development note

AI tools assisted with implementation and documentation. Source, explicit limitations, tests, and reproducible build commands are included so the behavior can be inspected and extended.

## References

- [Vue: Composition API and TypeScript](https://vuejs.org/guide/typescript/composition-api.html)
- [Pinia: Setup stores](https://pinia.vuejs.org/core-concepts/)
- [PrimeVue: Vite setup](https://v4.primevue.org/vite)
- [Vue: Testing](https://vuejs.org/guide/scaling-up/testing.html)
- [Project repository](https://github.com/kudala-bharani/claimdesk-vue)
