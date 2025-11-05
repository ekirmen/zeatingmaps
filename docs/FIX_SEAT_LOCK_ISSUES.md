# 🔧 Solución de Problemas: Bloqueo de Asientos y Realtime

## 📋 Resumen de Problemas Detectados

1. ✅ **RLS está habilitado** - Confirmado
2. ❌ **Función RPC `lock_seat_atomically` no existe** - Necesita ser creada
3. ❓ **Realtime puede no estar habilitado** - Necesita verificación
4. ❓ **Replication identity puede no estar en 'full'** - Necesita verificación

## 🚀 Pasos para Solucionar

### Paso 1: Verificar Estado Actual

Ejecuta en Supabase SQL Editor el archivo:
```
supabase/migrations/check_realtime_status.sql
```

Esto te mostrará:
- El estado de replication identity
- Si la función `lock_seat_atomically` existe
- Las políticas RLS
- Si RLS está habilitado

### Paso 2: Verificar Funciones Existentes (Opcional)

Si quieres ver qué funciones existen actualmente, ejecuta:
```
supabase/migrations/check_existing_functions.sql
```

Esto te mostrará todas las versiones (sobrecargas) de las funciones.

### Paso 3: Crear las Funciones RPC

Ejecuta en Supabase SQL Editor (en este orden):

1. **Primero**: `supabase/migrations/create_lock_seat_atomically_function.sql`
   - **Nota**: Este script elimina TODAS las versiones existentes de la función antes de crear la nueva
   - Crea la función `lock_seat_atomically` que bloquea asientos de forma atómica

2. **Segundo**: `supabase/migrations/create_unlock_seat_atomically_function.sql`
   - **Nota**: Este script elimina TODAS las versiones existentes de la función antes de crear la nueva
   - Crea la función `unlock_seat_atomically` que desbloquea asientos

### Paso 4: Habilitar Realtime

Ejecuta en Supabase SQL Editor:
```
supabase/migrations/enable_realtime_for_seat_locks.sql
```

Esto configurará `REPLICA IDENTITY FULL` para la tabla `seat_locks`.

### Paso 5: Habilitar Realtime en Supabase Dashboard

**IMPORTANTE**: También necesitas habilitar Realtime desde el Dashboard:

1. Ve a **Supabase Dashboard** → **Database** → **Replication**
2. Busca la tabla `seat_locks`
3. **Habilita Realtime** para esa tabla (toggle o botón)

### Paso 6: Verificar que Todo Funciona

Ejecuta de nuevo `check_realtime_status.sql` y verifica:

✅ **Replication identity** debe ser `'full'` (FULL)
✅ **Función `lock_seat_atomically`** debe aparecer en los resultados
✅ **RLS** debe estar `true`

### Paso 7: Probar en la Aplicación

1. **Recarga ambos navegadores** (Ctrl+F5)
2. **Abre la consola** (F12)
3. **Selecciona un asiento** en un navegador
4. **Verifica en el otro navegador**:
   - Deberías ver: `✅ [SEAT_LOCK_STORE] Suscrito exitosamente a Realtime`
   - Deberías ver: `🔔 [SEAT_LOCK_STORE] Evento recibido`
   - El asiento debería aparecer en **naranja** (seleccionado por otro)

## 🔍 Verificación de Funciones RPC

Para verificar que las funciones se crearon correctamente:

```sql
-- Verificar lock_seat_atomically
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'lock_seat_atomically'
  AND n.nspname = 'public';

-- Verificar unlock_seat_atomically
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'unlock_seat_atomically'
  AND n.nspname = 'public';
```

## 🐛 Solución de Problemas

### Error: "function lock_seat_atomically does not exist"

**Solución**: Ejecuta `create_lock_seat_atomically_function.sql`

### Error: "function name is not unique"

**Solución**: Los scripts actualizados ahora eliminan TODAS las versiones de la función antes de crear la nueva. Si aún ves este error:
1. Ejecuta `check_existing_functions.sql` para ver qué versiones existen
2. Elimina manualmente las versiones antiguas si es necesario
3. Ejecuta de nuevo `create_lock_seat_atomically_function.sql`

### Error 400 en lock_seat_atomically

**Posibles causas**:
1. La función no existe → Ejecuta `create_lock_seat_atomically_function.sql`
2. Parámetros incorrectos → Verifica que los parámetros coincidan
3. Permisos insuficientes → Verifica que las políticas RLS permitan INSERT/UPDATE

### Eventos Realtime no se reciben

**Pasos a verificar**:
1. ✅ Replication identity es `'full'` → Ejecuta `enable_realtime_for_seat_locks.sql`
2. ✅ Realtime habilitado en Dashboard → Ve a Database → Replication
3. ✅ RLS está habilitado → Confirmado
4. ✅ Políticas RLS permiten SELECT → Verifica con `check_realtime_status.sql`

### Asiento no cambia de color en otros navegadores

**Pasos a verificar**:
1. ✅ Realtime está habilitado y funcionando
2. ✅ Los eventos se están recibiendo (ver logs en consola)
3. ✅ El `session_id` es diferente en cada navegador
4. ✅ El `tenant_id` es el mismo en ambos navegadores

## 📝 Notas Importantes

- **Las funciones RPC son atómicas**: Previenen condiciones de carrera entre múltiples usuarios
- **Realtime requiere REPLICA IDENTITY FULL**: Necesario para que los eventos funcionen correctamente
- **Realtime debe estar habilitado en Dashboard**: No es suficiente solo con SQL
- **RLS debe estar habilitado**: Requerido para Realtime

## ✅ Checklist Final

- [ ] Ejecutado `check_realtime_status.sql` y verificado estado
- [ ] Ejecutado `create_lock_seat_atomically_function.sql`
- [ ] Ejecutado `create_unlock_seat_atomically_function.sql`
- [ ] Ejecutado `enable_realtime_for_seat_locks.sql`
- [ ] Habilitado Realtime en Supabase Dashboard para `seat_locks`
- [ ] Verificado que replication identity es `'full'`
- [ ] Verificado que las funciones RPC existen
- [ ] Recargado ambos navegadores (Ctrl+F5)
- [ ] Probado selección de asientos entre navegadores
- [ ] Verificado que los eventos se reciben en consola
- [ ] Verificado que los colores se sincronizan correctamente

