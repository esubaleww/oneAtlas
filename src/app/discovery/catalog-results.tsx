import Link from "next/link";
import type { ReactNode } from "react";
import { capabilityLabels, formatBillingUnit, formatDate, formatRate, formatTokenCount, typeLabels } from "../../catalog/presentation";
import type { ModelSummary } from "../../server/catalog";
import { CompareToggle } from "../compare/comparison-selection";

const labColors = [
  "bg-[#e4efe9] text-[#245a46]",
  "bg-[#e9edf8] text-[#384f83]",
  "bg-[#f2ece0] text-[#684c24]",
  "bg-[#ebe8f4] text-[#59447d]",
  "bg-[#e4f0f1] text-[#235561]",
];

function ModelIdentity({ model, href, card = false }: { model: ModelSummary; href: string; card?: boolean }) {
  const initials = model.lab.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const color = labColors[model.lab.slug.charCodeAt(0) % labColors.length];
  const name = (
    <Link
      href={href}
      prefetch={false}
      className="rounded-sm text-sm font-semibold text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent"
    >
      {model.name}
    </Link>
  );

  return (
    <div className="flex min-w-0 items-start gap-3">
      <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-semibold ${color}`}>
        {initials}
      </span>
      <div className="min-w-0">
        {card ? <h3 className="leading-snug">{name}</h3> : name}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>{model.lab.name}</span>
          {model.isDemo && (
            <span className="rounded bg-[#f5efdf] px-1.5 py-0.5 text-[10px] leading-none font-medium text-[#715524]">Demo</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Capabilities({ model }: { model: ModelSummary }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {model.capabilities.map((capability) => (
        <span key={capability} className="rounded bg-panel px-1.5 py-0.5 text-[11px] leading-snug text-muted">
          {capabilityLabels[capability]}
        </span>
      ))}
    </div>
  );
}

function Rates({ model }: { model: ModelSummary }) {
  const offering = model.offering;
  if (!offering) {
    return <span className="text-xs text-muted">Unavailable</span>;
  }

  return (
    <div className="min-w-0">
      <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <div>
          <dt className="sr-only">Input price</dt>
          <dd className="font-medium tabular-nums">{formatRate(offering.inputPrice)} <span className="font-normal text-muted" aria-hidden="true">in</span></dd>
        </div>
        <div>
          <dt className="sr-only">Output price</dt>
          <dd className="font-medium tabular-nums">{formatRate(offering.outputPrice, model.type !== "EMBEDDING")} <span className="font-normal text-muted" aria-hidden="true">out</span></dd>
        </div>
      </dl>
      <p className="mt-1 text-[11px] text-muted">
        {formatBillingUnit(offering)}
        {offering.isDemo && !model.isDemo && " · Demo rates"}
      </p>
    </div>
  );
}

function Provider({ model }: { model: ModelSummary }) {
  if (!model.offering) {
    return <span className="text-muted">Unavailable</span>;
  }

  return (
    <>
      <span className="block font-medium">{model.offering.provider.name}</span>
      {model.providerCount > 1 && (
        <span className="mt-1 block text-[11px] text-muted">{model.providerCount} providers listed</span>
      )}
    </>
  );
}

export function CatalogResults({ models, query }: { models: ModelSummary[]; query: string }) {
  const returnQuery = query ? `?${new URLSearchParams({ from: query })}` : "";
  const detailHref = (slug: string) => `/models/${encodeURIComponent(slug)}${returnQuery}`;

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface shadow-xs lg:block">
        <table className="w-full table-fixed text-left text-xs">
          <caption className="sr-only">AI models and selected provider pricing</caption>
          <thead className="border-b border-line bg-panel text-muted">
            <tr>
              <th scope="col" className="w-[24%] px-4 py-3.5 font-medium">Model</th>
              <th scope="col" className="w-[17%] px-3 py-3.5 font-medium">Type &amp; capabilities</th>
              <th scope="col" className="w-[9%] px-3 py-3.5 font-medium">Context</th>
              <th scope="col" className="w-[17%] px-3 py-3.5 font-medium">Token pricing</th>
              <th scope="col" className="w-[14%] px-3 py-3.5 font-medium">Provider</th>
              <th scope="col" className="w-[11%] px-3 py-3.5 font-medium">Released</th>
              <th scope="col" className="w-[8%] px-2 py-3.5 text-center font-medium">Compare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {models.map((model) => (
              <tr key={model.slug} className="align-top hover:bg-panel/60">
                <th scope="row" className="px-4 py-3.5 font-normal">
                  <ModelIdentity model={model} href={detailHref(model.slug)} />
                </th>
                <td className="px-3 py-3.5">
                  <p className="mb-1.5 font-medium">{typeLabels[model.type]}</p>
                  <Capabilities model={model} />
                </td>
                <td className="px-3 py-3.5">
                  <span className="font-medium tabular-nums">{formatTokenCount(model.contextWindow)}</span>
                  {model.contextWindow !== null && <span className="mt-1 block text-[11px] text-muted">tokens</span>}
                </td>
                <td className="px-3 py-3.5"><Rates model={model} /></td>
                <td className="px-3 py-3.5"><Provider model={model} /></td>
                <td className="px-3 py-3.5 text-muted tabular-nums">{formatDate(model.releasedOn)}</td>
                <td className="px-2 py-3.5 text-center"><CompareToggle model={model} compact /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="AI models">
        {models.map((model) => (
          <li key={model.slug} className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <ModelIdentity model={model} href={detailHref(model.slug)} card />
              <CompareToggle model={model} />
            </div>
            <p className="mt-3 text-xs font-medium">{typeLabels[model.type]}</p>
            <div className="mt-1.5"><Capabilities model={model} /></div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line pt-3 text-xs">
              <div>
                <dt className="mb-1 text-muted">Context</dt>
                <dd className="font-medium tabular-nums">{formatTokenCount(model.contextWindow, true)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-muted">Released</dt>
                <dd className="tabular-nums">{formatDate(model.releasedOn)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-muted">Token pricing</dt>
                <dd><Rates model={model} /></dd>
              </div>
              <div>
                <dt className="mb-1 text-muted">Provider</dt>
                <dd><Provider model={model} /></dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CatalogLoading() {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface" role="status">
      <p className="border-b border-line bg-panel px-4 py-3 text-sm text-muted">Loading models…</p>
      <div className="divide-y divide-line motion-safe:animate-pulse" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-3 px-4 py-4">
            <span className="size-9 rounded-lg bg-line" />
            <span className="h-3 w-36 rounded bg-line" />
            <span className="ml-auto hidden h-3 w-24 rounded bg-line sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CatalogMessage({ title, children, action, error = false }: {
  title: string;
  children: ReactNode;
  action: ReactNode;
  error?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-10 text-center shadow-xs" role={error ? "alert" : undefined}>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{children}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
