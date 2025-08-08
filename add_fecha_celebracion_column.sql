-- 🚀 Agregar columna fecha_celebracion a funciones
-- Este script agrega la columna fecha_celebracion si no existe

-- =====================================================
-- VERIFICAR SI LA COLUMNA EXISTE
-- =====================================================

-- Verificar si fecha_celebracion existe
SELECT 
    'VERIFICAR COLUMNA' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'funciones' AND column_name = 'fecha_celebracion'
        ) THEN 'La columna fecha_celebracion ya existe'
        ELSE 'La columna fecha_celebracion NO existe'
    END as resultado;

-- =====================================================
-- AGREGAR COLUMNA SI NO EXISTE
-- =====================================================

-- Agregar columna fecha_celebracion si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funciones' AND column_name = 'fecha_celebracion'
    ) THEN
        ALTER TABLE funciones ADD COLUMN fecha_celebracion TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna fecha_celebracion agregada a la tabla funciones';
    ELSE
        RAISE NOTICE 'La columna fecha_celebracion ya existe';
    END IF;
END $$;

-- =====================================================
-- ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar fecha_celebracion con la fecha del evento
UPDATE funciones 
SET fecha_celebracion = e.fecha_evento
FROM eventos e
WHERE funciones.evento = e.id
AND funciones.fecha_celebracion IS NULL;

-- =====================================================
-- CREAR ÍNDICE PARA MEJOR RENDIMIENTO
-- =====================================================

-- Crear índice en fecha_celebracion
CREATE INDEX IF NOT EXISTS idx_funciones_fecha_celebracion 
ON funciones(fecha_celebracion);

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Mostrar estructura actualizada
SELECT 
    'ESTRUCTURA ACTUALIZADA' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'funciones' 
AND column_name IN ('evento', 'sala', 'fecha_celebracion')
ORDER BY column_name;

-- Mostrar algunos datos de ejemplo
SELECT 
    'DATOS EJEMPLO' as tipo,
    f.id,
    f.evento,
    f.sala,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    e.fecha_evento
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LIMIT 5;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto agregará la columna fecha_celebracion si no existe
3. Actualizará los datos existentes con la fecha del evento
4. Creará un índice para mejor rendimiento

RESULTADO ESPERADO:
- La tabla funciones tendrá fecha_celebracion
- Los datos existentes se actualizarán automáticamente
- El frontend podrá usar fecha_celebracion sin cambios
*/
