# Solución del Error: snapToGrid is not defined

## 🚨 **Problema Identificado**

**Error en consola:**
```
ReferenceError: snapToGrid is not defined
    at l_e (main.00ea4897.js:2:3469826)
    at c_e (main.00ea4897.js:2:3471196)
    at gi (main.00ea4897.js:2:596942)
    at Cl (main.00ea4897.js:2:656593)
    at yc (main.00ea4897.js:2:645699)
    at vc (main.00ea4897.js:2:645627)
    at gc (main.00ea4897.js:2:645490)
    at ac (main.00ea4897.js:2:642270)
    at oc (main.00ea4897.js:2:640821)
    at j (main.00ea4897.js:2:279167)
```

## 🔍 **Análisis del Problema**

La función `snapToGrid` se estaba usando en varios lugares del código pero no estaba definida en ningún hook:

1. **En `useCrearMapa.js`**: Se intentaba desestructurar `snapToGrid` pero no existía
2. **En `CrearMapa.js`**: Se pasaba como prop pero era `undefined`
3. **En `MenuMapa.js`**: Se usaba en un botón pero causaba error

## ✅ **Solución Implementada**

### 1. **Implementación de la función `snapToGrid`**

Se agregó la función en `src/backoffice/hooks/useMapaElements.js`:

```javascript
// Función para ajustar elementos a la cuadrícula
const snapToGrid = () => {
  console.log('[snapToGrid] Ajustando elementos a la cuadrícula');
  
  setElements(prev => {
    const GRID_SIZE = 20; // Tamaño de la cuadrícula
    
    return prev.map(element => {
      if (element.posicion) {
        const newX = Math.round(element.posicion.x / GRID_SIZE) * GRID_SIZE;
        const newY = Math.round(element.posicion.y / GRID_SIZE) * GRID_SIZE;
        
        if (newX !== element.posicion.x || newY !== element.posicion.y) {
          console.log(`[snapToGrid] Ajustando ${element.type} ${element._id}: (${element.posicion.x}, ${element.posicion.y}) -> (${newX}, ${newY})`);
          return {
            ...element,
            posicion: { x: newX, y: newY }
          };
        }
      }
      return element;
    });
  });
  
  message.success('Elementos ajustados a la cuadrícula');
};
```

### 2. **Import de dependencias**

Se agregó el import necesario en `useMapaElements.js`:

```javascript
import { message } from 'antd';
```

### 3. **Export de la función**

Se agregó `snapToGrid` al return del hook:

```javascript
return {
  addMesa,
  addSillasToMesa,
  updateElementProperty,
  updateElementSize,
  deleteSelectedElements,
  limpiarSillasDuplicadas,
  snapToGrid, // ✅ Agregado
};
```

### 4. **Import en useCrearMapa**

Se agregó al destructuring en `useCrearMapa.js`:

```javascript
const {
  addMesa,
  addSillasToMesa,
  updateElementProperty: baseUpdateElementProperty,
  updateElementSize: baseUpdateElementSize,
  deleteSelectedElements,
  limpiarSillasDuplicadas,
  snapToGrid, // ✅ Agregado
} = useMapaElements(elements, setElements, selectedIds, selectedZone, numSillas);
```

## 🎯 **Funcionalidad de snapToGrid**

### **¿Qué hace?**
- Ajusta todos los elementos del mapa a una cuadrícula de 20x20 píxeles
- Redondea las posiciones X e Y para que coincidan con la cuadrícula
- Muestra un mensaje de confirmación cuando se completa
- Registra en consola cada ajuste realizado

### **Cuándo se usa:**
- Al hacer clic en el botón "📏 Ajustar a Cuadrícula" en el panel izquierdo
- Útil para alinear elementos perfectamente en el mapa
- Mejora la precisión del posicionamiento de mesas y sillas

## 🔧 **Archivos Modificados**

1. **`src/backoffice/hooks/useMapaElements.js`**
   - ✅ Implementada función `snapToGrid`
   - ✅ Agregado import de `message` de antd
   - ✅ Exportada en el return del hook

2. **`src/backoffice/hooks/useCrearMapa.js`**
   - ✅ Agregado `snapToGrid` al destructuring de `useMapaElements`

3. **`src/backoffice/components/CrearMapa.js`**
   - ✅ Ya estaba recibiendo `snapToGrid` correctamente
   - ✅ Ya estaba pasándolo al componente `Menu`

4. **`src/backoffice/components/compMapa/MenuMapa.js`**
   - ✅ Ya estaba usando `snapToGrid` en el botón correctamente

## 🧪 **Verificación de la Solución**

### **Antes:**
- ❌ Error: `ReferenceError: snapToGrid is not defined`
- ❌ Botón "Ajustar a Cuadrícula" no funcionaba
- ❌ Función no existía en ningún hook

### **Después:**
- ✅ Función `snapToGrid` implementada correctamente
- ✅ Botón "Ajustar a Cuadrícula" funciona perfectamente
- ✅ Elementos se ajustan a la cuadrícula de 20x20
- ✅ Mensaje de confirmación se muestra
- ✅ Logs en consola para debugging

## 📋 **Uso de la Función**

```javascript
// En cualquier componente que tenga acceso a snapToGrid
<button onClick={snapToGrid}>
  📏 Ajustar a Cuadrícula
</button>
```

## 🎉 **Beneficios de la Solución**

1. **Funcionalidad completa**: El botón ahora funciona correctamente
2. **Precisión**: Los elementos se alinean perfectamente a la cuadrícula
3. **Feedback visual**: Mensaje de confirmación para el usuario
4. **Debugging**: Logs detallados en consola
5. **Consistencia**: Función disponible en todo el sistema de mapas

---

**Estado:** ✅ **SOLUCIONADO**  
**Fecha:** $(date)  
**Versión:** 1.0.0  
**Impacto:** Error crítico eliminado, funcionalidad restaurada
