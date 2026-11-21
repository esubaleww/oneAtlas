import Link from "next/link";
import type { ReactNode } from "react";
import {
  capabilityLabels,
  formatBillingUnit,
  formatDate,
  formatRate,
  formatTokenCount,
  modalityLabels,
  typeLabels,
} from "../../../catalog/presentation";
import type { ModelDetail } from "../../../server/catalog";

type Offering = ModelDetail["offerings"][number];
const scoreFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
const catalogLinkClass = "rounded-sm font-medium text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent";

function organizationHref(filter: "lab" | "provider", slug: string) {
  return `/?${new URLSearchParams({ [filter]: slug })}`;
}

function DemoBadge({ children = "Demo" }: { children?: ReactNode }) {
  return <span className="inline-flex w-fit items-center rounded bg-[#f5efdf] px-2 py-1 text-[11px] leading-none font-medium text-[#715524]">{children}</span>;
}

function SourceLink({ url, children, fallback = children }: {
  url: string | null;
  children: string;
  fallback?: string;
}) {
  const source = url && URL.canParse(url) ? new URL(url) : null;
  if (source?.protocol !== "https:" && source?.protocol !== "http:") {
    return <>{fallback}</>;
  }

  return (
    <a href={source.href} className={catalogLinkClass} target="_blank" rel="noreferrer">
      {children}<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function CatalogSource({ source, retrievedOn, demo }: {
  source: string | null;
  retrievedOn: string | null;
  demo: boolean;
}) {
  return (
    <>
      <SourceLink url={source} fallback={demo ? "OneAtlas synthetic fixture" : "Source unavailable"}>
        {demo ? "OneAtlas synthetic fixture" : "Catalog source"}
      </SourceLink>
      {retrievedOn && <span> · Retrieved {formatDate(retrievedOn)}</span>}
    </>
  );
}

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id={id} className="scroll-mt-5 text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SpecificationList({ model }: { model: ModelDetail }) {
  const facts = [
    { label: "Context window", value: formatTokenCount(model.contextWindow, true) },
    {
      label: "Max output",
      value: model.type === "EMBEDDING" && model.maxOutputTokens === null
        ? "N/A"
        : formatTokenCount(model.maxOutputTokens, true),
    },
    { label: "Input modalities", value: model.inputModalities.map((modality) => modalityLabels[modality]).join(", ") || "Unknown" },
    { label: "Output modalities", value: model.outputModalities.map((modality) => modalityLabels[modality]).join(", ") || "Unknown" },
  ];

  return (
    <DetailSection id="specifications" title="Specifications">
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <dl className="divide-y divide-line text-sm">
          {facts.map(({ label, value }) => (
            <div key={label} className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">Capabilities</h3>
          {model.capabilities.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {model.capabilities.map((capability) => (
                <li key={capability} className="rounded-md border border-line bg-panel px-2 py-1 text-xs leading-none font-medium text-muted">
                  {capabilityLabels[capability]}
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">Capability information unavailable.</p>}
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">Model source</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <CatalogSource source={model.sourceUrl} retrievedOn={model.retrievedOn} demo={model.isDemo} />
          </p>
        </div>
      </div>
    </DetailSection>
  );
}

function ProviderOffering({ offering, type }: { offering: Offering; type: ModelDetail["type"] }) {
  const rates = [
    { label: "Input price", value: formatRate(offering.inputPrice) },
    { label: "Output price", value: formatRate(offering.outputPrice, type !== "EMBEDDING") },
    { label: "Provider context", value: formatTokenCount(offering.contextWindow, true) },
  ];

  return (
    <li className="px-5 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1.85fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">
              <Link href={organizationHref("provider", offering.provider.slug)} className={catalogLinkClass}>{offering.provider.name}</Link>
            </h3>
            {offering.isDemo && <DemoBadge>Demo rates</DemoBadge>}
          </div>
          {offering.providerModelId && (
            <code className="mt-1.5 block text-xs break-all text-muted">{offering.providerModelId}</code>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 text-xs sm:gap-3">
          {rates.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-muted">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
        <span className="font-medium">{formatBillingUnit(offering)}</span>
        <span aria-hidden="true">·</span>
        <span><CatalogSource source={offering.sourceUrl} retrievedOn={offering.retrievedOn} demo={offering.isDemo} /></span>
      </p>
    </li>
  );
}

function ProviderOfferings({ model }: { model: ModelDetail }) {
  return (
    <DetailSection id="provider-offerings" title="Provider offerings">
      {model.offerings.length > 0 ? (
        <ul className="divide-y divide-line">
          {model.offerings.map((offering) => <ProviderOffering key={offering.provider.slug} offering={offering} type={model.type} />)}
        </ul>
      ) : <p className="px-5 py-6 text-sm text-muted sm:px-6">Provider offerings are unavailable for this model.</p>}
    </DetailSection>
  );
}

function BenchmarkResults({ results }: { results: ModelDetail["benchmarks"] }) {
  return (
    <DetailSection id="benchmarks" title="Benchmarks">
      {results.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted sm:px-6">Benchmark results are unavailable for this model.</p>
      ) : (
        <ul className="divide-y divide-line">
          {results.map((result) => {
            const { benchmark } = result;
            const score = scoreFormat.format(Number(result.value));
            return (
              <li key={benchmark.slug} className="px-5 py-4 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{benchmark.name}</h3>
                    <p className="mt-1 text-xs text-muted">Version {benchmark.version}</p>
                    <p className="mt-2 text-sm leading-relaxed">{benchmark.description}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{benchmark.protocol}</p>
                  </div>
                  <div className="w-fit min-w-28 rounded-lg border border-line bg-accent-soft px-3 py-2.5 text-accent sm:self-start sm:text-right">
                    <p className="text-lg font-semibold tabular-nums">{score}{benchmark.unit === "%" ? "%" : ` ${benchmark.unit}`}</p>
                    <p className="mt-0.5 text-[11px]">{benchmark.direction === "HIGHER_IS_BETTER" ? "Higher is better" : "Lower is better"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-muted">
                  {result.isDemo && <DemoBadge>Demo result</DemoBadge>}
                  <SourceLink url={result.sourceUrl}>{result.sourceLabel}</SourceLink>
                  {result.measuredOn && <span>· {result.isDemo ? "Fixture date" : "Measured"} {formatDate(result.measuredOn)}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DetailSection>
  );
}

export function ModelDetails({ model, backHref }: { model: ModelDetail; backHref: string }) {
  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-accent hover:underline">
        <span aria-hidden="true">←</span> Back to models
      </Link>
      <div className="catalog-hero grid gap-5 rounded-2xl px-6 py-7 text-white sm:px-9 sm:py-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <Link
              href={organizationHref("lab", model.lab.slug)}
              className="rounded-sm text-sm font-medium text-[#c9f0dc] underline decoration-white/45 underline-offset-3 hover:decoration-white focus-visible:outline-white"
            >
              {model.lab.name}
            </Link>
            {model.isDemo && <DemoBadge>Demo model</DemoBadge>}
          </div>
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.045em] break-words sm:text-[2.75rem]">
            {model.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#d8e9e0] sm:text-base">{model.description}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/25 pt-4 text-sm lg:min-w-40 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <div>
            <dt className="text-xs text-[#c7e0d4]">Model type</dt>
            <dd className="mt-1 font-medium">{typeLabels[model.type]}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#c7e0d4]">Released</dt>
            <dd className="mt-1 font-medium tabular-nums">{formatDate(model.releasedOn)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.05fr)]">
        <SpecificationList model={model} />
        <div className="grid min-w-0 gap-5">
          <ProviderOfferings model={model} />
          <BenchmarkResults results={model.benchmarks} />
        </div>
      </div>
    </>
  );
}
