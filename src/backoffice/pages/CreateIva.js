import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useIva } from '../contexts/IvaContext';
import { useTenant } from '../../contexts/TenantContext';

const CreateIva = () => {
  const { currentTenant } = useTenant();
  const { ivas, setIvas } = useIva();
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchIvas();
  }, [currentTenant?.id]);

  const fetchIvas = async () => {
    if (!currentTenant?.id) {
      console.warn('No hay tenant disponible');
      setIvas([]);
      return;
    }

    const { data, error } = await supabase
      .from('ivas')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('nombre', { ascending: true });
      
    if (error) {
      console.error('Error al cargar IVAs:', error.message);
      setIvas([]);
    } else {
      setIvas(data || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentTenant?.id) {
      alert('No hay tenant configurado');
      return;
    }

    const payload = { 
      nombre, 
      porcentaje: parseFloat(porcentaje),
      tenant_id: currentTenant.id
    };

    if (editingId) {
      const { error } = await supabase
        .from('ivas')
        .update(payload)
        .eq('id', editingId);
        
      if (error) {
        alert('Error al actualizar: ' + error.message);
        return;
      }
      alert('IVA actualizado con éxito');
    } else {
      const { error } = await supabase
        .from('ivas')
        .insert([payload]);
        
      if (error) {
        alert('Error al crear: ' + error.message);
        return;
      }
      alert('IVA creado con éxito');
    }

    setNombre('');
    setPorcentaje('');
    setEditingId(null);
    fetchIvas();
  };

  const handleEdit = (iva) => {
    setNombre(iva.nombre);
    setPorcentaje(iva.porcentaje);
    setEditingId(iva.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas eliminar este IVA?')) {
      const { error } = await supabase.from('ivas').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
      }
      alert('IVA eliminado con éxito');
      fetchIvas();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestión de IVA</h1>
        <p className="text-gray-600 mb-4">Administra los tipos de IVA para tus productos y servicios</p>
        {currentTenant && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">
              Tenant: {currentTenant.company_name || currentTenant.id}
            </span>
          </div>
        )}
        {!currentTenant?.id && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">
              ⚠️ No hay tenant configurado
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 mb-8 space-y-4">
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
              onClick={() => {
                setEditingId(null);
                setNombre('');
                setPorcentaje('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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
              <tr key={iva.id} className="border-t">
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
                    onClick={() => handleDelete(iva.id)}
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
