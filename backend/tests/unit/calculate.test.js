const { calculate } = require('../../src/helpers');

// Unit tests for the currency-safe arithmetic helper used in invoice totals.
describe('calculate helper (currency-safe arithmetic)', () => {
  test('add avoids floating point errors (0.1 + 0.2 === 0.3)', () => {
    expect(calculate.add(0.1, 0.2)).toBe(0.3);
  });

  test('sub subtracts correctly', () => {
    expect(calculate.sub(1, 0.4)).toBe(0.6);
  });

  test('multiply computes a line total (qty * price)', () => {
    expect(calculate.multiply(3, 49.99)).toBe(149.97);
  });

  test('divide splits an amount evenly', () => {
    expect(calculate.divide(10, 4)).toBe(2.5);
  });
});
