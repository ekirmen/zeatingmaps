# Resumen de Código que se Puede Eliminar

## ✅ Archivos Eliminados (Completado)

1. ✅ `src/backoffice/BackofficeApp.jsx.backup`
2. ✅ `src/components/CrearMapa/CrearMapaEditor.jsx.cleaned`
3. ✅ `src/backoffice/components/CrearMapa/CrearMapaMain.jsx.backup`
4. ✅ `cleanup_unused_code.js`
5. ✅ `scripts/cleanup-crear-mapa-editor.js`
6. ✅ `scripts/analyze-crear-mapa-editor.js`

**Total eliminado:** 6 archivos (~150KB)

## 🧹 Archivos Limpiados

1. ✅ `src/backoffice/pages/CompBoleteria/ZonesAndPrices.js`
   - Eliminados imports comentados
   - Eliminados console.logs de debug
   - Eliminado código comentado innecesario
   - **Reducción:** ~150 líneas

## 📊 Código que se Puede Eliminar

### 1. Console.logs Excesivos (2,135 logs en 277 archivos)

**Top 10 archivos con más logs:**
1. `src/components/seatLockStore.js` - 101 logs
2. `src/backoffice/pages/CrearMapaPage.jsx` - 81 logs
3. `src/store/services/apistore.js` - 72 logs
4. `src/backoffice/pages/Funciones.js` - 68 logs
5. `src/backoffice/services/apibackoffice.js` - 47 logs
6. `src/backoffice/hooks/usemapaloadingsaving.js` - 44 logs
7. `src/store/pages/EventosPage.js` - 39 logs
8. `src/components/CrearMapa/CrearMapaEditor.jsx` - 31 logs
9. `src/utils/downloadTicket.js` - 31 logs
10. `src/services/transactionRollbackService.js` - 30 logs

**Estrategia:** 
- Eliminar ~70% de console.logs (mantener solo errores críticos)
- Reemplazar con `logger` utility cuando sea necesario
- **Reducción estimada:** ~200KB

### 2. Código Comentado (Por eliminar)

**Archivos con mucho código comentado:**
- `src/backoffice/pages/CompBoleteria/ZonesAndPrices.js` - Ya limpiado parcialmente
- `src/backoffice/pages/Funciones.js` - Revisar código comentado
- `src/components/CrearMapa/CrearMapaEditor.jsx` - Revisar código comentado

**Estrategia:** Eliminar bloques grandes de código comentado que ya no se usan
- **Reducción estimada:** ~100KB

### 3. Archivos Duplicados (Consolidar)

**Componentes duplicados:**
- `src/components/CrearMapa/ImageUploader.jsx` y `src/backoffice/components/CrearMapa/ImageUploader.jsx`
- `src/components/CrearMapa/BackgroundImageManager.jsx` y `src/backoffice/components/CrearMapa/BackgroundImageManager.jsx`
- `src/components/CrearMapa/SeatingLite.jsx` y `src/backoffice/components/CrearMapa/SeatingLite.jsx`

**ErrorBoundary duplicados:**
- `src/components/TenantErrorBoundary.js`
- `src/components/TenantErrorBoundary.jsx`
- `src/backoffice/components/ErrorBoundary.jsx`
- `src/backoffice/pages/CompBoleteria/ErrorBoundary.jsx`

**Estrategia:** Consolidar en un solo componente compartido
- **Reducción estimada:** ~200KB

### 4. Servicios Duplicados

**API Services duplicados:**
- `src/services/apistore.js` y `src/store/services/apistore.js`
- `src/services/supabaseServices.js` y múltiples variantes

**Configuraciones duplicadas:**
- `src/utils/apiConfig.js`
- `src/config/apiConfig.js`
- `src/config/apiEndpoints.js`

**Estrategia:** Consolidar servicios similares
- **Reducción estimada:** ~300KB

### 5. Hooks Obsoletos

**Hooks que pueden consolidarse:**
- `src/hooks/useTenantFilter.js` - Ahora se usa `useTenant`
- `src/hooks/useMultiTenant.js` - Consolidar con `useTenant`

**Estrategia:** Migrar a hooks optimizados y eliminar obsoletos
- **Reducción estimada:** ~50KB

## 📈 Estimación Total de Reducción

| Categoría | Reducción Estimada |
|-----------|-------------------|
| Archivos eliminados | ~150KB ✅ |
| Console.logs reducidos | ~200KB |
| Código comentado eliminado | ~100KB |
| Archivos duplicados consolidados | ~200KB |
| Servicios duplicados consolidados | ~300KB |
| Hooks obsoletos | ~50KB |
| **TOTAL** | **~1MB** |

## 🚀 Scripts Disponibles

1. **`scripts/cleanup-code.js`** - Elimina archivos backup y limpia imports comentados
2. **`scripts/reduce-console-logs.js`** - Reduce console.logs de desarrollo (pendiente ejecutar)

## ⚠️ Advertencias

- **NO eliminar** archivos sin verificar dependencias
- **Hacer backup** antes de eliminar código
- **Probar** después de cada fase de limpieza
- **Usar git** para poder revertir cambios

## ✅ Próximos Pasos

1. ✅ Ejecutar `scripts/cleanup-code.js` - **COMPLETADO**
2. ⚠️ Ejecutar `scripts/reduce-console-logs.js` (requiere revisión)
3. ⚠️ Consolidar componentes duplicados (requiere testing)
4. ⚠️ Consolidar servicios (requiere testing)

