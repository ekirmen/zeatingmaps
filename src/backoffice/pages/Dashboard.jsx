import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Space, Button, Progress, List, Avatar } from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  DollarOutlined, 
  ShoppingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalProducts: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas
      const [eventsCount, usersCount, productsCount] = await Promise.all([
        supabase.from('eventos').select('id', { count: 'exact' }),
        supabase.from('usuarios').select('id', { count: 'exact' }),
        supabase.from('productos').select('id', { count: 'exact' })
      ]);

      // Cargar eventos recientes
      const { data: recentEventsData } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalEvents: eventsCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalProducts: productsCount.count || 0,
        totalRevenue: 12500 // Mock data
      });

      setRecentEvents(recentEventsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getEventStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Resumen general de tu ticketera"
      actions={
        <Space>
          <Button type="primary" icon={<CalendarOutlined />}>
            Crear Evento
          </Button>
          <Button icon={<UserOutlined />}>
            Gestionar Usuarios
          </Button>
        </Space>
      }
    >
      {/* Estadísticas */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Eventos"
            value={stats.totalEvents}
            icon={<CalendarOutlined />}
            color="#3b82f6"
            trend="up"
            trendValue="+12%"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Usuarios Registrados"
            value={stats.totalUsers}
            icon={<UserOutlined />}
            color="#10b981"
            trend="up"
            trendValue="+8%"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Ingresos Totales"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarOutlined />}
            color="#f59e0b"
            trend="up"
            trendValue="+15%"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Productos"
            value={stats.totalProducts}
            icon={<ShoppingOutlined />}
            color="#8b5cf6"
            trend="down"
            trendValue="-3%"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Contenido Principal */}
      <Row gutter={[24, 24]}>
        {/* Eventos Recientes */}
        <Col xs={24} lg={16}>
          <Card
            title="Eventos Recientes"
            style={{
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            }}
            extra={
              <Button type="link" size="small">
                Ver todos
              </Button>
            }
          >
            <List
              loading={loading}
              dataSource={recentEvents}
              renderItem={(event) => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} size="small">
                      Ver
                    </Button>,
                    <Button type="link" icon={<EditOutlined />} size="small">
                      Editar
                    </Button>,
                    <Button type="link" danger icon={<DeleteOutlined />} size="small">
                      Eliminar
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: getEventStatusColor(event.status || 'draft'),
                          color: 'white'
                        }}
                      >
                        <CalendarOutlined />
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{event.nombre}</Text>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: `${getEventStatusColor(event.status || 'draft')}15`,
                          color: getEventStatusColor(event.status || 'draft'),
                          fontWeight: '500'
                        }}>
                          {getEventStatusText(event.status || 'draft')}
                        </span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">
                          {event.fecha ? new Date(event.fecha).toLocaleDateString() : 'Fecha no definida'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {event.descripcion || 'Sin descripción'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Actividad Reciente */}
        <Col xs={24} lg={8}>
          <Card
            title="Actividad Reciente"
            style={{
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <List
              size="small"
              dataSource={[
                { action: 'Nuevo evento creado', time: 'Hace 2 horas', type: 'event' },
                { action: 'Usuario registrado', time: 'Hace 3 horas', type: 'user' },
                { action: 'Venta completada', time: 'Hace 4 horas', type: 'sale' },
                { action: 'Producto agregado', time: 'Hace 5 horas', type: 'product' },
                { action: 'Evento actualizado', time: 'Hace 6 horas', type: 'event' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar size="small" style={{ 
                        backgroundColor: 
                          item.type === 'event' ? '#3b82f6' :
                          item.type === 'user' ? '#10b981' :
                          item.type === 'sale' ? '#f59e0b' : '#8b5cf6'
                      }}>
                        {item.type === 'event' ? <CalendarOutlined /> :
                         item.type === 'user' ? <UserOutlined /> :
                         item.type === 'sale' ? <DollarOutlined /> : <ShoppingOutlined />}
                      </Avatar>
                    }
                    title={<Text style={{ fontSize: '14px' }}>{item.action}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Progreso de Metas */}
          <Card
            title="Progreso de Metas"
            style={{
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              marginTop: '24px',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Eventos este mes</Text>
                  <Text strong>75%</Text>
                </div>
                <Progress percent={75} strokeColor="#3b82f6" showInfo={false} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Ingresos objetivo</Text>
                  <Text strong>60%</Text>
                </div>
                <Progress percent={60} strokeColor="#10b981" showInfo={false} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Usuarios activos</Text>
                  <Text strong>90%</Text>
                </div>
                <Progress percent={90} strokeColor="#f59e0b" showInfo={false} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
};

export default Dashboard;
