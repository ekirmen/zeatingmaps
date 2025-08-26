# API de Descarga de PDFs - Sistema de Tickets

Este directorio contiene los endpoints para generar y descargar tickets en formato PDF.

## Archivos

- `download.js` - Endpoint principal para descargar tickets
- `download-enhanced.js` - Versión mejorada con más información del evento
- `config.js` - Configuración de variables de entorno
- `test.js` - Endpoint de prueba para verificar configuración
- `diagnostic.js` - Endpoint de diagnóstico completo

## Variables de Entorno Requeridas

Para que la descarga de PDFs funcione correctamente, debes configurar las siguientes variables de entorno en tu proyecto de Vercel:

### Variables Obligatorias

```bash
# URL de tu proyecto Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave de servicio de Supabase (Service Role Key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variables Alternativas (para compatibilidad)

```bash
# También puedes usar estas variables alternativas
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# O para proyectos Next.js
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Cómo Configurar en Vercel

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a "Settings" > "Environment Variables"
4. Agrega las variables requeridas
5. Asegúrate de que estén configuradas para todos los entornos (Production, Preview, Development)

## Dependencias

El proyecto requiere las siguientes dependencias que ya están incluidas en `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "pdf-lib": "^1.17.1",
    "qrcode": "^1.5.1"
  }
}
```

## Endpoints Disponibles

### GET `/api/payments/[locator]/download`
Descarga el ticket principal en formato PDF.

**Headers requeridos:**
- `Authorization: Bearer <token>`

**Query params:**
- `locator`: Identificador único del pago

### GET `/api/payments/[locator]/download-enhanced`
Descarga el ticket con información completa del evento.

### GET `/api/payments/[locator]/test`
Endpoint de prueba para verificar la configuración.

### GET `/api/payments/[locator]/diagnostic`
Endpoint de diagnóstico completo del sistema.

## Solución de Problemas

### Error: "Server configuration error"
- Verifica que las variables de entorno estén configuradas en Vercel
- Asegúrate de que los nombres de las variables sean exactos
- Revisa que las variables estén configuradas para el entorno correcto

### Error: "Unauthorized"
- Verifica que el token de autenticación sea válido
- Asegúrate de que el usuario tenga permisos para acceder al ticket

### Error: "Payment not found"
- Verifica que el locator sea correcto
- Asegúrate de que el pago exista en la base de datos

### Error: "Database error"
- Verifica la conexión a Supabase
- Revisa los logs del servidor para más detalles

## Logs y Debugging

El sistema incluye logging extensivo para facilitar el debugging:

- Todos los endpoints incluyen logs detallados
- Los errores se registran con stack traces completos
- La configuración se valida y se registra al inicio

## Estructura del PDF Generado

El PDF incluye:
- Título del ticket
- Información del evento (nombre, fecha, recinto)
- Localizador único
- Lista de asientos con precios
- Código QR para validación
- Fecha de compra
- Condiciones de uso

## Seguridad

- Solo usuarios autenticados pueden descargar tickets
- Cada ticket tiene un localizador único
- Los tokens se validan en cada solicitud
- Las claves de servicio de Supabase se mantienen seguras en variables de entorno
