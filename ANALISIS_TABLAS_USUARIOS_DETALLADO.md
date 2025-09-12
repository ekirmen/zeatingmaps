# 🔍 ANÁLISIS DETALLADO DE TABLAS DE USUARIOS

## 📊 **TABLAS ANALIZADAS:**

| Tabla | Filas | Tamaño | Uso en Código | Importancia | Acción |
|-------|-------|--------|---------------|-------------|--------|
| `admin_users` | 2 | 48 kB | ❌ 0 referencias | **BAJA** | **ELIMINAR** |
| `tenant_user_roles` | 6 | 40 kB | ✅ 8 referencias | **ALTA** | **MANTENER** |
| `user_activity` | 6 | 32 kB | ❌ 0 referencias | **BAJA** | **ELIMINAR** |
| `user_activity_log` | 0 | 48 kB | ✅ 1 referencia | **MEDIA** | **MANTENER** |
| `user_permissions` | 6 | 40 kB | ❌ 0 referencias | **BAJA** | **ELIMINAR** |
| `user_recinto_assignments` | 0 | 40 kB | ✅ 6 referencias | **ALTA** | **MANTENER** |
| `user_sessions` | 6 | 96 kB | ❌ 0 referencias | **BAJA** | **ELIMINAR** |
| `user_tags` | 6 | 64 kB | ✅ 4 referencias | **ALTA** | **MANTENER** |
| `user_tenant_assignments` | 0 | 48 kB | ✅ 4 referencias | **ALTA** | **MANTENER** |
| `user_tenant_info` | ? | ? | ✅ 6 referencias | **ALTA** | **MANTENER** |

---

## ✅ **TABLAS IMPORTANTES (MANTENER):**

### **1. `tenant_user_roles` - ✅ CRÍTICA**
- **Uso**: 8 referencias activas
- **Propósito**: Roles de usuarios por tenant
- **Archivos**: `UserManagementSimple.jsx`, `UserManagement.jsx`
- **Funcionalidad**: Sistema de roles granular

### **2. `user_recinto_assignments` - ✅ CRÍTICA**
- **Uso**: 6 referencias activas
- **Propósito**: Asignación de recintos a usuarios
- **Archivos**: `Usuarios.jsx`, `useUserRecintos.js`
- **Funcionalidad**: Control de acceso por recinto

### **3. `user_tags` - ✅ IMPORTANTE**
- **Uso**: 4 referencias activas
- **Propósito**: Etiquetado de usuarios
- **Archivos**: `Tags.js`
- **Funcionalidad**: Categorización y filtrado

### **4. `user_tenant_assignments` - ✅ IMPORTANTE**
- **Uso**: 4 referencias activas
- **Propósito**: Asignación de usuarios SaaS a tenants
- **Archivos**: `SaasUserManagement.jsx`, `RoleBasedAccess.jsx`
- **Funcionalidad**: Multi-tenancy del SaaS

### **5. `user_tenant_info` - ✅ IMPORTANTE**
- **Uso**: 6 referencias activas
- **Propósito**: Información específica de usuarios por tenant
- **Archivos**: `UserManagementSimple.jsx`, `UserManagement.jsx`
- **Funcionalidad**: Estadísticas y estado de usuarios

### **6. `user_activity_log` - ✅ ÚTIL**
- **Uso**: 1 referencia activa
- **Propósito**: Log de actividad de usuarios
- **Archivos**: `userProfileService.js`
- **Funcionalidad**: Auditoría y seguimiento

---

## ❌ **TABLAS REDUNDANTES (ELIMINAR):**

### **1. `admin_users` - ❌ NO SE USA**
- **Uso**: 0 referencias en el código
- **Datos**: Solo 2 registros
- **Redundancia**: Información ya está en `profiles`
- **Acción**: **ELIMINAR**

### **2. `user_activity` - ❌ NO SE USA**
- **Uso**: 0 referencias en el código
- **Datos**: Solo 6 registros
- **Redundancia**: Funcionalidad duplicada con `user_activity_log`
- **Acción**: **ELIMINAR**

### **3. `user_permissions` - ❌ NO SE USA**
- **Uso**: 0 referencias en el código
- **Datos**: Solo 6 registros
- **Redundancia**: Permisos ya están en `profiles.permisos`
- **Acción**: **ELIMINAR**

### **4. `user_sessions` - ❌ NO SE USA**
- **Uso**: 0 referencias en el código
- **Datos**: Solo 6 registros
- **Redundancia**: Supabase maneja sesiones automáticamente
- **Acción**: **ELIMINAR**

---

## 🗑️ **SCRIPT DE LIMPIEZA:**

```sql
-- ELIMINAR TABLAS REDUNDANTES
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
```

---

## 📊 **RESUMEN DE BENEFICIOS:**

### **✅ MANTENER (6 tablas):**
- `tenant_user_roles` - Sistema de roles
- `user_recinto_assignments` - Control de acceso por recinto
- `user_tags` - Etiquetado de usuarios
- `user_tenant_assignments` - Multi-tenancy SaaS
- `user_tenant_info` - Información específica por tenant
- `user_activity_log` - Auditoría de usuarios

### **❌ ELIMINAR (4 tablas):**
- `admin_users` - Redundante con `profiles`
- `user_activity` - Redundante con `user_activity_log`
- `user_permissions` - Redundante con `profiles.permisos`
- `user_sessions` - Supabase maneja sesiones

### **🎯 RESULTADO:**
- **Reducción**: 10 tablas → 6 tablas (40% menos)
- **Simplificación**: Eliminación de redundancias
- **Mejor rendimiento**: Menos tablas que consultar
- **Código más limpio**: Solo tablas necesarias
