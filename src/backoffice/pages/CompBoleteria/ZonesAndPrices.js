import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useMemo, useEffect } from 'react';
import { message } from 'antd';

const ZonesAndPrices = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  setSelectedEvent,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  onFunctionSelect,
  setSelectedFuncion,
  carrito,
  setCarrito,
  selectedPlantilla,
  setSelectedPlantilla,
  selectedClient,
  setSelectedClient,
  abonos = [],
  selectedAffiliate,
  setSelectedAffiliate,
  showSeatingMap = true,
  plantillas = [],
}, ref) => {
  // Estados locales
  const [viewMode, setViewMode] = useState('map'); // Siempre mostrar el mapa por defecto
  const [abonoMode, setAbonoMode] = useState(false);
  const mapContainerRef = useRef(null);

  // Hooks personalizados - TODO: Implementar cuando sea necesario
  // Por ahora se usan valores por defecto
  const mapa = null;
  const setMapa = () => {};
  const zonas = [];
  const setZonas = () => {};
  const discountCode = '';
  const setDiscountCode = () => {};
  const appliedDiscount = null;
  const handleApplyDiscount = () => {};
  const getPrecioConDescuento = (precio) => precio;
  const blockMode = false;
  const setBlockMode = () => {};
  const tempBlocks = [];
  const setTempBlocks = () => {};
  const abonoSeats = [];
  const animatingSeats = [];
  const lockSeat = () => {};
  const unlockSeat = () => {};
  const isSeatLocked = () => false;
  const isSeatLockedByMe = () => false;
  const handleSeatAnimation = () => {};
  const handleAnimationComplete = () => {};
  const selectedZonaId = null;
  const setSelectedZonaId = () => {};
  const detallesPlantilla = null;
  const zonePriceRanges = [];
  const handleClearZoneSelection = () => {};
  const saveState = () => {};
  const restoreState = () => null;
  const clearState = () => {};
  
  // Restaurar estado guardado cuando se carguen los datos
  useEffect(() => {
    if (eventos.length > 0 && !selectedEvent && !selectedFuncion) {
      const restoredState = restoreState(eventos, funciones, []);
      if (restoredState) {
        onEventSelect(restoredState.selectedEvent);
      }
    }
  }, [eventos, funciones, selectedEvent, selectedFuncion, restoreState, onEventSelect]);
  
  // Limpiar carrito al cargar la página
  useEffect(() => {
    if (setCarrito) {
      setCarrito([]);
    }
  }, [setCarrito]);


  // TODO: Implementar seatHandlers completo cuando sea necesario
  const seatHandlers = {
    handleSeatClick: () => {},
    handleSelectCompleteTable: () => {}
  };

  // Callbacks
  const onSeatsUpdated = useCallback((ids, estado) => {
    setMapa((prev) => {
      if (!prev) return prev;
      const blocked = estado === 'bloqueado';
      
      // Handle new structure where contenido is an object with elementos property
      const elementos = Array.isArray(prev.contenido) 
        ? prev.contenido 
        : prev.contenido.elementos || [];
      
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
  const availableZonas = useMemo(() => {
    if (selectedZonaId) {
      return [selectedZonaId];
    }
    return zonas.map(z => z.id || z._id).filter(Boolean);
  }, [selectedZonaId, zonas]);

  // Memoizar las props del SeatingMap
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
        {/* Información del cliente seleccionado */}
        {selectedClient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-blue-800">Cliente Seleccionado</h3>
                <p className="text-blue-700">
                  <strong>Nombre:</strong> {selectedClient.nombre || selectedClient.login || 'Sin nombre'}
                </p>
                <p className="text-blue-700">
                  <strong>Email:</strong> {selectedClient.email || 'Sin email'}
                </p>
                <p className="text-blue-700">
                  <strong>Teléfono:</strong> {selectedClient.telefono || 'Sin teléfono'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-red-500 hover:text-red-700 text-lg font-bold"
                title="Quitar cliente"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Event Selector */}
        {/* <EventSelector {...eventSelectorProps} /> */}

        {/* Function Selector */}
        {/* <FunctionSelector {...functionSelectorProps} /> */}

        {/* Discount Code Input */}
        {/* <DiscountCodeInput {...discountCodeInputProps} /> */}

        {/* Mode Controls */}
        {/* <ModeControls {...modeControlsProps} /> */}

        {/* Zone Selector */}
        {/* <ZoneSelector {...zoneSelectorProps} /> */}
        
        {/* Botón para limpiar estado guardado */}
        <div className="flex justify-end">
          <button
            onClick={clearState}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
            title="Limpiar estado guardado"
          >
            Limpiar estado guardado
          </button>
        </div>
      </div>

      {/* Área principal del mapa */}
      <div className="flex-1 overflow-auto">
        {mapa ? (
          <div className="h-full">
            {/* <SeatingMapUnified {...seatingMapProps} /> */}
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Mapa temporalmente deshabilitado para debug</p>
            </div>
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
      {/* {animatingSeats.map((seat) => (
        <SeatAnimation
          key={`${seat._id}-${Date.now()}`}
          seat={seat}
          onAnimationComplete={handleAnimationComplete}
        />
      ))} */}
    </div>
  );
};

export default forwardRef(ZonesAndPrices);
