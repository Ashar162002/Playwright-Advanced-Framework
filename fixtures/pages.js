const base = require("@playwright/test");
const LoginPage = require("@pages/LoginPage");
const InventoryPage = require("@pages/InventoryPage");
const CartPage = require("@pages/CartPage");
const CheckoutPage = require("@pages/CheckoutPage");

// Each page object is exposed as its own fixture so tests can request only what
// they need. Fixtures are lazily instantiated per test, keeping them isolated.
const pagesFixtures = {
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
};

module.exports = { pagesFixtures, base };
