import React, { useState, useEffect } from 'react';
import CreateRecintoForm from '../components/CreateRecintoForm';
import EditRecintoForm from '../components/EditRecintoForm';
import AddSalaForm from '../components/AddSalaForm';
import EditSalaForm from '../components/EditSalaForm';

const Recinto = () => {
  const [recintos, setRecintos] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || '';
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
    try {
      const response = await fetch(`${API_URL}/api/recintos`);
      const data = await response.json();
      setRecintos(data);
    } catch (error) {
      console.error('Error al cargar los recintos:', error);
    }
  };

  const handleCreateRecinto = async (newRecinto) => {
    try {
      const responseRecinto = await fetch(`${API_URL}/api/recintos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecinto),
      });

      if (!responseRecinto.ok) {
        const errorData = await responseRecinto.json();
        throw new Error(errorData.message || 'No se pudo crear el recinto');
      }

      const dataRecinto = await responseRecinto.json();
      const recinto = dataRecinto.recinto;
      const sala = dataRecinto.sala;

      if (!sala || !sala.nombre) {
        alert('La sala no fue creada correctamente');
        return;
      }

      setRecintos((prevRecintos) => [
        ...prevRecintos,
        { ...recinto, salas: [sala] },
      ]);

      alert('Recinto y sala creados con éxito');
      setIsCreating(false);
    } catch (error) {
      console.error('Error al crear el recinto y la sala:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditRecinto = async (editedRecinto) => {
    try {
      const response = await fetch(`${API_URL}/api/recintos/${currentRecinto._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRecinto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo editar el recinto');
      }

      await fetchRecintos();
      alert('Recinto editado con éxito');
      setIsEditing(false);
      setCurrentRecinto(null);
    } catch (error) {
      console.error('Error al editar el recinto:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleAddSala = async (newSala) => {
    try {
      const response = await fetch(`${API_URL}/api/recintos/${currentRecinto._id}/salas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSala),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo agregar la sala');
      }

      const addedSala = await response.json();
      setRecintos((prevRecintos) =>
        prevRecintos.map((recinto) =>
          recinto._id === currentRecinto._id
            ? { ...recinto, salas: [...(recinto.salas || []), addedSala] }
            : recinto
        )
      );

      alert('Sala agregada con éxito');
      setIsAddingSala(false);
      setCurrentRecinto(null);
    } catch (error) {
      console.error('Error al agregar la sala:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditSala = async (recintoId, salaId, updatedSalaData) => {
    try {
      const response = await fetch(`${API_URL}/api/salas/${salaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSalaData),
      });

      if (!response.ok) throw new Error('Error al actualizar la sala');

      const updatedSala = await response.json();
      setRecintos(prevRecintos =>
        prevRecintos.map(recinto => {
          if (recinto._id === recintoId) {
            return {
              ...recinto,
              salas: recinto.salas.map(sala =>
                sala._id === salaId ? updatedSala : sala
              ),
            };
          }
          return recinto;
        })
      );

      setIsEditingSala(false);
      setCurrentSala(null);
      alert('Sala actualizada con éxito');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const handleDeleteSala = async (recintoId, salaId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sala?')) {
      try {
        const response = await fetch(`${API_URL}/api/salas/${salaId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Error al eliminar la sala');

        setRecintos(prevRecintos =>
          prevRecintos.map(recinto => {
            if (recinto._id === recintoId) {
              return {
                ...recinto,
                salas: recinto.salas.filter(sala => sala._id !== salaId),
              };
            }
            return recinto;
          })
        );

        alert('Sala eliminada con éxito');
      } catch (error) {
        console.error('Error:', error);
        alert(error.message);
      }
    }
  };

  const handleCancelCreate = () => setIsCreating(false);
  const handleCancelEdit = () => { setIsEditing(false); setCurrentRecinto(null); };
  const handleCancelAddSala = () => { setIsAddingSala(false); setCurrentRecinto(null); };

  const filteredRecintos = recintos.filter(recinto =>
    recinto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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
          <CreateRecintoForm onCreateRecinto={handleCreateRecinto} onCancel={handleCancelCreate} />
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Editar Recinto</h2>
              <button onClick={handleCancelEdit} className="text-gray-500 hover:text-red-600 text-xl">&times;</button>
            </div>
            <EditRecintoForm recinto={currentRecinto} onEditRecinto={handleEditRecinto} onCancel={handleCancelEdit} />
          </div>
        </div>
      )}

      {/* Agregar Sala Modal */}
      {isAddingSala && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Agregar Sala</h2>
              <button onClick={handleCancelAddSala} className="text-gray-500 hover:text-red-600 text-xl">&times;</button>
            </div>
            <AddSalaForm recinto={currentRecinto} onAddSala={handleAddSala} onCancel={handleCancelAddSala} />
          </div>
        </div>
      )}

      {/* Editar Sala Modal */}
      {isEditingSala && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Modificar Sala</h2>
              <button onClick={() => { setIsEditingSala(false); setCurrentSala(null); }} className="text-gray-500 hover:text-red-600 text-xl">&times;</button>
            </div>
            <EditSalaForm
              sala={currentSala}
              onEditSala={(updatedSalaData) => handleEditSala(currentRecinto._id, currentSala._id, updatedSalaData)}
              onCancel={() => { setIsEditingSala(false); setCurrentSala(null); }}
            />
          </div>
        </div>
      )}

      {/* Lista de Recintos */}
      <div className="grid gap-4">
        {currentRecintos.map((recinto) => (
          <div key={recinto._id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h2 className="text-xl font-semibold">{recinto.nombre}</h2>
                <p className="text-sm text-gray-700">Dirección: {recinto.direccion}</p>
                <p className="text-sm text-gray-700">Capacidad: {recinto.capacidad}</p>
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <button
                  onClick={() => { setCurrentRecinto(recinto); setIsEditing(true); }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => { setCurrentRecinto(recinto); setIsAddingSala(true); }}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Agregar Sala
                </button>
                <button
                  onClick={() => setShowSalas(prev => ({ ...prev, [recinto._id]: !prev[recinto._id] }))}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {showSalas[recinto._id] ? 'Ocultar Salas' : 'Mostrar Salas'}
                </button>
              </div>
            </div>

            {showSalas[recinto._id] && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Salas:</h3>
                {(recinto.salas || []).map((sala) => (
                  <div key={sala._id} className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2">
                    <span className="text-sm font-medium">{sala.nombre}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => { setCurrentSala(sala); setCurrentRecinto(recinto); setIsEditingSala(true); }}
                        className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSala(recinto._id, sala._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Eliminar
                      </button>
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
