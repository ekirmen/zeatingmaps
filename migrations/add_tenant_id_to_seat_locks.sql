-- Migración: Agregar tenant_id a la tabla seat_locks
-- Fecha: 2025-08-28
-- Descripción: Agregar campo tenant_id para multi-tenancy en seat_locks

-- Agregar tenant_id a la tabla seat_locks
ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Crear índice para mejorar el rendimiento de consultas por tenant
CREATE INDEX IF NOT EXISTS idx_seat_locks_tenant_id ON seat_locks(tenant_id);

-- Actualizar registros existentes con el tenant_id correspondiente
-- Esto asume que tienes una función o lógica para determinar el tenant
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

-- Agregar comentario a la columna
COMMENT ON COLUMN seat_locks.tenant_id IS 'ID del tenant al que pertenece este bloqueo de asiento';

-- Verificar que la migración se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'seat_locks' 
AND column_name = 'tenant_id';
