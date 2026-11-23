import { z } from "zod";
import { Capability, ModelType } from "../generated/prisma/enums";
import { MAX_COMPARISON_MODELS, MIN_COMPARISON_MODELS } from "./comparison";

export const catalogSlug = z
  .string()
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphen-separated slug.");

function positiveInteger(maximum: number, fallback: number) {
  return z.string()
    .regex(/^[1-9]\d*$/, "Use a positive whole number.")
    .transform(Number)
    .pipe(z.number().int().max(maximum))
    .default(fallback);
}

const searchText = z.string().trim().max(100)
  .refine((value) => !value.includes("\0"), "Search terms cannot contain a null character.");

export const globalSearchQuery = searchText.min(1);

const comparisonDraft = z.array(catalogSlug).max(MAX_COMPARISON_MODELS)
  .refine((ids) => new Set(ids).size === ids.length, "Select each model only once.");
const comparisonRequest = comparisonDraft.min(MIN_COMPARISON_MODELS);

export function parseComparisonParams(params: { size: number; get(name: string): string | null }, allowDraft = false) {
  const value = params.get("ids");
  const ids = params.size === 1 && value !== null ? value.split(",")
    : params.size === 0 && allowDraft ? [] : undefined;
  return (allowDraft ? comparisonDraft : comparisonRequest).safeParse(ids);
}

const catalogQuery = z.strictObject({
  q: searchText.optional(),
  lab: catalogSlug.optional(),
  provider: catalogSlug.optional(),
  type: z.enum(ModelType).optional(),
  capability: z.array(z.enum(Capability)).max(Object.keys(Capability).length)
    .transform((values) => [...new Set(values)])
    .default([]),
  sort: z.enum(["inputPrice", "outputPrice", "contextWindow", "releasedOn"]).default("releasedOn"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  page: positiveInteger(10_000, 1),
  pageSize: positiveInteger(50, 12),
});

export type CatalogQuery = z.infer<typeof catalogQuery>;

export function parseCatalogQuery(params: URLSearchParams) {
  const values = new Map<string, string[]>();
  for (const [key, value] of params) {
    const entries = values.get(key) ?? [];
    entries.push(value);
    values.set(key, entries);
  }

  const input = Object.fromEntries(
    Array.from(values, ([key, entries]) => [
      key,
      key === "capability" || entries.length > 1 ? entries : entries[0],
    ]),
  );
  return catalogQuery.safeParse(input);
}
