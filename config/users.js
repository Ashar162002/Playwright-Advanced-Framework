const { raw } = require("./env.config");

// SauceDemo exposes a fixed set of public accounts, each surfacing a different
// UI behaviour. Passwords are shared and safe to keep as defaults.
const PASSWORD = raw.USER_PASSWORD || "secret_sauce";

const users = {
  standard: {
    username: raw.STANDARD_USERNAME || "standard_user",
    password: PASSWORD,
  },
  lockedOut: {
    username: raw.LOCKED_OUT_USERNAME || "locked_out_user",
    password: PASSWORD,
  },
  problem: {
    username: raw.PROBLEM_USERNAME || "problem_user",
    password: PASSWORD,
  },
  performanceGlitch: {
    username: raw.PERFORMANCE_USERNAME || "performance_glitch_user",
    password: PASSWORD,
  },
  invalid: {
    username: "invalid_user",
    password: "wrong_password",
  },
};

const get = (key) => {
  const user = users[key];
  if (!user) {
    throw new Error(`Unknown user "${key}". Available: ${Object.keys(users).join(", ")}`);
  }
  return user;
};

module.exports = { ...users, get };
