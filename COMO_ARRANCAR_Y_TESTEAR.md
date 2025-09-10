# 🚀 Cómo Testear los 150+ Endpoints en Producción

## 📋 **Tu Aplicación ya está en Producción**

**🌐 URL de Producción**: `https://sistema.veneventos.com`

Tu aplicación ya está desplegada y funcionando en producción. No necesitas arrancar un servidor local.

## 🧪 **Testing de Endpoints en Producción**

### **1. Test Rápido (Recomendado)**
```bash
# Test rápido de endpoints principales en producción
npm run test:quick
```

### **2. Test Completo de Producción**
```bash
# Test completo de todos los endpoints en producción
npm run test:production
```

### **3. Test Manual con cURL**
```bash
# Test de eventos
curl "https://sistema.veneventos.com/api/events/list?tenant_id=test&limit=5"

# Test de modo grid
curl -X POST https://sistema.veneventos.com/api/grid-sale/load-zonas \
  -H "Content-Type: application/json" \
  -d '{"evento":{"recinto":67,"sala":52}}'

# Test de SaaS
curl "https://sistema.veneventos.com/api/saas/dashboard-stats?tenant_id=test&period=7d"
```

### **4. Test en el Navegador**
Abre estas URLs en tu navegador:
- https://sistema.veneventos.com/api/events/list?tenant_id=test
- https://sistema.veneventos.com/api/saas/dashboard-stats?tenant_id=test
- https://sistema.veneventos.com/api/analytics/sales-report?tenant_id=test

## 🧪 **Testing de Endpoints**

### **1. Test Rápido (Recomendado para empezar)**
```bash
# Test rápido de endpoints principales
npm run test:quick
```

### **2. Test Completo**
```bash
# Test de todos los 150+ endpoints
npm run test:endpoints
```

### **3. Test Manual con cURL**
```bash
# Test de salud
curl http://localhost:3000/api/health

# Test de eventos
curl "http://localhost:3000/api/events/list?tenant_id=test&limit=5"

# Test de modo grid
curl -X POST http://localhost:3000/api/grid-sale/load-zonas \
  -H "Content-Type: application/json" \
  -d '{"evento":{"recinto":67,"sala":52}}'

# Test de SaaS
curl "http://localhost:3000/api/saas/dashboard-stats?tenant_id=test&period=7d"
```

### **4. Test en el Navegador**
Abre estas URLs en tu navegador:
- http://localhost:3000/api/events/list?tenant_id=test
- http://localhost:3000/api/saas/dashboard-stats?tenant_id=test
- http://localhost:3000/api/analytics/sales-report?tenant_id=test

## 🔧 **Comandos Útiles**

### **Scripts Disponibles**
```bash
# Desarrollo
npm run dev              # Arrancar servidor básico
npm run start:dev        # Arrancar con testing automático

# Testing
npm run test:quick       # Test rápido
npm run test:endpoints   # Test completo

# Deploy
npm run deploy:dev       # Deploy a desarrollo
npm run deploy:prod      # Deploy a producción

# Build
npm run build           # Build para producción
npm run build:fast      # Build rápido
```

### **Comandos de Vercel**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy manual
vercel                   # Deploy a desarrollo
vercel --prod           # Deploy a producción

# Ver logs
vercel logs             # Ver logs en tiempo real
vercel logs --function=api/events/list  # Logs de función específica

# Ver variables de entorno
vercel env ls           # Listar variables
vercel env add          # Agregar variable
```

## 🐛 **Solución de Problemas**

### **Problema: "Module not found"**
```bash
# Limpiar e instalar
rm -rf node_modules package-lock.json
npm install
```

### **Problema: "Port 3000 already in use"**
```bash
# Encontrar proceso usando puerto 3000
netstat -ano | findstr :3000

# Matar proceso (Windows)
taskkill /PID <PID> /F

# O usar otro puerto
PORT=3001 npm run dev
```

### **Problema: "Supabase connection error"**
1. Verifica las variables de entorno
2. Verifica que la URL de Supabase sea correcta
3. Verifica que las keys sean válidas
4. Verifica que la base de datos esté accesible

### **Problema: "Endpoints returning 404"**
1. Verifica que el servidor esté corriendo
2. Verifica que los archivos estén en `pages/api/`
3. Verifica que no haya errores de sintaxis
4. Revisa los logs del servidor

### **Problema: "CORS errors"**
Los endpoints están configurados para permitir CORS desde cualquier origen en desarrollo.

## 📊 **Interpretación de Resultados**

### **Test Exitoso (✅)**
- El endpoint responde correctamente
- Status code 200-299
- Datos válidos en la respuesta

### **Test Fallido (❌)**
- Status code 400-599
- Error en la conexión
- Timeout

### **Posibles Causas de Fallos**
1. **404 Not Found**: Endpoint no existe o URL incorrecta
2. **500 Internal Server Error**: Error en el código del endpoint
3. **Connection Error**: Servidor no está corriendo
4. **Timeout**: Servidor muy lento o sobrecargado

## 🎯 **Endpoints Principales para Testear**

### **1. Grid Sale (Modo Grid)**
```bash
# Cargar zonas
POST /api/grid-sale/load-zonas
{"evento": {"recinto": 67, "sala": 52}}

# Validar venta
POST /api/grid-sale/validate-sale
{"items": [{"zona_id": 22, "precio": 10, "cantidad": 2}]}
```

### **2. Events (Eventos)**
```bash
# Listar eventos
GET /api/events/list?tenant_id=test&limit=10

# Obtener por slug
GET /api/events/get-by-slug?slug=test-event
```

### **3. SaaS (Sistema SaaS)**
```bash
# Estadísticas del dashboard
GET /api/saas/dashboard-stats?tenant_id=test&period=30d

# Gestión de usuarios
GET /api/saas/user-management?tenant_id=test&limit=10
```

### **4. Analytics (Analíticas)**
```bash
# Reporte de ventas
GET /api/analytics/sales-report?tenant_id=test&start_date=2024-01-01&end_date=2024-01-31

# Reporte de eventos
GET /api/analytics/event-report?tenant_id=test&event_id=123
```

### **5. Payment (Pagos)**
```bash
# Test Stripe
POST /api/payment/test-stripe-connection
{"test": true}

# Test PayPal
POST /api/payment/test-paypal-connection
{"test": true}
```

## 📈 **Monitoreo en Tiempo Real**

### **Logs del Servidor**
```bash
# Ver logs en tiempo real
npm run dev

# O con Vercel
vercel logs
```

### **Métricas de Rendimiento**
- Tiempo de respuesta
- Tasa de error
- Uso de memoria
- Throughput

## 🎉 **¡Listo para Usar!**

Una vez que hayas seguido estos pasos:

1. ✅ **Servidor corriendo** en http://localhost:3000
2. ✅ **Endpoints funcionando** (verificar con tests)
3. ✅ **Variables de entorno** configuradas
4. ✅ **Base de datos** conectada

**¡Tu sistema VeeEventos con 150+ endpoints está listo para usar!** 🚀

### **Próximos Pasos**
1. Configurar la base de datos con datos de prueba
2. Probar la funcionalidad del modo grid
3. Configurar las pasarelas de pago
4. Deploy a producción cuando esté listo

---

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Ejecuta los tests para identificar problemas
4. Revisa la documentación de cada endpoint

**¡Disfruta tu sistema VeeEventos!** 🎫✨
