import "server-only";

import type { CatalogQuery, RankingsQuery } from "../catalog/params";
import { Prisma, type BenchmarkResult, type ModelOffering } from "../generated/prisma/client";
import type { Capability } from "../generated/prisma/enums";
import { getDb } from "./db";

const organizationFields = { slug: true, name: true, isDemo: true } as const;
const rateFields = {
  inputPrice: true,
  outputPrice: true,
  currency: true,
  billingUnit: true,
  contextWindow: true,
  isDemo: true,
} as const satisfies Prisma.ModelOfferingSelect;

const offeringFields = {
  ...rateFields,
  provider: { select: organizationFields },
} as const satisfies Prisma.ModelOfferingSelect;

const relatedModelFields = {
  slug: true,
  name: true,
  description: true,
  type: true,
  releasedOn: true,
  isDemo: true,
} as const satisfies Prisma.ModelSelect;

const modelFields = {
  ...relatedModelFields,
  inputModalities: true,
  outputModalities: true,
  capabilities: true,
  contextWindow: true,
  maxOutputTokens: true,
} as const satisfies Prisma.ModelSelect;

const benchmarkFields = {
  slug: true,
  name: true,
  description: true,
  version: true,
  protocol: true,
  unit: true,
  category: true,
  direction: true,
} as const satisfies Prisma.BenchmarkSelect;

const benchmarkResultFields = {
  value: true,
  sourceLabel: true,
  sourceUrl: true,
  measuredOn: true,
  isDemo: true,
} as const satisfies Prisma.BenchmarkResultSelect;

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

function serializeBenchmarkResult<T extends Pick<BenchmarkResult, "value" | "measuredOn">>(result: T) {
  const { value, measuredOn, ...fields } = result;
  return { ...fields, value: value.toFixed(4), measuredOn: dateOnly(measuredOn) };
}

function serializeOffering<T extends Pick<ModelOffering, "inputPrice" | "outputPrice">>(offering: T) {
  const { inputPrice, outputPrice, ...fields } = offering;
  return {
    ...fields,
    inputPrice: inputPrice?.toFixed(6) ?? null,
    outputPrice: outputPrice?.toFixed(6) ?? null,
  };
}

const representativeOfferingOrder = Prisma.sql`
  candidate."inputPrice" IS NULL, (candidate."currency" = 'USD') DESC,
  candidate."billingUnit", candidate."currency",
  candidate."inputPrice" ASC NULLS LAST, candidate."providerSlug" ASC
`;

const sortColumns = {
  inputPrice: Prisma.sql`offering."inputPrice"`,
  outputPrice: Prisma.sql`offering."outputPrice"`,
  contextWindow: Prisma.sql`model."contextWindow"`,
  releasedOn: Prisma.sql`model."releasedOn"`,
} satisfies Record<CatalogQuery["sort"], Prisma.Sql>;

function modelFilters(query: CatalogQuery) {
  const conditions: Prisma.Sql[] = [];
  if (query.q) {
    conditions.push(Prisma.sql`(
      strpos(lower(model."name"), lower(${query.q})) > 0
      OR strpos(lower(model."description"), lower(${query.q})) > 0
    )`);
  }
  if (query.lab) {
    conditions.push(Prisma.sql`model."labSlug" = ${query.lab}`);
  }
  if (query.type) {
    conditions.push(Prisma.sql`model."type" = ${query.type}::"ModelType"`);
  }
  if (query.capability.length) {
    conditions.push(Prisma.sql`model."capabilities" @> ARRAY[${Prisma.join(query.capability)}]::"Capability"[]`);
  }
  if (query.provider) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ModelOffering" AS provider_match
      WHERE provider_match."modelSlug" = model."slug"
        AND provider_match."providerSlug" = ${query.provider}
    )`);
  }
  return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
}

function modelOrder(query: CatalogQuery) {
  const column = sortColumns[query.sort];
  const direction = query.direction === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const priceGroups = query.sort === "inputPrice" || query.sort === "outputPrice"
    ? Prisma.sql`
      (${column} IS NULL),
      CASE WHEN ${column} IS NOT NULL THEN offering."billingUnit" END,
      CASE WHEN ${column} IS NOT NULL THEN offering."currency" END,
    `
    : Prisma.empty;

  return Prisma.sql`${priceGroups} ${column} ${direction} NULLS LAST, model."slug" ASC`;
}

export function listModels(query: CatalogQuery) {
  const where = modelFilters(query);
  const provider = query.provider
    ? Prisma.sql`AND candidate."providerSlug" = ${query.provider}`
    : Prisma.empty;
  const offset = (query.page - 1) * query.pageSize;

  // Count, page keys, and record details read the same snapshot.
  return getDb().$transaction(async (db) => {
    const [{ total }] = await db.$queryRaw<{ total: number }[]>`
      SELECT count(*)::integer AS total FROM "Model" AS model ${where}
    `;
    const pagination = {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
    if (offset >= total) {
      return { models: [], pagination };
    }

    const page = await db.$queryRaw<{ slug: string; providerSlug: string | null }[]>`
      SELECT model."slug", offering."providerSlug"
      FROM "Model" AS model
      LEFT JOIN LATERAL (
        SELECT candidate."providerSlug", candidate."inputPrice", candidate."outputPrice",
               candidate."billingUnit", candidate."currency"
        FROM "ModelOffering" AS candidate
        WHERE candidate."modelSlug" = model."slug" ${provider}
        ORDER BY ${representativeOfferingOrder}
        LIMIT 1
      ) AS offering ON true
      ${where}
      ORDER BY ${modelOrder(query)}
      LIMIT ${query.pageSize} OFFSET ${offset}
    `;

    const selectedOfferings = page.flatMap(({ slug, providerSlug }) =>
      providerSlug === null ? [] : [{ modelSlug: slug, providerSlug }],
    );
    const models = await db.model.findMany({
      where: { slug: { in: page.map(({ slug }) => slug) } },
      select: {
        ...modelFields,
        lab: { select: organizationFields },
        offerings: { where: { OR: selectedOfferings }, select: offeringFields },
        _count: { select: { offerings: true } },
      },
    });
    const bySlug = new Map(models.map((model) => [model.slug, model]));

    return {
      models: page.map(({ slug }) => {
        const model = bySlug.get(slug);
        if (!model) {
          throw new Error("A model disappeared from its catalog snapshot.");
        }
        const { offerings, _count, ...summary } = model;
        return {
          ...summary,
          releasedOn: dateOnly(summary.releasedOn),
          providerCount: _count.offerings,
          offering: offerings[0] ? serializeOffering(offerings[0]) : null,
        };
      }),
      pagination,
    };
  }, { isolationLevel: "RepeatableRead" });
}

const modelDetailFields = {
  ...modelFields,
  sourceUrl: true,
  retrievedOn: true,
  lab: { select: { ...organizationFields, websiteUrl: true } },
  offerings: {
    orderBy: { providerSlug: "asc" },
    select: {
      ...offeringFields,
      provider: { select: { ...organizationFields, websiteUrl: true } },
      providerModelId: true,
      sourceUrl: true,
      retrievedOn: true,
    },
  },
  results: {
    orderBy: { benchmarkSlug: "asc" },
    select: {
      benchmark: { select: benchmarkFields },
      ...benchmarkResultFields,
    },
  },
} as const satisfies Prisma.ModelSelect;

function serializeModelDetail(model: Prisma.ModelGetPayload<{ select: typeof modelDetailFields }>) {
  const { results, offerings, ...details } = model;
  return {
    ...details,
    releasedOn: dateOnly(details.releasedOn),
    retrievedOn: dateOnly(details.retrievedOn),
    offerings: offerings.map((offering) => ({
      ...serializeOffering(offering),
      retrievedOn: dateOnly(offering.retrievedOn),
    })),
    benchmarks: results.map(serializeBenchmarkResult),
  };
}

export async function getModel(slug: string) {
  const model = await getDb().model.findUnique({ where: { slug }, select: modelDetailFields });
  return model ? serializeModelDetail(model) : null;
}

export type ComparisonModel = ModelDetail & { pricingProviderSlug: string | null };
export type ComparisonData = { models: ComparisonModel[] };

export async function getComparison(ids: string[]): Promise<ComparisonData | null> {
  const db = getDb();
  const [records, selectedOffers] = await db.$transaction([
    db.model.findMany({ where: { slug: { in: ids } }, select: modelDetailFields }),
    db.$queryRaw<{ modelSlug: string; providerSlug: string }[]>`
      SELECT DISTINCT ON (candidate."modelSlug") candidate."modelSlug", candidate."providerSlug"
      FROM "ModelOffering" AS candidate
      WHERE candidate."modelSlug" IN (${Prisma.join(ids)})
      ORDER BY candidate."modelSlug", ${representativeOfferingOrder}
    `,
  ], { isolationLevel: "RepeatableRead" });
  const recordsBySlug = new Map(records.map((record) => [record.slug, record]));
  const pricingProviders = new Map(selectedOffers.map(({ modelSlug, providerSlug }) => [modelSlug, providerSlug]));
  const models: ComparisonModel[] = [];
  for (const id of ids) {
    const model = recordsBySlug.get(id);
    if (!model) return null;
    models.push({ ...serializeModelDetail(model), pricingProviderSlug: pricingProviders.get(id) ?? null });
  }
  return { models };
}

export function listBenchmarks() {
  return getDb().benchmark.findMany({
    orderBy: [{ name: "asc" }, { version: "asc" }],
    select: benchmarkFields,
  });
}

export function getRankings(query: RankingsQuery) {
  return getDb().$transaction(async (tx) => {
    const benchmark = await tx.benchmark.findUnique({
      where: { slug: query.benchmark, category: query.category },
      select: benchmarkFields,
    });
    if (!benchmark) return null;

    const results = await tx.benchmarkResult.findMany({
      where: { benchmarkSlug: benchmark.slug, model: { type: benchmark.category } },
      orderBy: [{ value: benchmark.direction === "HIGHER_IS_BETTER" ? "desc" : "asc" }, { modelSlug: "asc" }],
      select: {
        ...benchmarkResultFields,
        model: { select: { ...organizationFields, lab: { select: organizationFields } } },
      },
    });
    const totalModels = await tx.model.count({ where: { type: benchmark.category } });

    function rankGroup(group: typeof results) {
      let previous: string | undefined;
      let rank = 0;
      return group.map((result, index) => {
        const entry = serializeBenchmarkResult(result);
        if (entry.value !== previous) rank = index + 1;
        previous = entry.value;
        return { ...entry, rank };
      });
    }

    return {
      benchmark,
      reported: rankGroup(results.filter((result) => !result.isDemo)),
      demo: rankGroup(results.filter((result) => result.isDemo)),
      unrankedCount: totalModels - results.length,
    };
  }, { isolationLevel: "RepeatableRead" });
}

export type BenchmarkDefinition = Awaited<ReturnType<typeof listBenchmarks>>[number];
export type RankingsData = NonNullable<Awaited<ReturnType<typeof getRankings>>>;

export async function getCatalogFilters() {
  const db = getDb();
  const [labs, providers, types, capabilities] = await db.$transaction([
    db.lab.findMany({
      where: { models: { some: {} } },
      orderBy: [{ name: "asc" }, { slug: "asc" }],
      select: organizationFields,
    }),
    db.provider.findMany({
      where: { offerings: { some: {} } },
      orderBy: [{ name: "asc" }, { slug: "asc" }],
      select: organizationFields,
    }),
    db.model.groupBy({ by: ["type"], orderBy: { type: "asc" } }),
    db.$queryRaw<{ capability: Capability }[]>`
      SELECT DISTINCT unnest("capabilities")::text AS capability
      FROM "Model"
      ORDER BY capability
    `,
  ], { isolationLevel: "RepeatableRead" });

  return {
    labs,
    providers,
    types: types.map(({ type }) => type),
    capabilities: capabilities.map(({ capability }) => capability),
  };
}

export type ModelSummary = Awaited<ReturnType<typeof listModels>>["models"][number];
export type ModelDetail = NonNullable<Awaited<ReturnType<typeof getModel>>>;
export type CatalogFilters = Awaited<ReturnType<typeof getCatalogFilters>>;

const directoryFields = {
  ...organizationFields,
  description: true,
  websiteUrl: true,
} as const;

export async function listLabs() {
  const labs = await getDb().lab.findMany({
    select: { ...directoryFields, _count: { select: { models: true } } },
    orderBy: [{ name: "asc" }, { slug: "asc" }],
  });
  return labs.map(({ _count, ...lab }) => ({ ...lab, modelCount: _count.models }));
}

export async function listProviders() {
  const providers = await getDb().provider.findMany({
    select: { ...directoryFields, _count: { select: { offerings: true } } },
    orderBy: [{ name: "asc" }, { slug: "asc" }],
  });
  return providers.map(({ _count, ...provider }) => ({ ...provider, modelCount: _count.offerings }));
}

export async function getLab(slug: string) {
  const lab = await getDb().lab.findUnique({
    where: { slug },
    select: {
      ...directoryFields,
      models: {
        select: relatedModelFields,
        orderBy: [{ releasedOn: { sort: "desc", nulls: "last" } }, { slug: "asc" }],
      },
    },
  });
  if (!lab) return null;

  return {
    ...lab,
    models: lab.models.map((model) => ({ ...model, releasedOn: dateOnly(model.releasedOn) })),
  };
}

export async function getProvider(slug: string) {
  const provider = await getDb().provider.findUnique({
    where: { slug },
    select: {
      ...directoryFields,
      offerings: {
        select: {
          ...rateFields,
          providerModelId: true,
          model: { select: { ...relatedModelFields, lab: { select: organizationFields } } },
        },
        orderBy: [{ model: { name: "asc" } }, { modelSlug: "asc" }],
      },
    },
  });
  if (!provider) return null;

  return {
    ...provider,
    offerings: provider.offerings.map(({ model, ...offering }) => ({
      ...serializeOffering(offering),
      model: { ...model, releasedOn: dateOnly(model.releasedOn) },
    })),
  };
}

export type SearchHit = {
  slug: string;
  name: string;
  description: string;
  isDemo: boolean;
};

export async function searchCatalog(query: string) {
  const db = getDb();
  const nameMatch = Prisma.sql`strpos(lower("name"), lower(${query}))`;

  // Callers supply static table identifiers. The search term is bound as a parameter.
  function matches(table: Prisma.Sql) {
    return db.$queryRaw<SearchHit[]>`
      SELECT "slug", "name", "description", "isDemo"
      FROM ${table}
      WHERE ${nameMatch} > 0 OR strpos(lower("description"), lower(${query})) > 0
      ORDER BY (lower("name") = lower(${query})) DESC,
               (${nameMatch} = 1) DESC,
               "name" ASC, "slug" ASC
      LIMIT 5
    `;
  }

  const [models, labs, providers] = await db.$transaction([
    matches(Prisma.sql`"Model"`),
    matches(Prisma.sql`"Lab"`),
    matches(Prisma.sql`"Provider"`),
  ], { isolationLevel: "RepeatableRead" });

  return { models, labs, providers };
}

export type DirectoryEntry = Awaited<ReturnType<typeof listLabs>>[number];
export type LabDetail = NonNullable<Awaited<ReturnType<typeof getLab>>>;
export type ProviderDetail = NonNullable<Awaited<ReturnType<typeof getProvider>>>;
export type GlobalSearchResults = Awaited<ReturnType<typeof searchCatalog>>;
