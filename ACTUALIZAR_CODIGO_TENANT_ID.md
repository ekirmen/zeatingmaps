# 🔧 ACTUALIZAR CÓDIGO PARA ASIGNAR TENANT_ID AUTOMÁTICAMENTE

## 📋 **PROBLEMAS IDENTIFICADOS:**

### **❌ TABLAS SIN TENANT_ID:**
1. **`comisiones_tasas`** - No tiene columna tenant_id
2. **`plantillas`** - tenant_id es NULL
3. **`plantillas_productos_template`** - tenant_id es NULL
4. **`settings`** - tenant_id es NULL
5. **`system_alerts`** - tenant_id es NULL

### **❌ PAYMENT_TRANSACTIONS:**
- **`evento_id`** es NULL (debería tenerlo)

---

## 🔧 **SOLUCIONES EN CÓDIGO:**

### **1. COMISIONES_TASAS - Agregar tenant_id automáticamente:**

```javascript
// En el código de creación de comisiones_tasas
const createComisionTasa = async (comisionData) => {
  const { data, error } = await supabase
    .from('comisiones_tasas')
    .insert({
      ...comisionData,
      tenant_id: getCurrentTenantId() // 👈 AGREGAR ESTO
    });
  
  return { data, error };
};
```

### **2. PLANTILLAS - Asignar tenant_id automáticamente:**

```javascript
// En el código de creación de plantillas
const createPlantilla = async (plantillaData) => {
  const { data, error } = await supabase
    .from('plantillas')
    .insert({
      ...plantillaData,
      tenant_id: getCurrentTenantId() // 👈 AGREGAR ESTO
    });
  
  return { data, error };
};
```

### **3. PLANTILLAS_PRODUCTOS_TEMPLATE - Asignar tenant_id automáticamente:**

```javascript
// En el código de creación de plantillas_productos_template
const createPlantillaProducto = async (plantillaData) => {
  const { data, error } = await supabase
    .from('plantillas_productos_template')
    .insert({
      ...plantillaData,
      tenant_id: getCurrentTenantId() // 👈 AGREGAR ESTO
    });
  
  return { data, error };
};
```

### **4. SETTINGS - Asignar tenant_id automáticamente:**

```javascript
// En el código de creación de settings
const createSetting = async (settingData) => {
  const { data, error } = await supabase
    .from('settings')
    .insert({
      ...settingData,
      tenant_id: getCurrentTenantId() // 👈 AGREGAR ESTO
    });
  
  return { data, error };
};
```

### **5. SYSTEM_ALERTS - Asignar tenant_id automáticamente:**

```javascript
// En el código de creación de system_alerts
const createSystemAlert = async (alertData) => {
  const { data, error } = await supabase
    .from('system_alerts')
    .insert({
      ...alertData,
      tenant_id: getCurrentTenantId() // 👈 AGREGAR ESTO
    });
  
  return { data, error };
};
```

### **6. PAYMENT_TRANSACTIONS - Asignar evento_id automáticamente:**

```javascript
// En el código de creación de payment_transactions
const createPaymentTransaction = async (transactionData) => {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      ...transactionData,
      evento_id: getCurrentEventoId(), // 👈 AGREGAR ESTO
      tenant_id: getCurrentTenantId() // 👈 AGREGAR ESTO
    });
  
  return { data, error };
};
```

---

## 🎯 **FUNCIÓN AUXILIAR NECESARIA:**

```javascript
// Función para obtener el tenant_id actual
const getCurrentTenantId = () => {
  // Obtener del contexto de React
  const { currentTenant } = useTenantContext();
  return currentTenant?.id;
};

// Función para obtener el evento_id actual
const getCurrentEventoId = () => {
  // Obtener del contexto de eventos
  const { currentEvento } = useEventoContext();
  return currentEvento?.id;
};
```

---

## 📋 **ARCHIVOS A ACTUALIZAR:**

### **🔍 BUSCAR EN EL CÓDIGO:**
1. **`src/backoffice/services/`** - Servicios de API
2. **`src/backoffice/pages/`** - Páginas del dashboard
3. **`src/store/services/`** - Servicios del store
4. **`pages/api/`** - APIs del servidor

### **📝 PATRONES A BUSCAR:**
```javascript
// Buscar estos patrones:
.from('comisiones_tasas').insert(
.from('plantillas').insert(
.from('plantillas_productos_template').insert(
.from('settings').insert(
.from('system_alerts').insert(
.from('payment_transactions').insert(
```

---

## ⚠️ **IMPORTANTE:**

### **🔒 SEGURIDAD:**
- **Siempre validar** que el usuario tiene acceso al tenant
- **Usar RLS policies** para proteger los datos
- **Verificar permisos** antes de crear/actualizar

### **🧪 TESTING:**
- **Probar creación** de registros con tenant_id
- **Verificar que** no se crean registros sin tenant_id
- **Confirmar que** los filtros por tenant funcionan

---

## 🚀 **PRÓXIMOS PASOS:**

1. **Ejecutar script SQL** para corregir estructura de BD
2. **Actualizar código** para asignar tenant_id automáticamente
3. **Probar funcionalidad** completa
4. **Verificar que** no se crean registros sin tenant_id

**¿Quieres que busquemos en el código dónde se crean estos registros para actualizarlos?**
