-- 🚀 Asegurar que todas las tablas necesarias existan
-- Este script verifica y crea las tablas faltantes

-- =====================================================
-- VERIFICAR Y CREAR TABLA SALAS
-- =====================================================

-- Crear tabla salas si no existe
CREATE TABLE IF NOT EXISTS salas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    capacidad INTEGER,
    recinto_id UUID REFERENCES recintos(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para salas
CREATE INDEX IF NOT EXISTS idx_salas_recinto_id ON salas(recinto_id);
CREATE INDEX IF NOT EXISTS idx_salas_tenant_id ON salas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salas_nombre ON salas(nombre);

-- =====================================================
-- VERIFICAR Y CREAR TABLA FUNCIONES
-- =====================================================

-- Crear tabla funciones si no existe
CREATE TABLE IF NOT EXISTS funciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para funciones
CREATE INDEX IF NOT EXISTS idx_funciones_evento_id ON funciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_funciones_sala_id ON funciones(sala_id);
CREATE INDEX IF NOT EXISTS idx_funciones_tenant_id ON funciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funciones_fecha ON funciones(fecha);
CREATE INDEX IF NOT EXISTS idx_funciones_activo ON funciones(activo);

-- =====================================================
-- VERIFICAR Y CREAR TABLA SEATS
-- =====================================================

-- Crear tabla seats si no existe
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    fila VARCHAR(10),
    columna VARCHAR(10),
    zona_id UUID,
    sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
    funcion_id UUID REFERENCES funciones(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'available',
    locked_by UUID,
    locked_at TIMESTAMP,
    precio DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para seats
CREATE INDEX IF NOT EXISTS idx_seats_sala_id ON seats(sala_id);
CREATE INDEX IF NOT EXISTS idx_seats_funcion_id ON seats(funcion_id);
CREATE INDEX IF NOT EXISTS idx_seats_tenant_id ON seats(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
CREATE INDEX IF NOT EXISTS idx_seats_locked_by ON seats(locked_by);

-- =====================================================
-- VERIFICAR Y CREAR TABLA ZONAS
-- =====================================================

-- Crear tabla zonas si no existe
CREATE TABLE IF NOT EXISTS zonas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    precio DECIMAL(10,2),
    sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para zonas
CREATE INDEX IF NOT EXISTS idx_zonas_sala_id ON zonas(sala_id);
CREATE INDEX IF NOT EXISTS idx_zonas_tenant_id ON zonas(tenant_id);

-- =====================================================
-- VERIFICAR ESTRUCTURA DE TABLAS EXISTENTES
-- =====================================================

-- Verificar estructura de eventos
DO $$
BEGIN
    -- Agregar tenant_id a eventos si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'tenant_id') THEN
        ALTER TABLE eventos ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_eventos_tenant_id ON eventos(tenant_id);
    END IF;
    
    -- Agregar recinto_id a eventos si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos' AND column_name = 'recinto_id') THEN
        ALTER TABLE eventos ADD COLUMN recinto_id UUID REFERENCES recintos(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_eventos_recinto_id ON eventos(recinto_id);
    END IF;
END $$;

-- Verificar estructura de recintos
DO $$
BEGIN
    -- Agregar tenant_id a recintos si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recintos' AND column_name = 'tenant_id') THEN
        ALTER TABLE recintos ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_recintos_tenant_id ON recintos(tenant_id);
    END IF;
END $$;

-- =====================================================
-- VERIFICAR DATOS DE PRUEBA
-- =====================================================

-- Verificar que existe el tenant zeatingmaps
SELECT 
    'VERIFICACIÓN TENANT' as tipo,
    COUNT(*) as total
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- Verificar eventos existentes
SELECT 
    'VERIFICACIÓN EVENTOS' as tipo,
    COUNT(*) as total
FROM eventos;

-- Verificar recintos existentes
SELECT 
    'VERIFICACIÓN RECINTOS' as tipo,
    COUNT(*) as total
FROM recintos;

-- Verificar salas existentes
SELECT 
    'VERIFICACIÓN SALAS' as tipo,
    COUNT(*) as total
FROM salas;

-- Verificar funciones existentes
SELECT 
    'VERIFICACIÓN FUNCIONES' as tipo,
    COUNT(*) as total
FROM funciones;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto asegurará que todas las tablas necesarias existan
3. Luego ejecuta create_test_tenant.sql para crear datos de prueba
4. Verifica que puedas acceder a https://zeatingmaps-ekirmens-projects.vercel.app/store

TABLAS VERIFICADAS/CREADAS:
- tenants ✅
- eventos ✅
- recintos ✅
- salas ✅
- funciones ✅
- seats ✅
- zonas ✅

PRÓXIMOS PASOS:
1. Ejecutar create_test_tenant.sql
2. Probar la aplicación
*/
