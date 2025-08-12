import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Statistic, Alert, Tabs, Badge, Avatar, message, Descriptions, Divider, List, Drawer, Dropdown, Menu } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SettingOutlined,
  BarChartOutlined,
  GlobalOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  DatabaseOutlined,
  KeyOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  CloudUploadOutlined,
  AuditOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
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
  
  // Nuevos estados para funcionalidades mejoradas
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    plan: 'all',
    dateRange: null,
    searchTerm: ''
  });
  const [advancedMetrics, setAdvancedMetrics] = useState({
    monthlyGrowth: 0,
    churnRate: 0,
    averageRevenue: 0,
    topPerformingTenants: [],
    recentActivity: []
  });
  
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    totalEvents: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    pendingSupportTickets: 0,
    criticalAlerts: 0
  });

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'admin')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Cargar métricas avanzadas
  const loadAdvancedMetrics = useCallback(async () => {
    try {
      // Cálculo de crecimiento mensual
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const [currentMonthTenants, lastMonthTenants] = await Promise.all([
        supabase.from('tenants').select('id').gte('created_at', new Date().toISOString().slice(0, 7)),
        supabase.from('tenants').select('id').gte('created_at', lastMonth.toISOString().slice(0, 7)).lt('created_at', new Date().toISOString().slice(0, 7))
      ]);

      const currentCount = currentMonthTenants.data?.length || 0;
      const lastCount = lastMonthTenants.data?.length || 0;
      const growth = lastCount > 0 ? ((currentCount - lastCount) / lastCount) * 100 : 0;

      // Top performing tenants
      const { data: topTenants } = await supabase
        .from('tenants')
        .select('company_name, total_revenue')
        .order('total_revenue', { ascending: false })
        .limit(5);

      setAdvancedMetrics({
        monthlyGrowth: growth,
        churnRate: 2.5, // Placeholder
        averageRevenue: 1250, // Placeholder
        topPerformingTenants: topTenants || [],
        recentActivity: []
      });
    } catch (error) {
      console.error('Error loading advanced metrics:', error);
    }
  }, []);

  const logAuditAction = async (action, details, tenantId = null) => {
    try {
      await supabase.from('audit_logs').insert({
        action,
        details,
        tenant_id: tenantId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const createBackup = async (tenantId) => {
    try {
      const { error } = await supabase.from('backups').insert({
        tenant_id: tenantId,
        backup_type: 'manual',
        status: 'completed',
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      message.success('Backup creado exitosamente');
      await logAuditAction('backup_created', { tenant_id: tenantId });
    } catch (error) {
      console.error('Error creating backup:', error);
      message.error('Error al crear backup');
    }
  };

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('tenants').select('*');
      
      // Aplicar filtros avanzados
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.plan !== 'all') {
        query = query.eq('plan_type', filters.plan);
      }
      if (filters.searchTerm) {
        query = query.or(`company_name.ilike.%${filters.searchTerm}%,contact_email.ilike.%${filters.searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      message.error('Error al cargar tenants');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const [
        { count: totalTenants },
        { count: activeTenants },
        { data: revenueData },
        { count: totalEvents },
        { count: totalUsers },
        { count: totalProducts },
        { count: totalSales },
        { count: pendingTickets },
        { count: criticalAlerts }
      ] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tenants').select('total_revenue'),
        supabase.from('eventos').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('productos').select('*', { count: 'exact', head: true }),
        supabase.from('ventas').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('system_alerts').select('*', { count: 'exact', head: true }).eq('priority', 'critical')
      ]);

      const totalRevenue = revenueData?.reduce((sum, tenant) => sum + (tenant.total_revenue || 0), 0) || 0;

      setStats({
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        totalRevenue,
        pendingInvoices: 0, // Placeholder
        totalEvents: totalEvents || 0,
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalSales: totalSales || 0,
        pendingSupportTickets: pendingTickets || 0,
        criticalAlerts: criticalAlerts || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadTenants();
    loadStats();
    loadNotifications();
    loadAdvancedMetrics();
  }, [loadTenants, loadStats, loadNotifications, loadAdvancedMetrics]);

  const handleAddTenant = () => {
    setEditingTenant(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    form.setFieldsValue({
      company_name: tenant.company_name,
      contact_email: tenant.contact_email,
      plan_type: tenant.plan_type,
      status: tenant.status,
      max_users: tenant.max_users,
      max_events: tenant.max_events
    });
    setModalVisible(true);
  };

  const handleViewTenant = async (tenant) => {
    setSelectedTenant(tenant);
    
    // Cargar datos específicos del tenant
    try {
      // Cargar eventos del tenant
      const { data: eventosData } = await supabase
        .from('eventos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      // Cargar usuarios del tenant
      const { data: usuariosData } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      // Cargar productos del tenant
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      // Cargar funciones del tenant
      const { data: funcionesData } = await supabase
        .from('funciones')
        .select('*, eventos!inner(*)')
        .eq('eventos.tenant_id', tenant.id)
        .order('fecha_celebracion', { ascending: false });

      // Cargar recintos del tenant
      const { data: recintosData } = await supabase
        .from('recintos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      // Actualizar el tenant con los datos cargados
      setSelectedTenant({
        ...tenant,
        eventos: eventosData || [],
        usuarios: usuariosData || [],
        productos: productosData || [],
        funciones: funcionesData || [],
        recintos: recintosData || []
      });
    } catch (error) {
      console.error('Error loading tenant data:', error);
      message.error('Error al cargar datos del tenant');
    }
    
    setTenantDetailVisible(true);
  };

  const handleSupportAction = (tenant) => {
    setSelectedTenant(tenant);
    setSupportModalVisible(true);
  };

  const handleViewClientData = async (tenant, dataType) => {
    setSelectedTenant(tenant);
    setSelectedClientData({ tenant, dataType });
    setClientDataDrawerVisible(true);
  };

  const handleSaveTenant = async (values) => {
    try {
      if (editingTenant) {
        const { error } = await supabase
          .from('tenants')
          .update(values)
          .eq('id', editingTenant.id);
        
        if (error) throw error;
        message.success('Tenant actualizado exitosamente');
        await logAuditAction('tenant_updated', { tenant_id: editingTenant.id, changes: values });
      } else {
        // Para nuevos tenants, incluir dominio y URL completa
        const tenantData = {
          ...values,
          status: values.status || 'active',
          plan_type: values.plan_type || 'basic',
          max_users: values.max_users || 10,
          max_events: values.max_events || 50,
          // Si no se especifica full_url, generarla automáticamente
          full_url: values.full_url || (values.subdomain && values.domain ? `${values.subdomain}.${values.domain}` : values.domain)
        };
        
        const { error } = await supabase
          .from('tenants')
          .insert([tenantData]);
        
        if (error) throw error;
        message.success('Tenant creado exitosamente');
        await logAuditAction('tenant_created', { tenant_data: tenantData });
      }
      
      setModalVisible(false);
      loadTenants();
      loadStats();
    } catch (error) {
      console.error('Error saving tenant:', error);
      message.error('Error al guardar tenant');
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
      
      if (error) throw error;
      message.success('Tenant eliminado exitosamente');
      await logAuditAction('tenant_deleted', { tenant_id: tenantId });
      loadTenants();
      loadStats();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      message.error('Error al eliminar tenant');
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
              {record.full_url || `${record.subdomain}.${record.domain || 'veneventos.com'}`}
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
          <Dropdown overlay={
            <Menu>
              <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => handleViewTenant(record)}>
                Ver Detalles
              </Menu.Item>
              <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEditTenant(record)}>
                Editar
              </Menu.Item>
              <Menu.Item key="support" icon={<CustomerServiceOutlined />} onClick={() => handleSupportAction(record)}>
                Soporte
              </Menu.Item>
              <Menu.Item key="backup" icon={<CloudUploadOutlined />} onClick={() => createBackup(record.id)}>
                Crear Backup
              </Menu.Item>
              <Menu.Item key="audit" icon={<AuditOutlined />} onClick={() => message.info(`Ver logs de ${record.company_name}`)}>
                Ver Auditoría
              </Menu.Item>
              <Menu.Item key="templates" icon={<FileTextOutlined />} onClick={() => message.info(`Templates para ${record.company_name}`)}>
                Templates
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDeleteTenant(record.id)}>
                Eliminar
              </Menu.Item>
            </Menu>
          }>
            <Button>
              Acciones <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header con notificaciones y alertas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={18}>
          <Title level={2}>
            <BankOutlined style={{ marginRight: '8px' }} />
            Panel de Administración SaaS
          </Title>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Space>
            <Dropdown overlay={
              <Menu>
                {notifications.slice(0, 5).map(notification => (
                  <Menu.Item key={notification.id} icon={<BellOutlined />}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{notification.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{notification.message}</div>
                    </div>
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item key="view-all" icon={<EyeOutlined />}>
                  Ver todas las notificaciones
                </Menu.Item>
              </Menu>
            }>
              <Badge count={notifications.filter(n => !n.read).length} size="small">
                <Button icon={<BellOutlined />} shape="circle" />
              </Badge>
            </Dropdown>
            
            <Dropdown overlay={
              <Menu>
                <Menu.Item key="tickets" icon={<CustomerServiceOutlined />}>
                  Tickets de Soporte ({stats.pendingSupportTickets})
                </Menu.Item>
                <Menu.Item key="alerts" icon={<ExclamationCircleOutlined />}>
                  Alertas Críticas ({stats.criticalAlerts})
                </Menu.Item>
                <Menu.Item key="audit" icon={<AuditOutlined />}>
                  Logs de Auditoría
                </Menu.Item>
                <Menu.Item key="backup" icon={<CloudUploadOutlined />}>
                  Gestión de Backups
                </Menu.Item>
              </Menu>
            }>
              <Button icon={<SettingOutlined />} shape="circle" />
            </Dropdown>
          </Space>
        </Col>
      </Row>

      {/* Alertas críticas */}
      {stats.criticalAlerts > 0 && (
        <Alert
          message={`${stats.criticalAlerts} alertas críticas requieren atención`}
          description="Hay problemas urgentes que necesitan ser resueltos inmediatamente."
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" danger>
              Ver Alertas
            </Button>
          }
        />
      )}

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

      {/* Métricas avanzadas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tickets Pendientes"
              value={stats.pendingSupportTickets}
              prefix={<CustomerServiceOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Crecimiento Mensual"
              value={advancedMetrics.monthlyGrowth}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: advancedMetrics.monthlyGrowth >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tasa de Churn"
              value={advancedMetrics.churnRate}
              suffix="%"
              prefix={<FallOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingreso Promedio"
              value={`$${advancedMetrics.averageRevenue.toLocaleString()}`}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Top performing tenants */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Top 5 Empresas por Rendimiento" extra={<Button icon={<BarChartOutlined />}>Ver Detalles</Button>}>
            <List
              dataSource={advancedMetrics.topPerformingTenants}
              renderItem={(tenant, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{index + 1}</Avatar>}
                    title={tenant.company_name}
                    description={`Ingresos: $${tenant.total_revenue?.toLocaleString() || 0}`}
                  />
                  <div>
                    <Tag color="green">Top Performer</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros avanzados */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Search
              placeholder="Buscar empresas..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              onSearch={() => loadTenants()}
              allowClear
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="Estado"
              value={filters.status}
              onChange={(value) => setFilters({...filters, status: value})}
              style={{ width: '100%' }}
            >
              <Option value="all">Todos los estados</Option>
              <Option value="active">Activo</Option>
              <Option value="inactive">Inactivo</Option>
              <Option value="suspended">Suspendido</Option>
              <Option value="pending">Pendiente</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="Plan"
              value={filters.plan}
              onChange={(value) => setFilters({...filters, plan: value})}
              style={{ width: '100%' }}
            >
              <Option value="all">Todos los planes</Option>
              <Option value="basic">Básico</Option>
              <Option value="pro">Profesional</Option>
              <Option value="enterprise">Empresarial</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => loadTenants()}
              type="primary"
            >
              Aplicar Filtros
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  setFilters({status: 'all', plan: 'all', dateRange: null, searchTerm: ''});
                  loadTenants();
                }}
              >
                Limpiar
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                onClick={() => message.info('Exportar datos')}
              >
                Exportar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Empresas */}
      <Card
        title="Gestión de Empresas"
        extra={
          <Space>
            <Button icon={<AuditOutlined />} onClick={() => message.info('Ver logs de auditoría')}>
              Auditoría
            </Button>
            <Button icon={<CloudUploadOutlined />} onClick={() => message.info('Gestión de backups')}>
              Backups
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => message.info('Templates de soporte')}>
              Templates
            </Button>
            <Button 
              icon={<DatabaseOutlined />} 
              onClick={() => window.location.href = '/dashboard/saas/diagnostico'}
            >
              Diagnóstico Completo
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
                name="company_name"
                label="Nombre de la Empresa"
                rules={[{ required: true, message: 'Nombre requerido' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_email"
                label="Email de Contacto"
                rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}
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
                  <Option value="suspended">Suspendido</Option>
                  <Option value="inactive">Inactivo</Option>
                  <Option value="pending">Pendiente</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="domain"
                label="Dominio"
                rules={[{ required: true, message: 'Dominio requerido' }]}
              >
                <Input placeholder="ej: veneventos.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="full_url"
                label="URL Completa (opcional)"
              >
                <Input placeholder="ej: cliente1.veneventos.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="max_users"
                label="Usuarios Máximos"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_events"
                label="Eventos Máximos"
              >
                <Input type="number" />
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
              <Descriptions.Item label="Subdominio">{selectedTenant.full_url || `${selectedTenant.subdomain}.${selectedTenant.domain || 'veneventos.com'}`}</Descriptions.Item>
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
                  onClick={() => window.open(`https://${selectedTenant.full_url || `${selectedTenant.subdomain}.${selectedTenant.domain || 'veneventos.com'}`}`, '_blank')}
                  block
                >
                  Ver Sitio Web del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<KeyOutlined />} 
                  onClick={() => window.open(`https://${selectedTenant.full_url || `${selectedTenant.subdomain}.${selectedTenant.domain || 'veneventos.com'}`}/dashboard`, '_blank')}
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
              <Col span={12}>
                <Button 
                  icon={<CreditCardOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'tickets')}
                  block
                >
                  Ver Entradas del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<CalendarOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'functions')}
                  block
                >
                  Ver Funciones del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<BankOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'venues')}
                  block
                >
                  Ver Recintos del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<BarChartOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'commissions')}
                  block
                >
                  Ver Comisiones del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'zones')}
                  block
                >
                  Ver Zonas del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<GlobalOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'customization')}
                  block
                >
                  Ver Personalización del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<DollarOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'sales')}
                  block
                >
                  Ver Ventas del Cliente
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<FileTextOutlined />} 
                  onClick={() => handleViewClientData(selectedTenant, 'reports')}
                  block
                >
                  Ver Reportes del Cliente
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

  const loadEvents = useCallback(async () => {
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
  }, [tenant]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
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
  }, [tenant]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const loadProducts = useCallback(async () => {
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
  }, [tenant]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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

  const loadData = useCallback(async () => {
    try {
      let query;
      switch (dataType) {
        case 'events':
          query = supabase.from('eventos').select('*').eq('tenant_id', tenant.id);
          break;
        case 'users':
          query = supabase.from('profiles').select('*').eq('tenant_id', tenant.id);
          break;
        case 'products':
          query = supabase.from('productos').select('*').eq('tenant_id', tenant.id);
          break;
        case 'tickets':
          query = supabase.from('entradas').select('*').eq('tenant_id', tenant.id);
          break;
        case 'functions':
          query = supabase.from('funciones').select('*').eq('tenant_id', tenant.id);
          break;
        case 'venues':
          query = supabase.from('recintos').select('*').eq('tenant_id', tenant.id);
          break;
        case 'commissions':
          query = supabase.from('comisiones').select('*').eq('tenant_id', tenant.id);
          break;
        case 'zones':
          query = supabase.from('zonas').select('*').eq('tenant_id', tenant.id);
          break;
        case 'customization':
          query = supabase.from('personalizacion').select('*').eq('tenant_id', tenant.id);
          break;
        case 'sales':
          query = supabase.from('ventas').select('*').eq('tenant_id', tenant.id);
          break;
        case 'reports':
          query = supabase.from('reportes').select('*').eq('tenant_id', tenant.id);
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
  }, [tenant, dataType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
              </Button>,
              <Button size="small" onClick={() => onAction('update_event', { id: item.id, estado: 'active' })}>
                Activar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`${item.fecha} - ${item.ubicacion} - $${item.precio} - ${item.estado}`}
            />
          </List.Item>
        );
      case 'users':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_user', { id: item.id, rol: 'admin' })}>
                Hacer Admin
              </Button>,
              <Button size="small" onClick={() => onAction('update_user', { id: item.id, estado: 'active' })}>
                Activar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`${item.email} - ${item.rol} - ${item.estado}`}
            />
          </List.Item>
        );
      case 'products':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_product', { id: item.id, precio: 0 })}>
                Hacer Gratis
              </Button>,
              <Button size="small" onClick={() => onAction('update_product', { id: item.id, stock: 999 })}>
                Agregar Stock
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`$${item.precio} - Stock: ${item.stock} - ${item.categoria}`}
            />
          </List.Item>
        );
      case 'tickets':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_ticket', { id: item.id, estado: 'active' })}>
                Activar
              </Button>,
              <Button size="small" onClick={() => onAction('update_ticket', { id: item.id, precio: 0 })}>
                Hacer Gratis
              </Button>
            ]}
          >
            <List.Item.Meta
              title={`Entrada ${item.id}`}
              description={`Evento: ${item.evento_id} - Precio: $${item.precio} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'functions':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_function', { id: item.id, estado: 'active' })}>
                Activar
              </Button>,
              <Button size="small" onClick={() => onAction('update_function', { id: item.id, nombre: 'Función Modificada' })}>
                Modificar Nombre
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`Evento: ${item.evento_id} - Fecha: ${item.fecha} - Hora: ${item.hora} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'venues':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_venue', { id: item.id, estado: 'active' })}>
                Activar
              </Button>,
              <Button size="small" onClick={() => onAction('update_venue', { id: item.id, nombre: 'Recinto Modificado' })}>
                Modificar Nombre
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`Dirección: ${item.direccion} - Capacidad: ${item.capacidad} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'commissions':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_commission', { id: item.id, porcentaje: 0 })}>
                Quitar Comisión
              </Button>,
              <Button size="small" onClick={() => onAction('update_commission', { id: item.id, estado: 'active' })}>
                Activar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={`Comisión ${item.id}`}
              description={`Porcentaje: ${item.porcentaje}% - Tipo: ${item.tipo} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'zones':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_zone', { id: item.id, nombre: 'Zona Modificada' })}>
                Modificar Nombre
              </Button>,
              <Button size="small" onClick={() => onAction('update_zone', { id: item.id, estado: 'active' })}>
                Activar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.nombre}
              description={`Recinto: ${item.recinto_id} - Capacidad: ${item.capacidad} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'customization':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_customization', { id: item.id, tema: 'default' })}>
                Resetear Tema
              </Button>,
              <Button size="small" onClick={() => onAction('update_customization', { id: item.id, estado: 'active' })}>
                Activar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={`Personalización ${item.id}`}
              description={`Tema: ${item.tema} - Color: ${item.color_principal} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'sales':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_sale', { id: item.id, estado: 'completada' })}>
                Marcar Completada
              </Button>,
              <Button size="small" onClick={() => onAction('update_sale', { id: item.id, estado: 'reembolsada' })}>
                Reembolsar
              </Button>
            ]}
          >
            <List.Item.Meta
              title={`Venta ${item.id}`}
              description={`Monto: $${item.monto} - Fecha: ${item.fecha} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      case 'reports':
        return (
          <List.Item
            actions={[
              <Button size="small" onClick={() => onAction('update_report', { id: item.id, estado: 'generado' })}>
                Generar
              </Button>,
              <Button size="small" onClick={() => onAction('update_report', { id: item.id, estado: 'enviado' })}>
                Marcar Enviado
              </Button>
            ]}
          >
            <List.Item.Meta
              title={`Reporte ${item.id}`}
              description={`Tipo: ${item.tipo} - Fecha: ${item.fecha} - Estado: ${item.estado}`}
            />
          </List.Item>
        );
      default:
        return null;
    }
  };

  const getDataTypeTitle = () => {
    switch (dataType) {
      case 'events': return 'Eventos';
      case 'users': return 'Usuarios';
      case 'products': return 'Productos';
      case 'tickets': return 'Entradas';
      case 'functions': return 'Funciones';
      case 'venues': return 'Recintos';
      case 'commissions': return 'Comisiones';
      case 'zones': return 'Zonas';
      case 'customization': return 'Personalización';
      case 'sales': return 'Ventas';
      case 'reports': return 'Reportes';
      default: return 'Datos';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Title level={4}>{getDataTypeTitle()} de {tenant.company_name}</Title>
        <Text type="secondary">Total: {data.length} elementos</Text>
      </div>
      
      <List
        loading={loading}
        dataSource={data}
        renderItem={renderDataItem}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} elementos`
        }}
      />
    </div>
  );
};

export default SaasDashboard;
