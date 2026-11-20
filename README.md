# OneAtlas

OneAtlas is a Full Stack Engineer internship project for exploring AI models, comparing provider prices, and evaluating benchmark results in one catalog. The current milestone provides the app shell and a catalog setup screen at `/`.

[GitHub repository](https://github.com/esubaleww/oneAtlas)

## Run locally

Use Node.js 24 and npm. From the repository root, install the locked dependencies and start the development server.

```sh
npm ci
npm run dev
```

Open [OneAtlas locally](http://localhost:3000). The foundation runs without an environment file or a database. `.env.example` documents the local PostgreSQL connection planned for the next module.

## Verify

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`typecheck` generates the App Router types before running TypeScript. `start` serves the production build. Visit `/` for the catalog shell and `/missing-page` for the 404 screen.

## Stack and project notes

- Node.js 24, Next.js 16.4.6 (App Router), and React 19.3.1.
- TypeScript 6.0.3, Tailwind CSS 4.3.5 with its PostCSS plugin, and ESLint 10.15.0 with the Next.js, React Hooks, and TypeScript plugins. The lockfile records the exact dependency tree.
- TypeScript 6.0.3 is the latest stable release within the installed TypeScript ESLint plugin's supported range.
- The development and build scripts use Next.js's Webpack option because the Turbopack CSS worker exited early on the Windows development machine. [Next.js CLI reference](https://nextjs.org/docs/app/api-reference/cli/next)
- PostgreSQL and Prisma are scheduled for Module 2.

See the [implementation plan](docs/IMPLEMENTATION_PLAN.md), [reference research](docs/RESEARCH.md), and [progress log](docs/PROGRESS.md).
