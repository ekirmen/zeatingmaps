import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Popover, 
  List, 
  Button, 
  Typography, 
  Space,
  Avatar,
  Tag,
  Empty,
  Spin,
  Alert,
  Divider
} from 'antd';
import { 
  BellOutlined, 
  CheckOutlined,
  CloseOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';

const { Text, Title } = Typography;

const AdminNotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState([]);

  useEffect(() => {
    loadNotifications();
    loadSystemAlerts();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Cargar notificaciones del sistema
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      // Alertas críticas del sistema
      const alerts = [
        {
          id: 1,
          type: 'warning',
          title: 'Pagos Pendientes',
          message: 'Hay 5 transacciones pendientes de confirmación',
          priority: 'high',
          time: 'Hace 30 min'
        },
        {
          id: 2,
          type: 'error',
          title: 'Error de Sistema',
          message: 'Problema de conectividad con pasarela Stripe',
          priority: 'critical',
          time: 'Hace 1 hora'
        },
        {
          id: 3,
          type: 'info',
          title: 'Nuevo Usuario',
          message: 'Se ha registrado un nuevo administrador',
          priority: 'medium',
          time: 'Hace 2 horas'
        },
        {
          id: 4,
          type: 'success',
          title: 'Venta Exitosa',
          message: 'Se han vendido 25 tickets para el evento principal',
          priority: 'low',
          time: 'Hace 3 horas'
        }
      ];
      setSystemAlerts(alerts);
    } catch (error) {
      console.error('Error loading system alerts:', error);
    }
  };

  const subscribeToNotifications = () => {
    // Suscribirse a cambios en notificaciones
    const subscription = supabase
      .channel('admin_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      payment: <CreditCardOutlined style={{ color: '#52c41a' }} />,
      user: <UserOutlined style={{ color: '#1890ff' }} />,
      ticket: <FileTextOutlined style={{ color: '#722ed1' }} />,
      system: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      error: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />
    };
    return icons[type] || <BellOutlined />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'green'
    };
    return colors[priority] || 'default';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const notificationContent = (
    <div className="w-96">
      <div className="flex justify-between items-center mb-4">
        <Title level={5} style={{ margin: 0 }}>Notificaciones</Title>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small"
            onClick={markAllAsRead}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Alertas Críticas */}
      {systemAlerts.filter(alert => alert.priority === 'critical').length > 0 && (
        <div className="mb-4">
          <Alert
            message="Alertas Críticas"
            description="Requieren atención inmediata"
            type="error"
            showIcon
            className="mb-2"
          />
          <List
            size="small"
            dataSource={systemAlerts.filter(alert => alert.priority === 'critical')}
            renderItem={(alert) => (
              <List.Item className="bg-red-50 p-2 rounded">
                <List.Item.Meta
                  avatar={getNotificationIcon(alert.type)}
                  title={
                    <div className="flex justify-between">
                      <Text strong style={{ color: '#ff4d4f' }}>
                        {alert.title}
                      </Text>
                      <Tag color="red">CRÍTICO</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">{alert.message}</Text>
                      <div className="text-xs text-gray-500 mt-1">
                        {alert.time}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      <Divider />

      {/* Notificaciones Regulares */}
      {loading ? (
        <div className="text-center py-8">
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description="No hay notificaciones"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 p-2 rounded ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={getNotificationIcon(notification.type)}
                    size="small"
                  />
                }
                title={
                  <div className="flex justify-between items-start">
                    <Text strong={!notification.read}>
                      {notification.title}
                    </Text>
                    <Tag 
                      color={getPriorityColor(notification.priority)} 
                      size="small"
                    >
                      {notification.priority?.toUpperCase()}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" className="text-xs">
                      {notification.message}
                    </Text>
                    <div className="flex justify-between items-center mt-1">
                      <Text type="secondary" className="text-xs">
                        {formatTime(notification.created_at)}
                      </Text>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      {notifications.length > 0 && (
        <div className="text-center pt-4 border-t">
          <Button type="link" size="small">
            Ver todas las notificaciones
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={notificationContent}
      title={null}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      overlayClassName="admin-notification-popover"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          size="large"
          className="text-gray-600 hover:text-blue-600"
        />
      </Badge>
    </Popover>
  );
};

export default AdminNotificationCenter; 