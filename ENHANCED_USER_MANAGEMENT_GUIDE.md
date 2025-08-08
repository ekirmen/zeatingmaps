# 🚀 Guía del Sistema de Gestión Avanzada de Usuarios

## 📋 Descripción General

El sistema de gestión de usuarios ha sido completamente mejorado para incluir funcionalidades avanzadas de control de acceso, permisos granulares y gestión de recintos. Este sistema permite una administración detallada de usuarios con diferentes roles y capacidades.

## 🎯 Características Principales

### 1. **Perfiles de Usuario**
- **Gerente**: Acceso completo al sistema
- **Taquilla**: Gestión de ventas y boletos
- **Agencias**: Gestión de agencias externas
- **Call Center**: Atención al cliente
- **Contenido/Marketing**: Gestión de contenido y marketing
- **Atención al cliente**: Soporte y atención
- **Vendedor externo**: Ventas externas
- **Reportes**: Acceso a reportes y analytics

### 2. **Canales de Acceso**
- **Box Office**: Venta física en taquilla
- **Internet**: Venta online
- **Marca Blanca**: Plataformas de terceros
- **Test**: Ambiente de pruebas

### 3. **Permisos Granulares**

#### Permisos de Administración
- `ADMIN`: Administración general
- `SUPER`: Administración de sistema
- `MG_USERS`: Gestión de usuarios
- `MG_ORGS`: Gestión de empresas
- `MG_VENUES`: Gestión de recintos
- `MG_USER_FEES`: Gestión de comisiones de usuarios
- `MG_SELLER_FEES`: Gestión de comisiones
- `MG_SETTLEMENTS`: Gestión de liquidaciones
- `CUSTOMIZATION`: Personalización
- `CRM`: Gestión de relaciones con clientes
- `ACCREDITATIONS`: Acreditaciones
- `REPORTS`: Permisos de informes

#### Permisos de Programación
- `PROGRAMMING`: Administración de funciones
- `MG_EVENTS`: Gestión de eventos
- `PR_USER_FEES`: Modificar comisiones del usuario
- `MG_QUOTAS`: Gestión de cupos
- `MG_PROMO`: Gestión de fidelizaciones y promociones
- `MG_SURVEYS`: Gestión de encuestas
- `MG_VIRTUAL_QUEUES`: Gestión de filas virtuales

#### Permisos de Venta
- `SELL`: Venta de boletos
- `CANCEL`: Cancelación de ventas
- `REFUND`: Devolución de boletos
- `REPRINT`: Reimpresión de boletos
- `SEARCH_ORDERS`: Búsqueda de ventas
- `UNPAID_BOOKINGS`: Gestión de reservas
- `MULTI_EVENT_ORDER`: Venta acumulada
- `BLOCK`: Bloqueos de asientos
- `SHOW_EVENT_ACTIVITY`: Mostrar actividad de evento

### 4. **Métodos de Pago**
- **Efectivo**: Pago en efectivo
- **Zelle**: Transferencias Zelle
- **Pago Móvil**: Pagos móviles
- **Paypal**: Pagos con PayPal
- **Punto de Venta**: Terminales POS
- **Procesador de Pago**: Procesadores externos

### 5. **Gestión de Recintos**
- Asignación específica de recintos por usuario
- Control de acceso por ubicación
- Gestión multi-tenant de recintos

## 🛠️ Instalación y Configuración

### 1. **Aplicar el Esquema de Base de Datos**

Ejecuta el script SQL para actualizar la base de datos:

```sql
-- Ejecutar el archivo: user_management_schema_updates.sql
```

### 2. **Componentes React**

El sistema incluye los siguientes componentes:

- `EnhancedEditUserForm.js`: Formulario avanzado de edición de usuarios
- `Usuarios.js`: Página principal de gestión de usuarios (actualizada)

### 3. **Estructura de Datos**

#### Tabla `profiles` (actualizada)
```sql
ALTER TABLE profiles ADD COLUMN perfil VARCHAR(50);
ALTER TABLE profiles ADD COLUMN activo BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN canales JSONB;
ALTER TABLE profiles ADD COLUMN permisos JSONB;
ALTER TABLE profiles ADD COLUMN metodosPago JSONB;
ALTER TABLE profiles ADD COLUMN recintos UUID[];
```

#### Tabla `recintos` (nueva)
```sql
CREATE TABLE recintos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    capacidad INTEGER,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    pais VARCHAR(100),
    tenant_id UUID REFERENCES tenants(id)
);
```

## 📖 Cómo Usar el Sistema

### 1. **Acceder al Panel de Usuarios**

1. Navega al dashboard de administración
2. Ve a la sección "Usuarios"
3. Haz clic en "Editar" en cualquier usuario

### 2. **Editar un Usuario**

El formulario de edición incluye:

#### Información Básica
- **Empresa**: Campo de solo lectura (automático)
- **Perfil**: Dropdown con opciones de perfil
- **Estado**: Switch activo/inactivo
- **Login**: Nombre de usuario
- **Nombre**: Nombre completo
- **Email**: Correo electrónico
- **Teléfono**: Número de contacto

#### Canales
- Selecciona los canales a los que el usuario tiene acceso
- Si no se selecciona ninguno, tiene acceso a todos

#### Permisos
- **Seleccionar todos**: Marca/desmarca todos los permisos
- **Permisos de administración**: Control administrativo
- **Permisos de programación**: Gestión de eventos
- **Permisos de venta**: Operaciones de venta

#### Métodos de Pago
- Selecciona los métodos de pago permitidos
- **Seleccionar todos**: Marca/desmarca todos los métodos

#### Recintos
- Lista de todos los recintos disponibles
- **Seleccionar todos**: Asigna todos los recintos
- Selección individual de recintos específicos

### 3. **Funciones de Utilidad**

#### Verificar Permisos
```javascript
// En el frontend
const hasPermission = user.permisos?.ADMIN === true;

// En el backend (PostgreSQL)
SELECT user_has_permission(user_id, 'ADMIN');
```

#### Verificar Acceso a Recinto
```javascript
// En el frontend
const hasVenueAccess = user.recintos?.includes(venueId);

// En el backend (PostgreSQL)
SELECT user_has_venue_access(user_id, venue_id);
```

#### Verificar Acceso a Canal
```javascript
// En el frontend
const hasChannelAccess = user.canales?.internet === true;

// En el backend (PostgreSQL)
SELECT user_has_channel_access(user_id, 'internet');
```

## 🔧 Configuración Avanzada

### 1. **Personalización de Perfiles**

Para agregar nuevos perfiles, edita el array `profileOptions` en `EnhancedEditUserForm.js`:

```javascript
const profileOptions = [
  { value: 'new_profile', label: 'Nuevo Perfil' },
  // ... otros perfiles
];
```

### 2. **Agregar Nuevos Permisos**

1. Agrega el permiso al estado inicial en `EnhancedEditUserForm.js`
2. Agrega el checkbox en la sección correspondiente
3. Actualiza la función `handlePermissionChange`
4. Actualiza el esquema de base de datos

### 3. **Agregar Nuevos Métodos de Pago**

1. Agrega el método al estado inicial
2. Agrega el checkbox en la sección de métodos de pago
3. Actualiza la función `handlePaymentMethodChange`

### 4. **Gestión de Recintos**

Para agregar recintos:

```sql
INSERT INTO recintos (nombre, ciudad, estado, pais, capacidad, tenant_id)
VALUES ('Nuevo Recinto', 'Ciudad', 'Estado', 'País', 1000, tenant_uuid);
```

## 🔒 Seguridad y Control de Acceso

### 1. **Políticas RLS (Row Level Security)**

El sistema incluye políticas de seguridad que controlan el acceso a los datos:

- Los usuarios solo pueden ver su propio perfil
- Los administradores pueden gestionar todos los perfiles
- Los usuarios con permisos específicos pueden gestionar recintos

### 2. **Validación de Permisos**

Siempre valida los permisos antes de permitir acciones:

```javascript
// Ejemplo de validación
if (!user.permisos?.MG_EVENTS) {
  toast.error('No tienes permisos para gestionar eventos');
  return;
}
```

## 📊 Reportes y Analytics

### 1. **Vistas Útiles**

El sistema incluye vistas predefinidas:

- `active_users_permissions`: Usuarios activos con permisos
- `users_by_profile`: Estadísticas por perfil

### 2. **Consultas Útiles**

```sql
-- Usuarios por perfil
SELECT perfil, COUNT(*) as total
FROM profiles 
WHERE activo = true 
GROUP BY perfil;

-- Usuarios con permisos específicos
SELECT nombre, email 
FROM profiles 
WHERE permisos->>'ADMIN' = 'true';

-- Recintos por usuario
SELECT p.nombre, array_length(p.recintos, 1) as num_recintos
FROM profiles p
WHERE p.activo = true;
```

## 🚨 Solución de Problemas

### 1. **Error al Cargar Recintos**

Verifica que la tabla `recintos` existe y tiene datos:

```sql
SELECT COUNT(*) FROM recintos;
```

### 2. **Permisos No Se Guardan**

Verifica que el campo `permisos` en la tabla `profiles` es de tipo JSONB:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'permisos';
```

### 3. **Usuario No Puede Acceder**

Verifica el estado activo y los permisos:

```sql
SELECT activo, permisos 
FROM profiles 
WHERE id = 'user_uuid';
```

## 🔄 Migración desde Sistema Anterior

### 1. **Actualizar Usuarios Existentes**

```sql
-- Establecer valores por defecto para usuarios existentes
UPDATE profiles 
SET 
  perfil = '2', -- Taquilla por defecto
  activo = true,
  canales = '{"boxOffice": true, "internet": true, "marcaBlanca": false, "test": false}'::jsonb,
  permisos = '{"SELL": true, "CANCEL": true, "REFUND": true}'::jsonb,
  metodosPago = '{"efectivo": true, "zelle": true, "pagoMovil": true, "paypal": true, "puntoVenta": true, "procesadorPago": true}'::jsonb,
  recintos = '{}'
WHERE perfil IS NULL;
```

### 2. **Crear Recintos Iniciales**

```sql
-- Insertar recintos básicos
INSERT INTO recintos (nombre, ciudad, estado, pais, capacidad)
VALUES 
  ('Recinto Principal', 'Ciudad Principal', 'Estado', 'País', 5000),
  ('Recinto Secundario', 'Ciudad Secundaria', 'Estado', 'País', 2000);
```

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:

1. Revisa esta documentación
2. Verifica los logs de la aplicación
3. Consulta la base de datos para verificar la estructura
4. Contacta al equipo de desarrollo

---

**Versión**: 1.0  
**Fecha**: Diciembre 2024  
**Autor**: Sistema de Gestión Avanzada de Usuarios
