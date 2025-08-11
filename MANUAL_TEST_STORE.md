# 🧪 MANUAL TEST STORE - Verificación Completa

## 🎯 **OBJETIVO:**
Verificar que **TODA LA SECUENCIA** del store funcione correctamente desde la selección del evento hasta el pago.

## 🚀 **PASOS DEL TEST:**

### **PASO 1: Página Principal del Store**
```
URL: https://zeatingmaps-ekirmens-projects.vercel.app/store
✅ VERIFICAR: Lista de eventos visible
✅ VERIFICAR: Eventos tienen imágenes y títulos
✅ VERIFICAR: Eventos son clickeables
```

### **PASO 2: Seleccionar Evento**
```
✅ CLICK: En cualquier evento de la lista
✅ VERIFICAR: Redirige a /store/eventos/[slug]
✅ VERIFICAR: Página del evento carga correctamente
✅ VERIFICAR: Información del evento visible
```

### **PASO 3: Verificar Funciones Disponibles**
```
✅ VERIFICAR: Selector de funciones visible
✅ VERIFICAR: Lista de funciones desplegable
✅ VERIFICAR: Funciones tienen fechas y horarios
```

### **PASO 4: Seleccionar Función**
```
✅ CLICK: En el selector de funciones
✅ CLICK: En cualquier función disponible
✅ VERIFICAR: Botón "Ver Mapa de Asientos" aparece
✅ VERIFICAR: Botón "Ver Mapa Completo" aparece
```

### **PASO 5: Ver Mapa de Asientos**
```
✅ CLICK: En "Ver Mapa de Asientos"
✅ VERIFICAR: Mapa aparece en la misma página
✅ VERIFICAR: Tab "Asientos" está activo
✅ VERIFICAR: Tab "Productos" está disponible
```

### **PASO 6: Verificar Contenido del Mapa**
```
✅ VERIFICAR: Mesa 1 (redonda) visible con 4 sillas
✅ VERIFICAR: Mesa 2 (rectangular) visible sin sillas
✅ VERIFICAR: Sillas tienen colores (verde = disponible)
✅ VERIFICAR: Leyenda de colores visible
```

### **PASO 7: Seleccionar Asientos**
```
✅ CLICK: En cualquier silla disponible
✅ VERIFICAR: Silla cambia a color azul (seleccionada)
✅ VERIFICAR: Contador del carrito se actualiza
✅ VERIFICAR: Panel lateral del carrito muestra el asiento
```

### **PASO 8: Verificar Carrito**
```
✅ VERIFICAR: Panel lateral muestra asientos seleccionados
✅ VERIFICAR: Precios están visibles
✅ VERIFICAR: Total se calcula correctamente
✅ VERIFICAR: Botón "Ver Carrito" está habilitado
```

### **PASO 9: Ir al Carrito**
```
✅ CLICK: En "Ver Carrito"
✅ VERIFICAR: Redirige a /store/cart
✅ VERIFICAR: Lista de asientos seleccionados visible
✅ VERIFICAR: Precios y totales correctos
✅ VERIFICAR: Botón "Proceder al Pago" visible
```

### **PASO 10: Ir al Pago**
```
✅ CLICK: En "Proceder al Pago"
✅ VERIFICAR: Redirige a /store/payment
✅ VERIFICAR: Formulario de pago visible
✅ VERIFICAR: Campos requeridos están presentes
✅ VERIFICAR: Total del pedido visible
```

## 🔍 **VERIFICACIONES ESPECÍFICAS:**

### **Mapa de Asientos:**
- [ ] Mesa 1 (redonda) visible
- [ ] Mesa 2 (rectangular) visible
- [ ] Sillas de Mesa 1 clickeables
- [ ] Colores correctos (verde=disponible, azul=seleccionado)
- [ ] Leyenda de colores visible

### **Carrito:**
- [ ] Asientos seleccionados visibles
- [ ] Precios correctos
- [ ] Total calculado correctamente
- [ ] Botones de acción funcionan

### **Pago:**
- [ ] Formulario completo
- [ ] Validaciones funcionan
- [ ] Total visible
- [ ] Botones de pago funcionan

## 🚨 **POSIBLES PROBLEMAS:**

### **Si el mapa no aparece:**
1. Verificar consola del navegador
2. Verificar que la función tenga sala asociada
3. Verificar permisos RLS en Supabase
4. Verificar que `mapa.contenido` no se transforme

### **Si los asientos no son clickeables:**
1. Verificar que `SeatingMapUnified` reciba datos correctos
2. Verificar que `onSeatToggle` esté funcionando
3. Verificar que el carrito esté conectado

### **Si el carrito no se actualiza:**
1. Verificar que `useCartStore` esté funcionando
2. Verificar que `toggleSeat` esté implementado
3. Verificar que el estado se actualice correctamente

## 📝 **NOTAS DEL TEST:**

- **Navegador:** Usar Chrome/Edge con DevTools abierto
- **Consola:** Verificar errores JavaScript
- **Network:** Verificar llamadas a la API
- **Tiempo:** Test completo toma ~5-10 minutos

## 🎉 **CRITERIO DE ÉXITO:**

✅ **TODOS los pasos funcionan correctamente**
✅ **Mapa se muestra con mesas y sillas**
✅ **Asientos son seleccionables**
✅ **Carrito se actualiza correctamente**
✅ **Flujo hasta el pago es completo**

---

**¿Listo para ejecutar el test manual?** 🚀
