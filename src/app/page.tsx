import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Model catalog | OneAtlas" },
};

export default function HomePage() {
  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        AI model catalog
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
        A catalog for exploring AI models, comparing provider prices, and
        understanding benchmark results.
      </p>

      <section
        aria-labelledby="catalog-status"
        className="mt-10 max-w-2xl rounded-xl border border-line bg-surface p-6 sm:mt-12 sm:p-8"
      >
        <h2 id="catalog-status" className="text-base font-semibold">
          Catalog setup in progress
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          Model records will appear here when the database and explorer are
          connected.
        </p>
      </section>
    </>
  );
}
