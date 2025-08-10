import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useMemo } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import SeatAnimation from '../../components/SeatAnimation';

// Importar hooks personalizados
import {
  useMapData,
  useDiscountCode,
  useSeatManagement,
  useZoneManagement
} from './hooks';

// Importar componentes separados
import {
  EventSelector,
  FunctionSelector,
  DiscountCodeInput,
  ModeControls,
  ZoneSelector
} from './components';

// Importar handlers
import { createSeatHandlers } from './components/SeatHandlers';

const ZonesAndPrices = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  carrito,
  setCarrito,
  selectedPlantilla,
  selectedClient,
  abonos = [],
  selectedAffiliate,
  setSelectedAffiliate,
  showSeatingMap = true,
}, ref) => {
  // Estados locales
  const [viewMode, setViewMode] = useState('map'); // Siempre mostrar el mapa por defecto
  const [abonoMode, setAbonoMode] = useState(false);
  const mapContainerRef = useRef(null);

  // Hooks personalizados
  const { mapa, setMapa, zonas, setZonas } = useMapData(selectedFuncion);
  const { 
    discountCode, 
    setDiscountCode, 
    appliedDiscount, 
    handleApplyDiscount, 
    getPrecioConDescuento 
  } = useDiscountCode();
  const {
    blockMode,
    setBlockMode,
    tempBlocks,
    setTempBlocks,
    abonoSeats,
    animatingSeats,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    handleSeatAnimation,
    handleAnimationComplete
  } = useSeatManagement(selectedEvent, abonoMode);
  const {
    selectedZonaId,
    setSelectedZonaId,
    detallesPlantilla,
    zonePriceRanges,
    handleClearZoneSelection
  } = useZoneManagement(selectedPlantilla, getPrecioConDescuento);

  // Debug logs
  console.log('ZonesAndPrices - selectedPlantilla:', selectedPlantilla);
  console.log('ZonesAndPrices - detallesPlantilla:', detallesPlantilla);
  console.log('ZonesAndPrices - zonePriceRanges:', zonePriceRanges);

  // Handlers - Memoizar para evitar re-creación
  const seatHandlers = useMemo(() => createSeatHandlers({
    selectedFuncion,
    carrito,
    setCarrito,
    selectedClient,
    blockMode,
    abonoMode,
    zonas,
    detallesPlantilla,
    appliedDiscount,
    funciones,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    handleSeatAnimation,
    abonoSeats
  }), [
    selectedFuncion,
    carrito,
    setCarrito,
    selectedClient,
    blockMode,
    abonoMode,
    zonas,
    detallesPlantilla,
    appliedDiscount,
    funciones,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    handleSeatAnimation,
    abonoSeats
  ]);

  // Callbacks
  const onSeatsUpdated = useCallback((ids, estado) => {
    setMapa((prev) => {
      if (!prev) return prev;
      const blocked = estado === 'bloqueado';
      
      // Handle new structure where contenido is an object with zonas property
      const elementos = Array.isArray(prev.contenido) 
        ? prev.contenido 
        : prev.contenido.zonas || [];
      
      return {
        ...prev,
        contenido: elementos.map((mesa) => ({
          ...mesa,
          sillas: mesa.sillas.map((s) => {
            const sid = s._id || s.id;
            if (ids.includes(sid)) {
              return { ...s, estado: estado, bloqueado: blocked };
            }
            return s;
          }),
        })),
      };
    });
  }, []);

  useImperativeHandle(ref, () => ({ onSeatsUpdated }));

  // Efectos
  React.useEffect(() => {
    if (!blockMode) {
      setTempBlocks([]);
      setCarrito(carrito.filter(i => !i.action));
    }
  }, [blockMode, carrito, setCarrito]);

  // Memoizar props de los componentes para evitar re-renderizados
  const eventSelectorProps = useMemo(() => ({
    eventos,
    selectedEvent,
    onEventSelect,
    funciones,
    onShowFunctions,
    selectedFuncion
  }), [eventos, selectedEvent, onEventSelect, funciones, onShowFunctions, selectedFuncion]);

  const functionSelectorProps = useMemo(() => ({
    selectedFuncion,
    onShowFunctions
  }), [selectedFuncion, onShowFunctions]);

  const discountCodeInputProps = useMemo(() => ({
    discountCode,
    setDiscountCode,
    handleApplyDiscount,
    appliedDiscount
  }), [discountCode, setDiscountCode, handleApplyDiscount, appliedDiscount]);

  const modeControlsProps = useMemo(() => ({
    blockMode,
    setBlockMode,
    abonoMode,
    setAbonoMode,
    setCarrito,
    carrito
  }), [blockMode, setBlockMode, abonoMode, setAbonoMode, setCarrito, carrito]);

  const zoneSelectorProps = useMemo(() => ({
    zonas,
    selectedZonaId,
    setSelectedZonaId,
    handleClearZoneSelection,
    zonePriceRanges,
    detallesPlantilla
  }), [zonas, selectedZonaId, setSelectedZonaId, handleClearZoneSelection, zonePriceRanges, detallesPlantilla]);

  // Memoizar la zona seleccionada
  const selectedZona = useMemo(() => 
    zonas.find(z => (z.id || z._id) === selectedZonaId) || null,
    [zonas, selectedZonaId]
  );

  // Memoizar las zonas disponibles
  const availableZonas = useMemo(() => 
    selectedZonaId ? [selectedZonaId] : zonas.map(z => z.id || z._id),
    [selectedZonaId, zonas]
  );

  // Memoizar las props del SeatingMap
  const seatingMapProps = useMemo(() => ({
    mapa,
    onSeatClick: seatHandlers.handleSeatClick,
    selectedZona,
    availableZonas,
    blockMode,
    tempBlocks,
    abonoMode,
    abonoSeats,
    containerRef: mapContainerRef,
    onSelectCompleteTable: seatHandlers.handleSelectCompleteTable
  }), [
    mapa,
    seatHandlers.handleSeatClick,
    selectedZona,
    availableZonas,
    blockMode,
    tempBlocks,
    abonoMode,
    abonoSeats,
    seatHandlers.handleSelectCompleteTable
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Header con controles */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Event Selector */}
        <EventSelector {...eventSelectorProps} />

        {/* Function Selector */}
        <FunctionSelector {...functionSelectorProps} />

        {/* Discount Code Input */}
        <DiscountCodeInput {...discountCodeInputProps} />

        {/* Mode Controls */}
        <ModeControls {...modeControlsProps} />

        {/* Zone Selector */}
        <ZoneSelector {...zoneSelectorProps} />
      </div>

      {/* Área principal del mapa */}
      <div className="flex-1 overflow-auto">
        {mapa ? (
          <div className="h-full">
            <SeatingMap {...seatingMapProps} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">No hay mapa disponible</p>
              <p className="text-gray-400 text-sm">Selecciona un evento y función para ver el mapa de asientos</p>
            </div>
          </div>
        )}
      </div>

      {/* Animaciones de asientos */}
      {animatingSeats.map((seat) => (
        <SeatAnimation
          key={`${seat._id}-${Date.now()}`}
          seat={seat}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}
    </div>
  );
};

export default forwardRef(ZonesAndPrices);
