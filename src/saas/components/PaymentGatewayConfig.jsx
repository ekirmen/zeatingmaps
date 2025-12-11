import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, message, Alert, Space, Typography, Row, Col, Tabs, Badge, Table, Spin } from '../../utils/antdComponents';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  SecurityScanOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import paymentGatewayService from '../services/paymentGatewayService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PaymentGatewayConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingConnection, setTestingConnection] = useState({});
  const [activeTab, setActiveTab] = useState('stripe');
  const [gatewayConfigs, setGatewayConfigs] = useState({});
  const [paymentStats, setPaymentStats] = useState({});
  const [currentTenant, setCurrentTenant] = useState(null);

  useEffect(() => {
    loadCurrentTenant();
    loadGatewayConfigs();
    loadPaymentStats();
  }, []);

  
      if (tenantData) {
        const tenant = JSON.parse(tenantData);
        setCurrentTenant(tenant);
      }
    } catch (error) {
    }
  };

  const loadGatewayConfigs = async () => {
    try {
      const configs = await paymentGatewayService.getAllGatewayConfigs();
      setGatewayConfigs(configs);

      // Cargar valores iniciales del formulario si hay configuraci³n existente
      if (configs[activeTab]) {
        const configData = configs[activeTab];
        // El config puede venir como objeto o como string parseado
        const config = typeof configData.config === 'object'
          ? configData.config
          : (typeof configData.config === 'string' ? JSON.parse(configData.config) : {});

        form.setFieldsValue({
          ...config,
          is_active: configData.is_active
        });
      } else {
        // Si no hay configuraci³n, resetear el formulario
        form.resetFields();
      }
    } catch (error) {
      console.error('Error loading gateway configs:', error);
      message.error('Error al cargar configuraciones de pasarelas');
    }
  };

  
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

  const handleTestConnection = async () => {
    try {
      setTestingConnection(prev => ({ ...prev, [activeTab]: true }));

      const formValues = form.getFieldsValue();
      const tenant_id = 'current-tenant'; // En un caso real, obtener del contexto de usuario

      const endpoint = activeTab === 'stripe'
        ? '/api/test-stripe-connection'
        : '/api/test-paypal-connection';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: formValues,
          tenant_id
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success(`œ… Conexi³n exitosa con ${activeTab.toUpperCase()}: ${result.message}`);
      } else {
        message.error(`Œ Error de conexi³n con ${activeTab.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      message.error(`Error al probar conexi³n con ${activeTab.toUpperCase()}: ${error.message}`);
    } finally {
      setTestingConnection(prev => ({ ...prev, [activeTab]: false }));
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
        message.error(`Pago de prueba fall³ con ${activeTab.toUpperCase()}`);
      }
    } catch (error) {
      message.error(`Error en prueba de ${activeTab.toUpperCase()}: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getGatewayIcon = (gateway) => {
    const icons = {
      stripe: 'ðŸ’³',
      paypal: 'ðŸ…¿ï¸'

    return icons[gateway] || 'ðŸ’³';
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
            label="Clave Pºblica"
            rules={[{ required: true, message: 'Clave pºblica requerida' }]}
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
              <Option value="USD">USD - D³lar Americano</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="MXN">MXN - Peso Mexicano</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="test_mode" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Modo Prueba" unCheckedChildren="Modo Producci³n" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="is_active" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Space>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleTestConnection}
              loading={testingConnection.stripe}
              disabled={!form.getFieldValue('secret_key') || !form.getFieldValue('publishable_key')}
            >
              Probar Conexi³n
            </Button>
            <Text type="secondary">
              Verifica que las credenciales sean correctas antes de guardar
            </Text>
          </Space>
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
              <Option value="USD">USD - D³lar Americano</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="MXN">MXN - Peso Mexicano</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="sandbox_mode" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Modo Sandbox" unCheckedChildren="Modo Producci³n" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="is_active" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Space>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleTestConnection}
              loading={testingConnection.paypal}
              disabled={!form.getFieldValue('client_id') || !form.getFieldValue('client_secret')}
            >
              Probar Conexi³n
            </Button>
            <Text type="secondary">
              Verifica que las credenciales sean correctas antes de guardar
            </Text>
          </Space>
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
            Configuraci³n de Pasarelas de Pago
          </Title>
          <Text type="secondary">
            Configura las pasarelas de pago para procesar suscripciones autom¡ticamente
          </Text>
          {currentTenant && (
            <div style={{ marginTop: '8px' }}>
              <Badge
                status="processing"
                text={
                  <Space>
                    <UserOutlined />
                    <Text strong>Configuraci³n para:</Text>
                    <Text code>{currentTenant.nombre || currentTenant.name || 'Tenant Actual'}</Text>
                  </Space>
                }
              />
            </div>
          )}
        </Col>
      </Row>

      {currentTenant && (
        <Alert
          message="Configuraci³n por Tenant"
          description={`Las claves de pago que configures aqu­ ser¡n espec­ficas para ${currentTenant.nombre || currentTenant.name || 'este tenant'}. Cada tenant tiene sus propias credenciales de Stripe, PayPal, etc.`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            // Cargar valores del formulario cuando cambia la pesta±a
            if (gatewayConfigs[key]) {
              const configData = gatewayConfigs[key];
              // El config puede venir como objeto o como string parseado
              const config = typeof configData.config === 'object'
                ? configData.config
                : (typeof configData.config === 'string' ? JSON.parse(configData.config) : {});

              form.setFieldsValue({
                ...config,
                is_active: configData.is_active
              });
            } else {
              form.resetFields();
            }
          }}
        >
          <TabPane
            tab={
              <Space>
                <span style={{ fontSize: '16px' }}>ðŸ’³</span>
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
              message="Configuraci³n de Stripe"
              description="Stripe es una de las pasarelas de pago m¡s populares y confiables. Soporta mºltiples m©todos de pago y monedas."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {renderStripeConfig()}
          </TabPane>

          <TabPane
            tab={
              <Space>
                <span style={{ fontSize: '16px' }}>ðŸ…¿ï¸</span>
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
              message="Configuraci³n de PayPal"
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
                <span>Estad­sticas</span>
              </Space>
            }
            key="stats"
          >
            <Title level={4}>Estad­sticas de Pagos por Pasarela</Title>
            {renderGatewayStats()}
          </TabPane>
        </Tabs>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleTestConnection}
              loading={testingConnection[activeTab]}
              disabled={activeTab === 'stats'}
            >
              Probar Conexi³n
            </Button>
            <Button
              icon={<SecurityScanOutlined />}
              onClick={handleTestGateway}
              loading={testing}
              disabled={activeTab === 'stats'}
            >
              Probar Pago
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => form.submit()}
              loading={loading}
              disabled={activeTab === 'stats'}
            >
              Guardar Configuraci³n
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default PaymentGatewayConfig;


