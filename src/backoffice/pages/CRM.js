import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Badge, Tabs } from 'antd';
import { BellOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { TabPane } = Tabs;
const { Option } = Select;

const CRM = () => {
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notificationForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 🎯 CARGAR DATOS BÁSICOS
      const [eventosData, funcionesData, usuariosData, notificacionesData] = await Promise.all([
        // Eventos
        supabase
          .from('eventos_con_funciones_activas')
          .select('*')
          .order('created_at', { ascending: false }),

        // Funciones
        supabase
          .from('funciones')
          .select('*')
          .order('fecha', { ascending: false }),

        // Usuarios (profiles)
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),

        // Notificaciones
        supabase
          .from('notifications')
          .select(`
            *,
            eventos:evento_id(nombre),
            funciones:funcion_id(fecha, hora)
          `)
          .order('created_at', { ascending: false })
      ]);

      // 🎯 CARGAR DATOS CRM ESPECIALIZADOS
      const fetchProfilesMap = async (userIds, selectFields = 'id, nombre, email:login') => {
        const uniqueIds = Array.from(new Set((userIds || []).filter(Boolean)));
        if (!uniqueIds.length) {
          return new Map();
        }

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(selectFields)
          .in('id', uniqueIds);

        if (profilesError || !profilesData) {
          if (profilesError) {
            console.error('Error al cargar perfiles relacionados para CRM:', profilesError);
          }
          return new Map();
        }

        return new Map(profilesData.map((profile) => [profile.id, profile]));
      };

      const fetchCrmClients = async () => {
        const { data, error } = await supabase
          .from('crm_clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar clientes CRM:', error);
          return { data: [], error };
        }

        const profilesMap = await fetchProfilesMap(data?.map((client) => client.user_id), 'id, nombre, email:login, telefono');
        const enrichedData = (data || []).map((client) => ({
          ...client,
          profile: client.user_id ? profilesMap.get(client.user_id) || null : null
        }));

        return { data: enrichedData, error: null };
      };

      const fetchCrmInteractions = async () => {
        const { data, error } = await supabase
          .from('crm_interactions')
          .select(`
            *,
            crm_clients:client_id(nombre, email)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar interacciones CRM:', error);
          return { data: [], error };
        }

        const profilesMap = await fetchProfilesMap(data?.map((interaction) => interaction.user_id));
        const enrichedData = (data || []).map((interaction) => ({
          ...interaction,
          user_profile: interaction.user_id ? profilesMap.get(interaction.user_id) || null : null
        }));

        return { data: enrichedData, error: null };
      };

      const fetchCrmNotes = async () => {
        const { data, error } = await supabase
          .from('crm_notes')
          .select(`
            *,
            crm_clients:client_id(nombre, email)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar notas CRM:', error);
          return { data: [], error };
        }

        const profilesMap = await fetchProfilesMap(data?.map((note) => note.user_id));
        const enrichedData = (data || []).map((note) => ({
          ...note,
          user_profile: note.user_id ? profilesMap.get(note.user_id) || null : null
        }));

        return { data: enrichedData, error: null };
      };

      const [crmClientsData, crmInteractionsData, crmNotesData, crmOpportunitiesData, crmTagsData] = await Promise.all([
        fetchCrmClients(),
        fetchCrmInteractions(),
        fetchCrmNotes(),
        // Oportunidades CRM
        supabase
          .from('crm_opportunities')
          .select(`
            *,
            crm_clients:client_id(nombre, email),
            eventos:evento_id(nombre)
          `)
          .order('created_at', { ascending: false }),

        // Tags CRM
        supabase
          .from('crm_tags')
          .select('*')
          .order('nombre', { ascending: true })
      ]);

      // ✅ ESTABLECER DATOS BÁSICOS
      setEvents(eventosData.data || []);
      setFunctions(funcionesData.data || []);
      setUsers(usuariosData.data || []);
      setNotifications(notificacionesData.data || []);

      // ✅ ESTABLECER DATOS CRM (con fallback si las tablas no existen)
      // Guardar datos CRM en el estado (se pueden usar en componentes futuros)
      if (crmClientsData.data) {
      }
      if (crmInteractionsData.data) {
      }
      if (crmNotesData.data) {
      }
      if (crmOpportunitiesData.data) {
      }
      if (crmTagsData.data) {
      }

    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (values) => {
    try {
      const notificationData = {
        titulo: values.titulo,
        mensaje: values.mensaje,
        tipo: values.tipo,
        evento_id: selectedEvent,
        funcion_id: selectedFunction,
        usuarios_destinatarios: selectedUsers,
        estado: 'pendiente',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notificationData]);

      if (error) throw error;

      message.success('Notificación creada exitosamente');
      setIsNotificationModalVisible(false);
      notificationForm.resetFields();
      setSelectedEvent(null);
      setSelectedFunction(null);
      setSelectedUsers([]);
      loadData();
    } catch (error) {
      console.error('Error creating notification:', error);
      message.error('Error al crear notificación');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ estado: 'leida' })
        .eq('id', notificationId);

      if (error) throw error;

      message.success('Notificación marcada como leída');
      loadData();
    } catch (error) {
      console.error('Error updating notification:', error);
      message.error('Error al actualizar notificación');
    }
  };

  const notificationColumns = [
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
    },
    {
      title: 'Mensaje',
      dataIndex: 'mensaje',
      key: 'mensaje',
      ellipsis: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={tipo === 'urgente' ? 'red' : tipo === 'importante' ? 'orange' : 'blue'}>
          {tipo}
        </Tag>
      ),
    },
    {
      title: 'Evento',
      dataIndex: ['eventos', 'nombre'],
      key: 'evento',
    },
    {
      title: 'Función',
      dataIndex: ['funciones', 'fecha'],
      key: 'funcion',
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : '-',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'leida' ? 'green' : 'orange'}>
          {estado}
        </Tag>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (fecha) => new Date(fecha).toLocaleString(),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: record.titulo,
                content: (
                  <div>
                    <p><strong>Mensaje:</strong> {record.mensaje}</p>
                    <p><strong>Tipo:</strong> {record.tipo}</p>
                    <p><strong>Evento:</strong> {record.eventos?.nombre || 'N/A'}</p>
                    <p><strong>Función:</strong> {record.funciones?.fecha ? new Date(record.funciones.fecha).toLocaleString() : 'N/A'}</p>
                    <p><strong>Usuarios destinatarios:</strong> {record.usuarios_destinatarios?.length || 0}</p>
                  </div>
                ),
              });
            }}
          >
            Ver
          </Button>
          {record.estado !== 'leida' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleMarkAsRead(record.id)}
            >
              Marcar como leída
            </Button>
          )}
        </div>
      ),
    },
  ];

  const unreadCount = notifications.filter(n => n.estado === 'pendiente').length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CRM - Gestión de Clientes</h1>
          <p className="text-gray-600">Gestión de clientes, notificaciones y comunicación</p>
        </div>
        <div className="flex gap-2">
          <Badge count={unreadCount} showZero={false}>
            <Button
              icon={<BellOutlined />}
              onClick={() => setIsNotificationModalVisible(true)}
              type="primary"
            >
              Crear Notificación
            </Button>
          </Badge>
        </div>
      </div>

      <Tabs defaultActiveKey="notifications">
        <TabPane tab="Notificaciones" key="notifications">
          <Card title="Sistema de Notificaciones" extra={<Badge count={unreadCount} />}>
            <Table
              dataSource={notifications}
              columns={notificationColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Clientes" key="clients">
          <Card title="Gestión de Clientes">
            <Table
              dataSource={users}
              columns={[
                { title: 'Nombre', dataIndex: 'login', key: 'login' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Empresa', dataIndex: 'empresa', key: 'empresa' },
                { title: 'Teléfono', dataIndex: 'telefono', key: 'telefono' },
                {
                  title: 'Estado',
                  dataIndex: 'activo',
                  key: 'activo',
                  render: (activo) => (
                    <Tag color={activo ? 'green' : 'red'}>
                      {activo ? 'Activo' : 'Inactivo'}
                    </Tag>
                  ),
                },
              ]}
              rowKey="id"
              loading={loading}
            />
          </Card>
        </TabPane>

        <TabPane tab="Eventos" key="events">
          <Card title="Eventos Disponibles">
            <Table
              dataSource={events}
              columns={[
                { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
                { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion', ellipsis: true },
                {
                  title: 'Fecha',
                  dataIndex: 'fecha',
                  key: 'fecha',
                  render: (fecha) => new Date(fecha).toLocaleDateString(),
                },
              ]}
              rowKey="id"
              loading={loading}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal para crear notificación */}
      <Modal
        title="Crear Nueva Notificación"
        open={isNotificationModalVisible}
        onCancel={() => {
          setIsNotificationModalVisible(false);
          notificationForm.resetFields();
          setSelectedEvent(null);
          setSelectedFunction(null);
          setSelectedUsers([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={notificationForm}
          layout="vertical"
          onFinish={handleCreateNotification}
        >
          <Form.Item
            name="titulo"
            label="Título"
            rules={[{ required: true, message: 'Por favor ingrese el título' }]}
          >
            <Input placeholder="Título de la notificación" />
          </Form.Item>

          <Form.Item
            name="mensaje"
            label="Mensaje"
            rules={[{ required: true, message: 'Por favor ingrese el mensaje' }]}
          >
            <Input.TextArea rows={4} placeholder="Mensaje de la notificación" />
          </Form.Item>

          <Form.Item
            name="tipo"
            label="Tipo"
            rules={[{ required: true, message: 'Por favor seleccione el tipo' }]}
          >
            <Select placeholder="Seleccione el tipo">
              <Option value="informativa">Informativa</Option>
              <Option value="importante">Importante</Option>
              <Option value="urgente">Urgente</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Evento (Opcional)">
            <Select
              placeholder="Seleccione un evento"
              value={selectedEvent}
              onChange={setSelectedEvent}
              allowClear
            >
              {events.map(event => (
                <Option key={event.id} value={event.id}>
                  {event.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Función (Opcional)">
            <Select
              placeholder="Seleccione una función"
              value={selectedFunction}
              onChange={setSelectedFunction}
              allowClear
            >
              {functions.map(func => (
                <Option key={func.id} value={func.id}>
                  {func.fecha} - {func.hora}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Usuarios Destinatarios">
            <Select
              mode="multiple"
              placeholder="Seleccione usuarios"
              value={selectedUsers}
              onChange={setSelectedUsers}
              allowClear
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.login} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Crear Notificación
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CRM;