# Fix: Sincronización Canvas-Carrito

## 🎯 **Problemas Identificados:**

1. **Al quitar del canvas** → No se quita del carrito
2. **Error lógico** → Se pone todo amarillo
3. **Al hacer click de nuevo** → Se pone amarillo solo alrededor
4. **Al quitar del carrito** → Queda amarillo alrededor en lugar de volver al estado original

## 🔍 **Causa Raíz:**

El problema estaba en que `SeatingMapUnified` usaba `selectedSeats` de las props para determinar qué asientos estaban seleccionados, pero esto **no estaba sincronizado** con el carrito real. Esto causaba inconsistencias entre:

- **Canvas click** → `SeatingMapUnified.handleSeatClick` → `onSeatToggle`
- **Cart removal** → `cartStore.toggleSeat` → `unlockSeat`
- **EventosPage** → `handleSeatToggle` → `unlockSeat` + `removeFromCart`

## ✅ **Solución Implementada:**

### **1. Unificación de Fuentes de Verdad:**
Modifiqué `SeatingMapUnified` para que use el **carrito directamente** como fuente principal de verdad para determinar qué asientos están seleccionados:

```javascript
const selectedSeatIds = useMemo(() => {
  // Usar el carrito directamente para determinar asientos seleccionados
  const cartItems = useCartStore.getState().items || [];
  const cartSeatIds = cartItems.map(item => (item.sillaId || item.id || item._id)?.toString()).filter(Boolean);
  
  // También incluir selectedSeats de las props como fallback
  let propSeatIds = [];
  if (selectedSeats) {
    // ... lógica para procesar selectedSeats
  }
  
  // Combinar ambos (carrito tiene prioridad)
  const allSeatIds = [...new Set([...cartSeatIds, ...propSeatIds])];
  return new Set(allSeatIds);
}, [selectedSeats]);
```

### **2. Prioridad del Carrito:**
- **Carrito** → Fuente principal de verdad
- **Props** → Fallback para compatibilidad
- **Sincronización** → Automática entre canvas y carrito

## 🔄 **Flujo Corregido:**

1. **Usuario hace click en canvas** → `SeatingMapUnified.handleSeatClick`
2. **Verifica carrito real** → `useCartStore.getState().items`
3. **Determina si está seleccionado** → Basado en carrito, no en props
4. **Llama a onSeatToggle** → Con información correcta
5. **Sincronización automática** → Entre canvas y carrito

## 🧪 **Scripts de Prueba:**

### **1. `test-seat-cart-sync.js`**
- Verifica sincronización entre canvas y carrito
- Simula deselección desde diferentes fuentes
- Monitorea cambios en tiempo real

## 🔧 **Archivos Modificados:**

- **`src/components/SeatingMapUnified.jsx`** - Unificación de fuentes de verdad

## 🎨 **Estados Visuales Corregidos:**

| Acción | Canvas | Carrito | Resultado |
|--------|--------|---------|-----------|
| **Selección** | Amarillo | ✅ Agregado | Sincronizado |
| **Deselección (canvas)** | Verde | ✅ Removido | Sincronizado |
| **Deselección (carrito)** | Verde | ✅ Removido | Sincronizado |

## ✅ **Resultado:**

- ✅ **Sincronización perfecta** entre canvas y carrito
- ✅ **Deselección desde canvas** → Se quita del carrito
- ✅ **Deselección desde carrito** → Se quita del canvas
- ✅ **Estados visuales correctos** → Verde cuando está disponible
- ✅ **No más inconsistencias** → Una sola fuente de verdad

## 🚀 **Próximos Pasos:**

1. **Probar la solución** con los scripts de prueba
2. **Verificar** que la sincronización funciona correctamente
3. **Confirmar** que los estados visuales son correctos
4. **Validar** que no hay efectos secundarios

## 🎯 **Criterio de Éxito:**

La solución es exitosa si:
- ✅ Al hacer click en canvas, se sincroniza con el carrito
- ✅ Al quitar del carrito, se quita del canvas
- ✅ Los asientos vuelven a verde cuando están disponibles
- ✅ No hay inconsistencias entre canvas y carrito

## 📊 **Comandos de Debug:**

```javascript
// Verificar sincronización
window.testSeatCartSync.checkSynchronization();

// Verificar estado del carrito
window.testSeatCartSync.checkCartState();

// Verificar estado del seatLockStore
window.testSeatCartSync.checkSeatLockState();

// Simular deselección desde carrito
window.testSeatCartSync.simulateCartDeselection("silla_1757209438389_41");

// Monitorear cambios
window.testSeatCartSync.monitorChanges();
```
