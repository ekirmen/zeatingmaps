import React, { useState } from 'react';
import { Layout, Button, Dropdown, Menu, Avatar, Space, Typography, Badge, Result } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SidebarMenuWithRoles from './components/SidebarMenuWithRoles';
import { useRole } from './components/RoleBasedAccess';

const { Header, Content } = Layout;
const { Text } = Typography;

const BackofficeLayoutWithRoles = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { getRole, isStoreUser, hasPermission, loading } = useRole();

  // Cargando permisos/rol
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Cargando permisos...</div>
      </div>
    );
  }

  // Si es usuario de store, redirigir a la tienda
  if (isStoreUser()) {
    navigate('/store');
    return null;
  }

  // Si es invitado (no autenticado), bloquear acceso al dashboard
  if (getRole() === 'guest') {
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle="No puedes acceder al dashboard sin iniciar sesión."
        extra={
          <Button type="primary" href="/store">Ir a la Tienda</Button>
        }
      />
    );
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
      onClick: () => navigate('/dashboard/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
      onClick: () => navigate('/dashboard/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout
    }
  ];

  const siderWidth = collapsed ? 80 : 250;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar con control de roles */}
      <SidebarMenuWithRoles collapsed={collapsed} />
      
      <Layout>
        {/* Header */}
        <Header 
          style={{ 
            padding: '0 24px', 
            background: '#fff', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'fixed',
            top: 0,
            right: 0,
            left: siderWidth,
            zIndex: 999,
            transition: 'left 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            
            <div style={{ marginLeft: '16px' }}>
              <Text strong style={{ fontSize: '18px' }}>
                Dashboard Administrativo
              </Text>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Rol: {String(getRole() || 'USUARIO').toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notificaciones */}
            {hasPermission('dashboard') && (
              <Badge count={0} size="small">
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  size="large"
                />
              </Badge>
            )}

            {/* Menú de usuario */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" style={{ padding: '4px 8px' }}>
                <Space>
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <Text>Usuario</Text>
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>

        {/* Contenido principal */}
        <Content
          style={{
            marginTop: 88,
            marginRight: 24,
            marginBottom: 24,
            marginLeft: siderWidth + 24,
            padding: 0,
            minHeight: 'calc(100vh - 112px)',
            background: '#f5f5f5',
            borderRadius: '8px',
            overflow: 'auto',
            transition: 'margin-left 0.2s'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BackofficeLayoutWithRoles;
