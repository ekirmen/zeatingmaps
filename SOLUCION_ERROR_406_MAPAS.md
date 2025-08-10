# Solución para Error 406 en Tabla Mapas

## 🔍 Problema Identificado

El error `Failed to load resource: the server responded with a status of 406 ()` ocurre cuando la aplicación intenta acceder a la tabla `mapas` en Supabase. Este error indica que las políticas de **Row Level Security (RLS)** están bloqueando el acceso anónimo.

### 📋 Síntomas
- Error 406 al intentar cargar mapas
- Logs: `[fetchMapa] Usuario no autenticado, intentando acceso anónimo`
- Logs: `[fetchMapa] Error 406 - Posibles causas: 1. Políticas RLS bloqueando el acceso`

## 🛠️ Soluciones Disponibles

### Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar el script de diagnóstico
node scripts/diagnose-mapas-access.js

# Ejecutar el fix automático
node scripts/fix-mapas-rls.js
```

### Opción 2: SQL Manual

Ejecutar el archivo `fix_mapas_rls_simple.sql` directamente en Supabase SQL Editor.

### Opción 3: SQL Inmediato

```sql
-- Habilitar RLS
ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Enable all for authenticated users" ON mapas;
DROP POLICY IF EXISTS "Users can view mapas from their tenant" ON mapas;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON mapas;

-- Crear política para acceso anónimo
CREATE POLICY "Enable anonymous read access to mapas" ON mapas
    FOR SELECT USING (true);

-- Crear política para usuarios autenticados
CREATE POLICY "Enable authenticated access to mapas" ON mapas
    FOR ALL USING (auth.role() = 'authenticated');
```

## 🔧 Pasos para Resolver

### 1. Verificar Variables de Entorno

Asegúrate de tener en tu archivo `.env`:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 2. Ejecutar Diagnóstico

```bash
node scripts/diagnose-mapas-access.js
```

Este script te dará un reporte completo del estado de la tabla y las políticas RLS.

### 3. Aplicar la Solución

```bash
node scripts/fix-mapas-rls.js
```

### 4. Verificar la Solución

Reinicia tu aplicación React y verifica que el error 406 haya desaparecido.

## 📊 ¿Qué Hace la Solución?

1. **Habilita RLS** en la tabla `mapas` si no está habilitado
2. **Elimina políticas conflictivas** que bloquean el acceso anónimo
3. **Crea una política permisiva** para acceso de lectura anónimo
4. **Mantiene seguridad** para operaciones de escritura (solo usuarios autenticados)

## 🚨 Consideraciones de Seguridad

- ✅ **Lectura anónima**: Permitida para mapas (necesario para la funcionalidad pública)
- ✅ **Escritura**: Solo usuarios autenticados
- ✅ **RLS habilitado**: Mantiene la seguridad a nivel de fila
- ⚠️ **Acceso público**: Los mapas serán visibles para todos los visitantes

## 🔍 Verificación Post-Solución

Después de aplicar la solución, deberías ver:

```javascript
// En lugar de error 406, deberías obtener:
{
  data: [...], // Array con los mapas
  error: null,
  status: 200
}
```

## 📞 Soporte

Si el problema persiste después de aplicar la solución:

1. Ejecuta el diagnóstico completo
2. Revisa los logs de Supabase
3. Verifica que las variables de entorno sean correctas
4. Asegúrate de que la tabla `mapas` existe y tiene la estructura correcta

## 📚 Archivos Relacionados

- `scripts/diagnose-mapas-access.js` - Diagnóstico completo
- `scripts/fix-mapas-rls.js` - Fix automático
- `fix_mapas_rls_simple.sql` - SQL manual
- `src/store/services/apistore.js` - Servicio que falla
- `src/utils/databaseDiagnostics.js` - Utilidades de diagnóstico
