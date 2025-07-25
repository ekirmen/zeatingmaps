import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import Cart from './Cart';
import {
  getFuncion,
  fetchMapa,
  fetchEventoBySlug,
  getFunciones
} from '../services/apistore';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';
import useCartRestore from '../../store/hooks/useCartRestore';

function EventPage() {
    useCartRestore();
  const { eventSlug } = useParams();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [priceTemplate, setPriceTemplate] = useState(null);
  const [error, setError] = useState(null);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const {
    isSeatLocked,
    isSeatLockedByMe,
    lockSeat,
    unlockSeat,
    subscribeToFunction,
    unsubscribe
  } = useSeatLockStore();

  // Suscribirse a función
  useEffect(() => {
    if (!selectedFunctionId) return;
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  // Obtener evento + funciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventData = await fetchEventoBySlug(eventSlug);
        if (!eventData) throw new Error('Evento no encontrado');
        setEvento(eventData);
        const funcionesData = await getFunciones(eventData.id);
        setFunciones(funcionesData || []);
      } catch (err) {
        setError(err);
      }
    };
    if (eventSlug) fetchData();
  }, [eventSlug]);

  // Cargar mapa y plantilla de precios
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const funcion = await getFuncion(selectedFunctionId);
        if (funcion?.sala?.id) {
          const mapData = await fetchMapa(funcion.sala.id);
          setMapa(mapData);
        }
        if (funcion?.plantilla) {
          setPriceTemplate(funcion.plantilla);
        }
      } catch (err) {
        setError(err);
      }
    };
    if (selectedFunctionId) fetchMap();
  }, [selectedFunctionId]);

  const handleSeatToggle = useCallback(
    (silla) => {
      const sillaId = silla._id || silla.id;
      const zona = mapa?.zonas?.find(z =>
        z.asientos?.some(a => a._id === sillaId)
      );
      const zonaId = zona?.id;
      if (!sillaId || !zonaId || !selectedFunctionId) return;

      const nombreZona = zona?.nombre || 'Zona';
      const detalle = priceTemplate?.detalles?.find(d => d.zonaId === zonaId);
      const precio = detalle?.precio || 0;

      toggleSeat({
        sillaId,
        zonaId,
        precio,
        nombre: silla.nombre || silla.numero || silla._id,
        nombreZona,
        functionId: selectedFunctionId,
      });
    },
    [selectedFunctionId, mapa, priceTemplate, toggleSeat]
  );

  if (error) return <div className="text-red-600 py-4">{error.message}</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">{evento?.nombre}</h2>

          <select
            className="mb-4 p-2 border rounded w-full max-w-sm"
            value={selectedFunctionId || ''}
            onChange={(e) => setSelectedFunctionId(e.target.value)}
          >
            <option value="" disabled>Selecciona una función</option>
            {funciones.map(func => (
              <option key={func.id} value={func.id}>
                {new Date(func.fecha_celebracion).toLocaleString('es-ES')}
              </option>
            ))}
          </select>

          {mapa && selectedFunctionId ? (
            <SeatingMapUnified
              funcionId={selectedFunctionId}
              mapa={mapa}
              lockSeat={lockSeat}
              unlockSeat={unlockSeat}
              isSeatLocked={isSeatLocked}
              isSeatLockedByMe={isSeatLockedByMe}
              onSeatToggle={handleSeatToggle}
              onSeatInfo={() => {}}
            />
          ) : (
            <div className="text-gray-500 text-center py-6">
              {selectedFunctionId ? 'Cargando mapa...' : 'Selecciona una función para ver el mapa.'}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded shadow">
          <Cart />
        </div>
      </div>
    </div>
  );
}

export default EventPage;
