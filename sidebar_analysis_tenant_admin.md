# 📋 Análisis Completo del Sidebar para TENANT_ADMIN

## 🔍 **Permisos del rol TENANT_ADMIN:**
```javascript
[ROLES.TENANT_ADMIN]: [
  'dashboard',
  'administracion', 
  'recintos',
  'plano',
  'usuarios',
  'liquidaciones',
  'programacion',
  'crm',
  'reports',
  'personalizacion',
  'boleteria',
  'usuarios_del_tenant',
  'configuración_del_tenant',
  'facturación_del_tenant'
]
```

## 📊 **Análisis del Sidebar Completo:**

### ✅ **1. Dashboard** 
- **Ruta:** `/dashboard`
- **Permiso:** `dashboard` ✅
- **Estado:** **VISIBLE**

### ✅ **2. Administración**
- **Ruta:** Submenu
- **Permiso:** `administracion` ✅
- **Estado:** **VISIBLE**
- **Subitems:**
  - ✅ **Recintos** (`/dashboard/recintos`) - Permiso: `recintos` ✅
  - ✅ **Plano** (`/dashboard/plano`) - Permiso: `plano` ✅  
  - ✅ **Usuarios** (`/dashboard/usuarios`) - Permiso: `usuarios` ✅
  - ✅ **Liquidaciones** (`/dashboard/liquidaciones`) - Permiso: `liquidaciones` ✅

### ✅ **3. Programación**
- **Ruta:** Submenu
- **Permiso:** `programacion` ✅
- **Estado:** **VISIBLE**
- **Subitems:**
  - ✅ **Entradas** (`/dashboard/entradas`) - Permiso: `programacion` ✅
  - ✅ **Plantillas de precios** (`/dashboard/plantillas-precios`) - Permiso: `programacion` ✅
  - ✅ **Productos** (`/dashboard/productos`) - Permiso: `programacion` ✅
  - ✅ **Plantillas de Productos** (`/dashboard/plantillas-productos`) - Permiso: `programacion` ✅
  - ✅ **Comisiones y tasas** (`/dashboard/comisiones`) - Permiso: `programacion` ✅
  - ✅ **Pasarelas de Pago** (`/dashboard/payment-gateways`) - Permiso: `programacion` ✅
  - ✅ **IVA** (`/dashboard/iva`) - Permiso: `programacion` ✅
  - ✅ **Descuentos** (`/dashboard/descuentos`) - Permiso: `programacion` ✅
  - ✅ **Abonos** (`/dashboard/abonos`) - Permiso: `programacion` ✅
  - ✅ **Eventos** (`/dashboard/eventos`) - Permiso: `programacion` ✅
  - ✅ **Funciones** (`/dashboard/funciones`) - Permiso: `programacion` ✅

### ✅ **4. CRM**
- **Ruta:** Submenu
- **Permiso:** `crm` ✅
- **Estado:** **VISIBLE**
- **Subitems:**
  - ✅ **Mailchimp** (`/dashboard/mailchimp`) - Permiso: `crm` ✅
  - ✅ **Formularios** (`/dashboard/formularios`) - Permiso: `crm` ✅
  - ✅ **Notificaciones** (`/dashboard/notificaciones`) - Permiso: `crm` ✅
  - ✅ **Encuestas** (`/dashboard/encuestas`) - Permiso: `crm` ✅
  - ✅ **Campañas de mailing** (`/dashboard/email-campaigns`) - Permiso: `crm` ✅
  - ✅ **Etiquetas** (`/dashboard/tags`) - Permiso: `crm` ✅

### ✅ **5. Informes**
- **Ruta:** Submenu
- **Permiso:** `reports` ✅
- **Estado:** **VISIBLE**
- **Subitems:**
  - ✅ **Reportes Detallados** (`/dashboard/reports`) - Permiso: `reports` ✅
  - ✅ **Programar Correo** (`/dashboard/scheduled-reports`) - Permiso: `reports` ✅
  - ✅ **Plantillas de Email** (`/dashboard/email-templates`) - Permiso: `reports` ✅

### ✅ **6. Personalización**
- **Ruta:** Submenu
- **Permiso:** `personalizacion` ✅
- **Estado:** **VISIBLE**
- **Subitems:**
  - ✅ **Formatos de entrada** (`/dashboard/formato-entrada`) - Permiso: `personalizacion` ✅
  - ✅ **Textos legales** (`/dashboard/legal-texts`) - Permiso: `personalizacion` ✅
  - ✅ **Web Studio** (`/dashboard/webstudio`) - Permiso: `personalizacion` ✅
  - ✅ **Configuración de Asientos** (`/dashboard/seat-settings`) - Permiso: `personalizacion` ✅
  - ✅ **Configuración de Correo** (`/dashboard/email-config`) - Permiso: `personalizacion` ✅
  - ✅ **Páginas** (`/dashboard/pages`) - Permiso: `personalizacion` ✅
  - ✅ **Colores Web** (`/dashboard/webcolors`) - Permiso: `personalizacion` ✅

### ✅ **7. Boletería**
- **Ruta:** `/dashboard/boleteria`
- **Permiso:** `boleteria` ✅
- **Estado:** **VISIBLE**

### ❌ **8. Panel SaaS**
- **Ruta:** Submenu
- **Permiso:** `saas` ❌ (NO TIENE ESTE PERMISO)
- **Estado:** **OCULTO**
- **Subitems:**
  - ❌ **Dashboard SaaS** (`/dashboard/saas`) - Permiso: `saas` ❌
  - ❌ **Facturación** (`/dashboard/saas/billing`) - Permiso: `saas` ❌
  - ❌ **Pasarelas de Pago** (`/dashboard/saas/payment-gateways`) - Permiso: `saas` ❌
  - ❌ **Roles y Permisos** (`/dashboard/saas/roles`) - Permiso: `saas` ❌
  - ❌ **API Explorer** (`/dashboard/saas/api-explorer`) - Permiso: `saas` ❌
  - ❌ **Configuración** (`/dashboard/saas/settings`) - Permiso: `saas` ❌

## 🎯 **Resumen:**

### ✅ **VISIBLE para TENANT_ADMIN (7 secciones):**
1. **Dashboard** - Acceso completo
2. **Administración** - 4 subitems
3. **Programación** - 11 subitems  
4. **CRM** - 6 subitems
5. **Informes** - 3 subitems
6. **Personalización** - 7 subitems (incluye Web Studio)
7. **Boletería** - Acceso directo

### ❌ **OCULTO para TENANT_ADMIN (1 sección):**
1. **Panel SaaS** - 6 subitems (requiere permiso `saas`)

## 🔧 **Problema identificado:**

El **Panel SaaS** se muestra en el sidebar pero TENANT_ADMIN no tiene el permiso `saas`. Esto puede causar:
- Confusión al usuario
- Intentos de acceso a rutas restringidas
- Errores 403

## 💡 **Solución recomendada:**

El sidebar debería usar el sistema de permisos para ocultar automáticamente las secciones que el usuario no puede acceder.
