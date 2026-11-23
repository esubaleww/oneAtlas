import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { CatalogNavigation, GlobalSearch, GlobalSearchForm } from "./catalog-navigation";
import { ComparisonProvider, ComparisonTray } from "./compare/comparison-selection";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OneAtlas",
    template: "%s | OneAtlas",
  },
  description: "Explore AI model specifications, prices, and benchmarks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ComparisonProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-10 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
          >
            Skip to content
          </a>
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-3 gap-y-2.5 px-5 py-3 sm:gap-x-4 sm:px-8 md:flex-nowrap">
              <Link
                href="/"
                className="inline-flex shrink-0 items-center gap-2 rounded-sm text-[18px] font-semibold tracking-tight sm:gap-2.5 sm:text-[19px]"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-[9px] bg-accent"
                >
                  <span className="size-3 rotate-45 rounded-xs border-2 border-white" />
                </span>
                OneAtlas
              </Link>
              <CatalogNavigation />
              <div className="min-w-0 basis-full md:ml-auto md:max-w-82 md:flex-1 md:basis-auto">
                <Suspense fallback={<GlobalSearchForm />}>
                  <GlobalSearch />
                </Suspense>
              </div>
              <a href="/api/models" target="_blank" rel="noreferrer" className="hidden shrink-0 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent lg:inline-flex">
                Catalog API
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl px-5 pt-5 pb-14 sm:px-8 sm:pt-8"
          >
            {children}
          </main>
          <ComparisonTray />
        </ComparisonProvider>
      </body>
    </html>
  );
}
