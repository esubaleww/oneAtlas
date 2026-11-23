"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { comparisonHref, MAX_COMPARISON_MODELS, MIN_COMPARISON_MODELS } from "../../catalog/comparison";

export type SelectedModel = { slug: string; name: string };
type Selection = {
  models: SelectedModel[];
  setModels: (models: SelectedModel[]) => void;
  toggle: (model: SelectedModel) => void;
};
const ComparisonContext = createContext<Selection | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<SelectedModel[]>([]);

  function toggle({ slug, name }: SelectedModel) {
    setModels((current) => {
      if (current.some((model) => model.slug === slug)) {
        return current.filter((model) => model.slug !== slug);
      }
      return current.length < MAX_COMPARISON_MODELS ? [...current, { slug, name }] : current;
    });
  }

  return <ComparisonContext value={{ models, setModels, toggle }}>{children}</ComparisonContext>;
}

export function useComparison() {
  const selection = useContext(ComparisonContext);
  if (!selection) {
    throw new Error("Comparison controls require ComparisonProvider.");
  }
  return selection;
}

export function CompareToggle({ model, compact = false }: { model: SelectedModel; compact?: boolean }) {
  const { models, toggle } = useComparison();
  const selected = models.some(({ slug }) => slug === model.slug);
  const full = !selected && models.length >= MAX_COMPARISON_MODELS;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Compare ${model.name}`}
      title={full ? "Remove a model from the tray to add another." : selected ? "Remove from comparison" : "Add to comparison"}
      onClick={() => toggle(model)}
      disabled={full}
      className={`catalog-button aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent ${compact ? "min-h-8 min-w-8 px-2 py-0" : ""}`}
    >
      <span aria-hidden="true">{selected ? "✓" : "+"}</span>
      {!compact && (selected ? "Selected" : "Compare")}
    </button>
  );
}

export function SelectionChips({ models, onRemove }: { models: SelectedModel[]; onRemove: (slug: string) => void }) {
  return (
    <ul aria-label="Selected models" className="flex flex-wrap gap-1.5">
      {models.map(({ slug, name }) => (
        <li key={slug} className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border border-line bg-panel ps-2 text-xs font-medium">
          <span className="min-w-0 wrap-break-word">{name}</span>
          <button
            type="button"
            aria-label={`Remove ${name}`}
            className="grid min-h-8 min-w-8 shrink-0 place-items-center rounded text-base text-muted hover:bg-accent-soft hover:text-accent"
            onClick={() => onRemove(slug)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ComparisonTray() {
  const pathname = usePathname();
  const { models, setModels } = useComparison();
  if (pathname === "/compare" || models.length === 0) return null;

  const ready = models.length >= MIN_COMPARISON_MODELS;
  const label = `Compare (${models.length})`;

  return (
    <>
      <div className="h-52 sm:h-28" aria-hidden="true" />
      <aside aria-label="Comparison tray" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface shadow-[0_-5px_22px_#142b2220]">
        <div className="mx-auto flex max-h-[42dvh] max-w-7xl flex-wrap items-center justify-between gap-2 overflow-y-auto px-5 py-3 sm:gap-3 sm:px-8">
          <div className="min-w-0 flex-1 basis-full sm:basis-64">
            <p role="status" className="mb-1.5 text-xs font-medium text-muted">
              {models.length} of {MAX_COMPARISON_MODELS} selected
              {models.length === MAX_COMPARISON_MODELS && " · Remove a model to replace it"}
            </p>
            <SelectionChips models={models} onRemove={(slug) => setModels(models.filter((model) => model.slug !== slug))} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="catalog-button" onClick={() => setModels([])}>Clear</button>
            {ready ? (
              <Link href={comparisonHref(models.map(({ slug }) => slug))} className="catalog-button catalog-button-primary">
                {label}
              </Link>
            ) : <button type="button" className="catalog-button" disabled>{label}</button>}
          </div>
        </div>
      </aside>
    </>
  );
}
