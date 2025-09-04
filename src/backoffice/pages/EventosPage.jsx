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
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const EventosPage = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { addTenantFilter } = useTenantFilter();

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const { data, error } = await addTenantFilter(
        supabase
          .from('eventos')
          .select('*')
          .order('created_at', { ascending: false })
      );

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
            <div style={{ fontWeight: '500' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.fecha} • {record.ubicacion}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
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
            onClick={() => setSelectedEvent(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
          >
            Editar
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
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
      title="Gestión de Eventos"
      subtitle="Administra todos los eventos del sistema"
    >
      <DataTable
        title="Eventos"
        dataSource={eventos}
        columns={columns}
        loading={loading}
        onRefresh={loadEventos}
        showSearch={true}
        searchPlaceholder="Buscar eventos..."
        addButtonText="Crear Evento"
        onAdd={() => console.log('Crear evento')}
      />

      {/* Modal para ver detalles del evento */}
      <Modal
        title="Detalles del Evento"
        visible={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        width={600}
      >
        {selectedEvent && (
          <div>
            {selectedEvent.imagen && (
              <div style={{ marginBottom: '16px' }}>
                <Image
                  src={resolveImageUrl(selectedEvent.imagen)}
                  alt={selectedEvent.nombre}
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <strong>Nombre:</strong> {selectedEvent.nombre}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Descripción:</strong> {selectedEvent.descripcion}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Fecha:</strong> {selectedEvent.fecha}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Ubicación:</strong> {selectedEvent.ubicacion}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Precio:</strong> {selectedEvent.precio ? `$${selectedEvent.precio}` : 'Gratis'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Estado:</strong> 
              <Tag color={getStatusColor(selectedEvent.estado)} style={{ marginLeft: '8px' }}>
                {getStatusText(selectedEvent.estado)}
              </Tag>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        title="Confirmar Eliminación"
        visible={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setEventToDelete(null);
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que quieres eliminar el evento "{eventToDelete?.nombre}"?</p>
        <p>Esta acción no se puede deshacer.</p>
      </Modal>
    </DashboardLayout>
  );
};

export default EventosPage;
