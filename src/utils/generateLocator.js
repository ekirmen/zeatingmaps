const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export default function generateLocator(length = 8) {
  return Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

// Función para generar localizador simple de 8 caracteres (números y letras)
export function generateSimpleLocator() {
  return generateLocator(8);
}

// Función para generar localizador con prefijo (ej: "TKT-ABC12345")
export function generatePrefixedLocator(prefix = 'TKT') {
  return `${prefix}-${generateLocator(8)}`;
}
