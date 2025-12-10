import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { AiOutlineClose, AiOutlineClockCircle } from 'react-icons/ai';

const CartWithTimer = ({
  carrito = [],
  setCarrito,
  onPaymentClick,
  selectedClient,
  selectedAffiliate,
  fixed = false
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos en segundos
  const [isVisible, setIsVisible] = useState(false);

  // Asegurar que carrito sea un array
  const safeCarrito = Array.isArray(carrito) ? carrito : [];

  // Calcular totales
  const subtotal = safeCarrito.reduce((sum, item) => sum + (item.precio || 0), 0);
  const commission = selectedAffiliate
    ? (selectedAffiliate.base || 0) + subtotal * ((selectedAffiliate.percentage || 0) / 100)
    : 0;
  const total = subtotal - commission;

  // Agrupar asientos por zona y precio
  const groupedSeats = safeCarrito.reduce((acc, item) => {
    const key = `${item.zona}-${item.precio}-${item.tipoPrecio}`;
    if (!acc[key]) {
      acc[key] = {
        zona: item.zona,
        precio: item.precio,
        tipoPrecio: item.tipoPrecio,
        descuentoNombre: item.descuentoNombre,
        asientos: [],
        cantidad: 0
      };
    }
    acc[key].asientos.push({
      _id: item._id,
      nombre: item.nombre,
      nombreMesa: item.nombreMesa
    });
    acc[key].cantidad++;
    return acc;
  }, {});

  // Temporizador de 15 minutos
  useEffect(() => {
    if (safeCarrito.length > 0) {
      setIsVisible(true);
      setTimeLeft(15 * 60); // Reset timer when cart has items
    } else {
      setIsVisible(false);
    }
  }, [safeCarrito.length]);

  useEffect(() => {
    if (timeLeft > 0 && safeCarrito.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Tiempo agotado - limpiar carrito
            setCarrito([]);
            message.warning('Tiempo agotado. Los asientos han sido liberados.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, safeCarrito.length, setCarrito]);

  // Formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Eliminar asiento del carrito
  const handleRemoveSeat = useCallback((seatId) => {
    setCarrito(prev => prev.filter(item => item._id !== seatId));
    message.success('Asiento eliminado del carrito');
  }, [setCarrito]);

  // Limpiar carrito
  const handleClearCart = useCallback(() => {
    setCarrito([]);
    message.success('Carrito limpiado');
  }, [setCarrito]);

  if (!isVisible || safeCarrito.length === 0) {
    return null;
  }

  const containerClasses = fixed
    ? "w-full h-full bg-white border border-gray-200 overflow-hidden"
    : "fixed top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-2rem)] overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Carrito</h3>
        <div className="flex items-center gap-2">
          <AiOutlineClockCircle className="text-yellow-300" />
          <span className="font-mono text-sm">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="bg-gray-200 h-1">
        <div
          className="bg-red-500 h-1 transition-all duration-1000"
          style={{ width: `${(timeLeft / (15 * 60)) * 100}%` }}
        />
      </div>

      {/* Cart Items */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedSeats).map(([key, group]) => (
          <div key={key} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{group.zona}</h4>
                <p className="text-sm text-gray-600">
                  {group.cantidad} asiento{group.cantidad !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  ${(group.precio * group.cantidad).toFixed(2)}
                </p>
                {group.tipoPrecio === 'descuento' && (
                  <p className="text-xs text-green-600">{group.descuentoNombre}</p>
                )}
              </div>
            </div>

            {/* Individual seats */}
            <div className="space-y-1">
              {group.asientos.map((seat) => (
                <div key={seat._id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    {seat.nombreMesa ? `${seat.nombreMesa} - ` : ''}{seat.nombre}
                  </span>
                  <button
                    onClick={() => handleRemoveSeat(seat._id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <AiOutlineClose size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Boletos:</span>
            <span>{safeCarrito.length} - ${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Productos:</span>
            <span>0 - $0.00</span>
          </div>
          <div className="flex justify-between">
            <span>Comisiones de transacción:</span>
            <span>0 - $0.00</span>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={onPaymentClick}
            disabled={!selectedClient}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Pagos/Detalles
          </button>

          <button
            onClick={handleClearCart}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Limpiar Carrito
          </button>
        </div>

        {/* Warning when time is low */}
        {timeLeft <= 300 && timeLeft > 0 && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
            ⚠️ Tiempo restante: {formatTime(timeLeft)}. Completa tu compra antes de que se liberen los asientos.
          </div>
        )}
      </div>
    </div>
  );
};

export default CartWithTimer;