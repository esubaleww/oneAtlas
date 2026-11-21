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

## Next · Module 3 catalog APIs

Start after the learning checkpoint. Build the model listing, detail, and filter endpoints on the Prisma client. Verify query validation, combined filters, provider-specific pricing, stable sorting, and pagination against PostgreSQL. The catalog browser will connect to these endpoints in Module 4.
