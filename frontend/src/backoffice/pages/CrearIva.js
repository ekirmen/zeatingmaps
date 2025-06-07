import React, { useState, useEffect } from 'react';
import { fetchIvas, createIva, updateIva, deleteIva } from '../components/services/api';
import '../styles/CrearIva.css';

const CrearIva = () => {
  const [ivas, setIvas] = useState([]);
  const [nuevoIva, setNuevoIva] = useState({
    nombre: '',
    porcentaje: 0
  });
  const [editingIva, setEditingIva] = useState(null);

  useEffect(() => {
    cargarIvas();
  }, []);

  const cargarIvas = async () => {
    try {
      const data = await fetchIvas();
      setIvas(data);
    } catch (error) {
      console.error('Error al cargar IVAs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIva) {
        await updateIva(editingIva._id, nuevoIva);
      } else {
        await createIva(nuevoIva);
      }
      setNuevoIva({ nombre: '', porcentaje: 0 });
      setEditingIva(null);
      cargarIvas();
    } catch (error) {
      console.error('Error al guardar IVA:', error);
    }
  };

  const handleEdit = (iva) => {
    setEditingIva(iva);
    setNuevoIva({
      nombre: iva.nombre,
      porcentaje: iva.porcentaje
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este IVA?')) {
      try {
        await deleteIva(id);
        cargarIvas();
      } catch (error) {
        console.error('Error al eliminar IVA:', error);
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
              <label>Nombre:</label>
              <input
                type="text"
                value={nuevoIva.nombre}
                onChange={(e) => setNuevoIva({ ...nuevoIva, nombre: e.target.value })}
                required
                className="form-input"
                placeholder="Nombre del IVA"
              />
            </div>
            <div className="form-group">
              <label>Porcentaje:</label>
              <input
                type="number"
                value={nuevoIva.porcentaje}
                onChange={(e) => setNuevoIva({ ...nuevoIva, porcentaje: parseFloat(e.target.value) })}
                required
                step="0.01"
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                {editingIva ? 'Actualizar IVA' : 'Crear IVA'}
              </button>
              {editingIva && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setEditingIva(null);
                    setNuevoIva({ nombre: '', porcentaje: 0 });
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

export default CrearIva;