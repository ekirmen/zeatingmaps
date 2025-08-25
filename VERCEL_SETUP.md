# Configuración de Variables de Entorno en Vercel

## Problema Identificado

El error "Server returned HTML instead of PDF" indica que las variables de entorno de Supabase no están configuradas correctamente en el servidor de Vercel.

## Solución

### 1. Acceder al Dashboard de Vercel

1. Ve a [vercel.com](https://vercel.com) y inicia sesión
2. Selecciona tu proyecto `veneventos`
3. Ve a la pestaña **Settings**

### 2. Configurar Variables de Entorno

En la sección **Environment Variables**, agrega las siguientes variables:

#### Variables Requeridas:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

#### Variables Opcionales (si usas prefijos REACT_APP_):

```
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### 3. Obtener las Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) y inicia sesión
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configurar Entornos

Asegúrate de que las variables estén configuradas para:
- ✅ **Production**
- ✅ **Preview** (opcional)
- ✅ **Development** (opcional)

### 5. Redesplegar

1. Después de configurar las variables, ve a **Deployments**
2. Haz clic en **Redeploy** en tu último deployment
3. O haz un push a tu repositorio para trigger un nuevo deployment

## Verificación

### Endpoint de Diagnóstico

Una vez configurado, puedes verificar el estado usando:

```
GET /api/payments/[locator]/diagnostic
```

Este endpoint te mostrará:
- Estado de las variables de entorno
- Variables faltantes
- Recomendaciones de configuración

### Endpoint de Prueba

```
GET /api/payments/[locator]/test
```

Este endpoint verifica que el servidor esté funcionando correctamente.

## Estructura de Archivos

```
api/payments/[locator]/
├── config.js          # Configuración y validación
├── diagnostic.js      # Endpoint de diagnóstico
├── download.js        # Endpoint principal de descarga
└── test.js           # Endpoint de prueba
```

## Logs del Servidor

Los logs del servidor mostrarán:

- ✅ Variables de entorno configuradas correctamente
- ❌ Variables faltantes
- 🔍 Proceso de generación del PDF
- 📤 Envío del archivo al cliente

## Troubleshooting

### Error: "Server returned HTML instead of PDF"

**Causa:** Variables de entorno faltantes o incorrectas
**Solución:** Verificar configuración en Vercel

### Error: "Unauthorized"

**Causa:** Token de autenticación inválido o expirado
**Solución:** Verificar sesión del usuario

### Error: "Payment not found"

**Causa:** Localizador incorrecto o pago no existe
**Solución:** Verificar localizador en la base de datos

## Contacto

Si persisten los problemas, verifica:
1. Logs del servidor en Vercel
2. Variables de entorno configuradas
3. Estado de la base de datos de Supabase
4. Permisos del usuario autenticado
