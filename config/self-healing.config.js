const { raw, toBoolean } = require("./env.config");

const SUPPORTED_MODES = ["algorithmic", "ai", "both"];

const parseThreshold = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 0), 1);
};

const mode = (raw.SELF_HEALING_MODE || "both").toLowerCase();

// AI healing reuses whichever provider key is present; an explicit
// SELF_HEALING_API_KEY wins so a dedicated key can be scoped to the suite.
const apiKey =
  raw.SELF_HEALING_API_KEY || raw.OPENAI_API_KEY || raw.ANTHROPIC_API_KEY || null;

module.exports = {
  enabled: toBoolean(raw.SELF_HEALING_ENABLED, true),
  mode: SUPPORTED_MODES.includes(mode) ? mode : "both",
  confidenceThreshold: parseThreshold(raw.SELF_HEALING_CONFIDENCE_THRESHOLD, 0.75),
  aiProvider: (raw.SELF_HEALING_AI_PROVIDER || "openai").toLowerCase(),
  aiModel: raw.SELF_HEALING_AI_MODEL || null,
  apiKey,
  reportPath: raw.SELF_HEALING_REPORT_PATH || "reports/healing",
  // SauceDemo exposes automation hooks via `data-test`. Kept configurable so the
  // engine can be pointed at a different attribute without code changes.
  testAttribute: raw.SELF_HEALING_TEST_ATTRIBUTE || "data-test",
};
