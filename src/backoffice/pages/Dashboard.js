import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Button,
  Typography,
  Avatar,
  List,
  Tag,
  Spin,
  Calendar,
  Badge,
  ConfigProvider
} from '../../utils/antdComponents';
import locale from 'antd/locale/es_ES';
import {
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import PaymentMethodsConfig from '../components/PaymentMethodsConfig';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    soldTickets: 0,
    reservedTickets: 0,
    activeUsers: 0,
    totalUsers: 0,
    newUsersThisWeek: 0,
    pendingPayments: 0,
    todaySales: 0,
    thisWeekSales: 0,
    thisMonthSales: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  useEffect(() => {
    let subscription;

    const subscribeToRealtimeUpdates = () => {
      try {
        // Suscribirse a actualizaciones en tiempo real
        subscription = supabase
          .channel('dashboard-updates')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'payment_transactions' },
            () => {
              // Recargar datos cuando hay cambios
              loadDashboardData();
            }
          )
          .subscribe();

        return () => {
          if (subscription) subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error subscribing to realtime updates:', error);
        return () => { };
      }
    };

    // Ejecutar carga inicial
    loadDashboardData();

    // Suscribirse a actualizaciones en tiempo real
    const cleanup = subscribeToRealtimeUpdates();

    // Retornar función de limpieza
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas principales
      await Promise.all([
        loadRevenueStats(),
        loadTicketStats(),
        loadUserStats(),
        loadRecentTransactions(),
        loadRecentEvents(),
        loadUpcomingEvents(),
        loadSystemAlerts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueStats = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('*');

      if (error) {
        console.error('Error loading revenue stats:', error);
        setStats(prev => ({
          ...prev,
          totalRevenue: 0,
          todaySales: 0,
          thisWeekSales: 0,
          thisMonthSales: 0
        }));
        return;
      }

      const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const today = new Date();
      const todaySales = transactions
        .filter(t => new Date(t.created_at).toDateString() === today.toDateString())
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekSales = transactions
        .filter(t => new Date(t.created_at) >= weekAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thisMonthSales = transactions
        .filter(t => new Date(t.created_at) >= monthAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Pending payments count
      const pendingPayments = transactions.filter(t => t.status === 'pending').length;

      setStats(prev => ({
        ...prev,
        totalRevenue,
        todaySales,
        thisWeekSales,
        thisMonthSales,
        pendingPayments
      }));
    } catch (error) {
      console.error('Error calculating revenue stats:', error);
    }
  };

  const loadTicketStats = async () => {
    try {
      const { data: tickets, error } = await supabase
        .from('payment_transactions')
        .select('id, status');

      if (error) throw error;

      const totalTickets = tickets.length;
      // Asumiendo 'completed' es vendido y 'pending' es reservado/pendiente
      const soldTickets = tickets.filter(t => t.status === 'completed' || t.status === 'pagado' || t.status === 'vendido').length;
      const reservedTickets = tickets.filter(t => t.status === 'pending' || t.status === 'reservado').length;

      setStats(prev => ({
        ...prev,
        totalTickets,
        soldTickets,
        reservedTickets
      }));
    } catch (error) {
      console.error('Error loading ticket stats:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Intentar obtener usuarios activos desde user_tenant_info
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let activeUsersCount = 0;
      let totalUsers = 0;
      let newUsersThisWeek = 0;

      // Intentamos fetching profiles o user_tenant_info
      // Probamos user_tenant_info primero como sugería el código original
      const { data: activeSessions, error: sessionError } = await supabase
        .from('user_tenant_info')
        .select('user_id, last_login')
        .gte('last_login', twentyFourHoursAgo);

      if (!sessionError && activeSessions) {
        activeUsersCount = activeSessions.length;
      }

      // Obtener total de usuarios desde profiles
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, last_seen');

      if (usersError) throw usersError;

      totalUsers = users?.length || 0;

      // Si no pudimos sacar activos de user_tenant_info, intentamos con profiles
      if (sessionError || !activeSessions) {
        activeUsersCount = users?.filter(u => {
          if (u.last_seen) {
            return new Date(u.last_seen) >= new Date(twentyFourHoursAgo);
          }
          return false;
        }).length || 0;
      }

      newUsersThisWeek = users?.filter(u => {
        const userDate = new Date(u.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return userDate >= weekAgo;
      }).length || 0;

      setStats(prev => ({
        ...prev,
        activeUsers: activeUsersCount,
        totalUsers,
        newUsersThisWeek
      }));
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats(prev => ({
        ...prev,
        activeUsers: 0,
        totalUsers: 0,
        newUsersThisWeek: 0
      }));
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        setRecentTransactions([]);
        return;
      }

      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      setRecentTransactions([]);
    }
  };

  const loadRecentEvents = async () => {
    try {
      // Asumiendo que existe una lógica para eventos recientes(creados recientemente?)
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Error loading recent events:', error);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('activo', true)
        .gte('fecha_evento', new Date().toISOString())
        .order('fecha_evento', { ascending: true })
        .limit(10); // Cargamos un poco más para el calendario

      if (error) throw error;

      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
      // Fallback
      setUpcomingEvents([]);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      // Mock de alertas si no hay tabla
      const alerts = [
        {
          type: 'info',
          title: 'Sistema Actualizado',
          message: 'El sistema se ha actualizado correctamente a la versión más reciente.',
          time: 'Hace 2 horas'
        }
      ];
      setSystemAlerts(alerts);
    } catch (error) {
      console.error('Error loading system alerts:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
      pagado: 'green',
      vendido: 'green',
      pending: 'orange',
      failed: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'blue';
  };

  const getAlertIcon = (type) => {
    const icons = {
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      info: <BellOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />
    };
    return icons[type] || <BellOutlined />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{
      padding: '16px',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <Title level={2} style={{
          fontSize: '24px',
          marginBottom: '4px',
          color: '#1f2937'
        }}>
          Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Resumen general del sistema de boletería
        </Text>
      </div>

      {/* Métricas Principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px' }}>
            <Statistic
              title="Ingresos Totales"
              value={stats.totalRevenue}
              precision={2}
              valueStyle={{ color: '#3f8600', fontSize: '20px' }}
              prefix={<DollarOutlined />}
            />
            <Progress
              percent={Math.min(100, stats.totalRevenue > 0 ? (stats.todaySales / stats.totalRevenue) * 100 : 0)}
              size="small"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Hoy: ${stats.todaySales.toFixed(2)}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px' }}>
            <Statistic
              title="Tickets Vendidos"
              value={stats.soldTickets}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              prefix={<FileTextOutlined />}
            />
            <Progress
              percent={Math.min(100, stats.totalTickets > 0 ? (stats.soldTickets / stats.totalTickets) * 100 : 0)}
              size="small"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Total: {stats.totalTickets}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px' }}>
            <Statistic
              title="Usuarios Activos (24h)"
              value={stats.activeUsers}
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
              prefix={<UserOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              {stats.totalUsers} total • +{stats.newUsersThisWeek} esta semana
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '8px' }}>
            <Statistic
              title="Pagos Pendientes"
              value={stats.pendingPayments}
              valueStyle={{ color: '#faad14', fontSize: '20px' }}
              prefix={<ShoppingCartOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Requieren atención
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Acciones Rápidas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24}>
          <Card
            title="Acciones Rápidas"
            style={{ borderRadius: '8px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate('/backoffice/boleteria')}
                  style={{ height: '48px', fontSize: '14px' }}
                >
                  Boletería
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={<CalendarOutlined />}
                  onClick={() => navigate('/backoffice/eventos')}
                  style={{ height: '48px', fontSize: '14px' }}
                >
                  Eventos
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={<FileTextOutlined />}
                  onClick={() => navigate('/backoffice/reportes')}
                  style={{ height: '48px', fontSize: '14px' }}
                >
                  Reportes
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Gráficos y Análisis */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={16}>
          <Card
            title="Ventas por Período"
            extra={<Button type="link" size="small">Ver Detalles</Button>}
            style={{ borderRadius: '8px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Esta Semana"
                  value={stats.thisWeekSales}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600', fontSize: '18px' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Este Mes"
                  value={stats.thisMonthSales}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Hoy"
                  value={stats.todaySales}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#faad14', fontSize: '18px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Alertas del Sistema"
            style={{ borderRadius: '8px' }}
          >
            <List
              size="small"
              dataSource={systemAlerts}
              renderItem={(alert) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={getAlertIcon(alert.type)}
                    title={<span style={{ fontSize: '14px' }}>{alert.title}</span>}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{alert.message}</Text>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          {alert.time}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Tablas de Datos */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Transacciones Recientes" extra={<Button type="link">Ver Todas</Button>}>
            <Table
              dataSource={recentTransactions}
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                  render: (id) => id ? id.slice(0, 8) + '...' : ''
                },
                {
                  title: 'Monto',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`
                },
                {
                  title: 'Pasarela',
                  dataIndex: 'gateway_id',
                  key: 'gateway'
                },
                {
                  title: 'Estado',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={getStatusColor(status)}>
                      {status ? status.toUpperCase() : 'N/A'}
                    </Tag>
                  )
                },
                {
                  title: 'Fecha',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (date) => new Date(date).toLocaleString()
                }
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Eventos Próximos" extra={<Button type="link">Ver Todos</Button>}>
            <List
              dataSource={upcomingEvents.slice(0, 5)}
              renderItem={(event) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={event.imagen_url}
                        icon={<CalendarOutlined />}
                      />
                    }
                    title={event.nombre}
                    description={
                      <div>
                        <Text type="secondary">{event.descripcion?.slice(0, 50)}...</Text>
                        <div className="text-xs text-gray-500 mt-1">
                          {event.fecha_evento ? new Date(event.fecha_evento).toLocaleDateString() : 'Sin fecha'}
                        </div>
                      </div>
                    }
                  />
                  <Button size="small" type="primary">
                    Ver Detalles
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Configuración de Métodos de Pago */}
      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24}>
          <PaymentMethodsConfig />
        </Col>
      </Row>

      {/* Calendario de Eventos */}
      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24}>
          <Card title="Calendario de Eventos">
            <ConfigProvider locale={locale}>
              <Calendar
                fullscreen={false}
                headerRender={({ value, type, onChange, onTypeChange }) => {
                  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  // Ant Design v5 usa dayjs o similar
                  const currentMonth = monthNames[value.month()];
                  const currentYear = value.year();

                  return (
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2 px-2">
                      <Button
                        size="small"
                        onClick={() => {
                          onChange(value.clone().subtract(1, 'month'));
                        }}
                      >
                        Anterior
                      </Button>
                      <Text strong style={{ fontSize: '14px', fontWeight: 600 }}>
                        {currentMonth} {currentYear}
                      </Text>
                      <Button
                        size="small"
                        onClick={() => {
                          onChange(value.clone().add(1, 'month'));
                        }}
                      >
                        Siguiente
                      </Button>
                    </div>
                  );
                }}
                dateCellRender={(date) => {
                  const eventsOnDate = upcomingEvents.filter(event => {
                    if (!event.fecha_evento) return false;
                    const eventDate = new Date(event.fecha_evento);
                    const cellDate = date.toDate();
                    return eventDate.toDateString() === cellDate.toDateString();
                  });

                  if (eventsOnDate.length === 0) return null;

                  return (
                    <div className="h-full py-1">
                      {eventsOnDate.map((event, index) => (
                        <div key={index} className="text-xs mb-1">
                          <Badge
                            color="blue"
                            text={event.nombre}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </ConfigProvider>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
