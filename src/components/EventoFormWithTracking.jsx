import React, { useState } from 'react';
import { eventosService } from '../services/eventosService';
import { funcionesService } from '../services/funcionesService';
import { useUserTracking } from '../hooks/useUserTracking';

/**
 * Componente de ejemplo que muestra cómo usar los servicios con tracking automático
 */
const EventoFormWithTracking = ({ tenantId, onEventoCreated }) => {
  const [evento, setEvento] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tenant_id: tenantId
  });

  const [loading, setLoading] = useState(false);
  const { getCurrentUser } = useUserTracking();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // El tracking se agrega automáticamente en el servicio
      const nuevoEvento = await eventosService.crearEvento(evento);
      console.log('👤 Creado por:', getCurrentUser());

      // Limpiar formulario
      setEvento({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tenant_id: tenantId
      });

      // Notificar al componente padre
      if (onEventoCreated) {
        onEventoCreated(nuevoEvento);
      }

    } catch (error) {
      console.error('❌ Error al crear evento:', error);
      alert('Error al crear el evento. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEvento(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Crear Nuevo Evento</h2>
      <p className="text-sm text-gray-600 mb-4">
        👤 Usuario actual: <strong>{getCurrentUser()}</strong>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre del Evento
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={evento.nombre}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Concierto de Rock 2024"
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={evento.descripcion}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción del evento..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
              Fecha de Inicio
            </label>
            <input
              type="datetime-local"
              id="fecha_inicio"
              name="fecha_inicio"
              value={evento.fecha_inicio}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700">
              Fecha de Fin
            </label>
            <input
              type="datetime-local"
              id="fecha_fin"
              name="fecha_fin"
              value={evento.fecha_fin}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Evento'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800">📊 Tracking Automático</h3>
        <p className="text-xs text-blue-600 mt-1">
          Este formulario automáticamente agrega los campos:
          <br />• <strong>created_by</strong>: {getCurrentUser()}
          <br />• <strong>updated_by</strong>: {getCurrentUser()}
          <br />• <strong>created_at</strong>: Timestamp actual
          <br />• <strong>updated_at</strong>: Timestamp actual
        </p>
      </div>
    </div>
  );
};

export default EventoFormWithTracking;
