import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchLoading, SearchResults } from "./search-results";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <>
      <section className="catalog-hero rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-10" aria-labelledby="search-title">
        <h1 id="search-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">Search catalog</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cbdfd4] sm:text-base">Find models, research labs, and serving providers in one search.</p>
      </section>
      <Suspense fallback={<SearchLoading />}>
        <SearchResults />
      </Suspense>
    </>
  );
}
