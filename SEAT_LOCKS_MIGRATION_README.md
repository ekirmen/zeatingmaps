# Migración: Agregar tenant_id a seat_locks

## Descripción
Esta migración agrega el campo `tenant_id` a la tabla `seat_locks` para implementar multi-tenancy y mejorar la seguridad de los bloqueos de asientos.

## Archivos
- **Migración SQL**: `migrations/add_tenant_id_to_seat_locks.sql`
- **Componente modificado**: `src/backoffice/pages/CompBoleteria/components/SimpleSeatingMap.jsx`

## Cambios Implementados

### 1. Base de Datos
```sql
-- Agregar tenant_id a seat_locks
ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Crear índice para rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_locks_tenant_id ON seat_locks(tenant_id);

-- Actualizar registros existentes
UPDATE seat_locks 
SET tenant_id = (
    SELECT t.id 
    FROM tenants t 
    JOIN salas s ON s.recinto = t.id 
    JOIN funciones f ON f.sala_id = s.id 
    WHERE f.id = seat_locks.funcion_id
    LIMIT 1
)
WHERE tenant_id IS NULL;
```

### 2. Lógica de Asientos Vendidos
- **Asientos vendidos (`estado = 'pagado'`)**: Siempre se mantienen en gris (`#9ca3af`)
- **Asientos reservados (`estado = 'reservado'`)**: Siempre se mantienen en naranja (`#ff8c00`)
- **Asientos bloqueados por otros**: Rojo (`#ff4d4f`)
- **Asientos seleccionados por ti**: Amarillo (`#facc15`)
- **Asientos disponibles**: Verde (`#52c41a`)
- **No se pueden seleccionar**: Los asientos vendidos/reservados no responden a clicks
- **Cursor visual**: `cursor-not-allowed` para asientos no disponibles
- **Opacidad reducida**: `opacity-60` para asientos vendidos/reservados

## Cómo Aplicar

### Opción 1: Ejecutar SQL directamente
1. Conectarse a tu base de datos Supabase
2. Ejecutar el contenido del archivo `migrations/add_tenant_id_to_seat_locks.sql`

### Opción 2: Usar Supabase CLI
```bash
# Si tienes Supabase CLI configurado
supabase db push
```

### Opción 3: Usar el Dashboard de Supabase
1. Ir a SQL Editor en tu proyecto
2. Copiar y pegar el contenido del archivo SQL
3. Ejecutar la consulta

## Verificación
Después de aplicar la migración, verifica que:
1. La columna `tenant_id` existe en `seat_locks`
2. Los registros existentes tienen `tenant_id` asignado
3. El índice se creó correctamente

```sql
-- Verificar la migración
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'seat_locks' 
AND column_name = 'tenant_id';
```

## Beneficios
- **Multi-tenancy**: Cada tenant solo ve sus propios bloqueos de asientos
- **Seguridad**: Mejor aislamiento entre diferentes organizaciones
- **Rendimiento**: Índice optimizado para consultas por tenant
- **Consistencia**: Alineado con el modelo de datos multi-tenant

## Notas Importantes
- Esta migración es **no destructiva** (usa `IF NOT EXISTS`)
- Los registros existentes se actualizan automáticamente
- Asegúrate de tener respaldo antes de ejecutar en producción
- La migración asume que existe la relación `funciones -> salas -> recintos -> tenants`

## Problemas Comunes
1. **Error de referencia**: Verifica que la tabla `tenants` existe
2. **Registros sin tenant**: Algunos registros pueden quedar con `tenant_id = NULL` si no hay relación válida
3. **Permisos**: Asegúrate de tener permisos para modificar la tabla

## Soporte
Si encuentras problemas durante la migración:
1. Revisa los logs de error
2. Verifica las relaciones entre tablas
3. Confirma que tienes los permisos necesarios
4. Contacta al equipo de desarrollo si persisten los problemas

