# 🌐 Endpoints de Vercel - Modo Grid

## 📋 **Descripción**

Endpoints de API creados en Vercel para manejar la funcionalidad del modo grid de venta de entradas.

## 🚀 **Endpoints Disponibles**

### **1. Cargar Zonas y Precios**
```
POST /api/grid-sale/load-zonas
```

**Request:**
```json
{
  "evento": {
    "id": "evento-123",
    "recinto": 67,
    "sala": 52
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "zonas": [
      {
        "id": 22,
        "nombre": "General",
        "aforo": 1000,
        "color": "#1890ff",
        "numerada": false,
        "sala_id": "52"
      }
    ],
    "precios": {
      "22": {
        "precio": 10,
        "comision": 0,
        "precioGeneral": 0,
        "canales": [4, 2, 3],
        "orden": 0
      }
    }
  }
}
```

### **2. Validar Venta**
```
POST /api/grid-sale/validate-sale
```

**Request:**
```json
{
  "items": [
    {
      "id": "grid_22_funcion-123",
      "zona_id": 22,
      "zona_nombre": "General",
      "precio": 10,
      "cantidad": 2
    }
  ],
  "evento": {
    "id": "evento-123",
    "recinto": 67,
    "sala": 52
  },
  "funcion": {
    "id": "funcion-123",
    "nombre": "Función Principal"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validation_results": [
      {
        "item_id": "grid_22_funcion-123",
        "valid": true,
        "zona_nombre": "General",
        "precio_unitario": 10,
        "cantidad": 2,
        "subtotal": 20
      }
    ],
    "summary": {
      "total_items": 1,
      "valid_items": 1,
      "total_quantity": 2,
      "total_price": 20
    }
  }
}
```

### **3. Procesar Venta**
```
POST /api/grid-sale/process-sale
```

**Request:**
```json
{
  "items": [
    {
      "id": "grid_22_funcion-123",
      "zona_id": 22,
      "zona_nombre": "General",
      "precio": 10,
      "cantidad": 2
    }
  ],
  "evento": {
    "id": "evento-123",
    "recinto": 67,
    "sala": 52
  },
  "funcion": {
    "id": "funcion-123",
    "nombre": "Función Principal"
  },
  "cliente": {
    "id": "cliente-123",
    "nombre": "Juan Pérez",
    "email": "juan@email.com"
  },
  "paymentData": {
    "method": "stripe",
    "transaction_id": "txn_123456789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "venta": {
      "id": "venta-123",
      "evento_id": "evento-123",
      "funcion_id": "funcion-123",
      "cliente_id": "cliente-123",
      "total_precio": 20,
      "total_cantidad": 2,
      "tipo_venta": "grid",
      "estado": "completada",
      "fecha_venta": "2024-01-15T20:00:00Z"
    },
    "entradas": [
      {
        "id": "entrada-1",
        "venta_id": "venta-123",
        "zona_id": 22,
        "funcion_id": "funcion-123",
        "precio": 10,
        "tipo": "grid",
        "estado": "vendida",
        "codigo_entrada": "TKT-1A2B3C-D4E5F"
      }
    ],
    "total_price": 20,
    "total_quantity": 2
  }
}
```

## 🔧 **Configuración en Vercel**

### **1. Variables de Entorno**
```bash
# .env.local
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal
PAYPAL_CLIENT_ID=tu_paypal_client_id
PAYPAL_CLIENT_SECRET=tu_paypal_client_secret
```

### **2. Deploy en Vercel**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### **3. Configuración de Dominio**
1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a Settings > Domains
4. Agrega tu dominio personalizado
5. Configura DNS según las instrucciones

## 📱 **Uso en el Frontend**

### **Hook Personalizado**
```javascript
import { useGridSale } from '../hooks/useGridSale';

const { validateSale, processSale, loading, error } = useGridSale();

// Validar venta
const validation = await validateSale(items, evento, funcion);

// Procesar venta
const result = await processSale(items, evento, funcion, cliente, paymentData);
```

### **Configuración de Endpoints**
```javascript
import { API_ENDPOINTS, apiRequest } from '../config/apiEndpoints';

// Cargar zonas
const response = await apiRequest(API_ENDPOINTS.GRID_SALE.LOAD_ZONAS, {
  method: 'POST',
  body: JSON.stringify({ evento })
});
```

## 🛡️ **Seguridad**

### **Validaciones Implementadas**
- ✅ Validación de métodos HTTP
- ✅ Validación de datos de entrada
- ✅ Verificación de existencia de zonas
- ✅ Validación de aforo disponible
- ✅ Verificación de precios válidos

### **Manejo de Errores**
- ✅ Respuestas consistentes
- ✅ Logs de errores
- ✅ Mensajes descriptivos
- ✅ Códigos de estado HTTP apropiados

## 📊 **Monitoreo**

### **Logs de Vercel**
```bash
# Ver logs en tiempo real
vercel logs

# Ver logs de función específica
vercel logs --function=api/grid-sale/load-zonas
```

### **Métricas**
- Tiempo de respuesta
- Tasa de error
- Uso de memoria
- Llamadas por minuto

## 🔄 **Flujo Completo**

1. **Cliente selecciona entradas** → Frontend
2. **Cargar zonas y precios** → `/api/grid-sale/load-zonas`
3. **Validar selección** → `/api/grid-sale/validate-sale`
4. **Procesar pago** → Stripe/PayPal
5. **Confirmar venta** → `/api/grid-sale/process-sale`
6. **Generar entradas** → Base de datos
7. **Enviar confirmación** → Cliente

## 🚀 **Ventajas de Vercel**

- ✅ **Serverless**: Escala automáticamente
- ✅ **Global CDN**: Respuestas rápidas
- ✅ **Zero Config**: Deploy automático
- ✅ **Edge Functions**: Funciones en el edge
- ✅ **Monitoreo**: Logs y métricas integradas
- ✅ **HTTPS**: Certificados automáticos

## 📞 **Soporte**

### **Debugging**
```javascript
// Habilitar logs detallados
console.log('API Request:', { endpoint, options });
console.log('API Response:', response);
```

### **Testing**
```bash
# Probar endpoint localmente
curl -X POST http://localhost:3000/api/grid-sale/load-zonas \
  -H "Content-Type: application/json" \
  -d '{"evento":{"recinto":67,"sala":52}}'
```

---

## 🎉 **Conclusión**

Los endpoints de Vercel proporcionan una API robusta y escalable para el modo grid, con validaciones completas y manejo de errores. Están listos para producción y se integran perfectamente con tu dominio personalizado.

**¡Los endpoints están listos para usar!** 🚀
