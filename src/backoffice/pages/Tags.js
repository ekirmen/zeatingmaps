import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Form, Select, message, Space, Typography, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { Title, Text } = Typography;

const { TabPane } = Tabs;

const Tags = () => {
  const { currentTenant } = useTenant();
  const [eventTags, setEventTags] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [activeTab, setActiveTab] = useState('event');
  const [form] = Form.useForm();

  useEffect(() => {
    loadTags();
  }, [currentTenant?.id]);

  const loadTags = async () => {
    try {
      setLoading(true);
      
      if (!currentTenant?.id) {
        console.warn('No hay tenant disponible');
        message.warning('No hay tenant configurado');
        return;
      }
      
      // Cargar tags de eventos
      const { data: eventData, error: eventError } = await supabase
        .from('tags')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('name', { ascending: true });

      if (eventError) {
        console.warn('Error loading event tags:', eventError);
      } else {
        console.log('🔍 [Tags] Tags de eventos cargados:', eventData);
        setEventTags(eventData || []);
      }

      // Cargar tags de usuarios
      const { data: userData, error: userError } = await supabase
        .from('user_tags')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('name', { ascending: true });

      if (userError) {
        console.warn('Error loading user tags:', userError);
      } else {
        console.log('🔍 [Tags] Tags de usuarios cargados:', userData);
        setUserTags(userData || []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      message.error('Error al cargar los tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (!currentTenant?.id) {
        message.error('No hay tenant configurado');
        return;
      }
      
      // Validar que el tenant_id sea válido
      if (!currentTenant.id) {
        message.error('No se puede crear tags sin un tenant válido.');
        return;
      }
      
      if (activeTab === 'event') {
        // Guardar tag de evento
        if (editingTag) {
          const { error } = await supabase
            .from('tags')
            .update({ 
              name: values.name,
              tenant_id: currentTenant.id 
            })
            .eq('id', editingTag.id);
          
          if (error) throw error;
          message.success('Tag de evento actualizado correctamente');
        } else {
          const { error } = await supabase
            .from('tags')
            .insert([{ 
              name: values.name,
              tenant_id: currentTenant.id 
            }]);
          
          if (error) throw error;
          message.success('Tag de evento creado correctamente');
        }
      } else {
        // Guardar tag de usuario
        if (editingTag) {
          const { error } = await supabase
            .from('user_tags')
            .update({ 
              name: values.name, 
              description: values.description,
              color: values.color,
              tenant_id: currentTenant.id 
            })
            .eq('id', editingTag.id);
          
          if (error) throw error;
          message.success('Tag de usuario actualizado correctamente');
        } else {
          const { error } = await supabase
            .from('user_tags')
            .insert([{ 
              name: values.name, 
              description: values.description,
              color: values.color,
              tenant_id: currentTenant.id 
            }]);
          
          if (error) throw error;
          message.success('Tag de usuario creado correctamente');
        }
      }

      setModalVisible(false);
      setEditingTag(null);
      form.resetFields();
      loadTags();
    } catch (error) {
      console.error('Error saving tag:', error);
      message.error('Error al guardar el tag: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#1890ff'
    });
    setModalVisible(true);
  };

  const handleDelete = async (tag) => {
    try {
      if (activeTab === 'event') {
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('id', tag.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_tags')
          .delete()
          .eq('id', tag.id);
        
        if (error) throw error;
      }
      
      message.success('Tag eliminado correctamente');
      loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      message.error('Error al eliminar el tag');
    }
  };

  const renderTagList = (tags, type) => (
    <div className="space-y-4">
      {Array.isArray(tags) && tags.map(tag => (
        <Card key={tag.id} size="small">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {type === 'user' && (
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: tag.color || '#1890ff' }}
                />
              )}
              <div>
                <Text strong>{tag.name}</Text>
                {type === 'user' && tag.description && (
                  <div className="text-sm text-gray-500">{tag.description}</div>
                )}
              </div>
            </div>
            <Space>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(tag)}
              >
                Editar
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(tag)}
              >
                Eliminar
              </Button>
            </Space>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Tags</h1>
        <p className="text-gray-600 mb-4">Administra tags para eventos y usuarios</p>
        {currentTenant && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">
              Tenant: {currentTenant.company_name || currentTenant.id}
            </span>
          </div>
        )}
        {!currentTenant?.id && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">
              ⚠️ No hay tenant configurado
            </span>
          </div>
        )}
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <CalendarOutlined />
              Tags de Eventos
            </span>
          } 
          key="event"
        >
          <Card 
            title="Tags de Eventos" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTag(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                Nuevo Tag
              </Button>
            }
          >
            {renderTagList(eventTags, 'event')}
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <UserOutlined />
              Tags de Usuarios
            </span>
          } 
          key="user"
        >
          <Card 
            title="Tags de Usuarios" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTag(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                Nuevo Tag
              </Button>
            }
          >
            {renderTagList(userTags, 'user')}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={`${editingTag ? 'Editar' : 'Crear'} Tag de ${activeTab === 'event' ? 'Evento' : 'Usuario'}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTag(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Nombre del Tag"
            rules={[{ required: true, message: 'Por favor ingresa el nombre del tag' }]}
          >
            <Input placeholder="Ejemplo: VIP, Premium, etc." />
          </Form.Item>

          {activeTab === 'user' && (
            <>
              <Form.Item
                name="description"
                label="Descripción"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Descripción opcional del tag"
                />
              </Form.Item>

              <Form.Item
                name="color"
                label="Color"
                initialValue="#1890ff"
              >
                <Input type="color" />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTag ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingTag(null);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tags;
