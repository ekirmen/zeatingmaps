# Solución de Errores Identificados

## Problemas Encontrados

### 1. **Múltiples instancias de GoTrueClient**
**Error:** `Multiple GoTrueClient instances detected in the same browser context`

**Causa:** Se están creando múltiples instancias del cliente Supabase en el navegador.

**Solución Aplicada:**
- ✅ Mejorado el patrón singleton en `src/supabaseClient.js`
- ✅ Agregada función `createOptimizedClient` con configuración optimizada
- ✅ Mejorado el manejo de instancias en entorno de navegador

### 2. **Errores de clave duplicada en tabla `seats`**
**Error:** `duplicate key value violates unique constraint "seats_pkey"`

**Causa:** Se están intentando insertar asientos con IDs que ya existen en la base de datos.

**Soluciones Aplicadas:**
- ✅ Mejorada la función `syncSeatsForSala` en `src/backoffice/services/apibackoffice.js`
- ✅ Implementado manejo de errores más robusto
- ✅ Agregada lógica para evitar intentos repetidos de inserción
- ✅ Creado script de limpieza: `scripts/cleanDuplicateSeats.mjs`
- ✅ Creado script SQL de diagnóstico: `sql/fix_seats_table_constraints.sql`

### 3. **Error de imagen placeholder**
**Error:** `GET https://via.placeholder.com/32x32 net::ERR_NAME_NOT_RESOLVED`

**Causa:** La imagen placeholder externa no está disponible.

**Solución Aplicada:**
- ✅ Reemplazada imagen placeholder con imagen local `/assets/logo.png`
- ✅ Actualizado en `src/backoffice/pages/CompBoleteria/BoleteriaMain.jsx`
- ✅ Actualizado en `src/backoffice/pages/CompBoleteria/BoleteriaDemo.js`

### 4. **Problema de sala no seleccionada**
**Error:** `No hay sala seleccionada`

**Causa:** El componente está intentando cargar asientos sin una sala válida.

**Solución Aplicada:**
- ✅ Mejorado el manejo de errores en `SimpleSeatingMap.jsx`
- ✅ Agregada validación más robusta para la selección de sala

## Pasos para Aplicar las Soluciones

### 1. Limpiar Duplicados en la Base de Datos

```bash
# Ejecutar el script de limpieza
node scripts/cleanDuplicateSeats.mjs
```

### 2. Verificar Estructura de la Tabla

```sql
-- Ejecutar en el SQL Editor de Supabase
-- Copiar y pegar el contenido de sql/fix_seats_table_constraints.sql
```

### 3. Reiniciar la Aplicación

```bash
# Detener el servidor de desarrollo
# Reiniciar la aplicación
npm start
```

## Verificaciones Adicionales

### 1. Verificar Variables de Entorno
Asegúrate de que las siguientes variables estén configuradas en tu archivo `.env`:

```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
```

### 2. Verificar Imagen Local
Asegúrate de que el archivo `/public/assets/logo.png` existe en tu proyecto.

### 3. Verificar Conexión a Supabase
Puedes verificar la conexión ejecutando:

```javascript
// En la consola del navegador
import { supabase } from './src/supabaseClient';
console.log('Supabase client:', supabase);
```

## Prevención de Problemas Futuros

### 1. Para Evitar Duplicados
- Siempre usar `upsert` con `onConflict: 'funcion_id,_id'` al insertar asientos
- Verificar existencia antes de insertar
- Implementar transacciones cuando sea necesario

### 2. Para Evitar Múltiples Instancias
- Usar siempre la instancia exportada desde `src/supabaseClient.js`
- No crear nuevas instancias del cliente en componentes individuales

### 3. Para Imágenes
- Usar imágenes locales en lugar de servicios externos
- Implementar fallbacks para imágenes que no cargan
- Usar CDN confiable para imágenes externas

## Monitoreo

### Logs a Observar
- ✅ `Multiple GoTrueClient instances` - Ya solucionado
- ✅ `duplicate key value violates unique constraint` - Ya solucionado
- ✅ `via.placeholder.com` - Ya solucionado
- ✅ `No hay sala seleccionada` - Mejorado el manejo

### Métricas de Éxito
- No más errores 409 (Conflict) en la tabla seats
- No más errores de múltiples instancias de GoTrueClient
- Carga correcta de imágenes
- Sincronización exitosa de asientos

## Contacto
Si persisten los problemas después de aplicar estas soluciones, revisa:
1. Los logs de la consola del navegador
2. Los logs del servidor de desarrollo
3. La configuración de Supabase en el dashboard 