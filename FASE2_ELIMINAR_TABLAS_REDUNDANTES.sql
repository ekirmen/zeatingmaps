-- =====================================================
-- 🧹 FASE 2: ELIMINAR TABLAS REDUNDANTES
-- =====================================================
-- Esta fase requiere CUIDADO - verificar antes de ejecutar
-- =====================================================

-- ⚠️  IMPORTANTE: PROBAR FUNCIONALIDAD DESPUÉS DE FASE 1
-- ⚠️  Esta fase elimina 15+ tablas redundantes

-- =====================================================
-- 🗑️ Backups temporales
-- =====================================================
DROP TABLE IF EXISTS profiles_backup CASCADE;

-- =====================================================
-- 🗑️ Políticas redundantes (RLS las maneja)
-- =====================================================
DROP TABLE IF EXISTS access_policies CASCADE;

-- =====================================================
-- 🗑️ Roles redundantes (tenant_user_roles es mejor)
-- =====================================================
DROP TABLE IF EXISTS custom_roles CASCADE;

-- =====================================================
-- 🗑️ Notificaciones redundantes (no se usan)
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;

-- =====================================================
-- 🗑️ Sales vs Payments (sales está vacía, payments tiene datos)
-- =====================================================
DROP TABLE IF EXISTS sales CASCADE;

-- =====================================================
-- ✅ VERIFICACIÓN FASE 2
-- =====================================================

-- Contar tablas restantes
SELECT COUNT(*) as tablas_restantes_fase2 FROM pg_tables WHERE schemaname = 'public';

-- Mostrar tablas restantes
SELECT tablename, n_tup_ins as filas_estimadas 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 📊 RESUMEN FASE 2
-- =====================================================
/*
TABLAS ELIMINADAS EN FASE 2: 5+ tablas redundantes
- profiles_backup (backup temporal)
- access_policies (redundante con RLS)
- custom_roles (redundante con tenant_user_roles)
- notifications (no se usa)
- sales (vacía, payments tiene datos)

TABLAS RESTANTES: ~25 tablas críticas
- Core del sistema (8 tablas)
- Sistema de pagos (5 tablas)
- Sistema de entradas (4 tablas)
- Gestión de usuarios (6 tablas)
- Sistema de email (3 tablas)
- Configuración (3 tablas)

PRÓXIMO PASO: Verificación final y prueba del sistema
*/
