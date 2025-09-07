import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Button, Badge, message, Tooltip, Typography } from 'antd';
import { supabase } from '../../../../supabaseClient';

const { Text, Title } = Typography;

const SimpleSeatingMap = ({ 
  selectedFuncion, 
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
  onLockChange = null // Callback para notificar cambios en bloqueos
}) => {
  const [error, setError] = useState(null);
  const [zonePrices, setZonePrices] = useState({});
  const channelRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Debug: Track map prop changes
  useEffect(() => {
    console.log('🔄 [SimpleSeatingMap] Mapa prop changed:', mapa);
    console.log('🔄 [SimpleSeatingMap] Mapa type:', typeof mapa);
    console.log('🔄 [SimpleSeatingMap] Mapa is null?', mapa === null);
    console.log('🔄 [SimpleSeatingMap] Mapa is undefined?', mapa === undefined);
    console.log('🔄 [SimpleSeatingMap] Mapa contenido:', mapa?.contenido);
    console.log('🔄 [SimpleSeatingMap] Mapa contenido type:', typeof mapa?.contenido);
    console.log('🔄 [SimpleSeatingMap] Mapa contenido is array?', Array.isArray(mapa?.contenido));
    
    if (!mapa) {
      console.log('❌ [SimpleSeatingMap] No hay mapa disponible');
    } else if (!mapa.contenido) {
      console.log('❌ [SimpleSeatingMap] Mapa sin contenido');
    } else {
      console.log('✅ [SimpleSeatingMap] Mapa válido con contenido');
    }
  }, [mapa]);

  // Calcular dimensiones del mapa para ajustar el contenedor
  useEffect(() => {
    const computeDimensions = () => {
      if (!mapa || !mapa.contenido) {
        setDimensions({ width: 800, height: 600 });
        return;
      }

      let maxX = 0;
      let maxY = 0;

      const considerPoint = (x, y) => {
        if (typeof x === 'number') maxX = Math.max(maxX, x);
        if (typeof y === 'number') maxY = Math.max(maxY, y);
      };

      if (Array.isArray(mapa.contenido)) {
        mapa.contenido.forEach(elemento => {
          // Bordes de la mesa
          if (elemento.posicion) {
            considerPoint(elemento.posicion.x + (elemento.width || 0), elemento.posicion.y + (elemento.height || 0));
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

      setDimensions({
        width: Math.max(800, (maxX || 0) + 60),
        height: Math.max(600, (maxY || 0) + 60)
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
            detalles: []
          };
        }
        prices[zonaId].detalles.push(detalle);
      });

      setZonePrices(prices);
      console.log('Precios de zonas cargados:', prices);
    } catch (error) {
      console.error('Error cargando precios de zonas:', error);
    }
  };

  useEffect(() => {
    loadZonePrices();
  }, [selectedPlantilla, selectedFuncion]);

  const getSeatColor = (seat) => {
    const sessionId = localStorage.getItem('anonSessionId');
    
    // IMPORTANTE: Los asientos vendidos SIEMPRE se mantienen en gris
    if (seat.estado === 'pagado') {
      return '#9ca3af'; // Gris oscuro para vendido - NO CAMBIA
    }
    
    // NARANJA para asientos reservados
    if (seat.estado === 'reservado') {
      return '#ff8c00'; // Naranja para reservado
    }
    
    // Si está en modo bloqueo y está seleccionado para bloquear
    if (blockMode && blockedSeats.some(s => s._id === seat._id)) {
      return '#ff4d4f'; // Rojo para asientos seleccionados en modo bloqueo
    }
    
    // AMARILLO para asientos seleccionados por el usuario actual
    const isSelectedByMe = lockedSeats.some(ls => 
      ls.seat_id === seat._id && ls.session_id === sessionId
    );
    if (isSelectedByMe) {
      return '#facc15'; // Amarillo para seleccionado
    }
    
    // ROJO para asientos bloqueados por otro usuario
    const isLockedByOther = lockedSeats.some(ls => 
      ls.seat_id === seat._id && ls.session_id !== sessionId
    );
    if (isLockedByOther) {
      return '#ff4d4f'; // Rojo para bloqueado por otro
    }
    
    // Si está bloqueado por el usuario actual
    const isLockedByMe = lockedSeats.some(ls => 
      ls.seat_id === seat._id && ls.session_id === sessionId
    );
    if (isLockedByMe) {
      return '#1890ff'; // Azul para bloqueado por mí
    }
    
    // VERDE para asientos disponibles
    const zoneInfo = getZoneInfo(seat);
    return '#52c41a'; // Verde para disponible
  };

  const getZoneInfo = (seat) => {
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
        color: zonaColor || zonePrice.color || '#5C1473'
      };
    }
    // Si no hay precio en plantilla, usar datos embebidos de la zona del asiento
    return {
      nombre: zonaNombre || `Zona ${zonaId}`,
      precio: 0,
      color: zonaColor || '#f0f0f0'
    };
  };

  const handleSeatClick = async (seat, mesa = null) => {
    try {
      // IMPORTANTE: Verificar si el asiento está vendido o reservado ANTES de cualquier otra lógica
      if (seat.estado === 'pagado' || seat.estado === 'reservado') {
        message.warning('Este asiento ya está vendido o reservado y no se puede seleccionar');
        return;
      }

      // En modo bloqueo, delegar al padre sin exigir precio ni bloquear en BD
      if (blockMode) {
        onSeatClick(seat, mesa);
        return;
      }

      // Verificar si ya está seleccionado por el usuario actual
      const sessionId = localStorage.getItem('anonSessionId') || crypto.randomUUID();
      if (!localStorage.getItem('anonSessionId')) {
        localStorage.setItem('anonSessionId', sessionId);
      }

      // Usar lockedSeats para determinar si el asiento ya está seleccionado por el usuario actual
      const isAlreadySelected = lockedSeats.some(ls => 
        ls.seat_id === seat._id && ls.session_id === sessionId
      );

      console.log('🔍 [SimpleSeatingMap] Estado del asiento:', {
        seatId: seat._id,
        isAlreadySelected,
        selectedSeatsCount: selectedSeats.length,
        selectedSeatsIds: selectedSeats.map(s => s._id),
        lockedSeatsCount: lockedSeats.length,
        lockedSeatsIds: lockedSeats.map(ls => ls.seat_id),
        sessionId
      });

      // Si ya está seleccionado, deseleccionarlo
      if (isAlreadySelected) {
        console.log('🔄 [SimpleSeatingMap] Deseleccionando asiento:', seat._id);
        
        // Desbloquear el asiento en la base de datos
        const { error: unlockError } = await supabase
          .from('seat_locks')
          .delete()
          .eq('seat_id', seat._id)
          .eq('funcion_id', parseInt(selectedFuncion.id))
          .eq('session_id', sessionId)
          .eq('lock_type', 'seat');

        if (unlockError) {
          console.error('❌ Error al desbloquear asiento:', unlockError);
          message.error('Error al deseleccionar el asiento');
          return;
        } else {
          console.log('✅ Asiento desbloqueado en la base de datos');
          
          // Notificar al componente padre sobre el cambio
          if (onLockChange) {
            console.log('📞 Llamando onLockChange con unlock para:', seat._id);
            onLockChange('unlock', seat._id);
          } else {
            console.warn('⚠️ onLockChange no está definido');
          }
        }

        // Llamar al callback del padre para deseleccionar
        console.log('📞 Llamando onSeatClick para deseleccionar:', seat._id);
        // Buscar el asiento en selectedSeats para obtener la información de precio
        const selectedSeatWithPrice = selectedSeats.find(s => s._id === seat._id);
        if (selectedSeatWithPrice) {
          onSeatClick(selectedSeatWithPrice, mesa);
        } else {
          onSeatClick(seat, mesa);
        }
        message.success('Asiento deseleccionado');
        return;
      } else {
        console.log('⚠️ [SimpleSeatingMap] Asiento NO está seleccionado, procediendo con selección:', seat._id);
      }

      // Verificar si hay un precio seleccionado
      if (!selectedPriceOption) {
        message.warning('Primero selecciona una zona y precio antes de elegir asientos');
        return;
      }

      // Restringir a la zona activa si está definida
      const seatZonaId = String(seat?.zona?.id || seat?.zonaId || seat?.zona || '');
      if (selectedZonaId && seatZonaId && String(selectedZonaId) !== seatZonaId) {
        message.info('La zona seleccionada no coincide con este asiento');
        return;
      }

      // Verificar si el asiento está disponible
      if (seat.estado === 'pagado' || seat.estado === 'reservado') {
        message.warning('Este asiento ya está vendido o reservado');
        return;
      }

      // Verificar que tenemos los datos necesarios
      if (!selectedFuncion?.id) {
        message.error('No hay función seleccionada');
        return;
      }

      if (!seat._id) {
        message.error('Asiento sin ID válido');
        return;
      }

      // Verificar si está bloqueado por otro usuario
      const isLockedByOther = lockedSeats.some(ls => 
        ls.seat_id === seat._id && ls.status === 'locked' && ls.session_id !== sessionId
      );
      
      if (isLockedByOther) {
        message.warning('Este asiento está bloqueado por otro usuario');
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
          
          console.warn('⚠️ No se pudo obtener el tenant_id para el bloqueo de asiento.');
          return null;
        } catch (error) {
          console.warn('No se pudo obtener el tenant ID:', error);
          return null;
        }
      };

      const tenantId = getCurrentTenantId();

      // Bloquear asiento en la base de datos
      const lockData = {
        seat_id: seat._id,
        funcion_id: parseInt(selectedFuncion.id), // Asegurar que sea número
        session_id: sessionId,
        locked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
        status: 'locked',
        lock_type: 'seat' // Agregar el tipo de bloqueo requerido por las políticas
      };

      // Agregar tenant_id si está disponible
      if (tenantId) {
        lockData.tenant_id = tenantId;
      }

      console.log('Intentando bloquear asiento con datos:', lockData);

      const { error: lockError } = await supabase
        .from('seat_locks')
        .upsert(lockData);

      if (lockError) {
        console.error('Error al bloquear asiento:', lockError);
        console.error('Datos enviados:', lockData);
        message.error('Error al seleccionar el asiento');
        return;
      } else {
        console.log('✅ Asiento bloqueado en la base de datos');
        // Notificar al componente padre sobre el cambio
        if (onLockChange) {
          onLockChange('lock', seat._id, lockData);
        }
      }

      // Crear objeto de asiento con precio y información del precio seleccionado
      const seatWithPrice = {
        ...seat,
        mesa: mesa,
        funcion_id: selectedFuncion?.id,
        precio: selectedPriceOption.precio,
        precioInfo: {
          entrada: selectedPriceOption.entrada,
          zona: selectedPriceOption.zona,
          comision: selectedPriceOption.comision,
          precioOriginal: selectedPriceOption.precioOriginal,
          category: selectedPriceOption.category
        }
      };
      
      onSeatClick(seatWithPrice);
      
      // Crear mensaje más informativo
      let seatInfo = '';
      if (mesa) {
        seatInfo = `Mesa ${mesa.nombre} - ${seat.nombre || 'Asiento'}`;
      } else {
        seatInfo = seat.nombre || 'Asiento';
      }
      
      const zonaInfo = selectedPriceOption.zona?.nombre || 'Zona';
      const entradaInfo = selectedPriceOption.entrada?.nombre_entrada || 'Entrada';
      
      message.success(`${seatInfo} - ${entradaInfo} - ${zonaInfo} - $${selectedPriceOption.precio.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error al manejar selección de asiento:', error);
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
        {!mapa && <div className="text-xs text-gray-400 mt-2">El mapa se cargará automáticamente</div>}
      </Card>
    );
  }

  return (
    <div className="relative overflow-auto" style={{ width: '100%', height: `${dimensions.height}px` }}>

      
      <div className="relative" style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}>
        {/* Manejar diferentes estructuras de mapa.contenido */}
        {Array.isArray(mapa.contenido) ? (
          // Si mapa.contenido es un array
          [...mapa.contenido].sort((a, b) => {
            const ay = a?.posicion?.y ?? 0; const by = b?.posicion?.y ?? 0;
            if (ay !== by) return ay - by;
            const ax = a?.posicion?.x ?? 0; const bx = b?.posicion?.x ?? 0;
            return ax - bx;
          }).map(elemento => (
            <div key={elemento._id} className="absolute">
              {/* Fondo */}
              {elemento.type === 'background' && (
                <img
                  alt="background"
                  src={elemento.imageData || elemento.image?.data || elemento.src || ''}
                  className="absolute"
                  style={{
                    left: elemento.x || elemento.posicion?.x || 0,
                    top: elemento.y || elemento.posicion?.y || 0,
                    width: elemento.width || dimensions.width,
                    height: elemento.height || dimensions.height,
                    zIndex: 0,
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Mesa */}
              {elemento.type === 'mesa' && (() => {
                // Detectar si la mesa contiene sillas de la zona activa
                // NOTA: Los textos de las mesas ahora están perfectamente centrados usando transform: translate(-50%, -50%)
                const mesaTieneZonaActiva = Array.isArray(elemento.sillas) && elemento.sillas.some(s => {
                  const zid = String(s?.zona?.id || s?.zonaId || s?.zona || '');
                  return selectedZonaId && zid && String(selectedZonaId) === zid;
                });
                const zonaColorMesa = mesaTieneZonaActiva ? (elemento.sillas.find(s => String(s?.zona?.id || s?.zonaId || s?.zona || '') === String(selectedZonaId))?.zona?.color) : null;
                return (
                  <div
                    className={`absolute ${
                      elemento.shape === 'rect' ? 'rounded-lg' : 'rounded-full'
                    }`}
                    style={{
                      left:
                        elemento.shape === 'circle'
                          ? ((elemento.posicion?.x ?? elemento.x ?? 0) - (elemento.radius ?? (elemento.width ?? 0)) / 2)
                          : (elemento.posicion?.x ?? elemento.x ?? 0),
                      top:
                        elemento.shape === 'circle'
                          ? ((elemento.posicion?.y ?? elemento.y ?? 0) - (elemento.radius ?? (elemento.height ?? elemento.width ?? 0)) / 2)
                          : (elemento.posicion?.y ?? elemento.y ?? 0),
                      width: elemento.shape === 'circle' ? (elemento.radius ?? 30) * 2 : (elemento.width ?? 100),
                      height: elemento.shape === 'circle' ? (elemento.radius ?? 30) * 2 : (elemento.height ?? 60),
                      backgroundColor: elemento.fill || 'lightblue',
                      border: mesaTieneZonaActiva ? `2px solid ${zonaColorMesa || '#5C1473'}` : '2px solid #d1d5db',
                      boxShadow: mesaTieneZonaActiva ? `0 0 8px ${(zonaColorMesa || '#5C1473')}55` : 'none',
                      zIndex: 1
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
                          zIndex: 2
                        }}
                      >
                        {elemento.nombre}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Formas genéricas (rect/circle) que no son mesas */}
              {!elemento.type && elemento.shape === 'rect' && (
                <div
                  className="absolute border border-gray-300 rounded"
                  style={{
                    left: elemento.posicion?.x ?? elemento.x ?? 0,
                    top: elemento.posicion?.y ?? elemento.y ?? 0,
                    width: elemento.width ?? 100,
                    height: elemento.height ?? 60,
                    backgroundColor: elemento.fill || '#f0f0f0',
                    opacity: 0.8
                  }}
                />
              )}
              {!elemento.type && elemento.shape === 'circle' && (
                <div
                  className="absolute rounded-full border border-gray-300"
                  style={{
                    left: (elemento.posicion?.x ?? elemento.x ?? 0) - ((elemento.radius ?? elemento.width ?? 40) / 2),
                    top: (elemento.posicion?.y ?? elemento.y ?? 0) - ((elemento.radius ?? elemento.width ?? 40) / 2),
                    width: elemento.radius ? elemento.radius * 2 : (elemento.width ?? 40),
                    height: elemento.radius ? elemento.radius * 2 : (elemento.height ?? elemento.width ?? 40),
                    backgroundColor: elemento.fill || '#f0f0f0',
                    opacity: 0.8
                  }}
                />
              )}

              {/* Texto genérico */}
              {(elemento.type === 'Text' || elemento.text) && (
                <div
                  className="absolute text-xs text-gray-700"
                  style={{
                    left: elemento.posicion?.x ?? elemento.x ?? 0,
                    top: elemento.posicion?.y ?? elemento.y ?? 0
                  }}
                >
                  {elemento.text || elemento.nombre}
                </div>
              )}
              
              {/* Sillas anidadas dentro de elemento */}
              {(elemento.sillas || elemento.asientos || elemento.seats || []).map(silla => {
                const zoneInfo = getZoneInfo(silla);
                const isSelected = selectedSeats.some(s => s._id === silla._id);
                const isLockedByMe = lockedSeats.some(ls => 
                  ls.seat_id === silla._id && ls.session_id === (localStorage.getItem('anonSessionId') || '')
                );
                const sx = silla?.posicion?.x ?? silla?.x;
                const sy = silla?.posicion?.y ?? silla?.y;
                // Si hay una mesa circular padre, centrar los asientos correctamente
                // NOTA: Para mesas circulares, las coordenadas de las sillas son relativas al centro de la mesa
                const isCircleTable = elemento?.type === 'mesa' && elemento?.shape === 'circle';
                const chairDiameter = 20; // Diámetro del asiento (coincide con width/height)
                
                // Calcular posición relativa a la mesa si es circular
                let adjustedLeft, adjustedTop;
                // Para TODAS las mesas (circulares y rectangulares), usar coordenadas originales
                // Esto permite que las sillas se posicionen exactamente donde fueron diseñadas
                adjustedLeft = (sx || 0) - (chairDiameter / 2);
                adjustedTop = (sy || 0) - (chairDiameter / 2);
                
                console.log(`🔍 [Silla] Posición original: (${sx || 0}, ${sy || 0})`);
                console.log(`🔍 [Silla] Posición ajustada: (${adjustedLeft}, ${adjustedTop})`);
                console.log(`🔍 [Silla] Mesa tipo: ${isCircleTable ? 'Circular' : 'Rectangular'}`);
                
                const isOtherZone = selectedZonaId && String(selectedZonaId) !== String(silla?.zona?.id || silla?.zonaId || silla?.zona || '');
                const muted = isOtherZone && (silla.estado === 'disponible');
                const borderStyle = isSelected
                  ? '3px solid #000'
                  : isLockedByMe
                  ? '2px solid #f59e0b'
                  : (!isOtherZone && zoneInfo.color)
                  ? `2px solid ${zoneInfo.color}`
                  : '1px solid #666';
                const glowShadow = isSelected
                  ? '0 0 10px rgba(0,0,0,0.5)'
                  : (!isOtherZone && zoneInfo.color)
                  ? `0 0 8px ${zoneInfo.color}55`
                  : 'none';
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
                        left: adjustedLeft,
                        top: adjustedTop,
                        width: chairDiameter,
                        height: chairDiameter,
                        borderRadius: '50%',
                        backgroundColor: silla.fill || getSeatColor(silla),
                        border: borderStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: glowShadow,
                        opacity: muted ? 0.35 : 1,
                        zIndex: 2
                      }}
                      onClick={() => {
                        // Solo permitir click si NO está vendido o reservado
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
              {elemento.type === 'silla' && (() => {
                const silla = elemento;
                const zoneInfo = getZoneInfo(silla);
                const isSelected = selectedSeats.some(s => s._id === silla._id);
                const isLockedByMe = lockedSeats.some(ls => 
                  ls.seat_id === silla._id && ls.session_id === (localStorage.getItem('anonSessionId') || '')
                );
                const sx = silla?.posicion?.x ?? silla?.x;
                const sy = silla?.posicion?.y ?? silla?.y;
                const isOtherZoneTop = selectedZonaId && String(selectedZonaId) !== String(silla?.zona?.id || silla?.zonaId || silla?.zona || '');
                const mutedTop = isOtherZoneTop && (silla.estado === 'disponible');
                const borderStyleTop = isSelected
                  ? '3px solid #000'
                  : isLockedByMe
                  ? '2px solid #f59e0b'
                  : (!isOtherZoneTop && zoneInfo.color)
                  ? `2px solid ${zoneInfo.color}`
                  : '1px solid #666';
                const glowShadowTop = isSelected
                  ? '0 0 10px rgba(0,0,0,0.5)'
                  : (!isOtherZoneTop && zoneInfo.color)
                  ? `0 0 8px ${zoneInfo.color}55`
                  : 'none';
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
                        left: (sx || 0) - (silla.radius || 15),
                        top: (sy || 0) - (silla.radius || 15),
                        width: (silla.radius || 15) * 2,
                        height: (silla.radius || 15) * 2,
                        borderRadius: '50%',
                        backgroundColor: silla.fill || getSeatColor(silla),
                        border: borderStyleTop,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: glowShadowTop,
                        opacity: mutedTop ? 0.35 : 1,
                        zIndex: 2
                      }}
                      onClick={() => {
                        // Solo permitir click si NO está vendido o reservado
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
              {zona.asientos && zona.asientos.map(silla => {
                const zoneInfo = getZoneInfo(silla);
                const isSelected = selectedSeats.some(s => s._id === silla._id);
                const isLockedByMe = lockedSeats.some(ls => 
                  ls.seat_id === silla._id && ls.session_id === (localStorage.getItem('anonSessionId') || '')
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
                        border: isSelected ? '3px solid #000' : isLockedByMe ? '2px solid #f59e0b' : '1px solid #666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none'
                      }}
                      onClick={() => {
                        // Solo permitir click si NO está vendido o reservado
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
          <div className="text-center text-gray-500 mt-8">
            Estructura de mapa no reconocida
          </div>
        )}
      </div>
      
      {/* Leyenda movida a botón informativo en BoleteriaMain */}
    </div>
  );
};

export default SimpleSeatingMap; 