// src/store/pages/Event.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import SeatingMap from '../components/SeatingMap';
import VenueMap from '../../components/VenueMap';
import Cart from './Cart';
// FIX: Added fetchEventoBySlug and getFunciones to the import list
import { getFuncion, fetchMapa, fetchEventoBySlug, getFunciones, fetchZonasBySala } from '../services/apistore'; 
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseSeatLocks } from '../hooks/useFirebaseSeatLocks';

function EventPage() {
  const { eventSlug } = useParams();

  const { user } = useAuth();
  const userId = user?.id || null;

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [cart, setCart] = useState([]);
  const [recintoInfo, setRecintoInfo] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [priceTemplate, setPriceTemplate] = React.useState(null);

  const { isSeatLocked, lockSeat, unlockSeat } = useFirebaseSeatLocks(selectedFunctionId, userId);

  const toggleSillaEnCarrito = useCallback(async (silla, elemento) => {
    const sillaId = silla._id || silla.id || null;
    const zonaId = silla.zona || elemento.zonaId || null;
    // Removed unused asientoId

    let precio = 0;
    let tipoPrecio = null;
    let descuentoNombre = null;

    if (priceTemplate && priceTemplate.detalles) {
      // Assuming priceTemplate.detalles is an array of price details with zona and precio
      const detalle = priceTemplate.detalles.find(d => String(d.zonaId) === String(zonaId));
      if (detalle) {
        precio = detalle.precio || 0;
        tipoPrecio = detalle.tipoPrecio || null;
        descuentoNombre = detalle.descuentoNombre || null;
      }
    }

    setCart(prevCart => {
      if (!prevCart) {
        return [{
          sillaId,
          zonaId,
          precio,
          quantity: 1,
          tipoPrecio,
          descuentoNombre,
          nombre: silla.nombre || silla.numero || silla.id || '',
          nombreMesa: elemento.nombre || '',
          functionId: selectedFunctionId,
          functionDate: funciones.find(f => f.id === selectedFunctionId)?.fecha_celebracion || null
        }];
      }
      const existingItemIndex = prevCart.findIndex(item => item.sillaId === sillaId && item.functionId === selectedFunctionId);
      if (existingItemIndex > -1) {
        return prevCart.filter(item => !(item.sillaId === sillaId && item.functionId === selectedFunctionId));
      } else {
        return [...prevCart, {
          sillaId,
          zonaId,
          precio,
          quantity: 1,
          tipoPrecio,
          descuentoNombre,
          nombre: silla.nombre || silla.numero || silla.id || '',
          nombreMesa: elemento.nombre || '',
          functionId: selectedFunctionId,
          functionDate: funciones.find(f => f.id === selectedFunctionId)?.fecha_celebracion || null
        }];
      }
    });
  }, [priceTemplate, selectedFunctionId, funciones, lockSeat, unlockSeat]);

  useEffect(() => {
    async function fetchEventData() {
      setLoading(true);
      setError(null);
      try {
        const eventData = await fetchEventoBySlug(eventSlug); 
        if (!eventData) {
          setError(new Error('Evento no encontrado'));
          setEvento(null);
          setFunciones([]);
          setRecintoInfo(null);
          return;
        }
        setEvento(eventData);

        const funcionesData = await getFunciones(eventData.id); 
        setFunciones(funcionesData || []);

        if (eventData.recinto) {
          setRecintoInfo(eventData.recinto); 
        } else {
          setRecintoInfo(null);
        }

      } catch (err) {
        setError(err);
        setEvento(null);
        setFunciones([]);
        setRecintoInfo(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEventData();
  }, [eventSlug]); // Removed fetchEventoBySlug and getFunciones from dependencies

  useEffect(() => {
    async function fetchMapAndPriceTemplateForFunction() {
      if (!selectedFunctionId) {
        setMapa(null);
        setPriceTemplate(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const funcion = await getFuncion(selectedFunctionId);
        if (funcion && funcion.sala && funcion.sala.id) {
          const mapData = await fetchMapa(funcion.sala.id);
          setMapa(mapData);
          const zonasData = await fetchZonasBySala(funcion.sala.id);
          setZonas(zonasData);
        } else {
          setMapa(null);
          setZonas([]);
        }
        if (funcion && funcion.plantilla) {
          let plantilla = funcion.plantilla;
          if (plantilla.detalles && typeof plantilla.detalles === 'string') {
            try {
              plantilla = {
                ...plantilla,
                detalles: JSON.parse(plantilla.detalles)
              };
            } catch (e) {
              console.error('Error parsing plantilla.detalles JSON:', e);
              plantilla = {
                ...plantilla,
                detalles: []
              };
            }
          }
          setPriceTemplate(plantilla);
        } else {
          setPriceTemplate(null);
        }
      } catch (err) {
        setError(err);
        setMapa(null);
        setPriceTemplate(null);
        setZonas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMapAndPriceTemplateForFunction();
  }, [selectedFunctionId]); // Removed getFuncion and fetchMapa from dependencies


  useEffect(() => {
    async function fetchEventData() {
      setLoading(true);
      setError(null);
      try {
        // Now fetchEventoBySlug is correctly imported
        const eventData = await fetchEventoBySlug(eventSlug); 
        if (!eventData) {
          setError(new Error('Evento no encontrado'));
          setEvento(null);
          setFunciones([]);
          setRecintoInfo(null);
          return;
        }
        setEvento(eventData);

        // Now getFunciones is correctly imported
        const funcionesData = await getFunciones(eventData.id); 
        setFunciones(funcionesData || []);

        // The 'recinto' information
        // If 'eventData' comes with 'recinto' as an object, use it directly.
        // If 'eventData.recinto' is just an ID, you'd need another API call (e.g., fetchRecintoById)
        // For this example, assuming eventData might have a nested 'recinto' object or you'll fetch it.
        // If your database 'eventos' table has a foreign key to 'recintos', your fetchEventoBySlug
        // could select nested 'recinto' data: .select('*, recinto(*)') if Supabase allows it.
        if (eventData.recinto) {
          setRecintoInfo(eventData.recinto); 
        } else {
          setRecintoInfo(null); // Or default placeholder if no recinto
        }

      } catch (err) {
        setError(err);
        setEvento(null);
        setFunciones([]);
        setRecintoInfo(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEventData();
  }, [eventSlug]); // Removed fetchEventoBySlug and getFunciones from dependencies

  useEffect(() => {
    async function fetchMapAndPriceTemplateForFunction() {
      if (!selectedFunctionId) {
        setMapa(null);
        setPriceTemplate(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const funcion = await getFuncion(selectedFunctionId);
        if (funcion && funcion.sala && funcion.sala.id) {
          const mapData = await fetchMapa(funcion.sala.id);
          setMapa(mapData);
          // Fetch zonas for the sala
          const zonasData = await fetchZonasBySala(funcion.sala.id);
          setZonas(zonasData);
        } else {
          setMapa(null);
          setZonas([]);
        }
        if (funcion && funcion.plantilla) {
          let plantilla = funcion.plantilla;
          if (plantilla.detalles && typeof plantilla.detalles === 'string') {
            try {
              plantilla = {
                ...plantilla,
                detalles: JSON.parse(plantilla.detalles)
              };
            } catch (e) {
              console.error('Error parsing plantilla.detalles JSON:', e);
              plantilla = {
                ...plantilla,
                detalles: []
              };
            }
          }
          setPriceTemplate(plantilla);
        } else {
          setPriceTemplate(null);
        }
      } catch (err) {
        setError(err);
        setMapa(null);
        setPriceTemplate(null);
        setZonas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMapAndPriceTemplateForFunction();
  }, [selectedFunctionId]); 

  const getImageUrl = (imageType) => {
    if (evento?.imagenes) {
      try {
        const images = JSON.parse(evento.imagenes);
        if (!images || typeof images !== 'object') {
          console.warn("Parsed event images is not an object:", images);
          return null;
        }
        if (!images[imageType]) {
          console.warn(`Image type "${imageType}" not found in event images.`);
          return null;
        }
        return images[imageType];
      } catch (e) {
        console.error("Error parsing event images JSON:", e);
        return null;
      }
    }
    return null;
  };

  const bannerImageUrl = getImageUrl('banner');
  const obraImageUrl = getImageUrl('obraImagen');
  const portadaImageUrl = getImageUrl('portada');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700 font-inter">
        Cargando detalles del evento...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-xl text-red-600 font-inter">
        <p>Error al cargar el evento:</p>
        <p className="text-base text-gray-700">{error.message}</p>
        <p className="text-sm text-gray-500 mt-4">Por favor, intenta recargar la página.</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700 font-inter">
        Evento no encontrado.
      </div>
    );
  }

  // Determine eventTag based on your actual event data structure.
  // If 'evento' has a 'pais' or 'tag' property from fetchEventoBySlug:
  // const eventTag = evento.paisTag || "VE"; 
  // Otherwise, hardcode or derive from 'recintoInfo' if available.
  // Removed unused eventTag variable

  return (
    <div className="event-detail-page p-4 font-inter max-w-7xl mx-auto">
      {/* Event Banner Image */}
      {bannerImageUrl ? (
        <div className="mb-8 rounded-lg overflow-hidden shadow-xl">
          <img
            src={bannerImageUrl}
            alt={`${evento.nombre} Banner`}
            className="w-full h-64 object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/1200x300/E0F2F7/000?text=Banner+No+Disponible"; }}
          />
        </div>
      ) : (
        <div className="mb-8 rounded-lg overflow-hidden shadow-xl bg-gray-100 flex items-center justify-center h-64 text-gray-400">
          Banner no disponible
        </div>
      )}

      {/* Custom Event Header Section (YOUR DESIRED HEADER) */}


      {/* Event Description and Artwork */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acerca del Evento</h2>
          {evento.descripcionHTML ? (
            <div
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
            />
          ) : evento.descripcion ? (
            <p className="text-gray-700 leading-relaxed">
              {evento.descripcion}
            </p>
          ) : (
            <p className="text-gray-500">No hay descripción disponible para este evento.</p>
          )}
          {evento.resumenDescripcion && (
            <p className="text-gray-600 mt-4 italic">
              Resumen: {evento.resumenDescripcion}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center">
          {obraImageUrl || portadaImageUrl ? (
            <img
              src={obraImageUrl || portadaImageUrl}
              alt={`${evento.nombre} Artwork`}
              className="max-w-full h-auto rounded-md shadow-md"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x600/E0F2F7/000?text=Imagen+No+Disponible"; }}
            />
          ) : (
            <div className="text-gray-500">No hay imagen de obra disponible.</div>
          )}
        </div>
      </div>

      {/* Seating Map and Shopping Cart Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 seating-map-section bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Selecciona tus Asientos</h2>
          {funciones && funciones.length > 0 && (
            <select
              value={selectedFunctionId || ''}
              onChange={(e) => setSelectedFunctionId(e.target.value)}
              className="mb-4 p-2 border rounded-md w-full max-w-xs"
            >
              <option value="">Selecciona una función</option>
              {funciones.map(func => (
                <option key={func.id} value={func.id}>
                  {func.fecha_celebracion ? new Date(func.fecha_celebracion).toLocaleString('es-ES', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : `Función ${func.id}`}
                  {func.nombre && ` - ${func.nombre}`}
                </option>
              ))}
            </select>
          )}

          {mapa && selectedFunctionId ? (
            <SeatingMap
          mapa={{
            ...mapa,
            contenido: mapa.contenido.map(elemento => ({
              ...elemento,
              sillas: elemento.sillas.map(silla => ({
                ...silla,
                reserved: isSeatLocked(silla._id || silla.id),
                selected: cart ? cart.some(item => item.sillaId === (silla._id || silla.id) && item.functionId === selectedFunctionId) : false
              }))
            }))
          }}
          zonas={zonas}
          onClickSilla={toggleSillaEnCarrito} 
        />
      ) : (
        <div className="bg-gray-100 p-6 rounded-md text-center text-gray-500 shadow-sm">
          {funciones && funciones.length === 0 ? (
            "No hay funciones disponibles para este evento."
          ) : selectedFunctionId ? (
            "Cargando mapa de asientos..."
          ) : (
            "Por favor, selecciona una función para ver el mapa de asientos."
          )}
        </div>
      )}
        </div>

        <div className="lg:col-span-1 shopping-cart-section bg-white rounded-lg shadow-lg p-6">
        <Cart
          carrito={cart}
          setCarrito={setCart}
          funciones={funciones}
        />
        </div>
      </div>

      {/* About the Venue Section (Expanded) */}
      {recintoInfo && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acerca del Recinto: {recintoInfo.nombre}</h2>
          {recintoInfo.direccion && (
            <p className="text-gray-700 mb-2">
              <strong>Dirección:</strong> {recintoInfo.direccion}
            </p>
          )}
          {recintoInfo.capacidad && (
            <p className="text-gray-700 mb-2">
              <strong>Capacidad:</strong> {recintoInfo.capacidad} personas
            </p>
          )}
          {recintoInfo.descripcion && (
            <p className="text-gray-600 leading-relaxed mt-4">
              {recintoInfo.descripcion}
            </p>
          )}
          <VenueMap recintoInfo={recintoInfo} />
          {recintoInfo.latitud && recintoInfo.longitud && (
            <div className="mt-4 w-full h-64 rounded-md overflow-hidden shadow-md">
              <iframe
                title="Google Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${recintoInfo.latitud},${recintoInfo.longitud}&zoom=15`}
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Contact/Support Section (Example) */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">¿Necesitas Ayuda?</h2>
        <p className="text-gray-700 mb-4">
          Si tienes alguna pregunta sobre este evento o la compra de entradas, no dudes en contactarnos.
        </p>
        <p className="text-blue-600 hover:underline cursor-pointer">
          contacto@tudominio.com
        </p>
      </div>
    </div>
  );
}

export default EventPage;
