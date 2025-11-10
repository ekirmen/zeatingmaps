# Diagnóstico del Error 500 en Descarga de Tickets

## Problema Reportado
- **Error**: `FUNCTION_INVOCATION_FAILED` en `/api/payments/LE8DY46Q/download?mode=simple`
- **Código**: 500 INTERNAL_SERVER_ERROR
- **Ubicación**: Vercel Serverless Function

## Posibles Causas

### 1. Error en Importación de Módulos
Las importaciones de `pdf-lib` o `qrcode` podrían estar fallando en el entorno de Vercel.

**Solución**: Verificar que las dependencias estén instaladas correctamente:
```bash
npm list pdf-lib qrcode
```

### 2. Problema con Runtime de Node.js
El runtime podría no estar correctamente configurado.

**Solución**: Verificar que `vercel.json` tenga:
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 3. Error en las Importaciones de Módulos ES6
Los módulos ES6 podrían no estar siendo transpilados correctamente.

**Solución**: Asegurar que todos los archivos usen extensiones `.js` y que las importaciones sean correctas.

### 4. Variables de Entorno Faltantes
Las variables de entorno necesarias para Supabase podrían no estar configuradas.

**Solución**: Verificar en Vercel Dashboard que estén configuradas:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Pasos para Diagnosticar

1. **Revisar Logs de Vercel**:
   - Ir a Vercel Dashboard → Functions → Logs
   - Buscar el error específico con el ID: `iad1:iad1::jwdbf-1762748343598-61d8da05b458`

2. **Verificar Dependencias**:
   ```bash
   npm install pdf-lib qrcode @supabase/supabase-js
   ```

3. **Probar Endpoint de Diagnóstico**:
   - Acceder a: `/api/payments/LE8DY46Q/diagnostic`
   - Esto debería mostrar información sobre la configuración

4. **Probar Modo Simple Sin Dependencias**:
   - El modo `simple` no debería requerir Supabase
   - Si falla, el problema está en `pdf-lib`

## Cambios Realizados

1. ✅ Agregado manejo de errores robusto en `api/payments/[locator]/[[...action]].js`
2. ✅ Agregado runtime de Node.js en `vercel.json`
3. ✅ Mejorado logging en `generateSimplePDF`
4. ✅ Agregado validación de importaciones antes de usarlas

## Próximos Pasos

1. Revisar logs de Vercel para ver el error específico
2. Verificar que las dependencias estén en `package.json`
3. Probar el endpoint de diagnóstico
4. Si el problema persiste, considerar usar dynamic imports para `pdf-lib`

