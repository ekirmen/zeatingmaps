# Solución para Errores de `length` en Arrays Undefined

## Problema Identificado

Se estaban produciendo errores de `TypeError: Cannot read properties of undefined (reading 'length')` en varios componentes cuando se intentaba acceder a la propiedad `length` de arrays que podían ser `undefined`.

## Archivos Solucionados

### 1. `src/components/seatLockStore.js`
- **Problema**: Arrays `lockedSeats` podían ser `undefined`
- **Solución**: Agregadas validaciones `Array.isArray()` en todas las operaciones
- **Cambios**:
  - `setLockedSeats`: Validación antes de asignar
  - `subscribeToFunction`: Validación en `fetchInitialLocks`
  - `lockSeat` y `unlockSeat`: Validaciones en actualizaciones locales
  - `isSeatLocked` e `isSeatLockedByMe`: Validaciones antes de usar `some()`

### 2. `src/store/pages/EventosMapPage.js`
- **Problema**: `cartItems` podía ser `undefined`
- **Solución**: Agregadas validaciones `!cartItems || cartItems.length`
- **Cambios**:
  - `handleProceedToCart`: Validación antes de verificar `length`
  - Display de cantidad: `cartItems ? cartItems.length : 0`
  - Botón deshabilitado: `!cartItems || cartItems.length === 0`

### 3. `src/store/pages/Pay.js`
- **Problema**: `cartItems` podía ser `undefined`
- **Solución**: Agregadas validaciones en múltiples ubicaciones
- **Cambios**:
  - `loadFacebookPixel`: `cartItems && cartItems.length > 0`
  - `ticketCount`: `cartItems ? cartItems.length : 0`
  - Validación de carrito vacío: `!cartItems || cartItems.length === 0`
  - Facebook pixel data: `cartItems ? cartItems.length : 0`

### 4. `src/store/pages/EventsVenue.js`
- **Problema**: `events` podía ser `undefined`
- **Solución**: Agregadas validaciones en display y filtros
- **Cambios**:
  - Display de eventos: `events ? events.length : 0`
  - Filtro de eventos a la venta: `events ? events.filter(...).length : 0`
  - Condiciones de renderizado: `events && events.length > 0`
  - Mensaje de no eventos: `!events || events.length === 0`

### 5. `src/store/pages/EventosPage.js`
- **Problema**: `funciones` podía ser `undefined`
- **Solución**: Agregada validación en display
- **Cambios**:
  - Display de funciones: `funciones && funciones.length > 0`

### 6. `src/backoffice/hooks/useBoleteria.js`
- **Problema**: `setSelectedPlantilla` no estaba siendo exportado
- **Solución**: Agregado al objeto de retorno del hook
- **Cambios**:
  - Agregado `setSelectedPlantilla` al `returnValue`
  - Incluido en las dependencias del `useMemo`

## Patrón de Solución Implementado

### Para Arrays que pueden ser `undefined`:

```javascript
// ❌ Antes (puede causar error)
if (array.length === 0) { ... }
const count = array.length;

// ✅ Después (seguro)
if (!array || array.length === 0) { ... }
const count = array ? array.length : 0;
```

### Para Arrays en JSX:

```javascript
// ❌ Antes
<span>{array.length}</span>

// ✅ Después
<span>{array ? array.length : 0}</span>
```

### Para Condiciones de Renderizado:

```javascript
// ❌ Antes
{array.length > 0 && <Component />}

// ✅ Después
{array && array.length > 0 && <Component />}
```

## Beneficios de las Soluciones

1. **Prevención de errores**: Elimina los `TypeError` por acceso a `length` de `undefined`
2. **Mejor UX**: Evita que la aplicación se rompa cuando los datos no están disponibles
3. **Código más robusto**: Manejo defensivo de datos que pueden ser `undefined`
4. **Compatibilidad**: Mantiene la funcionalidad existente mientras agrega seguridad

## Verificación

Para verificar que los errores se han solucionado:

1. **Recarga la aplicación**: Los errores de `length` no deberían aparecer
2. **Prueba diferentes estados**: 
   - Carrito vacío
   - Sin eventos cargados
   - Sin funciones disponibles
3. **Revisa la consola**: No deberían aparecer errores de `TypeError`

## Archivos Afectados

- ✅ `src/components/seatLockStore.js`
- ✅ `src/store/pages/EventosMapPage.js`
- ✅ `src/store/pages/Pay.js`
- ✅ `src/store/pages/EventsVenue.js`
- ✅ `src/store/pages/EventosPage.js`
- ✅ `src/backoffice/hooks/useBoleteria.js`

## Notas Adicionales

- **Patrón consistente**: Todas las validaciones siguen el mismo patrón
- **Performance**: Las validaciones son mínimas y no afectan el rendimiento
- **Mantenibilidad**: El código es más fácil de mantener y debuggear
- **Escalabilidad**: El patrón se puede aplicar a otros arrays en el futuro 