const { test, expect, config } = require("@fixtures");
const HealingDemoLocators = require("@locators/healingDemoLocators");
const InventoryLocators = require("@locators/inventoryLocators");

const { products, sortOptions } = config.testData;

// These specs drive the app through unchanged page-object actions but with
// renamed data-test hooks. They pass only because the engine heals the selector
// at runtime; algorithmic tiers alone resolve them, so no API key is required.
test.describe("@healing Self-healing locators", () => {
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.loginAs("standard");
    await inventoryPage.expectLoaded();
  });

  test("heals a renamed add-to-cart hook and still adds the product", async ({
    inventoryPage,
  }) => {
    await inventoryPage.click(HealingDemoLocators.ADD_BACKPACK_BUTTON);

    expect(await inventoryPage.getCartCount()).toBe(1);
    await inventoryPage.expectVisible(InventoryLocators.removeButton(products.BACKPACK));
  });

  test("heals a renamed sort control and still reorders the catalogue", async ({
    inventoryPage,
  }) => {
    await inventoryPage.selectOption(HealingDemoLocators.SORT_DROPDOWN, sortOptions.NAME_Z_TO_A);

    const names = await inventoryPage.getProductNames();
    expect(names).toEqual([...names].sort().reverse());
  });
});
