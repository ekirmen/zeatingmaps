import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Spin, message, Tooltip, Typography } from 'antd';
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
  selectedPriceOption = null // Nuevo prop para el precio seleccionado
}) => {
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [zonePrices, setZonePrices] = useState({});
  const channelRef = useRef(null);

  // Cargar mapa directamente
  const loadMapa = async () => {
    const salaId = selectedFuncion?.sala?.id || selectedFuncion?.sala_id;
    if (!salaId) {
      console.log('No hay sala seleccionada (falta sala_id o sala.id)');
      setMapa(null);
      return;
    }

    console.log('Cargando mapa para sala:', salaId);
    setLoading(true);
    setError(null);

    try {
      // Cargar mapa de la sala
      const { data: mapaData, error: mapaError } = await supabase
        .from('mapas')
        .select('*')
        .eq('sala_id', salaId)
        .single();

      console.log('Mapa encontrado:', mapaData);

      if (mapaError || !mapaData) {
        console.log('No hay mapa configurado para esta sala');
        setError('No hay mapa configurado para esta sala. Contacta al administrador.');
        return;
      }

      setMapa(mapaData);
    } catch (error) {
      console.error('Error loading mapa:', error);
      setError('Error al cargar el mapa');
    } finally {
      setLoading(false);
    }
  };

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

  // Cargar asientos bloqueados
  const loadLockedSeats = async () => {
    if (!selectedFuncion?.id) return;

    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('seat_id, session_id, locked_at, status, expires_at')
        .eq('funcion_id', selectedFuncion.id);

      if (error) throw error;

      console.log('Asientos bloqueados cargados:', data);
      setLockedSeats(data || []);
    } catch (error) {
      console.error('Error loading locked seats:', error);
    }
  };

  // Suscribirse a cambios en tiempo real
  const subscribeToRealtime = () => {
    if (!selectedFuncion?.id) return;

    const channel = supabase
      .channel(`seat-locks-${selectedFuncion.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seat_locks',
        filter: `funcion_id=eq.${selectedFuncion.id}`
      }, (payload) => {
        console.log('Cambio en tiempo real:', payload);
        
        if (payload.eventType === 'INSERT') {
          setLockedSeats(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'DELETE') {
          setLockedSeats(prev => prev.filter(seat => seat.seat_id !== payload.old.seat_id));
        } else if (payload.eventType === 'UPDATE') {
          setLockedSeats(prev => 
            prev.map(seat => 
              seat.seat_id === payload.new.seat_id ? payload.new : seat
            )
          );
        }
      })
      .subscribe();

    channelRef.current = channel;
  };

  useEffect(() => {
    loadMapa();
    loadZonePrices();
    loadLockedSeats();
    subscribeToRealtime();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [selectedFuncion]);

  useEffect(() => {
    loadZonePrices();
  }, [selectedPlantilla]);

  const getSeatColor = (seat) => {
    // Si está en modo bloqueo y está seleccionado para bloquear
    if (blockMode && blockedSeats.some(s => s._id === seat._id)) {
      return '#ff4d4f'; // Rojo para asientos seleccionados en modo bloqueo
    }
    
    // Si está seleccionado por el usuario actual (modo normal)
    if (selectedSeats.some(s => s._id === seat._id)) {
      return '#52c41a'; // Verde para seleccionado
    }
    
    // Si está bloqueado por otro usuario
    const sessionId = localStorage.getItem('anonSessionId');
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
    
    // Si está vendido o reservado
    if (seat.estado === 'pagado' || seat.estado === 'reservado') {
      return '#d9d9d9'; // Gris para vendido
    }
    
    // Color por defecto basado en la zona
    const zoneInfo = getZoneInfo(seat);
    return zoneInfo.color || '#f0f0f0';
  };

  const getZoneInfo = (seat) => {
    const zonaId = seat.zona || seat.zonaId;
    if (!zonaId) return { nombre: 'Sin zona', precio: 0, color: '#f0f0f0' };
    
    const zonePrice = zonePrices[zonaId];
    if (zonePrice) {
      return {
        nombre: zonePrice.nombre,
        precio: zonePrice.precio,
        color: zonePrice.color || '#5C1473'
      };
    }
    
    return { nombre: `Zona ${zonaId}`, precio: 0, color: '#f0f0f0' };
  };

  const handleSeatClick = async (seat, mesa = null) => {
    try {
      // En modo bloqueo, delegar al padre sin exigir precio ni bloquear en BD
      if (blockMode) {
        onSeatClick(seat, mesa);
        return;
      }

      // Verificar si hay un precio seleccionado
      if (!selectedPriceOption) {
        message.warning('Primero selecciona una zona y precio antes de elegir asientos');
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

      // Generar session ID
      const sessionId = localStorage.getItem('anonSessionId') || crypto.randomUUID();
      if (!localStorage.getItem('anonSessionId')) {
        localStorage.setItem('anonSessionId', sessionId);
      }

      // Verificar si está bloqueado por otro usuario
      const isLockedByOther = lockedSeats.some(ls => 
        ls.seat_id === seat._id && ls.status === 'locked' && ls.session_id !== sessionId
      );
      
      if (isLockedByOther) {
        message.warning('Este asiento está bloqueado por otro usuario');
        return;
      }

      // Verificar si ya está seleccionado por el usuario actual
      const isAlreadySelected = selectedSeats.some(s => s._id === seat._id);
      const isLockedByMe = lockedSeats.some(ls => 
        ls.seat_id === seat._id && ls.session_id === sessionId
      );

      if (isAlreadySelected || isLockedByMe) {
        // Desbloquear el asiento
        const { error: unlockError } = await supabase
          .from('seat_locks')
          .delete()
          .eq('seat_id', seat._id)
          .eq('funcion_id', parseInt(selectedFuncion.id))
          .eq('session_id', sessionId)
          .eq('lock_type', 'seat');

        if (unlockError) {
          console.error('Error al desbloquear asiento:', unlockError);
          message.error('Error al deseleccionar el asiento');
          return;
        }

        message.success('Asiento deseleccionado');
        return;
      }

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

      console.log('Intentando bloquear asiento con datos:', lockData);

      const { error: lockError } = await supabase
        .from('seat_locks')
        .upsert(lockData);

      if (lockError) {
        console.error('Error al bloquear asiento:', lockError);
        console.error('Datos enviados:', lockData);
        message.error('Error al seleccionar el asiento');
        return;
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
      message.success(`Asiento seleccionado - ${selectedPriceOption.entrada.nombre} - $${selectedPriceOption.precio.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error al manejar selección de asiento:', error);
      message.error('Error al seleccionar el asiento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={loadMapa}>Reintentar</Button>
      </Card>
    );
  }

  if (!mapa || !mapa.contenido) {
    return (
      <Card className="text-center">
        <div className="text-gray-500">No hay mapa configurado</div>
      </Card>
    );
  }

  return (
    <div className="relative overflow-auto" style={{ width: '100%', height: '400px' }}>

      
      <div className="relative" style={{ width: '600px', height: '350px' }}>
        {/* Manejar diferentes estructuras de mapa.contenido */}
        {Array.isArray(mapa.contenido) ? (
          // Si mapa.contenido es un array
          mapa.contenido.map(elemento => (
            <div key={elemento._id} className="absolute">
              {/* Mesa */}
              {elemento.type === 'mesa' && (
                <div
                  className={`absolute border-2 border-gray-300 ${
                    elemento.shape === 'rect' ? 'rounded-lg' : 'rounded-full'
                  }`}
                  style={{
                    left: elemento.posicion.x,
                    top: elemento.posicion.y,
                    width: elemento.width,
                    height: elemento.height,
                    backgroundColor: 'lightblue'
                  }}
                >
                  <div className="text-center text-sm font-medium mt-1">
                    {elemento.nombre}
                  </div>
                </div>
              )}
              
              {/* Sillas */}
              {elemento.sillas && elemento.sillas.map(silla => {
                const zoneInfo = getZoneInfo(silla);
                const isSelected = selectedSeats.some(s => s._id === silla._id);
                const isLockedByMe = lockedSeats.some(ls => 
                  ls.seat_id === silla._id && ls.session_id === (localStorage.getItem('anonSessionId') || '')
                );
                
                return (
                  <Tooltip
                    key={silla._id}
                    title={`${silla.nombre || silla.numero} - ${zoneInfo.nombre} - $${zoneInfo.precio}`}
                    placement="top"
                  >
                    <div
                      className="absolute cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: silla.posicion.x - 15,
                        top: silla.posicion.y - 15,
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
                      onClick={() => handleSeatClick(silla, elemento)}
                    >
                      {silla.nombre || silla.numero}
                    </div>
                  </Tooltip>
                );
              })}
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
                
                return (
                  <Tooltip
                    key={silla._id}
                    title={`${silla.nombre || silla.numero} - ${zoneInfo.nombre} - $${zoneInfo.precio}`}
                    placement="top"
                  >
                    <div
                      className="absolute cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: silla.x - 15,
                        top: silla.y - 15,
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
                      onClick={() => handleSeatClick(silla)}
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
      
      {/* Leyenda mejorada con zonas */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow max-w-xs">
        <div className="text-xs space-y-2">
          <div className="font-semibold mb-2">Estado de Asientos</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Bloqueado por mí</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Bloqueado por otro</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Vendido/Reservado</span>
          </div>
          
          {/* Información de zonas */}
          {Object.keys(zonePrices).length > 0 && (
            <>
              <div className="font-semibold mt-3 mb-2">Zonas y Precios</div>
              {Object.entries(zonePrices).map(([zonaId, info]) => (
                <div key={zonaId} className="flex items-center justify-between">
                  <span className="text-xs">{info.nombre}</span>
                  <span className="text-xs font-bold">${info.precio}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleSeatingMap; 