# Solucionar Error 500 al Descargar Ticket

## Problema
Al intentar descargar un ticket, se obtiene un error 500 con el mensaje "A server error has occurred".

## Causas Posibles

### 1. Variables de Entorno No Configuradas en Vercel
El problema más común es que las variables de entorno no están configuradas correctamente en Vercel.

#### Variables Requeridas:
**IMPORTANTE**: Las funciones serverless de Vercel NO tienen acceso a las variables que empiezan con `REACT_APP_`. Necesitas configurar las variables SIN el prefijo `REACT_APP_`:

- `SUPABASE_URL` (sin prefijo REACT_APP_)
- `SUPABASE_SERVICE_ROLE_KEY` (sin prefijo REACT_APP_)

**También puedes usar** (pero no es recomendado para serverless):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

**NO funcionarán en serverless**:
- ❌ `REACT_APP_SUPABASE_URL` (solo para el frontend)
- ❌ `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` (solo para el frontend)

#### Cómo Verificar:
1. Ve a tu proyecto en Vercel
2. Ve a Settings > Environment Variables
3. Verifica que las variables estén configuradas para el entorno correcto (Production, Preview, Development)
4. Asegúrate de que los nombres de las variables coincidan exactamente con los que espera el código

#### Cómo Configurar:
1. Ve a Settings > Environment Variables en Vercel
2. **Agrega las variables SIN el prefijo REACT_APP_** (las funciones serverless no tienen acceso a variables con prefijo REACT_APP_):
   - Name: `SUPABASE_URL` (sin REACT_APP_)
   - Value: `https://szmyqodwwdwjdodzebcp.supabase.co` (tu URL de Supabase)
   - Environment: Production, Preview, Development (selecciona todos los que necesites)
3. Agrega la variable de servicio:
   - Name: `SUPABASE_SERVICE_ROLE_KEY` (sin REACT_APP_)
   - Value: Tu service role key de Supabase (encuentra esta clave en tu proyecto de Supabase > Settings > API > Service Role Key)
   - Environment: Production, Preview, Development (selecciona todos los que necesites)
4. **Verifica que las variables estén configuradas para Production**:
   - En la lista de variables, verifica que la columna "Production" esté marcada (✓)
   - Si no está marcada, edita la variable y selecciona "Production" en el campo "Environment"
5. **Importante**: Después de agregar o modificar variables de entorno, debes redeployar tu aplicación en Vercel:
   - Ve a Deployments
   - Haz clic en los tres puntos (...) del último deployment
   - Selecciona "Redeploy"
   - O haz un nuevo commit y push a tu repositorio

### 2. Error en la Generación del PDF
El error puede ocurrir durante la generación del PDF si:
- Las imágenes del evento no se pueden cargar
- Hay un error al generar el código QR
- Hay un error al acceder a los datos de Supabase

#### Solución:
- Revisa los logs de Vercel para ver el error específico
- Verifica que las imágenes del evento estén accesibles públicamente
- Verifica que los datos del pago, evento y función estén completos en la base de datos

### 3. Error de Autenticación
El error puede ocurrir si el token de autenticación no es válido o ha expirado.

#### Solución:
- Verifica que el usuario esté autenticado correctamente
- Verifica que el token se esté enviando correctamente en el header `Authorization`
- Verifica que el token no haya expirado

## Cómo Diagnosticar el Problema

### 1. Verificar los Logs de Vercel
1. Ve a tu proyecto en Vercel
2. Ve a Deployments
3. Selecciona el deployment más reciente
4. Ve a Functions
5. Selecciona la función `api/payments/[locator]/[[...action]]`
6. Revisa los logs para ver el error específico

### 2. Usar el Endpoint de Diagnóstico
Puedes usar el endpoint de diagnóstico para verificar la configuración:

```
GET /api/payments/TU_LOCATOR/diagnostic
```

Este endpoint devolverá información sobre:
- Variables de entorno configuradas
- Estado de la conexión a Supabase
- Configuración del servidor

### 3. Probar la Descarga Simple
Puedes probar la descarga simple (sin autenticación) para verificar que la función serverless esté funcionando:

```
GET /api/payments/TU_LOCATOR/download?mode=simple
```

## Soluciones Implementadas

### 1. Mejor Manejo de Errores
- Se agregó manejo de errores en múltiples niveles
- Los errores siempre devuelven JSON, nunca HTML
- Los mensajes de error son más descriptivos
- Se verifica que los headers no se hayan enviado antes de enviar una respuesta de error

### 2. Validación de Configuración
- Se valida que las variables de entorno estén configuradas antes de intentar generar el PDF
- Se valida que el cliente de Supabase se pueda crear correctamente
- Se valida que los datos del pago estén completos

### 3. Logging Mejorado
- Se agregó logging detallado en cada paso del proceso
- Los logs incluyen información sobre errores, configuraciones y datos
- Los logs se pueden ver en Vercel para diagnosticar problemas

## Pasos para Resolver el Problema

### ✅ Paso 1: Verificar Variables de Entorno (YA COMPLETADO)

Las variables de entorno ya están configuradas correctamente en Vercel:
- ✅ `SUPABASE_URL` (Updated Aug 12)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Updated Aug 25)
- ✅ `SUPABASE_ANON_KEY` (Updated Aug 12)
- ✅ Todas configuradas para Production, Preview, and Development

### 🔍 Paso 2: Verificar los Logs de Vercel

El código ahora tiene logging detallado. Para diagnosticar el problema:

1. **Ve a los Logs de Vercel**:
   - Ve a tu proyecto en Vercel
   - Ve a **Deployments**
   - Selecciona el último deployment
   - Ve a **Functions**
   - Busca la función `api/payments/[locator]/[[...action]]`
   - Haz clic en **View Function Logs**

2. **Busca mensajes de error**:
   - Busca mensajes que comiencen con `❌ [DOWNLOAD]`
   - Busca mensajes que comiencen con `❌ [CONFIG]`
   - Busca mensajes que comiencen con `❌ [PDF]`

3. **Verifica la configuración**:
   - Busca mensajes que comiencen con `🔧 [CONFIG]`
   - Verifica que diga `✅ Usando SUPABASE_URL (sin prefijo)`
   - Verifica que diga `✅ Usando SUPABASE_SERVICE_ROLE_KEY (sin prefijo)`
   - Si ves `❌ Usando REACT_APP_*`, las variables no están disponibles en serverless

### 🧪 Paso 3: Probar el Endpoint de Diagnóstico

Prueba el endpoint de diagnóstico para verificar la configuración:

```
GET https://sistema.veneventos.com/api/payments/TU_LOCATOR/diagnostic
```

Este endpoint debería devolver información sobre:
- Variables de entorno configuradas
- Estado de la conexión a Supabase
- Configuración del servidor

### 🧪 Paso 4: Probar la Descarga Simple

Prueba la descarga simple (sin autenticación) para verificar que la función serverless esté funcionando:

```
GET https://sistema.veneventos.com/api/payments/TU_LOCATOR/download?mode=simple
```

- Si esto funciona: El problema está en la autenticación o en la generación del PDF completo
- Si esto NO funciona: El problema está en la configuración de la función serverless o en las variables de entorno

### 🔄 Paso 5: Redeployar la Aplicación

Después de los cambios en el código (mejor logging), debes redeployar:

1. Haz commit de los cambios
2. Push a tu repositorio
3. Vercel hará un deploy automático
4. O ve a **Deployments** > **Redeploy** manualmente

### 📊 Paso 6: Revisar los Logs Después del Redeploy

Después de redeployar, intenta descargar un ticket y revisa los logs. Ahora deberías ver:

- `🔧 [CONFIG] Configuración del servidor:` - Muestra qué variables están disponibles
- `🔍 [CONFIG] Variables disponibles en process.env:` - Muestra qué variables se están usando
- `🔐 [DOWNLOAD] Verificando token de autenticación...` - Muestra el proceso de autenticación
- `🔍 [DOWNLOAD] Buscando pago con localizador:` - Muestra la búsqueda del pago
- `📄 [DOWNLOAD-FULL] Generando PDF completo...` - Muestra la generación del PDF

Cada paso mostrará si hay un error y dónde está ocurriendo.

## Contacto
Si el problema persiste después de seguir estos pasos, revisa los logs de Vercel y contacta al soporte con la información del error específico.

