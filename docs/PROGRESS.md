# OneAtlas progress

## Module 1 · Foundation

- Created a Next.js App Router project in the existing checkout on `main`. The root layout provides shared metadata, a header, and a keyboard skip link. The catalog entry page shows its setup status, and unknown routes render a 404 page.
- Pinned the foundation dependencies and added the npm lockfile, lint and TypeScript checks, build scripts, and a local database environment example. The shell works without a database.
- Reviewed all four reference products and documented the architecture, data rules, module acceptance criteria, and initial deployment compatibility.
- Verified the repository-local author and committer identity. The existing origin had no `HEAD` or `main` ref at inspection.

### Verification

- A clean `npm ci --offline --no-audit --no-fund` install from the lockfile passed. `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Headless Chrome verified the production home and 404 responses, the link back to the catalog, keyboard focus through the skip link, and no horizontal overflow at 390 px and 320 px.
- Turbopack's CSS worker exited early on Windows. The development and build scripts use Next.js's supported Webpack mode.

## Module 2 · Database

- Set up PostgreSQL 18.7 in Docker Compose with a loopback port and a named volume. Added the six-table catalog schema, an initial migration, and a server-only Prisma 7.10.1 client.
- Seeded five demo labs, five providers, 30 models, 40 offerings, three benchmark definitions, and 45 results in a single transaction. The seed validates the fixtures and skips existing rows on reruns.
- Applied the migration to the local PostgreSQL container. Prisma migration status reports the schema is up to date. The second seed inserted zero rows and snapshots of the six catalog tables matched.
- Queried related lab, provider, offering, and benchmark records via the server-side client. Verified zero and null prices, provider-specific rates, missing results, and rejection of negative prices.
- Prisma validation and client generation passed, along with `npm run lint`, `npm run typecheck`, and `npm run build`.

## Module 3 · Catalog APIs

- Added model list, model detail, and catalog filter endpoints. Zod validates the URL parameters and bounds pagination. The server-side catalog layer owns PostgreSQL queries and decimal and date serialization.
- Model search covers names and descriptions. Filters combine across labs, providers, types, and capabilities. PostgreSQL selects the representative offering, sorts consistently, and reads the filtered count and page from the same snapshot.
- Seven HTTP integration tests passed against the production build and the seeded PostgreSQL database. They cover combined filters, stable pagination, provider-specific rates, zero and missing rates, benchmark details, and invalid and unknown requests.
- Verified a `503 SERVICE_UNAVAILABLE` response from each endpoint using an unreachable database address. Lint, type checking, and the production build passed. [API contract and examples](API.md)

## Module 4 · Discovery UI

- Built the model explorer at `/` with search, lab and provider filters, model type and capability filters, sorting, result counts, and pagination. The table and mobile cards show demo labels and the rates and currency from the selected provider offering.
- The explorer reads the catalog API and stores the applied query in the URL. Search submits with Enter or the Search button. Filter changes cancel pending requests, and failed results and filter options can be retried independently.
- Chrome checks against the production build covered keyboard navigation, combined filters, provider pricing, sorting, deep links, browser back and forward, pagination, empty and invalid-query states, loading, retries, and cancellation of an older search. The mobile layout fit 390 px and 320 px without horizontal overflow.
- Lint, type checking, the production build, and all seven catalog integration tests passed. The hosted app and database smoke test requires configured Vercel and Neon access.

## Module 5 · Model details

- Added server-rendered pages at `/models/[slug]` using the shared model detail query. They show model specifications, modalities, capabilities, all provider offerings, and benchmark definitions, scores, and provenance.
- Linked model names in the desktop table and mobile cards. **Back to models** restores a validated explorer query. Lab and provider links open their filtered catalogs ahead of the dedicated directories.
- The page distinguishes free, unknown, and inapplicable prices and displays a separate state for missing benchmark results. Unknown and invalid slugs return HTTP 404. An isolated database outage returned HTTP 500 with a retry screen.
- Lint, type checking, the production build, and all eight catalog HTTP tests passed. Chrome verified keyboard navigation, price and benchmark rendering, the filtered return link, association links, and mobile layouts at 390 px and 320 px.

## Module 6 · Directories and global search

- Added lab and provider directories and profiles. Labs show their models and release dates. Providers show supported models, creators, per-provider token rates, and context limits.
- Connected model detail pages to lab and provider profiles. Each profile links both to individual models and to its filtered model explorer.
- Added global search in the header and a shareable `/search?q=…` results page. The search API returns up to five matches per entity type, ranks exact and prefix name matches first, and reuses request cancellation in the browser.
- All 11 catalog HTTP tests, lint, type checking, and the production build passed. Chrome verified keyboard search, URL reload, model and directory links, provider rates, empty results, search retry, and mobile layouts at 390 px and 320 px.

## Module 7 · Comparison

- Added comparison controls to the model explorer and detail pages, with a tray for up to four selections. The comparison page lets users search for, add, remove, and replace models. Its URL preserves the selected models and their column order.
- Added `/api/compare` for two to four distinct model slugs. It loads model details and the default pricing provider from the same PostgreSQL snapshot. Both displayed rates come from that provider and show their currency and billing unit.
- The comparison table shows specifications, modalities, capabilities, providers, and benchmark versions and scores. It distinguishes free, unknown, inapplicable, and unavailable values and separates demo benchmark results from reported results.
- All 13 catalog HTTP tests, lint, type checking, and the production build passed. Chrome verified selection, replacement, clipboard and URL sharing, browser history, errors and retry, and keyboard scrolling on the 320 px and 390 px layouts.

## Next · Module 8 rankings

Start after the learning checkpoint. Add a leaderboard for a selected benchmark and model category, with the scoring direction, units, sources, ties, and demo labels visible.
