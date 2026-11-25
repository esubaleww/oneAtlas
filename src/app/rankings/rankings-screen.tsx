"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { parseRankingSelection } from "../../catalog/params";
import { typeLabels, formatBenchmarkValue, formatDate } from "../../catalog/presentation";
import { useCatalogResource } from "../../catalog/use-catalog-resource";
import type { ModelType } from "../../generated/prisma/enums";
import type { BenchmarkDefinition, RankingsData } from "../../server/catalog";
import { SourceLink } from "../source-link";

const panelClass = "mt-5 rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5";

export function RankingsLoading() {
  return <p role="status" className={`${panelClass} text-sm text-muted`}>Loading benchmarks…</p>;
}

function RankingsError({ title, children, action }: { title: string; children: ReactNode; action?: () => void }) {
  return (
    <section role="alert" className={panelClass}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">{children}</p>
      {action && <button className="catalog-button mt-3" type="button" onClick={action}>Try again</button>}
    </section>
  );
}

function Leaderboard({ id, title, entries, unit, demo = false }: {
  id: string;
  title: string;
  entries: RankingsData["reported"];
  unit: string;
  demo?: boolean;
}) {
  return (
    <section aria-labelledby={id} className="mt-5 rounded-xl border border-line bg-surface shadow-xs">
      <div className={`rounded-t-xl border-b border-line px-4 py-3.5 sm:px-5 ${demo ? "bg-[#f5efdf] text-[#715524]" : "bg-accent-soft text-accent"}`}>
        <h3 id={id} className="font-semibold">{title}</h3>
        {demo && <p className="mt-1 text-xs">Synthetic scores for demonstration.</p>}
      </div>
      <table aria-labelledby={id} className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-line bg-panel text-xs text-muted">
          <tr>
            <th scope="col" className="w-13 px-2 py-3 text-center font-medium sm:w-20 sm:px-4">Rank</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-4">Model</th>
            <th scope="col" className="w-[30%] px-3 py-3 text-right font-medium sm:w-36 sm:px-4">Score</th>
            <th scope="col" className="hidden w-[35%] px-4 py-3 font-medium sm:table-cell">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.map(({ model, rank, value, sourceLabel, sourceUrl, measuredOn }) => {
            const source = (
              <>
                <SourceLink url={sourceUrl}>{sourceLabel}</SourceLink>
                {measuredOn && <span className="mt-0.5 block text-xs text-muted">{formatDate(measuredOn)}</span>}
              </>
            );
            return (
              <tr key={model.slug} className="align-top">
                <td className="px-2 py-3 text-center font-medium text-muted tabular-nums sm:px-4">{rank}</td>
                <th scope="row" className="px-2 py-3 text-left font-normal wrap-anywhere sm:px-4">
                  <Link href={`/models/${model.slug}`} prefetch={false} className="rounded-sm font-semibold text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent">{model.name}</Link>
                  <p className="mt-1 text-xs text-muted">
                    {model.lab.name}
                    {model.isDemo && !demo && " · Demo model"}
                  </p>
                  <div className="mt-2 text-xs text-muted sm:hidden">{source}</div>
                </th>
                <td className="px-3 py-3 text-right font-semibold wrap-anywhere tabular-nums sm:px-4">{formatBenchmarkValue(value, unit)}</td>
                <td className="hidden px-4 py-3 wrap-anywhere sm:table-cell">{source}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function RankingResults({ rankings }: { rankings: RankingsData }) {
  const { benchmark, reported, demo, unrankedCount } = rankings;

  return (
    <section aria-labelledby="benchmark-name">
      <div className={panelClass}>
        <h2 id="benchmark-name" className="text-xl font-semibold tracking-tight wrap-anywhere">{benchmark.name}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{benchmark.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted">Version</dt><dd className="mt-1 font-medium wrap-anywhere">{benchmark.version}</dd></div>
          <div><dt className="text-xs text-muted">Unit</dt><dd className="mt-1 font-medium wrap-anywhere">{benchmark.unit}</dd></div>
          <div><dt className="text-xs text-muted">Scoring</dt><dd className="mt-1 font-medium">{benchmark.direction === "HIGHER_IS_BETTER" ? "Higher is better" : "Lower is better"}</dd></div>
          <div className="col-span-full"><dt className="text-xs text-muted">Methodology</dt><dd className="mt-1 leading-relaxed">{benchmark.protocol}</dd></div>
        </dl>
      </div>
      {reported.length > 0 && <Leaderboard id="reported-leaderboard" title="Reported leaderboard" entries={reported} unit={benchmark.unit} />}
      {demo.length > 0 && <Leaderboard id="demo-leaderboard" title="Demo leaderboard" entries={demo} unit={benchmark.unit} demo />}
      {reported.length === 0 && demo.length === 0 && <p role="status" className={`${panelClass} text-sm text-muted`}>There are no scores for this benchmark yet.</p>}
      {unrankedCount > 0 && (
        <p className="mt-3 text-sm text-muted">
          {unrankedCount === 1 ? "1 model has" : `${unrankedCount} models have`} no score for this benchmark.
        </p>
      )}
    </section>
  );
}

function RankingsSelection({ benchmarks, selection }: { benchmarks: BenchmarkDefinition[]; selection: { benchmark?: string; category?: ModelType } }) {
  const requested = benchmarks.find(({ slug }) => slug === selection.benchmark);
  const category = selection.category ?? requested?.category ?? benchmarks[0].category;
  const available = benchmarks.filter((benchmark) => benchmark.category === category);
  const selected = selection.benchmark ? available.find(({ slug }) => slug === selection.benchmark) : available[0];
  const { state, retry } = useCatalogResource<RankingsData>(selected
    ? `/api/rankings?${new URLSearchParams({ category, benchmark: selected.slug })}`
    : null);

  function changeFilters(nextCategory: ModelType, nextBenchmark?: string) {
    const params = new URLSearchParams({ category: nextCategory });
    if (nextBenchmark) params.set("benchmark", nextBenchmark);
    window.history.pushState(null, "", `/rankings?${params}`);
  }

  return (
    <>
      <section aria-label="Ranking filters" className={`${panelClass} grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:max-w-3xl`}>
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-muted">Model category</span>
          <span className="catalog-select">
            <select value={category} className="catalog-field" onChange={(event) => {
              const nextCategory = event.currentTarget.value as ModelType;
              changeFilters(nextCategory, benchmarks.find((benchmark) => benchmark.category === nextCategory)?.slug);
            }}>
              {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </span>
        </label>
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-muted">Benchmark</span>
          <span className="catalog-select">
            <select value={selected?.slug ?? ""} disabled={available.length === 0} className="catalog-field" onChange={(event) => changeFilters(category, event.currentTarget.value)}>
              {!selected && <option value="" disabled>{available.length ? "Choose a benchmark" : "No benchmarks available"}</option>}
              {available.map(({ slug, name, version }) => <option key={slug} value={slug}>{name} · v{version}</option>)}
            </select>
          </span>
        </label>
      </section>
      {!selected && (selection.benchmark ? (
        <RankingsError title="Benchmark unavailable">Choose an available benchmark or change the model category.</RankingsError>
      ) : <p role="status" className={`${panelClass} text-sm text-muted`}>No benchmarks are available in this category.</p>)}
      {selected && state.status === "loading" && <p role="status" className={`${panelClass} text-sm text-muted`}>Loading scores…</p>}
      {selected && state.status === "error" && <RankingsError title="Rankings unavailable" action={retry}>The scores could not be loaded.</RankingsError>}
      {selected && state.status === "ready" && <RankingResults rankings={state.data} />}
    </>
  );
}

export function RankingsScreen() {
  const params = useSearchParams();
  const selection = parseRankingSelection(params);
  const { state, retry } = useCatalogResource<BenchmarkDefinition[]>(selection.success ? "/api/benchmarks" : null);

  if (!selection.success) {
    return <RankingsError title="Invalid rankings link">Choose a category and benchmark from the <Link href="/rankings" className="font-medium text-accent underline underline-offset-3">rankings page</Link>.</RankingsError>;
  }
  if (state.status === "loading") return <RankingsLoading />;
  if (state.status === "error") return <RankingsError title="Benchmarks unavailable" action={retry}>The benchmark catalog could not be loaded.</RankingsError>;
  if (state.data.length === 0) return <p role="status" className={`${panelClass} text-sm text-muted`}>No benchmarks are available yet.</p>;
  return <RankingsSelection benchmarks={state.data} selection={selection.data} />;
}
