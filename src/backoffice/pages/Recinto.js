import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, message, Pagination, Empty, Spin } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BuildingOutlined
} from '@ant-design/icons';
import CreateRecintoForm from '../components/CreateRecintoForm';
import EditRecintoForm from '../components/EditRecintoForm';
import AddSalaForm from '../components/AddSalaForm';
import EditSalaForm from '../components/EditSalaForm';
import { supabase } from '../../supabaseClient';
import { useResponsive } from '../../hooks/useResponsive';
import '../styles/dashboard-design.css';

const { Search } = Input;

const Recinto = () => {
  const [recintos, setRecintos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSala, setIsAddingSala] = useState(false);
  const [currentRecinto, setCurrentRecinto] = useState(null);
  const [isEditingSala, setIsEditingSala] = useState(false);
  const [currentSala, setCurrentSala] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSalas, setShowSalas] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const recordsPerPage = 10;
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    fetchRecintos();
  }, []);

  const fetchRecintos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recintos')
        .select('*, salas(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener recintos:', error.message);
        message.error('Error al cargar recintos');
      } else {
        setRecintos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al cargar recintos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecinto = async (newRecinto) => {
    try {
      const { data: recinto, error: errorRecinto } = await supabase
        .from('recintos')
        .insert([newRecinto])
        .select()
        .single();
  
      if (errorRecinto) throw errorRecinto;
  
      const salaInicial = {
        nombre: 'Sala Principal',
        recinto_id: recinto.id,
      };
  
      const { data: sala, error: errorSala } = await supabase
        .from('salas')
        .insert([salaInicial])
        .select()
        .single();
  
      if (errorSala) throw errorSala;
  
      setRecintos((prev) => [...prev, { ...recinto, salas: [sala] }]);
      message.success('Recinto y sala creados con éxito');
      setIsCreating(false);
    } catch (error) {
      console.error('Error al crear recinto:', error.message);
      message.error(`Error: ${error.message}`);
    }
  };

  const handleEditRecinto = async () => {
    try {
      await fetchRecintos();
      setIsEditing(false);
      setCurrentRecinto(null);
      message.success('Recinto actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar lista de recintos:', error.message);
      message.error('Error al actualizar recinto');
    }
  };

  const handleAddSala = async (newSala) => {
    try {
      const { data: sala, error } = await supabase
        .from('salas')
        .insert([{ ...newSala, recinto_id: currentRecinto.id }])
        .select()
        .single();
  
      if (error) throw error;
  
      setRecintos((prev) =>
        prev.map((r) =>
          r.id === currentRecinto.id
            ? { ...r, salas: [...(r.salas || []), sala] }
            : r
        )
      );
  
      message.success('Sala agregada con éxito');
      setIsAddingSala(false);
      setCurrentRecinto(null);
    } catch (error) {
      console.error('Error al agregar sala:', error.message);
      message.error(error.message);
    }
  };

  const handleEditSala = async (recintoId, salaId, updatedSalaData) => {
    try {
      const { error } = await supabase
        .from('salas')
        .update(updatedSalaData)
        .eq('id', salaId);

      if (error) throw error;

      await fetchRecintos();
      setIsEditingSala(false);
      setCurrentSala(null);
      message.success('Sala actualizada con éxito');
    } catch (error) {
      console.error('Error al editar sala:', error.message);
      message.error(error.message);
    }
  };

  const handleDeleteSala = async (recintoId, salaId) => {
    Modal.confirm({
      title: '¿Eliminar sala?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('salas')
            .delete()
            .eq('id', salaId);

          if (error) throw error;

          await fetchRecintos();
          message.success('Sala eliminada con éxito');
        } catch (error) {
          console.error('Error al eliminar sala:', error.message);
          message.error(error.message);
        }
      }
    });
  };

  const handleDeleteRecinto = async (recintoId) => {
    Modal.confirm({
      title: '¿Eliminar recinto?',
      content: 'Esta acción eliminará el recinto y TODOS los datos relacionados (salas, mapas, eventos, funciones, plantillas, etc.). Esta acción NO se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await fetch(`/api/recintos/${recintoId}/delete`, { method: 'DELETE' });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result?.error || 'Error eliminando el recinto');
          }
          await fetchRecintos();
          message.success('Recinto y datos relacionados eliminados con éxito');
        } catch (error) {
          console.error('Error al eliminar recinto:', error);
          message.error(error.message);
        }
      }
    });
  };

  const filteredRecintos = recintos.filter((recinto) =>
    recinto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recinto.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRecinto = currentPage * recordsPerPage;
  const indexOfFirstRecinto = indexOfLastRecinto - recordsPerPage;
  const currentRecintos = filteredRecintos.slice(indexOfFirstRecinto, indexOfLastRecinto);
  const totalPages = Math.ceil(filteredRecintos.length / recordsPerPage);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-page-header">
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '16px' : '24px'
        }}>
          <div>
            <h1 className="dashboard-page-title">Recintos</h1>
            <p className="dashboard-page-subtitle">
              Gestiona tus recintos y salas
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Search
              placeholder="Buscar recinto..."
              allowClear
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: isMobile ? '100%' : 300 }}
              size={isMobile ? 'middle' : 'large'}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreating(true)}
              size={isMobile ? 'middle' : 'large'}
              className="dashboard-button dashboard-button-primary"
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              Crear Recinto
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Crear Recinto */}
      <Modal
        title="Crear Nuevo Recinto"
        open={isCreating}
        onCancel={() => setIsCreating(false)}
        footer={null}
        width={isMobile ? '90%' : 600}
        style={{ top: isMobile ? 20 : 50 }}
      >
        <CreateRecintoForm
          onCreateRecinto={handleCreateRecinto}
          onCancel={() => setIsCreating(false)}
        />
      </Modal>

      {/* Modal Editar Recinto */}
      <Modal
        title="Editar Recinto"
        open={isEditing}
        onCancel={() => {
          setIsEditing(false);
          setCurrentRecinto(null);
        }}
        footer={null}
        width={isMobile ? '90%' : 600}
        style={{ top: isMobile ? 20 : 50 }}
      >
        <EditRecintoForm 
          recinto={currentRecinto} 
          onEditRecinto={handleEditRecinto} 
          onCancel={() => {
            setIsEditing(false);
            setCurrentRecinto(null);
          }} 
        />
      </Modal>

      {/* Modal Agregar Sala */}
      <Modal
        title="Agregar Sala"
        open={isAddingSala}
        onCancel={() => {
          setIsAddingSala(false);
          setCurrentRecinto(null);
        }}
        footer={null}
        width={isMobile ? '90%' : 500}
        style={{ top: isMobile ? 20 : 50 }}
      >
        <AddSalaForm 
          recinto={currentRecinto} 
          onAddSala={handleAddSala} 
          onCancel={() => {
            setIsAddingSala(false);
            setCurrentRecinto(null);
          }} 
        />
      </Modal>

      {/* Modal Editar Sala */}
      <Modal
        title="Editar Sala"
        open={isEditingSala}
        onCancel={() => {
          setIsEditingSala(false);
          setCurrentSala(null);
        }}
        footer={null}
        width={isMobile ? '90%' : 500}
        style={{ top: isMobile ? 20 : 50 }}
      >
        <EditSalaForm
          sala={currentSala}
          onEditSala={(updatedData) => handleEditSala(currentRecinto.id, currentSala.id, updatedData)}
          onCancel={() => {
            setIsEditingSala(false);
            setCurrentSala(null);
          }}
        />
      </Modal>

      {/* Lista de Recintos */}
      {filteredRecintos.length === 0 ? (
        <div className="dashboard-card">
          <Empty
            description="No hay recintos disponibles"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {searchTerm ? (
              <Button type="primary" onClick={() => setSearchTerm('')}>
                Limpiar búsqueda
              </Button>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreating(true)}>
                Crear Primer Recinto
              </Button>
            )}
          </Empty>
        </div>
      ) : (
        <>
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
            {currentRecintos.map((recinto) => (
              <div key={recinto.id} className="dashboard-card">
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'stretch' : 'flex-start',
                  gap: '16px'
                }}>
                  {/* Información del Recinto */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--dashboard-radius-lg)',
                        background: 'linear-gradient(135deg, var(--dashboard-primary) 0%, var(--dashboard-secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px'
                      }}>
                        <BuildingOutlined />
                      </div>
                      <div>
                        <h2 style={{
                          fontSize: isMobile ? '18px' : '20px',
                          fontWeight: 700,
                          color: 'var(--dashboard-gray-900)',
                          margin: 0,
                          marginBottom: '4px'
                        }}>
                          {recinto.nombre}
                        </h2>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '12px',
                          color: 'var(--dashboard-gray-500)'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <EnvironmentOutlined />
                            {recinto.direccion || 'Sin dirección'}
                          </span>
                          {recinto.codigopostal && (
                            <span>CP: {recinto.codigopostal}</span>
                          )}
                          {recinto.capacidad && (
                            <span>Capacidad: {recinto.capacidad.toLocaleString()}</span>
                          )}
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <HomeOutlined />
                            {recinto.salas?.length || 0} salas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '8px',
                    flexShrink: 0
                  }}>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => {
                        setCurrentRecinto(recinto);
                        setIsEditing(true);
                      }}
                      className="dashboard-button dashboard-button-outline"
                      style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                      Editar
                    </Button>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setCurrentRecinto(recinto);
                        setIsAddingSala(true);
                      }}
                      className="dashboard-button dashboard-button-primary"
                      style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                      Agregar Sala
                    </Button>
                    <Button
                      onClick={() => setShowSalas(prev => ({ ...prev, [recinto.id]: !prev[recinto.id] }))}
                      className="dashboard-button dashboard-button-ghost"
                      style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                      {showSalas[recinto.id] ? 'Ocultar Salas' : 'Mostrar Salas'}
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteRecinto(recinto.id)}
                      className="dashboard-button"
                      style={{ 
                        width: isMobile ? '100%' : 'auto',
                        background: 'var(--dashboard-error)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {/* Lista de Salas */}
                {showSalas[recinto.id] && (
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--dashboard-gray-200)'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--dashboard-gray-900)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <HomeOutlined style={{ color: 'var(--dashboard-primary)' }} />
                      Salas del Recinto ({recinto.salas?.length || 0})
                    </h3>
                    
                    {(!recinto.salas || recinto.salas.length === 0) ? (
                      <Empty
                        description="No hay salas configuradas"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ padding: '24px 0' }}
                      >
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setCurrentRecinto(recinto);
                            setIsAddingSala(true);
                          }}
                        >
                          Agregar Primera Sala
                        </Button>
                      </Empty>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '12px'
                      }}>
                        {recinto.salas.map((sala) => (
                          <div
                            key={sala.id}
                            style={{
                              padding: '12px',
                              background: 'var(--dashboard-gray-50)',
                              borderRadius: 'var(--dashboard-radius-lg)',
                              border: '1px solid var(--dashboard-gray-200)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: 'var(--dashboard-gray-700)',
                              flex: 1
                            }}>
                              {sala.nombre}
                            </span>
                            <div style={{
                              display: 'flex',
                              gap: '4px'
                            }}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setCurrentSala(sala);
                                  setCurrentRecinto(recinto);
                                  setIsEditingSala(true);
                                }}
                              >
                                {!isMobile && 'Editar'}
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteSala(recinto.id, sala.id)}
                              >
                                {!isMobile && 'Eliminar'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '24px'
            }}>
              <Pagination
                current={currentPage}
                total={filteredRecintos.length}
                pageSize={recordsPerPage}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} de ${total} recintos`
                }
                size={isMobile ? 'small' : 'default'}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Recinto;
