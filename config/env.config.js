const SUPPORTED_ENVIRONMENTS = ["local", "staging", "prod"];

const TEST_ENV = (process.env.TEST_ENV || "local").toLowerCase();

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
  CI: toBoolean(process.env.CI, false),
  raw: process.env,
  toBoolean,
  toNumber,
};
