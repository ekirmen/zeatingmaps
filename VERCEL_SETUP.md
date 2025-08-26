# Configuración de Variables de Entorno en Vercel

## Optimización de Funciones Serverless

**Estado actual:** ✅ **9/12 funciones** (dentro del límite del plan Hobby)

Se han optimizado las funciones para mantenerse dentro del límite de 12 funciones del plan Hobby de Vercel, consolidando funcionalidades duplicadas y eliminando funciones innecesarias.

### Funciones Optimizadas

1. **`/api/payments/[locator]/download.js`** - **CONSOLIDADA**
   - Descarga de tickets en PDF (modo completo y simple)
   - Generación de códigos QR
   - Autenticación integrada
   - Soporte para modo simple sin autenticación

2. **`/api/payments/[locator]/test.js`** - Mantenida para debugging
3. **`/api/payments/[locator]/diagnostic.js`** - Mantenida para diagnóstico
4. **`/api/payments/[locator]/config.js`** - Configuración compartida
5. **`/api/mapas/[salaId]/index.js`** - Carga de mapas de asientos
6. **`/api/mapas/[salaId]/save.js`** - Guardado de mapas de asientos
7. **`/api/recintos/[id]/delete.js`** - Gestión de recintos
8. **`/api/zonas/index.js`** - Gestión de zonas de asientos
9. **`/api/send-email/smtp.js`** - Envío de emails/tickets

## Funcionalidad de Descarga de Tickets

### Endpoint Principal
```
GET /api/payments/[locator]/download?mode=[full|simple]
```

### Parámetros
- **`locator`** (requerido): Identificador único del pago
- **`mode`** (opcional): 
  - `full` (por defecto): PDF completo con datos del pago y autenticación
  - `simple`: PDF básico sin autenticación (para pruebas)

### Uso

#### 1. Descarga Simple (Sin Autenticación)
```javascript
// Para pruebas y verificación de funcionalidad
const response = await fetch(`/api/payments/${locator}/download?mode=simple`);
const pdfBlob = await response.blob();
```

#### 2. Descarga Completa (Con Autenticación)
```javascript
// Para usuarios autenticados con datos completos del pago
const response = await fetch(`/api/payments/${locator}/download`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
const pdfBlob = await response.blob();
```

### Características del PDF

#### Modo Simple
- ✅ Título del ticket
- ✅ Localizador del pago
- ✅ Estado del pago
- ✅ Fecha de generación
- ✅ Mensaje de verificación

#### Modo Completo
- ✅ Título del ticket
- ✅ Localizador del pago
- ✅ Información del evento
- ✅ Datos del recinto
- ✅ Lista de asientos con precios
- ✅ Código QR único para validación
- ✅ Fecha de compra
- ✅ Condiciones del ticket

## Variables de Entorno Requeridas

### En Vercel Dashboard
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Variables Opcionales
```bash
NODE_ENV=production
VERCEL_ENV=production
```

## Instalación y Despliegue

### 1. Configurar Variables en Vercel
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las variables de Supabase
4. Redespliega la aplicación

### 2. Verificar Funcionamiento
```bash
# Probar descarga simple
curl "https://tu-dominio.vercel.app/api/payments/TEST123/download?mode=simple"

# Probar descarga completa (requiere token)
curl -H "Authorization: Bearer tu-token" \
     "https://tu-dominio.vercel.app/api/payments/TEST123/download"
```

### 3. Monitoreo
- Revisa los logs en Vercel Dashboard
- Usa el endpoint de diagnóstico: `/api/payments/[locator]/diagnostic`
- Verifica el estado de las funciones en **Functions** tab

## Solución de Problemas

### Error: "No more than 12 Serverless Functions"
✅ **RESUELTO** - Se han optimizado las funciones para mantenerse dentro del límite.

### Error: "Missing Supabase environment variables"
1. Verifica que las variables estén configuradas en Vercel
2. Redespliega después de configurar variables
3. Usa el endpoint de diagnóstico para verificar

### Error: "Unauthorized"
1. Asegúrate de incluir el token de autorización
2. Verifica que el token sea válido
3. Para pruebas, usa `mode=simple`

## Funciones Eliminadas/Optimizadas

- ❌ `api/payments/test.js` - Re-export duplicado
- ❌ `api/payments/diagnostic.js` - Re-export duplicado
- ❌ `api/payments/[locator]/download-simple.js` - Consolidada en download.js
- ❌ `api/recintos/[id]/route.js` - Formato Next.js incompatible

## Beneficios de la Optimización

1. **Dentro del límite del plan Hobby** ✅
2. **Funcionalidad completa mantenida** ✅
3. **Mejor mantenibilidad** ✅
4. **Código consolidado** ✅
5. **Descarga de tickets funcional** ✅

## Próximos Pasos

1. **Desplegar** la versión optimizada
2. **Probar** la descarga de tickets
3. **Monitorear** el rendimiento
4. **Considerar** upgrade a Pro si se necesitan más funciones en el futuro
