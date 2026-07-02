const { expect } = require("@playwright/test");
const config = require("@config");
const SelfHealingLocator = require("@utils/selfHealing");

class BasePage {
  constructor(page) {
    this.page = page;
    this.timeout = config.testData.ACTION_TIMEOUT;
    this.selfHealer = new SelfHealingLocator(page);
  }

  // Central locator resolution. Every action funnels through here, which keeps
  // page objects declarative and gives the framework a single seam for the
  // self-healing engine without touching call sites.
  locator(selector, options = {}) {
    return this.page.locator(selector, options);
  }

  async goto(url, options = {}) {
    await this.page.goto(url, { waitUntil: "domcontentloaded", ...options });
  }

  // Resolution seam for actions: wait for the element normally, and only if that
  // fails fall back to the self-healing engine. A confident heal returns the
  // replacement locator so the caller acts on it transparently; otherwise the
  // original error propagates. Assertions deliberately bypass this path.
  async waitForVisible(selector, timeout = this.timeout) {
    const element = this.locator(selector).first();
    try {
      await element.waitFor({ state: "visible", timeout });
      return element;
    } catch (error) {
      const healed = await this._heal(selector);
      if (healed) return healed;
      throw error;
    }
  }

  async _heal(selector) {
    if (typeof this.page.isClosed === "function" && this.page.isClosed()) return null;
    const result = await this.selfHealer.heal(selector, this.page).catch(() => null);
    return result ? result.element : null;
  }

  async waitForHidden(selector, timeout = this.timeout) {
    await this.locator(selector).first().waitFor({ state: "hidden", timeout });
  }

  async click(selector, options = {}) {
    const element = await this.waitForVisible(selector);
    await element.scrollIntoViewIfNeeded();
    await element.click(options);
  }

  async fill(selector, value) {
    const element = await this.waitForVisible(selector);
    await element.fill("");
    await element.fill(value);
  }

  async type(selector, value, options = {}) {
    const element = await this.waitForVisible(selector);
    await element.pressSequentially(value, options);
  }

  async selectOption(selector, value) {
    const element = await this.waitForVisible(selector);
    await element.selectOption(value);
  }

  async getText(selector) {
    const element = await this.waitForVisible(selector);
    return (await element.textContent())?.trim() ?? "";
  }

  async getAllTexts(selector) {
    await this.locator(selector).first().waitFor({ state: "visible", timeout: this.timeout });
    const texts = await this.locator(selector).allTextContents();
    return texts.map((text) => text.trim());
  }

  async count(selector) {
    return this.locator(selector).count();
  }

  // Non-throwing visibility probe. Genuinely waits up to `timeout` for the
  // element, unlike Locator.isVisible() which is a one-shot check. Use it to
  // branch on optional UI without failing the test.
  async isVisible(selector, timeout = 3000) {
    return this.locator(selector)
      .first()
      .waitFor({ state: "visible", timeout })
      .then(() => true)
      .catch(() => false);
  }

  async expectVisible(selector) {
    await expect(this.locator(selector).first()).toBeVisible();
  }

  async expectHidden(selector) {
    await expect(this.locator(selector).first()).toBeHidden();
  }

  async expectText(selector, expected) {
    await expect(this.locator(selector).first()).toHaveText(expected);
  }

  async expectContainsText(selector, expected) {
    await expect(this.locator(selector).first()).toContainText(expected);
  }

  async expectCount(selector, expected) {
    await expect(this.locator(selector)).toHaveCount(expected);
  }

  async expectUrlContains(fragment) {
    await expect(this.page).toHaveURL(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
}

module.exports = BasePage;
