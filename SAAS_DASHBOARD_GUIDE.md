# Panel de Administración SaaS - Guía de Uso

## Descripción General

El Panel de Administración SaaS permite gestionar múltiples empresas (tenants) que utilizan tu plataforma de ticketera. Cada empresa tiene su propio subdominio y configuración personalizada.

## Funcionalidades Implementadas

### 1. Dashboard SaaS (`/dashboard/saas`)

#### Estadísticas Principales
- **Total Empresas**: Número total de empresas registradas
- **Empresas Activas**: Empresas con estado "activo"
- **Ingresos Totales**: Suma de todas las facturas pagadas
- **Facturas Pendientes**: Número de facturas por cobrar

#### Gestión de Empresas
- **Lista de Empresas**: Tabla con todas las empresas registradas
- **Crear Nueva Empresa**: Formulario para registrar una nueva empresa
- **Editar Empresa**: Modificar información de empresas existentes
- **Eliminar Empresa**: Eliminar empresas de la plataforma

#### Información de Empresa
- Nombre de la empresa
- Subdominio (ej: `miempresa.ticketera.com`)
- Plan contratado (Basic, Pro, Enterprise)
- Estado (Activo, Suspendido, Cancelado)
- Información de contacto
- Colores personalizados

### 2. Vista Detallada de Empresa (`/dashboard/saas/tenant/:tenantId`)

#### Información Básica
- Detalles completos de la empresa
- Estadísticas específicas de la empresa
- Configuración de colores personalizados

#### Estadísticas de la Empresa
- **Total Eventos**: Número de eventos creados
- **Eventos Activos**: Eventos en estado activo
- **Total Usuarios**: Usuarios registrados en la empresa
- **Ingresos Totales**: Ingresos generados por la empresa

#### Pestañas de Información
1. **Facturación**: Historial de facturas y pagos
2. **Métricas de Uso**: Estadísticas de uso del sistema
3. **Configuración**: Límites del plan y configuración de dominio
4. **Actividad Reciente**: Timeline de actividades

### 3. Configuración del Sistema (`/dashboard/saas/settings`)

#### Gestión de Planes
- **Crear Planes**: Definir nuevos tipos de planes
- **Editar Planes**: Modificar límites y precios
- **Eliminar Planes**: Eliminar planes no utilizados

#### Configuración General
- **Plan por Defecto**: Plan asignado a nuevas empresas
- **Días de Prueba Gratuita**: Período de prueba para nuevas empresas
- **Longitud Máxima de Subdominio**: Límite de caracteres para subdominios
- **Habilitar SSL Automático**: Configuración de certificados SSL
- **Habilitar Analytics**: Configuración de análisis
- **Habilitar Backups Automáticos**: Configuración de respaldos

#### Configuración de Facturación
- **Stripe Publishable Key**: Clave pública de Stripe
- **Stripe Secret Key**: Clave secreta de Stripe
- **Webhook Secret**: Secreto para webhooks
- **Moneda por Defecto**: Moneda principal del sistema
- **Impuestos**: Porcentaje de impuestos aplicado
- **Días de Gracia**: Período de gracia para pagos

#### Configuración de Base de Datos
- **Límite de Conexiones**: Conexiones por tenant
- **Tiempo de Timeout**: Tiempo máximo de conexión
- **Pool de Conexiones**: Configuración de pool
- **Frecuencia de Backup**: Programación de respaldos
- **Retención de Backups**: Días de retención
- **Compresión de Backups**: Configuración de compresión

## Estructura de Base de Datos

### Tablas Principales

#### `tenants`
```sql
- id (UUID): Identificador único
- subdomain (VARCHAR): Subdominio de la empresa
- company_name (VARCHAR): Nombre de la empresa
- contact_email (VARCHAR): Email de contacto
- contact_phone (VARCHAR): Teléfono de contacto
- plan_type (VARCHAR): Tipo de plan (basic, pro, enterprise)
- status (VARCHAR): Estado (active, suspended, cancelled)
- primary_color (VARCHAR): Color primario personalizado
- secondary_color (VARCHAR): Color secundario personalizado
- created_at (TIMESTAMP): Fecha de creación
- updated_at (TIMESTAMP): Fecha de actualización
```

#### `plan_limits`
```sql
- id (UUID): Identificador único
- plan_type (VARCHAR): Tipo de plan
- max_events (INTEGER): Máximo de eventos permitidos
- max_users (INTEGER): Máximo de usuarios permitidos
- max_storage_gb (INTEGER): Almacenamiento máximo en GB
- price_monthly (DECIMAL): Precio mensual
- price_yearly (DECIMAL): Precio anual
- features (JSONB): Características del plan
```

#### `invoices`
```sql
- id (UUID): Identificador único
- tenant_id (UUID): Referencia al tenant
- invoice_number (VARCHAR): Número de factura
- description (TEXT): Descripción de la factura
- amount (DECIMAL): Monto de la factura
- status (VARCHAR): Estado (pending, paid, overdue)
- created_at (TIMESTAMP): Fecha de creación
```

#### `usage_metrics`
```sql
- id (UUID): Identificador único
- tenant_id (UUID): Referencia al tenant
- events_created (INTEGER): Eventos creados en el período
- active_users (INTEGER): Usuarios activos
- sales_count (INTEGER): Número de ventas
- revenue (DECIMAL): Ingresos generados
- created_at (TIMESTAMP): Fecha de la métrica
```

## Flujo de Trabajo

### 1. Crear una Nueva Empresa
1. Ir al Dashboard SaaS (`/dashboard/saas`)
2. Hacer clic en "Nueva Empresa"
3. Completar el formulario:
   - Subdominio (ej: `miempresa`)
   - Nombre de la empresa
   - Email de contacto
   - Teléfono (opcional)
   - Plan (Basic, Pro, Enterprise)
   - Estado (Activo por defecto)
   - Colores personalizados
4. Guardar la empresa

### 2. Gestionar una Empresa Existente
1. En la lista de empresas, hacer clic en "Ver detalles"
2. Revisar estadísticas y configuración
3. Editar información si es necesario
4. Revisar facturación y métricas de uso

### 3. Configurar Planes
1. Ir a Configuración (`/dashboard/saas/settings`)
2. En la pestaña "Gestión de Planes"
3. Crear, editar o eliminar planes según necesidades
4. Configurar límites y precios

### 4. Configurar el Sistema
1. En Configuración, revisar todas las pestañas:
   - Configuración General
   - Configuración de Facturación
   - Configuración de Base de Datos
2. Ajustar parámetros según necesidades
3. Guardar configuración

## Características Técnicas

### Multi-tenancy
- Cada empresa tiene su propio subdominio
- Datos completamente separados por tenant
- Configuración personalizada por empresa
- Límites específicos por plan

### Seguridad
- Autenticación requerida para acceso
- Separación de datos por tenant
- Configuración SSL por subdominio
- Backups automáticos

### Escalabilidad
- Arquitectura preparada para múltiples tenants
- Límites configurables por plan
- Métricas de uso en tiempo real
- Sistema de facturación integrado

## Próximas Funcionalidades

### Fase 2 - Integración Completa
- [ ] Integración con Stripe para pagos
- [ ] Webhooks para actualizaciones automáticas
- [ ] Sistema de notificaciones por email
- [ ] Dashboard de analytics avanzado

### Fase 3 - Automatización
- [ ] Creación automática de subdominios
- [ ] Configuración automática de SSL
- [ ] Provisioning automático de recursos
- [ ] Sistema de alertas y monitoreo

### Fase 4 - Funcionalidades Avanzadas
- [ ] API para integraciones externas
- [ ] Sistema de white-label
- [ ] Marketplace de aplicaciones
- [ ] Sistema de partners y comisiones

## Comandos SQL para Configuración Inicial

```sql
-- Ejecutar el script saas_database_schema.sql en Supabase
-- Este script crea todas las tablas necesarias para el sistema SaaS

-- Verificar que las tablas se crearon correctamente
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'plan_limits', 'invoices', 'usage_metrics');

-- Insertar datos de ejemplo para planes
INSERT INTO plan_limits (plan_type, max_events, max_users, max_storage_gb, price_monthly, price_yearly) VALUES
('basic', 5, 100, 10, 29.99, 299.99),
('pro', 50, 1000, 50, 99.99, 999.99),
('enterprise', -1, -1, -1, 299.99, 2999.99);
```

## Notas Importantes

1. **Backup de Datos**: Siempre hacer backup antes de modificar configuraciones críticas
2. **Pruebas**: Probar cambios en un entorno de desarrollo antes de producción
3. **Monitoreo**: Revisar métricas de uso regularmente
4. **Soporte**: Documentar cambios y configuraciones para el equipo de soporte

## Contacto y Soporte

Para dudas o problemas con el Panel SaaS:
- Revisar logs del sistema
- Verificar configuración de base de datos
- Contactar al equipo de desarrollo
- Documentar el problema con capturas de pantalla
