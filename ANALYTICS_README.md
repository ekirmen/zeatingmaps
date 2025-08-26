# 📊 Vercel Analytics - Sistema de Monitoreo

## 🚀 **Configuración Implementada**

### **Componentes Creados:**
- ✅ `VercelAnalytics.jsx` - Componente principal de Analytics
- ✅ `VercelSpeedInsights.jsx` - Componente de Speed Insights
- ✅ `analytics.js` - Utilidades para eventos personalizados

### **Integración:**
- ✅ Analytics agregado al `App.jsx` principal
- ✅ Solo se ejecuta en **producción** (no en desarrollo)
- ✅ Tracking automático de errores de API
- ✅ Tracking de descargas de tickets

## 📋 **Eventos Disponibles**

### **1. Descarga de Tickets**
```javascript
import { trackTicketDownload } from './utils/analytics';

// Trackear descarga exitosa
trackTicketDownload('S0KOUN4', 'download', true, null);

// Trackear error de descarga
trackTicketDownload('S0KOUN4', 'download', false, 'Error 404');
```

### **2. Errores de API**
```javascript
import { trackApiError } from './utils/analytics';

// Trackear error de API
trackApiError('/api/payments/test', 404, 'Endpoint no encontrado');
```

### **3. Uso del Backoffice**
```javascript
import { trackBackofficeUsage } from './utils/analytics';

// Trackear uso de funcionalidad
trackBackofficeUsage('seat_selection', 'select', { 
  eventId: '123', 
  zone: 'ORO' 
});
```

### **4. Selección de Asientos**
```javascript
import { trackSeatSelection } from './utils/analytics';

// Trackear selección de asientos
trackSeatSelection('123', '456', 2, 'ORO');
```

### **5. Finalización de Compra**
```javascript
import { trackPurchaseCompletion } from './utils/analytics';

// Trackear compra completada
trackPurchaseCompletion('123', 25.00, 2, 'credit_card');
```

## 🔧 **Uso en Componentes**

### **Ejemplo Básico:**
```javascript
import { trackEvent } from '../utils/analytics';

const handleButtonClick = () => {
  trackEvent('button_click', {
    button: 'download_ticket',
    page: 'boleteria'
  });
};
```

### **Ejemplo con Error Handling:**
```javascript
import { trackApiError } from '../utils/analytics';

const handleApiCall = async () => {
  try {
    const response = await fetch('/api/test');
    if (!response.ok) {
      trackApiError('/api/test', response.status, 'Request failed');
    }
  } catch (error) {
    trackApiError('/api/test', 0, error.message);
  }
};
```

## 📊 **Dashboard de Vercel**

### **Acceso:**
- **URL**: https://vercel.com/ekirmens-projects/zeatingmaps/analytics
- **Dominio**: sistema.veneventos.com

### **Métricas Disponibles:**
- 👥 **Visitantes** - Usuarios únicos
- 👁️ **Page Views** - Páginas vistas
- 📉 **Bounce Rate** - Tasa de rebote
- 🗺️ **Países** - Ubicación de usuarios
- 💻 **Sistemas Operativos** - Plataformas
- 🎯 **Eventos Personalizados** - Métricas específicas

## 🚨 **Eventos Críticos Monitoreados**

### **Errores de API:**
- ✅ **404** - Endpoints no encontrados
- ✅ **500** - Errores del servidor
- ✅ **HTML vs JSON** - Respuestas incorrectas

### **Funcionalidades Clave:**
- ✅ **Descarga de Tickets** - Éxito/fallo
- ✅ **Selección de Asientos** - Uso de funcionalidades
- ✅ **Proceso de Compra** - Conversiones
- ✅ **Uso del Backoffice** - Funcionalidades utilizadas

## 🔍 **Debug y Desarrollo**

### **Logs en Desarrollo:**
```javascript
// En desarrollo, los eventos se loguean en consola
🔍 [ANALYTICS] Evento trackeado (desarrollo): { name: "button_click", properties: {...} }
```

### **Logs en Producción:**
```javascript
// En producción, los eventos se envían a Vercel
📊 [ANALYTICS] Evento trackeado: { name: "button_click", properties: {...} }
```

## 📈 **Beneficios Implementados**

1. **Monitoreo en Tiempo Real** - Detectar problemas inmediatamente
2. **Análisis de Usuarios** - Comportamiento y patrones de uso
3. **Performance Metrics** - Velocidad y rendimiento
4. **Error Tracking** - Identificar y resolver problemas rápidamente
5. **Business Intelligence** - Métricas de conversión y uso

## 🚀 **Próximos Pasos**

1. **Desplegar** los cambios a Vercel
2. **Verificar** que Analytics esté funcionando
3. **Monitorear** métricas en el dashboard
4. **Implementar** tracking en más funcionalidades según sea necesario

---

**📊 Con esta implementación, tendrás visibilidad completa del rendimiento y uso de tu aplicación en tiempo real.**
