"use client";

import Link from "next/link";

export default function ModelError({ retry }: { retry: () => void }) {
  return (
    <section className="rounded-xl border border-line bg-surface px-6 py-10 shadow-xs sm:px-9" role="alert">
      <h1 className="text-3xl font-semibold tracking-tight">Model details unavailable</h1>
      <p className="mt-3 text-sm text-muted">Try loading this model again or return to the catalog.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={retry} className="catalog-button catalog-button-primary">Try again</button>
        <Link href="/" className="catalog-button">Back to models</Link>
      </div>
    </section>
  );
}
