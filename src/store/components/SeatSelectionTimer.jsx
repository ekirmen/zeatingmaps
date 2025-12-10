import React, { useState, useEffect } from 'react';
import { message } from 'antd';

const SeatSelectionTimer = ({ selectedSeats, onTimeExpired, onSeatsCleared }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos en segundos
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedSeats.length > 0) {
      setIsVisible(true);
      setTimeLeft(15 * 60); // Reset timer when seats are selected
    } else {
      setIsVisible(false);
    }
  }, [selectedSeats.length]);

  useEffect(() => {
    if (timeLeft > 0 && selectedSeats.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Tiempo agotado - limpiar asientos seleccionados
            onSeatsCleared();
            message.warning('Tiempo agotado. Los asientos han sido liberados.');
            onTimeExpired && onTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, selectedSeats.length, onSeatsCleared, onTimeExpired]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-600'; // Rojo cuando queda 1 minuto o menos
    if (timeLeft <= 300) return 'text-yellow-600'; // Amarillo cuando quedan 5 minutos o menos
    return 'text-green-600'; // Verde por defecto
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Tiempo Restante
        </h3>
        <div className={`text-3xl font-bold ${getTimeColor()} mb-2`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-gray-600">
          {selectedSeats.length} asiento{selectedSeats.length !== 1 ? 's' : ''} seleccionado{selectedSeats.length !== 1 ? 's' : ''}
        </div>
        {timeLeft <= 300 && (
          <div className="text-xs text-red-500 mt-1">
            ¡Completa tu compra antes de que se agote el tiempo!
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatSelectionTimer;