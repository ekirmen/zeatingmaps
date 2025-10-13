// Script para probar los nuevos localizadores
const { generateSimpleLocator, generatePrefixedLocator } = require('../src/utils/generateLocator');

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testLocators() {
  log(`${colors.bold}${colors.blue}🎫 Testeando Nuevos Localizadores${colors.reset}`);
  log('─'.repeat(50));

  log(`${colors.bold}📋 Formato Anterior (LARGO):${colors.reset}`);
  log('ORDER-1757384088429-UNKNOWN-43-1MRJPNIXE');
  log('');

  log(`${colors.bold}📋 Formato Nuevo (CORTO):${colors.reset}`);
  
  // Generar 10 localizadores simples
  log(`${colors.yellow}Localizadores simples (8 caracteres):${colors.reset}`);
  for (let i = 0; i < 10; i++) {
    const locator = generateSimpleLocator();
    log(`  ${i + 1}. ${locator}`);
  }
  log('');

  // Generar 10 localizadores con prefijo
  log(`${colors.yellow}Localizadores con prefijo (TKT-8caracteres):${colors.reset}`);
  for (let i = 0; i < 10; i++) {
    const locator = generatePrefixedLocator('TKT');
    log(`  ${i + 1}. ${locator}`);
  }
  log('');

  // Generar 10 localizadores con prefijo personalizado
  log(`${colors.yellow}Localizadores con prefijo personalizado:${colors.reset}`);
  for (let i = 0; i < 10; i++) {
    const locator = generatePrefixedLocator('VEN');
    log(`  ${i + 1}. ${locator}`);
  }
  log('');

  // Verificar que todos son únicos
  log(`${colors.bold}🔍 Verificando Unicidad:${colors.reset}`);
  const locators = new Set();
  let duplicates = 0;
  
  for (let i = 0; i < 1000; i++) {
    const locator = generateSimpleLocator();
    if (locators.has(locator)) {
      duplicates++;
    } else {
      locators.add(locator);
    }
  }
  
  if (duplicates === 0) {
    log(`${colors.green}✅ No se encontraron duplicados en 1000 generaciones${colors.reset}`);
  } else {
    log(`${colors.red}❌ Se encontraron ${duplicates} duplicados en 1000 generaciones${colors.reset}`);
  }
  log('');

  // Verificar formato
  log(`${colors.bold}🔍 Verificando Formato:${colors.reset}`);
  const testLocator = generateSimpleLocator();
  const isValidFormat = /^[A-Z0-9]{8}$/.test(testLocator);
  
  if (isValidFormat) {
    log(`${colors.green}✅ Formato correcto: ${testLocator}${colors.reset}`);
  } else {
    log(`${colors.red}❌ Formato incorrecto: ${testLocator}${colors.reset}`);
  }
  log('');

  // Comparación de longitudes
  log(`${colors.bold}📊 Comparación de Longitudes:${colors.reset}`);
  log(`Formato anterior: ${'ORDER-1757384088429-UNKNOWN-43-1MRJPNIXE'.length} caracteres`);
  log(`Formato nuevo: ${testLocator.length} caracteres`);
  log(`Reducción: ${'ORDER-1757384088429-UNKNOWN-43-1MRJPNIXE'.length - testLocator.length} caracteres (${Math.round(((('ORDER-1757384088429-UNKNOWN-43-1MRJPNIXE'.length - testLocator.length) / 'ORDER-1757384088429-UNKNOWN-43-1MRJPNIXE'.length) * 100))}% menos)`);
  log('');

  log(`${colors.bold}${colors.green}🎉 ¡Localizadores actualizados exitosamente!${colors.reset}`);
  log(`${colors.blue}💡 Los localizadores ahora son más cortos y fáciles de usar${colors.reset}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testLocators();
}

module.exports = { testLocators };
