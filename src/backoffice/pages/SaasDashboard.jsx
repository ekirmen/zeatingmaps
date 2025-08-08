import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Statistic, Progress, Alert, Tabs, Badge, Tooltip, Avatar, Switch, message, notification, Descriptions, Divider, List, Timeline, Drawer, TreeSelect } from 'antd';
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
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  DatabaseOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  CopyOutlined,
  LinkOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  WarningFilled
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

const SaasDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetailVisible, setTenantDetailVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [clientDataDrawerVisible, setClientDataDrawerVisible] = useState(false);
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    totalEvents: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0
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
      const [tenantsData, invoicesData, eventsData, usersData, productsData, salesData] = await Promise.all([
        supabase.from('tenants').select('status, plan_type'),
        supabase.from('invoices').select('amount, status'),
        supabase.from('eventos').select('id'),
        supabase.from('usuarios').select('id'),
        supabase.from('productos').select('id'),
        supabase.from('ventas').select('id, monto')
      ]);

      const totalTenants = tenantsData.data?.length || 0;
      const activeTenants = tenantsData.data?.filter(t => t.status === 'active').length || 0;
      const totalRevenue = invoicesData.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
      const pendingInvoices = invoicesData.data?.filter(i => i.status === 'pending').length || 0;
      const totalEvents = eventsData.data?.length || 0;
      const totalUsers = usersData.data?.length || 0;
      const totalProducts = productsData.data?.length || 0;
      const totalSales = salesData.data?.length || 0;

      setStats({
        totalTenants,
        activeTenants,
        totalRevenue,
        pendingInvoices,
        totalEvents,
        totalUsers,
        totalProducts,
        totalSales
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
      logo_url: tenant.logo_url
    });
    setModalVisible(true);
  };

  const handleViewTenant = async (tenant) => {
    setSelectedTenant(tenant);
    setTenantDetailVisible(true);
  };

  const handleSupportAction = (tenant) => {
    setSelectedTenant(tenant);
    setSupportModalVisible(true);
  };

  const handleViewClientData = async (tenant, dataType) => {
    setSelectedTenant(tenant);
    setSelectedClientData({ type: dataType, tenant });
    setClientDataDrawerVisible(true);
  };

  const handleSaveTenant = async (values) => {
    try {
      if (editingTenant) {
        // Actualizar tenant existente
        const { error } = await supabase
          .from('tenants')
          .update(values)
          .eq('id', editingTenant.id);

        if (error) throw error;
        message.success('Empresa actualizada correctamente');
      } else {
        // Crear nuevo tenant
        const { error } = await supabase
          .from('tenants')
          .insert([values]);

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

  const handleSupportAction = async (action, data) => {
    try {
      let query;
      
      switch (action) {
        case 'update_event':
          query = supabase
            .from('eventos')
            .update(data)
            .eq('id', data.id)
            .eq('tenant_id', selectedTenant.id);
          break;
        case 'update_user':
          query = supabase
            .from('usuarios')
            .update(data)
            .eq('id', data.id)
            .eq('tenant_id', selectedTenant.id);
          break;
        case 'update_product':
          query = supabase
            .from('productos')
            .update(data)
            .eq('id', data.id)
            .eq('tenant_id', selectedTenant.id);
          break;
        case 'delete_event':
          query = supabase
            .from('eventos')
            .delete()
            .eq('id', data.id)
            .eq('tenant_id', selectedTenant.id);
          break;
        default:
          throw new Error('Acción no válida');
      }

      const { error } = await query;
      if (error) throw error;

      message.success('Acción realizada correctamente');
      setSupportModalVisible(false);
    } catch (error) {
      console.error('Error in support action:', error);
      message.error('Error al realizar la acción');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'suspended': return 'orange';
      case 'pending': return 'blue';
      default: return 'default';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'basic': return 'blue';
      case 'pro': return 'purple';
      case 'enterprise': return 'red';
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
            <div style={{ fontWeight: '500' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.subdomain}.ticketera.com
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contacto',
      dataIndex: 'contact_email',
      key: 'contact_email',
      render: (email, record) => (
        <div>
          <div>{email}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.contact_phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (plan) => (
        <Tag color={getPlanColor(plan)}>
          {plan?.toUpperCase()}
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
           status === 'inactive' ? 'Inactivo' : 
           status === 'suspended' ? 'Suspendido' : 
           status === 'pending' ? 'Pendiente' : status}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewTenant(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditTenant(record)}
          >
            Editar
          </Button>
          <Button 
            type="link" 
            icon={<CustomerServiceOutlined />}
            onClick={() => handleSupportAction(record)}
          >
            Soporte
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTenant(record.id)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BankOutlined style={{ marginRight: '8px' }} />
        Panel de Administración SaaS
      </Title>

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
              value={`$${stats.totalRevenue.toLocaleString()}`}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Facturas Pendientes"
              value={stats.pendingInvoices}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Estadísticas adicionales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Eventos"
              value={stats.totalEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Usuarios"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Productos"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Ventas"
              value={stats.totalSales}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Empresas */}
      <Card
        title="Gestión de Empresas"
        extra={
          <Space>
            <Button icon={<SearchOutlined />}>
              Buscar
            </Button>
            <Button icon={<FilterOutlined />}>
              Filtros
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTenant}>
              Agregar Empresa
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={tenants}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} empresas`
          }}
        />
      </Card>

      {/* Modal para agregar/editar tenant */}
      <Modal
        title={editingTenant ? 'Editar Empresa' : 'Agregar Nueva Empresa'}
        visible={modalVisible}
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
                rules={[{ required: true, message: 'Subdominio requerido' }]}
              >
                <Input addonAfter=".ticketera.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="Nombre de la Empresa"
                rules={[{ required: true, message: 'Nombre requerido' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_email"
                label="Email de Contacto"
                rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_phone"
                label="Teléfono"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plan_type"
                label="Plan"
                rules={[{ required: true, message: 'Plan requerido' }]}
              >
                <Select>
                  <Option value="basic">Básico</Option>
                  <Option value="pro">Profesional</Option>
                  <Option value="enterprise">Empresarial</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Estado"
                rules={[{ required: true, message: 'Estado requerido' }]}
              >
                <Select>
                  <Option value="active">Activo</Option>
                  <Option value="inactive">Inactivo</Option>
                  <Option value="suspended">Suspendido</Option>
                  <Option value="pending">Pendiente</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="primary_color"
                label="Color Principal"
              >
                <Input type="color" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="logo_url"
                label="URL del Logo"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTenant ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de detalles del tenant */}
      <Modal
        title={`Detalles de ${selectedTenant?.company_name}`}
        visible={tenantDetailVisible}
        onCancel={() => setTenantDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTenant && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Empresa">{selectedTenant.company_name}</Descriptions.Item>
              <Descriptions.Item label="Subdominio">{selectedTenant.subdomain}.ticketera.com</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedTenant.contact_email}</Descriptions.Item>
              <Descriptions.Item label="Teléfono">{selectedTenant.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="Plan">
                <Tag color={getPlanColor(selectedTenant.plan_type)}>
                  {selectedTenant.plan_type?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={getStatusColor(selectedTenant.status)}>
                  {selectedTenant.status === 'active' ? 'Activo' : 
                   selectedTenant.status === 'inactive' ? 'Inactivo' : 
                   selectedTenant.status === 'suspended' ? 'Suspendido' : 
                   selectedTenant.status === 'pending' ? 'Pendiente' : selectedTenant.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Creación">
                {new Date(selectedTenant.created_at).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización">
                {new Date(selectedTenant.updated_at).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={4}>Acciones de Soporte</Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button 
                  icon={<ToolOutlined />} 
                  onClick={() => handleSupportAction(selectedTenant)}
                  block
                >
                  Acciones de Soporte
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<DatabaseOutlined />} 
                  onClick={() => window.open(`https://${selectedTenant.subdomain}.ticketera.com`, '_blank')}
                  block
                >
                  Ver Sitio Web del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<KeyOutlined />} 
                  onClick={() => window.open(`https://${selectedTenant.subdomain}.ticketera.com/dashboard`, '_blank')}
                  block
                >
                  Acceder al Dashboard del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<FileTextOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'events')}
                  block
                >
                  Ver Eventos del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<UserOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'users')}
                  block
                >
                  Ver Usuarios del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<ShoppingOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'products')}
                  block
                >
                  Ver Productos del Cliente
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Modal de soporte */}
      <Modal
        title={`Soporte - ${selectedTenant?.company_name}`}
        visible={supportModalVisible}
        onCancel={() => setSupportModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedTenant && (
          <Tabs defaultActiveKey="events">
            <TabPane tab="Eventos" key="events">
              <TenantEventsSupport tenant={selectedTenant} onAction={handleSupportAction} />
            </TabPane>
            <TabPane tab="Usuarios" key="users">
              <TenantUsersSupport tenant={selectedTenant} onAction={handleSupportAction} />
            </TabPane>
            <TabPane tab="Productos" key="products">
              <TenantProductsSupport tenant={selectedTenant} onAction={handleSupportAction} />
            </TabPane>
            <TabPane tab="Configuración" key="config">
              <TenantConfigSupport tenant={selectedTenant} onAction={handleSupportAction} />
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Drawer para ver datos del cliente */}
      <Drawer
        title={`Datos de ${selectedClientData?.tenant?.company_name} - ${selectedClientData?.type === 'events' ? 'Eventos' : selectedClientData?.type === 'users' ? 'Usuarios' : 'Productos'}`}
        placement="right"
        width={800}
        onClose={() => setClientDataDrawerVisible(false)}
        visible={clientDataDrawerVisible}
      >
        {selectedClientData && (
          <ClientDataViewer 
            tenant={selectedClientData.tenant} 
            dataType={selectedClientData.type}
            onAction={handleSupportAction}
          />
        )}
      </Drawer>
    </div>
  );
};

// Componentes de soporte
const TenantEventsSupport = ({ tenant, onAction }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [tenant]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId, updates) => {
    await onAction('update_event', { id: eventId, ...updates });
    loadEvents();
  };

  const handleDeleteEvent = async (eventId) => {
    await onAction('delete_event', { id: eventId });
    loadEvents();
  };

  return (
    <div>
      <List
        loading={loading}
        dataSource={events}
        renderItem={(event) => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => handleUpdateEvent(event.id, { estado: 'active' })}>
                Activar
              </Button>,
              <Button size="small" onClick={() => handleUpdateEvent(event.id, { precio: 0 })}>
                Hacer Gratis
              </Button>,
              <Button size="small" danger onClick={() => handleDeleteEvent(event.id)}>
                Eliminar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={event.nombre}
              description={`${event.fecha} - ${event.ubicacion} - $${event.precio}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

const TenantUsersSupport = ({ tenant, onAction }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [tenant]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    await onAction('update_user', { id: userId, ...updates });
    loadUsers();
  };

  return (
    <div>
      <List
        loading={loading}
        dataSource={users}
        renderItem={(user) => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => handleUpdateUser(user.id, { rol: 'admin' })}>
                Hacer Admin
              </Button>,
              <Button size="small" onClick={() => handleUpdateUser(user.id, { estado: 'active' })}>
                Activar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={user.nombre}
              description={`${user.email} - ${user.rol}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

const TenantProductsSupport = ({ tenant, onAction }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [tenant]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (productId, updates) => {
    await onAction('update_product', { id: productId, ...updates });
    loadProducts();
  };

  return (
    <div>
      <List
        loading={loading}
        dataSource={products}
        renderItem={(product) => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => handleUpdateProduct(product.id, { precio: 0 })}>
                Hacer Gratis
              </Button>,
              <Button size="small" onClick={() => handleUpdateProduct(product.id, { stock: 999 })}>
                Agregar Stock
              </Button>
            ]}
          >
            <List.Item.Meta
              title={product.nombre}
              description={`$${product.precio} - Stock: ${product.stock}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

const TenantConfigSupport = ({ tenant, onAction }) => {
  return (
    <div>
      <Alert
        message="Configuración del Tenant"
        description="Aquí puedes modificar la configuración general del cliente"
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      
      <List>
        <List.Item>
          <List.Item.Meta
            title="Cambiar Plan"
            description="Actualizar el plan del cliente"
          />
          <Select defaultValue={tenant.plan_type} style={{ width: 120 }}>
            <Option value="basic">Básico</Option>
            <Option value="pro">Profesional</Option>
            <Option value="enterprise">Empresarial</Option>
          </Select>
        </List.Item>
        
        <List.Item>
          <List.Item.Meta
            title="Cambiar Estado"
            description="Activar o suspender el tenant"
          />
          <Select defaultValue={tenant.status} style={{ width: 120 }}>
            <Option value="active">Activo</Option>
            <Option value="suspended">Suspendido</Option>
            <Option value="inactive">Inactivo</Option>
          </Select>
        </List.Item>
      </List>
    </div>
  );
};

// Componente para ver datos del cliente
const ClientDataViewer = ({ tenant, dataType, onAction }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tenant, dataType]);

  const loadData = async () => {
    try {
      let query;
      switch (dataType) {
        case 'events':
          query = supabase.from('eventos').select('*').eq('tenant_id', tenant.id);
          break;
        case 'users':
          query = supabase.from('usuarios').select('*').eq('tenant_id', tenant.id);
          break;
        case 'products':
          query = supabase.from('productos').select('*').eq('tenant_id', tenant.id);
          break;
        default:
          return;
      }

      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDataItem = (item) => {
    switch (dataType) {
      case 'events':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_event', { id: item.id, nombre: 'Evento Modificado' })}>
                Modificar Nombre
              </Button>,
              <Button size="small" onClick={() => onAction('update_event', { id: item.id, precio: 0 })}>
                Hacer Gratis
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`${item.fecha} - ${item.ubicacion} - $${item.precio}`}
            />
          </List.Item>
        );
      case 'users':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_user', { id: item.id, rol: 'admin' })}>
                Hacer Admin
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`${item.email} - ${item.rol}`}
            />
          </List.Item>
        );
      case 'products':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_product', { id: item.id, precio: 0 })}>
                Hacer Gratis
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`$${item.precio} - Stock: ${item.stock}`}
            />
          </List.Item>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <List
        loading={loading}
        dataSource={data}
        renderItem={renderDataItem}
      />
    </div>
  );
};

export default SaasDashboard;
