import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, message, Space, Typography, Row, Col, Alert, Tag, Tooltip, Modal, InputNumber, Tabs, Table } from '../../utils/antdComponents';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, SettingOutlined, DollarOutlined, GlobalOutlined, CreditCardOutlined, SafetyCertificateOutlined, DatabaseOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const SaasSettings = () => {
  const [planLimits, setPlanLimits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();
  const [systemConfig, setSystemConfig] = useState({
    defaultPlan: 'basic',
    trialDays: 14,
    maxSubdomainLength: 50,
    enableSSL: true,
    enableAnalytics: true,
    enableBackups: true
  });

  useEffect(() => {
    loadPlanLimits();
    loadSystemConfig();
  }, []);

  const loadPlanLimits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .order('plan_type', { ascending: true });

      if (error) throw error;
      setPlanLimits(data || []);
    } catch (error) {
      console.error('Error loading plan limits:', error);
      message.error('Error al cargar l­mites de planes');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      // Simular carga de configuraci³n
      // const { data } = await supabase.from('system_config').select('*').single();
      // if (data) setSystemConfig(data);
    } catch (error) {
      console.error('Error loading system config:', error);
    }
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      plan_type: plan.plan_type,
      max_events: plan.max_events,
      max_users: plan.max_users,
      max_storage_gb: plan.max_storage_gb,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      features: plan.features || []
    });
    setModalVisible(true);
  };

  const handleSavePlan = async (values) => {
    try {
      if (editingPlan) {
        // Actualizar plan existente
        const { error } = await supabase
          .from('plan_limits')
          .update({
            ...values,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        message.success('Plan actualizado correctamente');
      } else {
        // Crear nuevo plan
        const { error } = await supabase
          .from('plan_limits')
          .insert([{
            ...values,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
        message.success('Plan creado correctamente');
      }

      setModalVisible(false);
      loadPlanLimits();
    } catch (error) {
      console.error('Error saving plan:', error);
      message.error('Error al guardar plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      const { error } = await supabase
        .from('plan_limits')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      message.success('Plan eliminado correctamente');
      loadPlanLimits();
    } catch (error) {
      console.error('Error deleting plan:', error);
      message.error('Error al eliminar plan');
    }
  };

  const handleSaveSystemConfig = async () => {
    try {
      // En un sistema real, esto guardar­a en una tabla de configuraci³n
      message.success('Configuraci³n del sistema guardada correctamente');
    } catch (error) {
      console.error('Error saving system config:', error);
      message.error('Error al guardar configuraci³n');
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'enterprise': return 'purple';
      case 'pro': return 'blue';
      case 'basic': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Plan',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (plan) => (
        <Tag color={getPlanColor(plan)}>
          {plan?.toUpperCase() || 'BASIC'}
        </Tag>
      ),
    },
    {
      title: 'Eventos M¡x.',
      dataIndex: 'max_events',
      key: 'max_events',
      render: (max) => max === -1 ? 'Sin l­mite' : max,
    },
    {
      title: 'Usuarios M¡x.',
      dataIndex: 'max_users',
      key: 'max_users',
      render: (max) => max === -1 ? 'Sin l­mite' : max,
    },
    {
      title: 'Almacenamiento (GB)',
      dataIndex: 'max_storage_gb',
      key: 'max_storage_gb',
      render: (max) => max === -1 ? 'Sin l­mite' : max,
    },
    {
      title: 'Precio Mensual',
      dataIndex: 'price_monthly',
      key: 'price_monthly',
      render: (price) => `$${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Precio Anual',
      dataIndex: 'price_yearly',
      key: 'price_yearly',
      render: (price) => `$${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditPlan(record)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '¿Eliminar plan?',
                  content: `¿Est¡s seguro de que quieres eliminar el plan ${record.plan_type}?`,
                  onOk: () => handleDeletePlan(record.id)
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Configuraci³n del Sistema SaaS
        </Title>
        <Text type="secondary">
          Gestiona planes, l­mites y configuraciones globales del sistema
        </Text>
      </div>

      {/* Alertas del sistema */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Alert
            message="Configuraci³n del Sistema"
            description="Estos cambios afectar¡n a todas las empresas en tu plataforma. Asegºrate de revisar cuidadosamente antes de guardar."
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
          />
        </Col>
      </Row>

      {/* Tabs de configuraci³n */}
      <Card>
        <Tabs defaultActiveKey="plans">
          <TabPane
            tab={
              <span>
                <CreditCardOutlined />
                Gesti³n de Planes
              </span>
            }
            key="plans"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddPlan}
              >
                Nuevo Plan
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={planLimits}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <GlobalOutlined />
                Configuraci³n General
              </span>
            }
            key="general"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Configuraci³n de Planes">
                  <Form layout="vertical">
                    <Form.Item label="Plan por Defecto">
                      <Select
                        value={systemConfig.defaultPlan}
                        onChange={(value) => setSystemConfig({ ...systemConfig, defaultPlan: value })}
                      >
                        <Option value="basic">Basic</Option>
                        <Option value="pro">Pro</Option>
                        <Option value="enterprise">Enterprise</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="D­as de Prueba Gratuita">
                      <InputNumber
                        value={systemConfig.trialDays}
                        onChange={(value) => setSystemConfig({ ...systemConfig, trialDays: value })}
                        min={0}
                        max={365}
                      />
                    </Form.Item>
                    <Form.Item label="Longitud M¡xima de Subdominio">
                      <InputNumber
                        value={systemConfig.maxSubdomainLength}
                        onChange={(value) => setSystemConfig({ ...systemConfig, maxSubdomainLength: value })}
                        min={3}
                        max={100}
                      />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Configuraci³n de Seguridad">
                  <Form layout="vertical">
                    <Form.Item label="Habilitar SSL Autom¡tico">
                      <Switch
                        checked={systemConfig.enableSSL}
                        onChange={(checked) => setSystemConfig({ ...systemConfig, enableSSL: checked })}
                      />
                    </Form.Item>
                    <Form.Item label="Habilitar Analytics">
                      <Switch
                        checked={systemConfig.enableAnalytics}
                        onChange={(checked) => setSystemConfig({ ...systemConfig, enableAnalytics: checked })}
                      />
                    </Form.Item>
                    <Form.Item label="Habilitar Backups Autom¡ticos">
                      <Switch
                        checked={systemConfig.enableBackups}
                        onChange={(checked) => setSystemConfig({ ...systemConfig, enableBackups: checked })}
                      />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveSystemConfig}
              >
                Guardar Configuraci³n
              </Button>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <DollarOutlined />
                Configuraci³n de Facturaci³n
              </span>
            }
            key="billing"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Configuraci³n de Stripe">
                  <Form layout="vertical">
                    <Form.Item label="Stripe Publishable Key">
                      <Input.Password placeholder="pk_test_..." />
                    </Form.Item>
                    <Form.Item label="Stripe Secret Key">
                      <Input.Password placeholder="sk_test_..." />
                    </Form.Item>
                    <Form.Item label="Webhook Secret">
                      <Input.Password placeholder="whsec_..." />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Configuraci³n de Facturaci³n">
                  <Form layout="vertical">
                    <Form.Item label="Moneda por Defecto">
                      <Select defaultValue="USD">
                        <Option value="USD">USD - D³lar Estadounidense</Option>
                        <Option value="EUR">EUR - Euro</Option>
                        <Option value="COP">COP - Peso Colombiano</Option>
                        <Option value="MXN">MXN - Peso Mexicano</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Impuestos (%)">
                      <InputNumber
                        defaultValue={0}
                        min={0}
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                      />
                    </Form.Item>
                    <Form.Item label="D­as de Gracia">
                      <InputNumber
                        defaultValue={7}
                        min={0}
                        max={30}
                      />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button type="primary" icon={<SaveOutlined />}>
                Guardar Configuraci³n de Facturaci³n
              </Button>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                Configuraci³n de Base de Datos
              </span>
            }
            key="database"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="L­mites de Base de Datos">
                  <Form layout="vertical">
                    <Form.Item label="L­mite de Conexiones por Tenant">
                      <InputNumber
                        defaultValue={10}
                        min={1}
                        max={100}
                      />
                    </Form.Item>
                    <Form.Item label="Tiempo de Timeout (segundos)">
                      <InputNumber
                        defaultValue={30}
                        min={5}
                        max={300}
                      />
                    </Form.Item>
                    <Form.Item label="Habilitar Pool de Conexiones">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Configuraci³n de Backup">
                  <Form layout="vertical">
                    <Form.Item label="Frecuencia de Backup">
                      <Select defaultValue="daily">
                        <Option value="hourly">Cada hora</Option>
                        <Option value="daily">Diario</Option>
                        <Option value="weekly">Semanal</Option>
                        <Option value="monthly">Mensual</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Retenci³n de Backups (d­as)">
                      <InputNumber
                        defaultValue={30}
                        min={1}
                        max={365}
                      />
                    </Form.Item>
                    <Form.Item label="Comprimir Backups">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button type="primary" icon={<SaveOutlined />}>
                Guardar Configuraci³n de Base de Datos
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal para crear/editar plan */}
      <Modal
        title={editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSavePlan}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plan_type"
                label="Tipo de Plan"
                rules={[{ required: true, message: 'El tipo de plan es requerido' }]}
              >
                <Select placeholder="Seleccionar plan">
                  <Option value="basic">Basic</Option>
                  <Option value="pro">Pro</Option>
                  <Option value="enterprise">Enterprise</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_events"
                label="M¡ximo de Eventos"
                rules={[{ required: true, message: 'El l­mite de eventos es requerido' }]}
              >
                <InputNumber
                  placeholder="5"
                  min={-1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="max_users"
                label="M¡ximo de Usuarios"
                rules={[{ required: true, message: 'El l­mite de usuarios es requerido' }]}
              >
                <InputNumber
                  placeholder="100"
                  min={-1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_storage_gb"
                label="Almacenamiento (GB)"
                rules={[{ required: true, message: 'El l­mite de almacenamiento es requerido' }]}
              >
                <InputNumber
                  placeholder="10"
                  min={-1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price_monthly"
                label="Precio Mensual ($)"
                rules={[{ required: true, message: 'El precio mensual es requerido' }]}
              >
                <InputNumber
                  placeholder="29.99"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price_yearly"
                label="Precio Anual ($)"
                rules={[{ required: true, message: 'El precio anual es requerido' }]}
              >
                <InputNumber
                  placeholder="299.99"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPlan ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SaasSettings;


