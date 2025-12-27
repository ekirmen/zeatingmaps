import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Space } from '../../utils/antdComponents';
import {
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = ({ children, title, subtitle, actions }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/backoffice',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/backoffice/eventos',
      icon: <CalendarOutlined />,
      label: 'Eventos',
    },
    {
      key: '/backoffice/usuarios',
      icon: <TeamOutlined />,
      label: 'Usuarios',
    },
    {
      key: '/backoffice/productos',
      icon: <ShoppingOutlined />,
      label: 'Productos',
    },
    {
      key: '/backoffice/ventas',
      icon: <BarChartOutlined />,
      label: 'Ventas',
    },
    {
      key: '/backoffice/reportes',
      icon: <FileTextOutlined />,
      label: 'Reportes',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/backoffice/eventos')) return '/backoffice/eventos';
    if (path.startsWith('/backoffice/usuarios')) return '/backoffice/usuarios';
    if (path.startsWith('/backoffice/productos')) return '/backoffice/productos';
    if (path.startsWith('/backoffice/ventas')) return '/backoffice/ventas';
    if (path.startsWith('/backoffice/reportes')) return '/backoffice/reportes';
    return '/backoffice';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        width={250}
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '4px'
          }}>
            ðŸŽ« Ticketera
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
            Panel de Administración
          </Text>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
          }}
          items={menuItems}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '64px',
        }}>
          {/* Page Title */}
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              {title}
            </h1>
            {subtitle && (
              <Text style={{ color: '#64748b', fontSize: '14px' }}>
                {subtitle}
              </Text>
            )}
          </div>

          {/* Header Actions */}
          <Space size="large">
            {/* Notifications */}
            <Badge count={3} size="small">
              <div className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                <BellOutlined style={{ fontSize: '20px', color: '#64748b' }} />
              </div>
            </Badge>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '12px',
                transition: 'all 0.2s',
                border: '1px solid transparent',
              }}
                className="hover:bg-gray-50 hover:border-gray-200"
              >
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.2' }}>
                    {user?.email?.split('@')[0] || 'Usuario'}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.2' }}>
                    Administrador
                  </Text>
                </div>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }} />
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          minHeight: 'calc(100vh - 112px)',
        }}>
          {/* Page Actions */}
          {actions && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              {actions}
            </div>
          )}

          {/* Page Content */}
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;


