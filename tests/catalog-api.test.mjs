import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";
import { URL } from "node:url";

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
