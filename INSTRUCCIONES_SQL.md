# Instrucciones para Ejecutar Scripts SQL

Para configurar correctamente la base de datos para el sistema SaaS, sigue estos pasos en orden:

## 1. Crear Esquema Base

Primero, ejecuta el script que crea todas las tablas base del sistema:

1. Abre el editor SQL de Supabase
2. Copia y pega el contenido de `base_schema.sql`
3. Ejecuta el script
4. Verifica que todas las tablas se hayan creado correctamente con:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## 2. Configurar Sistema SaaS

Una vez que el esquema base esté listo, configura el sistema SaaS:

1. Abre el editor SQL de Supabase
2. Copia y pega el contenido de `saas_database_schema.sql`
3. Ejecuta el script
4. Verifica que las tablas SaaS se hayan creado y las existentes se hayan modificado:

```sql
-- Verificar tablas SaaS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'subscriptions', 'invoices', 'usage_metrics', 'plan_limits');

-- Verificar columna tenant_id en tablas existentes
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id'
ORDER BY table_name;
```

## 3. Verificar Políticas RLS

Asegúrate de que las políticas RLS estén correctamente configuradas:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 4. Verificar Funciones y Triggers

Comprueba que todas las funciones y triggers se hayan creado:

```sql
-- Listar funciones
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Listar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## 5. Insertar Datos de Ejemplo

Para probar el sistema, puedes insertar algunos datos de ejemplo:

```sql
-- Insertar un tenant de ejemplo
INSERT INTO tenants (subdomain, company_name, contact_email, plan_type, status)
VALUES ('demo', 'Empresa Demo', 'demo@example.com', 'basic', 'active');

-- Insertar límites de plan
INSERT INTO plan_limits (plan_type, limit_name, limit_value) VALUES
('basic', 'events_per_month', 5),
('basic', 'tickets_per_event', 100),
('basic', 'storage_gb', 1),
('pro', 'events_per_month', 50),
('pro', 'tickets_per_event', 1000),
('pro', 'storage_gb', 10),
('enterprise', 'events_per_month', -1),
('enterprise', 'tickets_per_event', -1),
('enterprise', 'storage_gb', 100);
```

## Solución de Problemas

Si encuentras errores durante la ejecución:

1. **Error de tabla no existe**: Asegúrate de ejecutar primero `base_schema.sql`
2. **Error de columna duplicada**: Verifica si la columna ya existe antes de intentar agregarla
3. **Error de política duplicada**: Elimina la política existente antes de crearla nuevamente
4. **Error de trigger duplicado**: Elimina el trigger existente antes de crearlo nuevamente

Para eliminar objetos duplicados:

```sql
-- Eliminar política
DROP POLICY IF EXISTS "nombre_politica" ON nombre_tabla;

-- Eliminar trigger
DROP TRIGGER IF EXISTS nombre_trigger ON nombre_tabla;

-- Eliminar función
DROP FUNCTION IF EXISTS nombre_funcion();
```

## Respaldo y Restauración

Antes de ejecutar los scripts en producción:

1. **Hacer backup**:
   ```sql
   -- En Supabase, usa la interfaz de backup
   -- O ejecuta pg_dump si tienes acceso directo
   ```

2. **Restaurar si es necesario**:
   ```sql
   -- En Supabase, usa la interfaz de restauración
   -- O ejecuta pg_restore si tienes acceso directo
   ```

## Notas Importantes

- Ejecuta los scripts en un ambiente de prueba primero
- Verifica que no haya datos importantes antes de modificar tablas
- Mantén un registro de los cambios realizados
- Documenta cualquier error y su solución