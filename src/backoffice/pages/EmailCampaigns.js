import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  AiOutlinePlus, 
  AiOutlineSearch, 
  AiOutlineDelete, 
  AiOutlineCopy, 
  AiOutlineBarChart, 
  AiOutlineEdit,
  AiOutlineMail,
  AiOutlineCalendar,
  AiOutlineEye,
  AiOutlineSend
} from 'react-icons/ai';
import { emailCampaignService } from '../services/emailCampaignService';

const EmailCampaigns = ({ setSidebarCollapsed }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('0');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const campaignsData = await emailCampaignService.getCampaigns();
      const formattedCampaigns = campaignsData.map(campaign => ({
        id: campaign.id,
        name: campaign.nombre,
        status: campaign.estado,
        sentDate: campaign.fecha_envio ? new Date(campaign.fecha_envio).toLocaleString('es-ES') : '-',
        type: campaign.tipo,
        opened: `${campaign.total_exitosos || 0}/${campaign.total_enviados || 0}`,
        sent: campaign.total_enviados || 0,
        template_name: campaign.template_name || 'Sin plantilla',
        template_type: campaign.template_type || 'personalizada'
      }));
      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Error al cargar las campañas');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCampaign = async () => {
    try {
      const newCampaign = await emailCampaignService.createCampaign({
        nombre: 'Nueva Campaña',
        tipo: 'newsletter',
        configuracion: {}
      });
      
      if (newCampaign) {
        await loadCampaigns(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleEditCampaign = (id) => {
    toast.success(`Editando campaña ${id}`);
    // Aquí iría la lógica para editar campaña
  };

  const handleCopyCampaign = (id) => {
    toast.success(`Copiando campaña ${id}`);
    // Aquí iría la lógica para copiar campaña
  };

  const handleShowCharts = (id) => {
    toast.success(`Mostrando gráficos de campaña ${id}`);
    // Aquí iría la lógica para mostrar gráficos
  };

  const handleDeleteCampaign = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta campaña?')) {
      try {
        const success = await emailCampaignService.deleteCampaign(id);
        if (success) {
          await loadCampaigns(); // Recargar la lista
        }
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sended':
      case 'enviado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sending':
      case 'enviando':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sended':
      case 'enviado':
        return 'Enviado';
      case 'draft':
      case 'borrador':
        return 'Borrador';
      case 'sending':
      case 'enviando':
        return 'Enviando';
      default:
        return 'Desconocido';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'newsletter':
        return 'Newsletter';
      case 'invitacion':
        return 'Invitación';
      case 'recordatorio':
        return 'Recordatorio';
      case 'promocional':
        return 'Promocional';
      default:
        return type || 'Personalizada';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === '0' || campaign.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campañas de Email</h1>
              <p className="mt-2 text-gray-600">Gestiona tus campañas de marketing por email</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={handleNewCampaign}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <AiOutlinePlus className="mr-2 h-4 w-4" />
                Nueva Campaña
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AiOutlineMail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Campañas</dt>
                    <dd className="text-lg font-medium text-gray-900">{campaigns.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AiOutlineSend className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Enviadas</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {campaigns.filter(c => c.status === 'sended' || c.status === 'enviado').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AiOutlineCalendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Borradores</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {campaigns.filter(c => c.status === 'draft' || c.status === 'borrador').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AiOutlineEye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tasa Apertura</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {campaigns.length > 0 ? 
                      Math.round((campaigns.reduce((acc, c) => acc + (c.sent || 0), 0) / campaigns.length) * 100) || 0
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AiOutlineSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar campañas..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="0">Todos los tipos</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="invitacion">Invitación</option>
                  <option value="recordatorio">Recordatorio</option>
                  <option value="promocional">Promocional</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Mostrar:</span>
                <select
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enviado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aperturas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <AiOutlineMail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No hay campañas</p>
                      <p className="text-sm">Crea tu primera campaña de email para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  currentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <AiOutlineMail className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {campaign.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(campaign.status)}`}>
                          {getStatusText(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTypeText(campaign.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.template_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.sentDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.opened}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditCampaign(campaign.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-150"
                            title="Editar campaña"
                          >
                            <AiOutlineEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCopyCampaign(campaign.id)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors duration-150"
                            title="Copiar campaña"
                          >
                            <AiOutlineCopy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShowCharts(campaign.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-150"
                            title="Ver estadísticas"
                          >
                            <AiOutlineBarChart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors duration-150"
                            title="Eliminar campaña"
                          >
                            <AiOutlineDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredCampaigns.length)}</span> de{' '}
                    <span className="font-medium">{filteredCampaigns.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailCampaigns;
