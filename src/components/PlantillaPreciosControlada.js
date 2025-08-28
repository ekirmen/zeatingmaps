import React from 'react';
import { useCanalVenta } from '../contexts/CanalVentaContext';
import { PrecioEvento, BotonCompraControlado } from './PrecioControlado';

/**
 * Componente de plantilla de precios controlada por canal de venta
 * Este es un ejemplo de cómo implementar el control de precios
 */
const PlantillaPreciosControlada = ({ evento, precios }) => {
  const { canalActual, ventasHabilitadas, loading, nombreCanal } = useCanalVenta();

  if (loading) {
    return (
      <div className="plantilla-precios-loading">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-6 w-32 rounded"></div>
          <div className="bg-gray-200 h-4 w-24 rounded"></div>
          <div className="bg-gray-200 h-8 w-20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="plantilla-precios-controlada p-6 bg-white rounded-lg shadow-md">
      {/* Header con información del canal */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Precios - {evento?.nombre || 'Evento'}
        </h2>
        
        {canalActual && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Canal: {nombreCanal}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              ventasHabilitadas() 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {ventasHabilitadas() ? 'Ventas Habilitadas' : 'Ventas Deshabilitadas'}
            </span>
          </div>
        )}
      </div>

      {/* Lista de precios */}
      <div className="space-y-4">
        {precios?.map((precio, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{precio.nombre}</h3>
              <p className="text-sm text-gray-600">{precio.descripcion}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Precio controlado por canal */}
              <PrecioEvento 
                precio={precio.valor} 
                canalId={canalActual?.id}
                moneda="$"
                className="text-xl"
              />
              
              {/* Botón de compra controlado */}
              <BotonCompraControlado
                canalId={canalActual?.id}
                onClick={() => console.log('Comprar:', precio)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                mensajeDeshabilitado="No disponible"
              >
                Comprar
              </BotonCompraControlado>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay precios */}
      {(!precios || precios.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No hay precios disponibles para este evento
        </div>
      )}

      {/* Mensaje cuando las ventas están deshabilitadas */}
      {canalActual && !ventasHabilitadas() && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-yellow-800">
              Las ventas no están habilitadas en {nombreCanal}. 
              Los precios se muestran solo a modo informativo.
            </span>
          </div>
        </div>
      )}

      {/* Información adicional del canal */}
      {canalActual && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>URL del canal: {canalActual.url}</p>
            <p>Estado: {canalActual.activo ? 'Activo' : 'Inactivo'}</p>
            <p>ID del canal: {canalActual.id}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantillaPreciosControlada;

/**
 * Componente simplificado para mostrar solo precios (sin botones de compra)
 */
export const PreciosSoloLectura = ({ precios, canalId }) => {
  return (
    <div className="precios-solo-lectura">
      {precios?.map((precio, index) => (
        <div key={index} className="flex items-center justify-between py-2">
          <span className="text-gray-700">{precio.nombre}</span>
          <PrecioEvento 
            precio={precio.valor} 
            canalId={canalId}
            moneda="$"
            mostrarMensaje={false}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Componente para mostrar información del canal actual
 */
export const InfoCanal = () => {
  const { canalActual, loading, error } = useCanalVenta();

  if (loading) {
    return <div className="text-gray-500">Detectando canal...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!canalActual) {
    return <div className="text-gray-500">No se detectó canal de venta</div>;
  }

  return (
    <div className="info-canal text-sm text-gray-600">
      <span className="font-medium">Canal:</span> {canalActual.nombre}
      {!canalActual.activo && (
        <span className="ml-2 text-red-600">(Deshabilitado)</span>
      )}
    </div>
  );
};
