const { test, expect, config } = require("@fixtures");
const { isSortedAscending, isSortedDescending, sortAscending } = require("@utils/helpers");

const { products, sortOptions } = config.testData;

test.describe("@regression Inventory", () => {
  test("displays the full product catalogue", async ({ authenticatedInventory }) => {
    const names = await authenticatedInventory.getProductNames();

    expect(names).toHaveLength(6);
    expect(names).toContain(products.BACKPACK);
  });

  test("sorts products by name Z to A", async ({ authenticatedInventory }) => {
    await authenticatedInventory.sortBy(sortOptions.NAME_Z_TO_A);

    const names = await authenticatedInventory.getProductNames();
    expect(names).toEqual([...names].sort().reverse());
  });

  test("sorts products by price low to high", async ({ authenticatedInventory }) => {
    await authenticatedInventory.sortBy(sortOptions.PRICE_LOW_TO_HIGH);

    const prices = await authenticatedInventory.getProductPrices();
    expect(isSortedAscending(prices)).toBe(true);
    expect(prices).toEqual(sortAscending(prices));
  });

  test("sorts products by price high to low", async ({ authenticatedInventory }) => {
    await authenticatedInventory.sortBy(sortOptions.PRICE_HIGH_TO_LOW);

    const prices = await authenticatedInventory.getProductPrices();
    expect(isSortedDescending(prices)).toBe(true);
  });

  test("updates the cart badge as products are added and removed", async ({ authenticatedInventory }) => {
    expect(await authenticatedInventory.getCartCount()).toBe(0);

    await authenticatedInventory.addProductToCart(products.BACKPACK);
    await authenticatedInventory.addProductToCart(products.BIKE_LIGHT);
    expect(await authenticatedInventory.getCartCount()).toBe(2);

    await authenticatedInventory.removeProductFromCart(products.BACKPACK);
    expect(await authenticatedInventory.getCartCount()).toBe(1);
  });
});
