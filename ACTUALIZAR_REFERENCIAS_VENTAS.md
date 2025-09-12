# 🔄 ACTUALIZAR REFERENCIAS: VENTAS → SALES

## 📋 **CAMBIOS REALIZADOS**

### **🗑️ TABLA ELIMINADA:**
- `ventas` → **ELIMINADA** (estaba vacía y era redundante)

### **✅ TABLA PRINCIPAL:**
- `sales` → **MANTENER** (ya existe y es la tabla principal de ventas)
- `payments` → **MANTENER** (tabla de transacciones de pago)

---

## 🔧 **ARCHIVOS A ACTUALIZAR**

### **1. APIs que usaban `ventas` (CAMBIAR A `sales`):**
```javascript
// ANTES:
.from('ventas')

// DESPUÉS:
.from('sales')
```

**Archivos:**
- `pages/api/analytics/sales-report.js` (línea 29)
- `pages/api/saas/dashboard-stats.js` (líneas 50, 82, 95)
- `pages/api/grid-sale/process-sale.js` (línea 52)

### **2. Servicios que usaban `ventas` (CAMBIAR A `sales`):**
```javascript
// ANTES:
supabase.from('ventas').select('*', { count: 'exact', head: true })

// DESPUÉS:
supabase.from('sales').select('*', { count: 'exact', head: true })
```

**Archivos:**
- `src/saas/services/analyticsService.js` (líneas 29, 69)
- `src/backoffice/pages/SaasDashboard.jsx` (líneas 253, 1471)

### **3. APIs que usan `payments` (MANTENER COMO ESTÁ):**
```javascript
// MANTENER:
.from('payments')
```

**Archivos (NO CAMBIAR):**
- `api/payments/[locator]/download.js` (líneas 93, 501)
- `src/backoffice/hooks/useClientManagement.js` (líneas 92, 150)
- `src/backoffice/services/scheduledReportsService.js` (líneas 200, 227)
- `src/backoffice/pages/Reports.js` (líneas 116, 193)
- `src/backoffice/services/apibackoffice.js` (líneas 396, 441, 1195)

---

## 🚀 **COMANDOS DE BÚSQUEDA Y REEMPLAZO**

### **Buscar referencias a `ventas`:**
```bash
grep -r "\.from(['\"]ventas['\"]" src/ pages/
```

### **Buscar referencias a `payments`:**
```bash
grep -r "\.from(['\"]payments['\"]" src/ pages/
```

### **Reemplazar en todos los archivos:**
```bash
# SOLO reemplazar 'ventas' por 'sales' (NO tocar 'payments')
find src/ pages/ -name "*.js" -o -name "*.jsx" | xargs sed -i 's/\.from(['\''"]ventas['\''"]/\.from(['\''"]sales['\''"]/g'
```

---

## ⚠️ **IMPORTANTE**

1. **Ejecutar primero** `MIGRACION_ELIMINAR_VENTAS.sql`
2. **Luego actualizar** todas las referencias en el código
3. **Probar** que todo funcione correctamente
4. **Verificar** que los reportes de ventas funcionen

---

## ✅ **BENEFICIOS**

- **Eliminación de redundancia** - Una sola tabla de ventas
- **Código más limpio** - Sin confusión sobre qué tabla usar
- **Mejor rendimiento** - Menos tablas que consultar
- **Mantenimiento simplificado** - Una sola fuente de verdad
