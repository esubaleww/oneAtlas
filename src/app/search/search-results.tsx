"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCatalogResource } from "../../catalog/use-catalog-resource";
import type { GlobalSearchResults, SearchHit } from "../../server/catalog";

const groups = [
  { key: "models", heading: "Models", href: "/models" },
  { key: "labs", heading: "Labs", href: "/labs" },
  { key: "providers", heading: "Providers", href: "/providers" },
] as const;

function SearchGroup({ group, hits }: { group: (typeof groups)[number]; hits: SearchHit[] }) {
  return (
    <section aria-labelledby={`search-${group.key}`} className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <h2 id={`search-${group.key}`} className="border-b border-line bg-panel px-5 py-3.5 text-base font-semibold tracking-tight">
        {group.heading}
      </h2>
      {hits.length ? (
        <ul className="divide-y divide-line">
          {hits.map((hit) => (
            <li key={hit.slug} className="min-w-0 px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`${group.href}/${hit.slug}`} prefetch={false} className="rounded-sm text-sm font-semibold text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent">
                  {hit.name}
                </Link>
                {hit.isDemo && <span className="rounded bg-[#f5efdf] px-1.5 py-0.5 text-[11px] font-medium text-[#715524]">Demo</span>}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{hit.description}</p>
            </li>
          ))}
        </ul>
      ) : <p className="px-5 py-4 text-sm text-muted">No matching {group.heading.toLowerCase()}.</p>}
    </section>
  );
}

export function SearchLoading() {
  return <p role="status" className="mt-5 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">Searching the catalog…</p>;
}

function LoadedSearch({ query, params }: { query: string; params: string }) {
  const { state, retry } = useCatalogResource<GlobalSearchResults>(`/api/search?${params}`);
  if (state.status === "loading") return <SearchLoading />;
  if (state.status === "error") {
    return (
      <section role="alert" className="mt-5 rounded-xl border border-line bg-surface p-5 shadow-xs">
        <h2 className="text-lg font-semibold">{state.httpStatus === 400 ? "Invalid search" : "Search unavailable"}</h2>
        <p className="mt-2 text-sm text-muted">{state.httpStatus === 400 ? "Submit a search term of 1 to 100 characters." : "Try loading your results again."}</p>
        {state.httpStatus !== 400 && <button type="button" className="catalog-button mt-4" onClick={retry}>Try again</button>}
      </section>
    );
  }

  const total = state.data.models.length + state.data.labs.length + state.data.providers.length;
  return (
    <>
      <p role="status" className="my-5 wrap-break-word text-sm text-muted">
        <span className="font-semibold text-ink">{total ? `Showing ${total} ${total === 1 ? "match" : "matches"}` : "No matches"}</span> for “{query}”
      </p>
      {total > 0 && (
        <div className="grid items-start gap-4 md:grid-cols-3">
          {groups.map((group) => <SearchGroup key={group.key} group={group} hits={state.data[group.key]} />)}
        </div>
      )}
      {state.data.models.length === 5 && (
        <Link href={`/?${new URLSearchParams({ q: query })}`} className="mt-4 inline-block rounded-sm text-sm font-medium text-accent underline underline-offset-3">
          See all model matches in the explorer
        </Link>
      )}
    </>
  );
}

export function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q")?.trim();
  return query
    ? <LoadedSearch query={query} params={params.toString()} />
    : <p className="mt-5 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">Enter a name or description in the global search box.</p>;
}
