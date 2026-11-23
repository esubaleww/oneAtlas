import Link from "next/link";
import type { ReactNode } from "react";
import {
  capabilityLabels, formatBenchmarkValue, formatBillingUnit, formatDate, formatRate,
  formatTokenCount, modalityLabels, typeLabels,
} from "../../catalog/presentation";
import type { ComparisonModel, ModelDetail } from "../../server/catalog";
import { SourceLink } from "../source-link";

type Column = ComparisonModel & { pricing: ModelDetail["offerings"][number] | undefined };
type Result = ModelDetail["benchmarks"][number];

const comparisonLink = "rounded-sm font-medium text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent";

function Row({ label, columns, render }: {
  label: ReactNode;
  columns: Column[];
  render: (column: Column) => ReactNode;
}) {
  return (
    <tr className="group align-top">
      <th scope="row" className="sticky left-0 border-r border-b border-line bg-panel px-3 py-3 text-left font-medium group-last:border-b-0 sm:px-4">{label}</th>
      {columns.map((column) => (
        <td key={column.slug} className="border-b border-line px-3 py-3 wrap-break-word group-last:border-b-0 sm:px-4">{render(column)}</td>
      ))}
    </tr>
  );
}

export function ComparisonTable({ models }: { models: ComparisonModel[] }) {
  const columns = models.map((model) => ({
    ...model,
    pricing: model.offerings.find(({ provider }) => provider.slug === model.pricingProviderSlug),
  }));

  const benchmarkRows = new Map<string, { definition: Result["benchmark"]; isDemo: boolean; results: Map<string, Result> }>();
  for (const model of models) {
    for (const result of model.benchmarks) {
      const key = `${result.benchmark.slug}:${result.isDemo}`;
      const row = benchmarkRows.get(key) ?? { definition: result.benchmark, isDemo: result.isDemo, results: new Map() };
      row.results.set(model.slug, result);
      benchmarkRows.set(key, row);
    }
  }

  const benchmarkEntries = [...benchmarkRows].sort(([keyA, a], [keyB, b]) =>
    a.definition.name.localeCompare(b.definition.name) || keyA.localeCompare(keyB),
  );

  return (
    <>
      <p className="mb-3 text-sm text-muted md:hidden">Scroll sideways to see all models.</p>
      <div role="region" tabIndex={0} aria-label="Scrollable model comparison" className="overflow-x-auto rounded-xl border border-line bg-surface shadow-xs">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm" style={{ minWidth: 108 + columns.length * 164 }}>
          <caption className="sr-only">Model comparison by specification, price, and benchmark</caption>
          <colgroup>
            <col className="w-27 sm:w-46" />
            {columns.map(({ slug }) => <col key={slug} />)}
          </colgroup>
          <thead>
            <tr className="align-top">
              <th scope="col" className="sticky left-0 border-r border-b border-line bg-panel px-3 py-4 text-xs font-medium text-muted sm:px-4">Model</th>
              {columns.map((model) => (
                <th key={model.slug} scope="col" className="border-b border-line bg-panel px-3 py-4 wrap-break-word sm:px-4">
                  <Link href={`/models/${model.slug}`} prefetch={false} className={comparisonLink}>{model.name}</Link>
                  <span className="mt-1 block text-xs font-normal text-muted">{model.lab.name}</span>
                  {model.isDemo && <span className="mt-2 inline-block rounded bg-[#f5efdf] px-1.5 py-0.5 text-[11px] font-medium text-[#715524]">Demo</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Type" columns={columns} render={(model) => typeLabels[model.type]} />
            <Row label="Context window" columns={columns} render={(model) => formatTokenCount(model.contextWindow, true)} />
            <Row label="Max output" columns={columns} render={(model) =>
              model.type === "EMBEDDING" && model.maxOutputTokens === null ? "N/A" : formatTokenCount(model.maxOutputTokens, true)
            } />
            <Row label="Released" columns={columns} render={(model) => formatDate(model.releasedOn)} />
            <Row label="Input modalities" columns={columns} render={(model) =>
              model.inputModalities.map((modality) => modalityLabels[modality]).join(", ") || "Unknown"
            } />
            <Row label="Output modalities" columns={columns} render={(model) =>
              model.outputModalities.map((modality) => modalityLabels[modality]).join(", ") || "Unknown"
            } />
            <Row label="Capabilities" columns={columns} render={(model) => model.capabilities.length ? (
              <ul className="flex flex-wrap gap-1">
                {model.capabilities.map((capability) => <li key={capability} className="rounded bg-panel px-1.5 py-0.5 text-xs text-muted">{capabilityLabels[capability]}</li>)}
              </ul>
            ) : "Unknown"} />
            <Row label="Pricing provider" columns={columns} render={({ pricing }) => pricing ? (
              <>
                <Link href={`/providers/${pricing.provider.slug}`} className={comparisonLink}>{pricing.provider.name}</Link>
                <p className="mt-1 text-xs text-muted">{formatBillingUnit(pricing)}{pricing.isDemo && " · Demo rates"}</p>
              </>
            ) : "Unavailable"} />
            <Row label="Input price" columns={columns} render={({ pricing }) => pricing ? (
              <>
                <span className="font-medium tabular-nums">{formatRate(pricing.inputPrice)}</span>
                <span className="mt-1 block text-xs text-muted">{formatBillingUnit(pricing)}</span>
              </>
            ) : "Unavailable"} />
            <Row label="Output price" columns={columns} render={(model) => model.pricing ? (
              <>
                <span className="font-medium tabular-nums">{formatRate(model.pricing.outputPrice, model.type !== "EMBEDDING")}</span>
                <span className="mt-1 block text-xs text-muted">{formatBillingUnit(model.pricing)}</span>
              </>
            ) : model.type === "EMBEDDING" ? "N/A" : "Unavailable"} />
            <Row label="Provider context" columns={columns} render={({ pricing }) => pricing ? formatTokenCount(pricing.contextWindow, true) : "Unavailable"} />
            <Row label="Available providers" columns={columns} render={(model) => model.offerings.length ? (
              <ul className="space-y-1">
                {model.offerings.map(({ provider }) => (
                  <li key={provider.slug}><Link href={`/providers/${provider.slug}`} className={comparisonLink}>{provider.name}</Link></li>
                ))}
              </ul>
            ) : "Unavailable"} />
            <tr>
              <th scope="row" colSpan={columns.length + 1} className="border-b border-line bg-accent-soft px-3 py-3 font-semibold text-accent sm:px-4">
                Benchmarks
              </th>
            </tr>
            {benchmarkEntries.length === 0 && <Row label="Benchmark results" columns={columns} render={() => "Unavailable"} />}
            {benchmarkEntries.map(([key, row]) => (
              <Row
                key={key}
                columns={columns}
                label={(
                  <>
                    <span className="block">{row.definition.name}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      Version {row.definition.version} · {row.isDemo ? "Demo" : "Reported"}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted">
                      {row.definition.direction === "HIGHER_IS_BETTER" ? "Higher is better" : "Lower is better"}
                    </span>
                  </>
                )}
                render={(model) => {
                  const result = row.results.get(model.slug);
                  return result ? (
                    <>
                      <span className="font-medium tabular-nums">{formatBenchmarkValue(result.value, row.definition.unit)}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        <SourceLink url={result.sourceUrl}>{result.sourceLabel}</SourceLink>
                      </span>
                    </>
                  ) : "Unavailable";
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
