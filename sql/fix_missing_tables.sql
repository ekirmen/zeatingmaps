-- Script para crear tablas faltantes y relaciones
-- =====================================================

-- Crear tabla admin_notifications si no existe
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla user_tags si no existe
CREATE TABLE IF NOT EXISTS user_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1890ff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla user_tag_relations si no existe
CREATE TABLE IF NOT EXISTS user_tag_relations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES user_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tag_id)
);

-- Crear tabla printer_formats si no existe
CREATE TABLE IF NOT EXISTS printer_formats (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna evento_id a payment_transactions si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'evento_id'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN evento_id UUID;
    END IF;
END $$;

-- Crear foreign key entre payment_transactions y eventos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_transactions_evento_id'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT fk_payment_transactions_evento_id 
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Insertar configuración por defecto en printer_formats
INSERT INTO printer_formats (id, config) VALUES (
    1, 
    '{
        "paperWidth": 80,
        "paperHeight": 297,
        "marginTop": 5,
        "marginBottom": 5,
        "marginLeft": 5,
        "marginRight": 5,
        "fontSize": "00",
        "alignment": "1",
        "header": "BOLETERÍA SISTEMA\n",
        "footer": "Gracias por su compra\n",
        "showQRCode": true,
        "showBarcode": false,
        "logo": null
    }'
) ON CONFLICT (id) DO NOTHING;

-- Insertar tags de usuario por defecto
INSERT INTO user_tags (name, description, color) VALUES 
    ('VIP', 'Clientes VIP', '#ff4d4f'),
    ('Frecuente', 'Compradores frecuentes', '#52c41a'),
    ('Nuevo', 'Clientes nuevos', '#1890ff'),
    ('Premium', 'Clientes premium', '#722ed1'),
    ('Inactivo', 'Clientes inactivos', '#faad14')
ON CONFLICT DO NOTHING;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_tag_relations_user_id ON user_tag_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_relations_tag_id ON user_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_printer_formats_id ON printer_formats(id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_evento_id ON payment_transactions(evento_id);

-- Mensaje de confirmación
SELECT 'Tablas faltantes creadas exitosamente!' as mensaje; 