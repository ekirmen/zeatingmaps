import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, Modal, message, Image, Avatar } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { supabase } from '../../supabaseClient';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

const EventosPage = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Error loading eventos:', error);
      message.error('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event) => {
    setEventToDelete(event);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventToDelete.id);

      if (error) throw error;

      message.success('Evento eliminado correctamente');
      setDeleteModalVisible(false);
      setEventToDelete(null);
      loadEventos();
    } catch (error) {
      console.error('Error deleting evento:', error);
      message.error('Error al eliminar el evento');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'orange';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  const columns = [
    {
      title: 'Evento',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            src={record.imagen ? resolveImageUrl(record.imagen) : null}
            icon={<CalendarOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500', color: '#1e293b' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {record.fecha ? new Date(record.fecha).toLocaleDateString() : 'Sin fecha'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Ubicación',
      dataIndex: 'ubicacion',
      key: 'ubicacion',
      render: (text) => text || 'No especificada',
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => precio ? `$${precio}` : 'Gratis',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setSelectedEvent(record)}
          >
            Ver
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => window.open(`/backoffice/eventos/${record.id}`, '_blank')}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Eventos"
      subtitle="Gestiona todos tus eventos"
      actions={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            Crear Evento
          </Button>
        </Space>
      }
    >
      <DataTable
        title="Lista de Eventos"
        dataSource={eventos}
        columns={columns}
        loading={loading}
        onRefresh={loadEventos}
        onAdd={() => window.open('/backoffice/eventos/nuevo', '_blank')}
        searchPlaceholder="Buscar eventos..."
        addButtonText="Crear Evento"
      />

      {/* Modal de Detalles del Evento */}
      <Modal
        title="Detalles del Evento"
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedEvent(null)}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              window.open(`/backoffice/eventos/${selectedEvent?.id}`, '_blank');
              setSelectedEvent(null);
            }}
          >
            Editar
          </Button>,
        ]}
        width={600}
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedEvent.imagen && (
              <Image
                src={resolveImageUrl(selectedEvent.imagen)}
                alt={selectedEvent.nombre}
                style={{ borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
              />
            )}
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                {selectedEvent.nombre}
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>
                {selectedEvent.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Fecha
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedEvent.fecha ? new Date(selectedEvent.fecha).toLocaleDateString() : 'No especificada'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Ubicación
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedEvent.ubicacion || 'No especificada'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Precio
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedEvent.precio ? `$${selectedEvent.precio}` : 'Gratis'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Estado
                </div>
                <Tag color={getStatusColor(selectedEvent.status)}>
                  {getStatusText(selectedEvent.status)}
                </Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        title="Confirmar Eliminación"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setEventToDelete(null);
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>
          ¿Estás seguro de que quieres eliminar el evento "{eventToDelete?.nombre}"?
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default EventosPage;
