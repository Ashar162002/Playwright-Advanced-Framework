const { test, expect, config } = require("@fixtures");

const { products } = config.testData;

test.describe("@regression Cart", () => {
  test("carries added products through to the cart page", async ({ authenticatedInventory, cartPage }) => {
    const selected = [products.BACKPACK, products.FLEECE_JACKET];
    await authenticatedInventory.addProductsToCart(selected);
    await authenticatedInventory.goToCart();

    await cartPage.expectLoaded();
    expect(await cartPage.getItemCount()).toBe(selected.length);
    for (const product of selected) {
      expect(await cartPage.hasProduct(product)).toBe(true);
    }
  });

  test("continue shopping returns to the inventory", async ({ authenticatedInventory, cartPage }) => {
    await authenticatedInventory.goToCart();
    await cartPage.expectLoaded();

    await cartPage.continueShopping();

    await authenticatedInventory.expectLoaded();
  });

  test("an empty cart shows no line items", async ({ authenticatedInventory, cartPage }) => {
    await authenticatedInventory.goToCart();

    await cartPage.expectLoaded();
    expect(await cartPage.getItemCount()).toBe(0);
  });
});
