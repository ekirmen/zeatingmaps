# Configurar Variables de Entorno en Vercel para Funciones Serverless

## ✅ Estado Actual

Las variables de entorno **YA ESTÁN CONFIGURADAS** correctamente en Vercel:
- ✅ `SUPABASE_URL` (Updated Aug 12)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Updated Aug 25)
- ✅ `SUPABASE_ANON_KEY` (Updated Aug 12)
- ✅ Todas configuradas para Production, Preview, and Development

## ⚠️ Problema Importante

Las funciones serverless de Vercel **NO tienen acceso** a las variables de entorno que empiezan con `REACT_APP_`. Estas variables solo están disponibles en el frontend (navegador).

**IMPORTANTE**: Aunque tienes `REACT_APP_SUPABASE_URL` configurada, las funciones serverless necesitan `SUPABASE_URL` (sin el prefijo `REACT_APP_`). Afortunadamente, ya tienes `SUPABASE_URL` configurada correctamente.

## Variables Necesarias

Para que las funciones serverless funcionen correctamente, necesitas configurar las siguientes variables **SIN el prefijo `REACT_APP_`**:

### 1. `SUPABASE_URL`
- **Name**: `SUPABASE_URL` (sin REACT_APP_)
- **Value**: `https://szmyqodwwdwjdodzebcp.supabase.co`
- **Environment**: Production, Preview, Development

### 2. `SUPABASE_SERVICE_ROLE_KEY`
- **Name**: `SUPABASE_SERVICE_ROLE_KEY` (sin REACT_APP_)
- **Value**: Tu service role key de Supabase
- **Environment**: Production, Preview, Development
- **Cómo obtenerla**:
  1. Ve a tu proyecto en Supabase
  2. Ve a Settings > API
  3. Busca "Service Role Key" (es la clave secreta, no la anon key)
  4. Cópiala y pégala en Vercel

## Pasos para Configurar en Vercel

### Paso 1: Acceder a las Variables de Entorno

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** > **Environment Variables**

### Paso 2: Agregar `SUPABASE_URL`

1. Haz clic en **Add New**
2. **Name**: `SUPABASE_URL`
3. **Value**: `https://szmyqodwwdwjdodzebcp.supabase.co`
4. **Environment**: Selecciona:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (opcional)
5. Haz clic en **Save**

### Paso 3: Agregar `SUPABASE_SERVICE_ROLE_KEY`

1. Haz clic en **Add New**
2. **Name**: `SUPABASE_SERVICE_ROLE_KEY`
3. **Value**: Tu service role key de Supabase (la clave secreta, no la anon key)
4. **Environment**: Selecciona:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (opcional)
5. Haz clic en **Save**

### Paso 4: Verificar que las Variables Estén Configuradas

En la lista de variables de entorno, verifica que:
- ✅ `SUPABASE_URL` esté presente y tenga la columna "Production" marcada
- ✅ `SUPABASE_SERVICE_ROLE_KEY` esté presente y tenga la columna "Production" marcada

### Paso 5: Redeployar la Aplicación

**IMPORTANTE**: Después de agregar o modificar variables de entorno, debes redeployar:

1. Ve a **Deployments**
2. Encuentra el último deployment
3. Haz clic en los tres puntos (...) al lado del deployment
4. Selecciona **Redeploy**
5. O haz un nuevo commit y push a tu repositorio (Vercel hará un deploy automático)

## Verificar que las Variables Estén Configuradas Correctamente

### Opción 1: Usar el Endpoint de Diagnóstico

Después de redeployar, prueba el endpoint de diagnóstico:

```
GET https://sistema.veneventos.com/api/payments/TU_LOCATOR/diagnostic
```

Este endpoint debería devolver información sobre las variables de entorno configuradas.

### Opción 2: Revisar los Logs de Vercel

1. Ve a **Deployments**
2. Selecciona el último deployment
3. Ve a **Functions**
4. Busca la función `api/payments/[locator]/[[...action]]`
5. Revisa los logs para ver si las variables están configuradas correctamente

Deberías ver mensajes como:
```
✅ [CONFIG] Todas las variables de entorno están configuradas correctamente
✅ [CONFIG] Cliente Supabase creado correctamente
```

Si ves mensajes como:
```
❌ [CONFIG] Variables de entorno faltantes
❌ [CONFIG] No se puede crear cliente Supabase - variables faltantes
```

Significa que las variables no están configuradas correctamente.

## Variables que NO Funcionan en Serverless

Las siguientes variables **NO funcionan** en funciones serverless de Vercel:
- ❌ `REACT_APP_SUPABASE_URL` (solo para el frontend)
- ❌ `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` (solo para el frontend)
- ❌ `REACT_APP_SUPABASE_ANON_KEY` (solo para el frontend)

## Variables que SÍ Funcionan

Las siguientes variables **SÍ funcionan** en funciones serverless:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (pero no es recomendado)
- ✅ `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (pero no es recomendado)

## Resumen

Para solucionar el error 500 al descargar tickets:

1. ✅ Agrega `SUPABASE_URL` (sin REACT_APP_) en Vercel
2. ✅ Agrega `SUPABASE_SERVICE_ROLE_KEY` (sin REACT_APP_) en Vercel
3. ✅ Verifica que estén configuradas para Production
4. ✅ Redeploya la aplicación
5. ✅ Verifica los logs de Vercel para confirmar que las variables están configuradas

## Notas Adicionales

- Las variables `REACT_APP_*` que ya tienes configuradas están bien para el frontend, pero las funciones serverless necesitan las variables sin prefijo
- Puedes tener ambas: `REACT_APP_SUPABASE_URL` para el frontend y `SUPABASE_URL` para las funciones serverless
- El código busca primero las variables sin prefijo, y si no las encuentra, intenta con `NEXT_PUBLIC_*` o `REACT_APP_*` como fallback

