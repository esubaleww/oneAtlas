"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import type { CatalogQuery } from "../../catalog/params";
import type { CatalogFilters, listModels, ModelSummary } from "../../server/catalog";
import { capabilityLabels, CatalogLoading, CatalogMessage, CatalogResults, typeLabels } from "./catalog-results";
import { useCatalogResource } from "./use-catalog-resource";

type ModelPage = Awaited<ReturnType<typeof listModels>>;
type SelectOption = { value: string; label: string };

const sortOptions = [
  { sort: "releasedOn", direction: "desc", label: "Newest release" },
  { sort: "releasedOn", direction: "asc", label: "Oldest release" },
  { sort: "contextWindow", direction: "desc", label: "Largest context" },
  { sort: "contextWindow", direction: "asc", label: "Smallest context" },
  { sort: "inputPrice", direction: "asc", label: "Input price · low to high" },
  { sort: "inputPrice", direction: "desc", label: "Input price · high to low" },
  { sort: "outputPrice", direction: "asc", label: "Output price · low to high" },
  { sort: "outputPrice", direction: "desc", label: "Output price · high to low" },
] as const satisfies readonly {
  sort: CatalogQuery["sort"];
  direction: CatalogQuery["direction"];
  label: string;
}[];

function SearchField({ query, onSearch }: { query: string; onSearch: (value: string) => void }) {
  const [draft, setDraft] = useState({ query, value: query });
  if (draft.query !== query) {
    setDraft({ query, value: query });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.value.trim();
    setDraft({ query, value });
    onSearch(value);
  }

  return (
    <form role="search" aria-label="Model search" onSubmit={submit} className="flex min-w-0 items-end gap-2">
      <label className="block min-w-0 flex-1 text-xs font-medium">
        <span className="mb-1.5 block">Search models</span>
        <span className="relative block">
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true">
            <span className="search-icon block" />
          </span>
          <input
            type="search"
            maxLength={100}
            placeholder="Name or description"
            value={draft.value}
            onChange={(event) => setDraft({ query, value: event.target.value })}
            className="catalog-field ps-9"
          />
        </span>
      </label>
      <button type="submit" className="catalog-button catalog-button-primary min-h-10 shrink-0 px-4">Search</button>
    </form>
  );
}

function CatalogSelect({ label, value, options, onChange, disabled = false }: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selectedOptionExists = options.some((option) => option.value === value);

  return (
    <label className="block min-w-0 text-xs font-medium">
      <span className="mb-1.5 block">{label}</span>
      <span className="catalog-select">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="catalog-field"
        >
          {!selectedOptionExists && <option value={value}>{value}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

function commitQuery(params: URLSearchParams) {
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
  if (url !== window.location.pathname + window.location.search) {
    window.history.pushState(null, "", url);
  }
}

function changeQuery(changes: Record<string, string | string[]>) {
  const params = new URLSearchParams(window.location.search);
  params.delete("page");
  for (const [name, values] of Object.entries(changes)) {
    params.delete(name);
    for (const value of Array.isArray(values) ? values : [values]) {
      if (value) params.append(name, value);
    }
  }
  commitQuery(params);
}

function resetQuery() {
  commitQuery(new URLSearchParams());
}

function toggleCapability(value: ModelSummary["capabilities"][number]) {
  const selected = new URLSearchParams(window.location.search).getAll("capability");
  changeQuery({
    capability: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
  });
}

export function ModelExplorer() {
  const params = useSearchParams();
  const query = params.toString();
  const filters = useCatalogResource<CatalogFilters>("/api/catalog-filters");
  const results = useCatalogResource<ModelPage>(query ? `/api/models?${query}` : "/api/models");
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  const options = filters.state.status === "ready" ? filters.state.data : undefined;
  const current = results.state.status === "ready" ? results.state.data : undefined;
  const selectedCapabilities = params.getAll("capability");
  const sort = params.get("sort") ?? "releasedOn";
  const direction = params.get("direction") ?? "desc";
  const sortValue = sortOptions.some((option) => option.sort === sort && option.direction === direction)
    ? `${sort}:${direction}`
    : "releasedOn:desc";

  function goToPage(page: number) {
    changeQuery({ page: page === 1 ? "" : String(page) });
    resultsHeading.current?.focus({ preventScroll: true });
    resultsHeading.current?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <section aria-label="Search and filters" className="mt-5 rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <SearchField query={params.get("q") ?? ""} onSearch={(value) => changeQuery({ q: value })} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:contents">
            <CatalogSelect
              label="Lab"
              value={params.get("lab") ?? ""}
              options={[{ value: "", label: "All labs" }, ...(options?.labs.map(({ slug, name }) => ({ value: slug, label: name })) ?? [])]}
              disabled={!options}
              onChange={(lab) => changeQuery({ lab })}
            />
            <CatalogSelect
              label="Provider"
              value={params.get("provider") ?? ""}
              options={[{ value: "", label: "All providers" }, ...(options?.providers.map(({ slug, name }) => ({ value: slug, label: name })) ?? [])]}
              disabled={!options}
              onChange={(provider) => changeQuery({ provider })}
            />
            <CatalogSelect
              label="Model type"
              value={params.get("type") ?? ""}
              options={[{ value: "", label: "All types" }, ...(options?.types.map((type) => ({ value: type, label: typeLabels[type] })) ?? [])]}
              disabled={!options}
              onChange={(type) => changeQuery({ type })}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-3.5">
          {options ? (
            <div role="group" aria-label="Capabilities" className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted">Capabilities</span>
              {options.capabilities.map((capability) => (
                <button
                  key={capability}
                  type="button"
                  onClick={() => toggleCapability(capability)}
                  aria-pressed={selectedCapabilities.includes(capability)}
                  className="rounded-md border border-line px-2.5 py-1.5 text-xs leading-none font-medium text-muted transition-colors hover:border-accent hover:text-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
                >
                  {capabilityLabels[capability]}
                </button>
              ))}
            </div>
          ) : filters.state.status === "error" ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted" role="status">
              Filter options are unavailable.
              <button type="button" className="font-medium text-accent underline underline-offset-2" onClick={filters.retry}>Retry filters</button>
            </div>
          ) : (
            <p className="text-xs text-muted" role="status">Loading filters…</p>
          )}
          <button type="button" onClick={resetQuery} disabled={!query} className="rounded px-1 py-1 text-xs font-medium text-accent hover:underline disabled:text-muted disabled:opacity-70 disabled:no-underline">
            Reset filters
          </button>
        </div>
      </section>

      <section aria-labelledby="catalog-results" className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="catalog-results" ref={resultsHeading} tabIndex={-1} className="scroll-mt-5 text-xl font-semibold tracking-tight">
              {current ? `${current.pagination.total} ${current.pagination.total === 1 ? "model" : "models"}` : "Models"}
            </h2>
            <p className="mt-1 text-xs text-muted" role="status">
              {current && current.models.length > 0
                ? `Showing ${(current.pagination.page - 1) * current.pagination.pageSize + 1}–${(current.pagination.page - 1) * current.pagination.pageSize + current.models.length}`
                : ""}
            </p>
          </div>
          <div className="w-[10rem] shrink-0 sm:w-[12.5rem]">
            <CatalogSelect
              label="Sort by"
              value={sortValue}
              options={sortOptions.map((option) => ({ value: `${option.sort}:${option.direction}`, label: option.label }))}
              onChange={(selected) => {
                const [sort, direction] = selected.split(":");
                changeQuery({ sort, direction });
              }}
            />
          </div>
        </div>

        {results.state.status === "loading" && <CatalogLoading />}
        {results.state.status === "error" && (
          results.state.httpStatus === 400 ? (
            <CatalogMessage title="Invalid catalog filters" error action={(
              <button type="button" className="catalog-button" onClick={resetQuery}>Reset filters</button>
            )}>
              The catalog could not use the filters in this URL.
            </CatalogMessage>
          ) : (
            <CatalogMessage title="Catalog unavailable" error action={(
              <button type="button" className="catalog-button" onClick={results.retry}>Try again</button>
            )}>
              We couldn’t load the models. Please try again.
            </CatalogMessage>
          )
        )}
        {current && current.models.length === 0 && (
          current.pagination.total > 0 ? (
            <CatalogMessage title="No models on this page" action={(
              <button type="button" className="catalog-button" onClick={() => goToPage(1)}>Back to first page</button>
            )}>
              Go back to the first page to see the matching models.
            </CatalogMessage>
          ) : (
            <CatalogMessage title="No matching models" action={(
              query && <button type="button" className="catalog-button" onClick={resetQuery}>Clear search and filters</button>
            )}>
              {query ? "Try a different search or clear your filters." : "The catalog is empty."}
            </CatalogMessage>
          )
        )}
        {current && current.models.length > 0 && (
          <>
            <CatalogResults models={current.models} />
            {current.pagination.totalPages > 1 && (
              <nav aria-label="Model pages" className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button type="button" className="catalog-button" disabled={current.pagination.page <= 1} onClick={() => goToPage(current.pagination.page - 1)}>
                  <span aria-hidden="true">‹</span> Previous
                </button>
                <p className="text-xs text-muted">Page {current.pagination.page} of {Math.min(10_000, current.pagination.totalPages)}</p>
                <button type="button" className="catalog-button" disabled={current.pagination.page >= Math.min(10_000, current.pagination.totalPages)} onClick={() => goToPage(current.pagination.page + 1)}>
                  Next <span aria-hidden="true">›</span>
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
