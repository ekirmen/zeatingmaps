# Verificación de Función Serverless de Descarga de Tickets

## Problema
La API de descarga de tickets (`/api/payments/[locator]/download`) está devolviendo un error 500 genérico "A server error has occurred", lo que sugiere que la función serverless no está activa o no está ejecutándose correctamente.

## Pasos para Verificar y Solucionar

### 1. Verificar que la función esté desplegada en Vercel

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a la pestaña "Functions"
4. Verifica que la función `api/payments/[locator]/[[...action]].js` esté lista y desplegada

### 2. Verificar las Variables de Entorno en Vercel

Las siguientes variables de entorno deben estar configuradas en Vercel:

- `SUPABASE_URL` o `REACT_APP_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` o `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` o `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

**Para configurarlas:**
1. Ve a tu proyecto en Vercel
2. Ve a "Settings" > "Environment Variables"
3. Agrega las variables necesarias
4. **IMPORTANTE:** Después de agregar las variables, necesitas hacer un nuevo deploy

### 3. Verificar la Estructura de Carpetas

La estructura debe ser:
```
api/
  payments/
    [locator]/
      [[...action]].js
api-lib/
  payments/
    download.js
    config.js
    ...
```

### 4. Verificar los Logs de Vercel

1. Ve a tu proyecto en Vercel
2. Ve a la pestaña "Deployments"
3. Selecciona el último deployment
4. Ve a "Functions" y busca `api/payments/[locator]/[[...action]]`
5. Revisa los logs para ver qué error está ocurriendo

### 5. Probar el Endpoint de Diagnóstico

Intenta acceder a: `https://sistema.veneventos.com/api/payments/[LOCATOR]/diagnostic`

Esto debería devolver información sobre la configuración del servidor.

### 6. Verificar que las Dependencias estén Instaladas

Asegúrate de que `api/package.json` tenga todas las dependencias necesarias:
- `@supabase/supabase-js`
- `pdf-lib`
- `qrcode`

### 7. Hacer un Nuevo Deploy

Después de verificar todo lo anterior:
1. Haz commit de los cambios
2. Push a tu repositorio
3. Vercel debería hacer un nuevo deploy automáticamente
4. Si no, ve a Vercel y haz un "Redeploy"

## Endpoint de Prueba

Para probar si la función está activa, puedes hacer una petición a:

```
GET https://sistema.veneventos.com/api/payments/TU_LOCATOR/diagnostic
```

Esto debería devolver información sobre la configuración sin requerir autenticación.

## Solución Temporal

Si la función serverless no está funcionando, puedes:
1. Usar el modo "simple" que no requiere autenticación: `?mode=simple`
2. Verificar que las variables de entorno estén configuradas correctamente
3. Revisar los logs de Vercel para ver el error específico

## Contacto

Si el problema persiste, revisa los logs de Vercel y comparte el error específico que aparece allí.

