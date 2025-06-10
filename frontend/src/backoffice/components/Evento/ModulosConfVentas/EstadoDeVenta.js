import React, { useState, useEffect } from 'react';

const EstadoDeVenta = ({ eventoData, setEventoData }) => {
  const [estadoVenta, setEstadoVenta] = useState('');
  const [descripcionEstado, setDescripcionEstado] = useState('');
  const [estadoPersonalizado, setEstadoPersonalizado] = useState(false);

  useEffect(() => {
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
    <div className="estado-de-venta">
      <h4>Estado de la Venta</h4>
      <p>Selecciona un estado que describa si el evento está a la venta o por qué no.</p>

      {/* Tabla de opciones de estado */}
      <div className="estado-options">
        <table className="estado-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>A la venta en canales</th>
              <th>A la venta en taquilla</th>
            </tr>
          </thead>
          <tbody>
            {/* Estado: A la venta */}
            <tr className={estadoVenta === 'a-la-venta' ? 'selected' : ''}>
              <td>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'a-la-venta'}
                    onChange={() => handleEstadoChange('a-la-venta')}
                  />
                  A la venta
                </label>
              </td>
              <td><div className="checked-icon">✔</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Solo en taquilla */}
            <tr className={estadoVenta === 'solo-en-taquilla' ? 'selected' : ''}>
              <td>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'solo-en-taquilla'}
                    onChange={() => handleEstadoChange('solo-en-taquilla')}
                  />
                  Solo en taquilla
                </label>
              </td>
              <td><div className="unchecked-icon">✖</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Agotado */}
            <tr className={estadoVenta === 'agotado' ? 'selected' : ''}>
              <td>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'agotado'}
                    onChange={() => handleEstadoChange('agotado')}
                  />
                  Agotado
                </label>
              </td>
              <td><div className="unchecked-icon">✖</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Próximamente */}
            <tr className={estadoVenta === 'proximamente' ? 'selected' : ''}>
              <td>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'proximamente'}
                    onChange={() => handleEstadoChange('proximamente')}
                  />
                  Próximamente
                </label>
              </td>
              <td><div className="calendar-icon">📅</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Próximamente con cuenta atrás */}
            <tr className={estadoVenta === 'proximamente-con-cuenta' ? 'selected' : ''}>
              <td>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'proximamente-con-cuenta'}
                    onChange={() => handleEstadoChange('proximamente-con-cuenta')}
                  />
                  Próximamente con cuenta atrás
                </label>
              </td>
              <td><div className="calendar-icon">📅</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Estado personalizado */}
            <tr className={estadoVenta === 'estado-personalizado' ? 'selected' : ''}>
              <td>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estadoVenta"
                    checked={estadoVenta === 'estado-personalizado'}
                    onChange={() => handleEstadoChange('estado-personalizado')}
                  />
                  Estado personalizado
                </label>
              </td>
              <td><div className="unchecked-icon">✖</div></td>
              <td><div className="unchecked-icon">✖</div></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Opciones de estado personalizado */}
      {estadoVenta === 'estado-personalizado' && (
        <div className="estado-personalizado">
          <label htmlFor="descripcion-estado">Descripción del estado</label>
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
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={estadoPersonalizado}
              onChange={() => {
                const nuevo = !estadoPersonalizado;
                setEstadoPersonalizado(nuevo);
                setEventoData(prev => ({ ...prev, estadoPersonalizado: nuevo }));
              }}
            />
            Activar estado personalizado
          </label>
        </div>
      )}
    </div>
  );
};

export default EstadoDeVenta;
