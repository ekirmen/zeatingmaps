import React, { useEffect, useState } from 'react';
import { useTags } from '../contexts/TagContext';
import { fetchTags, createTag, updateTag, deleteTag } from '../../services/tagService';

const Tags = () => {
  const { tags, setTags } = useTags();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const data = await fetchTags();
      setTags(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTag(editingId, { name });
      } else {
        await createTag({ name });
      }
      setName('');
      setEditingId(null);
      load();
    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    }
  };

  const handleEdit = (tag) => {
    setName(tag.name);
    setEditingId(tag._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar tag?')) return;
    try {
      await deleteTag(id);
      load();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Tags</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-x-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del tag"
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingId ? 'Actualizar' : 'Crear'}
        </button>
        {editingId && (
          <button type="button" onClick={() => { setName(''); setEditingId(null); }} className="ml-2 px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>
        )}
      </form>
      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Nombre</th>
            <th className="py-2 px-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tags.map(t => (
            <tr key={t._id} className="border-t">
              <td className="py-2 px-4">{t.name}</td>
              <td className="py-2 px-4 space-x-2">
                <button onClick={() => handleEdit(t)} className="px-2 py-1 bg-yellow-500 text-white rounded">Editar</button>
                <button onClick={() => handleDelete(t._id)} className="px-2 py-1 bg-red-600 text-white rounded">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tags;
