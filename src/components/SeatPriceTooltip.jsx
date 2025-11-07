import React from 'react';
import { Tooltip, Card, Divider } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/**
 * Componente que muestra un tooltip con el precio desglosado al hacer hover sobre un asiento
 */
export const SeatPriceTooltip = ({ 
  seat, 
  funcionId, 
  children,
  showDetails = true 
}) => {
  if (!seat || !seat.precio) {
    return children;
  }

  const precio = typeof seat.precio === 'number' ? seat.precio : parseFloat(seat.precio) || 0;
  const nombreZona = seat.nombreZona || seat.zona?.nombre || 'General';
  const nombreAsiento = seat.nombre || seat.numero || `Asiento ${seat._id || seat.id}`;
  
  // Calcular posibles descuentos o impuestos (esto puede venir del contexto)
  const subtotal = precio;
  const descuento = 0; // TODO: Calcular desde descuentos aplicados
  const impuestos = 0; // TODO: Calcular impuestos
  const total = subtotal - descuento + impuestos;

  const tooltipContent = (
    <div className="min-w-[200px]">
      <div className="font-semibold text-white mb-2">{nombreAsiento}</div>
      <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
      
      {showDetails && (
        <>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Zona:</span>
              <span className="text-white font-medium">{nombreZona}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Precio base:</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-green-300">
                <span>Descuento:</span>
                <span>-${descuento.toFixed(2)}</span>
              </div>
            )}
            {impuestos > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>Impuestos:</span>
                <span>+${impuestos.toFixed(2)}</span>
              </div>
            )}
          </div>
          <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
        </>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-white font-semibold">Total:</span>
        <span className="text-white text-lg font-bold">${total.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <Tooltip
      title={tooltipContent}
      placement="top"
      overlayClassName="seat-price-tooltip"
      overlayInnerStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '12px',
        borderRadius: '8px'
      }}
      mouseEnterDelay={0.3}
    >
      {children}
    </Tooltip>
  );
};

/**
 * Hook para obtener precio desglosado de un asiento
 */
export const useSeatPrice = (seat, funcionId) => {
  const precio = React.useMemo(() => {
    if (!seat || !seat.precio) return null;
    return typeof seat.precio === 'number' ? seat.precio : parseFloat(seat.precio) || 0;
  }, [seat?.precio]);

  const precioDesglosado = React.useMemo(() => {
    if (!precio) return null;
    
    // TODO: Calcular desde descuentos, impuestos, etc.
    return {
      precioBase: precio,
      descuento: 0,
      impuestos: 0,
      total: precio
    };
  }, [precio]);

  return precioDesglosado;
};

export default SeatPriceTooltip;

