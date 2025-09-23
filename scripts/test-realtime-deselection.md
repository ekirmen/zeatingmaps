# Prueba de Deselección en Tiempo Real

## 🎯 **Problema:**
Cuando deseleccionas un asiento, **no se actualiza en tiempo real** en otros navegadores, solo cuando actualizas la página.

## 🧪 **Pasos para la Prueba:**

### **1. Preparación:**
- Abre **2 navegadores diferentes**
- Navega a la misma página del evento en ambos navegadores
- Asegúrate de que ambos estén en la misma función

### **2. Cargar Scripts de Debug:**
En **ambos navegadores**, ejecuta en la consola:
```javascript
// Cargar script de debug
\i scripts/debug-realtime-deselection.js

// Verificar estado del canal
window.debugRealtime.checkChannelStatus();
```

### **3. Seleccionar Asiento:**
En **Navegador A**:
- Selecciona un asiento
- Verifica que aparece en amarillo
- Ejecuta en consola:
```javascript
// Verificar estado
window.debugRealtime.checkSeatLocksSubscription();
```

### **4. Verificar en Navegador B:**
En **Navegador B**:
- El asiento debería aparecer en **naranja** (seleccionado por otro)
- Ejecuta en consola:
```javascript
// Monitorear eventos
window.debugRealtime.monitorRealtimeEvents();
```

### **5. Deseleccionar Asiento:**
En **Navegador A**:
- Deselecciona el asiento (clic en el asiento amarillo)
- **Observa la consola** para ver si aparecen logs de eventos

### **6. Verificar Sincronización:**
En **Navegador B**:
- **¿El asiento vuelve a verde inmediatamente?**
- **¿Aparecen logs de eventos DELETE en la consola?**

## 🔍 **Logs a Monitorear:**

### **En Navegador A (deselección):**
```
🔄 [SEATING_MAP] Deseleccionando asiento: silla_xxx
✅ [SEATING_MAP] Llamando a onSeatToggle para deseleccionar
```

### **En Navegador B (debería recibir):**
```
🔔 [SEAT_LOCK_STORE] Evento recibido: {eventType: "DELETE", ...}
🗑️ [SEAT_LOCK_STORE] Procesando evento DELETE: {seat_id: "silla_xxx", ...}
🗑️ [SEAT_LOCK_STORE] Asiento eliminado del seatStates (DELETE): {seatId: "silla_xxx", ...}
```

## 🚨 **Problemas Posibles:**

### **1. No se reciben eventos DELETE:**
- **Causa:** El canal no está suscrito correctamente
- **Solución:** Verificar `window.debugRealtime.checkChannelStatus()`

### **2. Se reciben eventos pero no se procesan:**
- **Causa:** Error en el procesamiento del evento
- **Solución:** Verificar logs de `🗑️ [SEAT_LOCK_STORE] Procesando evento DELETE`

### **3. Se procesan eventos pero no se actualiza la UI:**
- **Causa:** El componente no está reaccionando a los cambios del store
- **Solución:** Verificar que `SeatingMapUnified` está suscrito al store

## 🔧 **Comandos de Debug:**

### **Verificar Estado del Canal:**
```javascript
window.debugRealtime.checkChannelStatus();
```

### **Forzar Reconexión:**
```javascript
window.debugRealtime.forceReconnect();
```

### **Simular Deselección:**
```javascript
window.debugRealtime.simulateDeselectionAndMonitor("silla_1757209438389_41", 43);
```

### **Monitorear Eventos:**
```javascript
window.debugRealtime.monitorRealtimeEvents();
```

## ✅ **Criterio de Éxito:**

La prueba es exitosa si:
1. ✅ Al deseleccionar en Navegador A, se ve el evento DELETE en la consola
2. ✅ El Navegador B recibe el evento DELETE inmediatamente
3. ✅ El asiento vuelve a verde en Navegador B sin necesidad de actualizar
4. ✅ Los logs muestran que el `seatStates` se actualiza correctamente

## 🎯 **Resultado Esperado:**

| Acción | Navegador A | Navegador B |
|--------|-------------|-------------|
| **Selección** | Amarillo | Naranja |
| **Deselección** | Verde | Verde (inmediato) |

## 📊 **Si No Funciona:**

1. **Verificar logs** en ambos navegadores
2. **Comprobar estado del canal** con `checkChannelStatus()`
3. **Forzar reconexión** con `forceReconnect()`
4. **Verificar suscripción** con `checkSeatLocksSubscription()`
