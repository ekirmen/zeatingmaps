// src/store/pages/Profile.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Avatar, Descriptions, Button, message, Tabs,
  List, Tag, Space, Row, Col, Statistic,
  Timeline, Empty, Spin, Alert, Input, Modal
} from '../../utils/antdComponents';
import {
  UserOutlined, ShoppingOutlined, CalendarOutlined,
  CreditCardOutlined, HeartOutlined, SettingOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
  FileTextOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserProfile,
  getUserPurchasesWithSeats,
  getUserReservations,
  getUserFavorites,
  getUserActivityHistory,
  updateUserProfile,
  getUserStats
} from '../services/userProfileService';
import downloadTicket from '../../utils/downloadTicket';
import downloadPkpass from '../../utils/downloadPkpass';
import '../styles/profile-mobile.css';

const { TabPane } = Tabs;

const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [editForm, setEditForm] = useState({});
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const loadUserData = useCallback(async () => {
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
        getUserPurchasesWithSeats(user.id), // Usar la nueva funci³n con asientos
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

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
    message.success('Sesi³n cerrada correctamente');
  };



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
      'expired': 'gray',
      'pagado': 'green',
      'reservado': 'orange',
      'cancelado': 'red',
      'activo': 'blue',
      'expirado': 'gray'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'Completado',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado',
      'active': 'Activo',
      'expired': 'Expirado',
      'pagado': 'Pagado',
      'reservado': 'Reservado',
      'cancelado': 'Cancelado',
      'activo': 'Activo',
      'expirado': 'Expirado'
    };
    return labels[status] || status;
  };

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="Debes iniciar sesi³n"
          description="Para ver tu perfil, necesitas iniciar sesi³n primero."
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" href="/store/login">
              Iniciar Sesi³n
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
    <div className="profile-container" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header del Perfil - Responsive */}
      <Card style={{ marginBottom: '16px' }} className="profile-header-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'center' }}>
            <Avatar
              size={{ xs: 64, sm: 80, md: 100 }}
              src={profile?.avatar}
              icon={<UserOutlined />}
              style={{ border: '3px solid #1890ff' }}
            />
          </Col>
          <Col xs={24} sm={16} md={18}>
            <div className="profile-header-info">
              <div className="profile-header-main">
                <h1 className="profile-name">{profile?.name}</h1>
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <UserOutlined className="profile-icon" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="profile-detail-item">
                    <CalendarOutlined className="profile-icon" />
                    <span>Miembro desde {profile?.joinDate}</span>
                  </div>
                  <div className="profile-detail-item">
                    <SettingOutlined className="profile-icon" />
                    <span>{profile?.company}</span>
                  </div>
                  <div className="profile-detail-item">
                    <Tag color="blue">{profile?.role}</Tag>
                  </div>
                </div>
              </div>
              <div className="profile-actions">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {editing ? (
                    <>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        block
                        size="large"
                      >
                        Guardar
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={() => setEditing(false)}
                        block
                        size="large"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setEditing(true)}
                        block
                        size="large"
                      >
                        Editar Perfil
                      </Button>
                      <Button
                        danger
                        onClick={handleLogout}
                        block
                        size="large"
                      >
                        Cerrar Sesi³n
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Estad­sticas Reales - Responsive */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
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
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Reservas Activas"
              value={stats.activeReservations || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Favoritos"
              value={stats.totalFavorites || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
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

      {/* Tabs de Informaci³n */}
      <Card>
        <Tabs defaultActiveKey="profile" size="large">
          {/* Tab: Informaci³n Personal */}
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Informaci³n Personal
              </span>
            }
            key="profile"
          >
            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2 }}
              size="large"
            >
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
              <Descriptions.Item label="Tel©fono">
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
              <Descriptions.Item label="šltimo Acceso">
                {profile?.lastLogin}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          {/* Tab: Mis Compras */}
          <TabPane
            tab={
              <span>
                <ShoppingOutlined />
                Mis Entradas ({purchases.length})
              </span>
            }
            key="purchases"
          >
            {purchases.length > 0 ? (
              <List
                dataSource={purchases}
                renderItem={(purchase) => {
                  // Verificar si el wallet est¡ habilitado para esta compra
                  const getWalletEnabled = () => {
                    if (!purchase?.event?.datosBoleto) {
                      return false;
                    }
                    try {
                      const datosBoleto = typeof purchase.event.datosBoleto === 'string'
                        ? JSON.parse(purchase.event.datosBoleto)
                        : purchase.event.datosBoleto;
                      return datosBoleto?.habilitarWallet || false;
                    } catch (e) {
                      return false;
                    }
                  };

                  const walletEnabled = getWalletEnabled();

                  return (
                    <List.Item
                      actions={[
                        <Space key="actions" direction="vertical" size="small" style={{ width: '100%' }}>
                          <Button
                            size="small"
                            href={`/store/payment-success/${purchase.locator}`}
                            block
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            size="small"
                            disabled={purchase.status !== 'completed' && purchase.status !== 'pagado'}
                            title={purchase.status !== 'completed' && purchase.status !== 'pagado' ? 'Solo disponible para pagos completados' : 'Descargar tickets individuales'}
                            onClick={() => {
                              if ((purchase.status === 'completed' || purchase.status === 'pagado') && purchase.locator) {
                                setSelectedPurchase(purchase);
                                setTicketModalVisible(true);
                              }
                            }}
                            block
                          >
                            Descargar Tickets
                          </Button>
                          {(purchase.status === 'completed' || purchase.status === 'pagado') && walletEnabled && (
                            <Button
                              size="small"
                              type="default"
                              onClick={async () => {
                                try {
                                  await downloadPkpass(purchase.locator, null, 'web');
                                } catch (error) {
                                  console.error('Error descargando .pkpass:', error);
                                  message.error('Error al descargar el archivo .pkpass');
                                }
                              }}
                              block
                            >
                              ðŸ“± Descargar Wallet (.pkpass)
                            </Button>
                          )}
                        </Space>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={64}
                            icon={<ShoppingOutlined />}
                          />
                        }
                        title={`Localizador ${purchase.locator}`}
                      description={
                        <Space direction="vertical" size="small">
                          <div>
                            <CalendarOutlined /> {formatDate(purchase.created_at)}
                          </div>
                          <div>
                            <FileTextOutlined /> {purchase.seats?.length || 0} asientos
                          </div>
                          <div>
                            <CreditCardOutlined /> {purchase.payment_method || 'M©todo de pago'}
                          </div>
                        </Space>
                      }
                    />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                          ${purchase.amount}
                        </div>
                        <Tag color={getStatusColor(purchase.status)}>
                          {getStatusLabel(purchase.status)}
                        </Tag>
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty
                description="No tienes compras aºn"
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
                        {getStatusLabel(reservation.status)}
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

      {/* Modal para descargar tickets individuales */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            <FileTextOutlined style={{ marginRight: '8px' }} />
            Descargar Tickets - {selectedPurchase?.locator}
          </div>
        }
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false);
          setSelectedPurchase(null);
        }}
        footer={[
          <Button key="all" type="primary" onClick={async () => {
            if (selectedPurchase?.locator) {
              try {
                await downloadTicket(selectedPurchase.locator, null, 'web');
                message.success('Descargando todos los tickets...');
              } catch (error) {
                message.error('Error al descargar los tickets');
              }
            }
          }}>
            Descargar todos los PDF
          </Button>,
          <Button key="close" onClick={() => {
            setTicketModalVisible(false);
            setSelectedPurchase(null);
          }}>
            Cerrar
          </Button>
        ]}
        width="90%"
        style={{ maxWidth: '600px' }}
        className="ticket-download-modal"
      >
        {selectedPurchase && selectedPurchase.seats && selectedPurchase.seats.length > 0 ? (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                <CalendarOutlined style={{ marginRight: '8px' }} />
                {formatDate(selectedPurchase.created_at)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <FileTextOutlined style={{ marginRight: '8px' }} />
                {selectedPurchase.seats.length} {selectedPurchase.seats.length === 1 ? 'asiento' : 'asientos'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {selectedPurchase.seats.map((seat, seatIndex) => {
                const seatId = seat.seat_id || seat.id || seat._id || `seat-${seatIndex}`;
                const zonaNombre = seat.zona_nombre || seat.zonaNombre || seat.zona?.nombre || seat.zona || null;
                const mesaId = seat.table_id || seat.mesa_id || seat.mesaId || seat.mesa?.id || seat.mesa || null;
                const filaNombre = seat.fila_nombre || seat.filaNombre || seat.fila?.nombre || seat.fila || seat.row || null;

                return (
                  <Card
                    key={seatId || seatIndex}
                    size="small"
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      transition: 'all 0.3s',
                    }}
                    bodyStyle={{ padding: '12px' }}
                    hoverable
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                        Asiento {seatIndex + 1}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace', marginBottom: '4px' }}>
                        ID: {seatId}
                      </div>
                      {zonaNombre && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                          Zona: {zonaNombre}
                        </div>
                      )}
                      {mesaId && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                          Mesa: {mesaId}
                        </div>
                      )}
                      {filaNombre && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                          Fila: {filaNombre}
                        </div>
                      )}
                      {seat.precio && (
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#52c41a', marginTop: '4px' }}>
                          ${seat.precio}
                        </div>
                      )}
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      block
                      icon={<FileTextOutlined />}
                      onClick={async () => {
                        try {
                          await downloadTicket(selectedPurchase.locator, null, 'web', seatIndex);
                          message.success(`Descargando ticket del asiento ${seatIndex + 1}...`);
                        } catch (error) {
                          console.error('Error descargando asiento:', error);
                          message.error('Error al descargar el ticket');
                        }
                      }}
                      style={{ marginTop: '8px' }}
                    >
                      Descargar PDF
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Empty
            description="No hay asientos disponibles para esta compra"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Modal>
    </div>
  );
};

export default Profile;

