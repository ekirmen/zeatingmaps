// EventMap.js - Contenedor que carga datos del mapa
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchMapa, getFuncion } from '../services/apistore';
import EventMapDisplay from '../components/EventMapDisplay';

function EventMap() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const funcionParam = searchParams.get('funcion');
  
  const [mapa, setMapa] = useState(null);
  const [funcion, setFuncion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!funcionParam) {
          throw new Error('Parámetro de función requerido');
        }

        // Obtener la función
        const funcionData = await getFuncion(funcionParam);
        if (!funcionData) {
          throw new Error('Función no encontrada');
        }
        setFuncion(funcionData);

        // Obtener el mapa si hay sala
        if (funcionData.sala?.id) {
          const mapaData = await fetchMapa(funcionData.sala.id);
          setMapa(mapaData);
        } else {
          throw new Error('Sala no encontrada para esta función');
        }

      } catch (err) {
        console.error('Error cargando mapa:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (funcionParam) {
      loadMapData();
    }
  }, [funcionParam]);

  const toggleSillaEnCarrito = (silla, elemento) => {
    // Implementar lógica de carrito aquí
    console.log('Toggle silla:', silla, elemento);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg shadow-inner">
        <div className="text-gray-600">Cargando mapa de asientos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg shadow-inner">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!mapa) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg shadow-inner">
        <div className="text-gray-600">No se encontró mapa para esta función</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {funcion && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900">
            Mapa de Asientos - {funcion.evento?.nombre || 'Evento'}
          </h2>
          <p className="text-blue-700">
            Función: {new Date(funcion.fecha_celebracion).toLocaleString('es-ES')}
          </p>
        </div>
      )}
      
      <EventMapDisplay 
        mapa={mapa} 
        toggleSillaEnCarrito={toggleSillaEnCarrito} 
      />
    </div>
  );
}

export default EventMap;
