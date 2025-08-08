import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Statistic, Progress, Alert, Tabs, Badge, Tooltip, Avatar, Switch, message, notification, Timeline, Descriptions, Divider } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  EditOutlined, 
  EyeOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  BellOutlined,
  DatabaseOutlined,
  CloudOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { supabase } from '../../config/supabase';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const TenantDetail = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeEvents: 0
  });
  const [invoices, setInvoices] = useState([]);
  const [usageMetrics, setUsageMetrics] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (tenantId) {
      loadTenantData();
    }
  }, [tenantId]);

  const loadTenantData = async () => {
    setLoading(true);
    try {
      // Cargar datos del tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // Cargar estadísticas
      const { data: eventsData } = await supabase
        .from('eventos')
        .select('id, estado')
        .eq('tenant_id', tenantId);

      const { data: usersData } = await supabase
        .from('usuarios')
        .select('id')
        .eq('tenant_id', tenantId);

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      const { data: metricsData } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      setInvoices(invoicesData || []);
      setUsageMetrics(metricsData || []);

      const totalEvents = eventsData?.length || 0;
      const activeEvents = eventsData?.filter(e => e.estado === 'activo').length || 0;
      const totalUsers = usersData?.length || 0;
      const totalRevenue = invoicesData?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;

      setStats({
        totalEvents,
        totalUsers,
        totalRevenue,
        activeEvents
      });

    } catch (error) {
      console.error('Error loading tenant data:', error);
      message.error('Error al cargar datos de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = () => {
    form.setFieldsValue({
      subdomain: tenant.subdomain,
      company_name: tenant.company_name,
      contact_email: tenant.contact_email,
      contact_phone: tenant.contact_phone,
      plan_type: tenant.plan_type,
      status: tenant.status,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color
    });
    setEditModalVisible(true);
  };

  const handleSaveTenant = async (values) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          ...values,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;
      message.success('Empresa actualizada correctamente');
      setEditModalVisible(false);
      loadTenantData();
    } catch (error) {
      console.error('Error updating tenant:', error);
      message.error('Error al actualizar empresa');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'suspended': return 'orange';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'enterprise': return 'purple';
      case 'pro': return 'blue';
      case 'basic': return 'green';
      default: return 'default';
    }
  };

  const invoiceColumns = [
    {
      title: 'Número',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status === 'paid' ? 'Pagado' : status === 'pending' ? 'Pendiente' : 'Vencido'}
        </Tag>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('es-ES'),
    },
  ];

  const metricsColumns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('es-ES'),
    },
    {
      title: 'Eventos Creados',
      dataIndex: 'events_created',
      key: 'events_created',
    },
    {
      title: 'Usuarios Activos',
      dataIndex: 'active_users',
      key: 'active_users',
    },
    {
      title: 'Ventas',
      dataIndex: 'sales_count',
      key: 'sales_count',
    },
    {
      title: 'Ingresos',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => `$${revenue?.toFixed(2) || '0.00'}`,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>Cargando datos de la empresa...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Empresa no encontrada"
          description="La empresa que buscas no existe o ha sido eliminada."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/saas')}>
              Volver al Panel SaaS
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<GlobalOutlined />} 
          onClick={() => navigate('/saas')}
          style={{ marginBottom: '16px' }}
        >
          Volver al Panel SaaS
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>
              <BankOutlined style={{ marginRight: '8px' }} />
              {tenant.company_name}
            </Title>
            <Text type="secondary">
              {tenant.subdomain}.ticketera.com
            </Text>
          </div>
          <Space>
            <Button icon={<EditOutlined />} onClick={handleEditTenant}>
              Editar Empresa
            </Button>
            <Button type="primary" icon={<EyeOutlined />}>
              Ver Sitio Web
            </Button>
          </Space>
        </div>
      </div>

      {/* Información básica */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <Descriptions title="Información de la Empresa" bordered>
              <Descriptions.Item label="Nombre" span={3}>
                {tenant.company_name}
              </Descriptions.Item>
              <Descriptions.Item label="Subdominio" span={3}>
                {tenant.subdomain}.ticketera.com
              </Descriptions.Item>
              <Descriptions.Item label="Plan">
                <Tag color={getPlanColor(tenant.plan_type)}>
                  {tenant.plan_type?.toUpperCase() || 'BASIC'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={getStatusColor(tenant.status)}>
                  {tenant.status === 'active' ? 'Activo' : 
                   tenant.status === 'suspended' ? 'Suspendido' : 
                   tenant.status === 'cancelled' ? 'Cancelado' : tenant.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Creado">
                {new Date(tenant.created_at).toLocaleDateString('es-ES')}
              </Descriptions.Item>
              <Descriptions.Item label="Email de Contacto" span={2}>
                {tenant.contact_email}
              </Descriptions.Item>
              <Descriptions.Item label="Teléfono">
                {tenant.contact_phone || 'No especificado'}
              </Descriptions.Item>
              <Descriptions.Item label="Colores Personalizados" span={3}>
                <Space>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: tenant.primary_color || '#1890ff',
                        borderRadius: '4px',
                        marginRight: '8px'
                      }} 
                    />
                    <span>Primario: {tenant.primary_color || '#1890ff'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: tenant.secondary_color || '#52c41a',
                        borderRadius: '4px',
                        marginRight: '8px'
                      }} 
                    />
                    <span>Secundario: {tenant.secondary_color || '#52c41a'}</span>
                  </div>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Eventos"
              value={stats.totalEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Eventos Activos"
              value={stats.activeEvents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Usuarios"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos Totales"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs con información detallada */}
      <Card>
        <Tabs defaultActiveKey="billing">
          <TabPane 
            tab={
              <span>
                <CreditCardOutlined />
                Facturación
              </span>
            } 
            key="billing"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button type="primary" icon={<PlusOutlined />}>
                Generar Factura
              </Button>
            </div>
            <Table
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                Métricas de Uso
              </span>
            } 
            key="metrics"
          >
            <Table
              columns={metricsColumns}
              dataSource={usageMetrics}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                Configuración
              </span>
            } 
            key="settings"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Configuración del Plan">
                  <Descriptions column={1}>
                    <Descriptions.Item label="Plan Actual">
                      <Tag color={getPlanColor(tenant.plan_type)}>
                        {tenant.plan_type?.toUpperCase() || 'BASIC'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Límite de Eventos">
                      {tenant.plan_type === 'basic' ? '5 eventos' :
                       tenant.plan_type === 'pro' ? '50 eventos' :
                       tenant.plan_type === 'enterprise' ? 'Sin límite' : '5 eventos'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Límite de Usuarios">
                      {tenant.plan_type === 'basic' ? '100 usuarios' :
                       tenant.plan_type === 'pro' ? '1000 usuarios' :
                       tenant.plan_type === 'enterprise' ? 'Sin límite' : '100 usuarios'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Configuración de Dominio">
                  <Descriptions column={1}>
                    <Descriptions.Item label="Subdominio">
                      {tenant.subdomain}.ticketera.com
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado SSL">
                      <Tag color="green">Activo</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Configuración DNS">
                      <Tag color="green">Configurado</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BellOutlined />
                Actividad Reciente
              </span>
            } 
            key="activity"
          >
            <Timeline>
              <Timeline.Item color="green">
                <p>Empresa creada - {new Date(tenant.created_at).toLocaleDateString('es-ES')}</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <p>Configuración inicial completada</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <p>Primer evento creado</p>
              </Timeline.Item>
              <Timeline.Item color="green">
                <p>Primera venta realizada</p>
              </Timeline.Item>
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal para editar tenant */}
      <Modal
        title="Editar Empresa"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTenant}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subdomain"
                label="Subdominio"
                rules={[
                  { required: true, message: 'El subdominio es requerido' },
                  { pattern: /^[a-z0-9-]+$/, message: 'Solo letras minúsculas, números y guiones' }
                ]}
              >
                <Input 
                  addonAfter=".ticketera.com"
                  placeholder="miempresa"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="Nombre de la Empresa"
                rules={[{ required: true, message: 'El nombre es requerido' }]}
              >
                <Input placeholder="Mi Empresa S.A." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_email"
                label="Email de Contacto"
                rules={[
                  { required: true, message: 'El email es requerido' },
                  { type: 'email', message: 'Email inválido' }
                ]}
              >
                <Input placeholder="contacto@miempresa.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_phone"
                label="Teléfono"
              >
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plan_type"
                label="Plan"
                rules={[{ required: true, message: 'El plan es requerido' }]}
              >
                <Select placeholder="Seleccionar plan">
                  <Option value="basic">Basic</Option>
                  <Option value="pro">Pro</Option>
                  <Option value="enterprise">Enterprise</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Estado"
                rules={[{ required: true, message: 'El estado es requerido' }]}
              >
                <Select placeholder="Seleccionar estado">
                  <Option value="active">Activo</Option>
                  <Option value="suspended">Suspendido</Option>
                  <Option value="cancelled">Cancelado</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="primary_color"
                label="Color Primario"
              >
                <Input type="color" defaultValue="#1890ff" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="secondary_color"
                label="Color Secundario"
              >
                <Input type="color" defaultValue="#52c41a" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Actualizar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantDetail;
