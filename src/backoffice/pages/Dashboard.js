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
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
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
    // Definir las funciones dentro del useEffect para evitar problemas de dependencias


    const subscribeToRealtimeUpdates = () => {
      try {
        // Suscribirse a actualizaciones en tiempo real
        const subscription = supabase
          .channel('dashboard-updates')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'payment_transactions' },
            () => {
              // Recargar datos cuando hay cambios
              loadDashboardData();
            }
          )
          .subscribe();

        // Retornar funci³n de limpieza
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error subscribing to realtime updates:', error);
        return () => { }; // Funci³n de limpieza vac­a en caso de error
      }
    };

    // Ejecutar carga inicial
    loadDashboardData();

    // Suscribirse a actualizaciones en tiempo real
    const cleanup = subscribeToRealtimeUpdates();

    // Retornar funci³n de limpieza
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []); // Sin dependencias ya que las funciones est¡n definidas dentro

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar estad­sticas principales
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
      // Estad­sticas de ingresos
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('amount, status, created_at')
        .eq('status', 'completed');

      if (error) {
        setStats(prev => ({
          ...prev,
          totalRevenue: 0,
          todaySales: 0,
          thisWeekSales: 0,
          thisMonthSales: 0
        }));
        return;
      }

      const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const today = new Date();
      const todaySales = transactions
        .filter(t => new Date(t.created_at).toDateString() === today.toDateString())
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekSales = transactions
        .filter(t => new Date(t.created_at) >= weekAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thisMonthSales = transactions
        .filter(t => new Date(t.created_at) >= monthAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      setStats(prev => ({
        ...prev,
        totalRevenue,
        todaySales,
        thisWeekSales,
        thisMonthSales
      }));
    } catch (error) {
      console.error('Error loading revenue stats:', error);
      setStats(prev => ({
        ...prev,
        totalRevenue: 0,
        todaySales: 0,
        thisWeekSales: 0,
        thisMonthSales: 0
      }));
    }
  };

  const loadTicketStats = async () => {
    try {
      // Estad­sticas de tickets
      const { data: tickets, error } = await supabase
        .from('entradas')
        .select('*');

      if (error) throw error;

      const totalTickets = tickets.length;
      const soldTickets = tickets.filter(t => t.status === 'vendido').length;
      const reservedTickets = tickets.filter(t => t.status === 'reservado').length;

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
      // Estad­sticas de usuarios - incluyendo usuarios activos (ºltimas 24h)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at'); // Removed last_seen, is_active causing 400

      if (usersError) throw usersError;

      // Obtener usuarios activos (ºltimas 24 horas) desde auth.users o user_sessions si existe
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Intentar obtener usuarios activos desde user_sessions o last_login
      let activeUsersCount = 0;
      try {
        // Si existe tabla user_sessions o user_tenant_info
        const { data: activeSessions } = await supabase
          .from('user_tenant_info')
          .select('user_id, last_login')
          .gte('last_login', twentyFourHoursAgo);

        activeUsersCount = activeSessions?.length || 0;
      } catch (e) {
        // Si no existe, usar last_seen de profiles
        activeUsersCount = users?.filter(u => {
          if (u.last_seen) {
            return new Date(u.last_seen) >= twentyFourHoursAgo;
          }
          return false;
        }).length || 0;
      }

      const totalUsers = users?.length || 0;
      const newUsersThisWeek = users?.filter(u => {
        const userDate = new Date(u.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return userDate >= weekAgo;
      }).length || 0;

      setStats(prev => ({
        ...prev,
        activeUsers: activeUsersCount, // Usuarios activos en ºltimas 24h
        totalUsers, // Total de usuarios registrados
        newUsersThisWeek
      }));
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Valores por defecto
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
      const { data, error } = await supabase
        .from('eventos_con_funciones_activas')
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
      // La vista eventos_con_funciones_activas puede no tener fecha_evento
      // Intentar usar created_at o hacer una consulta alternativa
      const { data, error } = await supabase
        .from('eventos_con_funciones_activas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        // Si falla, intentar consulta directa a eventos
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos')
          .select('*')
          .eq('activo', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (eventosError) throw eventosError;
        setUpcomingEvents(eventosData || []);
        return;
      }

      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
      setUpcomingEvents([]);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      // Simular alertas del sistema
      const alerts = [
        {
          id: 1,
          type: 'warning',
          title: 'Pagos pendientes',
          message: 'Hay 3 transacciones pendientes de confirmaci³n',
          time: 'Hace 2 horas'
        },
        {
          id: 2,
          type: 'info',
          title: 'Nuevo evento creado',
          message: 'Se ha creado el evento "Concierto de Rock"',
          time: 'Hace 4 horas'
        },
        {
          id: 3,
          type: 'success',
          title: 'Venta exitosa',
          message: 'Se han vendido 15 tickets para "Teatro Cl¡sico"',
          time: 'Hace 6 horas'
        }
      ];
      setSystemAlerts(alerts);
    } catch (error) {
      console.error('Error loading system alerts:', error);
    }
  };

  const subscribeToRealtimeUpdates = () => {
    // Verificar si ya existe un canal con el mismo topic
    const existingChannels = supabase.getChannels();
    const existingChannel = existingChannels.find(ch => ch.topic === 'dashboard_updates');

    if (existingChannel) {
      return () => {
        // No desuscribirse si el canal es compartido
      };
    }

    // Suscribirse a cambios en transacciones
    const subscription = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe((status) => {
      });

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
      }
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
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
          Resumen general del sistema de boleter­a
        </Text>
      </div>

      {/* M©tricas Principales */}
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
              {stats.totalUsers} total -¢ +{stats.newUsersThisWeek} esta semana
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
              Requieren atenci³n
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Acciones R¡pidas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24}>
          <Card
            title="Acciones R¡pidas"
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
                  Boleter­a
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

      {/* Gr¡ficos y An¡lisis */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={16}>
          <Card
            title="Ventas por Per­odo"
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
                  render: (id) => id.slice(0, 8) + '...'
                },
                {
                  title: 'Monto',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => `$${parseFloat(amount).toFixed(2)}`
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
                      {status.toUpperCase()}
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
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Eventos Pr³ximos" extra={<Button type="link">Ver Todos</Button>}>
            <List
              dataSource={upcomingEvents}
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
                          {new Date(event.fecha_evento).toLocaleDateString()}
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

      {/* Configuraci³n de M©todos de Pago */}
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
                  // Ant Design v5 usa dayjs
                  const currentMonth = monthNames[value.month()];
                  const currentYear = value.year();

                  return (
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2 px-2">
                      <Button
                        size="small"
                        onClick={() => {
                          onChange(value.subtract(1, 'month'));
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
                          onChange(value.add(1, 'month'));
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


