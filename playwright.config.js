require("module-alias/register");
require("dotenv").config();

const { defineConfig, devices } = require("@playwright/test");
const config = require("./config");

module.exports = defineConfig({
  testDir: "./tests",
  outputDir: "reports/test-results",
  globalTeardown: require.resolve("./global-teardown-healing.js"),
  fullyParallel: true,
  forbidOnly: config.env.CI,
  retries: config.env.CI ? 2 : 0,
  workers: config.testData.WORKERS,
  timeout: config.testData.TEST_TIMEOUT,
  expect: {
    timeout: config.testData.EXPECT_TIMEOUT,
  },
  reporter: [
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["junit", { outputFile: "reports/junit/results.xml" }],
    ["list"],
  ],
  use: {
    baseURL: config.urls.BASE_URL,
    headless: config.testData.HEADLESS,
    actionTimeout: config.testData.ACTION_TIMEOUT,
    navigationTimeout: config.testData.NAVIGATION_TIMEOUT,
    viewport: {
      width: config.testData.VIEWPORT_WIDTH,
      height: config.testData.VIEWPORT_HEIGHT,
    },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ].filter(p => !config.env.BROWSER || p.name === config.env.BROWSER),
});
