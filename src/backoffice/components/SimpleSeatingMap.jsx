import React from 'react';

const SimpleSeatingMap = ({ 
  onSeatClick, 
  selectedSeats = [], 
  availableSeats = [],
  blockMode = false,
  blockedSeats = [] // Nuevo prop para asientos bloqueados
}) => {
  const generateSeats = () => {
    const seats = [];
    const rows = 6;
    const cols = 8;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seatNumber = row * cols + col + 1;
        const seatId = `seat-${seatNumber}`;
        
        seats.push({
          id: seatId,
          number: seatNumber,
          row: row + 1,
          col: col + 1,
          isAvailable: !blockedSeats.includes(seatId),
          isSelected: selectedSeats.includes(seatId),
          isBlocked: blockedSeats.includes(seatId)
        });
      }
    }
    
    return seats;
  };

  const seats = generateSeats();

  const getSeatColor = (seat) => {
    if (seat.isBlocked) {
      return 'bg-red-500 text-white cursor-not-allowed';
    }
    if (seat.isSelected) {
      return blockMode ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';
    }
    if (!seat.isAvailable) {
      return 'bg-gray-400 text-gray-600 cursor-not-allowed';
    }
    return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  };

  const handleSeatClick = (seat) => {
    if (seat.isBlocked || !seat.isAvailable) {
      return;
    }
    onSeatClick(seat);
  };

  return (
    <div className="p-6">
      {/* Stage */}
      <div className="mb-6 text-center">
        <div className="bg-gray-800 text-white py-4 rounded-lg">
          <h3 className="text-lg font-semibold">ESCENARIO</h3>
        </div>
      </div>

      {/* Seating Grid */}
      <div className="grid grid-cols-8 gap-2 max-w-2xl mx-auto">
        {seats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => handleSeatClick(seat)}
            disabled={seat.isBlocked || !seat.isAvailable}
            className={`
              w-12 h-12 rounded-lg font-medium text-sm transition-colors duration-200
              ${getSeatColor(seat)}
              ${blockMode && seat.isSelected ? 'ring-2 ring-red-400 ring-offset-2' : ''}
            `}
            title={`Asiento ${seat.number}${seat.isBlocked ? ' - BLOQUEADO' : ''}`}
          >
            {seat.number}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Bloqueado</span>
        </div>
        {blockMode && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded ring-2 ring-red-400 ring-offset-1"></div>
            <span>Para bloquear</span>
          </div>
        )}
      </div>

      {/* Block Mode Indicator */}
      {blockMode && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            <span className="text-lg">🔒</span>
            <span className="font-medium">Modo Bloqueo Activo</span>
            <span className="text-sm">Selecciona asientos para bloquearlos</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleSeatingMap; 
