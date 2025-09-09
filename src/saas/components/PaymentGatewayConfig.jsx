import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, message, Alert, Space, Typography, Row, Col, Tabs, Badge, Table } from 'antd';
import { 
  CreditCardOutlined, 
  CheckCircleOutlined, 
  DollarOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import paymentGatewayService from '../services/paymentGatewayService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PaymentGatewayConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('stripe');
  const [gatewayConfigs, setGatewayConfigs] = useState({});
  const [paymentStats, setPaymentStats] = useState({});

  useEffect(() => {
    loadGatewayConfigs();
    loadPaymentStats();
  }, []);

  const loadGatewayConfigs = async () => {
    try {
      const configs = await paymentGatewayService.getAllGatewayConfigs();
      setGatewayConfigs(configs);
    } catch (error) {
      message.error('Error al cargar configuraciones de pasarelas');
    }
  };

  const loadPaymentStats = async () => {
    try {
      const stats = await paymentGatewayService.getPaymentStats();
      setPaymentStats(stats);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const handleSaveConfig = async (values) => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'stripe':
          await paymentGatewayService.configureStripe(values);
          break;
        case 'paypal':
          await paymentGatewayService.configurePayPal(values);
          break;
        default:
          throw new Error('Pasarela no soportada');
      }

      message.success(`${activeTab.toUpperCase()} configurado exitosamente`);
      form.resetFields();
      loadGatewayConfigs();
    } catch (error) {
      message.error(`Error al configurar ${activeTab.toUpperCase()}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGateway = async () => {
    try {
      setTesting(true);
      
      const testPayment = {
        gateway: activeTab,
        amount: 10.00,
        currency: 'USD',
        description: 'Test payment'
      };

      const result = await paymentGatewayService.processPayment(testPayment);
      
      if (result.success) {
        message.success(`Pago de prueba exitoso con ${activeTab.toUpperCase()}`);
      } else {
        message.error(`Pago de prueba falló con ${activeTab.toUpperCase()}`);
      }
    } catch (error) {
      message.error(`Error en prueba de ${activeTab.toUpperCase()}: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getGatewayIcon = (gateway) => {
    const icons = {
      stripe: '💳',
      paypal: '🅿️'
    };
    return icons[gateway] || '💳';
  };

  const getGatewayStatus = (gateway) => {
    const config = gatewayConfigs[gateway];
    if (!config) return { status: 'not_configured', color: 'default' };
    if (config.is_active) return { status: 'active', color: 'green' };
    return { status: 'inactive', color: 'orange' };
  };

  const renderStripeConfig = () => (
    <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            name="secret_key"
            label="Clave Secreta"
            rules={[{ required: true, message: 'Clave secreta requerida' }]}
          >
            <Input.Password placeholder="sk_test_..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="publishable_key"
            label="Clave Pública"
            rules={[{ required: true, message: 'Clave pública requerida' }]}
          >
            <Input placeholder="pk_test_..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="webhook_secret"
            label="Secreto del Webhook"
          >
            <Input.Password placeholder="whsec_..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="currency"
            label="Moneda"
            initialValue="USD"
          >
            <Select>
              <Option value="USD">USD - Dólar Americano</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="MXN">MXN - Peso Mexicano</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="test_mode" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Modo Prueba" unCheckedChildren="Modo Producción" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="is_active" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  const renderPayPalConfig = () => (
    <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            name="client_id"
            label="Client ID"
            rules={[{ required: true, message: 'Client ID requerido' }]}
          >
            <Input placeholder="Client ID de PayPal" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="client_secret"
            label="Client Secret"
            rules={[{ required: true, message: 'Client Secret requerido' }]}
          >
            <Input.Password placeholder="Client Secret de PayPal" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="webhook_id"
            label="Webhook ID"
          >
            <Input placeholder="ID del webhook" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="currency"
            label="Moneda"
            initialValue="USD"
          >
            <Select>
              <Option value="USD">USD - Dólar Americano</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="MXN">MXN - Peso Mexicano</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="sandbox_mode" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Modo Sandbox" unCheckedChildren="Modo Producción" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="is_active" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  // MercadoPago eliminado

  const renderGatewayStats = () => {
    const columns = [
      {
        title: 'Pasarela',
        dataIndex: 'gateway',
        key: 'gateway',
        render: (gateway) => (
          <Space>
            <span style={{ fontSize: '20px' }}>{getGatewayIcon(gateway)}</span>
            <Text strong>{gateway.toUpperCase()}</Text>
          </Space>
        ),
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const statusConfig = getGatewayStatus(status);
          return (
            <Badge 
              status={statusConfig.color} 
              text={statusConfig.status === 'active' ? 'Activo' : 
                    statusConfig.status === 'inactive' ? 'Inactivo' : 'No Configurado'} 
            />
          );
        },
      },
      {
        title: 'Total Pagos',
        dataIndex: 'total',
        key: 'total',
        render: (total) => total || 0,
      },
      {
        title: 'Exitosos',
        dataIndex: 'successful',
        key: 'successful',
        render: (successful) => (
          <Text type="success">{successful || 0}</Text>
        ),
      },
      {
        title: 'Fallidos',
        dataIndex: 'failed',
        key: 'failed',
        render: (failed) => (
          <Text type="danger">{failed || 0}</Text>
        ),
      },
      {
        title: 'Monto Total',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount) => `$${(amount || 0).toFixed(2)}`,
      },
    ];

    const data = Object.entries(paymentStats).map(([gateway, stats]) => ({
      key: gateway,
      gateway,
      status: gateway,
      ...stats
    }));

    return (
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Title level={2}>
            <CreditCardOutlined style={{ marginRight: '8px' }} />
            Configuración de Pasarelas de Pago
          </Title>
          <Text type="secondary">
            Configura las pasarelas de pago para procesar suscripciones automáticamente
          </Text>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Space>
                <span style={{ fontSize: '16px' }}>💳</span>
                <span>Stripe</span>
                <Badge 
                  status={getGatewayStatus('stripe').color} 
                  text={getGatewayStatus('stripe').status === 'active' ? 'Activo' : 'Inactivo'} 
                />
              </Space>
            } 
            key="stripe"
          >
            <Alert
              message="Configuración de Stripe"
              description="Stripe es una de las pasarelas de pago más populares y confiables. Soporta múltiples métodos de pago y monedas."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {renderStripeConfig()}
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <span style={{ fontSize: '16px' }}>🅿️</span>
                <span>PayPal</span>
                <Badge 
                  status={getGatewayStatus('paypal').color} 
                  text={getGatewayStatus('paypal').status === 'active' ? 'Activo' : 'Inactivo'} 
                />
              </Space>
            } 
            key="paypal"
          >
            <Alert
              message="Configuración de PayPal"
              description="PayPal es ideal para pagos internacionales y ofrece una experiencia de usuario familiar."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {renderPayPalConfig()}
          </TabPane>

          {/* Tab MercadoPago eliminado */}

          <TabPane 
            tab={
              <Space>
                <DollarOutlined />
                <span>Estadísticas</span>
              </Space>
            } 
            key="stats"
          >
            <Title level={4}>Estadísticas de Pagos por Pasarela</Title>
            {renderGatewayStats()}
          </TabPane>
        </Tabs>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button 
              icon={<SecurityScanOutlined />} 
              onClick={handleTestGateway}
              loading={testing}
            >
              Probar Pasarela
            </Button>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              onClick={() => form.submit()}
              loading={loading}
            >
              Guardar Configuración
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default PaymentGatewayConfig;
