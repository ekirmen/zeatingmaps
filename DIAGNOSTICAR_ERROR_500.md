# Diagnosticar Error 500 al Descargar Ticket

## ✅ Variables de Entorno Configuradas

Las variables de entorno ya están configuradas correctamente en Vercel:
- ✅ `SUPABASE_URL` (Updated Aug 12)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Updated Aug 25)
- ✅ `SUPABASE_ANON_KEY` (Updated Aug 12)
- ✅ Todas configuradas para Production, Preview, and Development

## 🔍 Cómo Diagnosticar el Problema

### Paso 1: Revisar los Logs de Vercel

El código ahora tiene logging detallado. Para ver los logs:

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Deployments**
4. Selecciona el último deployment
5. Ve a **Functions**
6. Busca la función `api/payments/[locator]/[[...action]]`
7. Haz clic en **View Function Logs** o en el ícono de logs

### Paso 2: Buscar Mensajes de Error

En los logs, busca mensajes que comiencen con:

- `❌ [CONFIG]` - Errores de configuración
- `❌ [DOWNLOAD]` - Errores en la descarga
- `❌ [PDF]` - Errores en la generación del PDF
- `❌ [DOWNLOAD-FULL]` - Errores en la generación del PDF completo

### Paso 3: Verificar la Configuración

Busca mensajes que comiencen con `🔧 [CONFIG]`. Deberías ver:

```
🔧 [CONFIG] Configuración del servidor:
- NODE_ENV: production
- VERCEL_ENV: production
- SUPABASE_URL: ✅ definido
- SUPABASE_SERVICE_ROLE_KEY: ✅ definido
🔍 [CONFIG] Variables disponibles en process.env:
- process.env.SUPABASE_URL: ✅ presente
- process.env.SUPABASE_SERVICE_ROLE_KEY: ✅ presente
- ✅ Usando SUPABASE_URL (sin prefijo)
- ✅ Usando SUPABASE_SERVICE_ROLE_KEY (sin prefijo)
✅ [CONFIG] Todas las variables de entorno están configuradas correctamente
✅ [CONFIG] Cliente Supabase creado correctamente
```

Si ves `❌ Usando REACT_APP_*`, significa que las variables sin prefijo no están disponibles y el código está intentando usar las variables con prefijo (que no funcionan en serverless).

### Paso 4: Verificar la Autenticación

Busca mensajes que comiencen con `🔐 [DOWNLOAD]`. Deberías ver:

```
🔐 [DOWNLOAD] Verificando token de autenticación...
🔐 [DOWNLOAD] Token length: [número]
🔐 [DOWNLOAD] supabaseAdmin disponible: ✅ sí
🔐 [DOWNLOAD] supabaseAdmin.auth disponible: ✅ sí
🔐 [DOWNLOAD] Resultado de autenticación:
- User presente: ✅ sí
- User ID: [user_id]
✅ [DOWNLOAD] Usuario autenticado correctamente: [user_id]
```

Si ves `❌ User presente: no` o `❌ Error presente: sí`, el problema está en la autenticación.

### Paso 5: Verificar la Búsqueda del Pago

Busca mensajes que comiencen con `🔍 [DOWNLOAD]`. Deberías ver:

```
🔍 [DOWNLOAD] Buscando pago con localizador: [locator]
✅ [DOWNLOAD] Consulta exitosa, resultados encontrados: [número]
✅ [DOWNLOAD] Pago encontrado: [payment_id]
```

Si ves `❌ [DOWNLOAD] Error buscando por locator`, el problema está en la consulta a Supabase.

### Paso 6: Verificar la Generación del PDF

Busca mensajes que comiencen con `📄 [DOWNLOAD-FULL]` o `📄 [PDF]`. Deberías ver:

```
📄 [DOWNLOAD-FULL] Generando PDF completo para locator: [locator]
📄 [DOWNLOAD-FULL] Calling createTicketPdfBuffer...
📄 [PDF] Generando PDF en memoria para el pago: [payment_id]
✅ [PDF] PDF generado exitosamente, tamaño: [número] bytes
✅ [DOWNLOAD-FULL] PDF generado exitosamente, tamaño: [número] bytes
📤 [DOWNLOAD-FULL] Enviando PDF al cliente...
```

Si ves `❌ [PDF] Error generando PDF en memoria` o `❌ [DOWNLOAD-FULL] Error generando PDF completo`, el problema está en la generación del PDF.

## 🧪 Probar Endpoints

### 1. Endpoint de Diagnóstico

Prueba el endpoint de diagnóstico para verificar la configuración:

```bash
curl https://sistema.veneventos.com/api/payments/TU_LOCATOR/diagnostic
```

O en el navegador:
```
https://sistema.veneventos.com/api/payments/TU_LOCATOR/diagnostic
```

Este endpoint debería devolver información sobre:
- Variables de entorno configuradas
- Estado de la conexión a Supabase
- Configuración del servidor

### 2. Descarga Simple (sin autenticación)

Prueba la descarga simple para verificar que la función serverless esté funcionando:

```bash
curl https://sistema.veneventos.com/api/payments/TU_LOCATOR/download?mode=simple
```

O en el navegador:
```
https://sistema.veneventos.com/api/payments/TU_LOCATOR/download?mode=simple
```

- Si esto funciona: El problema está en la autenticación o en la generación del PDF completo
- Si esto NO funciona: El problema está en la configuración de la función serverless

### 3. Descarga Completa (con autenticación)

Prueba la descarga completa con autenticación:

```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  https://sistema.veneventos.com/api/payments/TU_LOCATOR/download
```

## 🔧 Soluciones Comunes

### Problema: Variables de Entorno No Disponibles

**Síntomas**: En los logs ves `❌ Usando REACT_APP_*` o `❌ [CONFIG] Variables de entorno faltantes`

**Solución**: 
1. Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas en Vercel
2. Verifica que estén configuradas para Production
3. Redeploya la aplicación

### Problema: Error de Autenticación

**Síntomas**: En los logs ves `❌ User presente: no` o `❌ Error presente: sí`

**Solución**:
1. Verifica que el token se esté enviando correctamente en el header `Authorization`
2. Verifica que el token no haya expirado
3. Verifica que el usuario esté autenticado correctamente

### Problema: Error al Buscar el Pago

**Síntomas**: En los logs ves `❌ [DOWNLOAD] Error buscando por locator`

**Solución**:
1. Verifica que el locator sea correcto
2. Verifica que el pago exista en la base de datos
3. Verifica que las políticas RLS permitan el acceso

### Problema: Error al Generar el PDF

**Síntomas**: En los logs ves `❌ [PDF] Error generando PDF en memoria`

**Solución**:
1. Verifica que las imágenes del evento estén accesibles públicamente
2. Verifica que los datos del pago, evento y función estén completos
3. Revisa el error específico en los logs para más detalles

## 📊 Información que Necesitas Compartir

Si el problema persiste, comparte la siguiente información:

1. **Logs de Vercel**: Copia los logs de la función serverless cuando intentas descargar un ticket
2. **Mensajes de Error**: Busca todos los mensajes que comiencen con `❌`
3. **Configuración**: Busca los mensajes que comiencen con `🔧 [CONFIG]`
4. **Autenticación**: Busca los mensajes que comiencen con `🔐 [DOWNLOAD]`
5. **Búsqueda del Pago**: Busca los mensajes que comiencen con `🔍 [DOWNLOAD]`
6. **Generación del PDF**: Busca los mensajes que comiencen con `📄 [PDF]` o `📄 [DOWNLOAD-FULL]`

## 🔄 Redeployar Después de Cambios

Después de cualquier cambio en el código o en las variables de entorno:

1. Haz commit de los cambios
2. Push a tu repositorio
3. Vercel hará un deploy automático
4. O ve a **Deployments** > **Redeploy** manualmente
5. Espera a que el deploy termine
6. Prueba de nuevo la descarga del ticket

