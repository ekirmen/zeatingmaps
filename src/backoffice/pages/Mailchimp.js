import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, message, Badge, Tabs, Switch } from 'antd';
import { MailOutlined, UserAddOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { TabPane } = Tabs;

const Mailchimp = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar suscriptores
      const { data: suscriptoresData } = await supabase
        .from('profiles')
        .select('*')
        .eq('mailchimp_subscribed', true)
        .order('created_at', { ascending: false });

      // Cargar campañas (simulado)
      const campañasSimuladas = [
        {
          id: 1,
          nombre: 'Bienvenida',
          estado: 'enviada',
          fecha_envio: '2024-01-15',
          destinatarios: 150,
          aperturas: 45,
          clicks: 12
        },
        {
          id: 2,
          nombre: 'Nuevo Evento',
          estado: 'programada',
          fecha_envio: '2024-01-20',
          destinatarios: 200,
          aperturas: 0,
          clicks: 0
        }
      ];

      setSubscribers(suscriptoresData || []);
      setCampaigns(campañasSimuladas);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMailchimp = async () => {
    try {
      message.loading('Sincronizando con Mailchimp...', 0);
      
      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.destroy();
      message.success('Sincronización completada');
      loadData();
    } catch (error) {
      message.destroy();
      console.error('Error syncing with Mailchimp:', error);
      message.error('Error al sincronizar con Mailchimp');
    }
  };

  const handleSaveConfig = async (values) => {
    try {
      // Guardar configuración de Mailchimp
      localStorage.setItem('mailchimp_config', JSON.stringify(values));
      message.success('Configuración guardada exitosamente');
      setIsConfigModalVisible(false);
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('Error al guardar configuración');
    }
  };

  const subscriberColumns = [
    {
      title: 'Nombre',
      dataIndex: 'login',
      key: 'login',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
    },
    {
      title: 'Estado',
      dataIndex: 'mailchimp_subscribed',
      key: 'mailchimp_subscribed',
      render: (subscribed) => (
        <Tag color={subscribed ? 'green' : 'red'}>
          {subscribed ? 'Suscrito' : 'No suscrito'}
        </Tag>
      ),
    },
    {
      title: 'Fecha suscripción',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (fecha) => new Date(fecha).toLocaleDateString(),
    },
  ];

  const campaignColumns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'enviada' ? 'green' : estado === 'programada' ? 'blue' : 'orange'}>
          {estado}
        </Tag>
      ),
    },
    {
      title: 'Fecha envío',
      dataIndex: 'fecha_envio',
      key: 'fecha_envio',
      render: (fecha) => new Date(fecha).toLocaleDateString(),
    },
    {
      title: 'Destinatarios',
      dataIndex: 'destinatarios',
      key: 'destinatarios',
    },
    {
      title: 'Aperturas',
      dataIndex: 'aperturas',
      key: 'aperturas',
    },
    {
      title: 'Clicks',
      dataIndex: 'clicks',
      key: 'clicks',
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
                title: `Campaña: ${record.nombre}`,
                content: (
                  <div>
                    <p><strong>Estado:</strong> {record.estado}</p>
                    <p><strong>Fecha de envío:</strong> {new Date(record.fecha_envio).toLocaleDateString()}</p>
                    <p><strong>Destinatarios:</strong> {record.destinatarios}</p>
                    <p><strong>Aperturas:</strong> {record.aperturas}</p>
                    <p><strong>Clicks:</strong> {record.clicks}</p>
                    <p><strong>Tasa de apertura:</strong> {((record.aperturas / record.destinatarios) * 100).toFixed(1)}%</p>
                    <p><strong>Tasa de clicks:</strong> {((record.clicks / record.destinatarios) * 100).toFixed(1)}%</p>
                  </div>
                ),
              });
            }}
          >
            Ver
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mailchimp - Gestión de Email Marketing</h1>
          <p className="text-gray-600">Sincronización y gestión de campañas de email</p>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<SyncOutlined />}
            onClick={handleSyncMailchimp}
            type="primary"
          >
            Sincronizar
          </Button>
          <Button
            icon={<MailOutlined />}
            onClick={() => setIsConfigModalVisible(true)}
          >
            Configuración
          </Button>
        </div>
      </div>

      <Tabs defaultActiveKey="subscribers">
        <TabPane tab="Suscriptores" key="subscribers">
          <Card title="Suscriptores de Mailchimp" extra={<Badge count={subscribers.length} />}>
            <Table
              dataSource={subscribers}
              columns={subscriberColumns}
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

        <TabPane tab="Campañas" key="campaigns">
          <Card title="Campañas de Email">
            <Table
              dataSource={campaigns}
              columns={campaignColumns}
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
      </Tabs>

      {/* Modal de configuración */}
      <Modal
        title="Configuración de Mailchimp"
        open={isConfigModalVisible}
        onCancel={() => {
          setIsConfigModalVisible(false);
          configForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
          initialValues={{
            apiKey: localStorage.getItem('mailchimp_api_key') || '',
            listId: localStorage.getItem('mailchimp_list_id') || '',
            serverPrefix: localStorage.getItem('mailchimp_server_prefix') || '',
            autoSync: localStorage.getItem('mailchimp_auto_sync') === 'true',
          }}
        >
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: 'Por favor ingrese la API Key' }]}
          >
            <Input.Password placeholder="Ingrese su API Key de Mailchimp" />
          </Form.Item>

          <Form.Item
            name="listId"
            label="ID de Lista"
            rules={[{ required: true, message: 'Por favor ingrese el ID de la lista' }]}
          >
            <Input placeholder="Ingrese el ID de la lista de Mailchimp" />
          </Form.Item>

          <Form.Item
            name="serverPrefix"
            label="Prefijo del Servidor"
            rules={[{ required: true, message: 'Por favor ingrese el prefijo del servidor' }]}
          >
            <Input placeholder="Ej: us1, us2, etc." />
          </Form.Item>

          <Form.Item
            name="autoSync"
            label="Sincronización Automática"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Guardar Configuración
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Mailchimp;
