import Link from "next/link";
import type { ReactNode } from "react";
import { formatBillingUnit, formatDate, formatRate, formatTokenCount, typeLabels } from "../../catalog/presentation";
import type { DirectoryEntry, LabDetail, ProviderDetail } from "../../server/catalog";

type DirectoryKind = "labs" | "providers";
const directoryNames = { labs: "Labs", providers: "Providers" };
const accentLink = "rounded-sm font-medium text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent";

function modelCount(count: number) {
  return `${count} ${count === 1 ? "model" : "models"}`;
}

function Demo() {
  return <span className="rounded bg-[#f5efdf] px-1.5 py-0.5 text-[11px] font-medium text-[#715524]">Demo</span>;
}

export function DirectoryView({ kind, entries }: { kind: DirectoryKind; entries: DirectoryEntry[] }) {
  const isLab = kind === "labs";
  const title = directoryNames[kind];
  return (
    <>
      <section className="catalog-hero rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-10" aria-labelledby="directory-heading">
        <h1 id="directory-heading" className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#cbdfd4] sm:text-base">
          {isLab
            ? "Browse the organizations that create models and see their release history."
            : "Browse the services that host models and see their token rates and context limits."}
        </p>
      </section>
      {entries.length === 0 ? (
        <p className="mt-5 rounded-xl border border-line bg-surface p-6 text-sm text-muted">This directory is empty.</p>
      ) : (
        <ul aria-label={title} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.slug} className="min-w-0">
              <Link href={`/${kind}/${entry.slug}`} className="group flex h-full min-w-0 flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-accent/55 hover:bg-panel">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight group-hover:text-accent">{entry.name}</h2>
                  <span aria-hidden="true" className="text-sm text-accent">↗</span>
                </div>
                <p className="mt-2 mb-4 grow text-sm leading-relaxed text-muted">{entry.description}</p>
                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-muted">
                  <span>{modelCount(entry.modelCount)}</span>
                  {entry.isDemo && <Demo />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OrganizationHeader({ kind, entry, count }: {
  kind: DirectoryKind;
  entry: Pick<DirectoryEntry, "name" | "description" | "websiteUrl" | "isDemo">;
  count: number;
}) {
  const website = entry.websiteUrl && URL.canParse(entry.websiteUrl) ? new URL(entry.websiteUrl) : null;
  return (
    <>
      <Link href={`/${kind}`} className="mb-4 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-accent hover:underline">
        <span aria-hidden="true">←</span> Back to {directoryNames[kind].toLowerCase()}
      </Link>
      <section className="catalog-hero flex flex-wrap items-center justify-between gap-5 rounded-2xl px-6 py-7 text-white sm:px-9 sm:py-9" aria-labelledby="organization-heading">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 id="organization-heading" className="text-[2rem] leading-tight font-semibold tracking-[-0.04em] wrap-break-word sm:text-[2.75rem]">{entry.name}</h1>
            {entry.isDemo && <Demo />}
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#d8e9e0] sm:text-base">{entry.description}</p>
          {(website?.protocol === "https:" || website?.protocol === "http:") && (
            <a href={website.href} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-sm text-sm text-[#c9f0dc] underline underline-offset-3 focus-visible:outline-white">
              Website<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
        <span className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm tabular-nums">{modelCount(count)}</span>
      </section>
    </>
  );
}

function RelatedModels({ title, filter, slug, empty, children }: {
  title: string;
  filter: "lab" | "provider";
  slug: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="related-models" className="mt-5 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="related-models" className="text-lg font-semibold tracking-tight">{title}</h2>
        <Link href={`/?${new URLSearchParams({ [filter]: slug })}`} className={`text-sm ${accentLink}`}>Open in explorer</Link>
      </div>
      {empty
        ? <p className="px-5 py-6 text-sm text-muted sm:px-6">There are no listed models for this entry.</p>
        : <ul className="divide-y divide-line">{children}</ul>}
    </section>
  );
}

function RelatedModelName({ model, children }: { model: LabDetail["models"][number]; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">
          <Link href={`/models/${model.slug}`} prefetch={false} className={accentLink}>{model.name}</Link>
        </h3>
        {model.isDemo && <Demo />}
      </div>
      <p className="mt-1.5 text-sm text-muted">{model.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="rounded bg-panel px-1.5 py-0.5">{typeLabels[model.type]}</span>
        {children}
      </div>
    </div>
  );
}

export function LabView({ lab }: { lab: LabDetail }) {
  return (
    <>
      <OrganizationHeader kind="labs" entry={lab} count={lab.models.length} />
      <RelatedModels title="Models and releases" filter="lab" slug={lab.slug} empty={!lab.models.length}>
        {lab.models.map((model) => (
          <li key={model.slug} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6">
            <RelatedModelName model={model} />
            <dl className="text-xs">
              <dt className="text-muted">Released</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatDate(model.releasedOn)}</dd>
            </dl>
          </li>
        ))}
      </RelatedModels>
    </>
  );
}

export function ProviderView({ provider }: { provider: ProviderDetail }) {
  return (
    <>
      <OrganizationHeader kind="providers" entry={provider} count={provider.offerings.length} />
      <RelatedModels title="Supported models" filter="provider" slug={provider.slug} empty={!provider.offerings.length}>
        {provider.offerings.map((offering) => (
          <li key={offering.model.slug} className="grid gap-3 px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <RelatedModelName model={offering.model}>
              <Link href={`/labs/${offering.model.lab.slug}`} className={accentLink}>{offering.model.lab.name}</Link>
              {offering.providerModelId && <code className="min-w-0 break-all">{offering.providerModelId}</code>}
            </RelatedModelName>
            <div className="rounded-lg border border-line bg-panel px-3 py-2.5 text-xs">
              <dl className="grid grid-cols-3 gap-2">
                <div>
                  <dt className="text-muted">Input price</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatRate(offering.inputPrice)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Output price</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatRate(offering.outputPrice, offering.model.type !== "EMBEDDING")}</dd>
                </div>
                <div>
                  <dt className="text-muted">Provider context</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatTokenCount(offering.contextWindow, true)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-muted">{formatBillingUnit(offering)}{offering.isDemo && " · Demo rates"}</p>
            </div>
          </li>
        ))}
      </RelatedModels>
    </>
  );
}
