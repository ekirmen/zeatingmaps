# Sistema de Verificación de Tenants (Empresas)

## Descripción General

Este sistema implementa una capa de seguridad que asegura que cada usuario esté asociado a una empresa específica (tenant) y que solo pueda acceder a los datos de su empresa correspondiente.

## Componentes Implementados

### 1. Servicio de Autenticación (`src/store/services/authService.js`)

#### Funciones Principales:
- **`registerUser`**: Registra usuarios y asigna automáticamente el `tenant_id` correspondiente
- **`loginUser`**: Verifica que el usuario tenga acceso al tenant actual
- **`verifyTenantAccess`**: Verifica el acceso del usuario al tenant en tiempo real

#### Características de Seguridad:
- Asignación automática de `tenant_id` durante el registro
- Verificación de acceso al tenant durante el login
- Prevención de acceso cruzado entre empresas

### 2. Hook de Verificación (`src/hooks/useTenantAccess.js`)

#### Funcionalidades:
- Verificación en tiempo real del acceso al tenant
- Estado de carga y manejo de errores
- Función de refresco para re-verificar acceso

#### Uso:
```javascript
const { hasAccess, loading, reason, isTenantUser } = useTenantAccess();
```

### 3. Componente de Protección (`src/components/TenantAccessGuard.js`)

#### Características:
- Protección automática basada en el tenant del usuario
- Alertas de seguridad para usuarios sin empresa asignada
- Manejo de errores de acceso con opciones de recuperación

#### Uso:
```javascript
<TenantAccessGuard>
  <ComponenteProtegido />
</TenantAccessGuard>
```

### 4. Ruta Protegida Mejorada (`src/store/components/ProtectedRoute.js`)

#### Funcionalidades:
- Verificación de autenticación
- Verificación de acceso al tenant
- Opción para deshabilitar la verificación de tenant si es necesario

#### Uso:
```javascript
<ProtectedRoute requireTenantAccess={true}>
  <ComponenteProtegido />
</ProtectedRoute>
```

## Flujo de Verificación

### 1. Registro de Usuario
```
Usuario se registra → Sistema detecta tenant actual → Asigna tenant_id automáticamente
```

### 2. Login de Usuario
```
Usuario inicia sesión → Sistema verifica tenant_id → Valida acceso al tenant actual
```

### 3. Acceso a Recursos
```
Usuario accede a recurso → Sistema verifica tenant_id → Permite/deniega acceso
```

## Configuración de Base de Datos

### Estructura Requerida:
- Tabla `tenants` con campos: `id`, `company_name`, `subdomain`, `domain`, `status`
- Tabla `profiles` con campo `tenant_id` que referencia `tenants.id`
- Políticas RLS configuradas para filtrar por `tenant_id`

### Scripts de Verificación:
- `scripts/verify_and_fix_tenant_users.sql`: Script completo para verificar y corregir usuarios

## Implementación en Componentes

### Store (Tienda Pública)
```javascript
// Solo requiere autenticación para pagos
<ProtectedRoute requireTenantAccess={false}>
  <Pay />
</ProtectedRoute>
```

### Dashboard (Panel de Administración)
```javascript
// Requiere autenticación y verificación de tenant
<TenantAccessGuard>
  <DashboardContent />
</TenantAccessGuard>
```

## Manejo de Errores

### Casos Comunes:
1. **Usuario sin tenant_id**: Se muestra advertencia y se limita funcionalidad
2. **Acceso a empresa diferente**: Se deniega el acceso con mensaje explicativo
3. **Tenant no válido**: Se redirige al usuario al store principal

### Recuperación:
- Botón para volver al store
- Opción de cerrar sesión
- Contacto con soporte para casos especiales

## Seguridad Implementada

### Niveles de Protección:
1. **Nivel de Aplicación**: Verificación en componentes React
2. **Nivel de Servicio**: Verificación en servicios de autenticación
3. **Nivel de Base de Datos**: Políticas RLS y filtros por tenant_id

### Prevención de:
- Acceso cruzado entre empresas
- Registro de usuarios sin empresa asignada
- Manipulación de datos de otras empresas

## Monitoreo y Debugging

### Logs del Sistema:
- Verificación de tenant durante login
- Asignación automática de tenant_id
- Intentos de acceso no autorizado

### Herramientas de Diagnóstico:
- Hook `useTenantAccess` para debugging
- Scripts SQL para verificar estado de la base de datos
- Componentes de alerta para usuarios sin tenant

## Configuración del Entorno

### Variables de Entorno:
```bash
# Configuración del tenant principal (opcional)
REACT_APP_MAIN_TENANT_ID=uuid-del-tenant-principal
REACT_APP_DEFAULT_TENANT_ID=uuid-del-tenant-por-defecto
```

### Configuración del Dominio:
- Detección automática de tenant por subdominio
- Fallback a tenant por defecto si no se detecta
- Soporte para múltiples dominios y subdominios

## Mantenimiento

### Tareas Regulares:
1. Verificar usuarios sin tenant_id asignado
2. Revisar políticas RLS de la base de datos
3. Monitorear intentos de acceso no autorizado
4. Actualizar configuración de tenants según sea necesario

### Scripts de Mantenimiento:
- `verify_and_fix_tenant_users.sql`: Verificación y corrección automática
- Función `cleanup_orphan_users()`: Limpieza de usuarios huérfanos (opcional)

## Consideraciones de Producción

### Seguridad:
- Habilitar verificación estricta de tenant en producción
- Implementar logging de auditoría para accesos
- Configurar alertas para intentos de acceso no autorizado

### Rendimiento:
- Índices en campos `tenant_id` para consultas eficientes
- Cache de verificación de tenant para usuarios activos
- Lazy loading de verificaciones de acceso

### Escalabilidad:
- Soporte para múltiples tenants por usuario (futuro)
- Sistema de roles y permisos por tenant
- API para gestión de tenants desde el panel de administración

## Troubleshooting

### Problemas Comunes:
1. **Usuario no puede acceder**: Verificar que tenga `tenant_id` asignado
2. **Error de tenant**: Verificar configuración del dominio y tenant
3. **Acceso denegado**: Verificar políticas RLS de la base de datos

### Soluciones:
- Ejecutar script de verificación de usuarios
- Revisar configuración del TenantContext
- Verificar políticas de seguridad de la base de datos
