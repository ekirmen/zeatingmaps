import React, { useState } from 'react';
import { Input, List, Button } from 'antd';
import LoadOnVisible from '../../components/LoadOnVisible';
import { SeatMapSkeleton } from '../../components/SkeletonLoaders';
import { supabase } from '../../supabaseClient';
import { fetchMapa, getFunciones } from '../services/apistore';

const EventSearchMap = () => {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Used now
  const [functions, setFunctions] = useState([]);
  const [selectedFunc, setSelectedFunc] = useState(null); // Used now
  const [mapa, setMapa] = useState(null);

  const handleSearch = async () => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .ilike('nombre', `%${query}%`);
    if (!error) setEvents(data || []);
  };

  const selectEvent = async (ev) => {
    setSelectedEvent(ev);
    setSelectedFunc(null);
    setMapa(null);
    const funcs = await getFunciones(ev.id);
    setFunctions(Array.isArray(funcs) ? funcs : []);
  };

  const selectFunction = async (fn) => {
    setSelectedFunc(fn);
    const m = await fetchMapa(fn.sala);
    setMapa(m);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar evento"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button onClick={handleSearch}>Buscar</Button>
      </div>

      {/* Conditionally render the list only if there are events */}
      {events.length > 0 && (
        <List
          bordered
          header={<div>Resultados de la Búsqueda</div>}
          dataSource={events}
          renderItem={(item) => (
            <List.Item onClick={() => selectEvent(item)} className="cursor-pointer hover:bg-gray-100">
              {item.nombre}
            </List.Item>
          )}
        />
      )}

      {/* ✨ FIX: Use selectedEvent to show which event is selected */}
      {selectedEvent && functions.length > 0 && (
        <List
          bordered
          header={<div>Funciones para: <strong>{selectedEvent.nombre}</strong></div>}
          dataSource={functions}
          renderItem={(fn) => (
            <List.Item
              onClick={() => selectFunction(fn)}
              className="cursor-pointer hover:bg-gray-100"
              // Highlight the selected function
              style={{ backgroundColor: selectedFunc?.id === fn.id ? '#e6f7ff' : 'transparent' }}
            >
              {fn.fechaCelebracion ? new Date(fn.fechaCelebracion).toLocaleString() : 'Fecha no disponible'}
            </List.Item>
          )}
        />
      )}
      
      {/* ✨ FIX: Use selectedFunc to show details about the selected map */}
      {mapa && selectedFunc && (
          <div className="border p-4">
            <h3>Mapa de asientos para la función del {selectedFunc.fechaCelebracion ? new Date(selectedFunc.fechaCelebracion).toLocaleString() : 'fecha no disponible'}</h3>
            <LoadOnVisible
              loader={() => import('../../components/SeatingMap')}
              fallback={<SeatMapSkeleton />}
              rootMargin="400px"
              loaderProps={{ mapa, onClickSilla: () => {} }}
            />
          </div>
      )}
    </div>
  );
};

export default EventSearchMap;