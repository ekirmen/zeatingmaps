-- =====================================================
-- ARREGLAR TABLA RESERVAS EXISTENTE
-- =====================================================

-- Agregar columna user_id a la tabla reservas si no existe
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para user_id en reservas
CREATE INDEX IF NOT EXISTS idx_reservas_user_id ON reservas(user_id);

-- Habilitar RLS en reservas
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para reservas
DROP POLICY IF EXISTS "Users can view their own reservas" ON reservas;
CREATE POLICY "Users can view their own reservas" ON reservas
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own reservas" ON reservas;
CREATE POLICY "Users can insert their own reservas" ON reservas
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reservas" ON reservas;
CREATE POLICY "Users can update their own reservas" ON reservas
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN reservas.user_id IS 'ID del usuario que hizo la reserva';
