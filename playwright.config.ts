import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : "html",
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm exec next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: process.env.LIVE_E2E
      ? {}
      : {
          NEXT_PUBLIC_PUSHER_KEY: "",
          NEXT_PUBLIC_PUSHER_CLUSTER: "",
          PUSHER_APP_ID: "",
          PUSHER_SECRET: "",
        },
  },
});
