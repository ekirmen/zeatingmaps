const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateLocator(length = 8) {
  const n = Number.isInteger(length) && length > 0 ? length : 8;
  return Array.from({ length: n }).map(() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

export function generateSimpleLocator() {
  return generateLocator(8);
}

export function generatePrefixedLocator(prefix = 'TKT') {
  return `${prefix}-${generateLocator(8)}`;
}

export default generateLocator;