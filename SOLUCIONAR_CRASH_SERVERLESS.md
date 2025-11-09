# Solucionar Crash de Función Serverless

## Problema

La función serverless está crasheando con el error `FUNCTION_INVOCATION_FAILED` antes de ejecutarse, lo que significa que hay un error en el nivel superior del módulo (fuera del handler).

## Causas Posibles

### 1. Dependencias Faltantes

Las funciones serverless de Vercel usan el `package.json` raíz del proyecto, no el `package.json` dentro de `api/`. Si una dependencia está solo en `api/package.json`, no estará disponible en la función serverless.

**Solución**: Agregar todas las dependencias necesarias al `package.json` raíz:
- ✅ `pdf-lib` - Ya está en el `package.json` raíz
- ✅ `qrcode` - Ya está en el `package.json` raíz
- ✅ `nodemailer` - **AGREGADO** al `package.json` raíz
- ✅ `@supabase/supabase-js` - Ya está en el `package.json` raíz

### 2. Error de Importación

Si hay un error de sintaxis o un problema con las importaciones en uno de los archivos importados, la función crasheará antes de ejecutarse.

**Solución**: Verificar que todos los archivos importados (`debug.js`, `diagnostic.js`, `download.js`, `email.js`) tengan sintaxis válida y no tengan errores.

### 3. Rutas de Importación Incorrectas

Las rutas de importación relativas (`../../../api-lib/payments/...`) pueden fallar si la estructura de archivos no coincide con lo que Vercel espera.

**Solución**: Verificar que las rutas de importación sean correctas y que los archivos existan en las ubicaciones esperadas.

## Pasos para Resolver

### Paso 1: Instalar Dependencias

Después de agregar `nodemailer` al `package.json` raíz:

```bash
npm install
```

O si estás usando yarn:

```bash
yarn install
```

### Paso 2: Verificar que las Dependencias Estén Instaladas

Verifica que `nodemailer` esté en `node_modules`:

```bash
ls node_modules | grep nodemailer
```

### Paso 3: Redeployar en Vercel

Después de instalar las dependencias y hacer commit de los cambios:

1. Haz commit de los cambios
2. Push a tu repositorio
3. Vercel hará un deploy automático
4. O ve a **Deployments** > **Redeploy** manualmente

### Paso 4: Verificar los Logs

Después del redeploy, intenta acceder al endpoint de diagnóstico:

```
https://sistema.veneventos.com/api/payments/TU_LOCATOR/diagnostic
```

Revisa los logs de Vercel para ver si hay algún error de importación o dependencia faltante.

## Verificar Dependencias en Vercel

Vercel instala las dependencias durante el build. Para verificar que las dependencias se están instalando correctamente:

1. Ve a tu proyecto en Vercel
2. Ve a **Deployments**
3. Selecciona el último deployment
4. Revisa los logs de build
5. Busca mensajes relacionados con `npm install` o `yarn install`
6. Verifica que `nodemailer` se esté instalando correctamente

## Dependencias Necesarias

Las siguientes dependencias deben estar en el `package.json` raíz:

- `@supabase/supabase-js` - Para conexión a Supabase
- `pdf-lib` - Para generación de PDFs
- `qrcode` - Para generación de códigos QR
- `nodemailer` - Para envío de emails

## Estructura de Archivos

La estructura de archivos debe ser:

```
/
├── package.json (con todas las dependencias)
├── api/
│   └── payments/
│       └── [locator]/
│           └── [[...action]].js
└── api-lib/
    └── payments/
        ├── config.js
        ├── debug.js
        ├── diagnostic.js
        ├── download.js
        └── email.js
```

## Contacto

Si el problema persiste después de seguir estos pasos, revisa los logs de Vercel y comparte el error específico que aparece allí.

