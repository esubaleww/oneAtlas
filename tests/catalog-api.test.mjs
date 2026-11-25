import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";
import { URL, URLSearchParams } from "node:url";

const baseUrl = process.env.CATALOG_TEST_BASE_URL ?? "http://localhost:3000";

async function request(path, status = 200) {
  const response = await globalThis.fetch(new URL(path, baseUrl));
  const body = await response.json();
  assert.equal(response.status, status, `${path}: ${JSON.stringify(body)}`);
  return body;
}

test("paginates in a stable order and retains the total on empty pages", async () => {
  const first = (await request("/api/models?pageSize=5")).data;
  const second = (await request("/api/models?pageSize=5&page=2")).data;
  const full = (await request("/api/models?pageSize=50")).data;
  const beyond = (await request("/api/models?pageSize=5&page=10000")).data;

  assert.deepEqual(first.pagination, { page: 1, pageSize: 5, total: 30, totalPages: 6 });
  assert.deepEqual([...first.models, ...second.models], full.models.slice(0, 10));
  assert.equal(new Set(full.models.map(({ slug }) => slug)).size, 30);
  assert.equal(full.models.at(-1).releasedOn, null);
  assert.deepEqual(beyond.models, []);
  assert.equal(beyond.pagination.total, full.pagination.total);
});

test("searches names and descriptions case-insensitively", async () => {
  const name = (await request("/api/models?q=%20cEdAr%20RESEARCH%20")).data;
  const description = (await request("/api/models?q=tool%20CALLS")).data;
  const noMatches = (await request("/api/models?q=%25&lab=cedar-research")).data;
  assert.equal(name.pagination.total, 6);
  assert.equal(description.pagination.total, 5);
  assert(description.models.every((model) => model.slug.endsWith("-general")));
  assert.deepEqual(noMatches, {
    models: [],
    pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
  });
});

test("combines filters and uses both rates from the matching provider", async () => {
  const filters = "lab=cedar-research&type=TEXT_GENERATION&capability=TOOL_CALLING&capability=MULTILINGUAL";
  const unfiltered = (await request(`/api/models?${filters}`)).data;
  const filtered = (await request(`/api/models?${filters}&provider=relay-cloud&sort=inputPrice`)).data;
  const incompatible = (await request(`/api/models?${filters}&capability=VISION`)).data;

  assert.equal(unfiltered.pagination.total, 1);
  assert.equal(filtered.pagination.total, 1);
  const [general] = filtered.models;
  assert.equal(general.slug, "cedar-research-general");
  assert.equal(general.providerCount, 2);
  assert.equal(general.offering.provider.slug, "relay-cloud");
  assert.equal(general.offering.inputPrice, "0.800000");
  assert.equal(general.offering.outputPrice, "3.200000");
  assert.equal(general.offering.currency, "USD");
  assert.equal(general.offering.billingUnit, "PER_MILLION_TOKENS");
  assert.equal(unfiltered.models[0].offering.provider.slug, "canopy-inference");
  assert.equal(unfiltered.models[0].offering.inputPrice, "0.650000");
  assert.equal(unfiltered.models[0].offering.outputPrice, "3.400000");
  assert.equal(incompatible.pagination.total, 0);
});

test("sorts matching-provider prices and places unknown values last in both directions", async () => {
  for (const sort of ["inputPrice", "outputPrice"]) {
    const free = (await request(`/api/models?provider=relay-cloud&sort=${sort}&direction=asc&pageSize=1`)).data.models[0];
    const ascending = (await request(`/api/models?provider=canopy-inference&sort=${sort}&direction=asc`)).data.models;
    const descending = (await request(`/api/models?provider=canopy-inference&sort=${sort}&direction=desc`)).data.models;
    assert(ascending.every(({ offering }) => offering.provider.slug === "canopy-inference"));
    assert.equal(free.offering[sort], "0.000000");

    const priceValues = ascending.map(({ offering }) => offering[sort]).filter((price) => price !== null);
    const unknowns = ascending.filter(({ offering }) => offering[sort] === null);
    assert(unknowns.length > 0);
    assert.deepEqual(priceValues, priceValues.toSorted((a, b) => Number(a) - Number(b)));
    assert.deepEqual(ascending.slice(-unknowns.length), unknowns);
    assert.deepEqual(descending.slice(-unknowns.length), unknowns);
    assert.deepEqual(
      descending.slice(0, -unknowns.length).map(({ offering }) => offering[sort]),
      priceValues.toReversed(),
    );
  }

  const compact = (await request("/api/models?q=compact&sort=inputPrice&direction=asc")).data.models;
  assert.equal(compact.length, 5);
  assert(compact.every(({ offering }) => offering.inputPrice === "0.120000"));
  assert.deepEqual(compact.map(({ slug }) => slug), compact.map(({ slug }) => slug).toSorted());

  const context = (await request("/api/models?sort=contextWindow&direction=asc")).data.models;
  assert.equal(context[0].contextWindow, 8192);
});

test("returns active catalog filters from PostgreSQL", async () => {
  const { data } = await request("/api/catalog-filters");
  assert(data.labs.some(({ slug, name }) => slug === "cedar-research" && name === "Cedar Research"));
  assert(data.providers.some(({ slug }) => slug === "relay-cloud"));
  assert.deepEqual(new Set(data.types), new Set(["TEXT_GENERATION", "EMBEDDING"]));
  assert(data.capabilities.includes("VISION"));
  assert(data.capabilities.includes("MULTILINGUAL"));
});

test("returns a model with provider offerings, benchmark metadata, and provenance", async () => {
  const { data: model } = await request("/api/models/cedar-research-general");
  const { data: starter } = await request("/api/models/tidal-intelligence-starter");
  assert.equal(model.lab.slug, "cedar-research");
  assert.match(model.releasedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(model.isDemo, true);
  assert.equal(model.offerings.length, 2);
  assert.equal(model.benchmarks.length, 2);
  assert(model.benchmarks.every(({ benchmark, value, sourceLabel, isDemo }) =>
    benchmark.version && benchmark.protocol && /^\d+\.\d{4}$/.test(value) && sourceLabel && isDemo,
  ));
  assert.equal(starter.releasedOn, null);
  assert.equal(starter.offerings[0].inputPrice, null);
  assert.deepEqual(starter.benchmarks, []);
});

test("returns structured errors for invalid parameters and missing models", async () => {
  for (const query of [
    "sort=invalid", "direction=up", "page=0", "pageSize=51", "page=1.5", "page=10001",
    "page=1&page=2", "type=unknown", "capability=unknown", "lab=Invalid%20Slug", "foo=bar",
    "q=%00", `q=${"a".repeat(101)}`,
  ]) {
    const { error } = await request(`/api/models?${query}`, 400);
    assert.equal(error.code, "INVALID_REQUEST");
    assert(error.issues.length > 0);
  }

  assert.equal((await request("/api/models/Invalid", 400)).error.code, "INVALID_REQUEST");
  assert.equal((await request("/api/catalog-filters?foo=bar", 400)).error.code, "INVALID_REQUEST");
  assert.equal((await request("/api/models/missing-model", 404)).error.code, "NOT_FOUND");
});

test("renders model details and sends HTTP 404 for an unknown model page", async () => {
  const valid = await globalThis.fetch(new URL("/models/cedar-research-general", baseUrl));
  assert.equal(valid.status, 200);
  const html = await valid.text();
  assert.match(html, /Cedar Research General/);
  assert.match(html, /Provider offerings/);
  assert.match(html, /Benchmarks/);

  const missing = await globalThis.fetch(new URL("/models/missing-model", baseUrl));
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Model not found/);
});

test("serves separate lab and provider directories with the corresponding model counts", async () => {
  const { data: labs } = await request("/api/labs");
  const { data: providers } = await request("/api/providers");
  assert.equal(labs.length, 5);
  assert.equal(providers.length, 5);
  assert.equal(labs.find(({ slug }) => slug === "cedar-research").modelCount, 6);
  assert.equal(providers.find(({ slug }) => slug === "relay-cloud").modelCount, 8);
  assert(!labs.some(({ slug }) => slug === "relay-cloud"));
});

test("returns lab releases and prices from the requested provider", async () => {
  const { data: lab } = await request("/api/labs/cedar-research");
  assert.equal(lab.name, "Cedar Research");
  assert.equal(lab.models.length, 6);
  assert(lab.models.every(({ slug }) => slug.startsWith("cedar-research-")));
  const releaseDates = lab.models.flatMap(({ releasedOn }) => releasedOn ? [releasedOn] : []);
  assert.deepEqual(releaseDates, releaseDates.toSorted().reverse());
  assert.equal(lab.models.at(-1).releasedOn, null);

  const { data: provider } = await request("/api/providers/relay-cloud");
  const general = provider.offerings.find(({ model }) => model.slug === "cedar-research-general");
  assert.equal(general.model.lab.slug, "cedar-research");
  assert.equal(general.inputPrice, "0.800000");
  assert.equal(general.outputPrice, "3.200000");
  assert.equal(general.currency, "USD");
  assert.equal(general.billingUnit, "PER_MILLION_TOKENS");

  for (const path of ["/api/labs/missing-lab", "/api/providers/missing-provider"]) {
    assert.equal((await request(path, 404)).error.code, "NOT_FOUND");
  }
  assert.equal((await request("/api/labs/Invalid", 400)).error.code, "INVALID_REQUEST");

  for (const [path, heading] of [
    ["/labs/cedar-research", /Models and releases/],
    ["/providers/relay-cloud", /Supported models/],
  ]) {
    const page = await globalThis.fetch(new URL(path, baseUrl));
    assert.equal(page.status, 200);
    assert.match(await page.text(), heading);
  }
  for (const [path, heading] of [
    ["/labs/missing-lab", /Lab not found/],
    ["/providers/missing-provider", /Provider not found/],
  ]) {
    const missing = await globalThis.fetch(new URL(path, baseUrl));
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), heading);
  }
});

test("searches models, labs, and providers with bounded literal matches", async () => {
  const { data: cedar } = await request("/api/search?q=%20CeDaR%20");
  assert.equal(cedar.models.length, 5);
  assert(cedar.models.every(({ slug }) => slug.startsWith("cedar-research-")));
  assert.equal(cedar.labs[0].slug, "cedar-research");
  const { data: relay } = await request("/api/search?q=relay%20cloud");
  assert.equal(relay.providers[0].slug, "relay-cloud");
  const { data: descriptions } = await request("/api/search?q=tool%20calls");
  assert(descriptions.models.some(({ slug }) => slug === "cedar-research-general"));
  const { data: literal } = await request("/api/search?q=%25");
  assert.deepEqual(literal, { models: [], labs: [], providers: [] });
  for (const path of [
    "/api/search", "/api/search?q=%20", "/api/search?q=a&q=b",
    "/api/search?q=relay&extra=1", "/api/search?q=%00", `/api/search?q=${"a".repeat(101)}`,
  ]) {
    assert.equal((await request(path, 400)).error.code, "INVALID_REQUEST");
  }
});

test("compares two to four models in URL order with a consistent pricing provider", async () => {
  const ids = ["cedar-research-embed", "tidal-intelligence-starter", "cedar-research-general", "cedar-research-starter"];
  const { data: pair } = await request(`/api/compare?${new URLSearchParams({ ids: ids.slice(0, 2).join(",") })}`);
  assert.deepEqual(pair.models.map(({ slug }) => slug), ids.slice(0, 2));

  const { data: comparison } = await request(`/api/compare?ids=${ids.join(",")}`);
  assert.deepEqual(comparison.models.map(({ slug }) => slug), ids);
  const [embedding, unknown, general, free] = comparison.models;
  const selectedOffering = (model) => model.offerings.find(({ provider }) => provider.slug === model.pricingProviderSlug);

  assert.equal(general.pricingProviderSlug, "canopy-inference");
  assert.equal(selectedOffering(general).inputPrice, "0.650000");
  assert.equal(selectedOffering(general).outputPrice, "3.400000");
  assert.equal(selectedOffering(general).currency, "USD");
  assert.equal(selectedOffering(general).billingUnit, "PER_MILLION_TOKENS");
  assert.equal(general.offerings.find(({ provider }) => provider.slug === "relay-cloud").outputPrice, "3.200000");
  assert(general.benchmarks.every(({ benchmark, isDemo }) => benchmark.version && isDemo));
  assert.equal(general.benchmarks.length, 2);

  assert.equal(embedding.type, "EMBEDDING");
  assert.equal(selectedOffering(embedding).outputPrice, null);
  assert.equal(selectedOffering(unknown).inputPrice, null);
  assert.equal(unknown.contextWindow, null);
  assert.deepEqual(unknown.benchmarks, []);
  assert.equal(selectedOffering(free).inputPrice, "0.000000");
  assert.equal(selectedOffering(free).outputPrice, "0.000000");
});

test("rejects invalid comparison selections and reports unavailable models", async () => {
  for (const query of ["", "ids=", "ids=cedar-research-general", "ids=a,b,c,d,e", "ids=a,a", "ids=Invalid,a", "ids=a&ids=b", "ids=a,b&foo=bar"]) {
    const { error } = await request(`/api/compare?${query}`, 400);
    assert.equal(error.code, "INVALID_REQUEST");
    assert(error.issues.length > 0);
  }
  assert.equal((await request("/api/compare?ids=cedar-research-general,missing-model", 404)).error.code, "NOT_FOUND");
});

test("lists versioned benchmark definitions with category, unit, and scoring direction", async () => {
  const { data: benchmarks } = await request("/api/benchmarks");
  assert.deepEqual(benchmarks.map(({ slug, category, unit, direction }) => [slug, category, unit, direction]), [
    ["demo-first-token-latency-v1", "TEXT_GENERATION", "ms", "LOWER_IS_BETTER"],
    ["demo-instruction-following-v1", "TEXT_GENERATION", "%", "HIGHER_IS_BETTER"],
    ["demo-retrieval-recall-v1", "EMBEDDING", "%", "HIGHER_IS_BETTER"],
  ]);
  assert(benchmarks.every(({ description, protocol, version }) => description && protocol && version === "1.0"));
});

test("ranks in the benchmark's direction, keeps decimal ties, and excludes models without scores", async () => {
  const { data: scores } = await request("/api/rankings?benchmark=demo-instruction-following-v1&category=TEXT_GENERATION");
  const { data: latency } = await request("/api/rankings?benchmark=demo-first-token-latency-v1");
  const { data: recall } = await request("/api/rankings?benchmark=demo-retrieval-recall-v1&category=EMBEDDING");

  for (const { reported, demo, unrankedCount } of [scores, latency]) {
    assert.deepEqual(reported, []);
    assert.equal(demo.length, 20);
    assert.equal(unrankedCount, 5);
    assert(demo.every(({ isDemo, model, sourceLabel, measuredOn }) =>
      isDemo && model.isDemo && model.lab.name && !model.slug.endsWith("-starter") &&
      sourceLabel === "OneAtlas synthetic fixture" && measuredOn === "2026-10-01",
    ));
  }

  const values = ({ demo }) => demo.map(({ value }) => Number(value));
  assert.deepEqual(values(scores), values(scores).toSorted((a, b) => b - a));
  assert.deepEqual(values(latency), values(latency).toSorted((a, b) => a - b));
  assert.deepEqual(scores.demo.slice(0, 5).map(({ rank, value }) => [rank, value]), [
    [1, "91.0000"], [1, "91.0000"], [3, "90.0000"], [3, "90.0000"], [3, "90.0000"],
  ]);
  const tiedSlugs = scores.demo.slice(2, 5).map(({ model }) => model.slug);
  assert.deepEqual(tiedSlugs, tiedSlugs.toSorted());
  assert.equal(latency.demo[0].value, "205.0000");
  assert.equal(latency.demo[0].model.slug, "cedar-research-compact");
  assert.equal(recall.benchmark.category, "EMBEDDING");
  assert.equal(recall.demo.length, 5);
  assert.equal(recall.unrankedCount, 0);
  assert(recall.demo.every(({ model }) => model.slug.endsWith("-embed")));
});

test("rejects invalid ranking parameters and missing benchmark selections", async () => {
  const benchmark = "demo-instruction-following-v1";
  for (const query of ["", "benchmark=Invalid", `benchmark=${benchmark}&category=VISION`, `benchmark=${benchmark}&benchmark=${benchmark}`, `benchmark=${benchmark}&category=TEXT_GENERATION&category=EMBEDDING`, `benchmark=${benchmark}&extra=1`]) {
    const { error } = await request(`/api/rankings?${query}`, 400);
    assert.equal(error.code, "INVALID_REQUEST");
    assert(error.issues.length > 0);
  }
  assert.equal((await request("/api/benchmarks?category=TEXT_GENERATION", 400)).error.code, "INVALID_REQUEST");
  assert.equal((await request("/api/rankings?benchmark=missing-test", 404)).error.code, "NOT_FOUND");
  assert.equal((await request(`/api/rankings?benchmark=${benchmark}&category=EMBEDDING`, 404)).error.code, "NOT_FOUND");
});
