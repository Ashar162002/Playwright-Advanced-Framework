# Playwright Advanced Framework

A modular, production-grade Playwright automation framework built on the Page Object Model. It targets the [SauceDemo](https://www.saucedemo.com) e-commerce application and is structured to grow into a self-healing, agent-driven test platform.

The repository consists of:

| Scope                                              | Status |
|----------------------------------------------------| ------ |
| Core Playwright POM framework                      | ✅ Done |
| Four-tier AI self-healing locator system           | ✅ Done |
| Playwright MCP & CLI (agentic testing) integration | ✅ Done |

## Architecture

The framework separates responsibilities into clear layers. Tests read like specifications; anything mechanical lives behind a page object.

```
Playwright-Advanced-Framework/
├── config/          # Environment, URLs, users, test data, self-healing config
├── locators/        # Selectors only — one module per screen, no logic
├── pages/           # Page objects: behaviour and assertions per screen
├── utils/           # BasePage, self-healing engine, healing report, helpers
├── fixtures/        # Playwright fixtures that inject page objects into tests
├── tests/
│   ├── smoke/       # Fast, critical-path checks
│   ├── regression/  # Feature-level coverage
│   ├── e2e/         # Full user journeys
│   └── healing/     # Self-healing demonstrations (renamed selectors)
├── .cursor/mcp.json # Playwright MCP server config for agentic workflows
└── playwright.config.js
```

### Design principles

- **Single responsibility per layer.** Locators never contain logic, page objects never contain raw selectors, and tests never touch the `page` object directly.
- **One resolution seam.** Every interaction funnels through `BasePage.locator()` and its action helpers. This is the deliberate injection point for the Phase 2 self-healing engine — page objects and tests will not change when it lands.
- **Config over hard-coding.** URLs, credentials, timeouts, and test data come from the `config` layer, overridable via environment variables.
- **Clean imports.** Module aliases (`@config`, `@pages`, `@locators`, `@utils`, `@fixtures`) keep requires readable regardless of folder depth.

## Getting started

Requirements: Node.js 18+ (tested on 22).

```bash
npm install          # installs dependencies and the Chromium browser
cp .env.example .env # optional — sensible defaults work out of the box
```

## Running tests

```bash
npm test               # run the full suite (all projects)
npm run test:smoke     # smoke tests only
npm run test:regression
npm run test:e2e
npm run test:healing   # self-healing demonstrations
npm run test:headed    # watch the browser
npm run test:ui        # Playwright UI mode
npm run report         # open the last HTML report
```

Filter by tag using Playwright's grep:

```bash
npx playwright test --grep @smoke
npx playwright test --project=chromium
```

## Configuration

All configuration is centralised under `config/` and can be overridden through a `.env` file (see `.env.example`).

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `TEST_ENV` | Target environment (`local`/`staging`/`prod`) | `local` |
| `BASE_URL` | Application under test | `https://www.saucedemo.com` |
| `HEADLESS` | Run browsers headless | `true` |
| `WORKERS` | Parallel worker count | `4` |
| `USER_PASSWORD` | Shared SauceDemo password | `secret_sauce` |

Self-healing is configured through the same mechanism:

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `SELF_HEALING_ENABLED` | Toggle the engine on/off | `true` |
| `SELF_HEALING_MODE` | `algorithmic` \| `ai` \| `both` | `both` |
| `SELF_HEALING_CONFIDENCE_THRESHOLD` | Minimum confidence to accept a heal (0–1) | `0.75` |
| `SELF_HEALING_AI_PROVIDER` | `openai` \| `anthropic` (Tier 4 only) | `openai` |
| `SELF_HEALING_AI_MODEL` | Override the provider's default model | provider default |
| `SELF_HEALING_API_KEY` | Key for Tier 4; falls back to `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | _unset_ |
| `SELF_HEALING_TEST_ATTRIBUTE` | Automation attribute the engine parses | `data-test` |
| `SELF_HEALING_REPORT_PATH` | Where the healing report is written | `reports/healing` |

## Reports

Runs produce an HTML report (`reports/html`), a JUnit XML report (`reports/junit`) for CI, plus traces, screenshots, and video retained on failure.

## Self-healing locators

When an action can't resolve its selector, the framework tries to recover before failing. All page-object actions funnel through `BasePage.waitForVisible()`; if the normal wait times out, that method hands the selector to the self-healing engine (`utils/selfHealing.js`) and, on a confident match, retries the action against the healed element. **Page objects, locators, and tests never change** — the seam lives entirely in `BasePage`. Assertions deliberately bypass healing, so a genuine regression still fails loudly.

### The four tiers

Candidates are gathered from independent strategies, each producing scored suggestions:

1. **Relaxed attribute matching** — loosens the broken `data-test` selector (`*=`, `^=`, `$=`, keyword combinations, and primary-verb + keyword variants).
2. **Semantic locators** — Playwright `getByRole` / `getByText` / `getByLabel` / `getByPlaceholder` lookups derived from the selector and the locator's variable-name intent.
3. **DOM similarity scan** — scores every visible interactive element in the page against the target's fingerprint (keywords, tag, role, text) via a single `page.evaluate`.
4. **AI-assisted healing** — an LLM proposes a replacement from a trimmed DOM snapshot. It is a last resort, gated behind an API key and a configurable provider; with no key the tier is skipped and the engine stays fully algorithmic.

### Consensus engine

Suggestions from all tiers are grouped by whether they point at the **same element** (matching `data-test`, id, or bounding box). The group with the most votes wins, its confidence is boosted for agreement, and a near-tie between the top two groups is rejected as ambiguous. A candidate is only accepted when it clears `SELF_HEALING_CONFIDENCE_THRESHOLD` (default `0.75`) — this is what prevents healing "add" onto a "remove" button, for example. Opposite-action verbs are actively penalised during scoring.

Because the engine scans the `locators/` modules and maps each static selector string back to its variable name, the report and console logs show the meaningful name (e.g. `[ADD_BACKPACK_BUTTON]`) rather than an anonymous selector. Function-based locators are skipped safely.

### The healing report

Every heal is recorded per worker as NDJSON, then merged in the global teardown into `reports/healing/healing-report.json` and summarised on the console:

```
========================================
            Self-Healing Report
========================================
Healed: 2 locator(s)
Average confidence: 1
Consensus achieved: 100.0%
...
   [ADD_BACKPACK_BUTTON] "[data-test="add-to-cart-backpack"]" -> "[data-test="add-to-cart-sauce-labs-backpack"]"
     strategy: relaxedAttribute, votes: 3, confidence: 1.00, time: 80ms
```

Treat these as a to-do list: update the source locators to remove the (small) per-run healing overhead.

### Try it

The `tests/healing/` suite drives real SauceDemo flows through deliberately renamed `data-test` hooks and passes only because the engine heals them at runtime — no API key needed:

```bash
npm run test:healing
```

## Agentic testing — Playwright MCP & CLI

### MCP server

`.cursor/mcp.json` registers a [Playwright MCP server](https://www.npmjs.com/package/@executeautomation/playwright-mcp-server) so an agent (Cursor, or any MCP client) can drive a browser against this app — navigate, snapshot the DOM, click, type, and generate tests — using the same conventions as the suite.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

Cursor picks this up automatically when the project is opened. To run the server standalone: `npm run mcp`.

### CLI workflows

Useful Playwright CLI entry points, wrapped as npm scripts:

| Command | What it does |
| ------- | ------------ |
| `npm run codegen` | Launch codegen against SauceDemo to record selectors/flows |
| `npm run test:ui` | Interactive UI mode — watch, filter, and time-travel through runs |
| `npm run test:debug` | Step through tests with the Playwright Inspector |
| `npm run trace -- <trace.zip>` | Open a saved trace (traces are retained on failure) |
| `npm run report` | Open the last HTML report |

Filter runs by tag or project directly:

```bash
npx playwright test --grep @healing        # only self-healing specs
npx playwright test --grep @smoke           # smoke tag
npx playwright test --project=chromium      # single browser
```

## Continuous integration

A GitHub Actions workflow (`.github/workflows/playwright.yml`) runs the full suite on every push to `main` and every pull request targeting any branch:

1. Checks out the code and sets up Node.js 22 (with npm caching).
2. Installs dependencies (`npm ci`) and the Playwright browsers with OS dependencies.
3. Runs `npx playwright test` across all configured projects (chromium, firefox, webkit).
4. Posts (or updates) a comment on the pull request summarising the results — pass/fail/flaky counts, failed test details, and a link to the full workflow run — via [`daun/playwright-report-summary`](https://github.com/daun/playwright-report-summary).
5. Uploads the HTML report, JUnit results, and traces/screenshots/videos as workflow artifacts (kept 14 days), even if tests fail.

The PR's check status (pass/fail) reflects the suite's result, so it can be wired up as a required check in branch protection settings. To inspect a failed run, download the `playwright-html-report` artifact from the workflow run and open `index.html`, or `playwright-test-results` for traces of failed tests — both are linked from the PR comment.

## License

MIT
