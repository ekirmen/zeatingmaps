-- Script simple para verificar tablas que faltan
-- =====================================================

-- Verificar tablas específicas que podrían faltar
SELECT 
    'admin_users' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'boleteria' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boleteria' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'galeria' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'galeria' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'plantillas_precios' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plantillas_precios' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'usuarios' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'webstudio_colors' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webstudio_colors' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'webstudio_footer' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webstudio_footer' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
UNION ALL
SELECT 
    'webstudio_header' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webstudio_header' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as estado
ORDER BY estado DESC, table_name;

-- Mostrar solo las que faltan
SELECT 
    'TABLAS QUE FALTAN' as categoria,
    table_name,
    'FALTA' as estado
FROM (
    SELECT 'admin_users' as table_name
    UNION ALL SELECT 'boleteria'
    UNION ALL SELECT 'galeria'
    UNION ALL SELECT 'plantillas_precios'
    UNION ALL SELECT 'usuarios'
    UNION ALL SELECT 'webstudio_colors'
    UNION ALL SELECT 'webstudio_footer'
    UNION ALL SELECT 'webstudio_header'
) expected_tables
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = expected_tables.table_name 
    AND table_schema = 'public'
)
ORDER BY table_name;

-- Resumen
SELECT 
    'RESUMEN' as categoria,
    COUNT(CASE WHEN estado = 'EXISTE' THEN 1 END) as tablas_existentes,
    COUNT(CASE WHEN estado = 'FALTA' THEN 1 END) as tablas_faltantes,
    COUNT(*) as total_verificadas
FROM (
    SELECT 
        'admin_users' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'boleteria' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boleteria' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'galeria' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'galeria' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'plantillas_precios' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plantillas_precios' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'usuarios' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'webstudio_colors' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webstudio_colors' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'webstudio_footer' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webstudio_footer' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
    UNION ALL
    SELECT 
        'webstudio_header' as table_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webstudio_header' AND table_schema = 'public') 
            THEN 'EXISTE' 
            ELSE 'FALTA' 
        END as estado
) check_results; 