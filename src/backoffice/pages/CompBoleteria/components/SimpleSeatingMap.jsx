import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Spin, message, Tooltip } from 'antd';
import { supabase } from '../../../../supabaseClient';

const SimpleSeatingMap = ({ 
  selectedFuncion, 
  onSeatClick, 
  selectedSeats = [], 
  blockedSeats = [],
  blockMode = false,
  zonas = [], // Agregar prop para zonas
  selectedPlantilla = null // Agregar prop para plantilla de precios
}) => {
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [zonePrices, setZonePrices] = useState({});
  const channelRef = useRef(null);

  // Cargar mapa directamente
  const loadMapa = async () => {
    if (!selectedFuncion?.sala?.id) {
      console.log('No hay sala seleccionada');
      setMapa(null);
      return;
    }

    console.log('Cargando mapa para sala:', selectedFuncion.sala.id);
    setLoading(true);
    setError(null);

    try {
      // Cargar mapa de la sala
      const { data: mapaData, error: mapaError } = await supabase
        .from('mapas')
        .select('*')
        .eq('sala_id', selectedFuncion.sala.id)
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

      const now = new Date();
      const validSeats = data.filter(item => {
        if (!item.expires_at) return false;
        return new Date(item.expires_at) > now;
      });

      console.log('[BOLETERIA] Asientos bloqueados cargados:', validSeats);
      setLockedSeats(validSeats);
    } catch (e) {
      console.error('[BOLETERIA] Error al obtener asientos bloqueados:', e);
      setLockedSeats([]);
    }
  };

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!selectedFuncion?.id) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Cargar asientos bloqueados inicialmente
    loadLockedSeats();

    // Configurar suscripción en tiempo real
    const channelName = `boleteria-seat-locks-${selectedFuncion.id}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'seat_locks',
        filter: `funcion_id=eq.${selectedFuncion.id}`
      },
      (payload) => {
        console.log('✅ [BOLETERIA] Suscrito a canal', channelName);
        console.log('[BOLETERIA] Evento realtime recibido:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setLockedSeats(prev => {
            const filtered = prev.filter(s => s.seat_id !== payload.new.seat_id);
            return [...filtered, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setLockedSeats(prev => prev.filter(s => s.seat_id !== payload.old.seat_id));
        }
      }
    ).subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedFuncion?.id]);

  // Cargar mapa cuando cambie la función
  useEffect(() => {
    loadMapa();
  }, [selectedFuncion?.sala?.id]);

  // Cargar precios cuando cambie la plantilla
  useEffect(() => {
    loadZonePrices();
  }, [selectedPlantilla]);

  const getSeatColor = (seat) => {
    // Verificar si está bloqueado por otro usuario
    const isLockedByOther = lockedSeats.some(ls => 
      ls.seat_id === seat._id && ls.status === 'locked'
    );
    
    // Verificar si está seleccionado
    const isSelected = selectedSeats.some(s => s._id === seat._id);
    
    // Verificar si está bloqueado manualmente
    const isBlocked = blockedSeats.includes(seat._id);
    
    if (isSelected) return '#facc15'; // Amarillo para seleccionado
    if (isLockedByOther) return '#ef4444'; // Rojo para bloqueado por otro
    if (isBlocked) return '#9ca3af'; // Gris para bloqueado manual
    if (seat.estado === 'pagado') return '#9ca3af'; // Gris para pagado
    if (seat.estado === 'reservado') return '#ef4444'; // Rojo para reservado
    if (seat.estado === 'bloqueado') return '#dc2626'; // Rojo para bloqueado
    
    // Color por zona
    const zonaId = seat.zona;
    if (zonePrices[zonaId]) {
      // Usar color basado en el precio de la zona
      const precio = zonePrices[zonaId].precio;
      if (precio > 100) return '#dc2626'; // Rojo para precios altos
      if (precio > 50) return '#f59e0b'; // Naranja para precios medios
      return '#10b981'; // Verde para precios bajos
    }
    
    return '#60a5fa'; // Azul por defecto
  };

  const getZoneInfo = (seat) => {
    const zonaId = seat.zona;
    if (zonePrices[zonaId]) {
      return {
        nombre: zonePrices[zonaId].nombre,
        precio: zonePrices[zonaId].precio
      };
    }
    return { nombre: `Zona ${zonaId}`, precio: 0 };
  };

  const handleSeatClick = async (seat, mesa = null) => {
    try {
      // Verificar si el asiento está disponible
      if (seat.estado === 'pagado' || seat.estado === 'reservado') {
        message.warning('Este asiento ya está vendido o reservado');
        return;
      }

      // Verificar si está bloqueado por otro usuario
      const isLockedByOther = lockedSeats.some(ls => 
        ls.seat_id === seat._id && ls.status === 'locked'
      );
      
      if (isLockedByOther) {
        message.warning('Este asiento está bloqueado por otro usuario');
        return;
      }

      // Generar session ID
      const sessionId = localStorage.getItem('anonSessionId') || crypto.randomUUID();
      if (!localStorage.getItem('anonSessionId')) {
        localStorage.setItem('anonSessionId', sessionId);
      }

      // Bloquear asiento en la base de datos
      const { error: lockError } = await supabase
        .from('seat_locks')
        .upsert({
          seat_id: seat._id,
          funcion_id: selectedFuncion.id,
          session_id: sessionId,
          locked_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
          status: 'locked'
        });

      if (lockError) {
        console.error('Error al bloquear asiento:', lockError);
        message.error('Error al seleccionar el asiento');
        return;
      }

      const seatWithMesa = {
        ...seat,
        mesa: mesa,
        funcion_id: selectedFuncion?.id
      };
      
      onSeatClick(seatWithMesa);
      message.success('Asiento seleccionado');
      
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
    <div className="relative overflow-auto" style={{ width: '100%', height: '600px' }}>
      <div className="relative" style={{ width: '800px', height: '500px' }}>
        {mapa.contenido.map(elemento => (
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
              return (
                <Tooltip
                  key={silla._id}
                  title={`${silla.nombre || silla.numero} - ${zoneInfo.nombre} - $${zoneInfo.precio}`}
                  placement="top"
                >
                  <div
                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: silla.posicion.x - 10,
                      top: silla.posicion.y - 10,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: getSeatColor(silla),
                      border: selectedSeats.some(s => s._id === silla._id) ? '2px solid #000' : '1px solid #666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                    onClick={() => handleSeatClick(silla, elemento)}
                  >
                    {silla.nombre || silla.numero}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ))}
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