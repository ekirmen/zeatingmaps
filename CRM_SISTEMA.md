# Sistema CRM - Campañas de Correo Electrónico

## 📧 **Descripción General**

El sistema CRM de campañas de correo electrónico permite gestionar y ejecutar campañas de marketing por email de manera eficiente. Incluye funcionalidades para crear, editar, programar y analizar el rendimiento de las campañas.

## 🎯 **Características Principales**

### **1. Gestión de Campañas**
- ✅ **Crear nuevas campañas** con configuración completa
- ✅ **Editar campañas existentes** en cualquier momento
- ✅ **Eliminar campañas** con confirmación
- ✅ **Vista previa** de campañas antes del envío
- ✅ **Estados de campaña**: Borrador, Activa, Pausada

### **2. Tipos de Campaña**
- 📬 **Newsletter** - Boletines informativos regulares
- 🔄 **Renovación del abono de temporada** - Recordatorios de renovación
- ℹ️ **Información para los compradores** - Comunicaciones post-venta
- 🎫 **Invitación** - Invitaciones a eventos especiales
- 🎨 **Personalización de correo electrónico** - Campañas personalizadas

### **3. Configuración Avanzada**
- 📝 **Plantillas de correo** predefinidas
- 🏷️ **Etiquetas personalizables** ($buyerName, $buyerSurname, $buyerEmail)
- 📊 **Seguimiento UTM** para análisis
- 🧪 **Envío de pruebas** antes del lanzamiento
- 📈 **Métricas de rendimiento** en tiempo real

## 🏗️ **Estructura del Sistema**

### **Páginas Principales**

#### **1. Dashboard CRM (`/dashboard/crm`)**
```
📊 Panel principal con:
├── 📈 Estadísticas generales
├── 📋 Lista de campañas
├── 🎯 Métricas de rendimiento
└── ⚡ Acciones rápidas
```

#### **2. Modal de Creación/Edición**
```
🎨 Interfaz dividida en dos columnas:
├── 📝 Columna Izquierda - Configuración
│   ├── Nombre de campaña
│   ├── Tipo de campaña
│   ├── Plantilla de correo
│   ├── Canal de envío
│   └── Asunto del correo
└── 📊 Columna Derecha - Analítica
    ├── Nombre UTM
    ├── Opciones de prueba
    └── Estado de campaña
```

## 📊 **Métricas y Analítica**

### **Estadísticas Principales**
- **Total de Campañas**: Número total de campañas creadas
- **Campañas Activas**: Campañas actualmente en ejecución
- **Borradores**: Campañas en estado de borrador
- **Total Enviados**: Número total de emails enviados

### **Métricas por Campaña**
- **Enviados**: Número de emails enviados
- **Tasa de Apertura**: Porcentaje de emails abiertos
- **Tasa de Clics**: Porcentaje de clics en enlaces
- **Fecha de Creación**: Cuándo se creó la campaña

## 🎨 **Interfaz de Usuario**

### **Dashboard Principal**
```javascript
// Componente principal
<CRM setSidebarCollapsed={setSidebarCollapsed} />
```

### **Características de la UI**
- 🎨 **Diseño responsivo** con Tailwind CSS
- 📱 **Interfaz móvil** optimizada
- 🎯 **Navegación intuitiva** con iconos descriptivos
- ⚡ **Carga rápida** con estados de loading
- 🎨 **Colores consistentes** con el tema de la aplicación

### **Estados Visuales**
```css
/* Estados de campaña */
.active    → bg-green-100 text-green-800
.draft     → bg-yellow-100 text-yellow-800
.paused    → bg-red-100 text-red-800
```

## 🔧 **Funcionalidades Técnicas**

### **Gestión de Estado**
```javascript
const [campaigns, setCampaigns] = useState([]);
const [loading, setLoading] = useState(true);
const [showCreateModal, setShowCreateModal] = useState(false);
const [selectedCampaign, setSelectedCampaign] = useState(null);
```

### **Operaciones CRUD**
- ✅ **CREATE**: Crear nuevas campañas
- 📖 **READ**: Leer lista de campañas y detalles
- 🔄 **UPDATE**: Editar campañas existentes
- 🗑️ **DELETE**: Eliminar campañas con confirmación

### **Validaciones**
- ✅ **Campos requeridos** validados
- ✅ **Formato de email** verificado
- ✅ **Confirmación** para acciones destructivas
- ✅ **Estados de carga** para operaciones asíncronas

## 📧 **Configuración de Campañas**

### **Campos de Configuración**

#### **Información Básica**
- **Nombre de la campaña**: Identificador descriptivo
- **Tipo de campaña**: Categorización del contenido
- **Plantilla de correo**: Diseño predefinido
- **Canal de envío**: Plataforma de distribución

#### **Contenido del Email**
- **Asunto del correo**: Línea de asunto personalizable
- **Etiquetas dinámicas**: $buyerName, $buyerSurname, $buyerEmail
- **Plantilla HTML**: Contenido personalizable

#### **Configuración Analítica**
- **Nombre UTM**: Para seguimiento de campañas
- **Email de prueba**: Para verificación antes del envío
- **Métricas de seguimiento**: Apertura, clics, conversiones

## 🚀 **Flujo de Trabajo**

### **1. Crear Nueva Campaña**
```
1. Click en "Nueva Campaña"
2. Llenar información básica
3. Seleccionar plantilla
4. Configurar asunto
5. Enviar prueba
6. Revisar y lanzar
```

### **2. Editar Campaña Existente**
```
1. Seleccionar campaña de la lista
2. Click en "Editar"
3. Modificar configuración
4. Guardar cambios
5. Relanzar si es necesario
```

### **3. Monitorear Rendimiento**
```
1. Ver métricas en tiempo real
2. Analizar tasas de apertura
3. Revisar clics y conversiones
4. Optimizar futuras campañas
```

## 🔗 **Integración con el Sistema**

### **Navegación**
- 📍 **Ruta**: `/dashboard/crm`
- 🧭 **Menú**: CRM → Campaña Email
- 🔄 **Integración**: Con el sistema de navegación existente

### **Dependencias**
```javascript
// Iconos
import { AiOutlineMail, AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineEye } from 'react-icons/ai';

// Notificaciones
import { toast } from 'react-hot-toast';

// Routing
import { useLocation } from 'react-router-dom';
```

## 📈 **Próximas Mejoras**

### **Funcionalidades Planificadas**
- 📊 **Reportes avanzados** con gráficos
- 🎯 **Segmentación de audiencia** más granular
- 📅 **Programación automática** de campañas
- 🔄 **A/B Testing** integrado
- 📱 **Plantillas móviles** optimizadas
- 🔗 **Integración con redes sociales**

### **Optimizaciones Técnicas**
- ⚡ **Caché inteligente** para mejor rendimiento
- 🔍 **Búsqueda avanzada** en campañas
- 📋 **Filtros múltiples** por estado, tipo, fecha
- 📤 **Exportación de datos** en múltiples formatos

## 🛠️ **Mantenimiento y Soporte**

### **Logs y Monitoreo**
- 📝 **Logs de actividad** para auditoría
- ⚠️ **Alertas de errores** en tiempo real
- 📊 **Métricas de rendimiento** del sistema

### **Backup y Seguridad**
- 💾 **Backup automático** de configuraciones
- 🔐 **Encriptación** de datos sensibles
- 👥 **Control de acceso** por roles

---

## 📞 **Soporte Técnico**

Para soporte técnico o consultas sobre el sistema CRM, contacta al equipo de desarrollo.

**Versión**: 1.0.0  
**Última actualización**: Enero 2024  
**Estado**: ✅ Activo y funcional 