    -- 🚀 Diagnosticar Problema de Funciones
    -- Este script identifica por qué las funciones no se muestran en el frontend

    -- =====================================================
    -- VERIFICAR ESTRUCTURA COMPLETA
    -- =====================================================

    -- Mostrar estructura de funciones
    SELECT 
        'ESTRUCTURA FUNCIONES' as tipo,
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'funciones' 
    ORDER BY ordinal_position;

    -- =====================================================
    -- VERIFICAR DATOS COMPLETOS
    -- =====================================================

    -- Mostrar todas las funciones con detalles
    SELECT 
        'FUNCIONES COMPLETAS' as tipo,
        f.id,
        f.evento,
        f.sala,
        e.nombre as evento_nombre,
        e.slug as evento_slug,
        s.nombre as sala_nombre,
        r.nombre as recinto_nombre
    FROM funciones f
    LEFT JOIN eventos e ON f.evento = e.id
    LEFT JOIN salas s ON f.sala = s.id
    LEFT JOIN recintos r ON s.recinto_id = r.id
    ORDER BY f.id;

    -- =====================================================
    -- VERIFICAR EVENTOS Y SUS FUNCIONES
    -- =====================================================

    -- Mostrar eventos y cuántas funciones tienen
    SELECT 
        'EVENTOS Y FUNCIONES' as tipo,
        e.id,
        e.nombre,
        e.slug,
        e.fecha_evento,
        COUNT(f.id) as total_funciones
    FROM eventos e
    LEFT JOIN funciones f ON e.id = f.evento
    GROUP BY e.id, e.nombre, e.slug, e.fecha_evento
    ORDER BY e.fecha_evento;

    -- =====================================================
    -- VERIFICAR SALAS Y RECINTOS
    -- =====================================================

    -- Mostrar salas y sus recintos
    SELECT 
        'SALAS Y RECINTOS' as tipo,
        s.id,
        s.nombre as sala_nombre,
        s.capacidad,
        r.id as recinto_id,
        r.nombre as recinto_nombre
    FROM salas s
    LEFT JOIN recintos r ON s.recinto_id = r.id
    ORDER BY r.nombre, s.nombre;

    -- =====================================================
    -- VERIFICAR RLS Y PERMISOS
    -- =====================================================

    -- Verificar si RLS está habilitado
    SELECT 
        'RLS STATUS' as tipo,
        schemaname,
        tablename,
        rowsecurity
    FROM pg_tables 
    WHERE tablename IN ('funciones', 'eventos', 'salas', 'recintos');

    -- Verificar políticas RLS
    SELECT 
        'RLS POLICIES' as tipo,
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
    FROM pg_policies 
    WHERE tablename IN ('funciones', 'eventos', 'salas', 'recintos');

    -- =====================================================
    -- VERIFICAR TENANT_ID EN TABLAS
    -- =====================================================

    -- Verificar si las tablas tienen tenant_id
    SELECT 
        'TENANT_ID CHECK' as tipo,
        table_name,
        column_name,
        data_type
    FROM information_schema.columns 
    WHERE table_name IN ('funciones', 'eventos', 'salas', 'recintos')
    AND column_name = 'tenant_id'
    ORDER BY table_name;

    -- =====================================================
    -- COMENTARIOS FINALES
    -- =====================================================

    /*
    INSTRUCCIONES:
    1. Ejecuta este script en el SQL Editor de Supabase
    2. Esto te mostrará toda la información necesaria
    3. Busca inconsistencias en los datos o permisos

    PROBLEMAS COMUNES A BUSCAR:
    - Funciones sin evento válido
    - Eventos sin tenant_id correcto
    - RLS bloqueando acceso
    - Relaciones faltantes entre tablas
    */
