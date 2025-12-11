import React, { useState, useEffect } from 'react';

const EstadoDeVenta = ({ eventoData, setEventoData }) => {
  const [estadoVenta, setEstadoVenta] = useState('');
  const [descripcionEstado, setDescripcionEstado] = useState('');
  const [estadoPersonalizado, setEstadoPersonalizado] = useState(false);


    if (!eventoData) return;
    setEstadoVenta(eventoData.estadoVenta || '');
    setDescripcionEstado(eventoData.descripcionEstado || '');
    setEstadoPersonalizado(eventoData.estadoPersonalizado || false);
  }, [eventoData]);

  const handleEstadoChange = (estado) => {
    setEstadoVenta(estado);
    setEventoData(prev => ({ ...prev, estadoVenta: estado }));
    if (estado !== 'estado-personalizado') {
      setDescripcionEstado('');
      setEstadoPersonalizado(false);
      setEventoData(prev => ({
        ...prev,
        descripcionEstado: '',
        estadoPersonalizado: false
      }));
    }
  };

  return (
    <div className="estado-de-venta bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <div>
        <h4 className="text-xl font-semibold text-gray-800 mb-2">Estado de la Venta</h4>
        <p className="text-sm text-gray-600">Selecciona un estado que describa si el evento está a la venta o por qué no.</p>
      </div>

      {/* Tabla de opciones de estado */}
      <div className="estado-options overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">A la venta en canales</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">A la venta en taquilla</th>
            </tr>
          </thead>
          <tbody>
            {/* Estado: A la venta */}
            <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${estadoVenta === 'a-la-venta' ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'a-la-venta'}
                    onChange={() => handleEstadoChange('a-la-venta')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">A la venta</span>
                </label>
              </td>
              <td className="px-4 py-3 text-center"><span className="text-green-600 text-lg">✔</span></td>
              <td className="px-4 py-3 text-center"><span className="text-green-600 text-lg">✔</span></td>
            </tr>

            {/* Estado: Solo en taquilla */}
            <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${estadoVenta === 'solo-en-taquilla' ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'solo-en-taquilla'}
                    onChange={() => handleEstadoChange('solo-en-taquilla')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Solo en taquilla</span>
                </label>
              </td>
              <td className="px-4 py-3 text-center"><span className="text-red-600 text-lg">✖</span></td>
              <td className="px-4 py-3 text-center"><span className="text-green-600 text-lg">✔</span></td>
            </tr>

            {/* Estado: Agotado */}
            <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${estadoVenta === 'agotado' ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'agotado'}
                    onChange={() => handleEstadoChange('agotado')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Agotado</span>
                </label>
              </td>
              <td className="px-4 py-3 text-center"><span className="text-red-600 text-lg">✖</span></td>
              <td className="px-4 py-3 text-center"><span className="text-green-600 text-lg">✔</span></td>
            </tr>

            {/* Estado: Próximamente */}
            <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${estadoVenta === 'proximamente' ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'proximamente'}
                    onChange={() => handleEstadoChange('proximamente')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Próximamente</span>
                </label>
              </td>
              <td className="px-4 py-3 text-center"><span className="text-lg">📅</span></td>
              <td className="px-4 py-3 text-center"><span className="text-green-600 text-lg">✔</span></td>
            </tr>

            {/* Estado: Próximamente con cuenta atrás */}
            <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${estadoVenta === 'proximamente-con-cuenta' ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'proximamente-con-cuenta'}
                    onChange={() => handleEstadoChange('proximamente-con-cuenta')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Próximamente con cuenta atrás</span>
                </label>
              </td>
              <td className="px-4 py-3 text-center"><span className="text-lg">📅</span></td>
              <td className="px-4 py-3 text-center"><span className="text-green-600 text-lg">✔</span></td>
            </tr>

            {/* Estado: Estado personalizado */}
            <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${estadoVenta === 'estado-personalizado' ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'estado-personalizado'}
                    onChange={() => handleEstadoChange('estado-personalizado')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Estado personalizado</span>
                </label>
              </td>
              <td className="px-4 py-3 text-center"><span className="text-red-600 text-lg">✖</span></td>
              <td className="px-4 py-3 text-center"><span className="text-red-600 text-lg">✖</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Opciones de estado personalizado */}
      {estadoVenta === 'estado-personalizado' && (
        <div className="estado-personalizado space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label htmlFor="descripcion-estado" className="block text-sm font-medium text-gray-700 mb-2">Descripción del estado</label>
            <input
              id="descripcion-estado"
              type="text"
              value={descripcionEstado}
              onChange={(e) => {
                setDescripcionEstado(e.target.value);
                setEventoData(prev => ({ ...prev, descripcionEstado: e.target.value }));
              }}
              disabled={!estadoPersonalizado}
              placeholder="Escribe la descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <label className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={estadoPersonalizado}
              onChange={() => {
                const nuevo = !estadoPersonalizado;
                setEstadoPersonalizado(nuevo);
                setEventoData(prev => ({ ...prev, estadoPersonalizado: nuevo }));
              }}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Activar estado personalizado</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default EstadoDeVenta;
