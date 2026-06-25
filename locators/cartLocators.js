class CartLocators {
  static CART_ITEM = ".cart_item";
  static ITEM_NAME = '[data-test="inventory-item-name"]';
  static ITEM_QUANTITY = ".cart_quantity";

  static CONTINUE_SHOPPING_BUTTON = '[data-test="continue-shopping"]';
  static CHECKOUT_BUTTON = '[data-test="checkout"]';

  static cartItemByName(productName) {
    return `${CartLocators.CART_ITEM}:has(${CartLocators.ITEM_NAME}:has-text("${productName}"))`;
  }
}

module.exports = CartLocators;
