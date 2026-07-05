const { test, expect, config } = require("@fixtures");
// test
const { products, checkoutCustomer, messages } = config.testData;

test.describe("@e2e Purchase journey", () => {
  test("a shopper can log in, build a cart and complete checkout", async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    const cart = [products.BACKPACK, products.BOLT_TSHIRT];

    await test.step("Log in as the standard user", async () => {
      await loginPage.open();
      await loginPage.loginAs("standard");
      await inventoryPage.expectLoaded();
    });

    await test.step("Add products to the cart", async () => {
      await inventoryPage.addProductsToCart(cart);
      expect(await inventoryPage.getCartCount()).toBe(cart.length);
      await inventoryPage.goToCart();
    });

    await test.step("Review the cart", async () => {
      await cartPage.expectLoaded();
      expect(await cartPage.getItemNames()).toEqual(expect.arrayContaining(cart));
      await cartPage.checkout();
    });

    await test.step("Provide customer information", async () => {
      await checkoutPage.submitCustomerInformation(checkoutCustomer);
      await checkoutPage.expectContainsText(
        '[data-test="title"]',
        messages.CHECKOUT_OVERVIEW_TITLE
      );
    });

    await test.step("Verify the order totals add up", async () => {
      expect(await checkoutPage.getSummaryItemNames()).toEqual(expect.arrayContaining(cart));
      const subtotal = await checkoutPage.getSubtotal();
      const tax = await checkoutPage.getTax();
      const total = await checkoutPage.getTotal();
      expect(Number((subtotal + tax).toFixed(2))).toBe(total);
    });

    await test.step("Finish and confirm the order", async () => {
      await checkoutPage.finish();
      await checkoutPage.expectOrderComplete();
    });
  });

  test("checkout enforces required customer fields", async ({ authenticatedInventory, cartPage, checkoutPage }) => {
    await authenticatedInventory.addProductToCart(products.ONESIE);
    await authenticatedInventory.goToCart();
    await cartPage.checkout();

    await checkoutPage.continue();
    expect(await checkoutPage.getErrorMessage()).toBe(messages.MISSING_CHECKOUT_FIRST_NAME);
  });
});
