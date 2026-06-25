const slugify = (productName) =>
  productName
    .toLowerCase()
    .replace(/[().]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

class InventoryLocators {
  static INVENTORY_LIST = '[data-test="inventory-list"]';
  static INVENTORY_ITEM = ".inventory_item";
  static ITEM_NAME = '[data-test="inventory-item-name"]';
  static ITEM_PRICE = '[data-test="inventory-item-price"]';

  static SORT_DROPDOWN = '[data-test="product-sort-container"]';

  // SauceDemo derives the add/remove data-test attribute from a slug of the
  // product name, e.g. "Sauce Labs Backpack" -> "add-to-cart-sauce-labs-backpack".
  static addToCartButton(productName) {
    return `[data-test="add-to-cart-${slugify(productName)}"]`;
  }

  static removeButton(productName) {
    return `[data-test="remove-${slugify(productName)}"]`;
  }

  static itemCardByName(productName) {
    return `${InventoryLocators.INVENTORY_ITEM}:has(${InventoryLocators.ITEM_NAME}:has-text("${productName}"))`;
  }
}

module.exports = InventoryLocators;
