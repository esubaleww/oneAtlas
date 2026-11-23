"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { comparisonHref } from "../catalog/comparison";
import { useComparison } from "./compare/comparison-selection";

const sections = [
  { href: "/", label: "Models" },
  { href: "/compare", label: "Compare" },
  { href: "/labs", label: "Labs" },
  { href: "/providers", label: "Providers" },
] as const;

export function CatalogNavigation() {
  const pathname = usePathname();
  const { models } = useComparison();

  return (
    <nav aria-label="Main navigation" className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 md:gap-2">
      {sections.map(({ href, label }) => {
        const active = href === "/"
          ? pathname === "/" || pathname.startsWith("/models/")
          : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href === "/compare" && !active ? comparisonHref(models.map(({ slug }) => slug)) : href}
            aria-current={pathname === href ? "page" : active ? "location" : undefined}
            className={`rounded-md px-1.5 py-2 text-xs font-medium transition-colors sm:px-2.5 sm:text-sm ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-panel hover:text-accent"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function GlobalSearchForm({ query = "" }: { query?: string }) {
  return (
    <Form action="/search" role="search" aria-label="Global catalog search" className="flex min-w-0 items-center gap-1.5">
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">Search models, labs, and providers</span>
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true">
          <span className="search-icon block" />
        </span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Models, labs, providers…"
          required
          maxLength={100}
          className="catalog-field h-9 ps-9"
        />
      </label>
      <button type="submit" className="catalog-button h-9 shrink-0">Search</button>
    </Form>
  );
}

export function GlobalSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = pathname === "/search" ? (params.get("q") ?? "") : "";

  return <GlobalSearchForm key={query} query={query} />;
}
