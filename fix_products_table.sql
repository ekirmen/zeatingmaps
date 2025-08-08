-- 🚀 Fix para la tabla productos - Crear tabla y datos de ejemplo
-- Este script resuelve el problema de que la página de productos no muestra nada

-- =====================================================
-- CREAR TABLA PRODUCTOS SI NO EXISTE
-- =====================================================

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    categoria VARCHAR(100),
    imagen_url TEXT,
    estado VARCHAR(50) DEFAULT 'activo',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_productos_tenant_id ON productos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio);

-- =====================================================
-- INSERTAR DATOS DE EJEMPLO
-- =====================================================

-- Insertar productos de ejemplo
INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, estado, tenant_id) 
SELECT 
    gen_random_uuid(),
    'Camiseta del Evento',
    'Camiseta oficial del evento con diseño exclusivo',
    25.00,
    100,
    'Merchandising',
    'activo',
    t.id
FROM tenants t
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, estado, tenant_id) 
SELECT 
    gen_random_uuid(),
    'Gorra del Evento',
    'Gorra oficial del evento con logo',
    15.00,
    50,
    'Merchandising',
    'activo',
    t.id
FROM tenants t
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, estado, tenant_id) 
SELECT 
    gen_random_uuid(),
    'Poster Autografiado',
    'Poster del evento autografiado por los artistas',
    35.00,
    25,
    'Coleccionables',
    'activo',
    t.id
FROM tenants t
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, estado, tenant_id) 
SELECT 
    gen_random_uuid(),
    'CD del Evento',
    'CD con la música del evento',
    20.00,
    75,
    'Música',
    'activo',
    t.id
FROM tenants t
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, estado, tenant_id) 
SELECT 
    gen_random_uuid(),
    'Pulsera VIP',
    'Pulsera de acceso VIP para el evento',
    50.00,
    30,
    'VIP',
    'activo',
    t.id
FROM tenants t
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR QUE LOS DATOS SE INSERTARON CORRECTAMENTE
-- =====================================================

-- Consulta para verificar que hay productos disponibles
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.stock,
    p.categoria,
    p.estado,
    t.company_name as empresa
FROM productos p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.estado = 'activo'
ORDER BY p.created_at DESC;

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para actualizar stock cuando se vende un producto
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar stock cuando se vende un producto
    UPDATE productos 
    SET stock = stock - NEW.cantidad
    WHERE id = NEW.producto_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock (si existe tabla ventas_productos)
-- CREATE TRIGGER trigger_update_product_stock
--     AFTER INSERT ON ventas_productos
--     FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará la tabla productos si no existe
3. Insertará datos de ejemplo para que la página funcione
4. Verifica que la página de productos muestre los productos

PARA VERIFICAR QUE FUNCIONA:
- Ve a la página de productos (/dashboard/productos)
- Deberías ver los productos de ejemplo
- Si no hay productos, verifica que los datos se insertaron correctamente
*/
