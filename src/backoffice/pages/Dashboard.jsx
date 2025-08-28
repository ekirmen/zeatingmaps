import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Space, Button, Progress, List, Avatar, Tag } from 'antd';
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
import { useTenantFilter } from '../../hooks/useTenantFilter';

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
  const { addTenantFilter } = useTenantFilter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas con filtrado automático por tenant
      const [eventsCount, usersCount, productsCount] = await Promise.all([
        addTenantFilter(supabase.from('eventos').select('id', { count: 'exact' })),
        addTenantFilter(supabase.from('profiles').select('id', { count: 'exact' })),
        addTenantFilter(supabase.from('productos').select('id', { count: 'exact' }))
      ]);

      // Cargar eventos recientes con filtrado automático
      const { data: recentEventsData } = await addTenantFilter(
        supabase
          .from('eventos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
      );

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
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Eventos"
            value={stats.totalEvents}
            icon={<CalendarOutlined />}
            color="#1890ff"
            trend="up"
            trendValue="12%"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Usuarios"
            value={stats.totalUsers}
            icon={<UserOutlined />}
            color="#52c41a"
            trend="up"
            trendValue="8%"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Ingresos Totales"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarOutlined />}
            color="#faad14"
            trend="up"
            trendValue="15%"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Productos"
            value={stats.totalProducts}
            icon={<ShoppingOutlined />}
            color="#722ed1"
            trend="up"
            trendValue="5%"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Contenido principal */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Eventos Recientes" loading={loading}>
            <List
              dataSource={recentEvents}
              renderItem={(event) => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />} size="small">
                      Ver
                    </Button>,
                    <Button type="link" icon={<EditOutlined />} size="small">
                      Editar
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} />}
                    title={event.nombre}
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">
                          {event.fecha} • {event.ubicacion}
                        </Text>
                        <Tag color={getEventStatusColor(event.estado)}>
                          {getEventStatusText(event.estado)}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Progreso de Metas" loading={loading}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Eventos este mes</Text>
                <Progress percent={75} status="active" />
              </div>
              <div>
                <Text>Ventas objetivo</Text>
                <Progress percent={60} status="active" />
              </div>
              <div>
                <Text>Nuevos usuarios</Text>
                <Progress percent={90} status="active" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
};

export default Dashboard;
