-- Migración: Agregar tenant_id a printer_formats
-- Fecha: 2025-01-14
-- Descripción: Agregar soporte multi-tenant a la configuración de impresoras

-- Agregar columna tenant_id
ALTER TABLE printer_formats 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Crear índice para mejorar el rendimiento de consultas por tenant
CREATE INDEX IF NOT EXISTS idx_printer_formats_tenant_id ON printer_formats(tenant_id);

-- Comentario sobre la migración
COMMENT ON COLUMN printer_formats.tenant_id IS 'ID del tenant al que pertenece esta configuración de impresora';
