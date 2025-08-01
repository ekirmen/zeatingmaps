import React from 'react';
import { Card, Button, Badge } from 'antd';

const SimpleSeatingMap = ({ 
  selectedFuncion, 
  onSeatClick, 
  selectedSeats = [], 
  blockedSeats = [],
  blockMode = false 
}) => {
  // Generar asientos de ejemplo
  const generateSeats = () => {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    rows.forEach((row, rowIndex) => {
      cols.forEach((col, colIndex) => {
        const seatId = `${row}${col}`;
        const isSelected = selectedSeats.some(s => s._id === seatId);
        const isBlocked = blockedSeats.some(s => s._id === seatId);
        
        seats.push({
          _id: seatId,
          nombre: seatId,
          row,
          col,
          precio: Math.floor(Math.random() * 50) + 20,
          zona: rowIndex < 3 ? 'VIP' : 'Regular',
          estado: isBlocked ? 'blocked' : isSelected ? 'selected' : 'available'
        });
      });
    });
    
    return seats;
  };

  const seats = generateSeats();

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
        
        <div className="grid grid-cols-10 gap-1 max-w-4xl mx-auto">
          {seats.map((seat) => (
            <Button
              key={seat._id}
              size="small"
              className={`w-8 h-8 p-0 text-xs font-medium ${getSeatColor(seat)}`}
              onClick={() => handleSeatClick(seat)}
              disabled={seat.estado === 'blocked'}
            >
              {seat.nombre}
            </Button>
          ))}
        </div>

        {/* Información de zonas */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card size="small" title="Zona VIP" className="text-center">
            <div className="text-2xl font-bold text-purple-600">$50-70</div>
            <div className="text-xs text-gray-500">Filas A-C</div>
          </Card>
          <Card size="small" title="Zona Regular" className="text-center">
            <div className="text-2xl font-bold text-blue-600">$20-40</div>
            <div className="text-xs text-gray-500">Filas D-F</div>
          </Card>
        </div>
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