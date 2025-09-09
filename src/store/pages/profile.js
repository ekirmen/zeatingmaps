// src/store/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { 
  Card, Avatar, Descriptions, Button, message, Tabs, 
  List, Tag, Space, Row, Col, Statistic, Divider,
  Timeline, Empty, Spin, Alert, Image, Badge, Input
} from 'antd';
import { 
  UserOutlined, ShoppingOutlined, CalendarOutlined, 
  CreditCardOutlined, HeartOutlined, SettingOutlined,
  EditOutlined, SaveOutlined, CloseOutlined, DollarOutlined,
  FileTextOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { 
  getUserProfile, 
  getUserPurchases, 
  getUserPurchasesWithSeats,
  getUserReservations, 
  getUserFavorites,
  getUserActivityHistory,
  updateUserProfile,
  getUserStats
} from '../services/userProfileService';

const { TabPane } = Tabs;

const Profile = () => {
  const { user, logout } = useAuth();
  const { activeTenant } = useMultiTenant();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Cargar todos los datos en paralelo
      const [
        profileData,
        purchasesData,
        reservationsData,
        favoritesData,
        activityData,
        statsData
      ] = await Promise.all([
        getUserProfile(user.id),
        getUserPurchasesWithSeats(user.id), // Usar la nueva función con asientos
        getUserReservations(user.id),
        getUserFavorites(user.id),
        getUserActivityHistory(user.id),
        getUserStats(user.id)
      ]);

      // Procesar datos del perfil
      const processedProfile = {
        email: user.email,
        name: profileData?.login || user.user_metadata?.name || 'Usuario',
        phone: profileData?.telefono || 'No especificado',
        role: profileData?.user_tenants?.[0]?.role || 'usuario',
        company: profileData?.user_tenants?.[0]?.tenants?.company_name || 'N/A',
        joinDate: new Date(user.created_at).toLocaleDateString('es-ES'),
        lastLogin: new Date().toLocaleDateString('es-ES'),
        avatar: user.user_metadata?.avatar_url || null,
        permissions: profileData?.user_tenants?.[0]?.permissions || {}
      };

      setProfile(processedProfile);
      setEditForm({
        name: processedProfile.name,
        phone: processedProfile.phone
      });

      // Procesar otros datos
      setPurchases(purchasesData);
      setReservations(reservationsData);
      setFavorites(favoritesData);
      setActivityHistory(activityData);
      setStats(statsData);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      message.error('Error al cargar tu perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(user.id, {
        email: editForm.name,
        phone: editForm.phone
      });
      
      setProfile(prev => ({
        ...prev,
        name: editForm.name,
        phone: editForm.phone
      }));
      
      setEditing(false);
      message.success('Perfil actualizado correctamente');
    } catch (error) {
      message.error('Error al actualizar el perfil');
    }
  };

  const handleLogout = () => {
    logout();
    message.success('Sesión cerrada correctamente');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'green',
      'pending': 'orange',
      'cancelled': 'red',
      'active': 'blue',
      'expired': 'gray'
    };
    return colors[status] || 'default';
  };

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="Debes iniciar sesión"
          description="Para ver tu perfil, necesitas iniciar sesión primero."
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" href="/store/login">
              Iniciar Sesión
            </Button>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Cargando tu perfil...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header del Perfil */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar 
              size={80} 
              src={profile?.avatar} 
              icon={<UserOutlined />}
              style={{ border: '3px solid #1890ff' }}
            />
          </Col>
          <Col flex="1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 8px 0' }}>{profile?.name}</h1>
                <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                  <UserOutlined /> {profile?.email}
                </p>
                <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                  <CalendarOutlined /> Miembro desde {profile?.joinDate}
                </p>
                <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                  <SettingOutlined /> {profile?.company}
                </p>
                <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                  <Tag color="blue">{profile?.role}</Tag>
                </p>
              </div>
              <Space>
                {editing ? (
                  <>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                      Guardar
                    </Button>
                    <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                      Editar
                    </Button>
                    <Button danger onClick={handleLogout}>
                      Cerrar Sesión
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas Reales */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Compras Totales"
              value={stats.totalPurchases || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Completadas: {stats.completedPurchases || 0} | Pendientes: {stats.pendingPurchases || 0}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Reservas Activas"
              value={stats.activeReservations || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Favoritos"
              value={stats.totalFavorites || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Gastado"
              value={stats.totalSpent || 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs de Información */}
      <Card>
        <Tabs defaultActiveKey="profile" size="large">
          {/* Tab: Información Personal */}
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Información Personal
              </span>
            } 
            key="profile"
          >
            <Descriptions bordered column={2} size="large">
              <Descriptions.Item label="Nombre" span={2}>
                {editing ? (
                  <Input 
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  profile?.name
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {profile?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Teléfono">
                {editing ? (
                  <Input 
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  profile?.phone
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Rol">
                <Tag color="blue">{profile?.role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Empresa" span={2}>
                {profile?.company}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Registro">
                {profile?.joinDate}
              </Descriptions.Item>
              <Descriptions.Item label="Último Acceso">
                {profile?.lastLogin}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          {/* Tab: Mis Compras */}
          <TabPane 
            tab={
              <span>
                <ShoppingOutlined />
                Mis Compras ({purchases.length})
              </span>
            } 
            key="purchases"
          >
            {purchases.length > 0 ? (
              <List
                dataSource={purchases}
                renderItem={purchase => (
                  <List.Item
                    actions={[
                      <Button size="small" href={`/store/payment-success/${purchase.locator}`}>
                        Ver Detalles
                      </Button>,
                      <Button size="small">Descargar Ticket</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size={64}
                          icon={<ShoppingOutlined />}
                        />
                      }
                      title={`Transacción ${purchase.locator}`}
                      description={
                        <Space direction="vertical" size="small">
                          <div>
                            <CalendarOutlined /> {formatDate(purchase.created_at)}
                          </div>
                          <div>
                            <FileTextOutlined /> {purchase.seats?.length || 0} asientos
                          </div>
                          <div>
                            <CreditCardOutlined /> {purchase.payment_method || 'Método de pago'}
                          </div>
                          {purchase.seats && purchase.seats.length > 0 && (
                            <div>
                              <strong>Asientos:</strong> {purchase.seats.map(seat => seat.seat_id).join(', ')}
                            </div>
                          )}
                        </Space>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                        ${purchase.amount}
                      </div>
                      <Tag color={getStatusColor(purchase.status)}>
                        {purchase.status}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No tienes compras aún"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" href="/store">
                  Explorar Eventos
                </Button>
              </Empty>
            )}
          </TabPane>

          {/* Tab: Mis Reservas */}
          <TabPane 
            tab={
              <span>
                <CalendarOutlined />
                Mis Reservas ({reservations.length})
              </span>
            } 
            key="reservations"
          >
            {reservations.length > 0 ? (
              <List
                dataSource={reservations}
                renderItem={reservation => (
                  <List.Item
                    actions={[
                      <Button size="small" type="primary">Confirmar</Button>,
                      <Button size="small" danger>Cancelar</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size={64}
                          src={reservation.events?.image_url}
                          icon={<CalendarOutlined />}
                        />
                      }
                      title={reservation.events?.name || 'Evento'}
                      description={
                        <Space direction="vertical" size="small">
                          <div>
                            <CalendarOutlined /> {formatDate(reservation.events?.date)}
                          </div>
                          <div>
                            <ClockCircleOutlined /> Expira: {formatDate(reservation.expires_at)}
                          </div>
                          <div>
                            <FileTextOutlined /> {reservation.ticket_count || 0} tickets
                          </div>
                        </Space>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Tag color={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No tienes reservas activas"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </TabPane>

          {/* Tab: Mis Favoritos */}
          <TabPane 
            tab={
              <span>
                <HeartOutlined />
                Mis Favoritos ({favorites.length})
              </span>
            } 
            key="favorites"
          >
            {favorites.length > 0 ? (
              <List
                dataSource={favorites}
                renderItem={favorite => (
                  <List.Item
                    actions={[
                      <Button size="small" type="primary">Ver Evento</Button>,
                      <Button size="small" danger>Quitar</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size={64}
                          src={favorite.events?.image_url}
                          icon={<HeartOutlined />}
                        />
                      }
                      title={favorite.events?.name || 'Evento'}
                      description={
                        <Space direction="vertical" size="small">
                          <div>
                            <CalendarOutlined /> {formatDate(favorite.events?.date)}
                          </div>
                          <div>
                            <SettingOutlined /> {favorite.events?.venue || 'Venue'}
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No tienes eventos favoritos"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" href="/store">
                  Explorar Eventos
                </Button>
              </Empty>
            )}
          </TabPane>

          {/* Tab: Historial de Actividad */}
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined />
                Historial de Actividad
              </span>
            } 
            key="activity"
          >
            {activityHistory.length > 0 ? (
              <Timeline>
                {activityHistory.map(activity => (
                  <Timeline.Item 
                    key={activity.id}
                    color={activity.type === 'purchase' ? 'green' : 'blue'}
                  >
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
                      {activity.action}
                    </p>
                    <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                      {activity.events?.name || 'Evento'}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                      {formatDate(activity.created_at)}
                    </p>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty
                description="No hay actividad reciente"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Profile;
export default Profile;