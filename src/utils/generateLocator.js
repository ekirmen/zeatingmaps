const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export default function generateLocator(length = 7) {
  return Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}
