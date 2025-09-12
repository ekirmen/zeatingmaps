import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useMemo, useEffect } from 'react';
import { message } from 'antd';
import SeatingMapUnified from '../../../components/SeatingMapUnified';
// import SeatAnimation from '../../components/SeatAnimation';

// Importar hooks personalizados
import {
  useMapData,
  useDiscountCode,
  useSeatManagement,
  useZoneManagement,
  useBoleteriaMemory
} from './hooks';

// Importar componentes separados
import EventSelector from './components/EventSelector';
import FunctionSelector from './components/FunctionSelector';
import DiscountCodeInput from './components/DiscountCodeInput';
import ModeControls from './components/ModeControls';
import ZoneSelector from './components/ZoneSelector';

// Importar handlers
import { createSeatHandlers } from './components/SeatHandlers';

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
  
  // Hook para recordar el último estado
  const { saveState, restoreState, clearState } = useBoleteriaMemory();
  
  // Restaurar estado guardado cuando se carguen los datos
  useEffect(() => {
    if (eventos.length > 0 && !selectedEvent && !selectedFuncion) {
      const restoredState = restoreState(eventos, funciones, []);
      if (restoredState) {
        console.log('🔄 Restaurando estado guardado:', restoredState);
        onEventSelect(restoredState.selectedEvent);
        // La función se seleccionará automáticamente cuando se seleccione el evento
      }
    }
  }, [eventos, funciones, selectedEvent, selectedFuncion, restoreState, onEventSelect]);
  
  // Limpiar carrito al cargar la página
  useEffect(() => {
    // Limpiar carrito al inicializar
    if (setCarrito) {
      setCarrito([]);
      console.log('🧹 [CARRO] Carrito limpiado al cargar página');
    }
  }, []);

  // Restaurar estado guardado al cargar
  useEffect(() => {
    if (eventos.length > 0 && funciones.length > 0 && plantillas.length > 0) {
      const savedState = useBoleteriaMemory.restoreState(eventos, funciones, plantillas);
      if (savedState) {
        console.log('🔄 [MEMORIA] Restaurando estado guardado:', savedState);
        
        // Restaurar evento
        if (savedState.selectedEvent) {
          setSelectedEvent(savedState.selectedEvent);
          console.log('✅ [MEMORIA] Evento restaurado:', savedState.selectedEvent.nombre);
        }
        
        // Restaurar función
        if (savedState.selectedFuncion) {
          setSelectedFuncion(savedState.selectedFuncion);
          console.log('✅ [MEMORIA] Función restaurada:', savedState.selectedFuncion.nombre);
          
          // Cargar automáticamente el mapa para la función restaurada
          if (savedState.selectedFuncion.sala?.id) {
            console.log('🗺️ [MEMORIA] Cargando mapa automáticamente para sala:', savedState.selectedFuncion.sala.id);
            // El useEffect de fetchMapa se ejecutará automáticamente
          }
        }
        
        // Restaurar plantilla
        if (savedState.selectedPlantilla) {
          setSelectedPlantilla(savedState.selectedPlantilla);
          console.log('✅ [MEMORIA] Plantilla restaurada:', savedState.selectedPlantilla.nombre);
        }
        
        message.success('Estado anterior restaurado automáticamente');
      }
    }
  }, [eventos, funciones, plantillas]);
  
  // Guardar estado cuando cambie
  useEffect(() => {
    if (selectedEvent && selectedFuncion) {
      saveState({
        selectedEvent,
        selectedFuncion,
        selectedPlantilla
      });
    }
  }, [selectedEvent, selectedFuncion, selectedPlantilla, saveState]);

  // Debug logs
  console.log('ZonesAndPrices - selectedPlantilla:', selectedPlantilla);
  console.log('ZonesAndPrices - detallesPlantilla:', detallesPlantilla);
  console.log('ZonesAndPrices - zonePriceRanges:', zonePriceRanges);
  
  // Debug adicional para zonas y mapa
  console.log('🔍 [ZonesAndPrices] Debug completo:', {
    zonas: {
      total: zonas.length,
      datos: zonas.map(z => ({ id: z.id, _id: z._id, nombre: z.nombre }))
    },
    selectedZonaId,
    availableZonas,
    mapa: {
      existe: !!mapa,
      contenido: mapa?.contenido?.length || 0,
      tipo: typeof mapa?.contenido
    }
  });

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
  const availableZonas = useMemo(() => {
    // Si hay una zona específica seleccionada, solo mostrar esa zona
    if (selectedZonaId) {
      console.log('🎯 [ZonesAndPrices] Zona específica seleccionada:', selectedZonaId);
      return [selectedZonaId];
    }
    
    // Si no hay zona seleccionada, mostrar todas las zonas disponibles
    const allZonas = zonas.map(z => z.id || z._id).filter(Boolean);
    console.log('🌍 [ZonesAndPrices] Mostrando todas las zonas disponibles:', allZonas);
    return allZonas;
  }, [selectedZonaId, zonas]);

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
        <EventSelector {...eventSelectorProps} />

        {/* Function Selector */}
        <FunctionSelector {...functionSelectorProps} />

        {/* Discount Code Input */}
        <DiscountCodeInput {...discountCodeInputProps} />

        {/* Mode Controls */}
        <ModeControls {...modeControlsProps} />

        {/* Zone Selector */}
        <ZoneSelector {...zoneSelectorProps} />
        
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
            <SeatingMapUnified {...seatingMapProps} />
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
