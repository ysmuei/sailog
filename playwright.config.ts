import { defineConfig } from "@playwright/test";
const production = process.env.SAILOG_E2E_PREVIEW === "1";
const port = production ? 4173 : 5173;
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm${process.platform === "win32" ? ".cmd" : ""} run ${production ? "preview" : "dev"} -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: true,
  },
});
