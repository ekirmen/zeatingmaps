// Script para probar si Zustand está funcionando correctamente
console.log('🧪 [TEST_ZUSTAND] Probando Zustand...');

try {
  const { create } = require('zustand');
  console.log('✅ [TEST_ZUSTAND] Zustand importado correctamente');
  
  // Crear un store de prueba
  const useTestStore = create((set, get) => ({
    items: [],
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    getItemCount: () => get().items.length,
  }));
  
  console.log('✅ [TEST_ZUSTAND] Store de prueba creado');
  
  // Probar el store
  const store = useTestStore.getState();
  console.log('🧪 [TEST_ZUSTAND] Estado inicial:', store);
  
  // Añadir un item
  store.addItem({ id: 1, name: 'Test Item' });
  const newState = useTestStore.getState();
  console.log('🧪 [TEST_ZUSTAND] Estado después de añadir item:', newState);
  
  // Verificar que el item se añadió
  const itemCount = store.getItemCount();
  console.log('🧪 [TEST_ZUSTAND] Número de items:', itemCount);
  
  if (itemCount === 1) {
    console.log('✅ [TEST_ZUSTAND] Zustand está funcionando correctamente');
  } else {
    console.error('❌ [TEST_ZUSTAND] Zustand no está funcionando correctamente');
  }
  
} catch (error) {
  console.error('❌ [TEST_ZUSTAND] Error:', error.message);
}

console.log('🧪 [TEST_ZUSTAND] Prueba completada');
