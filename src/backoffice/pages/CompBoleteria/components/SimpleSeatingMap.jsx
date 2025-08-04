import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Spin, message } from 'antd';
import { supabase } from '../../../../supabaseClient';

const SimpleSeatingMap = ({ 
  selectedFuncion, 
  onSeatClick, 
  selectedSeats = [], 
  blockedSeats = [],
  blockMode = false 
}) => {
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lockedSeats, setLockedSeats] = useState([]);
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
        filter: `funcion_id=eq.${selectedFuncion.id}`,
      },
      (payload) => {
        console.log('[BOLETERIA] Cambio en seat_locks:', payload);
        
        setLockedSeats(currentSeats => {
          let updatedSeats = [...currentSeats];
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const idx = updatedSeats.findIndex(s => s.seat_id === payload.new.seat_id);
            if (idx > -1) {
              updatedSeats[idx] = payload.new;
            } else {
              updatedSeats.push(payload.new);
            }
          } else if (payload.eventType === 'DELETE') {
            updatedSeats = updatedSeats.filter(s => s.seat_id !== payload.old.seat_id);
          }

          return updatedSeats;
        });
      }
    ).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [BOLETERIA] Suscrito a canal ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('⚠️ [BOLETERIA] Error en el canal, intentando reconectar...');
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log(`🧹 [BOLETERIA] Canal ${channelName} eliminado`);
      }
    };
  }, [selectedFuncion?.id]);

  useEffect(() => {
    loadMapa();
  }, [selectedFuncion?.sala?.id]);

  const getSeatColor = (seat) => {
    // Verificar si el asiento está bloqueado por otro usuario
    const isLockedByOther = lockedSeats.some(lock => 
      lock.seat_id === seat._id && lock.session_id !== sessionStorage.getItem('sessionId')
    );
    
    if (isLockedByOther) return '#FF6B6B'; // Rojo para bloqueado por otro
    
    // Verificar si el asiento está seleccionado
    const isSelected = selectedSeats.some(s => s._id === seat._id);
    if (isSelected) return '#4CAF50'; // Verde para seleccionados
    
    // Verificar si el asiento está bloqueado por este usuario
    const isLockedByMe = lockedSeats.some(lock => 
      lock.seat_id === seat._id && lock.session_id === sessionStorage.getItem('sessionId')
    );
    if (isLockedByMe) return '#FFA726'; // Naranja para bloqueado por mí
    
    // Verificar si el asiento está bloqueado manualmente
    const isBlocked = blockedSeats.some(s => s._id === seat._id);
    if (isBlocked) return '#A9A9A9'; // Gris para bloqueados
    
    // Color por defecto según zona
    return seat.color || '#3498db';
  };

  const handleSeatClick = async (seat, mesa = null) => {
    if (!selectedFuncion?.id) {
      message.warning('Selecciona una función primero');
      return;
    }

    // Verificar si el asiento está bloqueado por otro usuario
    const isLockedByOther = lockedSeats.some(lock => 
      lock.seat_id === seat._id && lock.session_id !== sessionStorage.getItem('sessionId')
    );
    
    if (isLockedByOther) {
      message.warning('Este asiento está siendo seleccionado por otro usuario');
      return;
    }

    try {
      // Generar sessionId si no existe
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', sessionId);
      }

      // Bloquear el asiento
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
            {elemento.sillas && elemento.sillas.map(silla => (
              <div
                key={silla._id}
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
                title={`Asiento ${silla.nombre || silla.numero} - Zona ${silla.zona}`}
              >
                {silla.nombre || silla.numero}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Leyenda mejorada */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow">
        <div className="text-xs space-y-2">
          <div className="font-semibold mb-2">Estado de Asientos</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
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
            <span>Bloqueado manual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSeatingMap; 