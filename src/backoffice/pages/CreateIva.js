import React, { useState, useEffect } from 'react';

const CreateIva = () => {
  const [ivas, setIvas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchIvas();
  }, []);

  const fetchIvas = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ivas`);
      const data = await response.json();
      setIvas(data);
    } catch (error) {
      console.error('Error al cargar IVAs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/api/ivas/${editingId}`
        : `${process.env.REACT_APP_API_URL}/api/ivas`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, porcentaje }),
      });

      if (response.ok) {
        alert(editingId ? 'IVA actualizado con éxito' : 'IVA creado con éxito');
        setNombre('');
        setPorcentaje('');
        setEditingId(null);
        fetchIvas();
      } else {
        const data = await response.json();
        alert(data.message || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error en la operación');
    }
  };

  const handleEdit = (iva) => {
    setNombre(iva.nombre);
    setPorcentaje(iva.porcentaje);
    setEditingId(iva._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este IVA?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ivas/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('IVA eliminado con éxito');
          fetchIvas();
        } else {
          const data = await response.json();
          alert(data.message || 'Error al eliminar el IVA');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el IVA');
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de IVA</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-4 mb-8 space-y-4"
      >
        <div>
          <label className="block mb-1">Nombre del IVA:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full border rounded p-2"
            placeholder="Nombre del IVA"
          />
        </div>
        <div>
          <label className="block mb-1">Porcentaje:</label>
          <input
            type="number"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
            required
            step="0.01"
            className="w-full border rounded p-2"
            placeholder="0.00"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {editingId ? 'Actualizar IVA' : 'Crear IVA'}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={() => {
                setEditingId(null);
                setNombre('');
                setPorcentaje('');
              }}
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-2">Lista de IVAs</h2>
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Nombre</th>
              <th className="py-2 px-4 text-left">Porcentaje</th>
              <th className="py-2 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ivas.map((iva) => (
              <tr key={iva._id} className="border-t">
                <td className="py-2 px-4">{iva.nombre}</td>
                <td className="py-2 px-4">{iva.porcentaje}%</td>
                <td className="py-2 px-4 space-x-2">
                  <button
                    onClick={() => handleEdit(iva)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(iva._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreateIva;
