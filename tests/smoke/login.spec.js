const { test, expect, config } = require("@fixtures");

const { messages } = config.testData;

test.describe("@smoke Authentication", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test("standard user can log in and reach the inventory", async ({ loginPage, inventoryPage }) => {
    await loginPage.loginAs("standard");

    await inventoryPage.expectLoaded();
    await inventoryPage.expectUrlContains(config.urls.paths.INVENTORY);
  });

  test("locked out user is blocked with an explanatory error", async ({ loginPage }) => {
    await loginPage.loginAs("lockedOut");

    await loginPage.expectErrorMessage(messages.LOCKED_OUT_ERROR);
  });

  test("invalid credentials are rejected", async ({ loginPage }) => {
    await loginPage.loginAs("invalid");

    await loginPage.expectErrorMessage(messages.INVALID_CREDENTIALS_ERROR);
  });

  test("username is required", async ({ loginPage }) => {
    const { password } = config.users.standard;
    await loginPage.login("", password);

    await loginPage.expectErrorMessage(messages.MISSING_USERNAME_ERROR);
  });

  test("password is required", async ({ loginPage }) => {
    const { username } = config.users.standard;
    await loginPage.login(username, "");

    await loginPage.expectErrorMessage(messages.MISSING_PASSWORD_ERROR);
  });

  test("standard user can log out", async ({ loginPage, inventoryPage }) => {
    await loginPage.loginAs("standard");
    await inventoryPage.expectLoaded();

    await inventoryPage.logout();

    await expect(inventoryPage.locator('[data-test="login-button"]')).toBeVisible();
  });
});
