import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Para accesibilidad

const PlantillaPrecios = () => {
  const [recintos, setRecintos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [zonas, setZonas] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [detallesPrecios, setDetallesPrecios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [recinto, setRecinto] = useState(null);
  const [sala, setSala] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [editingPlantilla, setEditingPlantilla] = useState(null);

  // Cargar recintos
  useEffect(() => {
    const obtenerRecintos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/recintos');
        const data = await response.json();
        setRecintos(data);
      } catch (error) {
        console.error('No se pudieron obtener los recintos:', error);
      }
    };
    obtenerRecintos();
  }, []);

  useEffect(() => {
    if (recinto) {
      setSalas(recinto.salas);
    }
  }, [recinto]);

  useEffect(() => {
    if (sala) {
      const obtenerZonas = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/zonas/sala/${sala._id}`);
          const zonasData = await response.json();
          setZonas(zonasData);
        } catch (error) {
          console.error('Error al cargar las zonas:', error);
        }
      };
      obtenerZonas();
    }
  }, [sala]);

  useEffect(() => {
    if (recinto) {
      const obtenerEntradas = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/entradas/recinto/${recinto._id}`);
          if (!response.ok) {
            throw new Error('Error al obtener las entradas');
          }
          const entradasData = await response.json();
          if (!Array.isArray(entradasData)) {
            console.error('La respuesta de la API no es un array:', entradasData);
            setEntradas([]);
            return;
          }
          setEntradas(entradasData);
        } catch (error) {
          console.error('Error al cargar las entradas:', error);
          setEntradas([]);
        }
      };
      obtenerEntradas();
    }
  }, [recinto]);

  const cargarPlantillas = useCallback(async () => {
    if (recinto && sala) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/plantillas/recinto/${recinto._id}/sala/${sala._id}`
        );
  
        if (!response.ok) {
          if (response.status === 404) {
            console.error('No se encontraron plantillas para este recinto y sala.');
            setPlantillas([]);
            return;
          }
          throw new Error('Error al obtener las plantillas');
        }
  
        const data = await response.json();
  
        if (!Array.isArray(data)) {
          console.error('La respuesta de la API no es un array:', data);
          setPlantillas([]);
          return;
        }
  
        setPlantillas(data);
      } catch (error) {
        console.error('Error al cargar las plantillas:', error);
        setPlantillas([]);
      }
    }
  }, [recinto, sala]);

  useEffect(() => {
    cargarPlantillas();
  }, [cargarPlantillas]);

  const handleInputChange = (zonaId, productoId, field, value) => {
    const updatedDetalles = [...detallesPrecios];
    const index = updatedDetalles.findIndex(
      (item) => item.zonaId === zonaId && item.productoId === productoId
    );

    const numericFields = ['precio', 'comision', 'precioGeneral', 'orden'];
    let processedValue = numericFields.includes(field) ? Number(value) : value;

    if (numericFields.includes(field) && processedValue < 0) {
      alert('No se permiten valores negativos. El valor será establecido a 0.');
      processedValue = 0;
    }

    if (index !== -1) {
      if (value === '') {
        delete updatedDetalles[index][field];
      } else {
        updatedDetalles[index] = {
          ...updatedDetalles[index],
          [field]: processedValue
        };
      }
    } else {
      if (value !== '') {
        updatedDetalles.push({
          zonaId,
          productoId,
          precio: field === 'precio' ? processedValue : undefined,
          comision: field === 'comision' ? processedValue : undefined,
          precioGeneral: field === 'precioGeneral' ? processedValue : undefined,
          canales: field === 'canales' ? value : '',
          orden: field === 'orden' ? processedValue : undefined
        });
      }
    }

    setDetallesPrecios(updatedDetalles);
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();

    const detallesConPrecio = detallesPrecios.filter(
      (zona) => zona.precio !== '' && zona.precio >= 0
    );

    if (detallesConPrecio.length === 0) {
      alert('Debe haber al menos una zona con precio (puede ser 0 para cortesías).');
      return;
    }

    const plantillaData = {
      nombre: nombrePlantilla,
      recinto: recinto._id,
      sala: sala._id,
      detalles: detallesConPrecio,
    };

    try {
      const url = editingPlantilla 
        ? `http://localhost:5000/api/plantillas/${editingPlantilla._id}`
        : 'http://localhost:5000/api/plantillas';
      
      const method = editingPlantilla ? 'PUT' : 'POST';
  
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plantillaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la plantilla');
      }

      await response.json();
      alert(editingPlantilla ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente');
      setDetallesPrecios([]);
      setNombrePlantilla('');
      setEditingPlantilla(null);
      closeModal();
      await cargarPlantillas();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const handleNombreChange = (e) => {
    setNombrePlantilla(e.target.value);
  };

  const handleEditPlantilla = (plantilla) => {
    setEditingPlantilla(plantilla);
    setNombrePlantilla(plantilla.nombre);
    setDetallesPrecios(plantilla.detalles);
    setModalIsOpen(true);
  };

  const handleDeletePlantilla = async (plantillaId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/plantillas/${plantillaId}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar la plantilla');
        setPlantillas(plantillas.filter(p => p._id !== plantillaId));
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la plantilla');
      }
    }
  };

  const getCombinedItems = () => {
    if (!Array.isArray(zonas)) {
      console.error('Zonas no es un array:', zonas);
      return [];
    }

    if (!Array.isArray(entradas)) {
      console.error('Entradas no es un array:', entradas);
      return [];
    }

    const combinedItems = [];
    zonas.forEach((zona) => {
      entradas.forEach((entrada) => {
        combinedItems.push({
          zonaId: zona._id,
          zona: zona.nombre,
          producto: entrada.producto,
          productoId: entrada._id,
        });
      });
    });
    return combinedItems;
  };

  const combinedItems = getCombinedItems();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = combinedItems.slice(indexOfFirstItem, indexOfLastItem);

  const closeModal = () => {
    setModalIsOpen(false);
    setEditingPlantilla(null);
    setNombrePlantilla('');
    setDetallesPrecios([]);
  };

  const renderTable = () => {
    if (!Array.isArray(zonas) || zonas.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No tienes zonas creadas
          </td>
        </tr>
      );
    }

    if (!Array.isArray(entradas) || entradas.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No has creado el tipo de boleto
          </td>
        </tr>
      );
    }

    if (combinedItems.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No has creado plantilla de precios
          </td>
        </tr>
      );
    }

    return currentItems.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">{item.zona}</td>
        <td className="px-6 py-4 whitespace-nowrap">{item.producto}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            placeholder="Precio"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={
              detallesPrecios.find(
                (det) => det.zonaId === item.zonaId && det.productoId === item.productoId
              )?.precio ?? ''
            }
            onChange={(e) => handleInputChange(item.zonaId, item.productoId, 'precio', e.target.value)}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            placeholder="Comisión"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={
              detallesPrecios.find(
                (det) => det.zonaId === item.zonaId && det.productoId === item.productoId
              )?.comision || ''
            }
            onChange={(e) => handleInputChange(item.zonaId, item.productoId, 'comision', e.target.value)}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            placeholder="Precio General"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={
              detallesPrecios.find(
                (det) => det.zonaId === item.zonaId && det.productoId === item.productoId
              )?.precioGeneral || ''
            }
            onChange={(e) =>
              handleInputChange(item.zonaId, item.productoId, 'precioGeneral', e.target.value)
            }
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="text"
            placeholder="Canales"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={
              detallesPrecios.find(
                (det) => det.zonaId === item.zonaId && det.productoId === item.productoId
              )?.canales || ''
            }
            onChange={(e) => handleInputChange(item.zonaId, item.productoId, 'canales', e.target.value)}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            placeholder="Orden"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={
              detallesPrecios.find(
                (det) => det.zonaId === item.zonaId && det.productoId === item.productoId
              )?.orden || ''
            }
            onChange={(e) => handleInputChange(item.zonaId, item.productoId, 'orden', e.target.value)}
          />
        </td>
      </tr>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Plantilla de Precios</h2>
  
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Select Recinto */}
          <select
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={recinto ? recinto._id : ''}
            onChange={(e) => {
              const recintoSeleccionado = recintos.find((r) => r._id === e.target.value);
              setRecinto(recintoSeleccionado);
              setSala(null);
            }}
          >
            <option value="" disabled>Seleccionar Recinto</option>
            {recintos.map((item) => (
              <option key={item._id} value={item._id}>
                {item.nombre}
              </option>
            ))}
          </select>
  
          {/* Select Sala */}
          {salas.length > 0 && (
            <select
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sala ? sala._id : ''}
              onChange={(e) => {
                const salaSeleccionada = salas.find((s) => s._id === e.target.value);
                setSala(salaSeleccionada);
              }}
            >
              <option value="" disabled>Seleccionar Sala</option>
              {salas.map((salaItem) => (
                <option key={salaItem._id} value={salaItem._id}>
                  {salaItem.nombre}
                </option>
              ))}
            </select>
          )}
  
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setModalIsOpen(true)}
            disabled={!recinto || !sala}
          >
            Añadir Plantilla
          </button>
        </div>
  
        {/* Lista de Plantillas */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Plantillas Guardadas</h3>
          {plantillas.length === 0 ? (
            <p className="text-gray-500 italic">No hay plantillas guardadas para este recinto y sala</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantillas.map((plantilla) => (
                <div key={plantilla._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">{plantilla.nombre}</h4>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Recinto:</span> {recinto?.nombre}</p>
                    <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Sala:</span> {sala?.nombre}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Zonas:</span> {plantilla.detalles?.length || 0}</p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 flex justify-end gap-2">
                    <button 
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                      onClick={() => handleEditPlantilla(plantilla)}
                    >
                      Editar
                    </button>
                    <button 
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      onClick={() => handleDeletePlantilla(plantilla._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel={editingPlantilla ? "Editar Plantilla" : "Crear Plantilla"}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingPlantilla ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Plantilla:</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nombrePlantilla}
                  onChange={handleNombreChange}
                  required
                />
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio General</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {renderTable()}
                  </tbody>
                </table>
              </div>
    
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingPlantilla ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <style>{`
        .modal {
          position: absolute;
          top: 50%;
          left: 50%;
          right: auto;
          bottom: auto;
          margin-right: -50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          border: none;
          background: transparent;
          overflow: auto;
          outline: none;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default PlantillaPrecios;