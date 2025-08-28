# Solución: Entradas no se ven en Plantilla de Precios

## 🚨 **Problema identificado:**

Las entradas no se muestran en la plantilla de precios porque:
1. **No tienen `tenant_id` asignado** en la base de datos
2. **El filtro por tenant** no funciona correctamente
3. **Las entradas existentes** no están asociadas al tenant del usuario

## 🔧 **Solución implementada:**

### **1. Script SQL para actualizar entradas existentes**

Ejecuta este script en tu base de datos Supabase:

```sql
-- Script para asignar tenant_id a las entradas existentes
-- Ejecutar este script en tu base de datos Supabase

-- 1. Verificar entradas sin tenant_id
SELECT id, nombre_entrada, recinto, tenant_id
FROM public.entradas
WHERE tenant_id IS NULL;

-- 2. Actualizar entradas existentes asignándoles el tenant_id del recinto
-- Reemplaza '9dbdb86f-8424-484c-bb76-0d9fa27573c8' con tu tenant_id real
UPDATE public.entradas
SET tenant_id = (
  SELECT r.tenant_id 
  FROM public.recintos r 
  WHERE r.id = entradas.recinto
)
WHERE tenant_id IS NULL;

-- 3. Verificar que se actualizaron correctamente
SELECT 
  e.id,
  e.nombre_entrada,
  e.recinto,
  e.tenant_id,
  r.nombre as nombre_recinto,
  r.tenant_id as recinto_tenant_id
FROM public.entradas e
JOIN public.recintos r ON e.recinto = r.id
ORDER BY e.recinto, e.nombre_entrada;

-- 4. Verificar el resultado final
SELECT 
  COUNT(*) as total_entradas,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as entradas_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as entradas_sin_tenant
FROM public.entradas;

-- 5. Si hay entradas sin recinto válido, asignar tenant_id manualmente
-- (Solo si es necesario)
UPDATE public.entradas
SET tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
WHERE tenant_id IS NULL;
```

### **2. Servicios actualizados con filtrado por tenant**

Los servicios de entradas ahora:
- ✅ **Filtran por tenant_id** automáticamente
- ✅ **Asignan tenant_id** al crear nuevas entradas
- ✅ **Validan tenant_id** al actualizar/eliminar entradas
- ✅ **Incluyen logs de debug** para verificar el funcionamiento

### **3. Plantilla de precios mejorada**

La plantilla ahora:
- ✅ **Muestra entradas filtradas por tenant**
- ✅ **Incluye logs de debug** para verificar la carga
- ✅ **Maneja errores** de manera más robusta

## 📋 **Pasos para implementar la solución:**

### **Paso 1: Ejecutar el script SQL**
1. Ve a tu **Dashboard de Supabase**
2. Abre **SQL Editor**
3. Copia y pega el script SQL de arriba
4. **Reemplaza** `'9dbdb86f-8424-484c-bb76-0d9fa27573c8'` con tu `tenant_id` real
5. Ejecuta el script

### **Paso 2: Verificar la actualización**
1. Ejecuta la consulta de verificación:
```sql
SELECT 
  COUNT(*) as total_entradas,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as entradas_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as entradas_sin_tenant
FROM public.entradas;
```

2. Deberías ver:
   - `entradas_sin_tenant: 0`
   - `entradas_con_tenant: [número total]`

### **Paso 3: Probar la plantilla de precios**
1. Ve a `https://sistema.veneventos.com/dashboard/plantillas-precios`
2. Selecciona un recinto y sala
3. Haz clic en "Añadir Plantilla" o "Editar"
4. **Verifica en la consola** que aparezcan los logs:
   ```
   🔍 [PlantillaPrecios] Entradas cargadas para recinto: [ID] Total: [número]
   🔍 [PlantillaPrecios] Detalles de entradas: [array con entradas]
   ```

## 🔍 **Verificación del funcionamiento:**

### **En la consola del navegador deberías ver:**
```
🔍 [apibackoffice] Obteniendo entradas para tenant: [tenant_id]
🔍 [apibackoffice] Entradas obtenidas: [array de entradas]
🔍 [PlantillaPrecios] Entradas cargadas para recinto: [ID] Total: [número]
🔍 [PlantillaPrecios] Detalles de entradas: [detalles de cada entrada]
```

### **Si las entradas siguen sin aparecer:**
1. **Verifica que el script SQL se ejecutó correctamente**
2. **Confirma que las entradas tienen tenant_id válido**
3. **Revisa que el usuario esté autenticado**
4. **Verifica que el perfil del usuario tenga tenant_id**

## 🎯 **Resultado esperado:**

Después de implementar la solución:
- ✅ **Las entradas se muestran** en la plantilla de precios
- ✅ **El filtrado por tenant funciona** correctamente
- ✅ **Los logs de debug** muestran información detallada
- ✅ **La seguridad por tenant** está implementada

## 🚀 **Próximos pasos:**

1. **Ejecuta el script SQL** para actualizar entradas existentes
2. **Prueba la plantilla** de precios
3. **Verifica los logs** en la consola
4. **Reporta cualquier problema** que persista

¿Necesitas ayuda para ejecutar el script SQL o tienes alguna pregunta sobre la implementación?
