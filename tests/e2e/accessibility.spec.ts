import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const screens = [
  { path: "/", role: "heading", name: "30 models" },
  { path: "/models/cedar-research-general", role: "heading", name: "Provider offerings" },
  { path: "/compare?ids=cedar-research-general,cedar-research-embed", role: "table", name: "Model comparison by specification, price, and benchmark" },
  { path: "/rankings", role: "table", name: "Demo leaderboard" },
  { path: "/labs", role: "list", name: "Labs" },
  { path: "/labs/cedar-research", role: "heading", name: "Models and releases" },
  { path: "/providers", role: "list", name: "Providers" },
  { path: "/providers/relay-cloud", role: "heading", name: "Supported models" },
  { path: "/search?q=compact", role: "link", name: "Cedar Research Compact" },
  { path: "/missing-page", role: "heading", name: "Page not found" },
] as const;

test("catalog screens pass accessibility and viewport checks", async ({ page, isMobile }) => {
  test.setTimeout(90_000);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });

  for (const { path, role, name } of screens) {
    await test.step(path, async () => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(path === "/missing-page" ? 404 : 200);
      await expect(page.getByRole(role, { name, exact: true })).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect.soft(overflow, `Horizontal page overflow on ${path}`).toBe(false);

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect.soft(violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
      })), `Accessibility violations on ${path}`).toEqual([]);
    });
  }
});
