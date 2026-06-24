const { raw, toBoolean, toNumber } = require("./env.config");

const runtime = {
  HEADLESS: toBoolean(raw.HEADLESS, true),
  WORKERS: toNumber(raw.WORKERS, 4),
  VIEWPORT_WIDTH: toNumber(raw.VIEWPORT_WIDTH, 1440),
  VIEWPORT_HEIGHT: toNumber(raw.VIEWPORT_HEIGHT, 900),
  TEST_TIMEOUT: toNumber(raw.TEST_TIMEOUT, 60000),
  EXPECT_TIMEOUT: toNumber(raw.EXPECT_TIMEOUT, 10000),
  ACTION_TIMEOUT: toNumber(raw.ACTION_TIMEOUT, 15000),
  NAVIGATION_TIMEOUT: toNumber(raw.NAVIGATION_TIMEOUT, 30000),
};

const products = {
  BACKPACK: "Sauce Labs Backpack",
  BIKE_LIGHT: "Sauce Labs Bike Light",
  BOLT_TSHIRT: "Sauce Labs Bolt T-Shirt",
  FLEECE_JACKET: "Sauce Labs Fleece Jacket",
  ONESIE: "Sauce Labs Onesie",
  RED_TSHIRT: "Test.allTheThings() T-Shirt (Red)",
};

const sortOptions = {
  NAME_A_TO_Z: "az",
  NAME_Z_TO_A: "za",
  PRICE_LOW_TO_HIGH: "lohi",
  PRICE_HIGH_TO_LOW: "hilo",
};

const checkoutCustomer = {
  firstName: "Ada",
  lastName: "Lovelace",
  postalCode: "94107",
};

const messages = {
  LOCKED_OUT_ERROR: "Epic sadface: Sorry, this user has been locked out.",
  INVALID_CREDENTIALS_ERROR:
    "Epic sadface: Username and password do not match any user in this service",
  MISSING_USERNAME_ERROR: "Epic sadface: Username is required",
  MISSING_PASSWORD_ERROR: "Epic sadface: Password is required",
  MISSING_CHECKOUT_FIRST_NAME: "Error: First Name is required",
  MISSING_CHECKOUT_POSTAL_CODE: "Error: Postal Code is required",
  ORDER_COMPLETE_HEADER: "Thank you for your order!",
  INVENTORY_TITLE: "Products",
  CART_TITLE: "Your Cart",
  CHECKOUT_OVERVIEW_TITLE: "Checkout: Overview",
  CHECKOUT_INFO_TITLE: "Checkout: Your Information",
};

module.exports = {
  ...runtime,
  products,
  sortOptions,
  checkoutCustomer,
  messages,
};
