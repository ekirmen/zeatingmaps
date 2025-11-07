import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LazySeatingMap from '../../components/LazySeatingMap';
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
import { useSeatCleanup } from '../../hooks/useSeatCleanup';
import SeatStatusNotification from '../../components/SeatStatusNotification';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent, shouldTrackOnPage, FACEBOOK_EVENTS } from '../services/facebookPixelService';

function EventPage() {
    useCartRestore();
    useSeatCleanup(); // Activar sistema de limpieza automática
  const { eventSlug } = useParams();
  const [searchParams] = useSearchParams();
  const funcionParam = searchParams.get('funcion');

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [priceTemplate, setPriceTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [facebookPixel, setFacebookPixel] = useState(null);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const cartItems = useCartStore((state) => state.items);
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

  // Preseleccionar función basada en el parámetro URL
  useEffect(() => {
    if (funciones.length > 0 && funcionParam) {
      const funcion = funciones.find(f => f.id === parseInt(funcionParam));
      if (funcion) {
        setSelectedFunctionId(funcion.id);
      }
    }
  }, [funciones, funcionParam]);

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

  const loadFacebookPixel = async () => {
    try {
      if (evento?.id) {
        const pixel = await getFacebookPixelByEvent(evento.id);
        setFacebookPixel(pixel);
      }
    } catch (error) {
      console.error('Error loading Facebook pixel:', error);
    }
  };

  useEffect(() => {
    if (evento?.id) loadFacebookPixel();
  }, [evento?.id]);

  const handleSeatToggle = useCallback(
    async (silla) => {
      const sillaId = silla._id || silla.id;
      if (!sillaId || !selectedFunctionId) return;

      // Si está bloqueado por otro usuario, no permitir acción
      const isLocked = await isSeatLocked(sillaId, selectedFunctionId);
      if (isLocked && !(await isSeatLockedByMe(sillaId, selectedFunctionId))) return;

      // Resolver zona y precio
      const zona =
        mapa?.zonas?.find(z => z.asientos?.some(a => a._id === sillaId)) ||
        mapa?.contenido?.find(el => el.sillas?.some(a => a._id === sillaId) && el.zona) ||
        silla.zona || {};
      const zonaId = zona?.id || silla.zonaId;
      const nombreZona = zona?.nombre || 'Zona';
      const detalle = priceTemplate?.detalles?.find(d => d.zonaId === zonaId);
      const precio = detalle?.precio || 0;

      // Alternar bloqueo en DB + carrito
      if (await isSeatLockedByMe(sillaId, selectedFunctionId)) {
        await unlockSeat(sillaId, selectedFunctionId);
        await toggleSeat({
          sillaId,
          zonaId,
          precio,
          nombre: silla.nombre || silla.numero || silla._id,
          nombreZona,
          functionId: selectedFunctionId,
        });
      } else {
        const ok = await lockSeat(sillaId, 'seleccionado', selectedFunctionId);
        if (!ok) return;
        await toggleSeat({
          sillaId,
          zonaId,
          precio,
          nombre: silla.nombre || silla.numero || silla._id,
          nombreZona,
          functionId: selectedFunctionId,
        });
      }
    },
    [selectedFunctionId, mapa, priceTemplate, toggleSeat, isSeatLocked, isSeatLockedByMe, lockSeat, unlockSeat]
  );

  if (error) return <div className="text-red-600 py-4">{error.message}</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Píxel de Facebook para ViewContent */}
      {facebookPixel && shouldTrackOnPage(facebookPixel, 'event_page') && (
        <FacebookPixel
          pixelId={facebookPixel.pixel_id}
          pixelScript={facebookPixel.pixel_script}
          eventName={FACEBOOK_EVENTS.VIEW_CONTENT}
          eventData={{
            content_name: evento?.nombre,
            content_category: 'Evento',
            content_ids: [evento?.id],
            value: evento?.precio_base,
            currency: 'USD'
          }}
        />
      )}

      {/* Notificaciones de estado de asientos */}
      <SeatStatusNotification />

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
            <LazySeatingMap
              funcionId={selectedFunctionId}
              mapa={mapa}
              lockSeat={lockSeat}
              unlockSeat={unlockSeat}
              lockTable={lockSeat} // Usar lockSeat para mesas también
              unlockTable={unlockSeat} // Usar unlockSeat para mesas también
              isSeatLocked={isSeatLocked}
              isSeatLockedByMe={isSeatLockedByMe}
              isTableLocked={isSeatLocked} // Usar isSeatLocked para mesas
              isTableLockedByMe={isSeatLockedByMe} // Usar isSeatLockedByMe para mesas
              isAnySeatInTableLocked={async (tableId, allSeats) => {
                // Verificar si algún asiento de la mesa está bloqueado
                const results = await Promise.all(
                  allSeats
                    .filter(seat => seat.mesaId === tableId)
                    .map(async seat => await isSeatLocked(seat._id, selectedFunctionId))
                );
                return results.some(isLocked => isLocked);
              }}
              areAllSeatsInTableLockedByMe={async (tableId, allSeats) => {
                // Verificar si todos los asientos de la mesa están bloqueados por mí
                const tableSeats = allSeats.filter(seat => seat.mesaId === tableId);
                if (tableSeats.length === 0) return false;
                
                const results = await Promise.all(
                  tableSeats.map(async seat => await isSeatLockedByMe(seat._id, selectedFunctionId))
                );
                return results.every(isLockedByMe => isLockedByMe);
              }}
              onSeatToggle={handleSeatToggle}
              onTableToggle={(table) => {
                // Manejar clic en mesa - por ahora solo mostrar info
                console.log('Mesa clickeada:', table);
              }}
              onSeatInfo={() => {}}
              selectedSeats={cartItems.map(item => item.sillaId || item.id || item._id)}
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
