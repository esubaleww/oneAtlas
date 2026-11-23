import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparisonScreen } from "./comparison-screen";

export const metadata: Metadata = { title: "Compare models" };

export default function ComparePage() {
  return (
    <>
      <section aria-labelledby="compare-title" className="catalog-hero rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-10">
        <h1 id="compare-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">Compare models</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cbdfd4] sm:text-base">Review context, capabilities, provider prices, and benchmark scores side by side.</p>
      </section>
      <Suspense fallback={<p role="status" className="mt-5 text-sm text-muted">Loading comparison…</p>}>
        <ComparisonScreen />
      </Suspense>
    </>
  );
}
