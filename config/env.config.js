const SUPPORTED_ENVIRONMENTS = ["local", "staging", "prod"];
const SUPPORTED_BROWSERS = ["chromium", "firefox", "webkit"];

const TEST_ENV = (process.env.TEST_ENV || "local").toLowerCase();

const BROWSER = process.env.BROWSER
  ? process.env.BROWSER.toLowerCase()
  : null;

if (BROWSER && !SUPPORTED_BROWSERS.includes(BROWSER)) {
  throw new Error(
    `Unsupported BROWSER "${BROWSER}". Expected one of: ${SUPPORTED_BROWSERS.join(", ")}`
  );
}

if (!SUPPORTED_ENVIRONMENTS.includes(TEST_ENV)) {
  throw new Error(
    `Unsupported TEST_ENV "${TEST_ENV}". Expected one of: ${SUPPORTED_ENVIRONMENTS.join(", ")}`
  );
}

const toBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  return !["false", "0", "no"].includes(String(value).toLowerCase());
};

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  TEST_ENV,
  BROWSER,
  CI: toBoolean(process.env.CI, false),
  raw: process.env,
  toBoolean,
  toNumber,
};
