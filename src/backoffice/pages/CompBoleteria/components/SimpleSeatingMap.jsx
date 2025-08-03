import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spin } from 'antd';
import { supabase } from '../../../../supabaseClient';

const SimpleSeatingMap = ({ 
  selectedFuncion, 
  onSeatClick, 
  selectedSeats = [], 
  blockedSeats = [],
  blockMode = false 
}) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar asientos reales desde la base de datos
  const loadSeats = async () => {
    if (!selectedFuncion?.sala?.id) {
      console.log('No hay sala seleccionada');
      setSeats([]);
      return;
    }

    console.log('Cargando asientos para función:', selectedFuncion.id, 'sala:', selectedFuncion.sala.id);
    setLoading(true);
    setError(null);

    try {
      // Cargar asientos de la función
      let { data: seatsData, error: seatsError } = await supabase
        .from('seats')
        .select('*')
        .eq('funcion_id', selectedFuncion.id)
        .order('fila', { ascending: true })
        .order('numero', { ascending: true });

      console.log('Asientos encontrados:', seatsData?.length || 0);

      if (seatsError) {
        console.error('Error loading seats:', seatsError);
        setError(seatsError.message);
        return;
      }

      // Si no hay asientos, intentar sincronizar desde el mapa
      if (!seatsData || seatsData.length === 0) {
        console.log('No hay asientos configurados, intentando sincronizar...');
        try {
          // Primero verificar si existe un mapa para la sala
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

          // Importar la función de sincronización
          const { syncSeatsForSala } = await import('../../../services/apibackoffice');
          await syncSeatsForSala(selectedFuncion.sala.id);
          
          // Intentar cargar de nuevo
          const { data: newSeatsData, error: newSeatsError } = await supabase
            .from('seats')
            .select('*')
            .eq('funcion_id', selectedFuncion.id)
            .order('fila', { ascending: true })
            .order('numero', { ascending: true });

          console.log('Asientos después de sincronización:', newSeatsData?.length || 0);

          if (newSeatsError) {
            console.error('Error loading seats after sync:', newSeatsError);
            setError('Error al sincronizar asientos');
            return;
          }

          if (newSeatsData && newSeatsData.length > 0) {
            seatsData = newSeatsData;
          } else {
            console.log('No se encontraron asientos después de la sincronización');
            setError('No se pudieron sincronizar los asientos. Verifica que el mapa esté configurado correctamente.');
            return;
          }
        } catch (syncError) {
          console.error('Error en sincronización:', syncError);
          setError('Error al sincronizar asientos');
          return;
        }
      }

      // Los asientos bloqueados están en la misma tabla con el campo 'bloqueado'
      const blockedSeatsData = seatsData?.filter(seat => seat.bloqueado) || [];

      // Mapear los asientos con su estado
      const mappedSeats = (seatsData || []).map(seat => {
        const isSelected = selectedSeats.some(s => s._id === seat._id);
        const isBlocked = seat.bloqueado || seat.status === 'bloqueado';
        
        return {
          id: seat._id,
          _id: seat._id,
          nombre: `${seat.fila}${seat.numero}`,
          fila: seat.fila || 'A',
          columna: parseInt(seat.numero) || 0,
          precio: seat.price || 0,
          zona: seat.zona || 'General',
          estado: isBlocked ? 'blocked' : isSelected ? 'selected' : seat.status || 'available',
          tipo: 'silla'
        };
      });

      console.log('Asientos mapeados:', mappedSeats.length);
      setSeats(mappedSeats);
    } catch (error) {
      console.error('Error loading seats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeats();
  }, [selectedFuncion?.sala?.id, selectedFuncion?.id]);

  const getSeatColor = (seat) => {
    switch (seat.estado) {
      case 'selected':
        return 'bg-blue-600 text-white shadow-lg transform scale-105';
      case 'blocked':
        return 'bg-gray-400 text-white cursor-not-allowed opacity-60';
      case 'available':
        return 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200';
      default:
        return 'bg-white border-2 border-gray-300 text-gray-700';
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.estado === 'blocked') return;
    onSeatClick(seat);
  };

  if (!selectedFuncion) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium mb-2">Mapa de Asientos</p>
          <p className="text-sm text-gray-400">Selecciona una función para ver los asientos disponibles</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-500 mt-4">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Error al cargar el mapa</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leyenda mejorada */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Estado de Asientos</h4>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded opacity-60"></div>
            <span className="text-gray-600">Ocupado</span>
          </div>
        </div>
      </div>

      {/* Mapa de asientos mejorado */}
      <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Escenario</h3>
          <div className="w-32 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
        </div>
        
        {seats.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No hay asientos configurados</p>
            <p className="text-sm text-gray-400 mt-1">Contacta al administrador para configurar el mapa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Agrupar asientos por fila */}
            {(() => {
              const rows = {};
              seats.forEach(seat => {
                if (!rows[seat.fila]) {
                  rows[seat.fila] = [];
                }
                rows[seat.fila].push(seat);
              });

              return Object.keys(rows).sort().map(fila => (
                <div key={fila} className="flex justify-center items-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center text-sm font-bold text-gray-500 bg-gray-100 rounded-lg">
                    {fila}
                  </div>
                  <div className="flex gap-1">
                    {rows[fila].sort((a, b) => a.columna - b.columna).map((seat) => (
                      <Button
                        key={seat.id}
                        size="small"
                        className={`w-10 h-10 p-0 text-xs font-semibold rounded-lg ${getSeatColor(seat)}`}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.estado === 'blocked'}
                        title={`${seat.nombre} - $${seat.precio.toFixed(2)} - ${seat.zona}`}
                      >
                        {seat.columna}
                      </Button>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Información de zonas mejorada */}
        {(() => {
          const zonas = {};
          seats.forEach(seat => {
            if (!zonas[seat.zona]) {
              zonas[seat.zona] = { min: seat.precio, max: seat.precio, count: 0 };
            }
            zonas[seat.zona].min = Math.min(zonas[seat.zona].min, seat.precio);
            zonas[seat.zona].max = Math.max(zonas[seat.zona].max, seat.precio);
            zonas[seat.zona].count++;
          });

          return (
            <div className="mt-8 grid grid-cols-2 gap-4">
              {Object.keys(zonas).map(zona => (
                <Card key={zona} size="small" className="text-center border-0 shadow-sm">
                  <div className="text-lg font-bold text-blue-600">
                    ${zonas[zona].min.toFixed(2)}
                    {zonas[zona].min !== zonas[zona].max && ` - $${zonas[zona].max.toFixed(2)}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {zonas[zona].count} asientos en {zona}
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Controles mejorados */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{selectedSeats.length}</span> asiento{selectedSeats.length !== 1 ? 's' : ''} seleccionado{selectedSeats.length !== 1 ? 's' : ''}
        </div>
        {blockMode && (
          <Badge count={selectedSeats.length} showZero={false}>
            <Button type="primary" danger size="small">
              Aplicar Bloqueos
            </Button>
          </Badge>
        )}
      </div>
    </div>
  );
};

export default SimpleSeatingMap; 