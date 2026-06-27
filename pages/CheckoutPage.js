const BasePage = require("@utils/BasePage");
const config = require("@config");
const CheckoutLocators = require("@locators/checkoutLocators");
const CommonLocators = require("@locators/commonLocators");
const { parsePrice } = require("@utils/helpers");

class CheckoutPage extends BasePage {
  async fillCustomerInformation({ firstName, lastName, postalCode }) {
    await this.fill(CheckoutLocators.FIRST_NAME_INPUT, firstName);
    await this.fill(CheckoutLocators.LAST_NAME_INPUT, lastName);
    await this.fill(CheckoutLocators.POSTAL_CODE_INPUT, postalCode);
  }

  async continue() {
    await this.click(CheckoutLocators.CONTINUE_BUTTON);
  }

  async submitCustomerInformation(customer = config.testData.checkoutCustomer) {
    await this.fillCustomerInformation(customer);
    await this.continue();
  }

  async getErrorMessage() {
    return this.getText(CommonLocators.ERROR_MESSAGE);
  }

  async getSummaryItemNames() {
    return this.getAllTexts(CheckoutLocators.ITEM_NAME);
  }

  async getSubtotal() {
    return parsePrice(await this.getText(CheckoutLocators.SUBTOTAL_LABEL));
  }

  async getTax() {
    return parsePrice(await this.getText(CheckoutLocators.TAX_LABEL));
  }

  async getTotal() {
    return parsePrice(await this.getText(CheckoutLocators.TOTAL_LABEL));
  }

  async finish() {
    await this.click(CheckoutLocators.FINISH_BUTTON);
  }

  async expectOrderComplete() {
    await this.expectText(
      CheckoutLocators.COMPLETE_HEADER,
      config.testData.messages.ORDER_COMPLETE_HEADER
    );
  }

  async backToProducts() {
    await this.click(CheckoutLocators.BACK_HOME_BUTTON);
  }
}

module.exports = CheckoutPage;
