# 🔧 SOLUCIÓN: Los Recintos Desaparecen Después de Actualizar

## 📋 Descripción del Problema

**Síntoma:** Puedes ver los recintos inicialmente, pero después de actualizar la página o recargar, desaparecen y no puedes ver ninguno.

**Causa Raíz:** El problema está en el aislamiento de tenants (multi-tenancy) implementado con Row Level Security (RLS) en Supabase. Las políticas RLS están filtrando por `tenant_id`, pero el frontend no está pasando este parámetro en las consultas.

## 🔍 Diagnóstico

### 1. Verificar el Estado Actual

Ejecuta el script de diagnóstico en Supabase SQL Editor:

```sql
-- Ejecutar en Supabase SQL Editor
\i diagnose_tenant_isolation.sql
```

Este script verificará:
- Estado de RLS en las tablas
- Políticas activas
- Datos de tenants
- Recintos y sus tenant_id
- Perfiles de usuarios

### 2. Identificar el Problema

El diagnóstico mostrará si:
- ✅ RLS está habilitado correctamente
- ✅ Las políticas están activas
- ❌ Los recintos tienen tenant_id NULL
- ❌ Los usuarios tienen tenant_id NULL
- ❌ Las políticas están mal configuradas

## 🛠️ Solución Completa

### Paso 1: Ejecutar el Script de Corrección

Ejecuta el script de solución en Supabase SQL Editor:

```sql
-- Ejecutar en Supabase SQL Editor
\i fix_tenant_isolation_simple.sql
```

Este script:
1. Corrige `tenant_id` faltante en recintos, salas, eventos y funciones
2. Habilita RLS en todas las tablas críticas
3. Crea políticas RLS correctas y simples
4. Verifica que todo esté funcionando

### Paso 2: Verificar en el Frontend

El código del frontend ya ha sido corregido para:
- Usar el contexto del tenant correctamente
- Pasar `tenant_id` en las consultas de Supabase
- Manejar casos de desarrollo (localhost)

### Paso 3: Recargar la Aplicación

1. Recarga la página del backoffice
2. Verifica que los recintos sean visibles
3. Prueba crear/editar/eliminar recintos

## 🔧 Cambios Realizados en el Código

### 1. RecintoContext.js

```javascript
// Antes: Consulta simple sin filtro de tenant
const { data, error } = await supabase
  .from('recintos')
  .select('*, salas(*)');

// Después: Consulta con filtro de tenant
let query = supabase
  .from('recintos')
  .select('*, salas(*)');

if (currentTenant?.id) {
  query = query.eq('tenant_id', currentTenant.id);
}
```

### 2. RecintoSalaContext.js

```javascript
// Misma corrección aplicada
// Ahora filtra por tenant_id correctamente
```

### 3. Políticas RLS

```sql
-- Política simple y efectiva
CREATE POLICY "Enable read access for authenticated users" ON recintos
FOR SELECT USING (
    auth.role() = 'authenticated' AND (
        tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
        OR
        tenant_id IS NULL  -- Para desarrollo
    )
);
```

## 🧪 Verificación

### 1. Verificar en la Consola del Navegador

Deberías ver logs como:
```
🔍 [RecintoContext] Obteniendo recintos para tenant: [UUID]
✅ [RecintoContext] Filtrando por tenant_id: [UUID]
✅ [RecintoContext] Recintos obtenidos: [N]
```

### 2. Verificar en Supabase

```sql
-- Verificar que las políticas estén activas
SELECT policyname, enabled 
FROM pg_policies 
WHERE tablename = 'recintos';

-- Verificar recintos por tenant
SELECT t.subdomain, COUNT(r.id) 
FROM tenants t 
LEFT JOIN recintos r ON t.id = r.tenant_id 
GROUP BY t.id, t.subdomain;
```

## 🚨 Solución de Problemas

### Problema: Sigue sin funcionar

1. **Verificar autenticación:**
   ```javascript
   // En la consola del navegador
   console.log('Current tenant:', window.__TENANT_CONTEXT__?.currentTenant);
   ```

2. **Verificar políticas RLS:**
   ```sql
   -- En Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'recintos';
   ```

3. **Verificar tenant_id del usuario:**
   ```sql
   -- En Supabase SQL Editor
   SELECT id, email, tenant_id FROM profiles WHERE id = '[USER_ID]';
   ```

### Problema: Error de permisos

1. **Verificar que RLS esté habilitado:**
   ```sql
   ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
   ```

2. **Verificar que las políticas estén activas:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'recintos';
   ```

## 📚 Archivos Modificados

- `src/backoffice/contexts/RecintoContext.js` - Filtrado por tenant
- `src/backoffice/contexts/RecintoSalaContext.js` - Filtrado por tenant
- `diagnose_tenant_isolation.sql` - Script de diagnóstico
- `fix_tenant_isolation_simple.sql` - Script de solución (corregido)

## 🔄 Flujo de Trabajo

1. **Diagnóstico:** Ejecutar `diagnose_tenant_isolation.sql`
2. **Solución:** Ejecutar `fix_tenant_isolation_simple.sql`
3. **Verificación:** Recargar la aplicación y verificar logs
4. **Pruebas:** Crear/editar/eliminar recintos

## ✅ Resultado Esperado

Después de aplicar la solución:
- ✅ Los recintos son visibles al cargar la página
- ✅ Los recintos permanecen visibles después de actualizar
- ✅ El aislamiento de tenants funciona correctamente
- ✅ Las políticas RLS están activas y funcionando
- ✅ El frontend filtra correctamente por tenant_id

## 🆘 Soporte

Si el problema persiste:
1. Revisar los logs en la consola del navegador
2. Verificar el estado de RLS en Supabase
3. Ejecutar el script de diagnóstico nuevamente
4. Verificar que el usuario autenticado tenga tenant_id válido
