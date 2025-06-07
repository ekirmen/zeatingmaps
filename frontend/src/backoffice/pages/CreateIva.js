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
      const response = await fetch('http://localhost:5000/api/ivas');
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
        ? `http://localhost:5000/api/ivas/${editingId}`
        : 'http://localhost:5000/api/ivas';

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
        const response = await fetch(`http://localhost:5000/api/ivas/${id}`, {
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
    <div className="dashboard-content">
      <div className="page-content iva-container">
        <h1 className="iva-title">Gestión de IVA</h1>

        <div className="iva-form-container">
          <form onSubmit={handleSubmit} className="iva-form">
            <div className="form-group">
              <label>Nombre del IVA:</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="form-input"
                placeholder="Nombre del IVA"
              />
            </div>
            <div className="form-group">
              <label>Porcentaje:</label>
              <input
                type="number"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                required
                step="0.01"
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                {editingId ? 'Actualizar IVA' : 'Crear IVA'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
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
        </div>

        <div className="iva-table-container">
          <h2>Lista de IVAs</h2>
          <table className="iva-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Porcentaje</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ivas.map((iva) => (
                <tr key={iva._id}>
                  <td>{iva.nombre}</td>
                  <td>{iva.porcentaje}%</td>
                  <td className="action-buttons">
                    <button
                      onClick={() => handleEdit(iva)}
                      className="btn-edit"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(iva._id)}
                      className="btn-delete"
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
    </div>
  );
};

export default CreateIva;
