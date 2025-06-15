const sum = (a, b) => a + b;

test('sanity check', () => {
  expect(sum(1, 1)).toBe(2);
});
