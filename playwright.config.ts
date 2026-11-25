import { defineConfig, devices } from "@playwright/test";

const existingServer = process.env.CATALOG_TEST_BASE_URL;
const localServer = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: existingServer || localServer, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: existingServer ? undefined : {
    command: "npm start -- --hostname 127.0.0.1 --port 3100",
    url: `${localServer}/api/models`,
    timeout: 60_000,
  },
});
