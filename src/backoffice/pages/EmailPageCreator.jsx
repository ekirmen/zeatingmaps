import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlinePlus, AiOutlineSave, AiOutlineEye, AiOutlineSend } from 'react-icons/ai';
import { supabase } from '../../supabaseClient';

const EmailPageCreator = ({ setSidebarCollapsed }) => {
  const [emailPages, setEmailPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'newsletter',
    asunto: '',
    contenido: '',
    configuracion: {}
  });

  useEffect(() => {

    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    loadEmailPages();
  }, []);

  const loadEmailPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading email pages:', error);
        toast.error('Error al cargar las páginas de email');
      } else {
        setEmailPages(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las páginas de email');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!formData.nombre || !formData.asunto) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_pages')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating email page:', error);
        toast.error('Error al crear la página de email');
      } else {
        toast.success('Página de email creada exitosamente');
        setShowCreateModal(false);
        setFormData({
          nombre: '',
          descripcion: '',
          tipo: 'newsletter',
          asunto: '',
          contenido: '',
          configuracion: {}
        });
        loadEmailPages();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la página de email');
    }
  };

  const handleUpdatePage = async () => {
    if (!editingPage || !formData.nombre || !formData.asunto) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      const { error } = await supabase
        .from('email_pages')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPage.id);

      if (error) {
        console.error('Error updating email page:', error);
        toast.error('Error al actualizar la página de email');
      } else {
        toast.success('Página de email actualizada exitosamente');
        setEditingPage(null);
        setFormData({
          nombre: '',
          descripcion: '',
          tipo: 'newsletter',
          asunto: '',
          contenido: '',
          configuracion: {}
        });
        loadEmailPages();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la página de email');
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta página de email?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_pages')
        .delete()
        .eq('id', pageId);

      if (error) {
        console.error('Error deleting email page:', error);
        toast.error('Error al eliminar la página de email');
      } else {
        toast.success('Página de email eliminada exitosamente');
        loadEmailPages();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la página de email');
    }
  };

  const handleEditPage = (page) => {
    setEditingPage(page);
    setFormData({
      nombre: page.nombre || '',
      descripcion: page.descripcion || '',
      tipo: page.tipo || 'newsletter',
      asunto: page.asunto || '',
      contenido: page.contenido || '',
      configuracion: page.configuracion || {}
    });
    setShowCreateModal(true);
  };

  const handleSendTest = async (page) => {
    // Aquí implementarías la lógica para enviar un email de prueba
    toast.success('Email de prueba enviado');
  };

  const filteredPages = emailPages.filter(page =>
    page.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPages = filteredPages.slice(indexOfFirst, indexOfLast);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creador de Páginas de Email</h1>
          <p className="text-gray-600">Crea y gestiona páginas de correo electrónico</p>
        </div>
        <button
          onClick={() => {
            setEditingPage(null);
            setFormData({
              nombre: '',
              descripcion: '',
              tipo: 'newsletter',
              asunto: '',
              contenido: '',
              configuracion: {}
            });
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <AiOutlinePlus />
          Nueva Página
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar páginas de email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Email Pages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Páginas de Email</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{page.nombre}</div>
                      <div className="text-sm text-gray-500">{page.descripcion}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {page.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.asunto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(page.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditPage(page)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <AiOutlineEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendTest(page)}
                        className="text-green-600 hover:text-green-900"
                        title="Enviar prueba"
                      >
                        <AiOutlineSend className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Mostrando {indexOfFirst + 1} a {Math.min(indexOfLast, filteredPages.length)} de {filteredPages.length} páginas
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">Página {currentPage}</span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(filteredPages.length / itemsPerPage)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingPage ? 'Editar Página de Email' : 'Nueva Página de Email'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPage(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la página de email"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descripción de la página"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newsletter">Newsletter</option>
                    <option value="promocional">Promocional</option>
                    <option value="informacional">Informacional</option>
                    <option value="evento">Evento</option>
                    <option value="renovacion">Renovación</option>
                  </select>
                </div>

                {/* Asunto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto del Email *
                  </label>
                  <input
                    type="text"
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Asunto del correo electrónico"
                  />
                </div>

                {/* Contenido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido HTML
                  </label>
                  <textarea
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={10}
                    placeholder="<html><body><h1>Tu contenido HTML aquí</h1></body></html>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes usar HTML para crear el contenido del email
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPage(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingPage ? handleUpdatePage : handleCreatePage}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <AiOutlineSave />
                  {editingPage ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPageCreator; 
