const { raw } = require("./env.config");

const BASE_URL = (raw.BASE_URL || "https://www.saucedemo.com").replace(/\/$/, "");

const paths = {
  LOGIN: "/",
  INVENTORY: "/inventory.html",
  CART: "/cart.html",
  CHECKOUT_STEP_ONE: "/checkout-step-one.html",
  CHECKOUT_STEP_TWO: "/checkout-step-two.html",
  CHECKOUT_COMPLETE: "/checkout-complete.html",
};

const absolute = (path) => `${BASE_URL}${path}`;

module.exports = {
  BASE_URL,
  paths,
  LOGIN_URL: absolute(paths.LOGIN),
  INVENTORY_URL: absolute(paths.INVENTORY),
  CART_URL: absolute(paths.CART),
  CHECKOUT_STEP_ONE_URL: absolute(paths.CHECKOUT_STEP_ONE),
  CHECKOUT_STEP_TWO_URL: absolute(paths.CHECKOUT_STEP_TWO),
  CHECKOUT_COMPLETE_URL: absolute(paths.CHECKOUT_COMPLETE),
};
