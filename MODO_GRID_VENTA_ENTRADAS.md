# 🎫 Modo Grid - Venta de Entradas sin Mapa

## 📋 Descripción

El **Modo Grid** permite vender entradas por zona sin necesidad de un mapa de asientos. Es ideal para eventos generales, conciertos, festivales o cualquier evento donde no se requiera selección específica de asientos.

## 🎯 Características

### ✅ **Funcionalidades Implementadas**
- **Venta por Zona**: Los clientes pueden seleccionar entradas por zona de precio
- **Cantidad Variable**: Selección de cantidad de entradas por zona
- **Precios Dinámicos**: Precios configurados por zona en el dashboard
- **Carrito Integrado**: Sistema de carrito unificado con el modo mapa
- **Validación**: Verificación de disponibilidad y precios
- **Responsive**: Funciona en dispositivos móviles y desktop

### 🏗️ **Arquitectura**
- **Store**: `src/store/components/GridSaleMode.jsx`
- **Boletería**: `src/backoffice/pages/CompBoleteria/components/GridSaleMode.jsx`
- **Integración**: Modo automático basado en `evento.modoVenta === 'grid'`

## 🚀 **Cómo Usar**

### **1. Configurar en Dashboard**
1. Ve a **Dashboard > Eventos**
2. Selecciona tu evento
3. En la pestaña **"Configuración de Venta"**
4. Selecciona **"Modo Grid"**
5. Configura las zonas y precios
6. Guarda los cambios

### **2. Venta en Store**
- Los clientes verán automáticamente el modo grid
- Seleccionan zona y cantidad
- Agregan al carrito
- Proceden al pago

### **3. Venta en Boletería**
- Los operadores ven el modo grid
- Seleccionan cliente
- Agregan entradas por zona
- Procesan el pago

## 🔧 **Configuración Técnica**

### **Base de Datos**
```sql
-- Tabla de zonas
CREATE TABLE zonas (
  id UUID PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  capacidad INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Tabla de precios
CREATE TABLE precios (
  id UUID PRIMARY KEY,
  funcion_id UUID REFERENCES funciones(id),
  zona_id UUID REFERENCES zonas(id),
  precio DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  is_active BOOLEAN DEFAULT true
);
```

### **Configuración del Evento**
```javascript
// En el dashboard, el evento debe tener:
evento.modoVenta = 'grid'

// Zonas configuradas:
evento.zonas = [
  {
    id: 'zona-1',
    nombre: 'General',
    capacidad: 1000,
    precios: [
      { funcion_id: 'funcion-1', precio: 50.00 }
    ]
  }
]
```

## 📱 **Interfaz de Usuario**

### **Store (Cliente)**
- **Grid de Zonas**: Tarjetas con información de cada zona
- **Selector de Cantidad**: Input numérico para cantidad
- **Precio Visible**: Precio por zona claramente mostrado
- **Botón Agregar**: Agregar al carrito
- **Resumen**: Total de entradas y precio

### **Boletería (Operador)**
- **Tabla de Zonas**: Vista tabular con todas las zonas
- **Cantidad por Zona**: Input para cantidad
- **Estado del Carrito**: Entradas ya seleccionadas
- **Información del Cliente**: Cliente seleccionado
- **Total**: Cálculo automático del total

## 🎨 **Personalización**

### **Estilos CSS**
```css
/* Modo Grid específico */
.grid-sale-mode {
  padding: 1rem;
}

.zona-card {
  transition: all 0.3s ease;
}

.zona-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.zona-selected {
  border-color: #52c41a;
  background-color: #f6ffed;
}
```

### **Configuración de Zonas**
```javascript
// Ejemplo de configuración de zona
const zona = {
  id: 'general',
  nombre: 'General',
  descripcion: 'Zona general sin asientos numerados',
  capacidad: 500,
  precio: 75.00,
  color: '#1890ff'
};
```

## 🔄 **Flujo de Venta**

### **1. Selección de Zona**
```
Cliente selecciona zona → Ve precio → Selecciona cantidad → Agrega al carrito
```

### **2. Procesamiento**
```
Carrito → Validación → Pago → Confirmación → Ticket
```

### **3. Validaciones**
- ✅ Zona activa
- ✅ Precio configurado
- ✅ Cantidad válida
- ✅ Disponibilidad
- ✅ Cliente seleccionado (boletería)

## 📊 **Métricas y Reportes**

### **Datos Capturados**
- Zona más vendida
- Cantidad promedio por venta
- Ingresos por zona
- Tiempo de venta
- Conversión por zona

### **Reportes Disponibles**
- Ventas por zona
- Ingresos por zona
- Comparativa de zonas
- Tendencias de venta

## 🚨 **Solución de Problemas**

### **Problemas Comunes**

#### **"No hay zonas configuradas"**
- ✅ Verificar que el evento tenga zonas creadas
- ✅ Verificar que las zonas estén activas
- ✅ Verificar que las zonas tengan precios

#### **"No hay precio configurado"**
- ✅ Verificar precios en la función
- ✅ Verificar que el precio esté activo
- ✅ Verificar relación zona-precio

#### **"Error al cargar información"**
- ✅ Verificar conexión a base de datos
- ✅ Verificar permisos de usuario
- ✅ Verificar configuración del evento

### **Logs de Debug**
```javascript
// Habilitar logs de debug
window.__DEBUG = true;

// Ver logs en consola
console.log('Grid Mode Debug:', {
  evento: evento,
  zonas: zonas,
  precios: precios
});
```

## 🔮 **Mejoras Futuras**

### **Funcionalidades Planificadas**
- [ ] **Descuentos por Zona**: Descuentos específicos por zona
- [ ] **Límites por Cliente**: Límite de entradas por cliente
- [ ] **Venta en Lotes**: Venta de múltiples zonas
- [ ] **Reservas**: Sistema de reservas temporales
- [ ] **Códigos de Descuento**: Códigos promocionales
- [ ] **Venta Grupal**: Descuentos por cantidad

### **Integraciones**
- [ ] **WhatsApp**: Envío de tickets por WhatsApp
- [ ] **Email**: Envío automático de tickets
- [ ] **SMS**: Notificaciones por SMS
- [ ] **QR**: Códigos QR para validación

## 📞 **Soporte**

### **Documentación**
- [Guía de Usuario](docs/usuario.md)
- [Guía Técnica](docs/tecnica.md)
- [API Reference](docs/api.md)

### **Contacto**
- **Email**: soporte@veneeventos.com
- **Teléfono**: +1 234 567 8900
- **Chat**: Disponible 24/7

---

## 🎉 **Conclusión**

El **Modo Grid** es una funcionalidad completa que permite vender entradas sin mapa de asientos, ideal para eventos generales. Está completamente integrado con el sistema existente y proporciona una experiencia de usuario fluida tanto para clientes como para operadores.

**¡El modo grid está listo para usar!** 🚀
