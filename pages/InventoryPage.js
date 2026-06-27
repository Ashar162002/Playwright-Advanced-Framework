const BasePage = require("@utils/BasePage");
const config = require("@config");
const InventoryLocators = require("@locators/inventoryLocators");
const CommonLocators = require("@locators/commonLocators");
const { parsePrice } = require("@utils/helpers");

class InventoryPage extends BasePage {
  async open() {
    await this.goto(config.urls.INVENTORY_URL);
    await this.expectLoaded();
  }

  async expectLoaded() {
    await this.expectVisible(InventoryLocators.INVENTORY_LIST);
    await this.expectText(CommonLocators.PAGE_TITLE, config.testData.messages.INVENTORY_TITLE);
  }

  async getProductNames() {
    return this.getAllTexts(InventoryLocators.ITEM_NAME);
  }

  async getProductPrices() {
    const prices = await this.getAllTexts(InventoryLocators.ITEM_PRICE);
    return prices.map(parsePrice);
  }

  async addProductToCart(productName) {
    await this.click(InventoryLocators.addToCartButton(productName));
  }

  async removeProductFromCart(productName) {
    await this.click(InventoryLocators.removeButton(productName));
  }

  async addProductsToCart(productNames) {
    for (const productName of productNames) {
      await this.addProductToCart(productName);
    }
  }

  async sortBy(sortValue) {
    await this.selectOption(InventoryLocators.SORT_DROPDOWN, sortValue);
  }

  async getCartCount() {
    if (!(await this.isVisible(CommonLocators.CART_BADGE))) {
      return 0;
    }
    return Number.parseInt(await this.getText(CommonLocators.CART_BADGE), 10);
  }

  async goToCart() {
    await this.click(CommonLocators.CART_LINK);
  }

  async logout() {
    await this.click(CommonLocators.BURGER_MENU_BUTTON);
    await this.click(CommonLocators.LOGOUT_LINK);
  }
}

module.exports = InventoryPage;
