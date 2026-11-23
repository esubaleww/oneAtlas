"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { comparisonHref, MAX_COMPARISON_MODELS, MIN_COMPARISON_MODELS } from "../../catalog/comparison";
import { parseComparisonParams } from "../../catalog/params";
import { useCatalogResource } from "../../catalog/use-catalog-resource";
import type { ComparisonData, listModels } from "../../server/catalog";
import { SelectionChips, useComparison, type SelectedModel } from "./comparison-selection";
import { ComparisonTable } from "./comparison-table";

function ModelPicker({ ids, onAdd }: { ids: string[]; onAdd: (model: SelectedModel) => void }) {
  const [{ query, page }, setSearch] = useState({ query: "", page: 1 });
  const params = new URLSearchParams({ pageSize: "6", page: String(page) });
  if (query) params.set("q", query);
  const { state, retry } = useCatalogResource<Awaited<ReturnType<typeof listModels>>>(`/api/models?${params}`);

  function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = new FormData(event.currentTarget).get("q");
    setSearch({ query: typeof input === "string" ? input.trim() : "", page: 1 });
  }

  return (
    <div id="comparison-model-picker" className="mt-4 border-t border-line pt-4">
      <form role="search" aria-label="Find a model to compare" onSubmit={search} className="flex max-w-md items-center gap-2">
        <input type="search" name="q" maxLength={100} aria-label="Find a model by name" placeholder="Find a model by name…" className="catalog-field" />
        <button type="submit" className="catalog-button">Search</button>
      </form>
      {state.status === "loading" && <p role="status" className="mt-3 text-sm text-muted">Loading models…</p>}
      {state.status === "error" && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <p>Models are temporarily unavailable.</p>
          <button type="button" onClick={retry} className="catalog-button">Retry model search</button>
        </div>
      )}
      {state.status === "ready" && (
        <>
          {state.data.models.length === 0 ? <p role="status" className="mt-3 text-sm text-muted">No matching models.</p> : (
            <ul aria-label="Search results" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {state.data.models.map((model) => {
                const selected = ids.includes(model.slug);
                return (
                  <li key={model.slug} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-panel p-2.5">
                    <div className="min-w-0 wrap-break-word">
                      <p className="text-sm font-medium">{model.name}</p>
                      <p className="text-xs text-muted">{model.lab.name}</p>
                    </div>
                    <button type="button" disabled={selected} aria-label={selected ? `${model.name} is selected` : `Add ${model.name}`} className="catalog-button shrink-0" onClick={() => onAdd(model)}>
                      {selected ? "Selected" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {state.data.pagination.totalPages > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={page === 1} onClick={() => setSearch({ query, page: page - 1 })} className="catalog-button">Previous</button>
              <p role="status" className="text-xs text-muted">Page {page} of {state.data.pagination.totalPages}</p>
              <button type="button" disabled={page === state.data.pagination.totalPages} onClick={() => setSearch({ query, page: page + 1 })} className="catalog-button">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ComparisonScreen() {
  const params = useSearchParams();
  const parsed = parseComparisonParams(params, true);
  const ids = parsed.success ? parsed.data : [];
  const href = comparisonHref(ids);
  const hasMinimum = ids.length >= MIN_COMPARISON_MODELS;
  const { state, retry } = useCatalogResource<ComparisonData>(hasMinimum ? `/api${href}` : null);
  const { models, setModels } = useComparison();
  const [showPicker, setShowPicker] = useState(false);
  const [copyResult, setCopyResult] = useState<{ href: string; message: string }>();
  const compared = state.status === "ready" ? state.data.models : undefined;
  const selected = ids.map((slug) => ({
    slug,
    name: compared?.find((model) => model.slug === slug)?.name ?? models.find((model) => model.slug === slug)?.name ?? slug,
  }));
  const canAdd = ids.length < MAX_COMPARISON_MODELS;
  const pickerOpen = canAdd && (!hasMinimum || showPicker);

  function update(next: SelectedModel[]) {
    setModels(next.map(({ slug, name }) => ({ slug, name })));
    setCopyResult(undefined);
    window.history.pushState(null, "", comparisonHref(next.map(({ slug }) => slug)));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyResult({ href, message: "Link copied." });
    } catch {
      setCopyResult({ href, message: "Copy the address from your browser." });
    }
  }

  if (!parsed.success) {
    return (
      <section role="alert" className="mt-5 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold">Invalid comparison link</h2>
        <p className="mt-2 text-sm text-muted">A comparison link can include up to {MAX_COMPARISON_MODELS} distinct model identifiers.</p>
        <button type="button" className="catalog-button mt-3" onClick={() => update([])}>Start a comparison</button>
      </section>
    );
  }

  return (
    <>
      <section aria-labelledby="comparison-selection-title" className="mt-5 rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="comparison-selection-title" className="text-lg font-semibold tracking-tight">Selected models</h2>
            <p role="status" className="mt-1 text-sm text-muted">
              {ids.length} of {MAX_COMPARISON_MODELS} selected
              {!canAdd && " · Remove a model to replace it"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasMinimum && canAdd && (
              <button type="button" aria-expanded={pickerOpen} aria-controls={pickerOpen ? "comparison-model-picker" : undefined} className="catalog-button" onClick={() => setShowPicker(!showPicker)}>
                {pickerOpen ? "Hide model search" : "Add a model"}
              </button>
            )}
            <Link href="/" className="catalog-button" onClick={() => setModels(selected)}>Browse models</Link>
            {compared && <button type="button" className="catalog-button catalog-button-primary" onClick={copyLink}>Copy link</button>}
          </div>
        </div>
        {selected.length > 0 && (
          <div className="mt-3">
            <SelectionChips models={selected} onRemove={(slug) => update(selected.filter((model) => model.slug !== slug))} />
          </div>
        )}
        {copyResult?.href === href && <p role="status" className="mt-2 text-sm text-muted">{copyResult.message}</p>}
        {!hasMinimum && <p className="mt-3 text-sm text-muted">Select at least two models to see a comparison.</p>}
        {pickerOpen && <ModelPicker ids={ids} onAdd={(model) => update([...selected, model])} />}
      </section>
      {hasMinimum && state.status === "loading" && <p role="status" className="mt-5 text-sm text-muted">Loading comparison…</p>}
      {hasMinimum && state.status === "error" && (
        <section role="alert" className="mt-5 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Comparison unavailable</h2>
          <p className="mt-2 text-sm text-muted">
            {state.httpStatus === 404 ? "One or more selected models are unavailable. Remove the missing model or choose a replacement." : "Try loading the comparison again."}
          </p>
          {state.httpStatus !== 404 && <button type="button" onClick={retry} className="catalog-button mt-3">Try again</button>}
        </section>
      )}
      {compared && (
        <section className="mt-6" aria-labelledby="comparison-results-title">
          <h2 id="comparison-results-title" className="text-xl font-semibold tracking-tight">Side by side</h2>
          <p className="mt-2 mb-4 text-sm leading-relaxed text-muted">
            Both rates come from the listed pricing provider. That offering is selected by the model explorer’s default pricing rule.
          </p>
          <ComparisonTable models={compared} />
        </section>
      )}
    </>
  );
}
