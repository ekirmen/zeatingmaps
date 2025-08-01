# Sistema de Boletería con Carrito y Temporizador

## Descripción

Este sistema implementa una boletería moderna con las siguientes características:

- **Carrito con temporizador de 15 minutos**
- **Animaciones de asientos que aparecen y desaparecen**
- **Modo bloqueo de asientos**
- **Interfaz similar a la imagen de referencia**

## Características Principales

### 1. Carrito con Temporizador
- **Tiempo límite**: 15 minutos para completar la compra
- **Barra de progreso**: Visual del tiempo restante
- **Advertencias**: Alertas cuando quedan 5 minutos o menos
- **Auto-limpieza**: Los asientos se liberan automáticamente al agotarse el tiempo

### 2. Animaciones de Asientos
- **Duración**: 2 segundos de visualización
- **Posición aleatoria**: Aparecen en diferentes lugares de la pantalla
- **Información completa**: Muestra zona, precio y número de asiento
- **Transiciones suaves**: Usando Framer Motion

### 3. Modo Bloqueo
- **Propósito**: Bloquear asientos temporalmente
- **Indicador visual**: Asientos amarillos cuando están bloqueados
- **Sin precio**: Los asientos bloqueados no tienen costo

### 4. Interfaz de Usuario
- **Navegación por pestañas**: Mapa, Zonas, Productos, Otros
- **Selección de eventos**: Dropdown con eventos disponibles
- **Selección de funciones**: Botones para diferentes fechas
- **Botones de precio**: Muestra precios por zona

## Componentes Principales

### CartWithTimer.jsx
```javascript
// Carrito con temporizador de 15 minutos
<CartWithTimer
  carrito={carrito}
  setCarrito={setCarrito}
  onPaymentClick={handlePaymentClick}
  selectedClient={selectedClient}
  selectedAffiliate={selectedAffiliate}
/>
```

### SeatAnimation.jsx
```javascript
// Animación de asiento que aparece por 2 segundos
<SeatAnimation
  seat={seat}
  onAnimationComplete={handleAnimationComplete}
/>
```

### SimpleSeatingMap.jsx
```javascript
// Mapa de asientos simplificado
<SimpleSeatingMap
  onSeatClick={handleSeatClick}
  selectedSeats={selectedSeats}
  blockMode={blockMode}
/>
```

## Flujo de Uso

1. **Seleccionar Evento**: Elegir de la lista desplegable
2. **Seleccionar Función**: Elegir fecha y hora
3. **Seleccionar Cliente**: Hacer clic en "Seleccionar Cliente"
4. **Elegir Asientos**: Hacer clic en los asientos deseados
5. **Ver Animaciones**: Los asientos aparecen con animación
6. **Revisar Carrito**: El carrito aparece automáticamente
7. **Completar Compra**: Hacer clic en "Pagos/Detalles"

## Configuración

### Variables de Entorno
```bash
# No se requieren variables adicionales para el funcionamiento básico
```

### Dependencias
```json
{
  "framer-motion": "^11.0.0",
  "react-icons": "^5.5.0",
  "antd": "^5.24.1"
}
```

## Rutas

- **Ruta principal**: `/dashboard/boleteria-main`
- **Acceso**: Menú lateral → Programación → Boletería Nueva

## Personalización

### Cambiar Tiempo del Temporizador
```javascript
// En CartWithTimer.jsx
const [timeLeft, setTimeLeft] = useState(15 * 60); // Cambiar a 10 minutos: 10 * 60
```

### Cambiar Duración de Animación
```javascript
// En SeatAnimation.jsx
const timer = setTimeout(() => {
  setIsVisible(false);
}, 2000); // Cambiar a 3 segundos: 3000
```

### Modificar Colores
```javascript
// En SimpleSeatingMap.jsx
const getSeatColor = (seat) => {
  if (seat.isSelected) return 'bg-green-500 text-white'; // Cambiar color seleccionado
  if (!seat.isAvailable) return 'bg-gray-400 text-gray-600';
  if (blockMode) return 'bg-yellow-500 text-white hover:bg-yellow-600';
  return 'bg-blue-500 text-white hover:bg-blue-600'; // Cambiar color disponible
};
```

## Funcionalidades Futuras

- [ ] Integración con base de datos real
- [ ] Sistema de pagos
- [ ] Gestión de clientes
- [ ] Reportes de ventas
- [ ] Múltiples mapas de asientos
- [ ] Sistema de descuentos
- [ ] Gestión de abonos

## Solución de Problemas

### El carrito no aparece
- Verificar que `carrito.length > 0`
- Revisar que `selectedClient` esté definido

### Las animaciones no funcionan
- Verificar que `framer-motion` esté instalado
- Revisar la consola del navegador para errores

### El temporizador no funciona
- Verificar que el componente `CartWithTimer` esté montado
- Revisar que `carrito` tenga elementos

## Notas Técnicas

- **Estado global**: Usando React hooks para gestión de estado
- **Animaciones**: Framer Motion para transiciones suaves
- **Responsive**: Diseño adaptable a diferentes pantallas
- **Accesibilidad**: Controles accesibles por teclado
- **Performance**: Optimizado con `useCallback` y `useMemo` 