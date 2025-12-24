import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Select, Typography, Space, message, Alert, Divider } from '../../../../utils/antdComponents';
import { MailOutlined, SyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const MailChimpIntegration = ({ eventId }) => {
  const [config, setConfig] = useState({
    enabled: false,
    apiKey: '',
    listId: '',
    audienceName: '',
    autoSubscribe: true,
    doubleOptIn: false,
    tags: [],
    mergeFields: []
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [audiences, setAudiences] = useState([]);
  const [mergeFields, setMergeFields] = useState([]);

  useEffect(() => {
    loadConfig();
  }, [eventId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('mailchimp_configs')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (data) {
        setConfig(data);
        setIsConnected(!!data.apiKey);
      }
    } catch (error) {
      console.error('Error loading MailChimp config:', error);
    }
  };

  const testConnection = async () => {
    if (!config.apiKey) {
      message.error('Ingresa tu API Key de MailChimp');
      return;
    }

    setIsTesting(true);
    try {
      // Test MailChimp API connection
      const response = await fetch('/api/mailchimp/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.apiKey
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success('Conexión exitosa con MailChimp');
        setIsConnected(true);
        setAudiences(result.audiences || []);
        setMergeFields(result.mergeFields || []);
      } else {
        message.error('Error de conexión: ' + result.error);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      message.error('Error al probar la conexión');
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from('mailchimp_configs')
        .upsert({
          event_id: eventId,
          enabled: config.enabled,
          api_key: config.apiKey,
          list_id: config.listId,
          audience_name: config.audienceName,
          auto_subscribe: config.autoSubscribe,
          double_opt_in: config.doubleOptIn,
          tags: config.tags,
          merge_fields: config.mergeFields,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      message.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('Error al guardar la configuración');
    }
  };

  const subscribeCustomer = async (customerData) => {
    if (!config.enabled || !config.apiKey || !config.listId) {
      return;
    }

    try {
      const response = await fetch('/api/mailchimp/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.apiKey,
          listId: config.listId,
          customerData,
          doubleOptIn: config.doubleOptIn,
          tags: config.tags
        })
      });

      const result = await response.json();

      if (result.success) {
      } else {
        console.error('Error subscribing customer:', result.error);
      }
    } catch (error) {
      console.error('Error subscribing customer:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Title level={3}>
        <MailOutlined className="mr-2" />
        Integración con MailChimp
      </Title>

      <Alert
        message="Recopila emails automáticamente"
        description="Cada vez que alguien compre entradas, se suscribirá automáticamente a tu lista de MailChimp."
        type="info"
        showIcon
        className="mb-4"
      />

      <Card title="Configuración de MailChimp">
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* API Key */}
          <div>
            <Text strong>API Key de MailChimp</Text>
            <Input.Password
              placeholder="Ingresa tu API Key de MailChimp"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              addonAfter={
                <Button
                  size="small"
                  icon={isTesting ? <SyncOutlined spin /> : <CheckCircleOutlined />}
                  onClick={testConnection}
                  disabled={!config.apiKey}
                >
                  {isTesting ? 'Probando...' : 'Probar'}
                </Button>
              }
            />
            <Text type="secondary" className="text-xs">
              Encuentra tu API Key en MailChimp †’ Account †’ Extras †’ API Keys
            </Text>
          </div>

          {/* Estado de conexión */}
          {isConnected && (
            <Alert
              message="Conectado a MailChimp"
              description="La integración está activa y funcionando correctamente."
              type="success"
              showIcon
            />
          )}

          {/* Lista de audiencia */}
          <div>
            <Text strong>Lista de Audiencia</Text>
            <Select
              placeholder="Selecciona una lista de audiencia"
              value={config.listId}
              onChange={(value) => setConfig(prev => ({ ...prev, listId: value }))}
              style={{ width: '100%' }}
              disabled={!isConnected}
            >
              {audiences.map(audience => (
                <Option key={audience.id} value={audience.id}>
                  {audience.name} ({audience.member_count} suscriptores)
                </Option>
              ))}
            </Select>
          </div>

          <Divider />

          {/* Configuraciones avanzadas */}
          <div>
            <Text strong>Configuraciones Avanzadas</Text>

            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Text>Suscripción automática</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Suscribir automáticamente a todos los compradores
                  </Text>
                </div>
                <Switch
                  checked={config.autoSubscribe}
                  onChange={(checked) => setConfig(prev => ({ ...prev, autoSubscribe: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Text>Doble opt-in</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Enviar email de confirmación antes de suscribir
                  </Text>
                </div>
                <Switch
                  checked={config.doubleOptIn}
                  onChange={(checked) => setConfig(prev => ({ ...prev, doubleOptIn: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Text>Habilitar integración</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Activar la integración para este evento
                  </Text>
                </div>
                <Switch
                  checked={config.enabled}
                  onChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Campos personalizados */}
          {mergeFields.length > 0 && (
            <div>
              <Text strong>Campos de MailChimp</Text>
              <div className="mt-2 space-y-2">
                {mergeFields.map(field => (
                  <div key={field.tag} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <Text>{field.name}</Text>
                    <Text type="secondary" className="text-xs">{field.tag}</Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Divider />

          {/* Estadísticas */}
          {isConnected && (
            <Card size="small" title="Estadísticas">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Text strong className="text-lg">0</Text>
                  <br />
                  <Text type="secondary" className="text-xs">Suscriptores este evento</Text>
                </div>
                <div className="text-center">
                  <Text strong className="text-lg">0</Text>
                  <br />
                  <Text type="secondary" className="text-xs">Total suscriptores</Text>
                </div>
              </div>
            </Card>
          )}

          <Button type="primary" onClick={saveConfig} block>
            Guardar Configuración
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default MailChimpIntegration;


