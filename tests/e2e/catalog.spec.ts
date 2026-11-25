import { expect, test } from "@playwright/test";

test("searches with the keyboard and returns from model details with filters intact", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "30 models", exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  const search = page.getByRole("searchbox", { name: "Search models", exact: true });
  await search.fill("Cedar Research");
  await search.press("Enter");
  await expect(page.getByRole("heading", { name: "6 models", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Lab", exact: true }).selectOption("cedar-research");
  await page.getByRole("combobox", { name: "Provider", exact: true }).selectOption("relay-cloud");
  await page.getByRole("button", { name: "Tool calling", exact: true }).click();
  await page.getByRole("button", { name: "Multilingual", exact: true }).click();
  await page.getByRole("combobox", { name: "Sort by" }).selectOption("inputPrice:asc");
  await expect(page.getByRole("heading", { name: "1 model", exact: true })).toBeVisible();
  const filteredUrl = page.url();

  await page.getByRole("link", { name: "Cedar Research General", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cedar Research General", exact: true })).toBeVisible();
  const offerings = page.getByRole("region", { name: "Provider offerings" });
  await expect(offerings).toContainText("Relay Cloud");
  await expect(offerings).toContainText("3.20");
  await expect(page.getByRole("heading", { name: "Benchmarks", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Back to models" }).click();
  await expect(page).toHaveURL(filteredUrl);
  await expect(page.getByRole("heading", { name: "1 model", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tool calling", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("compares models, replaces a selection, and reopens the shared URL", async ({ page, isMobile }) => {
  await page.goto("/?lab=cedar-research");
  await page.getByRole("button", { name: "Compare Cedar Research General", exact: true }).click();
  const tray = page.getByRole("complementary", { name: "Comparison tray" });
  await expect(tray.getByRole("button", { name: "Compare (1)", exact: true })).toBeDisabled();

  await page.getByRole("link", { name: "Cedar Research Starter", exact: true }).click();
  await page.getByRole("button", { name: "Compare Cedar Research Starter", exact: true }).click();
  await tray.getByRole("link", { name: "Compare (2)", exact: true }).click();
  const table = page.getByRole("table", { name: /Model comparison/ });
  await expect(table.getByRole("row", { name: /^Output price/ })).toContainText("Free");
  await expect(table.getByRole("row", { name: /^Context window/ })).toContainText("Unknown");

  await page.getByRole("button", { name: "Remove Cedar Research Starter", exact: true }).click();
  const picker = page.getByRole("searchbox", { name: "Find a model by name" });
  await picker.fill("Cedar Research Embed");
  await picker.press("Enter");
  await page.getByRole("button", { name: "Add Cedar Research Embed", exact: true }).click();
  const selected = "cedar-research-general,cedar-research-embed";
  await expect(page).toHaveURL((url) => url.pathname === "/compare" && url.searchParams.get("ids") === selected);
  await page.reload();
  await expect(table.getByRole("columnheader").getByRole("link")).toHaveText(["Cedar Research General", "Cedar Research Embed"]);
  await expect(table.getByRole("row", { name: /^Output price/ })).toContainText("N/A");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Compare", exact: true }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("ids") === selected);
  await expect(table).toBeVisible();

  if (isMobile) {
    const scrollRegion = page.getByRole("region", { name: "Scrollable model comparison" });
    await scrollRegion.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => scrollRegion.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  }
});

test("switches ranking benchmarks and categories while retaining ties and URL history", async ({ page }) => {
  await page.goto("/rankings?benchmark=demo-first-token-latency-v1");
  const board = page.getByRole("table", { name: "Demo leaderboard" });
  await expect(page.getByText("Lower is better", { exact: true })).toBeVisible();
  await expect(board.getByRole("row").nth(1)).toContainText("205 ms");

  const benchmark = page.getByRole("combobox", { name: "Benchmark", exact: true });
  await benchmark.selectOption("demo-instruction-following-v1");
  await expect(page.getByText("Higher is better", { exact: true })).toBeVisible();
  for (const [index, rank] of ["1", "1", "3"].entries()) {
    await expect(board.getByRole("row").nth(index + 1).getByRole("cell").first()).toHaveText(rank);
  }

  const category = page.getByRole("combobox", { name: "Model category" });
  await category.selectOption("EMBEDDING");
  await expect(page.getByRole("heading", { name: "Demo retrieval recall at 10" })).toBeVisible();
  await expect(board.getByRole("row")).toHaveCount(6);
  await page.reload();
  await expect(category).toHaveValue("EMBEDDING");
  await page.goBack();
  await expect(benchmark).toHaveValue("demo-instruction-following-v1");
});

test("finds labs through global search and browses provider offerings", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search models, labs, and providers" });
  await search.fill("Cedar Research");
  await search.press("Enter");
  await expect(page.getByRole("heading", { name: "Search catalog" })).toBeVisible();
  await page.getByRole("link", { name: "Cedar Research", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Models and releases" })).toBeVisible();
  await page.getByRole("link", { name: "Open in explorer" }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("lab") === "cedar-research");
  await expect(page.getByRole("heading", { name: "6 models", exact: true })).toBeVisible();

  const mainNav = page.getByRole("navigation", { name: "Main navigation" });
  await mainNav.getByRole("link", { name: "Providers", exact: true }).click();
  await page.getByRole("link", { name: /^Relay Cloud/ }).click();
  await expect(page.getByRole("heading", { name: "Supported models" })).toBeVisible();
  const offering = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Cedar Research General", exact: true }) });
  await expect(offering).toContainText("0.80");
  await expect(offering).toContainText("USD / 1M tokens");
  await offering.getByRole("link", { name: "Cedar Research General", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cedar Research General", exact: true })).toBeVisible();
});

test("retries a failed catalog request and recovers from an empty search", async ({ page }) => {
  await page.route("**/api/models", (route) => route.fulfill({
    status: 503,
    json: { error: { code: "SERVICE_UNAVAILABLE" } },
  }), { times: 1 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Catalog unavailable" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "30 models", exact: true })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search models", exact: true });
  await search.fill("no-matching-model-fixture");
  await search.press("Enter");
  await expect(page.getByRole("heading", { name: "No matching models" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(page.getByRole("heading", { name: "30 models", exact: true })).toBeVisible();
});
