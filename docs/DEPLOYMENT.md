# OneAtlas deployment

The target is the `main` branch of `esubaleww/oneAtlas` on Vercel with Neon PostgreSQL. Vercel’s Hobby plan covers personal, non-commercial use, and Neon lists a Free plan for a demo catalog of this size. [GitHub repository](https://github.com/esubaleww/oneAtlas) · [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Neon pricing](https://neon.com/pricing)

## Import the app

1. Sign in to Vercel and import `https://github.com/esubaleww/oneAtlas`. If GitHub asks which repositories Vercel can access, select `oneAtlas`.
2. Keep the repository root as the Root Directory and choose the Next.js preset. The repository pins Node.js `24.x`, runs `prisma generate` during install, and builds with `npm run build`.
3. Use `main` as the Production Branch. If you deploy the build before attaching the database, finish the database and environment steps below before testing its public URL. [Start Vercel import](https://vercel.com/new) · [GitHub integration](https://vercel.com/docs/git/vercel-for-github) · [Supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

## Provision PostgreSQL

1. Create an empty Neon PostgreSQL database for OneAtlas. Use a region near the Vercel functions. You can provision Neon through the Vercel Marketplace when the Neon Console is unavailable.
2. In Neon’s connection details, select the intended production branch, database, and role. Keep the pooled URL for the app and the direct URL for Prisma migration and seed commands.
3. In the Vercel project’s Environment Variables, set `DATABASE_URL` to the pooled URL for **Production**. If the Marketplace integration added it automatically, verify its name and environment. Store the runtime value as a secret. Previews can use their own Neon branch when needed. [Neon Marketplace integration](https://vercel.com/marketplace/neon) · [Prisma connections on Neon](https://neon.com/docs/guides/prisma) · [Vercel environment variables](https://vercel.com/docs/environment-variables)

## Apply the production migration and seed

### From a Vercel build

Use this path if your terminal cannot reach Neon on port `5432`.

1. In **Settings → Environment Variables**, verify that **Production** has the pooled `DATABASE_URL` and add `DATABASE_URL_UNPOOLED` with the direct URL for the same Neon database.
2. In **Settings → Build and Deployment → Framework Settings**, enable **Build Command → Override**, paste the command below, and save it. [Vercel build settings](https://vercel.com/docs/builds/configure-a-build#build-command)

   ```sh
   npm run db:migrate && npm run db:seed && npm run build
   ```

3. In **Deployments**, redeploy the latest **Production** deployment or check the deployment triggered by your next push to `main`. The command stops on the first failure. In **Build Logs**, look for a successful migration and the `Inserted demo records` summary. A repeat seed can report zero inserts when the demo records are already present. [Vercel redeploy guide](https://vercel.com/docs/deployments/managing-deployments#redeploy-a-project)
4. Once the deployment is **Ready** and the public catalog loads, turn **Build Command → Override** off. Vercel will use the repository's usual `npm run build` on future deployments.

### From PowerShell

Use an already installed checkout of the deployed commit. In Neon’s Connect dialog, confirm the selected branch and database before copying the direct URL. From the repository root in PowerShell 7, supply that URL to the masked prompt. The snippet restores the shell’s previous connection setting after the commands finish. [Prisma migration command](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)

```powershell
$previousDirectUrl = $env:DATABASE_URL_UNPOOLED
try {
    $env:DATABASE_URL_UNPOOLED = Read-Host 'Neon direct PostgreSQL URL' -MaskInput
    if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL_UNPOOLED)) {
        throw 'Enter the direct connection URL for the production database.'
    }
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed.' }
    npm run db:seed
    if ($LASTEXITCODE -ne 0) { throw 'Seed failed.' }
} finally {
    $env:DATABASE_URL_UNPOOLED = $previousDirectUrl
    $previousDirectUrl = $null
}
```

An empty database receives 30 demo models, five labs, five providers, 40 offerings, three benchmarks, and 45 results. The seed skips existing records, and future schema changes use `npm run db:migrate`. Migration and seeding are explicit release steps. The app reads the prepared database at runtime.

## Verify the public deployment

1. In Vercel, confirm the deployment created after saving the production environment variables is **Ready** and points to the intended `main` commit. Copy its production URL.
2. Open the URL in a signed-out window. Confirm the explorer shows 30 models. Check that `<production-url>/api/models?pageSize=1` returns JSON with `data.pagination.total` equal to `30`.
3. Verify that a filtered explorer URL survives reload. Open Cedar Research General and return to the same filters. Open a two-model comparison and refresh it. Switch between two rankings benchmarks and open a lab and a provider profile. Confirm `/models/missing-model` returns HTTP 404 with a recovery link.
4. Run the existing suites against the copied production URL from PowerShell. Run the documented Chromium install first if needed. [Test setup](../README.md#verify)

```powershell
$previousTestUrl = $env:CATALOG_TEST_BASE_URL
try {
    $env:CATALOG_TEST_BASE_URL = Read-Host 'Verified production app URL'
    if ($env:CATALOG_TEST_BASE_URL -notmatch '^https://') {
        throw 'Enter the hosted HTTPS production URL.'
    }
    npm run test:catalog
    if ($LASTEXITCODE -ne 0) { throw 'Production HTTP checks failed.' }
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) { throw 'Production browser checks failed.' }
} finally {
    $env:CATALOG_TEST_BASE_URL = $previousTestUrl
}
```

After the checks pass, record the production URL and deployed commit in the README, progress log, and submission checklist. [Submission checklist](SUBMISSION_CHECKLIST.md)
