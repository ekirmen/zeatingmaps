# 🎫 Instrucciones para Descarga de PDFs - Sistema de Tickets

## 🚀 Configuración Inicial

### 1. Variables de Entorno (OBLIGATORIO)

Para que la descarga funcione, debes configurar estas variables en tu proyecto de Vercel:

#### En el Dashboard de Vercel:
1. Ve a tu proyecto
2. Settings → Environment Variables
3. Agrega estas variables:

```bash
# Variable 1: URL de Supabase
Name: SUPABASE_URL
Value: https://tu-proyecto.supabase.co
Environment: Production, Preview, Development

# Variable 2: Clave de Servicio
Name: SUPABASE_SERVICE_ROLE_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```

#### Obtener la Service Role Key:
1. Ve a tu dashboard de Supabase
2. Settings → API
3. Project API keys → service_role (copia la clave)

### 2. Verificar Dependencias

Las dependencias ya están en `package.json`:
- ✅ `pdf-lib` - Para generar PDFs
- ✅ `qrcode` - Para códigos QR
- ✅ `@supabase/supabase-js` - Para base de datos

## 🧪 Probar la Funcionalidad

### Opción 1: Botón de Descarga Rápida
1. En la boletería, haz clic en el botón **"Descargar"** en la barra lateral
2. Ingresa un localizador válido
3. Se descargará un PDF de prueba

### Opción 2: Búsqueda por Localizador
1. Haz clic en **"Localizador"** en la barra lateral
2. Busca un pago existente
3. Aparecerá el botón de descarga con opciones de debug

### Opción 3: Endpoints de Prueba
Puedes probar directamente estos endpoints:

```bash
# Test básico
GET /api/payments/TU_LOCATOR/test

# Diagnóstico completo  
GET /api/payments/TU_LOCATOR/diagnostic

# Descarga simple (sin auth)
GET /api/payments/TU_LOCATOR/download-simple

# Descarga completa (con auth)
GET /api/payments/TU_LOCATOR/download
```

## 🔍 Diagnóstico de Problemas

### Si aparece "Server configuration error":
- ❌ Variables de entorno no configuradas
- ✅ Verifica SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

### Si aparece "Unauthorized":
- ❌ Token de autenticación inválido
- ✅ Verifica que el usuario esté logueado

### Si aparece "Payment not found":
- ❌ El localizador no existe
- ✅ Verifica que el pago esté en la base de datos

### Si aparece "Content-Type: text/html":
- ❌ Error en el servidor
- ✅ Revisa los logs de Vercel

## 📱 Uso en la Interfaz

### En la Boletería:
1. **Botón de Descarga Rápida**: Descarga directa sin búsqueda
2. **Búsqueda por Localizador**: Busca y descarga tickets existentes
3. **Botones de Debug**: Para desarrolladores y troubleshooting

### Funcionalidades del Botón:
- 🎫 **Descargar Ticket**: Descarga principal con autenticación
- 🧪 **Test API**: Prueba si el endpoint funciona
- 🔍 **Diagnóstico**: Ejecuta diagnóstico completo
- 📄 **Test Simple**: Prueba descarga sin autenticación

## 🛠️ Desarrollo y Debug

### Logs del Servidor:
Todos los endpoints incluyen logging extensivo:
- ✅ Configuración del servidor
- ✅ Autenticación del usuario
- ✅ Búsqueda en base de datos
- ✅ Generación del PDF
- ❌ Errores con stack traces

### Variables de Debug:
```bash
NODE_ENV=development  # Para ver stack traces completos
VERCEL_ENV=development # Para entorno de desarrollo
```

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas en Vercel
- [ ] Dependencias instaladas (`npm install` en `/api`)
- [ ] Proyecto desplegado en Vercel
- [ ] Endpoint de test responde correctamente
- [ ] Endpoint de diagnóstico muestra configuración válida
- [ ] Descarga simple genera PDF
- [ ] Descarga completa funciona con autenticación

## 🆘 Solución de Problemas Comunes

### Error 500 - Internal Server Error:
1. Revisa los logs de Vercel
2. Verifica que las variables estén configuradas
3. Asegúrate de que Supabase esté funcionando

### PDF no se descarga:
1. Verifica el Content-Type en la respuesta
2. Revisa si hay errores en la consola del navegador
3. Prueba con el endpoint simple primero

### Autenticación falla:
1. Verifica que el usuario esté logueado
2. Revisa que el token sea válido
3. Prueba con el endpoint simple (sin auth)

## 📞 Soporte

Si sigues teniendo problemas:
1. Ejecuta el diagnóstico completo
2. Revisa los logs del servidor
3. Verifica la configuración de Supabase
4. Contacta al equipo de desarrollo con los logs

---

**¡Con estos pasos deberías tener la descarga de PDFs funcionando correctamente!** 🎉
