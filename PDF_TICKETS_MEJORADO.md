# Sistema Mejorado de PDFs de Tickets

## 🎯 Descripción

Este sistema genera PDFs de tickets completamente profesionales que incluyen:
- **Imágenes del evento** en el header
- **Imágenes del recinto** en la sección de ubicación
- **Diseño visual atractivo** con colores y secciones organizadas
- **Información completa** del evento, recinto, asientos y comprador
- **QR code profesional** para validación
- **Layout responsive** y organizado

## 🚀 Características Principales

### ✨ **Diseño Visual Profesional**
- Header con imagen del evento y gradiente de color
- Secciones organizadas con colores diferenciados
- Tipografía profesional (Helvetica)
- Iconos emoji para mejor visualización
- Layout responsive y organizado

### 🖼️ **Sistema de Imágenes**
- **Imágenes de eventos**: Principal, galería, banner
- **Imágenes de recintos**: Principal, galería, exterior, interior
- **Gestión completa** desde el backoffice
- **Vista previa** en tiempo real
- **Ordenamiento** personalizable

### 📱 **QR Code Avanzado**
- Generación automática del código QR
- Colores personalizables
- Tamaño optimizado para escaneo
- Texto explicativo claro

### 📊 **Información Completa**
- **Evento**: Nombre, fecha, hora
- **Recinto**: Nombre, dirección, teléfono
- **Ticket**: Localizador, estado, precio, fecha de compra
- **Asientos**: Lista detallada con zona y precio
- **Comprador**: Nombre, email, información de contacto

## 🏗️ Arquitectura del Sistema

### **1. Endpoints de API**
```
GET /api/payments/[locator]/download          # PDF básico mejorado
GET /api/payments/[locator]/download-enhanced # PDF con imágenes
```

### **2. Base de Datos**
```sql
-- Tabla de imágenes de eventos
evento_imagenes (id, evento_id, url, alt_text, tipo, orden, is_active)

-- Tabla de imágenes de recintos  
recinto_imagenes (id, recinto_id, url, alt_text, tipo, orden, is_active)
```

### **3. Servicios**
- `ImageService`: Gestión completa de imágenes
- `PDFService`: Generación de PDFs
- `QRService`: Generación de códigos QR

### **4. Componentes Frontend**
- `ImageManager`: Gestor de imágenes en backoffice
- `TicketPreview`: Vista previa del ticket
- `PDFDownloadButton`: Botón de descarga

## 🔧 Configuración

### **1. Instalar Dependencias**
```bash
cd api
npm install pdf-lib qrcode
```

### **2. Crear Tablas de Imágenes**
```sql
-- Ejecutar el archivo create_image_tables.sql
```

### **3. Configurar Variables de Entorno**
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 📱 Uso del Sistema

### **1. Gestión de Imágenes en Backoffice**

#### **Para Eventos:**
```jsx
import ImageManager from '../components/ImageManager';

<ImageManager 
  entityId={eventId}
  entityType="event"
  title="Imágenes del Evento"
  onImagesChange={(images) => console.log('Imágenes actualizadas:', images)}
/>
```

#### **Para Recintos:**
```jsx
<ImageManager 
  entityId={venueId}
  entityType="venue"
  title="Imágenes del Recinto"
/>
```

### **2. Tipos de Imágenes Soportados**

#### **Eventos:**
- **Principal**: Imagen destacada del evento
- **Galería**: Imágenes adicionales
- **Banner**: Imagen para promoción

#### **Recintos:**
- **Principal**: Vista principal del recinto
- **Galería**: Imágenes adicionales
- **Exterior**: Vista exterior del recinto
- **Interior**: Vista interior del recinto

### **3. Descarga de PDFs**

#### **PDF Básico Mejorado:**
```javascript
// En el frontend
const response = await fetch(`/api/payments/${locator}/download`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${locator}.pdf`;
  a.click();
}
```

#### **PDF con Imágenes:**
```javascript
// PDF con imágenes del evento y recinto
const response = await fetch(`/api/payments/${locator}/download-enhanced`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🎨 Personalización

### **1. Colores del PDF**
```javascript
// En el archivo download.js
const colors = {
  header: rgb(0.1, 0.1, 0.4),      // Azul oscuro
  eventSection: rgb(0.95, 0.95, 0.95), // Gris claro
  venueSection: rgb(0.9, 0.95, 1),     // Azul muy claro
  ticketSection: rgb(1, 0.95, 0.9),    // Amarillo claro
  seatsSection: rgb(0.95, 1, 0.95),    // Verde claro
  buyerSection: rgb(1, 0.9, 0.95),     // Rosa claro
  footer: rgb(0.1, 0.1, 0.3)           // Azul oscuro
};
```

### **2. Tipografía**
```javascript
// Fuentes disponibles
const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
```

### **3. Layout y Espaciado**
```javascript
// Configuración de layout
const pageSize = [595.28, 841.89]; // A4
const margins = { left: 30, right: 30, top: 30, bottom: 50 };
const sectionSpacing = 20;
```

## 📊 Monitoreo y Logs

### **1. Logs del Servidor**
```javascript
console.log('Enhanced Download endpoint called with method:', req.method);
console.log('Payment found:', payment);
console.log('Could not load event image:', imgError);
```

### **2. Estadísticas de Imágenes**
```javascript
const stats = await ImageService.getImageStats();
console.log('Total imágenes:', stats.totalImages);
```

## 🔒 Seguridad

### **1. Autenticación**
- Verificación de token JWT en cada request
- Solo usuarios autenticados pueden descargar tickets
- Validación de permisos por usuario

### **2. Validación de Imágenes**
- URLs de imágenes validadas
- Extensiones de archivo permitidas
- Verificación de URLs HTTPS

### **3. RLS (Row Level Security)**
- Políticas de acceso por usuario
- Separación de datos por empresa
- Auditoría completa de accesos

## 🚀 Próximas Mejoras

### **Corto Plazo**
- [ ] Plantillas personalizables por empresa
- [ ] Soporte para logos corporativos
- [ ] Múltiples idiomas

### **Mediano Plazo**
- [ ] Generación de PDFs en lote
- [ ] Sistema de plantillas visual
- [ ] Integración con servicios de almacenamiento

### **Largo Plazo**
- [ ] PDFs interactivos
- [ ] Firmas digitales
- [ ] Integración con blockchain

## 🧪 Pruebas

### **1. Test de Generación de PDF**
```bash
# Probar endpoint básico
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3000/api/payments/LOCATOR/download"

# Probar endpoint con imágenes
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3000/api/payments/LOCATOR/download-enhanced"
```

### **2. Test de Gestión de Imágenes**
```javascript
// Agregar imagen de prueba
const testImage = await ImageService.addEventImage(eventId, {
  url: 'https://via.placeholder.com/400x300',
  alt_text: 'Imagen de prueba',
  tipo: 'principal',
  orden: 1
});

// Verificar que se agregó
const images = await ImageService.getEventImages(eventId);
console.log('Imágenes:', images);
```

## 🆘 Solución de Problemas

### **1. PDF no se genera**
- Verificar variables de entorno
- Comprobar permisos de base de datos
- Revisar logs del servidor

### **2. Imágenes no se muestran**
- Verificar URLs de imágenes
- Comprobar acceso a las URLs
- Revisar formato de archivo

### **3. Error de memoria**
- Reducir tamaño de imágenes
- Optimizar calidad de PDF
- Implementar paginación

## 📋 Archivos del Sistema

### **Backend (API)**
1. `api/payments/[locator]/download.js` - PDF básico mejorado
2. `api/payments/[locator]/download-enhanced.js` - PDF con imágenes
3. `create_image_tables.sql` - Estructura de base de datos

### **Frontend (Backoffice)**
1. `src/backoffice/services/imageService.js` - Servicio de imágenes
2. `src/backoffice/components/ImageManager.js` - Gestor de imágenes

### **Documentación**
1. `PDF_TICKETS_MEJORADO.md` - Este archivo
2. `TICKET_EMAIL_SETUP.md` - Sistema de email
3. `EMAIL_SMTP_CONFIGURATION.md` - Configuración SMTP

## 🎉 Estado del Sistema

✅ **SISTEMA COMPLETAMENTE IMPLEMENTADO**

- ✅ PDFs profesionales con diseño atractivo
- ✅ Sistema de gestión de imágenes
- ✅ Integración con base de datos
- ✅ Interfaz de usuario completa
- ✅ Seguridad y validaciones
- ✅ Documentación completa

**¡El sistema está listo para producción!**

---

**Última actualización**: Diciembre 2024  
**Versión**: 2.0.0  
**Estado**: PRODUCCIÓN READY
