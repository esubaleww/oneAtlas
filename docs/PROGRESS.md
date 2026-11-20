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

## Next · Module 2 database

Start after the learning checkpoint. Set up local PostgreSQL, add the Prisma schema and migration, connect through a server-only client, and verify a repeatable seed against the database. Docker CLI and Compose are installed on the development machine. Docker Desktop's Linux engine was stopped when checked.
