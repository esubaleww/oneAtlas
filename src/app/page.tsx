import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogLoading } from "./discovery/catalog-results";
import { ModelExplorer } from "./discovery/model-explorer";

export const metadata: Metadata = {
  title: { absolute: "Model Explorer | OneAtlas" },
};

export default function HomePage() {
  return (
    <>
      <section className="catalog-hero rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-11" aria-labelledby="explorer-heading">
        <div className="max-w-xl">
          <h1 id="explorer-heading" className="text-[2.1rem] leading-none font-semibold tracking-[-0.045em] sm:text-[3.2rem]">
            Model explorer
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#cbdfd4] sm:mt-4 sm:text-base">
            Explore AI model specifications, capabilities, and provider pricing side by side.
          </p>
        </div>
      </section>
      <Suspense fallback={<CatalogLoading />}>
        <ModelExplorer />
      </Suspense>
    </>
  );
}
