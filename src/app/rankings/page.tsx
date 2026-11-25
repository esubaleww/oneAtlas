import type { Metadata } from "next";
import { Suspense } from "react";
import { RankingsLoading, RankingsScreen } from "./rankings-screen";

export const metadata: Metadata = { title: "Benchmark rankings" };

export default function RankingsPage() {
  return (
    <>
      <section aria-labelledby="rankings-title" className="catalog-hero rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-10">
        <h1 id="rankings-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">Benchmark rankings</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cbdfd4] sm:text-base">Choose a benchmark to compare model scores under the same test.</p>
      </section>
      <Suspense fallback={<RankingsLoading />}>
        <RankingsScreen />
      </Suspense>
    </>
  );
}
