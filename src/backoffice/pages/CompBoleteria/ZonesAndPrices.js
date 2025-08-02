import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
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

  // Handlers
  const seatHandlers = createSeatHandlers({
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
  });



  // Callbacks
  const onSeatsUpdated = useCallback((ids, estado) => {
    setMapa((prev) => {
      if (!prev) return prev;
      const blocked = estado === 'bloqueado';
      return {
        ...prev,
        contenido: prev.contenido.map((mesa) => ({
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

  return (
    <div className="h-full flex flex-col">
      {/* Header con controles */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Event Selector */}
        <EventSelector
          eventos={eventos}
          selectedEvent={selectedEvent}
          onEventSelect={onEventSelect}
          funciones={funciones}
          onShowFunctions={onShowFunctions}
          selectedFuncion={selectedFuncion}
        />

        {/* Function Selector */}
        <FunctionSelector
          selectedFuncion={selectedFuncion}
          onShowFunctions={onShowFunctions}
        />

        {/* Discount Code Input */}
        <DiscountCodeInput
          discountCode={discountCode}
          setDiscountCode={setDiscountCode}
          handleApplyDiscount={handleApplyDiscount}
          appliedDiscount={appliedDiscount}
        />

        {/* Mode Controls */}
        <ModeControls
          blockMode={blockMode}
          setBlockMode={setBlockMode}
          abonoMode={abonoMode}
          setAbonoMode={setAbonoMode}
          setCarrito={setCarrito}
          carrito={carrito}
        />

        {/* Zone Selector */}
        <ZoneSelector
          zonas={zonas}
          selectedZonaId={selectedZonaId}
          setSelectedZonaId={setSelectedZonaId}
          handleClearZoneSelection={handleClearZoneSelection}
          zonePriceRanges={zonePriceRanges}
        />
      </div>

      {/* Área principal del mapa */}
      <div className="flex-1 overflow-auto">
        {mapa ? (
          <div className="h-full">
            <SeatingMap
              mapa={mapa}
              onSeatClick={seatHandlers.handleSeatClick}
              selectedZona={zonas.find(z => (z.id || z._id) === selectedZonaId) || null}
              availableZonas={selectedZonaId ? [selectedZonaId] : zonas.map(z => z.id || z._id)}
              blockMode={blockMode}
              tempBlocks={tempBlocks}
              abonoMode={abonoMode}
              abonoSeats={abonoSeats}
              containerRef={mapContainerRef}
              onSelectCompleteTable={seatHandlers.handleSelectCompleteTable}
            />
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
