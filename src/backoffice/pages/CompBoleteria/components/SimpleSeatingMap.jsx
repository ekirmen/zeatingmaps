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
      setSeats([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
             // Cargar asientos de la función
       const { data: seatsData, error: seatsError } = await supabase
         .from('seats')
         .select('*')
         .eq('funcion_id', selectedFuncion.id)
         .order('_id', { ascending: true });

      if (seatsError) {
        console.error('Error loading seats:', seatsError);
        setError(seatsError.message);
        return;
      }

             // Los asientos bloqueados están en la misma tabla con el campo 'bloqueado'
       const blockedSeatsData = seatsData?.filter(seat => seat.bloqueado) || [];

             // Mapear los asientos con su estado
       const mappedSeats = (seatsData || []).map(seat => {
         const isSelected = selectedSeats.some(s => s._id === seat._id);
         const isBlocked = seat.bloqueado || seat.status === 'bloqueado';
         
         // Extraer información de fila y columna del _id (asumiendo formato como "A1", "B2", etc.)
         const seatId = seat._id;
         const fila = seatId.charAt(0);
         const columna = parseInt(seatId.substring(1)) || 0;
         
         return {
           id: seat.id,
           _id: seat._id,
           nombre: seatId,
           fila: fila,
           columna: columna,
           precio: 0, // Los precios se manejan por zonas
           zona: seat.zona || 'General',
           estado: isBlocked ? 'blocked' : isSelected ? 'selected' : seat.status || 'available',
           tipo: 'silla'
         };
       });

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
        return 'bg-purple-500 text-white';
      case 'blocked':
        return 'bg-red-500 text-white';
      case 'available':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.estado === 'blocked') return;
    onSeatClick(seat);
  };

  if (!selectedFuncion) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Mapa de asientos</p>
          <p className="text-sm text-gray-400">Selecciona una función primero</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-500 mt-4">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error al cargar el mapa</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Bloqueado</span>
        </div>
      </div>

      {/* Mapa de asientos */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Escenario</h3>
        </div>
        
        {seats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay asientos configurados para esta sala</p>
          </div>
        ) : (
          <div className="space-y-2">
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
                <div key={fila} className="flex justify-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-600">
                    {fila}
                  </div>
                  {rows[fila].sort((a, b) => a.columna - b.columna).map((seat) => (
                    <Button
                      key={seat.id}
                      size="small"
                      className={`w-8 h-8 p-0 text-xs font-medium ${getSeatColor(seat)}`}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.estado === 'blocked'}
                      title={`${seat.nombre} - $${seat.precio} - ${seat.zona}`}
                    >
                      {seat.columna}
                    </Button>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {/* Información de zonas */}
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
            <div className="mt-6 grid grid-cols-2 gap-4">
              {Object.keys(zonas).map(zona => (
                <Card key={zona} size="small" title={`Zona ${zona}`} className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${zonas[zona].min}-{zonas[zona].max}
                  </div>
                  <div className="text-xs text-gray-500">
                    {zonas[zona].count} asientos
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedSeats.length} asiento{selectedSeats.length !== 1 ? 's' : ''} seleccionado{selectedSeats.length !== 1 ? 's' : ''}
        </div>
        {blockMode && (
          <Badge count={selectedSeats.length} showZero={false}>
            <Button type="primary" danger>
              Aplicar Bloqueos
            </Button>
          </Badge>
        )}
      </div>
    </div>
  );
};

export default SimpleSeatingMap; 