---
name: playwright-cli-setup
description: >-
  Install and configure Playwright CLI and Cursor skills for interactive browser
  automation. Use when playwright-cli is not installed, when a user needs to set
  up the CLI for the first time, or when skills need to be configured.
---

# Playwright CLI & Skills Setup

## System Requirements

- **Node.js** >= 18
- **npm** >= 9

Verify:

```bash
node --version
npm --version
```

---

## 1. Install Playwright CLI

```bash
npm install -g @playwright/cli@latest
```

Verify:

```bash
playwright-cli --version
```

If global install is not possible (permissions, corporate policy), use the local version via npx:

```bash
npx playwright-cli --version
```

When using the local version, prefix all commands with `npx`:

```bash
npx playwright-cli open https://example.com
```

### Permission issues

If `npm install -g` fails with `EACCES`, use a Node version manager (nvm) which doesn't require `sudo`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
npm install -g @playwright/cli@latest
```

---

## 2. Install Browser Binaries

Playwright CLI needs at least one browser. Install Chromium (default):

```bash
npx playwright install chromium
```

For all browsers:

```bash
npx playwright install
```

On Linux, if system dependencies are missing:

```bash
npx playwright install --with-deps chromium
```

---

## 3. Verify Playwright CLI Works

```bash
playwright-cli open https://example.com
playwright-cli snapshot
playwright-cli close
```

If successful, the browser opens, a snapshot prints to stdout, and the session closes cleanly.

---

## 4. Persistent Profile Setup

For extension testing, Playwright CLI uses a persistent Chrome profile stored at `$HOME/.playwright-cli/chrome-profile`. This is created automatically on first use:

```bash
playwright-cli open --persistent
```

Or with a custom directory:

```bash
playwright-cli open --profile="$HOME/.playwright-cli/chrome-profile"
```

---

## 5. Attaching to an Existing Browser

To attach to a running Chrome/Edge instance via CDP:

```bash
playwright-cli attach --cdp=http://localhost:9222
```

To attach by channel name:

```bash
playwright-cli attach --cdp=chrome
playwright-cli attach --cdp=msedge
```

Detach when finished (leaves the browser running):

```bash
playwright-cli detach
```

---

## 6. Available Cursor Skills

After CLI setup, additional skills can be added under `.cursor/skills/` (e.g. `Prerequisites/`, `Operations/`, `Features/`) as this framework grows.

These skills reference `playwright-cli` or `npx playwright-cli` commands. If using the local (npx) variant, mentally substitute `npx playwright-cli` wherever a skill says `playwright-cli`.

---

## 7. Quick Command Reference

```bash
playwright-cli open                          # new browser session
playwright-cli open --browser=chrome         # specific browser
playwright-cli open --persistent             # with persistent profile
playwright-cli goto https://example.com      # navigate
playwright-cli snapshot                      # accessibility tree snapshot
playwright-cli click e5                      # click element by ref
playwright-cli fill e3 "text" --submit       # fill input and press Enter
playwright-cli screenshot                    # capture screenshot
playwright-cli tab-list                      # list open tabs
playwright-cli close                         # close session
playwright-cli close-all                     # close all sessions
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `playwright-cli: command not found` | Install globally or use `npx playwright-cli` |
| Browser fails to launch | Run `npx playwright install --with-deps chromium` |
| CDP attach fails | Ensure Chrome was launched with `--remote-debugging-port=9222` |
| `npm install -g` permission denied | Use nvm or set npm prefix: `npm config set prefix "$HOME/.npm-global"` and add `$HOME/.npm-global/bin` to PATH |
