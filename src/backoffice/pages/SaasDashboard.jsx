import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Statistic, Progress, Alert, Tabs, Badge, Tooltip, Avatar, Switch, message, notification } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { supabase } from '../../config/supabase';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const SaasDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    pendingInvoices: 0
  });

  // Cargar tenants y estadísticas
  useEffect(() => {
    loadTenants();
    loadStats();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      message.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Estadísticas básicas
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('status, plan_type');

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('amount, status');

      const totalTenants = tenantsData?.length || 0;
      const activeTenants = tenantsData?.filter(t => t.status === 'active').length || 0;
      const totalRevenue = invoicesData?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
      const pendingInvoices = invoicesData?.filter(i => i.status === 'pending').length || 0;

      setStats({
        totalTenants,
        activeTenants,
        totalRevenue,
        pendingInvoices
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddTenant = () => {
    setEditingTenant(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
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
    setModalVisible(true);
  };

  const handleSaveTenant = async (values) => {
    try {
      if (editingTenant) {
        // Actualizar tenant existente
        const { error } = await supabase
          .from('tenants')
          .update({
            ...values,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTenant.id);

        if (error) throw error;
        message.success('Empresa actualizada correctamente');
      } else {
        // Crear nuevo tenant
        const { error } = await supabase
          .from('tenants')
          .insert([{
            ...values,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
        message.success('Empresa creada correctamente');
      }

      setModalVisible(false);
      loadTenants();
      loadStats();
    } catch (error) {
      console.error('Error saving tenant:', error);
      message.error('Error al guardar empresa');
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      message.success('Empresa eliminada correctamente');
      loadTenants();
      loadStats();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      message.error('Error al eliminar empresa');
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

  const columns = [
    {
      title: 'Empresa',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text, record) => (
        <Space>
          <Avatar 
            src={record.logo_url} 
            icon={<BankOutlined />}
            style={{ backgroundColor: record.primary_color }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.subdomain}.ticketera.com
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (plan) => (
        <Tag color={getPlanColor(plan)}>
          {plan?.toUpperCase() || 'BASIC'}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? 'Activo' : 
           status === 'suspended' ? 'Suspendido' : 
           status === 'cancelled' ? 'Cancelado' : status}
        </Tag>
      ),
    },
    {
      title: 'Contacto',
      dataIndex: 'contact_email',
      key: 'contact_email',
      render: (email, record) => (
        <div>
          <div>{email}</div>
          {record.contact_phone && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.contact_phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('es-ES'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewTenant(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditTenant(record)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => {
                Modal.confirm({
                  title: '¿Eliminar empresa?',
                  content: `¿Estás seguro de que quieres eliminar ${record.company_name}?`,
                  onOk: () => handleDeleteTenant(record.id)
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleViewTenant = (tenant) => {
    // Navegar a la vista detallada del tenant
    window.location.href = `/saas/tenant/${tenant.id}`;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <GlobalOutlined style={{ marginRight: '8px' }} />
          Panel de Administración SaaS
        </Title>
        <Text type="secondary">
          Gestiona todas las empresas que utilizan tu plataforma
        </Text>
      </div>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Empresas"
              value={stats.totalTenants}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Empresas Activas"
              value={stats.activeTenants}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
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
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Facturas Pendientes"
              value={stats.pendingInvoices}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alertas del sistema */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Alert
            message="Sistema SaaS Activo"
            description="Tu plataforma está configurada para manejar múltiples empresas. Todas las nuevas empresas se crearán con subdominios únicos."
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
          />
        </Col>
      </Row>

      {/* Gestión de Tenants */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            Gestión de Empresas
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddTenant}
          >
            Nueva Empresa
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tenants}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} empresas`
          }}
        />
      </Card>

      {/* Modal para crear/editar tenant */}
      <Modal
        title={editingTenant ? 'Editar Empresa' : 'Nueva Empresa'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTenant ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SaasDashboard;
