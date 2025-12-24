import React, { useState, useEffect } from 'react';
import { Card, Button, Switch, Input, Select, Typography, Space, message, Alert } from '../../../../utils/antdComponents';
import { BellOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;

const PushNotifications = ({ eventId }) => {
  const [config, setConfig] = useState({
    enabled: false,
    title: '',
    message: '',
    type: 'info', // info, success, warning, error
    target: 'all', // all, attendees, organizers
    scheduled: false,
    scheduledAt: null
  });

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadNotifications();
  }, [eventId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('push_notifications_config')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading push notifications config:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from('push_notifications_config')
        .upsert({
          event_id: eventId,
          enabled: config.enabled,
          title: config.title,
          message: config.message,
          type: config.type,
          target: config.target,
          scheduled: config.scheduled,
          scheduled_at: config.scheduledAt,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      message.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('Error al guardar la configuración');
    }
  };

  const sendNotification = async () => {
    if (!config.title || !config.message) {
      message.error('Completa el título y mensaje');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('push_notifications')
        .insert({
          event_id: eventId,
          title: config.title,
          message: config.message,
          type: config.type,
          target: config.target,
          sent_at: new Date().toISOString()
        });

      if (error) throw error;

      message.success('Notificación enviada correctamente');
      loadNotifications();
      
      // Limpiar formulario
      setConfig(prev => ({
        ...prev,
        title: '',
        message: ''
      }));
    } catch (error) {
      console.error('Error sending notification:', error);
      message.error('Error al enviar la notificación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Title level={3}>
        <BellOutlined className="mr-2" />
        Notificaciones Push
      </Title>

      <Alert
        message="Comunícate con tu audiencia"
        description="Envía notificaciones push a los asistentes de tu evento para mantenerlos informados."
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuración */}
        <Card title="Configuración" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="flex items-center justify-between">
              <Text>Habilitar notificaciones</Text>
              <Switch
                checked={config.enabled}
                onChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <Input
              placeholder="Título de la notificación"
              value={config.title}
              onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
            />

            <Input.TextArea
              placeholder="Mensaje de la notificación"
              value={config.message}
              onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />

            <Select
              placeholder="Tipo de notificación"
              value={config.type}
              onChange={(value) => setConfig(prev => ({ ...prev, type: value }))}
              style={{ width: '100%' }}
            >
              <Option value="info">Información</Option>
              <Option value="success">‰xito</Option>
              <Option value="warning">Advertencia</Option>
              <Option value="error">Error</Option>
            </Select>

            <Select
              placeholder="Destinatarios"
              value={config.target}
              onChange={(value) => setConfig(prev => ({ ...prev, target: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">Todos los asistentes</Option>
              <Option value="attendees">Solo asistentes</Option>
              <Option value="organizers">Solo organizadores</Option>
            </Select>

            <Button type="primary" onClick={saveConfig} block>
              Guardar Configuración
            </Button>
          </Space>
        </Card>

        {/* Enviar notificación */}
        <Card title="Enviar Notificación" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Notificación de prueba"
              description="Esta notificación se enviará inmediatamente a todos los destinatarios configurados."
              type="warning"
              showIcon
            />

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendNotification}
              loading={isLoading}
              disabled={!config.enabled || !config.title || !config.message}
              block
            >
              Enviar Notificación
            </Button>

            <Text type="secondary" className="text-xs">
              Las notificaciones se envían a través del navegador y aplicaciones móviles.
            </Text>
          </Space>
        </Card>
      </div>

      {/* Historial de notificaciones */}
      <Card title="Historial de Notificaciones" size="small">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <BellOutlined className="text-2xl mb-2" />
              <p>No hay notificaciones enviadas</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Text strong>{notification.title}</Text>
                    <br />
                    <Text type="secondary">{notification.message}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {new Date(notification.sent_at).toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      notification.type === 'success' ? 'bg-green-100 text-green-800' :
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      notification.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default PushNotifications;


