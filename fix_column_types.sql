-- Script para corregir tipos de datos incorrectos en las tablas zonas, salas y recintos
-- Este script corrige el error: operator does not exist: text = integer

-- 1. Verificar el estado actual antes de hacer cambios
SELECT 'ESTADO ACTUAL ANTES DE CORRECCIÓN' as mensaje;

-- Verificar tipos de datos actuales
SELECT 
    'zonas.sala_id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'zonas' AND column_name = 'sala_id';

SELECT 
    'salas.id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salas' AND column_name = 'id';

SELECT 
    'recintos.id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' AND column_name = 'id';

-- 2. Corregir tipos de datos si es necesario
-- Si zonas.sala_id no es UUID, corregirlo
DO $$
BEGIN
    -- Verificar si zonas.sala_id es del tipo correcto
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zonas' 
        AND column_name = 'sala_id' 
        AND data_type != 'uuid'
    ) THEN
        -- Crear una columna temporal
        ALTER TABLE zonas ADD COLUMN sala_id_temp UUID;
        
        -- Copiar datos existentes (si los hay)
        UPDATE zonas SET sala_id_temp = sala_id::uuid WHERE sala_id IS NOT NULL;
        
        -- Eliminar la columna antigua
        ALTER TABLE zonas DROP COLUMN sala_id;
        
        -- Renombrar la columna temporal
        ALTER TABLE zonas RENAME COLUMN sala_id_temp TO sala_id;
        
        -- Agregar la referencia foreign key
        ALTER TABLE zonas ADD CONSTRAINT fk_zonas_sala_id 
        FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Columna zonas.sala_id corregida a UUID';
    ELSE
        RAISE NOTICE 'Columna zonas.sala_id ya es del tipo correcto (UUID)';
    END IF;
END $$;

-- Si salas.id no es UUID, corregirlo
DO $$
BEGIN
    -- Verificar si salas.id es del tipo correcto
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salas' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        RAISE NOTICE 'ERROR: No se puede cambiar el tipo de la columna id de salas. Es la clave primaria.';
        RAISE NOTICE 'Se requiere recrear la tabla o usar una estrategia diferente.';
    ELSE
        RAISE NOTICE 'Columna salas.id ya es del tipo correcto (UUID)';
    END IF;
END $$;

-- Si recintos.id no es UUID, corregirlo
DO $$
BEGIN
    -- Verificar si recintos.id es del tipo correcto
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recintos' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        RAISE NOTICE 'ERROR: No se puede cambiar el tipo de la columna id de recintos. Es la clave primaria.';
        RAISE NOTICE 'Se requiere recrear la tabla o usar una estrategia diferente.';
    ELSE
        RAISE NOTICE 'Columna recintos.id ya es del tipo correcto (UUID)';
    END IF;
END $$;

-- 3. Verificar el estado después de la corrección
SELECT 'ESTADO DESPUÉS DE CORRECCIÓN' as mensaje;

-- Verificar tipos de datos después de la corrección
SELECT 
    'zonas.sala_id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'zonas' AND column_name = 'sala_id';

SELECT 
    'salas.id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salas' AND column_name = 'id';

SELECT 
    'recintos.id' as columna,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' AND column_name = 'id';

-- 4. Verificar que las foreign keys estén correctamente configuradas
SELECT 
    'Foreign Keys de zonas' as tipo,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'zonas';

-- 5. Probar la consulta que estaba fallando
SELECT 'PROBANDO CONSULTA ORIGINAL' as mensaje;

-- Esta es la consulta que estaba fallando
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  r.tenant_id as tenant_del_recinto
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
LEFT JOIN recintos r ON s.recinto_id = r.id
WHERE z.tenant_id IS NULL
ORDER BY z.id
LIMIT 5;

SELECT 'CORRECCIÓN COMPLETADA' as mensaje;
