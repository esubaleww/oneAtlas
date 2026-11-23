import type { BillingUnit, Capability, Modality, ModelType } from "../generated/prisma/enums";

export const typeLabels: Record<ModelType, string> = {
  TEXT_GENERATION: "Text generation",
  EMBEDDING: "Embedding",
};

export const capabilityLabels: Record<Capability, string> = {
  REASONING: "Reasoning",
  TOOL_CALLING: "Tool calling",
  STRUCTURED_OUTPUT: "Structured output",
  VISION: "Vision",
  OPEN_WEIGHTS: "Open weights",
  MULTILINGUAL: "Multilingual",
};

export const modalityLabels: Record<Modality, string> = {
  TEXT: "Text",
  IMAGE: "Image",
  EMBEDDING: "Embedding",
};

const billingUnits: Record<BillingUnit, string> = {
  PER_MILLION_TOKENS: "1M tokens",
};

const integerFormat = new Intl.NumberFormat("en-US");
const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
const scoreFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

export function formatRate(price: string | null, applies = true) {
  if (price === null) {
    return applies ? "Unknown" : "N/A";
  }
  const amount = Number(price);
  return amount === 0 ? "Free" : priceFormat.format(amount);
}

export function formatBillingUnit(offering: { currency: string; billingUnit: BillingUnit }) {
  return `${offering.currency} / ${billingUnits[offering.billingUnit]}`;
}

export function formatTokenCount(value: number | null, withUnit = false) {
  if (value === null) {
    return "Unknown";
  }
  return integerFormat.format(value) + (withUnit ? " tokens" : "");
}

export function formatDate(value: string | null) {
  return value ? dateFormat.format(new Date(value)) : "Unknown";
}

export function formatBenchmarkValue(value: string, unit: string) {
  const score = scoreFormat.format(Number(value));
  return score + (unit === "%" ? unit : ` ${unit}`);
}
