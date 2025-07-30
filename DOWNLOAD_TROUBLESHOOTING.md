# Solución para Descarga de Tickets en Backoffice Boleteria

## Problema Identificado

El problema con la descarga de PDFs en el backoffice boleteria se debe a que:

1. **Estructura de API incorrecta**: Los endpoints estaban en `src/api/` (estructura de Next.js) pero la app es React
2. **Falta de funciones serverless**: No había funciones serverless configuradas en Vercel
3. **Endpoint inexistente**: La URL `/api/payments/[locator]/download` no existía

## Solución Implementada

### 1. Creación de Función Serverless

Se creó la función serverless en `api/payments/[locator]/download.js` que:
- Verifica autenticación del usuario
- Busca el payment por locator en Supabase
- Genera un PDF con la información del ticket
- Retorna el PDF como descarga

### 2. Configuración de Vercel

Se actualizó `vercel.json` para incluir:
- Configuración de funciones serverless
- Timeout de 30 segundos para la función de descarga

### 3. Mejoras en el Código

- Mejor manejo de errores en `downloadTicket.js`
- Logs detallados para debugging
- Mensajes de error más informativos

## Configuración Requerida

### Variables de Entorno

Asegúrate de tener estas variables configuradas en Vercel:

```env
REACT_SUPABASE_URL=your_supabase_url
REACT_VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Dependencias

Las dependencias necesarias ya están instaladas:
- `@supabase/supabase-js`
- `pdf-lib`

## Cómo Probar

1. **En el navegador**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña Console
   - Busca un ticket por locator en el backoffice
   - Intenta descargar el ticket
   - Revisa los logs en la consola

2. **Con el script de prueba**:
   ```bash
   node scripts/testDownload.js
   ```

## Posibles Problemas y Soluciones

### 1. Error 404 - Endpoint no encontrado
- Verifica que el archivo `api/payments/[locator]/download.js` existe
- Asegúrate de que Vercel esté desplegando las funciones serverless

### 2. Error 401 - No autorizado
- Verifica que el token esté presente en localStorage
- Asegúrate de que el usuario esté autenticado

### 3. Error 403 - Prohibido
- Verifica que las variables de entorno de Supabase estén configuradas
- Asegúrate de que el `SUPABASE_SERVICE_ROLE_KEY` sea correcto

### 4. Error 500 - Error interno
- Revisa los logs de Vercel para ver el error específico
- Verifica que la estructura de datos en Supabase sea correcta

## Estructura de Datos Esperada

El endpoint espera que el payment tenga esta estructura en Supabase:

```sql
payments {
  locator: string
  seats: array
  status: string
  created_at: timestamp
  funcion: {
    fecha_celebracion: timestamp
    evento: {
      nombre: string
    }
  }
}
```

## Logs de Debugging

El código ahora incluye logs detallados que aparecerán en:
- Consola del navegador (F12 → Console)
- Logs de Vercel (Dashboard de Vercel → Functions)

## Próximos Pasos

1. Desplegar los cambios a Vercel
2. Configurar las variables de entorno
3. Probar la funcionalidad con un ticket real
4. Monitorear los logs para detectar problemas 