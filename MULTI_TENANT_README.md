# Sistema de Múltiples Tenants por Usuario

## 🎯 **Descripción del Problema**

Si te registras en ambas tickeras (empresas) y es la misma base de datos, **NO tendrás 2 registros duplicados**. En su lugar, tendrás:

- ✅ **1 usuario** (email + contraseña)
- ✅ **1 perfil** en la tabla `profiles`
- ✅ **Múltiples relaciones** en la tabla `user_tenants`
- ✅ **Acceso a ambas empresas** desde la misma cuenta

## 🏗️ **Arquitectura Implementada**

### **Estructura de Base de Datos**

```
auth.users (1 usuario)
    ↓
profiles (1 perfil)
    ↓
user_tenants (múltiples relaciones)
    ↓
tenants (múltiples empresas)
```

### **Tabla `user_tenants` (Nueva)**

```sql
CREATE TABLE user_tenants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  role VARCHAR(50) DEFAULT 'usuario',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Tenant principal
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, tenant_id) -- Evita duplicados
);
```

## 🔄 **Flujo de Funcionamiento**

### **1. Registro en Primera Empresa**
```
Usuario se registra en empresa A
↓
Se crea: auth.users + profiles + user_tenants
↓
user_tenants: { user_id: X, tenant_id: A, is_primary: true }
```

### **2. Registro en Segunda Empresa**
```
Usuario se registra en empresa B
↓
Se crea: user_tenants (nueva relación)
↓
user_tenants: [
  { user_id: X, tenant_id: A, is_primary: true },
  { user_id: X, tenant_id: B, is_primary: false }
]
```

### **3. Acceso a Cualquier Empresa**
```
Usuario puede cambiar entre empresas
↓
Sistema verifica acceso en user_tenants
↓
Permite acceso si existe la relación
```

## 🚀 **Funcionalidades Implementadas**

### **Hook `useMultiTenant`**
```javascript
const { 
  userTenants,        // Lista de empresas del usuario
  activeTenant,       // Empresa activa actualmente
  switchToTenant,     // Cambiar de empresa
  joinTenant,         // Unirse a nueva empresa
  canSwitchTenants,   // Si puede cambiar de empresa
  totalTenants        // Total de empresas
} = useMultiTenant();
```

### **Componente `TenantSwitcher`**
```javascript
<TenantSwitcher 
  showLabel={true}
  size="middle"
  onTenantChange={(tenantId) => console.log('Cambió a:', tenantId)}
/>
```

### **Servicios de Autenticación**
```javascript
// Obtener todas las empresas del usuario
const tenants = await getUserTenants(userId);

// Cambiar de empresa
const success = await switchUserTenant(userId, newTenantId);

// Unirse a nueva empresa
const success = await addUserToTenant(userId, tenantId, 'usuario');
```

## 📊 **Ejemplo Práctico**

### **Escenario: Usuario en 2 Tickeras**

```sql
-- Usuario
INSERT INTO auth.users (id, email) VALUES ('user-123', 'usuario@email.com');

-- Perfil
INSERT INTO profiles (id, login, tenant_id) VALUES ('user-123', 'usuario@email.com', 'tenant-A');

-- Relaciones con empresas
INSERT INTO user_tenants (user_id, tenant_id, is_primary) VALUES 
  ('user-123', 'tenant-A', true),   -- Primera empresa (principal)
  ('user-123', 'tenant-B', false);  -- Segunda empresa
```

### **Resultado**
- ✅ **1 usuario** con email `usuario@email.com`
- ✅ **1 perfil** en `profiles`
- ✅ **2 relaciones** en `user_tenants`
- ✅ **Acceso a ambas empresas** desde la misma cuenta

## 🔐 **Seguridad y Acceso**

### **Verificación de Acceso**
```javascript
// El sistema verifica automáticamente
const hasAccess = await verifyTenantAccess(userId, tenantId);

// Solo permite acceso si existe la relación en user_tenants
if (!hasAccess) {
  throw new Error('No tienes acceso a esta empresa');
}
```

### **Políticas RLS**
```sql
-- Usuarios solo ven sus propias relaciones
CREATE POLICY "Users can view their own tenant relationships" 
ON user_tenants FOR SELECT 
USING (auth.uid() = user_id);

-- Administradores pueden gestionar todas
CREATE POLICY "Admins can manage all user-tenant relationships" 
ON user_tenants FOR ALL 
USING (is_admin(auth.uid()));
```

## 🎨 **Interfaz de Usuario**

### **Selector de Empresa**
- **2 empresas**: Botones simples para cambiar
- **3+ empresas**: Dropdown con lista completa
- **Indicador visual**: Empresa activa marcada con ✓

### **Información Mostrada**
- Nombre de la empresa
- Logo (si existe)
- Rol del usuario en esa empresa
- Estado (activa/inactiva)

## 📝 **Casos de Uso**

### **1. Usuario Nuevo**
```
Registro en empresa A → Se crea relación principal
Registro en empresa B → Se agrega relación secundaria
```

### **2. Usuario Existente**
```
Login en empresa A → Verifica acceso en user_tenants
Login en empresa B → Verifica acceso en user_tenants
```

### **3. Cambio de Empresa**
```
Usuario en empresa A → Hace clic en "Cambiar a B"
Sistema actualiza is_primary en user_tenants
Recarga página con nuevo contexto
```

## 🛠️ **Implementación Técnica**

### **Scripts SQL**
1. **`create_multi_tenant_structure.sql`**: Estructura completa
2. **`verify_and_fix_tenant_users.sql`**: Verificación y corrección

### **Componentes React**
1. **`TenantSwitcher`**: Selector de empresa
2. **`useMultiTenant`**: Hook para gestión
3. **`ProtectedRoute`**: Verificación de acceso

### **Servicios Backend**
1. **`getUserTenants`**: Obtener empresas del usuario
2. **`switchUserTenant`**: Cambiar empresa activa
3. **`addUserToTenant`**: Unirse a nueva empresa

## 🔧 **Configuración**

### **1. Ejecutar Script SQL**
```bash
# Conectar a la base de datos
psql -d tu_base_de_datos -f scripts/create_multi_tenant_structure.sql
```

### **2. Migrar Usuarios Existentes**
```sql
-- Descomentar en el script
SELECT migrate_existing_users_to_tenants();
```

### **3. Verificar Configuración**
```sql
-- Ver estado de la migración
SELECT * FROM user_tenants_overview LIMIT 10;
```

## ✅ **Ventajas del Sistema**

### **Para el Usuario**
- ✅ **Una sola cuenta** para todas las empresas
- ✅ **Cambio fácil** entre empresas
- ✅ **Sin duplicación** de datos personales
- ✅ **Acceso centralizado** a todas sus empresas

### **Para el Sistema**
- ✅ **Base de datos única** (no duplicación)
- ✅ **Seguridad robusta** con RLS
- ✅ **Escalabilidad** para múltiples empresas
- ✅ **Mantenimiento simple** de usuarios

### **Para los Administradores**
- ✅ **Gestión centralizada** de usuarios
- ✅ **Control granular** de accesos
- ✅ **Auditoría completa** de relaciones
- ✅ **Flexibilidad** para asignar roles

## 🚨 **Consideraciones Importantes**

### **Seguridad**
- Cada usuario solo ve datos de sus empresas
- Las políticas RLS protegen automáticamente
- Verificación de acceso en cada operación

### **Rendimiento**
- Índices en `user_id` y `tenant_id`
- Consultas optimizadas con JOINs
- Cache de tenant activo en localStorage

### **Mantenimiento**
- Scripts de migración automática
- Funciones para gestión de relaciones
- Vistas para monitoreo del sistema

## 🔮 **Futuras Mejoras**

### **Funcionalidades Planificadas**
- [ ] **Invitar usuarios** a empresas
- [ ] **Roles personalizados** por empresa
- [ ] **Permisos granulares** por funcionalidad
- [ ] **Auditoría completa** de cambios

### **Integración**
- [ ] **API REST** para gestión externa
- [ ] **Webhooks** para notificaciones
- [ ] **Sincronización** con sistemas externos
- [ ] **Backup automático** de relaciones

## 📞 **Soporte y Troubleshooting**

### **Problemas Comunes**
1. **Usuario no puede acceder**: Verificar relación en `user_tenants`
2. **Error de tenant**: Verificar configuración del dominio
3. **Acceso denegado**: Verificar políticas RLS

### **Soluciones**
- Ejecutar script de verificación
- Revisar configuración del TenantContext
- Verificar políticas de seguridad

---

## 🎉 **Resumen**

Con este sistema implementado:

- ✅ **NO tendrás usuarios duplicados**
- ✅ **SÍ tendrás acceso a múltiples empresas**
- ✅ **SÍ podrás cambiar entre empresas fácilmente**
- ✅ **SÍ mantendrás la seguridad y separación de datos**

El usuario se registra **una sola vez** y puede acceder a **todas las empresas** donde esté registrado, manteniendo la integridad de los datos y la seguridad del sistema.
