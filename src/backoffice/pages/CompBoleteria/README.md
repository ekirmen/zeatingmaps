# ZonesAndPrices - Componente Modular

Este componente ha sido refactorizado para mejorar la mantenibilidad y legibilidad del código, separando la lógica en hooks personalizados y componentes más pequeños.

## Estructura del Proyecto

```
src/backoffice/pages/CompBoleteria/
├── ZonesAndPrices.js          # Componente principal (ahora ~150 líneas)
├── README.md                  # Esta documentación
├── components/                # Componentes UI separados
│   ├── index.js              # Exportaciones de componentes
│   ├── EventSelector.js      # Selector de eventos
│   ├── FunctionSelector.js   # Selector de funciones
│   ├── ViewModeSelector.js   # Selector de modo de vista
│   ├── DiscountCodeInput.js  # Input de código de descuento
│   ├── ModeControls.js       # Controles de modo (bloqueo/abono)
│   ├── ZoneSelector.js       # Selector de zonas
│   ├── ZonesTable.js         # Tabla de zonas y precios
│   ├── AbonosList.js         # Lista de abonos
│   ├── SeatHandlers.js       # Lógica de manejo de asientos
│   └── ZoneActions.js        # Acciones de zonas
└── hooks/                    # Hooks personalizados
    ├── index.js              # Exportaciones de hooks
    ├── useMapData.js         # Hook para datos del mapa
    ├── useDiscountCode.js    # Hook para códigos de descuento
    ├── useSeatManagement.js  # Hook para gestión de asientos
    └── useZoneManagement.js  # Hook para gestión de zonas
```

## Beneficios de la Refactorización

### ✅ **Reducción de Código**
- **Antes**: ~700 líneas en un solo archivo
- **Después**: ~150 líneas en el archivo principal + módulos separados

### ✅ **Separación de Responsabilidades**
- **Hooks**: Lógica de negocio reutilizable
- **Componentes**: UI específica y reutilizable
- **Handlers**: Lógica de eventos específica

### ✅ **Mejor Mantenibilidad**
- Cada módulo tiene una responsabilidad específica
- Cambios en un área no afectan otras
- Más fácil de testear individualmente

### ✅ **Reutilización**
- Los hooks pueden usarse en otros componentes
- Los componentes UI son reutilizables
- Mejor organización del código

## Hooks Personalizados

### `useMapData`
Maneja la carga y gestión de datos del mapa y zonas.

### `useDiscountCode`
Gestiona códigos de descuento y cálculo de precios con descuento.

### `useSeatManagement`
Maneja la lógica de bloqueo de asientos, modo abono y animaciones.

### `useZoneManagement`
Gestiona la selección de zonas, cantidades y rangos de precios.

## Componentes UI

### `EventSelector`
Selector de eventos con imagen del logo.

### `FunctionSelector`
Muestra la función seleccionada con opción de cambiar.

### `ViewModeSelector`
Controla el cambio entre vista de mapa y zonas.

### `DiscountCodeInput`
Maneja la entrada y aplicación de códigos de descuento.

### `ModeControls`
Controles para modo bloqueo y modo abono.

### `ZoneSelector`
Selector de zonas para el modo mapa.

### `ZonesTable`
Tabla de zonas y precios para el modo zonas.

### `AbonosList`
Lista de abonos disponibles.

## Handlers

### `SeatHandlers`
Contiene la lógica compleja de manejo de asientos:
- Selección/deselección de asientos
- Bloqueo de asientos
- Selección de mesa completa
- Validaciones de estado

### `ZoneActions`
Maneja las acciones relacionadas con zonas:
- Agregar zonas al carrito
- Agregar tickets individuales por zona
- Validaciones de cliente

## Uso

El componente principal ahora es mucho más limpio y fácil de entender:

```jsx
const ZonesAndPrices = ({ ...props }, ref) => {
  // Hooks personalizados
  const { mapa, zonas } = useMapData(selectedFuncion);
  const { discountCode, handleApplyDiscount } = useDiscountCode();
  const { blockMode, handleSeatAnimation } = useSeatManagement(selectedEvent, abonoMode);
  const { selectedZonaId, zonePriceRanges } = useZoneManagement(selectedPlantilla, getPrecioConDescuento);

  // Handlers
  const seatHandlers = createSeatHandlers({ ... });
  const zoneActions = createZoneActions({ ... });

  return (
    <div>
      <EventSelector {...props} />
      <FunctionSelector {...props} />
      <ViewModeSelector {...props} />
      {/* ... resto de componentes */}
    </div>
  );
};
```

## Ventajas de esta Arquitectura

1. **Escalabilidad**: Fácil agregar nuevas funcionalidades
2. **Testabilidad**: Cada módulo puede testearse independientemente
3. **Reutilización**: Hooks y componentes pueden usarse en otros lugares
4. **Legibilidad**: Código más fácil de entender y mantener
5. **Modularidad**: Cambios en un área no afectan otras 