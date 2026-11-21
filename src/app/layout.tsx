import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-10 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 sm:gap-8 sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-sm text-[19px] font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-[9px] bg-accent"
              >
                <span className="size-3 rotate-45 rounded-xs border-2 border-white" />
              </span>
              OneAtlas
            </Link>
            <nav aria-label="Main navigation" className="flex h-full items-center">
              <Link href="/" className="inline-flex h-full items-center border-b-2 border-accent px-1 pt-0.5 text-sm font-medium text-accent">
                Models
              </Link>
            </nav>
            <a href="/api/models" target="_blank" rel="noreferrer" className="ml-auto rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent">
              <span className="hidden sm:inline">Catalog </span>API
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
      </body>
    </html>
  );
}
