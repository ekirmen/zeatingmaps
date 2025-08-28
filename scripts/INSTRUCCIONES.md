# 🧹 Instrucciones para Limpiar Campos JSON Corruptos

## 🚨 Problema Identificado

El campo `imagenes` en la tabla `eventos` está corrupto y contiene **177 propiedades numeradas** (del 0 al 176) que están causando que aparezcan números del 0 al 1000+ en la interfaz.

## 🔧 Solución Paso a Paso

### **Paso 1: Verificar la Estructura de la Tabla**

Primero, ejecuta este script para ver qué columnas existen realmente:

```sql
-- Copiar y pegar en tu cliente SQL (pgAdmin, DBeaver, etc.)
\i scripts/check-table-structure.sql
```

### **Paso 2: Limpiar Solo el Campo 'imagenes' (Recomendado)**

Si solo quieres limpiar el campo corrupto que está causando el problema:

```sql
-- Copiar y pegar en tu cliente SQL
\i scripts/clean-imagenes-only.sql
```

### **Paso 3: Limpiar Todos los Campos JSON (Opcional)**

Si quieres limpiar todos los campos JSON potencialmente corruptos:

```sql
-- Copiar y pegar en tu cliente SQL
\i scripts/clean-corrupted-json.sql
```

## 🎯 **Script Recomendado para Iniciar**

```sql
-- 1. Verificar qué eventos tienen el campo 'imagenes' corrupto
SELECT 
  id,
  nombre,
  "imagenes"::text as imagenes_raw
FROM eventos 
WHERE "imagenes"::text ~ '"[0-9]+"';

-- 2. Limpiar el campo corrupto
UPDATE eventos 
SET "imagenes" = '{}' 
WHERE "imagenes"::text ~ '"[0-9]+"';

-- 3. Verificar que se limpió
SELECT 
  id,
  nombre,
  "imagenes"::text as imagenes_after_cleanup
FROM eventos 
WHERE id = 'b0b48dd8-7c52-462a-8c79-b00129422810';
```

## ✅ **Verificación**

Después de ejecutar el script:

1. **Recarga la página** del evento en tu aplicación
2. **Verifica que los números del 0 al 1000+ hayan desaparecido**
3. **Revisa la consola** del navegador para confirmar que no hay errores

## 🚀 **Prevención Automática**

Una vez limpiados los datos corruptos, **la prevención automática ya está implementada** en el código:

- ✅ **Al cargar**: Se limpian automáticamente campos corruptos
- ✅ **Al guardar**: Se validan antes de enviar a la base de datos
- ✅ **Al editar**: Se limpian al abrir el evento

## ⚠️ **Notas Importantes**

- **Haz backup** de tu base de datos antes de ejecutar los scripts
- **Ejecuta primero** el script de verificación para entender la estructura
- **Si hay errores**, revisa que los nombres de las columnas coincidan
- **Los campos corruptos** se reemplazan con valores por defecto válidos

## 🆘 **Si Hay Errores**

Si sigues teniendo problemas:

1. **Verifica la estructura** de tu tabla con `\d eventos` (en psql)
2. **Revisa los nombres** exactos de las columnas
3. **Ajusta los scripts** según tu estructura real
4. **Contacta al equipo** de desarrollo si es necesario

## 🎉 **Resultado Esperado**

Después de la limpieza:
- ❌ **Antes**: Números del 0 al 1000+ en "Datos del Comprador Obligatorios"
- ✅ **Después**: Solo los campos válidos se muestran correctamente
- 🛡️ **Prevención**: No se pueden guardar campos corruptos en el futuro
