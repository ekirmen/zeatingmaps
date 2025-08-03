import React, { useState, useEffect } from 'react';
import { useTags } from '../contexts/TagContext';
import { Card, Button, Input, Modal, Form, Select, ColorPicker, message, Space, Tag, Typography, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Tags = () => {
  const [eventTags, setEventTags] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [activeTab, setActiveTab] = useState('event');
  const [form] = Form.useForm();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      
      // Cargar tags de eventos
      const { data: eventData, error: eventError } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (eventError) {
        console.warn('Error loading event tags:', eventError);
      } else {
        setEventTags(eventData || []);
      }

      // Cargar tags de usuarios
      const { data: userData, error: userError } = await supabase
        .from('user_tags')
        .select('*')
        .order('name', { ascending: true });

      if (userError) {
        console.warn('Error loading user tags:', userError);
      } else {
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
      
      if (activeTab === 'event') {
        // Guardar tag de evento
        if (editingTag) {
          const { error } = await supabase
            .from('tags')
            .update({ name: values.name })
            .eq('id', editingTag.id);
          
          if (error) throw error;
          message.success('Tag de evento actualizado correctamente');
        } else {
          const { error } = await supabase
            .from('tags')
            .insert([{ name: values.name }]);
          
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
              color: values.color 
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
              color: values.color 
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
      message.error('Error al guardar el tag');
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
      {tags.map(tag => (
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
      <Title level={2}>Gestión de Tags</Title>
      
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
