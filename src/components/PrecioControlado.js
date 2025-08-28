import React from 'react';
import { useVentasHabilitadas } from '../hooks/useCanalesVenta';

/**
 * Componente que controla la visualización de precios basado en el canal de venta
 * 
 * @param {Object} props
 * @param {string|number} props.canalId - ID del canal de venta
 * @param {React.ReactNode} props.children - Contenido a mostrar si las ventas están habilitadas
 * @param {React.ReactNode} props.fallback - Contenido alternativo si las ventas están deshabilitadas
 * @param {string} props.mensajeDeshabilitado - Mensaje personalizado cuando las ventas están deshabilitadas
 * @param {boolean} props.mostrarMensaje - Si mostrar mensaje cuando está deshabilitado
 */
const PrecioControlado = ({ 
  canalId, 
  children, 
  fallback = null, 
  mensajeDeshabilitado = "Ventas no disponibles en este canal",
  mostrarMensaje = true 
}) => {
  const { habilitado, loading } = useVentasHabilitadas(canalId);

  // Si está cargando, mostrar un placeholder
  if (loading) {
    return (
      <div className="precio-loading">
        <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
      </div>
    );
  }

  // Si las ventas están habilitadas, mostrar el contenido normal
  if (habilitado) {
    return <>{children}</>;
  }

  // Si las ventas están deshabilitadas
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no hay fallback y se debe mostrar mensaje
  if (mostrarMensaje) {
    return (
      <div className="precio-deshabilitado text-gray-500 text-sm italic">
        {mensajeDeshabilitado}
      </div>
    );
  }

  // Si no hay fallback y no se debe mostrar mensaje, no mostrar nada
  return null;
};

export default PrecioControlado;

/**
 * Componente específico para precios de eventos
 */
export const PrecioEvento = ({ 
  precio, 
  canalId, 
  moneda = '$', 
  className = '',
  mostrarMensaje = true 
}) => {
  const { habilitado, loading } = useVentasHabilitadas(canalId);

  if (loading) {
    return (
      <span className={`precio-loading ${className}`}>
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
      </span>
    );
  }

  if (!habilitado) {
    if (mostrarMensaje) {
      return (
        <span className={`precio-deshabilitado text-gray-500 text-sm italic ${className}`}>
          Precio no disponible
        </span>
      );
    }
    return null;
  }

  return (
    <span className={`precio-evento font-semibold text-green-600 ${className}`}>
      {moneda}{precio}
    </span>
  );
};

/**
 * Componente para botones de compra controlados por canal
 */
export const BotonCompraControlado = ({ 
  canalId, 
  children, 
  onClick, 
  className = '',
  mensajeDeshabilitado = "Compras no disponibles"
}) => {
  const { habilitado, loading } = useVentasHabilitadas(canalId);

  if (loading) {
    return (
      <button 
        className={`${className} opacity-50 cursor-not-allowed`} 
        disabled
      >
        <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
      </button>
    );
  }

  if (!habilitado) {
    return (
      <button 
        className={`${className} opacity-50 cursor-not-allowed`} 
        disabled
        title={mensajeDeshabilitado}
      >
        {mensajeDeshabilitado}
      </button>
    );
  }

  return (
    <button 
      className={className} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};
