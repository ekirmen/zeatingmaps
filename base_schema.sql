-- =====================================================
-- ESQUEMA BASE - TABLAS PRINCIPALES
-- =====================================================

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'activo',
    imagen_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    telefono VARCHAR(50),
    rol VARCHAR(50) DEFAULT 'usuario',
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    imagen_url VARCHAR(500),
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de funciones
CREATE TABLE IF NOT EXISTS funciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    fecha TIMESTAMP NOT NULL,
    duracion INTEGER, -- en minutos
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de salas
CREATE TABLE IF NOT EXISTS salas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    capacidad INTEGER,
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de mapas
CREATE TABLE IF NOT EXISTS mapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    contenido JSONB,
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de sillas
CREATE TABLE IF NOT EXISTS sillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapa_id UUID REFERENCES mapas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    fila VARCHAR(10),
    numero INTEGER,
    estado VARCHAR(50) DEFAULT 'disponible',
    precio DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcion_id UUID REFERENCES funciones(id) ON DELETE CASCADE,
    silla_id UUID REFERENCES sillas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de formularios personalizados
CREATE TABLE IF NOT EXISTS custom_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    campos JSONB NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de respuestas de formularios
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES custom_forms(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    respuestas JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de configuración de MailChimp
CREATE TABLE IF NOT EXISTS mailchimp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    list_id VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de suscripciones de MailChimp
CREATE TABLE IF NOT EXISTS mailchimp_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES mailchimp_configs(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de configuración de notificaciones push
CREATE TABLE IF NOT EXISTS push_notifications_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    configuracion JSONB NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones push
CREATE TABLE IF NOT EXISTS push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES push_notifications_config(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_funciones_evento_id ON funciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_funciones_estado ON funciones(estado);
CREATE INDEX IF NOT EXISTS idx_sillas_mapa_id ON sillas(mapa_id);
CREATE INDEX IF NOT EXISTS idx_sillas_estado ON sillas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_funcion_id ON reservas(funcion_id);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario_id ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario_id ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_venta_id ON pagos(venta_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_eventos_updated_at
    BEFORE UPDATE ON eventos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funciones_updated_at
    BEFORE UPDATE ON funciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salas_updated_at
    BEFORE UPDATE ON salas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mapas_updated_at
    BEFORE UPDATE ON mapas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sillas_updated_at
    BEFORE UPDATE ON sillas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
    BEFORE UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ventas_updated_at
    BEFORE UPDATE ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at
    BEFORE UPDATE ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo para usuarios autenticados)
CREATE POLICY "Enable all for authenticated users" ON eventos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON usuarios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON funciones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON salas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON mapas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON sillas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON reservas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON ventas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON pagos FOR ALL USING (auth.role() = 'authenticated');
