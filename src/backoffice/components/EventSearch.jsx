import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const EventSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const navigate = useNavigate();

  // Cargar última selección del localStorage
  useEffect(() => {
    const lastEvent = localStorage.getItem('lastSelectedEvent');
    const lastFunction = localStorage.getItem('lastSelectedFunction');
    
    if (lastEvent) {
      try {
        setSelectedEvent(JSON.parse(lastEvent));
      } catch (e) {
        console.error('Error parsing last event:', e);
      }
    }
    
    if (lastFunction) {
      try {
        setSelectedFunction(JSON.parse(lastFunction));
      } catch (e) {
        console.error('Error parsing last function:', e);
      }
    }
  }, []);

  const searchEvents = async (term) => {
    if (!term || term.length < 2) {
      setEvents([]);
      setFunctions([]);
      return;
    }

    setLoading(true);
    try {
      // Buscar eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select('id, nombre, fecha_evento')
        .ilike('nombre', `%${term}%`)
        .eq('activo', true)
        .limit(5);

      if (eventsError) throw eventsError;

      // Buscar funciones
      const { data: functionsData, error: functionsError } = await supabase
        .from('funciones')
        .select(`
          id, 
          nombre, 
          fecha, 
          hora_inicio,
          eventos!inner(id, nombre)
        `)
        .ilike('nombre', `%${term}%`)
        .limit(5);

      if (functionsError) throw functionsError;

      setEvents(eventsData || []);
      setFunctions(functionsData || []);
    } catch (error) {
      console.error('Error searching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchEvents(value);
    setShowDropdown(true);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSelectedFunction(null);
    localStorage.setItem('lastSelectedEvent', JSON.stringify(event));
    setSearchTerm(event.nombre);
    setShowDropdown(false);
    
    // Navegar a boletería con el evento seleccionado
    navigate('/dashboard/boleteria', { 
      state: { selectedEventId: event.id } 
    });
  };

  const handleFunctionSelect = (func) => {
    setSelectedFunction(func);
    setSelectedEvent(func.eventos);
    localStorage.setItem('lastSelectedFunction', JSON.stringify(func));
    localStorage.setItem('lastSelectedEvent', JSON.stringify(func.eventos));
    setSearchTerm(`${func.eventos.nombre} - ${func.nombre}`);
    setShowDropdown(false);
    
    // Navegar a boletería con la función seleccionada
    navigate('/dashboard/boleteria', { 
      state: { 
        selectedEventId: func.eventos.id,
        selectedFunctionId: func.id 
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="relative">
      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar eventos o funciones..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (events.length > 0 || functions.length > 0) && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Eventos */}
          {events.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                Eventos
              </div>
              {events.map((event) => (
                <div
                  key={`event-${event.id}`}
                  onClick={() => handleEventSelect(event)}
                  className="px-2 py-2 hover:bg-blue-50 cursor-pointer rounded"
                >
                  <div className="font-medium text-sm">{event.nombre}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(event.fecha_evento)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Funciones */}
          {functions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                Funciones
              </div>
              {functions.map((func) => (
                <div
                  key={`function-${func.id}`}
                  onClick={() => handleFunctionSelect(func)}
                  className="px-2 py-2 hover:bg-blue-50 cursor-pointer rounded"
                >
                  <div className="font-medium text-sm">
                    {func.eventos.nombre} - {func.nombre}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(func.fecha)} {formatTime(func.hora_inicio)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Información de la selección actual */}
      {selectedEvent && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900">
            {selectedEvent.nombre}
          </div>
          {selectedFunction && (
            <div className="text-xs text-blue-700 mt-1">
              Función: {selectedFunction.nombre} - {formatDate(selectedFunction.fecha)} {formatTime(selectedFunction.hora_inicio)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventSearch; 
