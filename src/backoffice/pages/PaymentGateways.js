import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Switch, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Table, 
  Tag, 
  Space,
  Typography,
  Divider,
  Alert,
  Tooltip
} from 'antd';
import { 
  CreditCardOutlined, 
  BankOutlined, 
  MobileOutlined, 
  DollarOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PaymentGateways = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [configForm] = Form.useForm();
  const [showSecrets, setShowSecrets] = useState({});

  // Configuraciones por defecto para cada pasarela
  const defaultConfigs = {
    stripe: [
      { key: 'publishable_key', label: 'Clave Pública', required: true },
      { key: 'secret_key', label: 'Clave Secreta', required: true, secret: true },
      { key: 'webhook_secret', label: 'Webhook Secret', required: false, secret: true }
    ],
    paypal: [
      { key: 'client_id', label: 'Client ID', required: true },
      { key: 'client_secret', label: 'Client Secret', required: true, secret: true },
      { key: 'mode', label: 'Modo (sandbox/live)', required: true }
    ],
    transfer: [
      { key: 'bank_name', label: 'Nombre del Banco', required: true },
      { key: 'account_number', label: 'Número de Cuenta', required: true },
      { key: 'account_holder', label: 'Titular de la Cuenta', required: true },
      { key: 'routing_number', label: 'Número de Routing', required: false }
    ],
    mobile_payment: [
      { key: 'phone_number', label: 'Número de Teléfono', required: true },
      { key: 'provider', label: 'Proveedor (MP, etc.)', required: true },
      { key: 'account_name', label: 'Nombre de la Cuenta', required: true }
    ],
    zelle: [
      { key: 'email', label: 'Email de Zelle', required: true },
      { key: 'account_name', label: 'Nombre de la Cuenta', required: true }
    ],
    reservation: [
      { key: 'reservation_time', label: 'Tiempo de Reserva (minutos)', required: true },
      { key: 'max_reservation_amount', label: 'Monto Máximo de Reserva', required: true }
    ]
  };

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('name');

      if (error) throw error;
      setGateways(data || []);
    } catch (error) {
      console.error('Error loading gateways:', error);
      message.error('Error al cargar las pasarelas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGateway = async (gatewayId, isActive) => {
    try {
      const { error } = await supabase
        .from('payment_gateways')
        .update({ is_active: isActive })
        .eq('id', gatewayId);

      if (error) throw error;

      setGateways(prev => 
        prev.map(gateway => 
          gateway.id === gatewayId 
            ? { ...gateway, is_active: isActive }
            : gateway
        )
      );

      message.success(`${isActive ? 'Activada' : 'Desactivada'} correctamente`);
    } catch (error) {
      console.error('Error toggling gateway:', error);
      message.error('Error al cambiar el estado');
    }
  };

  const openConfigModal = async (gateway) => {
    setSelectedGateway(gateway);
    
    // Cargar configuración existente
    try {
      const { data: configs, error } = await supabase
        .from('payment_gateway_configs')
        .select('*')
        .eq('gateway_id', gateway.id);

      if (error) throw error;

      const configValues = {};
      configs.forEach(config => {
        configValues[config.key_name] = config.key_value;
      });

      configForm.setFieldsValue(configValues);
    } catch (error) {
      console.error('Error loading config:', error);
    }

    setConfigModalVisible(true);
  };

  const handleSaveConfig = async (values) => {
    try {
      const configs = defaultConfigs[selectedGateway.type];
      
      // Eliminar configuraciones anteriores
      await supabase
        .from('payment_gateway_configs')
        .delete()
        .eq('gateway_id', selectedGateway.id);

      // Insertar nuevas configuraciones
      const configData = configs.map(config => ({
        gateway_id: selectedGateway.id,
        key_name: config.key,
        key_value: values[config.key] || '',
        is_secret: config.secret || false
      }));

      const { error } = await supabase
        .from('payment_gateway_configs')
        .insert(configData);

      if (error) throw error;

      message.success('Configuración guardada correctamente');
      setConfigModalVisible(false);
      configForm.resetFields();
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('Error al guardar la configuración');
    }
  };

  const getGatewayIcon = (type) => {
    const icons = {
      stripe: <CreditCardOutlined style={{ color: '#6772e5' }} />,
      paypal: <DollarOutlined style={{ color: '#0070ba' }} />,
      transfer: <BankOutlined style={{ color: '#52c41a' }} />,
      mobile_payment: <MobileOutlined style={{ color: '#1890ff' }} />,
      zelle: <DollarOutlined style={{ color: '#6f42c1' }} />,
      reservation: <DollarOutlined style={{ color: '#fa8c16' }} />
    };
    return icons[type] || <CreditCardOutlined />;
  };

  const getGatewayDescription = (type) => {
    const descriptions = {
      stripe: 'Procesamiento de tarjetas de crédito y débito',
      paypal: 'Pagos a través de PayPal',
      transfer: 'Transferencias bancarias directas',
      mobile_payment: 'Pagos móviles (MercadoPago, etc.)',
      zelle: 'Transferencias Zelle',
      reservation: 'Reservas sin pago inmediato'
    };
    return descriptions[type] || '';
  };

  const columns = [
    {
      title: 'Pasarela',
      key: 'name',
      render: (_, record) => (
        <Space>
          {getGatewayIcon(record.type)}
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {getGatewayDescription(record.type)}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Estado',
      key: 'is_active',
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleToggleGateway(record.id, checked)}
          checkedChildren="Activa"
          unCheckedChildren="Inactiva"
        />
      )
    },
    {
      title: 'Configuración',
      key: 'config',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => openConfigModal(record)}
        >
          Configurar
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Pasarelas de Pago</Title>
        <Text type="secondary">
          Configura y gestiona las diferentes opciones de pago disponibles en tu tienda
        </Text>
      </div>

      <Alert
        message="Información Importante"
        description="Las pasarelas activadas aparecerán automáticamente en el carrito de compras y en la página de pago del store."
        type="info"
        showIcon
        className="mb-6"
      />

      <Card>
        <Table
          columns={columns}
          dataSource={gateways}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Modal de Configuración */}
      <Modal
        title={`Configurar ${selectedGateway?.name}`}
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          configForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedGateway && (
          <Form
            form={configForm}
            layout="vertical"
            onFinish={handleSaveConfig}
          >
            <Alert
              message="Configuración Segura"
              description="Los datos sensibles como claves secretas se almacenan de forma segura y encriptada."
              type="warning"
              showIcon
              className="mb-4"
            />

            {defaultConfigs[selectedGateway.type]?.map(config => (
              <Form.Item
                key={config.key}
                label={config.label}
                name={config.key}
                rules={[
                  {
                    required: config.required,
                    message: `Por favor ingresa ${config.label.toLowerCase()}`
                  }
                ]}
              >
                {config.secret ? (
                  <Input.Password
                    placeholder={`Ingresa ${config.label.toLowerCase()}`}
                    iconRender={(visible) => 
                      visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                    }
                  />
                ) : config.key === 'mode' ? (
                  <Input placeholder="sandbox o live" />
                ) : config.key === 'reservation_time' ? (
                  <Input placeholder="30" addonAfter="minutos" />
                ) : config.key === 'max_reservation_amount' ? (
                  <Input placeholder="100" addonAfter="USD" />
                ) : (
                  <Input placeholder={`Ingresa ${config.label.toLowerCase()}`} />
                )}
              </Form.Item>
            ))}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Guardar Configuración
                </Button>
                <Button onClick={() => {
                  setConfigModalVisible(false);
                  configForm.resetFields();
                }}>
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default PaymentGateways; 