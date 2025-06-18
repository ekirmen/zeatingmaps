import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SupabaseEvents = () => {
  const [events, setEvents] = useState([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('id', { ascending: true });
    if (!error) setEvents(data || []);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase
      .from('events')
      .insert({ nombre: newName });
    if (!error) {
      setNewName('');
      loadEvents();
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from('events')
      .update({ nombre: editName })
      .eq('id', id);
    if (!error) {
      setEditId(null);
      setEditName('');
      loadEvents();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    if (!error) loadEvents();
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Administrar Eventos (Supabase)</h1>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-grow"
          placeholder="Nuevo nombre"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear
        </button>
      </div>
      <ul className="space-y-2">
        {events.map((ev) => (
          <li key={ev.id} className="border p-2 flex justify-between items-center">
            {editId === ev.id ? (
              <>
                <input
                  className="border p-1 flex-grow mr-2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button
                  onClick={() => handleUpdate(ev.id)}
                  className="bg-green-600 text-white px-2 py-1 mr-1 rounded"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setEditId(null); setEditName(''); }}
                  className="bg-gray-300 px-2 py-1 rounded"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span>{ev.nombre}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => { setEditId(ev.id); setEditName(ev.nombre); }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SupabaseEvents;
