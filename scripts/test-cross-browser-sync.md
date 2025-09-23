# Prueba de Sincronización Entre Navegadores

## 🎯 **Objetivo:**
Verificar que cuando un usuario deselecciona un asiento en un navegador, el cambio se refleje inmediatamente en otros navegadores.

## 🧪 **Pasos para la Prueba:**

### **1. Preparación:**
- Abre **2 navegadores diferentes** (Chrome, Firefox, Edge, etc.)
- Navega a la misma página del evento en ambos navegadores
- Asegúrate de que ambos estén en la misma función

### **2. Verificación Inicial:**
En **ambos navegadores**, ejecuta en la consola:
```javascript
// Verificar estado inicial
window.testSeatSync.monitorSeatStates();
```

### **3. Seleccionar Asiento:**
En **Navegador A**:
- Selecciona un asiento
- Verifica que aparece en amarillo
- Ejecuta en consola:
```javascript
window.testSeatSync.checkSeatInStore('ID_DEL_ASIENTO');
```

### **4. Verificar en Navegador B:**
En **Navegador B**:
- El asiento debería aparecer en **naranja** (seleccionado por otro)
- Ejecuta en consola:
```javascript
window.testSeatSync.checkSeatInStore('ID_DEL_ASIENTO');
```

### **5. Deseleccionar Asiento:**
En **Navegador A**:
- Deselecciona el asiento (clic en el asiento amarillo)
- Ejecuta en consola:
```javascript
window.testSeatSync.monitorSeatStates();
```

### **6. Verificar Sincronización:**
En **Navegador B**:
- El asiento debería volver a **verde** (disponible)
- Ejecuta en consola:
```javascript
window.testSeatSync.monitorSeatStates();
```

## ✅ **Resultado Esperado:**

| Acción | Navegador A | Navegador B |
|--------|-------------|-------------|
| **Inicial** | Verde | Verde |
| **Selección** | Amarillo | Naranja |
| **Deselección** | Verde | Verde |

## 🔍 **Verificaciones Adicionales:**

### **En la Consola de Ambos Navegadores:**
```javascript
// Verificar que el store está funcionando
console.log('Store disponible:', typeof window.seatLockStore !== 'undefined');

// Verificar canal de suscripción
const store = window.seatLockStore.getState();
console.log('Canal activo:', store.channel ? 'Sí' : 'No');

// Verificar estados de asientos
window.testSeatSync.monitorSeatStates();
```

### **En Supabase SQL Editor:**
```sql
-- Verificar estado en la base de datos
SELECT 
    seat_id,
    status,
    session_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'ID_DEL_ASIENTO';
```

## 🚨 **Problemas Comunes:**

### **1. Asiento no se deselecciona en otro navegador:**
- **Causa:** El `seatLockStore` no está eliminando el asiento del `seatStates`
- **Solución:** Verificar que el evento DELETE se está procesando correctamente

### **2. Asiento aparece como "disponible" en lugar de desaparecer:**
- **Causa:** El código anterior establecía el estado como `'disponible'` en lugar de eliminarlo
- **Solución:** Ya corregido - ahora se elimina completamente del `seatStates`

### **3. No hay sincronización en tiempo real:**
- **Causa:** El canal de suscripción no está activo
- **Solución:** Verificar que `store.channel` no es null

## 📊 **Logs a Monitorear:**

En la consola del navegador, deberías ver:
```
🔔 [SEAT_LOCK_STORE] Cambio detectado en seat_locks: {eventType: "DELETE", ...}
🎨 [SEAT_LOCK_STORE] Asiento eliminado del seatStates (DELETE): {seatId: "..."}
```

## 🎯 **Criterio de Éxito:**

✅ **La prueba es exitosa si:**
1. El asiento se deselecciona inmediatamente en ambos navegadores
2. El asiento vuelve a su color verde original
3. Los logs muestran que el evento DELETE se procesa correctamente
4. El `seatStates` se actualiza en tiempo real
