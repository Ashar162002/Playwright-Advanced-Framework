const { base, pagesFixtures } = require("./pages");
const config = require("@config");

const test = base.test.extend({
  ...pagesFixtures,

  // Convenience fixture: a session already authenticated as the standard user
  // and sitting on the inventory page. Tests that only care about post-login
  // behaviour can request `authenticatedInventory` and skip the login steps.
  authenticatedInventory: async ({ loginPage, inventoryPage }, use) => {
    await loginPage.open();
    await loginPage.loginAs("standard");
    await inventoryPage.expectLoaded();
    await use(inventoryPage);
  },
});

module.exports = {
  test,
  expect: base.expect,
  config,
};
