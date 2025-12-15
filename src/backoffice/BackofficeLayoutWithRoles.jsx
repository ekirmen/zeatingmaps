import React, { useState } from 'react';
import {
  Layout,
  Button,
  Dropdown,
  Menu,
  Avatar,
  Space,
  Typography,
  Badge,
  Result,
  Drawer,
} from '../utils/antdComponents';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SidebarMenuWithRoles from './components/SidebarMenuWithRoles';
import { useRole } from './components/RoleBasedAccess';
import { RecintoProvider } from './contexts/RecintoContext';
import { RecintoSalaProvider } from './contexts/RecintoSalaContext';
import { IvaProvider } from './contexts/IvaContext';
import { TagProvider } from './contexts/TagContext';
import { TenantProvider } from '../contexts/TenantContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import './styles/dashboard-design.css';
import DashboardFooter from './components/DashboardFooter';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const BackofficeLayoutWithRoles = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getRole, isStoreUser, hasPermission, loading } = useRole();
  const { isMobile, isTablet } = useResponsive();

  // Ocultar sidebar en boletería
  const isBoleteriaRoute = location.pathname.includes('/boleteria');

  // En móvil, colapsar automáticamente
  React.useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Cargando permisos/rol
  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
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
          <Button type="primary" href="/store">
            Ir a la Tienda
          </Button>
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
      onClick: () => navigate('/dashboard/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
      onClick: () => navigate('/dashboard/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
  ];

  const siderWidth = collapsed ? 80 : 250;

  return (
    <TenantProvider>
      <ThemeProvider>
        <RecintoProvider>
          <RecintoSalaProvider>
            <IvaProvider>
              <TagProvider>
                <Layout style={{ minHeight: '100vh' }}>
                  {/* Sidebar con control de roles - oculto en boletería */}
                  {!isBoleteriaRoute && <SidebarMenuWithRoles collapsed={collapsed} />}

                  <Layout>
                    {/* Header */}
                    <Header
                      className="dashboard-header"
                      style={{
                        padding: isMobile ? '0 16px' : '0 24px',
                        background: '#fff',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        left: isBoleteriaRoute ? 0 : isMobile ? 0 : siderWidth,
                        zIndex: 999,
                        transition: 'left 0.2s',
                        height: isMobile ? '56px' : '64px',
                      }}
                    >
                      <div
                        className="dashboard-header-left"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? '8px' : '16px',
                        }}
                      >
                        {!isBoleteriaRoute && (
                          <>
                            {isMobile ? (
                              <Button
                                type="text"
                                className="header-icon-btn"
                                icon={<MenuUnfoldOutlined />}
                                onClick={() => setMobileMenuOpen(true)}
                                style={{ fontSize: '18px', width: 40, height: 40, padding: 0 }}
                              />
                            ) : (
                              <Button
                                type="text"
                                className="header-icon-btn"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ fontSize: '16px', width: 48, height: 48 }}
                              />
                            )}
                          </>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: isMobile ? '16px' : '18px', margin: 0 }}>
                            {isMobile ? 'Dashboard' : 'Dashboard Administrativo'}
                          </Text>
                        </div>
                      </div>

                      <div
                        className="dashboard-header-right"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? '8px' : '12px',
                        }}
                      >
                        {/* Notificaciones */}
                        {hasPermission('dashboard') && !isMobile && (
                          <Badge count={0} size="small">
                            <Button
                              type="text"
                              className="header-icon-btn"
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
                          <Button
                            type="text"
                            className="header-user-btn"
                            style={{ padding: isMobile ? '4px 6px' : '6px 10px' }}
                          >
                            <Space size={isMobile ? 4 : 8}>
                              <Avatar
                                size={isMobile ? 'small' : 'default'}
                                icon={<UserOutlined />}
                                style={{ backgroundColor: '#1890ff' }}
                              />
                              {!isMobile && <Text>Usuario</Text>}
                            </Space>
                          </Button>
                        </Dropdown>
                      </div>
                    </Header>

                    {/* Mobile Menu Drawer */}
                    {isMobile && !isBoleteriaRoute && (
                      <Drawer
                        title={null}
                        placement="left"
                        onClose={() => setMobileMenuOpen(false)}
                        open={mobileMenuOpen}
                        width={280}
                        bodyStyle={{ padding: 0, height: '100%' }}
                        headerStyle={{ display: 'none' }}
                        closable={true}
                      >
                        <SidebarMenuWithRoles
                          collapsed={false}
                          asDrawer={true}
                          onMenuClick={() => setMobileMenuOpen(false)}
                        />
                      </Drawer>
                    )}

                    {/* Contenido principal */}
                    <Content
                      className="dashboard-content mobile-content"
                      style={{
                        marginTop: isMobile ? 56 : 64,
                        marginRight: isMobile ? 12 : 24,
                        marginBottom: isMobile ? 12 : 24,
                        marginLeft: isBoleteriaRoute
                          ? isMobile
                            ? 12
                            : 24
                          : isMobile
                            ? 12
                            : siderWidth + 24,
                        padding: isMobile ? 16 : 24,
                        minHeight: `calc(100vh - ${isMobile ? 132 : 156}px)`,
                        background: '#f5f5f5',
                        borderRadius: isMobile ? '8px' : '12px',
                        overflow: 'auto',
                        transition: 'margin-left 0.2s, margin-top 0.2s',
                      }}
                    >
                      <Outlet />
                    </Content>
                    <Footer
                      className="dashboard-footer"
                      style={{
                        marginLeft: isBoleteriaRoute
                          ? isMobile
                            ? 12
                            : 24
                          : isMobile
                            ? 12
                            : siderWidth + 24,
                        marginRight: isMobile ? 12 : 24,
                        padding: isMobile ? '12px 16px' : '16px 24px',
                        background: 'transparent',
                      }}
                    >
                      <DashboardFooter />
                    </Footer>
                  </Layout>
                </Layout>
              </TagProvider>
            </IvaProvider>
          </RecintoSalaProvider>
        </RecintoProvider>
      </ThemeProvider>
    </TenantProvider>
  );
};

export default BackofficeLayoutWithRoles;
