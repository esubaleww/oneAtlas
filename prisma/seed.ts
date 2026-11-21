import "dotenv/config";
import assert from "node:assert/strict";
import { createDbClient } from "../src/server/db-client";
import { benchmarks, labs, models, offerings, providers, results } from "./seed-data";

function assertUnique(keys: string[], description: string) {
  assert.equal(new Set(keys).size, keys.length, `Duplicate ${description} in seed data`);
}

function validateSeed() {
  const catalogEntries = [...labs, ...models, ...providers, ...benchmarks];
  for (const entry of catalogEntries) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug), `Invalid slug ${entry.slug}`);
    assert(entry.name.trim() && entry.description.trim(), `Incomplete entry ${entry.slug}`);
  }

  assertUnique(labs.map(({ slug }) => slug), "lab slug");
  assertUnique(models.map(({ slug }) => slug), "model slug");
  assertUnique(providers.map(({ slug }) => slug), "provider slug");
  assertUnique(benchmarks.map(({ slug }) => slug), "benchmark slug");
  assertUnique(offerings.map(({ modelSlug, providerSlug }) => `${modelSlug}/${providerSlug}`), "offering");
  assertUnique(results.map(({ modelSlug, benchmarkSlug }) => `${modelSlug}/${benchmarkSlug}`), "benchmark result");

  const labSlugs = new Set(labs.map(({ slug }) => slug));
  const providerSlugs = new Set(providers.map(({ slug }) => slug));
  const modelsBySlug = new Map(models.map((model) => [model.slug, model]));
  const benchmarksBySlug = new Map<string, (typeof benchmarks)[number]>(
    benchmarks.map((benchmark) => [benchmark.slug, benchmark]),
  );
  const offeredSlugs = new Set(offerings.map(({ modelSlug }) => modelSlug));

  for (const model of models) {
    assert(labSlugs.has(model.labSlug), `Unknown lab for ${model.slug}`);
    assert(offeredSlugs.has(model.slug), `Missing offering for ${model.slug}`);
    for (const tokens of [model.contextWindow, model.maxOutputTokens]) {
      assert(tokens === null || (Number.isInteger(tokens) && tokens > 0), `Invalid token limit for ${model.slug}`);
    }
    assert(model.releasedOn === null || Number.isFinite(model.releasedOn.getTime()), `Invalid release date for ${model.slug}`);
    assert.equal(model.inputModalities.includes("IMAGE"), model.capabilities.includes("VISION"), `Invalid vision metadata for ${model.slug}`);
  }

  for (const offering of offerings) {
    const model = modelsBySlug.get(offering.modelSlug);
    assert(model && providerSlugs.has(offering.providerSlug), `Unknown model or provider for ${offering.modelSlug}`);
    assert.equal(offering.currency, "USD", "Demo prices use USD");
    for (const price of [offering.inputPrice, offering.outputPrice]) {
      assert(price === null || /^\d{1,6}(\.\d{1,6})?$/.test(price), `Invalid price for ${offering.modelSlug}`);
    }
    if (model.type === "EMBEDDING") {
      assert.equal(offering.outputPrice, null, `Unexpected output price for ${offering.modelSlug}`);
    }
    if (offering.contextWindow !== null && model.contextWindow !== null) {
      assert(offering.contextWindow > 0 && offering.contextWindow <= model.contextWindow, `Invalid offering limit for ${offering.modelSlug}`);
    }
  }

  for (const result of results) {
    const model = modelsBySlug.get(result.modelSlug);
    const benchmark = benchmarksBySlug.get(result.benchmarkSlug);
    assert(model && benchmark?.category === model.type, `Incompatible benchmark for ${result.modelSlug}`);
    assert(Number.isFinite(result.value) && result.value >= 0, `Invalid score for ${result.modelSlug}`);
    assert(benchmark.unit !== "%" || result.value <= 100, `Invalid percentage for ${result.modelSlug}`);
    assert(model.releasedOn === null || result.measuredOn >= model.releasedOn, `Score predates ${result.modelSlug}`);
  }
}

async function seed() {
  validateSeed();
  const db = createDbClient(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

  try {
    const inserted = await db.$transaction([
      db.lab.createMany({ data: labs, skipDuplicates: true }),
      db.provider.createMany({ data: providers, skipDuplicates: true }),
      db.model.createMany({ data: models, skipDuplicates: true }),
      db.modelOffering.createMany({ data: offerings, skipDuplicates: true }),
      db.benchmark.createMany({ data: [...benchmarks], skipDuplicates: true }),
      db.benchmarkResult.createMany({ data: results, skipDuplicates: true }),
    ]);
    const [labCount, providerCount, modelCount, offeringCount, benchmarkCount, resultCount] = inserted.map(({ count }) => count);
    console.log("Inserted demo records", {
      labs: labCount,
      providers: providerCount,
      models: modelCount,
      offerings: offeringCount,
      benchmarks: benchmarkCount,
      benchmarkResults: resultCount,
    });
  } finally {
    await db.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
