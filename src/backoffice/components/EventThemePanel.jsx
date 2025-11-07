import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Button, Space, message, Spin, Empty, Modal, Form, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { EventThemeService } from '../services/eventThemeService';
import { useTenant } from '../../contexts/TenantContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PageSkeleton } from '../../components/SkeletonLoaders';

const EventThemePanel = () => {
  const { currentTenant } = useTenant();
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [eventThemes, setEventThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [form] = Form.useForm();

  // Cargar eventos y temas al montar el componente
  useEffect(() => {
    if (currentTenant?.id) {
      loadEventsAndThemes();
    }
  }, [currentTenant?.id]);

  const loadEventsAndThemes = async () => {
    setLoading(true);
    try {
      const [eventsData, themesData] = await Promise.all([
        EventThemeService.getAvailableEvents(currentTenant.id),
        EventThemeService.getAllEventThemeSettings(currentTenant.id)
      ]);

      setEvents(eventsData);
      setEventThemes(themesData);
    } catch (error) {
      message.error('Error al cargar eventos y temas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (eventId, checked) => {
    if (checked) {
      setSelectedEvent(eventId);
    } else {
      setSelectedEvent(null);
    }
  };

  const handleEditTheme = (eventTheme) => {
    setEditingTheme(eventTheme);
    form.setFieldsValue({
      seat_available: eventTheme.seat_available,
      seat_selected_me: eventTheme.seat_selected_me,
      seat_selected_other: eventTheme.seat_selected_other,
      seat_blocked: eventTheme.seat_blocked,
      seat_sold: eventTheme.seat_sold,
      seat_reserved: eventTheme.seat_reserved
    });
    setIsModalVisible(true);
  };

  const handleCreateTheme = (event) => {
    setEditingTheme(null);
    form.setFieldsValue({
      seat_available: theme.seatAvailable || '#4CAF50',
      seat_selected_me: theme.seatSelectedMe || '#ffd700',
      seat_selected_other: theme.seatSelectedOther || '#2196F3',
      seat_blocked: theme.seatBlocked || '#f56565',
      seat_sold: theme.seatSold || '#2d3748',
      seat_reserved: theme.seatReserved || '#805ad5'
    });
    setIsModalVisible(true);
  };

  const handleSaveTheme = async (values) => {
    try {
      if (editingTheme) {
        // Actualizar tema existente
        await EventThemeService.upsertEventThemeSettings(
          editingTheme.event_id,
          currentTenant.id,
          values,
          editingTheme.event_name
        );
        message.success('Tema del evento actualizado correctamente');
      } else {
        // Crear nuevo tema
        const selectedEventData = events.find(e => e.id === selectedEvent);
        await EventThemeService.upsertEventThemeSettings(
          selectedEvent,
          currentTenant.id,
          values,
          selectedEventData?.nombre
        );
        message.success('Tema del evento creado correctamente');
      }

      setIsModalVisible(false);
      form.resetFields();
      loadEventsAndThemes(); // Recargar datos
    } catch (error) {
      message.error('Error al guardar el tema del evento');
      console.error(error);
    }
  };

  const handleDeleteTheme = async (eventId) => {
    Modal.confirm({
      title: '¿Eliminar tema del evento?',
      content: 'Esta acción no se puede deshacer. ¿Estás seguro?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await EventThemeService.deleteEventThemeSettings(eventId, currentTenant.id);
          message.success('Tema del evento eliminado correctamente');
          loadEventsAndThemes(); // Recargar datos
        } catch (error) {
          message.error('Error al eliminar el tema del evento');
          console.error(error);
        }
      }
    });
  };

  const handleResetToGlobal = async (eventId) => {
    Modal.confirm({
      title: '¿Restablecer a tema global?',
      content: '¿Quieres que este evento use los colores globales?',
      okText: 'Restablecer',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await EventThemeService.deleteEventThemeSettings(eventId, currentTenant.id);
          message.success('Evento restablecido a tema global');
          loadEventsAndThemes(); // Recargar datos
        } catch (error) {
          message.error('Error al restablecer el tema');
          console.error(error);
        }
      }
    });
  };

  const getEventTheme = (eventId) => {
    return eventThemes.find(et => et.event_id === eventId);
  };

  const ColorPreview = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div 
        style={{ 
          width: '16px', 
          height: '16px', 
          borderRadius: '50%', 
          backgroundColor: color,
          border: '1px solid #d9d9d9'
        }} 
      />
      <span style={{ fontSize: '12px' }}>{label}</span>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <PageSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>🎨 Colores por Evento</h3>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          Configura colores específicos para cada evento. Los eventos sin configuración usarán los colores globales.
        </p>
      </div>

      {events.length === 0 ? (
        <Empty description="No hay eventos disponibles" />
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {events.map(event => {
            const eventTheme = getEventTheme(event.id);
            const hasCustomTheme = !!eventTheme;
            
            return (
              <Card 
                key={event.id} 
                size="small"
                style={{ 
                  border: hasCustomTheme ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: hasCustomTheme ? '#f0f8ff' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Checkbox 
                        checked={selectedEvent === event.id}
                        onChange={(e) => handleEventSelect(event.id, e.target.checked)}
                      />
                      <strong>{event.nombre}</strong>
                      {hasCustomTheme && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#1890ff', 
                          backgroundColor: '#e6f7ff',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Tema personalizado
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      {event.fecha_evento ? (
                        `Fecha del evento: ${new Date(event.fecha_evento).toLocaleDateString()}`
                      ) : (
                        `Creado: ${new Date(event.created_at).toLocaleDateString()} (sin fecha de evento)`
                      )}
                    </div>

                    {hasCustomTheme && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <ColorPreview color={eventTheme.seat_available} label="Disponible" />
                        <ColorPreview color={eventTheme.seat_selected_me} label="Seleccionado por mí" />
                        <ColorPreview color={eventTheme.seat_selected_other} label="Seleccionado por otro" />
                        <ColorPreview color={eventTheme.seat_blocked} label="Bloqueado" />
                        <ColorPreview color={eventTheme.seat_sold} label="Vendido" />
                        <ColorPreview color={eventTheme.seat_reserved} label="Reservado" />
                      </div>
                    )}
                  </div>

                  <Space>
                    {!hasCustomTheme && selectedEvent === event.id && (
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<PlusOutlined />}
                        onClick={() => handleCreateTheme(event)}
                      >
                        Crear Tema
                      </Button>
                    )}
                    
                    {hasCustomTheme && (
                      <>
                        <Button 
                          size="small" 
                          icon={<EditOutlined />}
                          onClick={() => handleEditTheme(eventTheme)}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="small" 
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => handleDeleteTheme(event.id)}
                        >
                          Eliminar
                        </Button>
                        <Button 
                          size="small" 
                          icon={<EyeOutlined />}
                          onClick={() => handleResetToGlobal(event.id)}
                        >
                          Usar Global
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para editar/crear tema */}
      <Modal
        title={editingTheme ? 'Editar Tema del Evento' : 'Crear Tema del Evento'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTheme}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <Form.Item
              name="seat_available"
              label="Disponible"
              rules={[{ required: true, message: 'Color requerido' }]}
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="seat_selected_me"
              label="Seleccionado por mí"
              rules={[{ required: true, message: 'Color requerido' }]}
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="seat_selected_other"
              label="Seleccionado por otro"
              rules={[{ required: true, message: 'Color requerido' }]}
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="seat_blocked"
              label="Bloqueado"
              rules={[{ required: true, message: 'Color requerido' }]}
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="seat_sold"
              label="Vendido"
              rules={[{ required: true, message: 'Color requerido' }]}
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="seat_reserved"
              label="Reservado"
              rules={[{ required: true, message: 'Color requerido' }]}
            >
              <Input type="color" />
            </Form.Item>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTheme ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EventThemePanel;
