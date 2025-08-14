# Instrucciones para Ejecutar la Migración

## Problema Identificado
El error `404` para `plantillas_productos_template` indica que la tabla no existe en la base de datos, lo que causa que las funciones no se puedan crear correctamente.

## Solución
Se ha creado un archivo de migración SQL que debe ejecutarse en la base de datos de Supabase.

## Pasos para Ejecutar la Migración

### Opción 1: Usando el Dashboard de Supabase (Recomendado)

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New query**
4. Copia y pega el contenido del archivo `migration_create_plantillas_productos_template.sql`
5. Haz clic en **Run** para ejecutar la migración

### Opción 2: Usando la CLI de Supabase

1. Asegúrate de tener la CLI de Supabase instalada
2. Ejecuta el comando:
   ```bash
   supabase db push
   ```

### Opción 3: Usando psql (si tienes acceso directo)

1. Conéctate a tu base de datos:
   ```bash
   psql "postgresql://postgres:[password]@[host]:5432/postgres"
   ```
2. Ejecuta el archivo SQL:
   ```bash
   \i migration_create_plantillas_productos_template.sql
   ```

## Verificación

Después de ejecutar la migración, verifica que:

1. La tabla `plantillas_productos_template` existe en tu base de datos
2. Puedes crear funciones sin errores 404
3. El campo `tenant_id` se guarda correctamente

## Notas Importantes

- La migración incluye datos de ejemplo para que puedas probar inmediatamente
- Se ha agregado soporte para `tenant_id` para mantener la consistencia con el resto de la aplicación
- La tabla incluye índices para optimizar el rendimiento de las consultas

## Si Persisten los Errores

Si después de ejecutar la migración sigues teniendo problemas:

1. Verifica que la migración se ejecutó correctamente
2. Revisa los logs de la consola del navegador
3. Asegúrate de que tu usuario tenga permisos para acceder a la nueva tabla
4. Contacta al administrador de la base de datos si es necesario
