import React, { useState, useEffect } from 'react';
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
  Badge
} from 'antd';
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    soldTickets: 0,
    activeUsers: 0,
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

        // Retornar función de limpieza
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error subscribing to realtime updates:', error);
        return () => {}; // Función de limpieza vacía en caso de error
      }
    };

    // Ejecutar carga inicial
    loadDashboardData();
    
    // Suscribirse a actualizaciones en tiempo real
    const cleanup = subscribeToRealtimeUpdates();
    
    // Retornar función de limpieza
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []); // Sin dependencias ya que las funciones están definidas dentro

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
      // Estadísticas de ingresos
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('amount, status, created_at')
        .eq('status', 'completed');

      if (error) {
        console.warn('Error loading revenue stats:', error);
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
      // Estadísticas de tickets
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
      // Estadísticas de usuarios
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const activeUsers = users.length;
      const newUsersThisWeek = users.filter(u => {
        const userDate = new Date(u.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return userDate >= weekAgo;
      }).length;

      setStats(prev => ({
        ...prev,
        activeUsers,
        newUsersThisWeek
      }));
    } catch (error) {
      console.error('Error loading user stats:', error);
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
        console.warn('Error loading recent transactions:', error);
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
        .gte('fecha_evento', new Date().toISOString())
        .order('fecha_evento', { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
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
          message: 'Hay 3 transacciones pendientes de confirmación',
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
          message: 'Se han vendido 15 tickets para "Teatro Clásico"',
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
      console.log('[DASHBOARD] Canal ya existe, reutilizando');
      return () => {
        // No desuscribirse si el canal es compartido
        console.log('[DASHBOARD] No desuscribiendo canal compartido');
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
        console.log('[DASHBOARD] Estado de suscripción:', status);
      });

    return () => {
      try {
        subscription.unsubscribe();
        console.log('[DASHBOARD] Canal desuscrito exitosamente');
      } catch (error) {
        console.warn('[DASHBOARD] Error al desuscribir canal:', error);
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">Resumen general del sistema de boletería</Text>
      </div>

      {/* Métricas Principales */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos Totales"
              value={stats.totalRevenue}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
            />
            <Progress 
              percent={Math.min(100, (stats.todaySales / stats.totalRevenue) * 100)} 
              size="small" 
              showInfo={false}
            />
            <Text type="secondary">Hoy: ${stats.todaySales.toFixed(2)}</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tickets Vendidos"
              value={stats.soldTickets}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
            <Progress 
              percent={Math.min(100, (stats.soldTickets / stats.totalTickets) * 100)} 
              size="small" 
              showInfo={false}
            />
            <Text type="secondary">Total: {stats.totalTickets}</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Usuarios Activos"
              value={stats.activeUsers}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />}
            />
            <Text type="secondary">+{stats.newUsersThisWeek} esta semana</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pagos Pendientes"
              value={stats.pendingPayments}
              valueStyle={{ color: '#faad14' }}
              prefix={<ShoppingCartOutlined />}
            />
            <Text type="secondary">Requieren atención</Text>
          </Card>
        </Col>
      </Row>

      {/* Gráficos y Análisis */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} lg={16}>
          <Card title="Ventas por Período" extra={<Button type="link">Ver Detalles</Button>}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Esta Semana"
                  value={stats.thisWeekSales}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Este Mes"
                  value={stats.thisMonthSales}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Hoy"
                  value={stats.todaySales}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Alertas del Sistema">
            <List
              size="small"
              dataSource={systemAlerts}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getAlertIcon(alert.type)}
                    title={alert.title}
                    description={
                      <div>
                        <Text type="secondary">{alert.message}</Text>
                        <div className="text-xs text-gray-400 mt-1">
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
          <Card title="Eventos Próximos" extra={<Button type="link">Ver Todos</Button>}>
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
            <Calendar
              fullscreen={false}
              headerRender={({ value, onChange }) => (
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    size="small" 
                    onClick={() => onChange(value.clone().subtract(1, 'month'))}
                  >
                    Anterior
                  </Button>
                  <Text strong>{value.format('MMMM YYYY')}</Text>
                  <Button 
                    size="small" 
                    onClick={() => onChange(value.clone().add(1, 'month'))}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
              dateCellRender={(date) => {
                const eventsOnDate = upcomingEvents.filter(event => {
                  const eventDate = new Date(event.fecha_evento);
                  return eventDate.toDateString() === date.toDate().toDateString();
                });

                return (
                  <div className="h-full">
                    {eventsOnDate.map((event, index) => (
                      <Badge 
                        key={index}
                        color="blue" 
                        text={event.nombre}
                        className="text-xs"
                      />
                    ))}
                  </div>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
