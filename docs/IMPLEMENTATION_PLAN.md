# OneAtlas implementation plan

OneAtlas is a catalog for developers, AI engineers, and researchers choosing models and serving providers. The MVP covers model discovery, detail pages, comparison, benchmark rankings, and lab and provider directories.

## Application architecture

- `src/app/` holds App Router pages and layouts. The foundation renders on the server. Later pages add client components for interactions such as the comparison tray and global search.
- `src/app/api/` will hold Node.js Route Handlers. They validate inputs and map responses to a consistent public JSON shape. Request errors and missing records get appropriate status codes. Internal errors get a safe message.
- A shared server-side catalog layer will own queries and serialization. Both Route Handlers and Server Components can call it directly. Browser interactions that need new data can call the public API. Pending searches will be canceled or discarded as the query changes.
- `prisma/` will hold the PostgreSQL schema, migrations, and seed data. Application queries will use Prisma through a server-only module.
- The URL will store discovery filters, paging, sorting, and comparison identifiers. React state will hold interactions such as opening search or selecting models before sharing a comparison.

## Data rules

- A lab creates models. A provider serves models through offerings that carry provider-specific prices and limits.
- Start with a deterministic demo seed of about 30 models, at least five labs and five providers, and two or three benchmark definitions. Include text generation, embeddings, image input, several multi-provider models, missing values, and a zero-priced offering.
- Store rates as decimals and serialize them explicitly. Display input and output rates from the same offering. Choose a deterministic representative offering from the applicable provider set and use that offering for price sorting, with missing values last and a stable tie-breaker. Record the exact selection rule with the API contract.
- Rank a single benchmark definition and version using its score direction and a consistent tie policy. Keep demo results clearly labeled and equivalent settings together. Exclude missing results from the ranked set.

## Modules and acceptance criteria

| Module | Acceptance criteria |
| --- | --- |
| 1. Foundation | The Next.js shell starts, lint and type checks pass, and a production build serves the real routes. The lockfile, environment example, research, and plan are in Git. |
| 2. Database | Local PostgreSQL is reachable, the schema applies through migrations, and two seed runs produce the same records without duplicates. Local Compose binds to loopback and uses a named volume. |
| 3. Catalog APIs | Model list, detail, and filter endpoints validate parameters and verify search, combined filters, provider-specific pricing, stable sorting, and bounded pagination against PostgreSQL. |
| 4. Discovery UI | The explorer renders catalog data, supports shareable filters and paging, and handles loading, empty and error states. Attempt the first hosted database and app smoke check if access is available. |
| 5. Model details | A model page shows specifications, modalities, capabilities, offerings, benchmarks, and provenance, with a proper 404 for an unknown slug. |
| 6. Directories and global search | Lab and provider directory and detail pages link to their models. Search returns models, labs, and providers, with stale responses handled. |
| 7. Comparison | The selection interface supports two to four models. Shareable URLs and the responsive comparison show price basis, capabilities, context, and benchmarks. |
| 8. Rankings | Benchmark and category controls return correctly ordered results, with units, definitions, sources, ties, and demo labels. |
| 9. Quality | Focused automated checks cover the critical catalog and benchmark rules. End-to-end checks cover the key workflows on desktop and mobile, including keyboard navigation. |
| 10. Delivery | Public app and database are deployed, migrated, seeded, and smoke tested. The README, API documentation, Loom outline, and submission checklist reflect the verified product. |

Finish and verify each module, update the progress log, and commit and push to the project branch before the learning checkpoint. The final deliverables are the public URL, the GitHub repository, and the user's 5–10-minute Loom walkthrough for the submission form.

## Deployment compatibility

Vercel supports configuring Node.js 24 through `package.json`. That runtime also meets Prisma 7's supported Node.js range. At the foundation checkpoint, Prisma 7.10.1 was the newest stable Prisma release, and PostgreSQL 18.7 was the current patch of the newest major listed in Prisma 7's self-hosted database compatibility table. Recheck those versions when starting Module 2. [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) · [Prisma system requirements](https://www.prisma.io/docs/orm/v7/reference/system-requirements) · [Prisma supported databases](https://www.prisma.io/docs/orm/v7/reference/supported-databases) · [PostgreSQL releases](https://www.postgresql.org/support/versioning/)

If deploying to Neon, use the documented pooled runtime connection and a direct migration connection. Keep credentials in server environment settings and run production migrations and seeding explicitly. A live connectivity check is planned once the explorer is database-backed. [Neon and Prisma](https://neon.com/docs/guides/prisma)
