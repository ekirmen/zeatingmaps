import React, { useState, useEffect } from 'react';
import CreateRecintoForm from '../components/CreateRecintoForm';
import EditRecintoForm from '../components/EditRecintoForm';
import AddSalaForm from '../components/AddSalaForm';
import EditSalaForm from '../components/EditSalaForm';
import { supabase } from '../../supabaseClient';

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

  const handleEditRecinto = async () => {
    try {
      await fetchRecintos();
      setIsEditing(false);
      setCurrentRecinto(null);
    } catch (error) {
      console.error('Error al actualizar lista de recintos:', error.message);
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
    if (!window.confirm('¿Estás seguro de que deseas eliminar este recinto y TODO lo relacionado (salas, mapas, eventos, funciones, plantillas, etc.)? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`/api/recintos/${recintoId}/delete`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Error eliminando el recinto');
      }
      await fetchRecintos();
      alert('Recinto y datos relacionados eliminados con éxito');
    } catch (error) {
      console.error('Error al eliminar recinto:', error);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Editar Recinto</h2>
                  <p className="text-sm text-gray-500 mt-1">Actualiza la información del recinto</p>
                </div>
                <button 
                  onClick={() => { setIsEditing(false); setCurrentRecinto(null); }} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              <EditRecintoForm 
                recinto={currentRecinto} 
                onEditRecinto={handleEditRecinto} 
                onCancel={() => setIsEditing(false)} 
              />
            </div>
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
          <div key={recinto.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{recinto.nombre}</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {recinto.direccion || 'Sin dirección'}
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Capacidad: {recinto.capacidad?.toLocaleString() || '0'} asientos
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {recinto.salas?.length || 0} salas
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <button 
                  onClick={() => { setCurrentRecinto(recinto); setIsEditing(true); }} 
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button 
                  onClick={() => { setCurrentRecinto(recinto); setIsAddingSala(true); }} 
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Sala
                </button>
                <button 
                  onClick={() => setShowSalas(prev => ({ ...prev, [recinto.id]: !prev[recinto.id] }))} 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {showSalas[recinto.id] ? 'Ocultar Salas' : 'Mostrar Salas'}
                </button>    
                <button 
                  onClick={() => handleDeleteRecinto(recinto.id)} 
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>

            {showSalas[recinto.id] && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Salas del Recinto
                </h3>
                <div className="grid gap-3">
                  {(recinto.salas || []).map((sala) => (
                    <div key={sala.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">{sala.nombre}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setCurrentSala(sala); setCurrentRecinto(recinto); setIsEditingSala(true); }} 
                          className="px-3 py-1 bg-amber-400 text-white rounded-md hover:bg-amber-500 transition-colors text-xs font-medium"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteSala(recinto.id, sala.id)} 
                          className="px-3 py-1 bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors text-xs font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!recinto.salas || recinto.salas.length === 0) && (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm">No hay salas configuradas</p>
                      <p className="text-xs">Haz clic en "Agregar Sala" para crear la primera</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recinto;
