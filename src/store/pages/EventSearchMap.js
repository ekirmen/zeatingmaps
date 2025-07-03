import React, { useState } from 'react';
import { Input, List, Button } from 'antd';
import SeatingMap from '../components/SeatingMap';
import { supabase } from '../../supabaseClient';
import { fetchMapa, getFunciones } from '../services/apistore';

const EventSearchMap = () => {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [selectedFunc, setSelectedFunc] = useState(null);
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
      <List
        bordered
        dataSource={events}
        renderItem={(item) => (
          <List.Item onClick={() => selectEvent(item)} className="cursor-pointer">
            {item.nombre}
          </List.Item>
        )}
      />
      {functions.length > 0 && (
        <List
          bordered
          header={<div>Funciones</div>}
          dataSource={functions}
          renderItem={(fn) => (
            <List.Item onClick={() => selectFunction(fn)} className="cursor-pointer">
              {new Date(fn.fechaCelebracion).toLocaleString()}
            </List.Item>
          )}
        />
      )}
      {mapa && (
        <div className="border p-4">
          <SeatingMap mapa={mapa} onClickSilla={() => {}} />
        </div>
      )}
    </div>
  );
};

export default EventSearchMap;
