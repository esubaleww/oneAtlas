# OneAtlas

OneAtlas is a Full Stack Engineer internship project for exploring AI models, comparing provider prices, and evaluating benchmark results in one catalog. The explorer at `/` reads the PostgreSQL-backed demo catalog through the app’s API. Detail pages at `/models/[slug]` use the same catalog query as the detail endpoint.

[GitHub repository](https://github.com/esubaleww/oneAtlas)

## Run locally

Use Node.js 24 and npm. From the repository root, install the locked dependencies and start the development server.

```sh
npm ci
npm run dev
```

Start and seed PostgreSQL, then open [the local model explorer](http://localhost:3000). Search by model name or description, combine filters, and sort by release, context, or token rates. The URL preserves the active query and page across refresh and browser navigation. [Catalog API](docs/API.md)

Select a model name to open its specifications, provider rates, and benchmark results. The **Back to models** link restores the explorer query you opened it from. [Example model](http://localhost:3000/models/cedar-research-general)

Use **Labs** to browse model creators and their releases, or **Providers** to browse serving services and their offering prices. The search box in the header searches models, labs, and providers together. [Lab directory](http://localhost:3000/labs) · [Provider directory](http://localhost:3000/providers) · [Example global search](http://localhost:3000/search?q=compact)

Select two to four models using the **Compare** controls in the explorer or on model detail pages. Open the comparison from the tray to review specifications, provider rates, and benchmark results side by side. Add or remove models on the comparison page and use **Copy link** to share the current selection. [Example comparison](http://localhost:3000/compare?ids=cedar-research-general%2Ccedar-research-embed)

## Start and seed PostgreSQL

Use Docker Desktop with the Linux engine running. From the repository root in PowerShell, copy the local connection settings and start the database.

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --wait db
npm run db:migrate
npm run db:seed
```

If you already have an `.env`, keep it and set `DATABASE_URL` to your local database connection. The Compose service binds PostgreSQL to `127.0.0.1:5432` and mounts a named volume. `docker compose stop db` stops the container and retains the catalog. For a hosted deployment, set `DATABASE_URL_UNPOOLED` for Prisma migration and seed commands if the runtime `DATABASE_URL` is pooled.

`npm ci` generates Prisma Client automatically. Run `npm run db:generate` after changing the schema, and use `npm run db:migrate:dev -- --name your_change` to create and apply a development migration. `npm run db:migrate` applies committed migrations.

### Catalog structure and demo data

- A lab creates models, and a model can have one offering per serving provider. Prices are nullable decimals in USD per million tokens in the demo, with separately stored input and output rates and offering context limits. A stored zero represents a free rate. `null` represents an unavailable or inapplicable rate.
- A model can have one result per versioned benchmark definition. Results include provenance and a demo flag. Benchmark definitions store the unit, protocol, model type, and score direction.
- Slugs identify labs, models, providers, and benchmark definitions across installs. An offering or result uses a pair of related slugs as its key. The seed validates the fixtures, inserts missing records in one transaction, and preserves existing rows across runs.
- The seed contains 30 fictional models across five labs and five providers, 40 offerings, three benchmark definitions, and 45 results. All fixture names, prices, limits, and scores are synthetic. The demo includes free rates, missing rates, different provider prices for the same model, and models without a benchmark result.

## Verify

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`typecheck` generates the App Router types before running TypeScript. `start` serves the production build. Visit `/` for the explorer and `/missing-page` for the 404 screen.

With the seeded database and app running, run `npm run test:catalog` to verify the catalog endpoints, global search, directory pages, comparisons, and HTTP 404 responses. [API contract and examples](docs/API.md)

## Stack and project notes

- Node.js 24, Next.js 16.4.6 (App Router), and React 19.3.1.
- TypeScript 6.0.3, Tailwind CSS 4.3.5 with its PostCSS plugin, and ESLint 10.15.0 with the Next.js, React Hooks, and TypeScript plugins. The lockfile records the exact dependency tree.
- TypeScript 6.0.3 is the latest stable release within the installed TypeScript ESLint plugin's supported range.
- The development and build scripts use Next.js's Webpack option because the Turbopack CSS worker exited early on the Windows development machine. [Next.js CLI reference](https://nextjs.org/docs/app/api-reference/cli/next)
- PostgreSQL 18.7 and Prisma 7.10.1 with the Node.js PostgreSQL adapter. Prisma 7's self-hosted compatibility table lists PostgreSQL through major version 18. [Prisma supported databases](https://www.prisma.io/docs/orm/v7/reference/supported-databases)
- Prisma 7.10.1 is pinned while Prisma 8 is a release candidate. [Prisma setup with Neon](https://neon.com/docs/guides/prisma)
- Zod 4.6.7 validates catalog requests.
- Geist 1.9.2 supplies locally served typography.

See the [implementation plan](docs/IMPLEMENTATION_PLAN.md), [reference research](docs/RESEARCH.md), and [progress log](docs/PROGRESS.md).
