# Email Widgets System

## 📧 Descripción General

El sistema de widgets de email proporciona componentes reutilizables para crear plantillas de correo electrónico profesionales. Cada widget está diseñado para ser modular, configurable y fácil de mantener.

## 🏗️ Estructura de Archivos

```
src/backoffice/components/EmailWidgets/
├── index.js                    # Exportaciones principales
├── EmailWidgetRenderer.js      # Renderizador dinámico
├── EmailWidgetMenu.js          # Menú organizado por categorías
├── ButtonWidget.js             # Widget de botones
├── TextWidget.js               # Widget de texto (título, subtítulo, párrafo)
├── BannerWidget.js             # Widget de banners
├── EventWidget.js              # Widget de eventos
├── HtmlWidget.js               # Widget de código HTML
└── README.md                   # Esta documentación
```

## 🎯 Widgets Disponibles

### **1. Elementos Básicos** 📝
- **Título**: Títulos principales para emails
- **Subtítulo**: Subtítulos y encabezados secundarios
- **Paragraph**: Párrafos de texto para contenido principal

### **2. Elementos Visuales** 🖼️
- **Banner**: Banners con imagen y texto
- **Separador**: Separadores visuales

### **3. Elementos de Eventos** 🎫
- **Información del evento**: Detalles específicos de eventos
- **Evento dinámico banner grande**: Banners grandes para eventos
- **Evento dinámico banner mediano**: Banners medianos para eventos

### **4. Elementos de Navegación** 🔘
- **Botón**: Botones con múltiples tipos (compra, invitación, renovación, URL personalizada)

### **5. Elementos Estructurales** 📧
- **Cabecera email**: Headers de email
- **Pie email**: Footers de email
- **Pie email notificación**: Footers con notificaciones

### **6. Elementos Personalizados** 💻
- **Código HTML**: Código HTML/CSS/JS personalizado

## 🔧 Uso de los Componentes

### **Importación Básica**
```javascript
import { ButtonWidget, TextWidget, BannerWidget } from '../components/EmailWidgets';
```

### **Uso del Renderizador**
```javascript
import EmailWidgetRenderer from '../components/EmailWidgets/EmailWidgetRenderer';

// En tu componente
<EmailWidgetRenderer
  widgetType="Botón"
  config={widgetConfig}
  onConfigChange={handleConfigChange}
/>
```

### **Uso del Menú**
```javascript
import EmailWidgetMenu from '../components/EmailWidgets/EmailWidgetMenu';

// En tu componente
<EmailWidgetMenu onSelectWidget={handleWidgetSelection} />
```

## 📊 Configuración de Widgets

### **Botón Widget**
```javascript
{
  buttonType: '0',        // 0=compra, 1=invitación, 2=renovación, 3=url
  eventId: '1403',        // ID del evento
  channelId: '8',         // ID del canal de venta
  textButton: 'Comprar',  // Texto del botón
  urlButton: '',          // URL personalizada (solo tipo 3)
  margin_top: 10,         // Margen superior en px
  margin_bottom: 10       // Margen inferior en px
}
```

### **Text Widget**
```javascript
{
  texto: 'Contenido del texto'
}
```

### **Banner Widget**
```javascript
{
  texto: 'Texto del banner',
  imagen: 'https://ejemplo.com/imagen.jpg'
}
```

### **Event Widget**
```javascript
{
  eventoId: '123',        // ID del evento
  funcionId: '456'        // ID de la función (opcional)
}
```

### **HTML Widget**
```javascript
{
  html: '<div>HTML aquí</div>',
  css: '/* CSS aquí */',
  js: '// JavaScript aquí'
}
```

## 🎨 Características de los Widgets

### **Validación Automática**
- URLs válidas para imágenes y enlaces
- IDs numéricos para eventos y funciones
- Campos requeridos validados

### **Vista Previa**
- Imágenes con fallback en caso de error
- Código HTML/CSS/JS con sintaxis highlighting
- Previsualización en tiempo real

### **Configuración Condicional**
- Campos que aparecen según el tipo de widget
- Reset automático de campos al cambiar configuración
- Lógica inteligente para diferentes tipos

## 🔄 Integración con Web Studio

### **En WebStudio.js**
```javascript
import EmailWidgetRenderer from '../components/EmailWidgets/EmailWidgetRenderer';

// En el renderSettingsPanel
{editingWidget.type === 'Botón' && (
  <EmailWidgetRenderer
    widgetType={editingWidget.type}
    config={editingWidget.config}
    onConfigChange={(newConfig) => {
      setEditingWidget({
        ...editingWidget,
        config: newConfig
      });
    }}
  />
)}
```

## 📈 Beneficios del Sistema

### **1. Modularidad**
- Cada widget es un componente independiente
- Fácil agregar nuevos widgets
- Configuración específica por tipo

### **2. Reutilización**
- Componentes reutilizables en diferentes contextos
- Configuración consistente
- Lógica centralizada

### **3. Mantenibilidad**
- Código organizado y documentado
- Fácil debugging
- Actualizaciones independientes

### **4. Escalabilidad**
- Fácil agregar nuevos tipos de widgets
- Sistema extensible
- Configuración flexible

## 🚀 Próximas Mejoras

### **Funcionalidades Planificadas**
- [ ] Preview en tiempo real de emails
- [ ] Editor visual tipo WYSIWYG
- [ ] Plantillas predefinidas
- [ ] A/B Testing para widgets
- [ ] Optimización automática para móviles

### **Optimizaciones Técnicas**
- [ ] Caché inteligente para widgets
- [ ] Búsqueda avanzada en widgets
- [ ] Filtros por categoría
- [ ] Exportación de plantillas

## 🛠️ Desarrollo

### **Agregar un Nuevo Widget**
1. Crear el componente en `src/backoffice/components/EmailWidgets/`
2. Agregar la exportación en `index.js`
3. Actualizar `EmailWidgetRenderer.js`
4. Agregar al menú en `EmailWidgetMenu.js`
5. Documentar en este README

### **Ejemplo de Nuevo Widget**
```javascript
// NuevoWidget.js
import React, { useState } from 'react';

const NuevoWidget = ({ config = {}, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState({
    // Configuración por defecto
    ...config
  });

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  return (
    <div className="space-y-4">
      {/* Configuración del widget */}
    </div>
  );
};

export default NuevoWidget;
```

---

## 📞 Soporte

Para consultas sobre el sistema de widgets de email, contacta al equipo de desarrollo.

**Versión**: 1.0.0  
**Última actualización**: Enero 2024  
**Estado**: ✅ Activo y funcional 