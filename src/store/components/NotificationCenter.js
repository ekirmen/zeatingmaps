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
  Spin
} from '../../utils/antdComponents';
import { 
  BellOutlined, 
  CheckCircleOutlined,
  CloseOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Text } = Typography;

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadNotifications();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const { data: { user } } = supabase.auth.getUser();
    
    if (user) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (error) throw error;

        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      payment: <CreditCardOutlined style={{ color: '#52c41a' }} />,
      refund: <HistoryOutlined style={{ color: '#1890ff' }} />,
      system: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
    };
    return icons[type] || <BellOutlined />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      payment: 'green',
      refund: 'blue',
      system: 'orange'
    };
    return colors[type] || 'default';
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
    <div className="w-80">
      <div className="flex justify-between items-center mb-4">
        <Text strong>Notificaciones</Text>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small"
            onClick={markAllAsRead}
          >
            Marcar todas como le­das
          </Button>
        )}
      </div>

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
                      color={getNotificationColor(notification.type)} 
                      size="small"
                    >
                      {notification.type}
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
      overlayClassName="notification-popover"
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

export default NotificationCenter; 

