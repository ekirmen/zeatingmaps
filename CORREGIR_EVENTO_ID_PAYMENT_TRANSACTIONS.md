# 🔧 CORREGIR EVENTO_ID EN PAYMENT_TRANSACTIONS

## 📋 **PROBLEMA IDENTIFICADO:**

**❌ TODAS las llamadas a `createPaymentTransaction` NO incluyen `eventoId`**

### **📁 ARCHIVOS AFECTADOS:**

1. **`src/store/services/paymentMethodsProcessor.js`** - 8 llamadas sin eventoId
2. **`src/store/services/paymentProcessors.js`** - 6 llamadas sin eventoId

---

## 🔧 **SOLUCIONES:**

### **1. PAYMENT_METHODS_PROCESSOR.JS - Agregar eventoId:**

```javascript
// ANTES (líneas 95, 182, 229, 263, 297, 334, 368, 408):
const transaction = await createPaymentTransaction({
  orderId: paymentData.orderId,
  gatewayId: this.method.id || `gateway_${this.method.method_id}`,
  amount: paymentData.amount,
  currency: paymentData.currency || 'USD',
  locator: paymentData.locator,
  // ❌ FALTA: eventoId, tenantId, userId, funcionId
});

// DESPUÉS:
const transaction = await createPaymentTransaction({
  orderId: paymentData.orderId,
  gatewayId: this.method.id || `gateway_${this.method.method_id}`,
  amount: paymentData.amount,
  currency: paymentData.currency || 'USD',
  locator: paymentData.locator,
  eventoId: paymentData.eventoId, // 👈 AGREGAR
  tenantId: paymentData.tenantId, // 👈 AGREGAR
  userId: paymentData.userId,     // 👈 AGREGAR
  funcionId: paymentData.funcionId // 👈 AGREGAR
});
```

### **2. PAYMENT_PROCESSORS.JS - Agregar eventoId:**

```javascript
// ANTES (líneas 28, 85, 131, 173, 213, 252):
const transaction = await createPaymentTransaction({
  orderId: paymentData.orderId,
  gatewayId: this.gateway.id,
  amount: paymentData.amount,
  currency: paymentData.currency || 'USD'
  // ❌ FALTA: eventoId, tenantId, userId, funcionId, locator
});

// DESPUÉS:
const transaction = await createPaymentTransaction({
  orderId: paymentData.orderId,
  gatewayId: this.gateway.id,
  amount: paymentData.amount,
  currency: paymentData.currency || 'USD',
  eventoId: paymentData.eventoId, // 👈 AGREGAR
  tenantId: paymentData.tenantId, // 👈 AGREGAR
  userId: paymentData.userId,     // 👈 AGREGAR
  funcionId: paymentData.funcionId, // 👈 AGREGAR
  locator: paymentData.locator    // 👈 AGREGAR
});
```

---

## 🎯 **FUNCIÓN AUXILIAR NECESARIA:**

```javascript
// Función para obtener datos del contexto actual
const getCurrentPaymentContext = () => {
  // Obtener del contexto de React o del estado global
  const { currentEvento } = useEventoContext();
  const { currentTenant } = useTenantContext();
  const { currentUser } = useAuthContext();
  const { currentFuncion } = useFuncionContext();
  
  return {
    eventoId: currentEvento?.id,
    tenantId: currentTenant?.id,
    userId: currentUser?.id,
    funcionId: currentFuncion?.id
  };
};
```

---

## 📋 **ARCHIVOS A ACTUALIZAR:**

### **🔍 BUSCAR Y REEMPLAZAR:**

1. **`src/store/services/paymentMethodsProcessor.js`**
   - Líneas: 95, 182, 229, 263, 297, 334, 368, 408
   - Agregar: `eventoId`, `tenantId`, `userId`, `funcionId`

2. **`src/store/services/paymentProcessors.js`**
   - Líneas: 28, 85, 131, 173, 213, 252
   - Agregar: `eventoId`, `tenantId`, `userId`, `funcionId`, `locator`

---

## ⚠️ **IMPORTANTE:**

### **🔒 VALIDACIÓN:**
- **Verificar que** `paymentData` contenga los campos necesarios
- **Usar valores por defecto** si no están disponibles
- **Loggear errores** si faltan campos críticos

### **🧪 TESTING:**
- **Probar creación** de payment_transactions con eventoId
- **Verificar que** se asigna correctamente en la BD
- **Confirmar que** los reportes funcionan con eventoId

---

## 🚀 **PRÓXIMOS PASOS:**

1. **Actualizar código** en ambos archivos
2. **Probar funcionalidad** de pagos
3. **Verificar que** se crean payment_transactions con eventoId
4. **Confirmar que** los reportes funcionan correctamente

**¿Quieres que actualicemos estos archivos ahora?**
