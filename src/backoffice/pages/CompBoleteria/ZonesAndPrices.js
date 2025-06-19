import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa } from '../../../services/supabaseServices';

const ZonesAndPrices = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  carrito,
  setCarrito,
}) => {
  const [mapa, setMapa] = useState(null);

  useEffect(() => {
    const loadMapa = async () => {
      const salaId = selectedFuncion?.sala?._id || selectedFuncion?.sala;
      const funcionId = selectedFuncion?.id || selectedFuncion?._id;
      if (salaId) {
        try {
          const m = await fetchMapa(salaId, funcionId);
          setMapa(m);
        } catch (err) {
          console.error('Error loading map:', err);
          message.error('Error cargando mapa');
          setMapa(null);
        }
      } else {
        setMapa(null);
      }
    };
    loadMapa();
  }, [selectedFuncion]);

  const handleSeatClick = (seat, table) => {
    const exists = carrito.find((i) => i._id === seat._id);
    if (exists) {
      setCarrito(carrito.filter((i) => i._id !== seat._id));
    } else {
      setCarrito([
        ...carrito,
        {
          _id: seat._id,
          nombre: seat.nombre,
          nombreMesa: table.nombre,
          zona: seat.zona,
        },
      ]);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <select
        className="border p-2 rounded w-full"
        value={selectedEvent?.id || selectedEvent?._id || ''}
        onChange={(e) => onEventSelect(e.target.value)}
      >
        <option value="" disabled>
          Seleccionar evento
        </option>
        {eventos.map((ev) => (
          <option key={ev.id || ev._id} value={ev.id || ev._id}>
            {ev.nombre}
          </option>
        ))}
      </select>

      {selectedFuncion && (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {new Date(selectedFuncion.fechaCelebracion).toLocaleString()}
          </span>
          {typeof onShowFunctions === 'function' && (
            <button
              type="button"
              onClick={() => onShowFunctions()}
              className="text-blue-600 underline text-sm"
            >
              Cambiar función
            </button>
          )}
        </div>
      )}

      {mapa ? (
        <SeatingMap mapa={mapa} onSeatClick={handleSeatClick} />
      ) : (
        <p className="text-center text-gray-500">No hay mapa disponible</p>
      )}
    </div>
  );
};

export default ZonesAndPrices;
