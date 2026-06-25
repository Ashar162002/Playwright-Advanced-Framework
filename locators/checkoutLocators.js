class CheckoutLocators {
  // Step one - customer information
  static FIRST_NAME_INPUT = '[data-test="firstName"]';
  static LAST_NAME_INPUT = '[data-test="lastName"]';
  static POSTAL_CODE_INPUT = '[data-test="postalCode"]';
  static CONTINUE_BUTTON = '[data-test="continue"]';
  static CANCEL_BUTTON = '[data-test="cancel"]';

  // Step two - order overview
  static SUMMARY_ITEM = ".cart_item";
  static ITEM_NAME = '[data-test="inventory-item-name"]';
  static SUBTOTAL_LABEL = '[data-test="subtotal-label"]';
  static TAX_LABEL = '[data-test="tax-label"]';
  static TOTAL_LABEL = '[data-test="total-label"]';
  static FINISH_BUTTON = '[data-test="finish"]';

  // Complete
  static COMPLETE_HEADER = '[data-test="complete-header"]';
  static COMPLETE_TEXT = '[data-test="complete-text"]';
  static BACK_HOME_BUTTON = '[data-test="back-to-products"]';
}

module.exports = CheckoutLocators;
