-- 🚀 Fix para la tabla tenants - Agregar columnas faltantes
-- Este script resuelve el error "Could not find the 'email' column of 'tenants'"

-- =====================================================
-- VERIFICAR Y ACTUALIZAR TABLA TENANTS
-- =====================================================

-- Agregar columnas faltantes a la tabla tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_events INTEGER DEFAULT 50;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- =====================================================
-- ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar tenants existentes con datos por defecto
UPDATE tenants 
SET 
    contact_email = COALESCE(contact_email, 'admin@empresa.com'),
    max_users = COALESCE(max_users, 10),
    max_events = COALESCE(max_events, 50),
    plan_type = COALESCE(plan_type, 'basic'),
    status = COALESCE(status, 'active'),
    -- Generar subdominios automáticos para tenants sin subdominio
    subdomain = COALESCE(subdomain, 
        CASE 
            WHEN subdomain IS NULL THEN 
                'demo-' || LOWER(REPLACE(company_name, ' ', '-')) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT
            ELSE subdomain 
        END
    )
WHERE contact_email IS NULL OR max_users IS NULL OR max_events IS NULL OR plan_type IS NULL OR status IS NULL OR subdomain IS NULL;

-- =====================================================
-- CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tenants_contact_email ON tenants(contact_email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON tenants(plan_type);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- =====================================================
-- VERIFICAR QUE LA TABLA TENANTS TIENE LA ESTRUCTURA CORRECTA
-- =====================================================

-- Mostrar la estructura actual de la tabla tenants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- =====================================================
-- INSERTAR DATOS DE EJEMPLO SI NO EXISTEN
-- =====================================================

-- Insertar tenant de ejemplo si no existe
INSERT INTO tenants (id, company_name, subdomain, contact_email, plan_type, status, max_users, max_events, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Empresa Demo',
    'demo-empresa-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'admin@empresademo.com',
    'premium',
    'active',
    25,
    100,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIÓN PARA GENERAR SUBDOMINIOS AUTOMÁTICOS
-- =====================================================

-- Función para generar subdominios únicos
CREATE OR REPLACE FUNCTION generate_unique_subdomain(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_subdomain TEXT;
    final_subdomain TEXT;
    counter INTEGER := 1;
BEGIN
    -- Crear subdominio base
    base_subdomain := 'demo-' || LOWER(REPLACE(company_name, ' ', '-'));
    
    -- Verificar si ya existe
    SELECT subdomain INTO final_subdomain
    FROM tenants 
    WHERE subdomain = base_subdomain;
    
    -- Si existe, agregar número
    WHILE final_subdomain IS NOT NULL LOOP
        final_subdomain := base_subdomain || '-' || counter::TEXT;
        
        SELECT subdomain INTO final_subdomain
        FROM tenants 
        WHERE subdomain = final_subdomain;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN COALESCE(final_subdomain, base_subdomain);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PARA GENERAR SUBDOMINIOS AUTOMÁTICOS
-- =====================================================

-- Trigger para generar subdominio automáticamente
CREATE OR REPLACE FUNCTION set_default_subdomain()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no hay subdominio, generar uno automáticamente
    IF NEW.subdomain IS NULL OR NEW.subdomain = '' THEN
        NEW.subdomain := generate_unique_subdomain(NEW.company_name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_set_default_subdomain ON tenants;
CREATE TRIGGER trigger_set_default_subdomain
    BEFORE INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION set_default_subdomain();

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto agregará las columnas faltantes a la tabla tenants
3. Actualizará los datos existentes con valores por defecto
4. Generará subdominios automáticos para tenants sin subdominio
5. Verifica que puedas crear empresas en el panel SaaS

PARA VERIFICAR QUE FUNCIONA:
- Ve al panel SaaS
- Intenta crear una nueva empresa
- Debería funcionar sin errores y generar subdominios automáticamente

EJEMPLOS DE SUBDOMINIOS GENERADOS:
- demo-empresa-demo-1733682310
- demo-mi-empresa-1733682311
- demo-empresa-test-1733682312
*/
