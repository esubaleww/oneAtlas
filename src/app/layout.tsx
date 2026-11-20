import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
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
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-10 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-sm text-lg font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-lg bg-accent"
              >
                <span className="size-3 rotate-45 rounded-xs border-2 border-white" />
              </span>
              OneAtlas
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
