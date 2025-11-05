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
import EventForm from '../components/EventForm';
import { supabase } from '../../supabaseClient';
import { resolveImageUrl, resolveEventImageWithTenant } from '../../utils/resolveImageUrl';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery';
import { PageWrapper } from '../../components/PageWrapper';

const EventosPage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Hook optimizado para obtener eventos
  const { data: eventos, loading, error, refetch } = useSupabaseQuery('eventos', {
    orderBy: 'created_at',
    ascending: false
  });
  
  // Hook optimizado para operaciones CRUD
  const { create, update, remove, loading: mutationLoading } = useSupabaseMutation('eventos');

  const handleDelete = async (event) => {
    setEventToDelete(event);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await remove(eventToDelete.id);
      message.success('Evento eliminado correctamente');
      setDeleteModalVisible(false);
      setEventToDelete(null);
      refetch(); // Recargar datos
    } catch (error) {
      console.error('Error deleting evento:', error);
      message.error('Error al eliminar el evento');
    }
  };

  // Manejar creación/edición de eventos
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        // Actualizar evento existente usando hook optimizado
        await update(editingEvent.id, eventData);
        message.success('Evento actualizado correctamente');
      } else {
        // Crear nuevo evento usando hook optimizado
        await create(eventData);
        message.success('Evento creado correctamente');
      }

      setShowEventForm(false);
      setEditingEvent(null);
      refetch(); // Recargar datos usando hook optimizado
    } catch (error) {
      console.error('Error saving evento:', error);
      message.error('Error al guardar el evento');
    }
  };

  const handleCancelForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
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
      render: (text, record) => {
        // Obtener imagen usando la nueva estructura
        let imageUrl = null;
        if (record.imagenes) {
          try {
            const images = typeof record.imagenes === 'string' 
              ? JSON.parse(record.imagenes) 
              : record.imagenes;
            imageUrl = resolveEventImageWithTenant(record, 'banner', currentTenant?.id) ||
                      resolveEventImageWithTenant(record, 'portada', currentTenant?.id);
          } catch (error) {
            console.error('Error parsing event images:', error);
          }
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {imageUrl ? (
              <Image
                width={40}
                height={40}
                src={imageUrl}
                style={{ borderRadius: '4px', objectFit: 'cover' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                alt={text}
              />
            ) : (
              <Avatar
                size={40}
                icon={<CalendarOutlined />}
              />
            )}
            <div>
              <div style={{ fontWeight: '500' }}>{text}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.fecha_evento} • {record.ubicacion}
              </div>
            </div>
          </div>
        );
      },
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
            onClick={() => handleEditEvent(record)}
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
        onRefresh={refetch}
        showSearch={true}
        searchPlaceholder="Buscar eventos..."
        addButtonText="Crear Evento"
        onAdd={handleCreateEvent}
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
            {(() => {
              // Obtener imagen usando la nueva estructura
              let imageUrl = null;
              if (selectedEvent.imagenes) {
                try {
                  const images = typeof selectedEvent.imagenes === 'string' 
                    ? JSON.parse(selectedEvent.imagenes) 
                    : selectedEvent.imagenes;
                  imageUrl = resolveEventImageWithTenant(selectedEvent, 'banner') ||
                            resolveEventImageWithTenant(selectedEvent, 'portada');
                } catch (error) {
                  console.error('Error parsing event images:', error);
                }
              }

              return imageUrl && (
                <div style={{ marginBottom: '16px' }}>
                  <Image
                    src={imageUrl}
                    alt={selectedEvent.nombre}
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              );
            })()}
            <div style={{ marginBottom: '8px' }}>
              <strong>Nombre:</strong> {selectedEvent.nombre}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Descripción:</strong> {selectedEvent.descripcion}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Fecha:</strong> {selectedEvent.fecha_evento}
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

      {/* Modal para crear/editar evento */}
      <Modal
        title={editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
        visible={showEventForm}
        onCancel={handleCancelForm}
        footer={null}
        width={800}
        destroyOnClose
      >
        <EventForm
          eventData={editingEvent}
          onSave={handleSaveEvent}
          onCancel={handleCancelForm}
          loading={mutationLoading}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default EventosPage;
