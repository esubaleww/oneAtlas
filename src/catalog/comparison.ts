export const MIN_COMPARISON_MODELS = 2;
export const MAX_COMPARISON_MODELS = 4;

export function comparisonHref(ids: readonly string[]) {
  return ids.length ? `/compare?${new URLSearchParams({ ids: ids.join(",") })}` : "/compare";
}
