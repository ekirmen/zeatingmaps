# 🧪 API Explorer - Guía de Uso

## 📋 **¿Qué es el API Explorer?**

El API Explorer es una herramienta integrada en el panel SaaS que te permite **probar y explorar todos los endpoints** de la API de VeeEventos de forma visual e interactiva.

## 🚀 **Cómo Acceder**

1. **Ve a tu aplicación**: https://sistema.veneventos.com
2. **Inicia sesión** en el dashboard
3. **Navega a**: Panel SaaS > API Explorer
4. **URL directa**: https://sistema.veneventos.com/dashboard/saas/api-explorer

## 🎯 **Funcionalidades**

### **1. Testing Individual**
- ✅ Ejecutar endpoints uno por uno
- ✅ Ver respuestas en tiempo real
- ✅ Copiar URLs y respuestas
- ✅ Historial de ejecuciones

### **2. Testing Masivo**
- ✅ Ejecutar todos los endpoints de una vez
- ✅ Ver estadísticas de rendimiento
- ✅ Identificar endpoints problemáticos

### **3. Documentación Integrada**
- ✅ Ejemplos de uso para cada endpoint
- ✅ Descripción de parámetros
- ✅ Categorización por funcionalidad

## 📊 **Categorías de Endpoints**

### **Grid Sale** 🎫
- `Load Zonas` - Cargar zonas para venta sin mapa
- `Validate Sale` - Validar venta antes de procesar
- `Process Sale` - Procesar venta final

### **Events** 🎭
- `List Events` - Listar todos los eventos
- `Get Event by Slug` - Obtener evento por URL

### **SaaS** 🏢
- `Dashboard Stats` - Estadísticas del dashboard
- `User Management` - Gestión de usuarios

### **Analytics** 📊
- `Sales Report` - Reportes de ventas

### **Payment** 💳
- `Test Stripe Connection` - Probar Stripe
- `Test PayPal Connection` - Probar PayPal

### **Health** 🏥
- `Health Check` - Estado del sistema

## 🛠️ **Cómo Usar**

### **Paso 1: Seleccionar Endpoint**
1. Ve a la pestaña "Testing"
2. Expande la categoría que te interese
3. Selecciona el endpoint que quieres probar

### **Paso 2: Ejecutar**
1. Haz clic en "Ejecutar" en la tarjeta del endpoint
2. Espera la respuesta
3. Ve los resultados en tiempo real

### **Paso 3: Ver Resultados**
1. Ve a la pestaña "Resultados" para ver el historial
2. Ve a la pestaña "Respuesta" para ver el JSON completo
3. Usa "Copiar JSON" para copiar la respuesta

### **Paso 4: Testing Masivo**
1. Haz clic en "Ejecutar Todos" para probar todos los endpoints
2. Ve las estadísticas de rendimiento
3. Identifica qué endpoints funcionan y cuáles no

## 📈 **Interpretando Resultados**

### **Status Codes**
- ✅ **200-299**: Éxito
- ⚠️ **300-399**: Redirección
- ❌ **400-499**: Error del cliente
- ❌ **500-599**: Error del servidor

### **Tiempo de Respuesta**
- 🟢 **< 500ms**: Excelente
- 🟡 **500ms - 2s**: Bueno
- 🔴 **> 2s**: Lento

### **Tipos de Error Comunes**
- **404**: Endpoint no encontrado (no desplegado)
- **500**: Error interno del servidor
- **CORS**: Problema de permisos
- **Timeout**: Endpoint muy lento

## 🔧 **Solución de Problemas**

### **Si todos los endpoints fallan:**
1. Verifica que estén desplegados en Vercel
2. Revisa las variables de entorno
3. Verifica la conexión a la base de datos

### **Si algunos endpoints fallan:**
1. Revisa los logs del endpoint específico
2. Verifica que la base de datos tenga datos
3. Comprueba los parámetros requeridos

### **Si la página no carga:**
1. Verifica que estés logueado
2. Comprueba que tengas permisos de SaaS
3. Revisa la consola del navegador

## 🚀 **Próximos Pasos**

1. **Desplegar endpoints**: Usa `npm run deploy:vercel`
2. **Configurar variables**: Asegúrate de que las variables de entorno estén configuradas
3. **Probar funcionalidades**: Usa el API Explorer para verificar que todo funcione
4. **Integrar en frontend**: Usa los endpoints en tu aplicación

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs en la consola del navegador
2. Verifica el estado de los endpoints
3. Comprueba la configuración de Vercel
4. Revisa la documentación de la API

---

**¡El API Explorer te permite probar y entender todos los endpoints de forma visual!** 🎉
