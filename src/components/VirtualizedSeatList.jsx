import React from 'react';
import { Badge, Button } from '../utils/antdComponents';
import VirtualizedList from './VirtualizedList';
import { SeatListSkeleton } from './SkeletonLoaders';

/**
 * Lista virtualizada de asientos para mejor performance con muchos asientos
 */
const VirtualizedSeatList = ({
  seats = [],
  selectedSeats = [],
  onSeatToggle,
  getSeatStatus,
  loading = false,
  height = 600,
  className = ''
}) => {
  const renderSeat = (seat, index, setItemSize) => {
    const seatRef = React.useRef(null);
    const seatId = seat._id || seat.id || seat.sillaId;
    const isSelected = selectedSeats.includes(seatId);
    const seatStatus = getSeatStatus ? getSeatStatus(seat) : { status: 'available', text: 'Disponible', color: 'processing' };
    const precio = seat.precio || 0;
    const nombreZona = seat.nombreZona || seat.zona?.nombre || 'General';
    const nombreAsiento = seat.nombre || seat.numero || `Asiento ${seatId}`;

    React.useEffect(() => {
      if (seatRef.current && setItemSize) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setItemSize(index, entry.contentRect.height);
          }
        });
        
        resizeObserver.observe(seatRef.current);
        return () => resizeObserver.disconnect();
      }
    }, [index, setItemSize]);

    return (
      <div ref={seatRef} className="p-2">
        <div
          className={`p-3 border rounded cursor-pointer transition-all ${
            isSelected 
              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          } ${
            seatStatus.status === 'locked' || seatStatus.status === 'sold'
              ? 'opacity-60 cursor-not-allowed'
              : ''
          }`}
          onClick={() => onSeatToggle?.(seat)}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="font-semibold text-lg">{nombreAsiento}</div>
              <div className="text-sm text-gray-500">{nombreZona}</div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                status={seatStatus.color} 
                text={seatStatus.text}
              />
              <span className="text-xl font-bold text-blue-600">
                ${precio.toFixed(2)}
              </span>
              <Button
                type={isSelected ? 'primary' : 'default'}
                size="small"
                disabled={seatStatus.status === 'locked' || seatStatus.status === 'sold'}
              >
                {isSelected ? 'Quitar' : 'Seleccionar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <SeatListSkeleton />;
  }

  return (
    <VirtualizedList
      items={seats}
      renderItem={renderSeat}
      height={height}
      itemHeight={80}
      variableHeight={true}
      emptyMessage="No hay asientos disponibles"
      className={className}
    />
  );
};

export default VirtualizedSeatList;


