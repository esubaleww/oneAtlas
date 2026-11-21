import type { Prisma } from "../src/generated/prisma/client";
import type { Capability, ModelType, Modality } from "../src/generated/prisma/enums";

// All names, prices, dates, and scores in this file are synthetic fixtures.
export const labs = [
  {
    slug: "cedar-research",
    name: "Cedar Research",
    description: "Develops assistants for document-intensive workflows.",
    isDemo: true,
  },
  {
    slug: "tidal-intelligence",
    name: "Tidal Intelligence",
    description: "Builds multilingual tools for global teams.",
    isDemo: true,
  },
  {
    slug: "lantern-systems",
    name: "Lantern Systems",
    description: "Designs multimodal models for visual analysis.",
    isDemo: true,
  },
  {
    slug: "orbit-compute",
    name: "Orbit Compute",
    description: "Develops compact models for latency-sensitive applications.",
    isDemo: true,
  },
  {
    slug: "fieldstone-ai",
    name: "Fieldstone AI",
    description: "Explores retrieval and reasoning for technical work.",
    isDemo: true,
  },
] satisfies Prisma.LabCreateManyInput[];

export const providers = [
  {
    slug: "relay-cloud",
    name: "Relay Cloud",
    description: "Hosts text and embedding models through a managed API.",
    isDemo: true,
  },
  {
    slug: "canopy-inference",
    name: "Canopy Inference",
    description: "Serves interactive and batch workloads.",
    isDemo: true,
  },
  {
    slug: "meridian-hosting",
    name: "Meridian Hosting",
    description: "Provides hosted access to multimodal models.",
    isDemo: true,
  },
  {
    slug: "harbor-ml",
    name: "Harbor ML",
    description: "Focuses on compact models and quick responses.",
    isDemo: true,
  },
  {
    slug: "switchyard-ai",
    name: "Switchyard AI",
    description: "Offers text generation and vector embedding APIs.",
    isDemo: true,
  },
] satisfies Prisma.ProviderCreateManyInput[];

type ModelProfile = {
  slug: string;
  name: string;
  description: string;
  type: ModelType;
  inputModalities: Modality[];
  capabilities: Capability[];
  contextWindow: number | null;
  maxOutputTokens: number | null;
  inputPrice: string | null;
  outputPrice: string | null;
};

const profiles: ModelProfile[] = [
  {
    slug: "general",
    name: "General",
    description: "A general assistant for summaries, structured responses, and tool calls.",
    type: "TEXT_GENERATION",
    inputModalities: ["TEXT"],
    capabilities: ["TOOL_CALLING", "STRUCTURED_OUTPUT", "MULTILINGUAL"],
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputPrice: "0.800000",
    outputPrice: "3.200000",
  },
  {
    slug: "vision",
    name: "Vision",
    description: "Reads images alongside text for chart and screenshot analysis.",
    type: "TEXT_GENERATION",
    inputModalities: ["TEXT", "IMAGE"],
    capabilities: ["VISION", "STRUCTURED_OUTPUT"],
    contextWindow: 96_000,
    maxOutputTokens: 8_192,
    inputPrice: "1.200000",
    outputPrice: "4.500000",
  },
  {
    slug: "reasoner",
    name: "Reasoner",
    description: "Handles multi-step reasoning and longer technical documents.",
    type: "TEXT_GENERATION",
    inputModalities: ["TEXT"],
    capabilities: ["REASONING", "TOOL_CALLING", "STRUCTURED_OUTPUT"],
    contextWindow: 256_000,
    maxOutputTokens: 32_768,
    inputPrice: "2.500000",
    outputPrice: "9.000000",
  },
  {
    slug: "compact",
    name: "Compact",
    description: "A small open-weight model for classification and short responses.",
    type: "TEXT_GENERATION",
    inputModalities: ["TEXT"],
    capabilities: ["OPEN_WEIGHTS", "MULTILINGUAL"],
    contextWindow: 32_768,
    maxOutputTokens: 4_096,
    inputPrice: "0.120000",
    outputPrice: "0.400000",
  },
  {
    slug: "starter",
    name: "Starter",
    description: "A lightweight model for rewriting and extracting short text.",
    type: "TEXT_GENERATION",
    inputModalities: ["TEXT"],
    capabilities: ["STRUCTURED_OUTPUT"],
    contextWindow: null,
    maxOutputTokens: null,
    inputPrice: null,
    outputPrice: null,
  },
  {
    slug: "embed",
    name: "Embed",
    description: "Produces multilingual text embeddings for semantic search and retrieval.",
    type: "EMBEDDING",
    inputModalities: ["TEXT"],
    capabilities: ["MULTILINGUAL"],
    contextWindow: 8_192,
    maxOutputTokens: null,
    inputPrice: "0.040000",
    outputPrice: null,
  },
];

export const benchmarks = [
  {
    slug: "demo-instruction-following-v1",
    name: "Demo instruction following",
    description: "Share of prompts whose formatting and content requirements were met.",
    version: "1.0",
    protocol: "Illustrative set of 100 prompts, scored pass or fail per prompt.",
    unit: "%",
    category: "TEXT_GENERATION",
    direction: "HIGHER_IS_BETTER",
  },
  {
    slug: "demo-first-token-latency-v1",
    name: "Demo first-token latency",
    description: "Median time from submitting a prompt to receiving its first output token.",
    version: "1.0",
    protocol: "Illustrative fixed-length prompts with concurrency one under the same settings.",
    unit: "ms",
    category: "TEXT_GENERATION",
    direction: "LOWER_IS_BETTER",
  },
  {
    slug: "demo-retrieval-recall-v1",
    name: "Demo retrieval recall at 10",
    description: "Share of relevant documents found in the top ten search results.",
    version: "1.0",
    protocol: "Illustrative corpus and query set with cosine similarity and known relevant documents.",
    unit: "%",
    category: "EMBEDDING",
    direction: "HIGHER_IS_BETTER",
  },
] as const satisfies readonly Prisma.BenchmarkCreateManyInput[];

const modelFixtures = labs.flatMap((lab, labIndex) =>
  profiles.map((profile, profileIndex) => ({ lab, labIndex, profile, profileIndex })),
);

export const models = modelFixtures.map(({ lab, labIndex, profile, profileIndex }) => ({
  slug: `${lab.slug}-${profile.slug}`,
  name: `${lab.name} ${profile.name}`,
  description: profile.description,
  labSlug: lab.slug,
  type: profile.type,
  inputModalities: profile.inputModalities,
  outputModalities: [profile.type === "EMBEDDING" ? "EMBEDDING" : "TEXT"],
  capabilities: profile.capabilities,
  contextWindow: profile.contextWindow,
  maxOutputTokens: profile.maxOutputTokens,
  releasedOn: profile.slug === "starter" ? null : new Date(Date.UTC(2026, 3 + labIndex, 4 + profileIndex * 3)),
  isDemo: true,
})) satisfies Prisma.ModelCreateManyInput[];

export const offerings = modelFixtures.flatMap(({ lab, labIndex, profile }) => {
  const modelSlug = `${lab.slug}-${profile.slug}`;
  const freeStarter = labIndex === 0 && profile.slug === "starter";
  const primary = {
    modelSlug,
    providerSlug: providers[labIndex].slug,
    providerModelId: `${lab.slug}/${profile.slug}`,
    inputPrice: freeStarter ? "0" : profile.inputPrice,
    outputPrice: freeStarter ? "0" : profile.outputPrice,
    currency: "USD",
    billingUnit: "PER_MILLION_TOKENS",
    contextWindow: profile.contextWindow,
    isDemo: true,
  } as const;

  if (profile.slug !== "general" && profile.slug !== "compact") {
    return [primary];
  }

  const secondary = {
    ...primary,
    providerSlug: providers[(labIndex + 1) % providers.length].slug,
    inputPrice: profile.slug === "general" ? "0.650000" : "0.150000",
    outputPrice: profile.slug === "general" ? "3.400000" : null,
    contextWindow: profile.slug === "general" ? 96_000 : 32_768,
  };

  return [primary, secondary];
}) satisfies Prisma.ModelOfferingCreateManyInput[];

type DemoBenchmarkResult = {
  modelSlug: string;
  benchmarkSlug: (typeof benchmarks)[number]["slug"];
  value: number;
  sourceLabel: string;
  measuredOn: Date;
  isDemo: boolean;
};

export const results = modelFixtures.flatMap<DemoBenchmarkResult>(({ lab, labIndex, profile, profileIndex }) => {
  const modelSlug = `${lab.slug}-${profile.slug}`;
  const measured = {
    modelSlug,
    sourceLabel: "OneAtlas synthetic fixture",
    measuredOn: new Date("2026-10-01"),
    isDemo: true,
  };

  if (profile.type === "EMBEDDING") {
    return [{ ...measured, benchmarkSlug: benchmarks[2].slug, value: 78 + labIndex }];
  }

  if (profile.slug === "starter") {
    return [];
  }

  return [
    { ...measured, benchmarkSlug: benchmarks[0].slug, value: 90 - profileIndex * 3 + labIndex % 2 },
    { ...measured, benchmarkSlug: benchmarks[1].slug, value: 280 - profileIndex * 25 + labIndex * 5 },
  ];
}) satisfies Prisma.BenchmarkResultCreateManyInput[];
