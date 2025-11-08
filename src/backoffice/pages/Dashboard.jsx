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
import { useResponsive } from '../../hooks/useResponsive';
import '../styles/dashboard-design.css';

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
  const { isMobile, isTablet } = useResponsive();

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
      <div className="dashboard-grid dashboard-grid-4" style={{ marginBottom: '24px' }}>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-header">
            <h3 className="dashboard-stat-card-title">Total Eventos</h3>
            <div className="dashboard-stat-card-icon" style={{ background: 'var(--dashboard-primary-lighter)', color: 'var(--dashboard-primary)' }}>
              <CalendarOutlined />
            </div>
          </div>
          <div className="dashboard-stat-card-value">
            {loading ? '...' : stats.totalEvents}
          </div>
          <div className="dashboard-stat-card-footer">
            <ArrowUpOutlined style={{ color: 'var(--dashboard-success)' }} />
            <span style={{ color: 'var(--dashboard-success)' }}>12%</span>
            <span>vs mes anterior</span>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-header">
            <h3 className="dashboard-stat-card-title">Total Usuarios</h3>
            <div className="dashboard-stat-card-icon" style={{ background: 'var(--dashboard-success-lighter)', color: 'var(--dashboard-success)' }}>
              <UserOutlined />
            </div>
          </div>
          <div className="dashboard-stat-card-value">
            {loading ? '...' : stats.totalUsers}
          </div>
          <div className="dashboard-stat-card-footer">
            <ArrowUpOutlined style={{ color: 'var(--dashboard-success)' }} />
            <span style={{ color: 'var(--dashboard-success)' }}>8%</span>
            <span>vs mes anterior</span>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-header">
            <h3 className="dashboard-stat-card-title">Ingresos Totales</h3>
            <div className="dashboard-stat-card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <DollarOutlined />
            </div>
          </div>
          <div className="dashboard-stat-card-value" style={{ fontSize: isMobile ? '1.5rem' : '1.875rem' }}>
            {loading ? '...' : `$${stats.totalRevenue.toLocaleString()}`}
          </div>
          <div className="dashboard-stat-card-footer">
            <ArrowUpOutlined style={{ color: 'var(--dashboard-success)' }} />
            <span style={{ color: 'var(--dashboard-success)' }}>15%</span>
            <span>vs mes anterior</span>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card-header">
            <h3 className="dashboard-stat-card-title">Total Productos</h3>
            <div className="dashboard-stat-card-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <ShoppingOutlined />
            </div>
          </div>
          <div className="dashboard-stat-card-value">
            {loading ? '...' : stats.totalProducts}
          </div>
          <div className="dashboard-stat-card-footer">
            <ArrowUpOutlined style={{ color: 'var(--dashboard-success)' }} />
            <span style={{ color: 'var(--dashboard-success)' }}>5%</span>
            <span>vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '2fr 1fr', gap: '24px' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Eventos Recientes</h3>
          </div>
          <div className="dashboard-card-body">
            {loading ? (
              <div className="dashboard-loading">Cargando...</div>
            ) : (
              <List
                dataSource={recentEvents}
                renderItem={(event) => (
                  <List.Item
                    style={{ padding: '16px 0', borderBottom: '1px solid var(--dashboard-gray-200)' }}
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
                      avatar={<Avatar icon={<CalendarOutlined />} style={{ backgroundColor: 'var(--dashboard-primary)' }} />}
                      title={<span style={{ fontWeight: 600 }}>{event.nombre}</span>}
                      description={
                        <Space direction="vertical" size="small" style={{ marginTop: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {event.fecha} • {event.ubicacion}
                          </Text>
                          <Tag color={getEventStatusColor(event.estado)} style={{ margin: 0 }}>
                            {getEventStatusText(event.estado)}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Progreso de Metas</h3>
          </div>
          <div className="dashboard-card-body">
            {loading ? (
              <div className="dashboard-loading">Cargando...</div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Eventos este mes</Text>
                  <Progress percent={75} status="active" strokeColor="var(--dashboard-primary)" />
                </div>
                <div>
                  <Text style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Ventas objetivo</Text>
                  <Progress percent={60} status="active" strokeColor="var(--dashboard-success)" />
                </div>
                <div>
                  <Text style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Nuevos usuarios</Text>
                  <Progress percent={90} status="active" strokeColor="var(--dashboard-warning)" />
                </div>
              </Space>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
