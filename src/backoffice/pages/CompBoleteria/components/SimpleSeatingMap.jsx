import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Button,
  Badge,
  message,
  Tooltip,
  Typography,
} from '../../../../utils/antdComponents';
import { supabase } from '../../../../supabaseClient';
import resolveImageUrl from '../../../../utils/resolveImageUrl';
import { useSeatColors } from '../../../../hooks/useSeatColors';

const { Text, Title } = Typography;

const SimpleSeatingMap = ({
  selectedFuncion,
  selectedEvent = null, // Agregar prop para evento (necesario para colores)
  onSeatClick,
  selectedSeats = [],
  blockedSeats = [],
  blockMode = false,
  zonas = [], // Agregar prop para zonas
  selectedPlantilla = null, // Agregar prop para plantilla de precios
  selectedPriceOption = null, // Nuevo prop para el precio seleccionado
  selectedZonaId = null,
  mapa = null, // Agregar prop para el mapa
  lockedSeats = [], // Prop para bloqueos sincronizados con el padre
  onLockChange = null, // Callback para notificar cambios en bloqueos
}) => {
  const [error, setError] = useState(null);
  const [zonePrices, setZonePrices] = useState({});

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Track map prop changes silently
  useEffect(() => {
    // Map prop changes tracked silently
  }, [mapa]);

  // Calcular dimensiones del mapa para ajustar el contenedor
  useEffect(() => {
    const computeDimensions = () => {
      if (!mapa || !mapa.contenido) {
        return;
      }

      let maxX = 0;
      let maxY = 0;
      let minX = 0;
      let minY = 0;

      const considerPoint = (x, y) => {
        if (typeof x === 'number') {
          maxX = Math.max(maxX, x);
          minX = Math.min(minX, x);
        }
        if (typeof y === 'number') {
          maxY = Math.max(maxY, y);
          minY = Math.min(minY, y);
        }
      };

      if (Array.isArray(mapa.contenido)) {
        mapa.contenido.forEach(elemento => {
          // Bordes de la mesa
          if (elemento.posicion) {
            considerPoint(
              elemento.posicion.x + (elemento.width || 0),
              elemento.posicion.y + (elemento.height || 0)
            );
          }
          // Asientos
          if (Array.isArray(elemento.sillas)) {
            elemento.sillas.forEach(silla => {
              const sx = silla?.posicion?.x ?? silla?.x;
              const sy = silla?.posicion?.y ?? silla?.y;
              considerPoint(sx, sy);
            });
          }
        });
      } else if (mapa.contenido?.zonas) {
        mapa.contenido.zonas.forEach(zona => {
          if (Array.isArray(zona.asientos)) {
            zona.asientos.forEach(silla => {
              const sx = silla?.posicion?.x ?? silla?.x;
              const sy = silla?.posicion?.y ?? silla?.y;
              considerPoint(sx, sy);
            });
          }
        });
      }

      // Calcular dimensiones considerando coordenadas negativas
      const totalWidth = Math.max(800, maxX - minX + 60);
      const totalHeight = Math.max(600, maxY - minY + 60);

      setDimensions({
        width: totalWidth,
        height: totalHeight,
      });

      setOffset({
        x: Math.abs(minX),
        y: Math.abs(minY),
      });
    };

    computeDimensions();
  }, [mapa]);

  // Cargar precios de zonas
  const loadZonePrices = async () => {
    if (!selectedPlantilla?.detalles) return;

    try {
      const detalles = Array.isArray(selectedPlantilla.detalles)
        ? selectedPlantilla.detalles
        : JSON.parse(selectedPlantilla.detalles);

      const prices = {};
      detalles.forEach(detalle => {
        const zonaId = detalle.zona?.id || detalle.zonaId || detalle.zona;
        const zonaNombre = detalle.zona?.nombre || `Zona ${zonaId}`;
        const precio = detalle.precio || 0;

        if (!prices[zonaId]) {
          prices[zonaId] = {
            nombre: zonaNombre,
            precio: precio,
            detalles: [],
          };
        }
        prices[zonaId].detalles.push(detalle);
      });

      setZonePrices(prices);
    } catch (error) {
      console.error('Error cargando precios de zonas:', error);
    }
  };

  useEffect(() => {
    loadZonePrices();
  }, [selectedPlantilla, selectedFuncion]);

  // Usar el hook unificado de colores para consistencia con el store
  const { getSeatColor: getUnifiedSeatColor } = useSeatColors(selectedEvent?.id);

  const getSeatColor = seat => {
    const sessionId = localStorage.getItem('anonSessionId');

    // Preparar datos para el hook unificado
    const selectedSeatIds = selectedSeats.map(s => s._id);
    const lockedSeatsForHook = lockedSeats.map(lock => ({
      seat_id: lock.seat_id,
      session_id: lock.session_id,
      status: lock.status,
    }));

    // Obtener informaci³n de zona
    const zonaInfo = getZoneInfo(seat);

    // Usar el hook unificado que maneja todos los casos
    return getUnifiedSeatColor(
      seat,
      zonaInfo,
      selectedSeatIds.includes(seat._id),
      selectedSeatIds,
      lockedSeatsForHook
    );
  };

  const getZoneInfo = seat => {
    // Admite estructura { zona: { id, nombre, color } } o zonaId simple
    const zonaId = seat.zona?.id || seat.zonaId || seat.zona;
    const zonaNombre = seat.zona?.nombre;
    const zonaColor = seat.zona?.color;
    if (!zonaId && !zonaNombre) return { nombre: 'Sin zona', precio: 0, color: '#f0f0f0' };

    const zonePrice = zonaId ? zonePrices[zonaId] : undefined;
    if (zonePrice) {
      return {
        nombre: zonePrice.nombre,
        precio: zonePrice.precio,
        color: zonaColor || zonePrice.color || '#5C1473',
      };
    }
    // Si no hay precio en plantilla, usar datos embebidos de la zona del asiento
    return {
      nombre: zonaNombre || `Zona ${zonaId}`,
      precio: 0,
      color: zonaColor || '#f0f0f0',
    };
  };

  const handleSeatClick = async (seat, mesa = null) => {
    try {
      // IMPORTANTE: Verificar si el asiento est¡ vendido o reservado ANTES de cualquier otra l³gica
      if (seat.estado === 'pagado' || seat.estado === 'reservado') {
        message.warning('Este asiento ya est¡ vendido o reservado y no se puede seleccionar');
        return;
      }

      // En modo bloqueo, delegar al padre sin exigir precio ni bloquear en BD
      if (blockMode) {
        onSeatClick(seat, mesa);
        return;
      }

      // Verificar si ya est¡ seleccionado por el usuario actual
      const sessionId = localStorage.getItem('anonSessionId') || crypto.randomUUID();
      if (!localStorage.getItem('anonSessionId')) {
        localStorage.setItem('anonSessionId', sessionId);
      }

      // Usar lockedSeats para determinar si el asiento ya est¡ seleccionado por el usuario actual
      const isAlreadySelected = Array.isArray(lockedSeats)
        ? lockedSeats.some(ls => ls.seat_id === seat._id && ls.session_id === sessionId)
        : false;

      // Debug mejorado con informaci³n de estados
      const currentLock = Array.isArray(lockedSeats)
        ? lockedSeats.find(ls => ls.seat_id === seat._id)
        : null;
      console.log('ðŸ” [SimpleSeatingMap] Estado del asiento:', {
        seatId: seat._id,
        seatEstado: seat.estado,
        isAlreadySelected,
        currentLock: currentLock
          ? {
              status: currentLock.status,
              lock_type: currentLock.lock_type,
              locator: currentLock.locator,
              expires_at: currentLock.expires_at,
              session_id: currentLock.session_id,
            }
          : null,
        selectedSeatsCount: Array.isArray(selectedSeats) ? selectedSeats.length : 0,
        selectedSeatsIds: Array.isArray(selectedSeats) ? selectedSeats.map(s => s._id) : [],
        lockedSeatsCount: Array.isArray(lockedSeats) ? lockedSeats.length : 0,
        lockedSeatsIds: Array.isArray(lockedSeats) ? lockedSeats.map(ls => ls.seat_id) : [],
        sessionId,
        isPermanent:
          currentLock?.status === 'locked' ||
          currentLock?.status === 'vendido' ||
          currentLock?.status === 'reservado' ||
          currentLock?.status === 'anulado',
        isTemporary: currentLock?.status === 'seleccionado',
      });

      // Si ya est¡ seleccionado, deseleccionarlo
      if (isAlreadySelected) {
        // Desbloquear el asiento en la base de datos
        const { error: unlockError } = await supabase
          .from('seat_locks')
          .delete()
          .eq('seat_id', seat._id)
          .eq('funcion_id', parseInt(selectedFuncion.id))
          .eq('session_id', sessionId)
          .eq('lock_type', 'seat');

        if (unlockError) {
          console.error('Œ Error al desbloquear asiento:', unlockError);
          message.error('Error al deseleccionar el asiento');
          return;
        } else {
          // Notificar al componente padre sobre el cambio
          if (onLockChange) {
            onLockChange('unlock', seat._id);
          } else {
          }
        }

        // Llamar al callback del padre para deseleccionar
        // Buscar el asiento en selectedSeats para obtener la informaci³n de precio
        const selectedSeatWithPrice = Array.isArray(selectedSeats)
          ? selectedSeats.find(s => s._id === seat._id)
          : null;
        if (selectedSeatWithPrice) {
          onSeatClick(selectedSeatWithPrice, mesa);
        } else {
          onSeatClick(seat, mesa);
        }
        const seatInfo = mesa
          ? `Mesa ${mesa.nombre} - ${seat.nombre || seat.numero || seat._id}`
          : seat.nombre || seat.numero || seat._id;
        message.success(`œ… Asiento ${seatInfo} deseleccionado`);
        return;
      } else {
      }

      // Verificar si hay un precio seleccionado
      if (!selectedPriceOption) {
        message.warning('Primero selecciona una zona y precio antes de elegir asientos');
        return;
      }

      const rawPrice = selectedPriceOption?.precio ?? selectedPriceOption?.precioOriginal;
      const priceValue = Number(rawPrice);

      if (!Number.isFinite(priceValue)) {
        message.error('El precio seleccionado no es v¡lido');
        return;
      }

      // Restringir a la zona activa si est¡ definida
      const seatZonaId = String(seat?.zona?.id || seat?.zonaId || seat?.zona || '');
      if (selectedZonaId && seatZonaId && String(selectedZonaId) !== seatZonaId) {
        message.info('La zona seleccionada no coincide con este asiento');
        return;
      }

      // Verificar si el asiento est¡ disponible
      if (seat.estado === 'pagado' || seat.estado === 'reservado') {
        message.warning('Este asiento ya est¡ vendido o reservado');
        return;
      }

      // Verificar que tenemos los datos necesarios
      if (!selectedFuncion?.id) {
        message.error('No hay funci³n seleccionada');
        return;
      }

      if (!seat._id) {
        message.error('Asiento sin ID v¡lido');
        return;
      }

      // Verificar si est¡ bloqueado por otro usuario
      const blockingStatuses = [
        'locked',
        'seleccionado',
        'seleccionado_por_otro',
        'reservado',
        'vendido',
      ];
      const isLockedByOther = lockedSeats.some(ls => {
        if (ls.seat_id !== seat._id) {
          return false;
        }
        return blockingStatuses.includes(ls.status) && ls.session_id !== sessionId;
      });

      if (isLockedByOther) {
        message.warning('Este asiento est¡ bloqueado por otro usuario');
        return;
      }

      // Obtener el tenant_id actual
      const getCurrentTenantId = () => {
        try {
          const tenantId = localStorage.getItem('currentTenantId');
          if (tenantId) return tenantId;

          if (typeof window !== 'undefined' && window.__TENANT_CONTEXT__) {
            const globalTenantId = window.__TENANT_CONTEXT__.getTenantId?.();
            if (globalTenantId) return globalTenantId;
          }
          return null;
        } catch (error) {
          return null;
        }
      };

      const tenantId = getCurrentTenantId();

      // Generar locator temporal simple de 8 caracteres
      const generateTempLocator = () => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from(
          { length: 8 },
          () => alphabet[Math.floor(Math.random() * alphabet.length)]
        ).join('');
      };

      // Bloquear asiento en la base de datos
      const lockData = {
        seat_id: seat._id,
        funcion_id: parseInt(selectedFuncion.id), // Asegurar que sea nºmero
        session_id: sessionId,
        locked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
        status: 'seleccionado',
        lock_type: 'seat', // Agregar el tipo de bloqueo requerido por las pol­ticas
        locator: generateTempLocator(), // Agregar locator temporal
      };

      // Agregar tenant_id si est¡ disponible
      if (tenantId) {
        lockData.tenant_id = tenantId;
      }
      const { error: lockError } = await supabase.from('seat_locks').upsert(lockData);

      if (lockError) {
        console.error('Error al bloquear asiento:', lockError);
        console.error('Datos enviados:', lockData);
        message.error('Error al seleccionar el asiento');
        return;
      } else {
        // Notificar al componente padre sobre el cambio
        if (onLockChange) {
          onLockChange('lock', seat._id, lockData);
        }
      }

      // Crear objeto de asiento con precio y informaci³n del precio seleccionado
      const seatWithPrice = {
        ...seat,
        mesa: mesa,
        funcion_id: selectedFuncion?.id,
        precio: priceValue,
        precioInfo: {
          entrada: selectedPriceOption.entrada,
          zona: selectedPriceOption.zona,
          comision: selectedPriceOption.comision,
          precioOriginal: selectedPriceOption.precioOriginal,
          category: selectedPriceOption.category,
        },
      };

      onSeatClick(seatWithPrice);

      // Crear mensaje m¡s informativo
      let seatInfo = '';
      if (mesa) {
        seatInfo = `Mesa ${mesa.nombre} - ${seat.nombre || 'Asiento'}`;
      } else {
        seatInfo = seat.nombre || 'Asiento';
      }

      const zonaInfo = selectedPriceOption.zona?.nombre || 'Zona';
      const entradaInfo = selectedPriceOption.entrada?.nombre_entrada || 'Entrada';
      const precioInfo = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '0.00';

      message.success(
        `ðŸŽ« ${seatInfo} seleccionado - ${entradaInfo} - ${zonaInfo} - $${precioInfo}`
      );
    } catch (error) {
      console.error('Error al manejar selecci³n de asiento:', error);
      message.error('Error al seleccionar el asiento');
    }
  };

  if (error) {
    return (
      <Card className="text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </Card>
    );
  }

  if (!mapa || !mapa.contenido) {
    return (
      <Card className="text-center">
        <div className="text-gray-500">
          {!mapa ? 'Esperando mapa...' : 'Mapa sin contenido configurado'}
        </div>
        {!mapa && (
          <div className="text-xs text-gray-400 mt-2">El mapa se cargar¡ autom¡ticamente</div>
        )}
      </Card>
    );
  }

  return (
    <div
      className="relative overflow-auto"
      style={{ width: '100%', height: `${dimensions.height}px` }}
    >
      <div
        className="relative"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {/* Manejar diferentes estructuras de mapa.contenido */}
        {Array.isArray(mapa.contenido) ? (
          // Si mapa.contenido es un array
          [...mapa.contenido]
            .sort((a, b) => {
              const ay = a?.posicion?.y ?? 0;
              const by = b?.posicion?.y ?? 0;
              if (ay !== by) return ay - by;
              const ax = a?.posicion?.x ?? 0;
              const bx = b?.posicion?.x ?? 0;
              return ax - bx;
            })
            .map(elemento => (
              <div key={elemento._id} className="absolute">
                {/* Fondo */}
                {elemento.type === 'background' &&
                  (() => {
                    let rawUrl =
                      elemento.imageData ||
                      elemento.image?.data ||
                      elemento.src ||
                      elemento.url ||
                      elemento.imageUrl ||
                      '';
                    if (rawUrl && !/^https?:\/\//i.test(rawUrl) && !/^data:/i.test(rawUrl)) {
                      rawUrl = resolveImageUrl(rawUrl, 'productos') || rawUrl;
                    }
                    return (
                      <img
                        alt="background"
                        src={rawUrl}
                        loading="lazy"
                        crossOrigin="anonymous"
                        className="absolute"
                        style={{
                          left: elemento.x || elemento.posicion?.x || 0,
                          top: elemento.y || elemento.posicion?.y || 0,
                          width: elemento.width || dimensions.width,
                          height: elemento.height || dimensions.height,
                          zIndex: 0,
                          pointerEvents: 'none',
                        }}
                      />
                    );
                  })()}

                {/* Mesa */}
                {elemento.type === 'mesa' &&
                  (() => {
                    // Detectar si la mesa contiene sillas de la zona activa
                    // NOTA: Los textos de las mesas ahora est¡n perfectamente centrados usando transform: translate(-50%, -50%)
                    const mesaTieneZonaActiva =
                      Array.isArray(elemento.sillas) &&
                      elemento.sillas.some(s => {
                        const zid = String(s?.zona?.id || s?.zonaId || s?.zona || '');
                        return selectedZonaId && zid && String(selectedZonaId) === zid;
                      });
                    const zonaColorMesa = mesaTieneZonaActiva
                      ? elemento.sillas.find(
                          s =>
                            String(s?.zona?.id || s?.zonaId || s?.zona || '') ===
                            String(selectedZonaId)
                        )?.zona?.color
                      : null;
                    return (
                      <div
                        className={`absolute ${
                          elemento.shape === 'rect' ? 'rounded-lg' : 'rounded-full'
                        }`}
                        style={{
                          left:
                            elemento.shape === 'circle'
                              ? (elemento.posicion?.x ?? elemento.x ?? 0) -
                                (elemento.radius ?? elemento.width ?? 0) / 2
                              : (elemento.posicion?.x ?? elemento.x ?? 0),
                          top:
                            elemento.shape === 'circle'
                              ? (elemento.posicion?.y ?? elemento.y ?? 0) -
                                (elemento.radius ?? elemento.height ?? elemento.width ?? 0) / 2
                              : (elemento.posicion?.y ?? elemento.y ?? 0),
                          width:
                            elemento.shape === 'circle'
                              ? (elemento.radius ?? 30) * 2
                              : (elemento.width ?? 100),
                          height:
                            elemento.shape === 'circle'
                              ? (elemento.radius ?? 30) * 2
                              : (elemento.height ?? 60),
                          backgroundColor: elemento.fill || 'lightblue',
                          border: mesaTieneZonaActiva
                            ? `2px solid ${zonaColorMesa || '#5C1473'}`
                            : '2px solid #d1d5db',
                          boxShadow: mesaTieneZonaActiva
                            ? `0 0 8px ${zonaColorMesa || '#5C1473'}55`
                            : 'none',
                          zIndex: 1,
                          cursor: 'default',
                          pointerEvents: 'none',
                        }}
                      >
                        {elemento.nombre && (
                          <div
                            className="absolute text-xs font-medium text-center w-full"
                            style={{
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              zIndex: 2,
                            }}
                          >
                            {elemento.nombre}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Formas gen©ricas (rect/circle) que no son mesas */}
                {!elemento.type && elemento.shape === 'rect' && (
                  <div
                    className="absolute border border-gray-300 rounded"
                    style={{
                      left: elemento.posicion?.x ?? elemento.x ?? 0,
                      top: elemento.posicion?.y ?? elemento.y ?? 0,
                      width: elemento.width ?? 100,
                      height: elemento.height ?? 60,
                      backgroundColor: elemento.fill || '#f0f0f0',
                      opacity: 0.8,
                    }}
                  />
                )}
                {!elemento.type && elemento.shape === 'circle' && (
                  <div
                    className="absolute rounded-full border border-gray-300"
                    style={{
                      left:
                        (elemento.posicion?.x ?? elemento.x ?? 0) -
                        (elemento.radius ?? elemento.width ?? 40) / 2,
                      top:
                        (elemento.posicion?.y ?? elemento.y ?? 0) -
                        (elemento.radius ?? elemento.width ?? 40) / 2,
                      width: elemento.radius ? elemento.radius * 2 : (elemento.width ?? 40),
                      height: elemento.radius
                        ? elemento.radius * 2
                        : (elemento.height ?? elemento.width ?? 40),
                      backgroundColor: elemento.fill || '#f0f0f0',
                      opacity: 0.8,
                    }}
                  />
                )}

                {/* Texto gen©rico */}
                {(elemento.type === 'Text' || elemento.text) && (
                  <div
                    className="absolute text-xs text-gray-700"
                    style={{
                      left: elemento.posicion?.x ?? elemento.x ?? 0,
                      top: elemento.posicion?.y ?? elemento.y ?? 0,
                    }}
                  >
                    {elemento.text || elemento.nombre}
                  </div>
                )}

                {/* Sillas anidadas dentro de elemento */}
                {(elemento.sillas || elemento.asientos || elemento.seats || []).map(silla => {
                  const zoneInfo = getZoneInfo(silla);
                  const isSelected = selectedSeats.some(s => s._id === silla._id);
                  const isLockedByMe = lockedSeats.some(
                    ls =>
                      ls.seat_id === silla._id &&
                      ls.session_id === (localStorage.getItem('anonSessionId') || '')
                  );
                  const sx = silla?.posicion?.x ?? silla?.x;
                  const sy = silla?.posicion?.y ?? silla?.y;
                  // Si hay una mesa circular padre, centrar los asientos correctamente
                  // NOTA: Para mesas circulares, las coordenadas de las sillas son relativas al centro de la mesa
                  const isCircleTable = elemento?.type === 'mesa' && elemento?.shape === 'circle';
                  const chairDiameter = 20; // Di¡metro del asiento (coincide con width/height)

                  // Calcular posici³n relativa a la mesa si es circular
                  let adjustedLeft, adjustedTop;

                  if (isCircleTable) {
                    // Para mesas circulares, las coordenadas de las sillas son relativas al centro de la mesa
                    const mesaCenterX = elemento.posicion?.x ?? elemento.x ?? 0;
                    const mesaCenterY = elemento.posicion?.y ?? elemento.y ?? 0;

                    // Calcular posici³n absoluta de la silla
                    const absoluteX = mesaCenterX + (sx || 0);
                    const absoluteY = mesaCenterY + (sy || 0);

                    // Ajustar para centrar la silla
                    adjustedLeft = absoluteX - chairDiameter / 2;
                    adjustedTop = absoluteY - chairDiameter / 2;

                    // Asegurar que no queden coordenadas negativas
                    adjustedLeft = Math.max(0, adjustedLeft);
                    adjustedTop = Math.max(0, adjustedTop);
                  } else {
                    // Para mesas rectangulares o sillas independientes
                    adjustedLeft = (sx || 0) - chairDiameter / 2;
                    adjustedTop = (sy || 0) - chairDiameter / 2;

                    // Asegurar que no queden coordenadas negativas
                    adjustedLeft = Math.max(0, adjustedLeft);
                    adjustedTop = Math.max(0, adjustedTop);
                  }

                  const isOtherZone =
                    selectedZonaId &&
                    String(selectedZonaId) !==
                      String(silla?.zona?.id || silla?.zonaId || silla?.zona || '');
                  const muted = isOtherZone && silla.estado === 'disponible';
                  const seatFill = silla.fill || getSeatColor(silla);
                  const borderStyle = isSelected
                    ? `4px solid ${seatFill}`
                    : isLockedByMe
                      ? '3px solid #f59e0b'
                      : !isOtherZone && zoneInfo.color
                        ? `2px solid ${zoneInfo.color}`
                        : '1px solid #666';
                  const glowShadow = isSelected
                    ? `0 0 15px ${seatFill}, 0 0 25px ${seatFill}`
                    : isLockedByMe
                      ? '0 0 12px rgba(245, 158, 11, 0.6)'
                      : !isOtherZone && zoneInfo.color
                        ? `0 0 8px ${zoneInfo.color}55`
                        : 'none';
                  return (
                    <Tooltip
                      key={silla._id}
                      title={`${silla.nombre || silla.numero} - ${zoneInfo.nombre} - $${zoneInfo.precio}`}
                      placement="top"
                    >
                      <div
                        className={`absolute transition-all duration-300 ease-in-out ${
                          silla.estado === 'pagado' || silla.estado === 'reservado'
                            ? 'cursor-not-allowed opacity-60'
                            : isSelected
                              ? 'cursor-pointer hover:scale-110 transform scale-105'
                              : 'cursor-pointer hover:scale-110'
                        }`}
                        style={{
                          left: adjustedLeft,
                          top: adjustedTop,
                          width: chairDiameter,
                          height: chairDiameter,
                          borderRadius: '50%',
                          backgroundColor: seatFill,
                          border: borderStyle,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: 'white',
                          fontWeight: 'bold',
                          boxShadow: glowShadow,
                          opacity: muted ? 0.35 : 1,
                          zIndex: 2,
                          transition: 'all 0.3s ease-in-out',
                        }}
                        onClick={() => {
                          // Solo permitir click si NO est¡ vendido o reservado
                          if (silla.estado !== 'pagado' && silla.estado !== 'reservado') {
                            handleSeatClick(silla, elemento);
                          }
                        }}
                      >
                        {silla.nombre || silla.numero}
                      </div>
                    </Tooltip>
                  );
                })}

                {/* Silla como elemento tope del array (type: 'silla') */}
                {elemento.type === 'silla' &&
                  (() => {
                    const silla = elemento;
                    const zoneInfo = getZoneInfo(silla);
                    const isSelected = selectedSeats.some(s => s._id === silla._id);
                    const isLockedByMe = lockedSeats.some(
                      ls =>
                        ls.seat_id === silla._id &&
                        ls.session_id === (localStorage.getItem('anonSessionId') || '')
                    );
                    const sx = silla?.posicion?.x ?? silla?.x;
                    const sy = silla?.posicion?.y ?? silla?.y;
                    const isOtherZoneTop =
                      selectedZonaId &&
                      String(selectedZonaId) !==
                        String(silla?.zona?.id || silla?.zonaId || silla?.zona || '');
                    const mutedTop = isOtherZoneTop && silla.estado === 'disponible';
                    const seatFillTop = silla.fill || getSeatColor(silla);
                    const borderStyleTop = isSelected
                      ? `4px solid ${seatFillTop}`
                      : isLockedByMe
                        ? '3px solid #f59e0b'
                        : !isOtherZoneTop && zoneInfo.color
                          ? `2px solid ${zoneInfo.color}`
                          : '1px solid #666';
                    const glowShadowTop = isSelected
                      ? `0 0 15px ${seatFillTop}, 0 0 25px ${seatFillTop}`
                      : isLockedByMe
                        ? '0 0 12px rgba(245, 158, 11, 0.6)'
                        : !isOtherZoneTop && zoneInfo.color
                          ? `0 0 8px ${zoneInfo.color}55`
                          : 'none';
                    return (
                      <Tooltip
                        key={silla._id}
                        title={`${silla.nombre || silla.numero} - ${zoneInfo.nombre} - $${zoneInfo.precio}`}
                        placement="top"
                      >
                        <div
                          className={`absolute transition-all duration-300 ease-in-out ${
                            silla.estado === 'pagado' || silla.estado === 'reservado'
                              ? 'cursor-not-allowed opacity-60'
                              : isSelected
                                ? 'cursor-pointer hover:scale-110 transform scale-105'
                                : 'cursor-pointer hover:scale-110'
                          }`}
                          style={{
                            left: Math.max(0, (sx || 0) - (silla.radius || 15)),
                            top: Math.max(0, (sy || 0) - (silla.radius || 15)),
                            width: (silla.radius || 15) * 2,
                            height: (silla.radius || 15) * 2,
                            borderRadius: '50%',
                            backgroundColor: seatFillTop,
                            border: borderStyleTop,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'white',
                            fontWeight: 'bold',
                            boxShadow: glowShadowTop,
                            opacity: mutedTop ? 0.35 : 1,
                            zIndex: 2,
                            transition: 'all 0.3s ease-in-out',
                          }}
                          onClick={() => {
                            // Solo permitir click si NO est¡ vendido o reservado
                            if (silla.estado !== 'pagado' && silla.estado !== 'reservado') {
                              handleSeatClick(silla);
                            }
                          }}
                        >
                          {silla.nombre || silla.numero}
                        </div>
                      </Tooltip>
                    );
                  })()}
              </div>
            ))
        ) : mapa.contenido?.zonas ? (
          // Si mapa.contenido es un objeto con zonas
          mapa.contenido.zonas.map(zona => (
            <div key={zona.id || zona._id}>
              {/* Renderizar asientos de la zona */}
              {zona.asientos &&
                zona.asientos.map(silla => {
                  const zoneInfo = getZoneInfo(silla);
                  const isSelected = selectedSeats.some(s => s._id === silla._id);
                  const isLockedByMe = lockedSeats.some(
                    ls =>
                      ls.seat_id === silla._id &&
                      ls.session_id === (localStorage.getItem('anonSessionId') || '')
                  );
                  const sx = silla?.posicion?.x ?? silla?.x;
                  const sy = silla?.posicion?.y ?? silla?.y;

                  return (
                    <Tooltip
                      key={silla._id}
                      title={`${silla.nombre || silla.numero} - ${zoneInfo.nombre} - $${zoneInfo.precio}`}
                      placement="top"
                    >
                      <div
                        className={`absolute transition-transform ${
                          silla.estado === 'pagado' || silla.estado === 'reservado'
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer hover:scale-110'
                        }`}
                        style={{
                          left: (sx || 0) - 15,
                          top: (sy || 0) - 15,
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          backgroundColor: getSeatColor(silla),
                          border: isSelected
                            ? '3px solid #000'
                            : isLockedByMe
                              ? '2px solid #f59e0b'
                              : '1px solid #666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: 'white',
                          fontWeight: 'bold',
                          boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                        }}
                        onClick={() => {
                          // Solo permitir click si NO est¡ vendido o reservado
                          if (silla.estado !== 'pagado' && silla.estado !== 'reservado') {
                            handleSeatClick(silla);
                          }
                        }}
                      >
                        {silla.nombre || silla.numero}
                      </div>
                    </Tooltip>
                  );
                })}
            </div>
          ))
        ) : (
          // Si no hay estructura reconocible
          <div className="text-center text-gray-500 mt-8">Estructura de mapa no reconocida</div>
        )}
      </div>

      {/* Leyenda movida a bot³n informativo en BoleteriaMain */}
    </div>
  );
};

export default SimpleSeatingMap;
