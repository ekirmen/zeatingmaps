import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';
import CartDebug from './components/CartDebug';

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
  ViewModeSelector,
  DiscountCodeInput,
  ModeControls,
  ZoneSelector,
  ZonesTable,
  AbonosList
} from './components';

// Importar handlers
import { createSeatHandlers } from './components/SeatHandlers';
import { createZoneActions } from './components/ZoneActions';

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
  const [viewMode, setViewMode] = useState(showSeatingMap ? 'map' : 'zonas');
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
    zoneQuantities,
    setZoneQuantities,
    detallesPlantilla,
    zonePriceRanges,
    handleClearZoneSelection,
    handleQuantityChange
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

  const zoneActions = createZoneActions({
    selectedFuncion,
    carrito,
    setCarrito,
    selectedClient,
    zoneQuantities,
    setZoneQuantities,
    appliedDiscount,
    getPrecioConDescuento,
    detallesPlantilla
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

  // Handlers adicionales
  const handleSelectZoneForMap = (zonaId) => {
    setViewMode('map');
    setSelectedZonaId(zonaId);
    setZoneQuantities({});
    setTimeout(() => {
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  // Efectos
  React.useEffect(() => {
    if (!blockMode) {
      setTempBlocks([]);
      setCarrito(carrito.filter(i => !i.action));
    }
  }, [blockMode, carrito, setCarrito]);

  return (
    <div className="space-y-4 p-4">
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

      {/* View Mode Selector */}
      <ViewModeSelector
        showSeatingMap={showSeatingMap}
        viewMode={viewMode}
        setViewMode={setViewMode}
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

      {/* Conditional Rendering for Map or Zones */}
      {showSeatingMap && viewMode === 'map' ? (
        mapa ? (
          <>
            {/* Zone Selector */}
            <ZoneSelector
              zonas={zonas}
              selectedZonaId={selectedZonaId}
              setSelectedZonaId={setSelectedZonaId}
              handleClearZoneSelection={handleClearZoneSelection}
              zonePriceRanges={zonePriceRanges}
            />
            
            {/* Seating Map */}
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
          </>
        ) : (
          <p className="text-center text-gray-500">No hay mapa disponible</p>
        )
      ) : (
        <div className="overflow-x-auto">
          {/* Zones Table */}
          <ZonesTable
            detallesPlantilla={detallesPlantilla}
            zoneQuantities={zoneQuantities}
            handleQuantityChange={handleQuantityChange}
            handleAddZoneToCart={zoneActions.handleAddZoneToCart}
            handleSelectZoneForMap={handleSelectZoneForMap}
            getPrecioConDescuento={getPrecioConDescuento}
          />

          {/* Abonos List */}
          <AbonosList abonos={abonos} />
        </div>
      )}
      
      {/* Carrito con temporizador */}
      <CartWithTimer
        carrito={carrito}
        setCarrito={setCarrito}
        onPaymentClick={() => {
          message.info('Redirigiendo a pagos...');
        }}
        selectedClient={selectedClient}
        selectedAffiliate={selectedAffiliate}
      />
      
      {/* Debug del carrito (solo en desarrollo) */}
      <CartDebug carrito={carrito} setCarrito={setCarrito} />
      
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
