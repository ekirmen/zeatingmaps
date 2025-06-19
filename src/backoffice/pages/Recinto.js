import React, { useState, useEffect } from 'react';
import CreateRecintoForm from '../components/CreateRecintoForm';
import EditRecintoForm from '../components/EditRecintoForm';
import AddSalaForm from '../components/AddSalaForm';
import EditSalaForm from '../components/EditSalaForm';
import { supabase } from '../services/supabaseClient';

const Recinto = () => {
  const [recintos, setRecintos] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSala, setIsAddingSala] = useState(false);
  const [currentRecinto, setCurrentRecinto] = useState(null);
  const [isEditingSala, setIsEditingSala] = useState(false);
  const [currentSala, setCurrentSala] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSalas, setShowSalas] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const recordsPerPage = 10;

  useEffect(() => {
    fetchRecintos();
  }, []);

  const fetchRecintos = async () => {
    const { data, error } = await supabase
      .from('recintos')
      .select('*, salas(*)');

    if (error) {
      console.error('Error al obtener recintos:', error.message);
    } else {
      setRecintos(data);
    }
  };

  const handleCreateRecinto = async (newRecinto) => {
    try {
      const { data: recinto, error: errorRecinto } = await supabase
        .from('recintos')
        .insert([newRecinto])
        .select()
        .single();
  
      if (errorRecinto) throw errorRecinto;
  
      const salaInicial = {
        nombre: 'Sala Principal',
        recinto_id: recinto.id, // corregido
      };
  
      const { data: sala, error: errorSala } = await supabase
        .from('salas')
        .insert([salaInicial])
        .select()
        .single();
  
      if (errorSala) throw errorSala;
  
      setRecintos((prev) => [...prev, { ...recinto, salas: [sala] }]);
      alert('Recinto y sala creados con éxito');
      setIsCreating(false);
    } catch (error) {
      console.error('Error al crear recinto:', error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditRecinto = async (editedRecinto) => {
    try {
      const { error } = await supabase
        .from('recintos')
        .update(editedRecinto)
        .eq('id', currentRecinto.id);

      if (error) throw error;

      await fetchRecintos();
      setIsEditing(false);
      setCurrentRecinto(null);
      alert('Recinto editado con éxito');
    } catch (error) {
      console.error('Error al editar recinto:', error.message);
      alert(error.message);
    }
  };

  const handleAddSala = async (newSala) => {
    try {
      const { data: sala, error } = await supabase
        .from('salas')
        .insert([{ ...newSala, recinto_id: currentRecinto.id }]) // corregido
        .select()
        .single();
  
      if (error) throw error;
  
      setRecintos((prev) =>
        prev.map((r) =>
          r.id === currentRecinto.id
            ? { ...r, salas: [...(r.salas || []), sala] }
            : r
        )
      );
  
      alert('Sala agregada con éxito');
      setIsAddingSala(false);
      setCurrentRecinto(null);
    } catch (error) {
      console.error('Error al agregar sala:', error.message);
      alert(error.message);
    }
  };

  const handleEditSala = async (recintoId, salaId, updatedSalaData) => {
    try {
      const { error } = await supabase
        .from('salas')
        .update(updatedSalaData)
        .eq('id', salaId);

      if (error) throw error;

      await fetchRecintos();
      setIsEditingSala(false);
      setCurrentSala(null);
      alert('Sala actualizada con éxito');
    } catch (error) {
      console.error('Error al editar sala:', error.message);
      alert(error.message);
    }
  };

  const handleDeleteSala = async (recintoId, salaId) => {
    if (!window.confirm('¿Deseas eliminar esta sala?')) return;

    try {
      const { error } = await supabase
        .from('salas')
        .delete()
        .eq('id', salaId);

      if (error) throw error;

      await fetchRecintos();
      alert('Sala eliminada con éxito');
    } catch (error) {
      console.error('Error al eliminar sala:', error.message);
      alert(error.message);
    }
  };

  const handleDeleteRecinto = async (recintoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este recinto y todas sus salas?')) return;
  
    try {
      // Eliminar salas primero
      const { error: errorSalas } = await supabase
        .from('salas')
        .delete()
        .eq('recinto_id', recintoId); // corregido
  
      if (errorSalas) throw errorSalas;
  
      // Luego eliminar el recinto
      const { error: errorRecinto } = await supabase
        .from('recintos')
        .delete()
        .eq('id', recintoId);
  
      if (errorRecinto) throw errorRecinto;
  
      await fetchRecintos();
      alert('Recinto y sus salas eliminados con éxito');
    } catch (error) {
      console.error('Error al eliminar recinto y salas:', error.message);
      alert(error.message);
    }
  };

  const filteredRecintos = recintos.filter((recinto) =>
    recinto.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRecinto = currentPage * recordsPerPage;
  const indexOfFirstRecinto = indexOfLastRecinto - recordsPerPage;
  const currentRecintos = filteredRecintos.slice(indexOfFirstRecinto, indexOfLastRecinto);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Recintos</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Buscar recinto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Crear Recinto
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white p-4 rounded-md shadow-md mb-4">
          <CreateRecintoForm
            onCreateRecinto={handleCreateRecinto}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Editar Recinto</h2>
              <button onClick={() => { setIsEditing(false); setCurrentRecinto(null); }} className="text-gray-500 hover:text-red-600 text-xl">&times;</button>
            </div>
            <EditRecintoForm recinto={currentRecinto} onEditRecinto={handleEditRecinto} onCancel={() => setIsEditing(false)} />
          </div>
        </div>
      )}

      {isAddingSala && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Agregar Sala</h2>
              <button onClick={() => { setIsAddingSala(false); setCurrentRecinto(null); }} className="text-gray-500 hover:text-red-600 text-xl">&times;</button>
            </div>
            <AddSalaForm recinto={currentRecinto} onAddSala={handleAddSala} onCancel={() => setIsAddingSala(false)} />
          </div>
        </div>
      )}

      {isEditingSala && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Editar Sala</h2>
              <button onClick={() => { setIsEditingSala(false); setCurrentSala(null); }} className="text-gray-500 hover:text-red-600 text-xl">&times;</button>
            </div>
            <EditSalaForm
              sala={currentSala}
              onEditSala={(updatedData) => handleEditSala(currentRecinto.id, currentSala.id, updatedData)}
              onCancel={() => { setIsEditingSala(false); setCurrentSala(null); }}
            />
          </div>
        </div>
      )}

      {/* Lista de Recintos */}
      <div className="grid gap-4">
        {currentRecintos.map((recinto) => (
          <div key={recinto.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h2 className="text-xl font-semibold">{recinto.nombre}</h2>
                <p className="text-sm text-gray-700">Dirección: {recinto.direccion}</p>
                <p className="text-sm text-gray-700">Capacidad: {recinto.capacidad}</p>
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <button onClick={() => { setCurrentRecinto(recinto); setIsEditing(true); }} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Editar</button>
                <button onClick={() => { setCurrentRecinto(recinto); setIsAddingSala(true); }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Agregar Sala</button>
                <button onClick={() => setShowSalas(prev => ({ ...prev, [recinto.id]: !prev[recinto.id] }))} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  {showSalas[recinto.id] ? 'Ocultar Salas' : 'Mostrar Salas'}
                </button>
                <button
            onClick={() => setShowSalas(prev => ({ ...prev, [recinto.id]: !prev[recinto.id] }))}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showSalas[recinto.id] ? 'Ocultar Salas' : 'Mostrar Salas'}
          </button>
            <button
    onClick={() => handleDeleteRecinto(recinto.id)}
    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
  >
    Eliminar Recinto
            </button>
              </div>
            </div>

            {showSalas[recinto.id] && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Salas:</h3>
                {(recinto.salas || []).map((sala) => (
                  <div key={sala.id} className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2">
                    <span className="text-sm font-medium">{sala.nombre}</span>
                    <div className="space-x-2">
                      <button onClick={() => { setCurrentSala(sala); setCurrentRecinto(recinto); setIsEditingSala(true); }} className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Editar</button>
                      <button onClick={() => handleDeleteSala(recinto.id, sala.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recinto;
