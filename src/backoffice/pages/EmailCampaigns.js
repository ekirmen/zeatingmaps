import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlinePlus, AiOutlineSearch, AiOutlineDelete, AiOutlineCopy, AiOutlineBarChart, AiOutlineEdit } from 'react-icons/ai';
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
        opened: `${campaign.total_enviados || 0}/${campaign.total_enviados || 0}`,
        sent: campaign.total_enviados || 0
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
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sended':
        return 'Enviado';
      case 'draft':
        return 'Borrador';
      case 'sending':
        return 'Enviando';
      default:
        return 'Desconocido';
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container-body form-wrapper">
      {/* Script variables */}
      <script type="text/javascript">
        {`
          var esAdministrador = false;
          var idCompany = 50;
          var idOrganizationPreSelected = parseInt();
          var idVenuePreSelected = parseInt("");
          var idEventPreSelected = parseInt("");
          var litEventPreSelected = "";
          var idHallPreSelected = parseInt("");
          var idSessionPreSelected = parseInt("");
          var idCampaignPreSelected = parseInt("");
          var isSeasonPass = ("" === "true");
          var languageSelectedUser = "es_MX";
        `}
      </script>

      {/* Header */}
      <div className="row">
        <div className="columns large-12 medium-12 small-12 title-page-wrapper">
          <div className="title-name">
            <h3>Campañas de mailing</h3>
          </div>
          
          <div className="actions">
            <button 
              id="btnNewCampaign" 
              className="button primary" 
              title="Nueva campaña de correo electrónico" 
              onClick={handleNewCampaign}
            >
              <AiOutlinePlus className="mr-2" />
              Añadir nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="row form-white">
        <div className="columns large-12 small-12">
          <div id="mailingCampaignsTable_wrapper" className="dataTables_wrapper dt-foundation no-footer">
            
            {/* Table Controls */}
            <div className="row grid-x">
              <div className="small-6 columns cell">
                <div className="dataTables_length" id="mailingCampaignsTable_length">
                  <label>
                    Mostrar 
                    <select 
                      name="mailingCampaignsTable_length" 
                      aria-controls="mailingCampaignsTable" 
                      className=""
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                </div>
              </div>
              
              <div className="small-6 columns cell">
                <div id="mailingCampaignsTable_filter" className="dataTables_filter">
                  <label>
                    <AiOutlineSearch className="mr-2" />
                    <input 
                      type="search" 
                      className="" 
                      placeholder="" 
                      aria-controls="mailingCampaignsTable"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Table */}
            <table id="mailingCampaignsTable" aria-labelledby="mailingCampaignsTable" className="dataTable no-footer" aria-describedby="mailingCampaignsTable_info">
              <thead>
                <tr>
                  <th scope="col" className="sorting" tabIndex="0" aria-controls="mailingCampaignsTable" rowSpan="1" colSpan="1" aria-label="ID: Activar para ordenar la columna de manera ascendente" style={{ width: '1rem' }}>ID</th>
                  <th scope="col" className="sorting sorting_asc" tabIndex="0" aria-controls="mailingCampaignsTable" rowSpan="1" colSpan="1" aria-label="Campaña: Activar para ordenar la columna de manera descendente" aria-sort="ascending">Campaña</th>
                  <th scope="col" className="sorting" tabIndex="0" aria-controls="mailingCampaignsTable" rowSpan="1" colSpan="1" aria-label="Estado: Activar para ordenar la columna de manera ascendente" style={{ width: '4rem' }}>Estado</th>
                  <th scope="col" className="sorting" tabIndex="0" aria-controls="mailingCampaignsTable" rowSpan="1" colSpan="1" aria-label="Enviado: Activar para ordenar la columna de manera ascendente" style={{ width: '8rem' }}>Enviado</th>
                  <th scope="col" className="sorting_disabled" rowSpan="1" colSpan="1" aria-label="Tipo" style={{ width: '10rem' }}>
                    <select 
                      style={{ marginBottom: '0px' }} 
                      id="flType" 
                      name="flType" 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="0">Todo</option>
                      <option value="4">Newsletter</option>
                      <option value="1">Invitación</option>
                      <option value="2">Renovación del abono de temporada</option>
                      <option value="3">Información sobre el abono de temporada</option>
                    </select>
                  </th>
                  <th scope="col" className="sorting" tabIndex="0" aria-controls="mailingCampaignsTable" rowSpan="1" colSpan="1" aria-label="Abierto: Activar para ordenar la columna de manera ascendente" style={{ width: '4rem' }}>Abierto</th>
                  <th scope="col" className="btn-action sorting_disabled" rowSpan="1" colSpan="1" aria-label="&nbsp;" style={{ width: '2rem' }}>&nbsp;</th>
                  <th scope="col" className="btn-action sorting_disabled" rowSpan="1" colSpan="1" aria-label="&nbsp;" style={{ width: '2rem' }}>&nbsp;</th>
                  <th scope="col" className="btn-action sorting_disabled" rowSpan="1" colSpan="1" aria-label="&nbsp;" style={{ width: '2rem' }}>&nbsp;</th>
                  <th scope="col" className="btn-action-big sorting_disabled" rowSpan="1" colSpan="1" aria-label="&nbsp;">&nbsp;</th>
                </tr>
              </thead>
              
              <tbody>
                {currentCampaigns.map((campaign, index) => (
                  <tr key={campaign.id} className={index % 2 === 0 ? 'odd' : 'even'}>
                    <td>
                      <div className="wid-ellipsis">{campaign.id}</div>
                    </td>
                    <td className="sorting_1">
                      <div className="wid-ellipsis">{campaign.name}</div>
                    </td>
                    <td>
                      <div className="wid-ellipsis">
                        <div className="cont-tags-visual mailing-campaings">
                          <div className={`tag ${getStatusColor(campaign.status)}`}>
                            {getStatusText(campaign.status)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="wid-ellipsis">{campaign.sentDate}</div>
                    </td>
                    <td>
                      <div className="wid-ellipsis">{campaign.type}</div>
                    </td>
                    <td>{campaign.opened}</td>
                    <td className="btn-action">
                      <a 
                        className="dynamic-tooltip disabled delete-btn tpd-hideOnClickOutside" 
                        title="" 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCampaign(campaign.id);
                        }}
                      >
                        <AiOutlineDelete className="icono-tabla" />
                      </a>
                    </td>
                    <td className="btn-action">
                      <a 
                        className="dynamic-tooltip tpd-hideOnClickOutside" 
                        title="" 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleCopyCampaign(campaign.id);
                        }}
                      >
                        <AiOutlineCopy className="icono-tabla" />
                      </a>
                    </td>
                    <td className="btn-action">
                      <a 
                        className="dynamic-tooltip tpd-hideOnClickOutside" 
                        title="" 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleShowCharts(campaign.id);
                        }}
                      >
                        <AiOutlineBarChart className="icono-tabla" />
                      </a>
                    </td>
                    <td className="btn-action-big">
                      <button 
                        className="button tiny secondary expanded" 
                        title="Editar campaña" 
                        onClick={() => handleEditCampaign(campaign.id)}
                      >
                        <AiOutlineEdit className="mr-1" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="row grid-x">
              <div className="small-6 columns cell">
                <div className="dataTables_info" id="mailingCampaignsTable_info" role="status" aria-live="polite">
                  {startIndex + 1} al {Math.min(endIndex, filteredCampaigns.length)} de {filteredCampaigns.length}
                </div>
              </div>
              <div className="small-6 columns cell">
                <div className="dataTables_paginate paging_simple_numbers" id="mailingCampaignsTable_paginate">
                  <ul className="pagination">
                    <li className={`paginate_button previous ${currentPage === 1 ? 'unavailable disabled' : ''}`} aria-controls="mailingCampaignsTable" tabIndex="0" id="mailingCampaignsTable_previous">
                      <button 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center"
                      >
                        <AiOutlineSearch className="transform rotate-180" />
                      </button>
                    </li>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <li key={pageNum} className={`paginate_button ${currentPage === pageNum ? 'current' : ''}`} aria-controls="mailingCampaignsTable" tabIndex="0">
                          <button 
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? 'font-bold' : ''}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <li className="paginate_button unavailable disabled" aria-controls="mailingCampaignsTable" tabIndex="0" id="mailingCampaignsTable_ellipsis">
                          …
                        </li>
                        <li className="paginate_button" aria-controls="mailingCampaignsTable" tabIndex="0">
                          <button onClick={() => setCurrentPage(totalPages)}>
                            {totalPages}
                          </button>
                        </li>
                      </>
                    )}
                    
                    <li className={`paginate_button next ${currentPage === totalPages ? 'unavailable disabled' : ''}`} aria-controls="mailingCampaignsTable" tabIndex="0" id="mailingCampaignsTable_next">
                      <button 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center"
                      >
                        <AiOutlineSearch />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCampaigns; 