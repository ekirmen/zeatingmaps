# Cómo Habilitar Supabase Realtime para seat_locks

## ⚠️ IMPORTANTE

Para que los eventos en tiempo real funcionen entre navegadores, **Supabase Realtime debe estar habilitado** para la tabla `seat_locks`.

## 📋 Pasos para Habilitar Realtime

### 1. Ir a Supabase Dashboard

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Database** → **Replication**

### 2. Habilitar Realtime para seat_locks

1. En la página de **Replication**, busca la tabla `seat_locks`
2. Si no está habilitada, verás un toggle o botón para habilitarla
3. **Habilita Realtime** para la tabla `seat_locks`

### 3. Verificar que está habilitado

En la página de Replication, deberías ver:
- ✅ `seat_locks` con estado "Enabled" o "Activo"

### 4. Verificar en Database Settings

1. Ve a **Database** → **Settings**
2. Busca la sección **Realtime**
3. Verifica que esté habilitado globalmente

## 🔍 Verificación con SQL

Puedes verificar si Realtime está habilitado ejecutando esto en SQL Editor:

```sql
-- Verificar replication identity de la tabla
SELECT 
  c.relname AS tablename,
  c.relreplident AS replication_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';
```

Si `replication_identity` es `'d'` (default) o `'f'` (full), Realtime debería funcionar.

**Valores posibles:**
- `'d'` = default (puede funcionar, pero no es óptimo)
- `'f'` = full (recomendado para Realtime)
- `'n'` = nothing (no funciona con Realtime)
- `'i'` = index (funciona, pero requiere índice único)

## 🚨 Si Realtime no está habilitado

Si no puedes habilitar Realtime desde el dashboard, puedes hacerlo con SQL:

```sql
-- Habilitar Realtime para la tabla seat_locks
ALTER TABLE public.seat_locks REPLICA IDENTITY FULL;

-- Verificar que se aplicó
SELECT 
  c.relname AS tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'default'
    WHEN 'f' THEN 'full'
    WHEN 'n' THEN 'nothing'
    WHEN 'i' THEN 'index'
  END AS replication_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';
```

**Nota:** `REPLICA IDENTITY FULL` permite que Realtime envíe todos los datos de la fila en los eventos, lo cual es necesario para que los eventos funcionen correctamente.

## ✅ Después de Habilitar

1. **Recarga ambos navegadores** (Ctrl+F5)
2. **Abre la consola** (F12)
3. **Selecciona un asiento** en un navegador
4. **Verifica en el otro navegador:**
   - Deberías ver: `✅ [SEAT_LOCK_STORE] Suscrito exitosamente a Realtime`
   - Deberías ver: `🔔 [SEAT_LOCK_STORE] Evento recibido`
   - El asiento debería aparecer en naranja

## 🔧 Solución de Problemas

### Si no ves "Suscrito exitosamente"

1. Verifica que Realtime esté habilitado en el dashboard
2. Verifica que RLS esté habilitado: `ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;`
3. Verifica que las políticas RLS permitan SELECT: `USING (true)`

### Si ves errores de conexión

1. Verifica tu conexión a internet
2. Verifica que las variables de entorno de Supabase estén correctas
3. Verifica que no haya bloqueadores de anuncios interfiriendo

### Si los eventos no se reciben

1. Verifica que el filtro sea correcto: `funcion_id=eq.43,tenant_id=eq.9dbdb86f-8424-484c-bb76-0d9fa27573c8`
2. Verifica que ambos navegadores tengan el mismo `funcionId` y `tenantId`
3. Verifica que el `session_id` sea diferente en cada navegador

