import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecintoSala } from '../contexts/RecintoSalaContext'; // Contexto para mantener recinto y sala
import { fetchZonasPorSala, createZona, updateZona, deleteZona } from '../services/apibackoffice'; // Funciones de API
import Modal from 'react-modal'; // Para el popup modal
// import './Plano.css';  <-- Ya no es necesario con Tailwind

Modal.setAppElement('#root'); // Importante para accesibilidad (ajusta según tu app)

const Plano = () => {
  const { recinto, setRecinto, sala, setSala } = useRecintoSala();
  const [recintos, setRecintos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [nuevaZona, setNuevaZona] = useState({
    nombre: '',
    color: '#000000',
    aforo: 0,
    numerada: false,
  });
  const [prevAforo, setPrevAforo] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingZona, setEditingZona] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const fetchRecintosYSalas = async () => {
      try {
        const resRecintos = await fetch('http://localhost:5000/api/recintos');
        const recintosData = await resRecintos.json();
        setRecintos(recintosData);
      } catch (error) {
        console.error('Error al cargar los recintos:', error);
      }
    };
    fetchRecintosYSalas();
  }, []);

  useEffect(() => {
    if (sala) {
      const fetchZonas = async () => {
        try {
          const zonasData = await fetchZonasPorSala(sala._id);
          setZonas(Array.isArray(zonasData) ? zonasData : []);
        } catch (error) {
          console.error('Error al cargar las zonas:', error);
          setZonas([]);
        }
      };
      fetchZonas();
    } else {
      setZonas([]);
    }
  }, [sala]);

  const handleCrearZona = async () => {
    if (!sala) {
      alert('Por favor selecciona una sala.');
      return;
    }
    try {
      const nuevaZonaData = { ...nuevaZona, sala: sala._id };
      const zonaCreada = await createZona(nuevaZonaData);
      setZonas([...zonas, zonaCreada]);
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
      setModalIsOpen(false);
    } catch (error) {
      console.error('Error al crear la zona:', error);
    }
  };

  const handleNavigateToCrearMapa = () => {
    if (!sala) {
      alert('Por favor selecciona una sala para crear un mapa.');
      return;
    }
    navigate(`/dashboard/crear-mapa/${sala._id}`);
  };

  const handleEditZona = async () => {
    try {
      const zonaData = {
        ...nuevaZona,
        sala: sala._id
      };
      const updatedZona = await updateZona(editingZona._id, zonaData);
      setZonas(zonas.map(z => z._id === editingZona._id ? updatedZona : z));
      setModalIsOpen(false);
      setEditingZona(null);
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
    } catch (error) {
      console.error('Error al editar la zona:', error);
      alert(error.message);
    }
  };

  const handleDeleteZona = async (zonaId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta zona?')) {
      try {
        await deleteZona(zonaId);
        setZonas(zonas.filter(z => z._id !== zonaId));
      } catch (error) {
        console.error('Error al eliminar la zona:', error);
        alert(error.message);
      }
    }
  };

  const filteredZonas = zonas.filter(zona =>
    zona.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastZona = currentPage * recordsPerPage;
  const indexOfFirstZona = indexOfLastZona - recordsPerPage;
  const currentZonas = filteredZonas.slice(indexOfFirstZona, indexOfLastZona);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Gestión de Zonas</h1>

        {/* Selector controls */}
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Recinto:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={recinto ? recinto._id : ''}
              onChange={(e) => {
                const recintoSeleccionado = recintos.find(r => r._id === e.target.value);
                setRecinto(recintoSeleccionado);
                setSala(null);
              }}
            >
              <option value="">Seleccionar un recinto</option>
              {recintos.map(recinto => (
                <option key={recinto._id} value={recinto._id}>
                  {recinto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Sala:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={sala ? sala._id : ''}
              onChange={(e) => {
                const salaSeleccionada = recinto?.salas?.find(s => s._id === e.target.value);
                setSala(salaSeleccionada);
              }}
              disabled={!recinto}
            >
              <option value="">Seleccionar una sala</option>
              {recinto?.salas?.map(sala => (
                <option key={sala._id} value={sala._id}>
                  {sala.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Show message when no sala is selected */}
        {!sala && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded mb-6">
            Por favor, seleccione un recinto y una sala para gestionar las zonas.
          </div>
        )}

        {/* Gestión de Zonas */}
        {sala && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Zonas de la sala: {sala.nombre}</h2>

            {zonas.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="mb-4 text-gray-600">No hay zonas creadas para esta sala.</p>
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                  onClick={() => setModalIsOpen(true)}
                >
                  Crear Primera Zona
                </button>
              </div>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {zonas.map((zona) => (
                    <li
                      key={zona._id}
                      className="flex justify-between items-center border border-gray-200 rounded px-4 py-3 shadow-sm"
                    >
                      <div>
                        <span
                          className="font-semibold"
                          style={{ color: zona.color }}
                        >
                          {zona.nombre}
                        </span>
                        <span className="ml-2 text-gray-600">- Aforo: {zona.aforo}</span>
                      </div>
                      <div className="space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                          onClick={() => {
                            setEditingZona(zona);
                            setNuevaZona(zona);
                            setModalIsOpen(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 font-medium"
                          onClick={() => handleDeleteZona(zona._id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  onClick={() => setModalIsOpen(true)}
                >
                  Crear Nueva Zona
                </button>
              </>
            )}

            <div className="mt-6">
              <button
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
                onClick={handleNavigateToCrearMapa}
              >
                Crear Mapa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar Zona */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setModalIsOpen(false);
          setEditingZona(null);
          setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
        }}
        contentLabel={editingZona ? "Editar Zona" : "Crear Zona"}
        className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50"
      >
        <h2 className="text-2xl font-semibold mb-4">{editingZona ? 'Editar Zona' : 'Crear Nueva Zona'}</h2>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Nombre:</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={nuevaZona.nombre}
              onChange={(e) => setNuevaZona({ ...nuevaZona, nombre: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Color:</label>
            <input
              type="color"
              className="w-16 h-10 p-0 border border-gray-300 rounded cursor-pointer"
              value={nuevaZona.color}
              onChange={(e) => setNuevaZona({ ...nuevaZona, color: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Aforo:</label>
            <input
              type="number"
              className={`border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${nuevaZona.numerada ? 'bg-gray-200 cursor-not-allowed' : ''}`}
              value={nuevaZona.aforo}
              disabled={nuevaZona.numerada}
              onChange={(e) => setNuevaZona({ ...nuevaZona, aforo: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="numerada"
              checked={nuevaZona.numerada}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  setPrevAforo(nuevaZona.aforo);
                  setNuevaZona({ ...nuevaZona, numerada: true, aforo: 0 });
                } else {
                  setNuevaZona({ ...nuevaZona, numerada: false, aforo: prevAforo });
                }
              }}
              className="w-4 h-4"
            />
            <label htmlFor="numerada" className="font-medium text-gray-700">Numerada</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setModalIsOpen(false);
                setEditingZona(null);
                setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
              }}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={editingZona ? handleEditZona : handleCrearZona}
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              {editingZona ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Plano;
