import React, { useState } from 'react';

const EstadoDeVenta = () => {
  const [estadoVenta, setEstadoVenta] = useState('');
  const [descripcionEstado, setDescripcionEstado] = useState('');
  const [estadoPersonalizado, setEstadoPersonalizado] = useState(false);

  const handleEstadoChange = (estado) => {
    setEstadoVenta(estado);
    if (estado !== 'estado-personalizado') {
      setDescripcionEstado('');
      setEstadoPersonalizado(false);
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
            <tr
              onClick={() => handleEstadoChange('a-la-venta')}
              className={estadoVenta === 'a-la-venta' ? 'selected' : ''}
            >
              <td>A la venta</td>
              <td><div className="checked-icon">✔</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Solo en taquilla */}
            <tr
              onClick={() => handleEstadoChange('solo-en-taquilla')}
              className={estadoVenta === 'solo-en-taquilla' ? 'selected' : ''}
            >
              <td>Solo en taquilla</td>
              <td><div className="unchecked-icon">✖</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Agotado */}
            <tr
              onClick={() => handleEstadoChange('agotado')}
              className={estadoVenta === 'agotado' ? 'selected' : ''}
            >
              <td>Agotado</td>
              <td><div className="unchecked-icon">✖</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Próximamente */}
            <tr
              onClick={() => handleEstadoChange('proximamente')}
              className={estadoVenta === 'proximamente' ? 'selected' : ''}
            >
              <td>Próximamente</td>
              <td><div className="calendar-icon">📅</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Próximamente con cuenta atrás */}
            <tr
              onClick={() => handleEstadoChange('proximamente-con-cuenta')}
              className={estadoVenta === 'proximamente-con-cuenta' ? 'selected' : ''}
            >
              <td>Próximamente con cuenta atrás</td>
              <td><div className="calendar-icon">📅</div></td>
              <td><div className="checked-icon">✔</div></td>
            </tr>

            {/* Estado: Estado personalizado */}
            <tr
              onClick={() => handleEstadoChange('estado-personalizado')}
              className={estadoVenta === 'estado-personalizado' ? 'selected' : ''}
            >
              <td>Estado personalizado</td>
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
            onChange={(e) => setDescripcionEstado(e.target.value)}
            disabled={!estadoPersonalizado}
            placeholder="Escribe la descripción..."
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={estadoPersonalizado}
              onChange={() => setEstadoPersonalizado(!estadoPersonalizado)}
            />
            Activar estado personalizado
          </label>
        </div>
      )}
    </div>
  );
};

export default EstadoDeVenta;
