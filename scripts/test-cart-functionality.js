// Script para probar la funcionalidad del carrito
console.log('🧪 [TEST_CART] Iniciando prueba de funcionalidad del carrito...');

// Simular un objeto asiento
const testSeat = {
  sillaId: 'test_seat_123',
  _id: 'test_seat_123',
  id: 'test_seat_123',
  nombre: 'Asiento Test',
  precio: 25.00,
  zonaId: 'zona_test',
  nombreZona: 'Zona Test',
  functionId: 43,
  funcionId: 43
};

console.log('🧪 [TEST_CART] Objeto asiento de prueba:', testSeat);

// Verificar que el objeto tenga todas las propiedades necesarias
const requiredProps = ['sillaId', '_id', 'id', 'nombre', 'precio', 'zonaId', 'nombreZona', 'functionId'];
const missingProps = requiredProps.filter(prop => !testSeat[prop]);

if (missingProps.length > 0) {
  console.error('❌ [TEST_CART] Faltan propiedades requeridas:', missingProps);
} else {
  console.log('✅ [TEST_CART] Todas las propiedades requeridas están presentes');
}

// Verificar la lógica de detección de exists
const mockItems = [];
const seatId = testSeat.sillaId || testSeat.id || testSeat._id;
const exists = mockItems.some(
  (item) => (item.sillaId || item.id || item._id) === seatId
);

console.log('🧪 [TEST_CART] ¿Asiento existe en carrito vacío?', exists);
console.log('🧪 [TEST_CART] seatId extraído:', seatId);

// Simular añadir al carrito
const seatForCart = {
  _id: seatId,
  sillaId: seatId,
  id: seatId,
  nombre: testSeat.nombre || testSeat.numero || seatId,
  precio: testSeat.precio || 0,
  zonaId: testSeat.zonaId || null,
  nombreZona: testSeat.nombreZona || 'Zona',
  functionId: testSeat.functionId,
  funcionId: testSeat.functionId,
  ...testSeat
};

console.log('🧪 [TEST_CART] Objeto para carrito:', seatForCart);

// Verificar que el objeto para carrito tenga todas las propiedades
const cartRequiredProps = ['_id', 'sillaId', 'id', 'nombre', 'precio', 'zonaId', 'nombreZona', 'functionId'];
const cartMissingProps = cartRequiredProps.filter(prop => !seatForCart[prop]);

if (cartMissingProps.length > 0) {
  console.error('❌ [TEST_CART] Faltan propiedades en objeto carrito:', cartMissingProps);
} else {
  console.log('✅ [TEST_CART] Objeto carrito tiene todas las propiedades requeridas');
}

console.log('🧪 [TEST_CART] Prueba completada');
