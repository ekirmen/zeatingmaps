# Widgets de Email - Web Studio

## 📧 **Descripción General**

Los widgets de email son componentes especializados para crear plantillas de correo electrónico en el Web Studio. Permiten diseñar emails profesionales con elementos dinámicos y personalizables.

## 🎯 **Widgets Disponibles**

### **1. Elementos Básicos de Texto**

#### **📝 Título**
- **Descripción**: Título principal para emails
- **Configuración**: Campo de texto
- **Uso**: Encabezados principales de secciones

#### **📄 Subtítulo**
- **Descripción**: Subtítulo para emails
- **Configuración**: Campo de texto
- **Uso**: Subtítulos y encabezados secundarios

#### **📖 Paragraph**
- **Descripción**: Párrafo de texto para emails
- **Configuración**: Campo de texto
- **Uso**: Contenido principal de texto

### **2. Elementos Visuales**

#### **🖼️ Banner**
- **Descripción**: Banner para emails
- **Configuración**: 
  - Texto del banner
  - URL de la imagen
- **Uso**: Imágenes promocionales y headers

#### **📐 Separador**
- **Descripción**: Separador visual para emails
- **Configuración**: Campo de texto (opcional)
- **Uso**: Dividir secciones del email

### **3. Elementos de Eventos**

#### **🎫 Información del evento**
- **Descripción**: Información detallada del evento para emails
- **Configuración**: ID del evento
- **Uso**: Mostrar detalles específicos de un evento

#### **🖼️ Evento dinámico banner grande**
- **Descripción**: Banner grande dinámico para eventos en emails
- **Configuración**: 
  - ID del evento
  - ID de la función
- **Uso**: Destacar eventos importantes

#### **🖼️ Evento dinámico banner mediano**
- **Descripción**: Banner mediano dinámico para eventos en emails
- **Configuración**: 
  - ID del evento
  - ID de la función
- **Uso**: Mostrar eventos en formato mediano

### **4. Elementos de Navegación**

#### **🔘 Botón**
- **Descripción**: Botón para emails
- **Configuración**: 
  - Texto del botón
  - URL del enlace
- **Uso**: Call-to-action y enlaces

### **5. Elementos Estructurales**

#### **📧 Cabecera email**
- **Descripción**: Cabecera para emails
- **Configuración**: HTML/CSS personalizable
- **Uso**: Header del email con logo y navegación

#### **📧 Pie email**
- **Descripción**: Pie de página para emails
- **Configuración**: HTML/CSS personalizable
- **Uso**: Footer con información de contacto

#### **📧 Pie email notificación**
- **Descripción**: Pie de página con notificaciones para emails
- **Configuración**: HTML/CSS personalizable
- **Uso**: Footer con notificaciones legales

### **6. Elementos Personalizados**

#### **💻 Código HTML**
- **Descripción**: Código HTML personalizado para emails
- **Configuración**: 
  - Código HTML
  - Código CSS
  - Código JavaScript
- **Uso**: Elementos completamente personalizados

## 🎨 **Configuración de Widgets**

### **Campos Comunes**

#### **Texto**
```javascript
{
  texto: "Texto que se mostrará en el widget"
}
```

#### **URL de Imagen**
```javascript
{
  imagen: "https://ejemplo.com/imagen.jpg"
}
```

#### **Enlaces**
```javascript
{
  texto: "Comprar ahora",
  url: "https://ejemplo.com/comprar"
}
```

#### **IDs de Eventos**
```javascript
{
  eventoId: 123,
  funcionId: 456
}
```

### **Configuración Avanzada**

#### **Código HTML Personalizado**
```javascript
{
  html: "<div>Tu código HTML aquí</div>",
  css: "/* Tu código CSS aquí */",
  js: "// Tu código JavaScript aquí"
}
```

## 🏗️ **Estructura de Widgets**

### **Jerarquía de Elementos**
```
📧 Email Template
├── 📧 Cabecera email
├── 🖼️ Banner
├── 📝 Título
├── 📄 Subtítulo
├── 📖 Paragraph
├── 🎫 Información del evento
├── 🖼️ Evento dinámico banner
├── 🔘 Botón
├── 📐 Separador
└── 📧 Pie email
```

### **Flujo de Creación**
```
1. Seleccionar página de email
2. Agregar widgets desde la lista
3. Configurar cada widget
4. Organizar el orden
5. Guardar plantilla
```

## 🔧 **Funcionalidades Técnicas**

### **Gestión de Estado**
```javascript
const [widgets, setWidgets] = useState(defaultWidgets);
const [editingWidget, setEditingWidget] = useState(null);
const [showSettings, setShowSettings] = useState(false);
```

### **Operaciones CRUD**
- ✅ **CREATE**: Agregar nuevos widgets
- 📖 **READ**: Leer configuración de widgets
- 🔄 **UPDATE**: Editar configuración
- 🗑️ **DELETE**: Eliminar widgets

### **Validaciones**
- ✅ **Campos requeridos** validados
- ✅ **URLs válidas** para imágenes y enlaces
- ✅ **IDs numéricos** para eventos y funciones
- ✅ **HTML válido** para código personalizado

## 📊 **Métricas y Rendimiento**

### **Optimizaciones**
- 🖼️ **Imágenes optimizadas** para email
- 📱 **Responsive design** para móviles
- ⚡ **Carga rápida** de widgets
- 🎨 **Estilos inline** para compatibilidad

### **Compatibilidad**
- 📧 **Clientes de email** principales
- 📱 **Dispositivos móviles**
- 🌐 **Navegadores web**
- 📧 **Servicios de email** (Gmail, Outlook, etc.)

## 🎯 **Casos de Uso**

### **1. Newsletter Mensual**
```
📧 Cabecera email
📝 Título: "Newsletter Enero 2024"
🖼️ Banner promocional
📖 Paragraph: "Descripción del contenido"
🎫 Información del evento: Evento destacado
🔘 Botón: "Ver más eventos"
📧 Pie email
```

### **2. Invitación a Evento**
```
📧 Cabecera email
🖼️ Evento dinámico banner grande
📝 Título: "¡Te invitamos!"
📄 Subtítulo: "Evento especial"
📖 Paragraph: "Detalles del evento"
🔘 Botón: "Confirmar asistencia"
📧 Pie email notificación
```

### **3. Promoción de Venta**
```
📧 Cabecera email
🖼️ Banner promocional
📝 Título: "Oferta especial"
📖 Paragraph: "Descripción de la oferta"
🔘 Botón: "Comprar ahora"
📐 Separador
📖 Paragraph: "Términos y condiciones"
📧 Pie email
```

## 🔗 **Integración con el Sistema**

### **Navegación**
- 📍 **Ruta**: `/dashboard/web-studio`
- 🧭 **Menú**: Personalización → Web Studio
- 🔄 **Integración**: Con el sistema de widgets existente

### **Dependencias**
```javascript
// Iconos
import { AiOutlineSetting, AiOutlineArrowUp, AiOutlineArrowDown, AiOutlineCopy } from 'react-icons/ai';

// Notificaciones
import { toast } from 'react-hot-toast';

// Servicios
import { fetchCmsPage, saveCmsPage } from '../services/apibackoffice';
```

## 📈 **Próximas Mejoras**

### **Funcionalidades Planificadas**
- 📊 **Preview en tiempo real** de emails
- 🎨 **Editor visual** tipo WYSIWYG
- 📧 **Plantillas predefinidas** para casos comunes
- 🔄 **A/B Testing** para widgets
- 📱 **Optimización automática** para móviles
- 🎯 **Personalización dinámica** basada en datos

### **Optimizaciones Técnicas**
- ⚡ **Caché inteligente** para widgets
- 🔍 **Búsqueda avanzada** en widgets
- 📋 **Filtros por categoría** de widgets
- 📤 **Exportación de plantillas** en múltiples formatos

## 🛠️ **Mantenimiento y Soporte**

### **Logs y Monitoreo**
- 📝 **Logs de actividad** para auditoría
- ⚠️ **Alertas de errores** en widgets
- 📊 **Métricas de uso** de widgets

### **Backup y Seguridad**
- 💾 **Backup automático** de plantillas
- 🔐 **Validación de HTML** para seguridad
- 👥 **Control de acceso** por roles

---

## 📞 **Soporte Técnico**

Para soporte técnico o consultas sobre los widgets de email, contacta al equipo de desarrollo.

**Versión**: 1.0.0  
**Última actualización**: Enero 2024  
**Estado**: ✅ Activo y funcional 