const BasePage = require("@utils/BasePage");
const config = require("@config");
const CartLocators = require("@locators/cartLocators");
const CommonLocators = require("@locators/commonLocators");

class CartPage extends BasePage {
  async expectLoaded() {
    await this.expectText(CommonLocators.PAGE_TITLE, config.testData.messages.CART_TITLE);
  }

  async getItemNames() {
    if ((await this.count(CartLocators.CART_ITEM)) === 0) {
      return [];
    }
    return this.getAllTexts(CartLocators.ITEM_NAME);
  }

  async getItemCount() {
    return this.count(CartLocators.CART_ITEM);
  }

  async hasProduct(productName) {
    return this.isVisible(CartLocators.cartItemByName(productName));
  }

  async continueShopping() {
    await this.click(CartLocators.CONTINUE_SHOPPING_BUTTON);
  }

  async checkout() {
    await this.click(CartLocators.CHECKOUT_BUTTON);
  }
}

module.exports = CartPage;
