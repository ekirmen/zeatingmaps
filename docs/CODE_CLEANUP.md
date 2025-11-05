# Código que se puede Eliminar para Reducir Tamaño

Este documento lista todo el código que se puede eliminar de forma segura para reducir el tamaño del proyecto.

## 📁 Archivos de Backup y Limpieza (Eliminar)

### Archivos .backup
```bash
src/backoffice/BackofficeApp.jsx.backup
src/backoffice/components/CrearMapa/CrearMapaMain.jsx.backup
```

### Archivos .cleaned
```bash
src/components/CrearMapa/CrearMapaEditor.jsx.cleaned
```

**Acción:** Eliminar estos archivos (son copias de seguridad o versiones limpiadas)

## 🗑️ Código Duplicado (Consolidar)

### 1. Componentes CrearMapa Duplicados
- `src/components/CrearMapa/CrearMapaEditor.jsx` (duplicado)
- `src/backoffice/components/CrearMapa/CrearMapaEditor.jsx` (mantener)

**Acción:** Eliminar el duplicado en `components/`

### 2. Servicios de API Duplicados
- `src/services/apistore.js` y `src/store/services/apistore.js`
- `src/services/supabaseServices.js` y múltiples servicios similares

**Acción:** Consolidar en un solo servicio

### 3. Componentes de Error Boundary Duplicados
- `src/components/TenantErrorBoundary.js`
- `src/components/TenantErrorBoundary.jsx`
- `src/backoffice/components/ErrorBoundary.jsx`
- `src/backoffice/pages/CompBoleteria/ErrorBoundary.jsx`

**Acción:** Consolidar en un solo componente reutilizable

## 🧹 Console.logs (Reducir)

**Total encontrado:** ~2,135 console.logs en 277 archivos

**Estrategia:**
1. Eliminar console.logs de desarrollo (mantener solo errores críticos)
2. Reemplazar con logger utility cuando sea necesario
3. Eliminar logs excesivos de debugging

**Archivos con más console.logs:**
- `src/backoffice/pages/Funciones.js` - 68 logs
- `src/backoffice/pages/CompBoleteria/PaymentModal.js` - 19 logs
- `src/store/services/apistore.js` - 72 logs
- `src/backoffice/services/apibackoffice.js` - 47 logs

**Acción:** Eliminar ~70% de console.logs (mantener solo errores críticos)

## 📝 Código Comentado (Eliminar)

Buscar y eliminar:
- Bloques de código comentados grandes
- Funciones comentadas que ya no se usan
- Imports comentados

**Ejemplo encontrado:**
- `src/backoffice/pages/CompBoleteria/ZonesAndPrices.js` tiene imports comentados

## 🔧 Funciones No Utilizadas

### Servicios que pueden no usarse:
```javascript
// Verificar si se usan:
src/services/backupService.js
src/saas/services/backupService.js
```

### Hooks duplicados:
- `src/hooks/useTenantFilter.js` - ahora se usa `useTenant`
- `src/hooks/useMultiTenant.js` - consolidar con `useTenant`

## 📦 Archivos de Configuración Duplicados

### API Config duplicado:
- `src/utils/apiConfig.js`
- `src/config/apiConfig.js`
- `src/config/apiEndpoints.js`

**Acción:** Consolidar en un solo archivo

## 🎨 Componentes Duplicados

### ImageUploader duplicado:
- `src/components/CrearMapa/ImageUploader.jsx`
- `src/backoffice/components/CrearMapa/ImageUploader.jsx`

**Acción:** Mantener solo uno y compartir

### SeatingMap duplicado:
- `src/components/SeatingMapUnified.jsx`
- `src/components/SeatingMap.js`
- `src/backoffice/components/SimpleSeatingMap.jsx`
- `src/backoffice/pages/CompBoleteria/components/SimpleSeatingMap.jsx`

**Acción:** Consolidar variantes

## 🧪 Archivos de Test/Prueba (Si existen)
```bash
# Buscar y eliminar si existen:
**/*.test.js
**/*.spec.js
**/*_test.js
**/*_spec.js
```

## 📋 Scripts de Limpieza (Ya no necesarios)
```bash
cleanup_unused_code.js
scripts/cleanup-crear-mapa-editor.js
```

**Acción:** Eliminar después de ejecutar la limpieza

## 🔍 Código con TODO/FIXME (371 matches)

**Recomendación:**
- Resolver TODOs críticos
- Eliminar TODOs obsoletos
- Documentar FIXMEs necesarios

## 📊 Estimación de Reducción

| Categoría | Archivos | Tamaño Estimado | Estado |
|-----------|----------|-----------------|--------|
| Archivos .backup/.cleaned | 2 | ~50KB | ✅ Eliminados |
| Console.logs eliminados | ~277 archivos | ~200KB | ⚠️ Pendiente |
| Código duplicado | ~20 archivos | ~500KB | ⚠️ Pendiente |
| Código comentado | ~30 archivos | ~100KB | 🔄 En progreso |
| **TOTAL** | **~330 archivos** | **~850KB** | |

## ✅ Archivos Ya Eliminados

1. ✅ `src/backoffice/BackofficeApp.jsx.backup`
2. ✅ `src/components/CrearMapa/CrearMapaEditor.jsx.cleaned`

## 🚀 Plan de Acción

### Fase 1: Eliminación Segura (Inmediata)
1. ✅ Eliminar archivos .backup y .cleaned - **COMPLETADO**
2. ⚠️ Eliminar scripts de limpieza (después de ejecutar)
3. 🔄 Eliminar imports comentados - **EN PROGRESO**

### Fase 2: Consolidación (Requiere Testing)
1. ⚠️ Consolidar componentes duplicados
2. ⚠️ Consolidar servicios duplicados
3. ⚠️ Consolidar configuraciones

### Fase 3: Optimización (Requiere Testing Extensivo)
1. ⚠️ Reducir console.logs
2. ⚠️ Eliminar código comentado
3. ⚠️ Resolver/eliminar TODOs

## ⚠️ Advertencias

- **NO eliminar** archivos sin verificar dependencias
- **Hacer backup** antes de eliminar código
- **Probar** después de cada fase de limpieza
- **Usar git** para poder revertir cambios

