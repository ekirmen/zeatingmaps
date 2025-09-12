# 📊 ANÁLISIS DE REDUNDANCIAS EN TABLA PROFILES

## 🔍 **CAMPOS ANALIZADOS:**

### **✅ CAMPOS ACTIVAMENTE USADOS:**

#### **Identificación:**
- `id` - **CRÍTICO** - Clave primaria, FK a auth.users
- `email` - **USADO** - Autenticación y comunicación
- `tenant_id` - **USADO** - Multi-tenancy, filtrado por empresa

#### **Datos Personales:**
- `nombre` - **USADO** - Display y formularios
- `apellido` - **USADO** - Display y formularios  
- `telefono` - **USADO** - Contacto y formularios
- `login` - **USADO** - Autenticación alternativa

#### **Sistema:**
- `role` - **USADO** - Control de acceso y permisos
- `activo` - **USADO** - Estado del usuario
- `is_active` - **USADO** - Estado del usuario (duplicado)
- `created_at` - **USADO** - Auditoría
- `updated_at` - **USADO** - Auditoría

#### **Configuración:**
- `permisos` - **USADO** - Control granular de acceso
- `permissions` - **USADO** - Control granular (duplicado)
- `canales` - **USADO** - Configuración de canales de venta
- `metodospago` - **USADO** - Configuración de pagos
- `recintos` - **USADO** - Asignación de recintos
- `tags` - **USADO** - Etiquetado y categorización

### **❌ CAMPOS REDUNDANTES/INNECESARIOS:**

#### **1. DUPLICADOS:**
- `activo` vs `is_active` - **MISMO PROPÓSITO**
- `permisos` vs `permissions` - **MISMO PROPÓSITO**
- `nombre` vs `full_name` - **MISMO PROPÓSITO**

#### **2. OBSOLETOS:**
- `empresa` - **OBSOLETO** - Reemplazado por tenant_id
- `perfil` - **OBSOLETO** - Reemplazado por role + permisos
- `formadepago` - **OBSOLETO** - Reemplazado por metodospago

## 🗑️ **CAMPOS RECOMENDADOS PARA ELIMINAR:**

### **1. DUPLICADOS:**
```sql
-- Eliminar duplicados (mantener solo uno de cada par)
ALTER TABLE profiles DROP COLUMN IF EXISTS is_active;  -- Mantener 'activo'
ALTER TABLE profiles DROP COLUMN IF EXISTS permissions; -- Mantener 'permisos'  
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;   -- Mantener 'nombre'
```

### **2. OBSOLETOS:**
```sql
-- Eliminar campos obsoletos
ALTER TABLE profiles DROP COLUMN IF EXISTS empresa;     -- Usar tenant_id
ALTER TABLE profiles DROP COLUMN IF EXISTS perfil;      -- Usar role + permisos
ALTER TABLE profiles DROP COLUMN IF EXISTS formadepago; -- Usar metodospago
```

## 📊 **IMPACTO DE LA LIMPIEZA:**

### **✅ BENEFICIOS:**
- **Reducción de redundancia** - 6 campos eliminados
- **Simplificación** - Menos confusión en el código
- **Mejor rendimiento** - Menos datos por fila
- **Mantenimiento** - Menos campos que sincronizar

### **⚠️ CONSIDERACIONES:**
- **Migración de datos** - Mover datos de campos obsoletos
- **Actualización de código** - Cambiar referencias
- **Testing** - Verificar funcionalidad

## 🔧 **PLAN DE MIGRACIÓN:**

### **PASO 1: BACKUP Y PREPARACIÓN**
```sql
-- Crear backup
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Verificar datos en campos obsoletos
SELECT COUNT(*) FROM profiles WHERE empresa IS NOT NULL;
SELECT COUNT(*) FROM profiles WHERE perfil IS NOT NULL;
SELECT COUNT(*) FROM profiles WHERE formadepago IS NOT NULL;
```

### **PASO 2: MIGRAR DATOS IMPORTANTES**
```sql
-- Migrar empresa a tenant_id (si es necesario)
-- Migrar perfil a role (si es necesario)
-- Migrar formadepago a metodospago (si es necesario)
```

### **PASO 3: ELIMINAR CAMPOS**
```sql
-- Eliminar campos redundantes y obsoletos
ALTER TABLE profiles DROP COLUMN IF EXISTS is_active;
ALTER TABLE profiles DROP COLUMN IF EXISTS permissions;
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS empresa;
ALTER TABLE profiles DROP COLUMN IF EXISTS perfil;
ALTER TABLE profiles DROP COLUMN IF EXISTS formadepago;
```

### **PASO 4: ACTUALIZAR ÍNDICES**
```sql
-- Eliminar índices de campos eliminados
DROP INDEX IF EXISTS idx_profiles_is_active;
DROP INDEX IF EXISTS idx_profiles_permisos; -- Si se eliminó permissions
```

## 📋 **CAMPOS FINALES RECOMENDADOS:**

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  login text UNIQUE,
  nombre varchar(255),
  apellido varchar(255),
  telefono text,
  email varchar(255),
  tenant_id uuid,
  role text,
  activo boolean DEFAULT true,
  permisos jsonb DEFAULT '{}',
  canales jsonb DEFAULT '{"test": false, "internet": false, "boxOffice": false, "marcaBlanca": false}',
  metodospago jsonb DEFAULT '{"zelle": false, "paypal": false, "efectivo": false, "pagoMovil": false, "puntoVenta": false, "procesadorPago": false}',
  recintos uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

## ✅ **RESULTADO:**
- **6 campos eliminados** - Redundancia eliminada
- **Estructura simplificada** - Más clara y mantenible
- **Mejor rendimiento** - Menos datos por fila
- **Código más limpio** - Sin confusión de campos duplicados
