// Deliberately broken selectors used only by the self-healing demo spec. Each
// value is a plausible rename of a real SauceDemo `data-test` hook — the kind of
// drift that would normally break a test. Declaring them here (rather than inline
// in the spec) lets the healing report resolve the meaningful variable name.
class HealingDemoLocators {
  // Real hook: add-to-cart-sauce-labs-backpack
  static ADD_BACKPACK_BUTTON = '[data-test="add-to-cart-backpack"]';

  // Real hook: product-sort-container
  static SORT_DROPDOWN = '[data-test="sort-container"]';
}

module.exports = HealingDemoLocators;
