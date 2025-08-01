import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineEye, AiOutlineMail } from 'react-icons/ai';
import { emailCampaignService } from '../services/emailCampaignService';

const CRM = ({ setSidebarCollapsed }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    // Simular carga de campañas
    setTimeout(() => {
      setCampaigns([
        {
          id: 1,
          name: 'Newsletter Mensual',
          type: 'Newsletter',
          status: 'active',
          sentCount: 1250,
          openRate: 23.5,
          clickRate: 4.2,
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          name: 'Renovación Abonos',
          type: 'Renovación del abono de temporada',
          status: 'draft',
          sentCount: 0,
          openRate: 0,
          clickRate: 0,
          createdAt: '2024-01-20'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCreateModal(true);
  };

  const handleDeleteCampaign = (campaignId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta campaña?')) {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      toast.success('Campaña eliminada');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'draft':
        return 'Borrador';
      case 'paused':
        return 'Pausada';
      default:
        return 'Desconocido';
    }
  };

  // Función para enviar email de prueba
  const handleSendTest = async (testEmail) => {
    if (!selectedCampaign) {
      toast.error('No hay campaña seleccionada');
      return;
    }
    
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    try {
      const success = await emailCampaignService.sendTestEmail(selectedCampaign.id, testEmail);
      if (success) {
        toast.success('Email de prueba enviado exitosamente');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error al enviar email de prueba');
    }
  };

  // Función para guardar campaña
  const handleSaveCampaign = async () => {
    if (!selectedCampaign) {
      toast.error('No hay campaña seleccionada');
      return;
    }

    try {
      const success = await emailCampaignService.saveCampaign(selectedCampaign.id, selectedCampaign);
      if (success) {
        toast.success('Campaña guardada exitosamente');
        setShowCreateModal(false);
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Error al guardar la campaña');
    }
  };

  // Función para lanzar campaña
  const handleLaunchCampaign = async () => {
    if (!selectedCampaign) {
      toast.error('No hay campaña seleccionada');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres lanzar esta campaña? Esta acción no se puede deshacer.')) {
      try {
        const success = await emailCampaignService.launchCampaign(selectedCampaign.id);
        if (success) {
          toast.success('Campaña lanzada exitosamente');
          setShowCreateModal(false);
          setSelectedCampaign(null);
        }
      } catch (error) {
        console.error('Error launching campaign:', error);
        toast.error('Error al lanzar la campaña');
      }
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">CRM - Campañas de Correo Electrónico</h1>
          <p className="text-gray-600">Gestiona tus campañas de marketing por correo electrónico</p>
        </div>
        <button
          onClick={handleCreateCampaign}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <AiOutlinePlus />
          Nueva Campaña
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AiOutlineMail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campañas</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <AiOutlineMail className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Campañas Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AiOutlineMail className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Borradores</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AiOutlineMail className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enviados</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enviados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa Apertura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa Clics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.sentCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.openRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.clickRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(campaign.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <AiOutlineEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Implementar vista previa */}}
                        className="text-green-600 hover:text-green-900"
                        title="Vista previa"
                      >
                        <AiOutlineEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <AiOutlineDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedCampaign ? 'Editando campaña de correo electrónico' : 'Nueva Campaña de Correo Electrónico'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCampaign(null);
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Campaign Details */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Edición de campaña</h4>
                  
                  {/* Campaign Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la campaña
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre descriptivo para esta campaña de mailing"
                      defaultValue={selectedCampaign?.name || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nombre descriptivo para esta campaña de mailing
                    </p>
                  </div>

                  {/* Campaign Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de campaña
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecciona un tipo</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="renovacion">Renovación del abono de temporada</option>
                      <option value="informacion">Información para los compradores</option>
                      <option value="invitacion">Invitación</option>
                      <option value="personalizacion">Personalización de correo electrónico</option>
                    </select>
                  </div>

                  {/* Email Template */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plantilla de correo electrónico
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecciona una plantilla de correo electrónico</option>
                      <option value="template1">Plantilla Básica</option>
                      <option value="template2">Plantilla Newsletter</option>
                      <option value="template3">Plantilla Promocional</option>
                    </select>
                  </div>

                  {/* Channel Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccione un canal
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecciona un canal</option>
                      <option value="kreatickets">Marca blanca 1 (kreatickets.pagatusboletos.com)</option>
                    </select>
                  </div>

                  {/* Email Subject */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asunto del correo electrónico
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Asunto del correo electrónico"
                      defaultValue={selectedCampaign?.subject || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nota: Para hacer mención al comprador puedes usar la etiqueta $buyerName y será reemplazada por el nombre de cada comprador. $buyerSurname para el apellido y $buyerEmail para el correo electrónico.
                    </p>
                  </div>
                </div>

                {/* Right Column - Analytics and Test Options */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Analítica</h4>
                  
                  {/* UTM Campaign Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de campaña de UTM
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de campaña de UTM para análisis de seguimiento"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nombre de campaña de UTM para análisis de seguimiento
                    </p>
                  </div>

                  {/* Test Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opciones de prueba
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Utiliza una cuenta de correo electrónico a la cual tengas acceso para enviarte un correo electrónico de prueba de esta campaña.
                    </p>
                    <input
                      type="email"
                      id="testEmail"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                    <button 
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      onClick={() => {
                        const testEmail = document.getElementById('testEmail').value;
                        handleSendTest(testEmail);
                      }}
                    >
                      Enviar prueba
                    </button>
                  </div>

                  {/* Campaign Status */}
                  {selectedCampaign && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado de la campaña
                      </label>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedCampaign.status)}`}>
                          {getStatusText(selectedCampaign.status)}
                        </span>
                        {selectedCampaign.status === 'active' && (
                          <span className="text-sm text-gray-600">
                            Campaña enviada a {selectedCampaign.sentCount.toLocaleString()} destinatarios
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t">
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCampaign(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                    onClick={handleSaveCampaign}
                  >
                    Guardar
                  </button>
                  <button 
                    className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    onClick={handleLaunchCampaign}
                  >
                    Lanzar campaña
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM; 