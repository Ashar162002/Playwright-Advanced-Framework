// Small, dependency-free utilities shared across page objects and tests.

const parsePrice = (priceText) => Number.parseFloat(String(priceText).replace(/[^0-9.]/g, ""));

const sortAscending = (values) => [...values].sort((a, b) => a - b);

const sortDescending = (values) => [...values].sort((a, b) => b - a);

const isSortedAscending = (values) =>
  values.every((value, index) => index === 0 || values[index - 1] <= value);

const isSortedDescending = (values) =>
  values.every((value, index) => index === 0 || values[index - 1] >= value);

module.exports = {
  parsePrice,
  sortAscending,
  sortDescending,
  isSortedAscending,
  isSortedDescending,
};
