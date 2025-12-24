import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Statistic, Alert, message, Tooltip } from '../../utils/antdComponents';
import { 
  DollarOutlined, 
  CreditCardOutlined, 
  CheckCircleOutlined, 
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import billingService from '../services/billingService';

const { Title, Text } = Typography;
const { Option } = Select;

const BillingDashboard = () => {
  const initialStats = {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    successRate: 0,
    failedSubscriptions: 0
  };

  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subscriptionsData, statsData] = await Promise.all([
        billingService.getSubscriptions(),
        billingService.getBillingStats()
      ]);
      setSubscriptions(subscriptionsData);
      setStats({ ...initialStats, ...(statsData || {}) });
    } catch (error) {
      message.error('Error al cargar datos de facturación');
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (values) => {
    try {
      await billingService.createSubscription(
        values.tenant_id,
        values.plan_type,
        values.customer_email
      );
      message.success('Suscripción creada exitosamente');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('Error al crear suscripción');
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    try {
      await billingService.cancelSubscription(subscriptionId);
      message.success('Suscripción cancelada exitosamente');
      loadData();
    } catch (error) {
      message.error('Error al cancelar suscripción');
    }
  };

  const handleResumeSubscription = async (subscriptionId) => {
    try {
      await billingService.resumeSubscription(subscriptionId);
      message.success('Suscripción reanudada exitosamente');
      loadData();
    } catch (error) {
      message.error('Error al reanudar suscripción');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'cancelled': return 'red';
      case 'payment_failed': return 'orange';
      case 'suspended': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'cancelled': return 'Cancelada';
      case 'payment_failed': return 'Pago Fallido';
      case 'suspended': return 'Suspendida';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Tenant',
      dataIndex: 'tenant_id',
      key: 'tenant_id',
      render: (tenantId, record) => (
        <Space>
          <Text strong>{record.tenants?.company_name || 'N/A'}</Text>
          <Text type="secondary">({record.customer_email})</Text>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (plan) => (
        <Tag color="blue">{plan?.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount}`,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Próximo Pago',
      dataIndex: 'next_billing_date',
      key: 'next_billing_date',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-”'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver Detalles">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => setSelectedSubscription(record)}
            />
          </Tooltip>
          {record.status === 'active' && (
            <Tooltip title="Cancelar Suscripción">
              <Button 
                icon={<StopOutlined />} 
                size="small"
                danger
                onClick={() => handleCancelSubscription(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'cancelled' && (
            <Tooltip title="Reanudar Suscripción">
              <Button 
                icon={<PlayCircleOutlined />} 
                size="small"
                onClick={() => handleResumeSubscription(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Title level={2}>
            <DollarOutlined style={{ marginRight: '8px' }} />
            Dashboard de Facturación
          </Title>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Suscripciones"
              value={stats.totalSubscriptions}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Suscripciones Activas"
              value={stats.activeSubscriptions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos Mensuales"
              value={`$${Number(stats.monthlyRevenue || 0).toLocaleString()}`}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tasa de ‰xito"
              value={Number(stats.successRate || 0)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alertas */}
      {Number(stats.failedSubscriptions) > 0 && (
        <Alert
          message={`${stats.failedSubscriptions} suscripciones con pagos fallidos`}
          description="Hay suscripciones que requieren atención inmediata."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Tabla de Suscripciones */}
      <Card
        title="Suscripciones"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadData}
            >
              Actualizar
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setModalVisible(true)}
            >
              Nueva Suscripción
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={subscriptions}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} suscripciones`
          }}
        />
      </Card>

      {/* Modal para crear suscripción */}
      <Modal
        title="Nueva Suscripción"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubscription}
        >
          <Form.Item
            name="tenant_id"
            label="Tenant"
            rules={[{ required: true, message: 'Seleccione un tenant' }]}
          >
            <Select placeholder="Seleccionar tenant">
              {/* Aquí se cargarían los tenants disponibles */}
            </Select>
          </Form.Item>

          <Form.Item
            name="plan_type"
            label="Plan"
            rules={[{ required: true, message: 'Seleccione un plan' }]}
          >
            <Select placeholder="Seleccionar plan">
              <Option value="basic">Básico - $29.99</Option>
              <Option value="pro">Profesional - $79.99</Option>
              <Option value="enterprise">Empresarial - $199.99</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="customer_email"
            label="Email del Cliente"
            rules={[
              { required: true, message: 'Email requerido' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input placeholder="cliente@empresa.com" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Crear Suscripción
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de detalles de suscripción */}
      <Modal
        title={`Detalles de Suscripción - ${selectedSubscription?.ticket_number}`}
        visible={!!selectedSubscription}
        onCancel={() => setSelectedSubscription(null)}
        footer={null}
        width={800}
      >
        {selectedSubscription && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Tenant:</Text>
                <br />
                <Text>{selectedSubscription.tenants?.company_name}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Plan:</Text>
                <br />
                <Tag color="blue">{selectedSubscription.plan_type?.toUpperCase()}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>Monto:</Text>
                <br />
                <Text>${selectedSubscription.amount}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Estado:</Text>
                <br />
                <Tag color={getStatusColor(selectedSubscription.status)}>
                  {getStatusText(selectedSubscription.status)}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>Próximo Pago:</Text>
                <br />
                <Text>
                  {selectedSubscription.next_billing_date
                    ? new Date(selectedSubscription.next_billing_date).toLocaleDateString()
                    : '-”'}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Pagos Realizados:</Text>
                <br />
                <Text>{selectedSubscription.payment_count || 0}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingDashboard;


