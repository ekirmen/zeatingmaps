import React, { useState, useEffect } from 'react';
import { useRecinto } from '../contexts/RecintoContext';
import Modal from 'react-modal';
import { fetchPlantillasPorRecintoYSala } from '../services/apibackoffice';

const Funciones = () => {
  const { recintoSeleccionado, salaSeleccionada, setRecintoSeleccionado, setSalaSeleccionada, recintos } = useRecinto();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingFuncion, setEditingFuncion] = useState(null);
  const [nuevaFuncion, setNuevaFuncion] = useState({
    fechaCelebracion: '',
    evento: '',
    sala: '',
    plantilla: '',
    inicioVenta: '',
    finVenta: '',
    pagoAPlazos: false,
    permitirReservasWeb: false,
  });

  // Fetch eventos when sala changes
  useEffect(() => {
    const fetchEventos = async () => {
      if (salaSeleccionada && recintoSeleccionado) {
        try {
          const response = await fetch(`http://localhost:5000/api/events?recinto=${recintoSeleccionado._id}&sala=${salaSeleccionada._id}`);
          const data = await response.json();
          setEventos(data);
          setEventoSeleccionado(null); // Reset selected event
        } catch (error) {
          console.error('Error fetching eventos:', error);
        }
      } else {
        setEventos([]);
      }
    };
    fetchEventos();
  }, [recintoSeleccionado, salaSeleccionada]);

  // Fetch funciones when evento changes
  useEffect(() => {
    const fetchFunciones = async () => {
      if (eventoSeleccionado) {
        try {
          const response = await fetch(`http://localhost:5000/api/funcions?evento=${eventoSeleccionado}`);
          const data = await response.json();
          setFunciones(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching funciones:', error);
        }
      } else {
        setFunciones([]);
      }
    };
    fetchFunciones();
  }, [eventoSeleccionado]);

  // Fetch plantillas when sala changes
  useEffect(() => {
    if (recintoSeleccionado && salaSeleccionada) {
      const fetchPlantillas = async () => {
        try {
          const data = await fetchPlantillasPorRecintoYSala(recintoSeleccionado._id, salaSeleccionada._id);
          setPlantillas(data);
        } catch (error) {
          console.error('Error fetching plantillas:', error);
        }
      };
      fetchPlantillas();
    }
  }, [recintoSeleccionado, salaSeleccionada]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const funcionData = {
      ...nuevaFuncion,
      sala: salaSeleccionada._id,
      evento: eventoSeleccionado
    };

    const url = editingFuncion 
      ? `http://localhost:5000/api/funcions/${editingFuncion._id}`
      : 'http://localhost:5000/api/funcions';
    const method = editingFuncion ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funcionData),
      });

      if (response.ok) {
        alert(editingFuncion ? 'Función actualizada' : 'Función creada');
        setModalIsOpen(false);
        setEditingFuncion(null);
        setNuevaFuncion({
          fechaCelebracion: '',
          evento: '',
          sala: '',
          plantilla: '',
          inicioVenta: '',
          finVenta: '',
          pagoAPlazos: false,
          permitirReservasWeb: false,
        });
        // Refresh funciones list
        const refreshResponse = await fetch(`http://localhost:5000/api/funcions?evento=${eventoSeleccionado}`);
        const refreshData = await refreshResponse.json();
        setFunciones(Array.isArray(refreshData) ? refreshData : []);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la función');
    }
  };

  const handleEdit = (funcion) => {
    setEditingFuncion(funcion);
    setNuevaFuncion({
      fechaCelebracion: funcion.fechaCelebracion.split('T')[0],
      evento: funcion.evento._id,
      sala: funcion.sala._id,
      plantilla: funcion.plantilla ? funcion.plantilla._id : '',
      inicioVenta: funcion.inicioVenta.split('T')[0],
      finVenta: funcion.finVenta.split('T')[0],
      pagoAPlazos: funcion.pagoAPlazos || false,
      permitirReservasWeb: funcion.permitirReservasWeb || false,
    });
    setModalIsOpen(true);
  };

  const handleDelete = async (funcionId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta función?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/funcions/${funcionId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Función eliminada');
          const refreshResponse = await fetch(`http://localhost:5000/api/funcions?evento=${eventoSeleccionado}`);
          const refreshData = await refreshResponse.json();
          setFunciones(Array.isArray(refreshData) ? refreshData : []);
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la función');
      }
    }
  };

  const handleDuplicate = async (funcionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/funcions/${funcionId}`);
      if (!response.ok) {
        alert('Error al obtener la función');
        return;
      }
      const funcionOriginal = await response.json();
      const { _id, __v, ...funcionDuplicada } = funcionOriginal;
      const saveResponse = await fetch('http://localhost:5000/api/funcions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funcionDuplicada),
      });
      if (!saveResponse.ok) {
        alert('Error al duplicar la función');
        return;
      }
      const refreshResponse = await fetch(`http://localhost:5000/api/funcions?evento=${eventoSeleccionado}`);
      const refreshData = await refreshResponse.json();
      setFunciones(Array.isArray(refreshData) ? refreshData : []);
    } catch (error) {
      console.error('Error al duplicar la función:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-semibold">Gestión de Funciones</h2>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex flex-col">
          <label>Recinto</label>
          <select
            value={recintoSeleccionado ? recintoSeleccionado._id : ''}
            onChange={(e) => {
              const recinto = recintos.find(r => r._id === e.target.value);
              setRecintoSeleccionado(recinto);
              setSalaSeleccionada(null);
            }}
          >
            <option value="">Seleccionar Recinto</option>
            {recintos.map(recinto => (
              <option key={recinto._id} value={recinto._id}>
                {recinto.nombre}
              </option>
            ))}
          </select>
        </div>

        {recintoSeleccionado && (
          <div className="flex flex-col">
            <label>Sala</label>
            <select
              value={salaSeleccionada ? salaSeleccionada._id : ''}
              onChange={(e) => {
                const sala = recintoSeleccionado.salas.find(s => s._id === e.target.value);
                setSalaSeleccionada(sala);
              }}
            >
              <option value="">Seleccionar Sala</option>
              {recintoSeleccionado.salas.map(sala => (
                <option key={sala._id} value={sala._id}>
                  {sala.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {salaSeleccionada && (
          <div className="flex flex-col">
            <label>Evento</label>
            <select
              value={eventoSeleccionado || ''}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar Evento</option>
              {eventos.map(evento => (
                <option key={evento._id} value={evento._id}>
                  {evento.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setModalIsOpen(true)}>
          Nueva Función
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th>Fecha Celebración</th>
            <th>Evento</th>
            <th>Sala</th>
            <th>Plantilla</th>
            <th>Inicio Venta</th>
            <th>Fin Venta</th>
            <th>Pago a plazos</th>
            <th>Reservas web</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {funciones.map(funcion => (
            <tr key={funcion._id}>
              <td>{new Date(funcion.fechaCelebracion).toLocaleDateString()}</td>
              <td>{funcion.evento.nombre}</td>
              <td>{funcion.sala.nombre}</td>
              <td>{funcion.plantilla ? funcion.plantilla.nombre : 'Plantilla eliminada'}</td>
              <td>{new Date(funcion.inicioVenta).toLocaleDateString()}</td>
              <td>{new Date(funcion.finVenta).toLocaleDateString()}</td>
              <td>{funcion.pagoAPlazos ? 'Sí' : 'No'}</td>
              <td>{funcion.permitirReservasWeb ? 'Sí' : 'No'}</td>
              <td className="space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => handleEdit(funcion)}>
                  Editar
                </button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(funcion._id)}>
                  Eliminar
                </button>
                <button className="text-gray-600 hover:underline" onClick={() => handleDuplicate(funcion._id)}>
                  Duplicar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setModalIsOpen(false);
          setEditingFuncion(null);
          setNuevaFuncion({
            fechaCelebracion: '',
            evento: '',
            sala: '',
            plantilla: '',
            inicioVenta: '',
            finVenta: '',
            pagoAPlazos: false,
            permitirReservasWeb: false,
          });
        }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-xl font-semibold mb-4 text-center">
          {editingFuncion ? 'Editar Función' : 'Nueva Función'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label>Fecha Celebración</label>
            <input
              type="date"
              className="border rounded p-2"
              value={nuevaFuncion.fechaCelebracion}
              onChange={(e) =>
                setNuevaFuncion({ ...nuevaFuncion, fechaCelebracion: e.target.value })
              }
              required
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label>Plantilla</label>
            <select
              className="border rounded p-2"
              value={nuevaFuncion.plantilla}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, plantilla: e.target.value })}
              required
            >
              <option value="">Seleccionar Plantilla</option>
              {plantillas.map(plantilla => (
                <option key={plantilla._id} value={plantilla._id}>
                  {plantilla.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label>Inicio Venta</label>
            <input
              type="date"
              className="border rounded p-2"
              value={nuevaFuncion.inicioVenta}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, inicioVenta: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label>Fin Venta</label>
            <input
              type="date"
              className="border rounded p-2"
              value={nuevaFuncion.finVenta}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, finVenta: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevaFuncion.pagoAPlazos}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, pagoAPlazos: e.target.checked })}
            />
            <label>Pago a plazos</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevaFuncion.permitirReservasWeb}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, permitirReservasWeb: e.target.checked })}
            />
            <label>Permite reservas a clientes web</label>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="text-red-600 hover:underline" onClick={() => setModalIsOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
              {editingFuncion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Funciones;