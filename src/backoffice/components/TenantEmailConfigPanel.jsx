import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Alert,
  Divider,
  Space,
  Typography,
  Collapse,
  Tabs,
  Badge,
  List
} from '../../utils/antdComponents';
import {
  MailOutlined,
  SettingOutlined,
  ExperimentOutlined,
  SaveOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  TeamOutlined,
  SendOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { TenantEmailConfigService } from '../services/tenantEmailConfigService';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const TenantEmailConfigPanel = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingInbound, setSendingInbound] = useState(false);
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [tenantConfig, setTenantConfig] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('custom');
  const [activeTab, setActiveTab] = useState('tenant');
  const [userRole, setUserRole] = useState('user');

  // const { currentTenant } = useTenant();

  const loadUserRole = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || 'user');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }, []);

  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar configuraci³n del tenant
      const tenantEmailConfig = await TenantEmailConfigService.getTenantEmailConfig();
      setTenantConfig(tenantEmailConfig);
      
      // Cargar configuraci³n global
      const globalEmailConfig = await TenantEmailConfigService.getGlobalEmailConfig();
      setGlobalConfig(globalEmailConfig);
      
      // Establecer valores del formulario
      if (tenantEmailConfig && !tenantEmailConfig.is_global) {
        form.setFieldsValue(tenantEmailConfig);
        setActiveTab('tenant');
      } else {
        form.setFieldsValue(globalEmailConfig);
        setActiveTab('global');
      }
      
    } catch (error) {
      message.error('Error cargando configuraciones de correo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfigurations();
    loadUserRole();
  }, [loadConfigurations, loadUserRole]);

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    
    if (provider !== 'custom') {
      const providers = TenantEmailConfigService.getCommonEmailProviders();
      const selected = providers.find(p => p.name === provider);
      
      if (selected) {
        form.setFieldsValue({
          smtp_host: selected.host,
          smtp_port: selected.port,
          smtp_secure: selected.secure
        });
      }
    }
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      if (activeTab === 'tenant') {
        // Guardar configuraci³n del tenant
        await TenantEmailConfigService.saveTenantEmailConfig(values);
        message.success('Configuraci³n de correo del tenant guardada exitosamente');
      } else {
        // Guardar configuraci³n global
        await TenantEmailConfigService.saveGlobalEmailConfig(values);
        message.success('Configuraci³n global de correo guardada exitosamente');
      }
      
      await loadConfigurations();
      
    } catch (error) {
      message.error(`Error guardando configuraci³n: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const values = await form.validateFields();

      const result = await TenantEmailConfigService.testEmailConfig(values);

      message.success('¡Correo de prueba enviado exitosamente!');

    } catch (error) {
      message.error(`Error probando configuraci³n: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleInboundTest = async () => {
    try {
      setSendingInbound(true);
      const values = await form.validateFields();

      const result = await TenantEmailConfigService.sendInboundTestEmail(values);

      message.success('Correo de prueba enviado a email@omegaboletos.com');

    } catch (error) {
      if (error?.message) {
        message.error(`Error enviando la prueba: ${error.message}`);
      }
    } finally {
      setSendingInbound(false);
    }
  };

  const handleSendWelcome = async () => {
    try {
      setSendingWelcome(true);
      const values = await form.validateFields();
      const welcomeEmail = form.getFieldValue('welcome_target_email');

      if (!welcomeEmail) {
        message.warning('Ingresa el correo al que deseas enviar la bienvenida.');
        return;
      }

      await form.validateFields(['welcome_target_email']);

      const result = await TenantEmailConfigService.sendWelcomeEmail(values, welcomeEmail);

      message.success(`Correo de bienvenida enviado a ${welcomeEmail}`);

    } catch (error) {
      if (error?.message) {
        message.error(`Error enviando la bienvenida: ${error.message}`);
      }
    } finally {
      setSendingWelcome(false);
    }
  };

  const providers = TenantEmailConfigService.getCommonEmailProviders();

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Title level={2}>
            <MailOutlined className="mr-2" />
            Configuraci³n de Correo
          </Title>
          <Text type="secondary">
            Configura el servidor SMTP para enviar correos desde tu empresa
          </Text>
        </div>

        {/* Informaci³n del tenant actual */}
        <Alert
          message="Configuraci³n de Correo Electr³nico"
          description="Configura las opciones de correo para reportes y notificaciones"
          type="info"
          showIcon
          className="mb-6"
        />

        {/* Tabs para configuraci³n del tenant vs global */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="mb-6"
        >
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                Configuraci³n del Tenant
                {tenantConfig && !tenantConfig.is_global && (
                  <Badge status="success" style={{ marginLeft: 8 }} />
                )}
              </span>
            } 
            key="tenant"
          >
            <Alert
              message="Configuraci³n espec­fica del tenant"
              description="Esta configuraci³n solo se aplicar¡ a tu empresa. Si no configuras nada aqu­, se usar¡ la configuraci³n global del sistema."
              type="info"
              showIcon
              className="mb-6"
            />
          </TabPane>
          
          {userRole === 'super_admin' && (
            <TabPane 
              tab={
                <span>
                  <GlobalOutlined />
                  Configuraci³n Global
                  {globalConfig && (
                    <Badge status="processing" style={{ marginLeft: 8 }} />
                  )}
                </span>
              } 
              key="global"
            >
              <Alert
                message="Configuraci³n global del sistema"
                description="Esta configuraci³n se aplicar¡ a todos los tenants que no tengan su propia configuraci³n espec­fica."
                type="warning"
                showIcon
                className="mb-6"
              />
            </TabPane>
          )}
        </Tabs>

        <Alert
          message="Informaci³n importante"
          description="Para usar Gmail, Outlook u otros proveedores, necesitar¡s generar contrase±as de aplicaci³n o habilitar la autenticaci³n de dos factores."
          type="info"
          showIcon
          className="mb-6"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            smtp_port: 465,
            smtp_secure: true,
            provider: 'smtp'
          }}
        >
          {/* Selecci³n de proveedor */}
          <Card size="small" className="mb-6">
            <Title level={4}>
              <SettingOutlined className="mr-2" />
              Proveedor de Correo
            </Title>
            
            <Select
              value={selectedProvider}
              onChange={handleProviderChange}
              style={{ width: '100%' }}
              placeholder="Selecciona un proveedor"
            >
              {providers.map(provider => (
                <Option key={provider.name} value={provider.name}>
                  <Space>
                    <span>{provider.name}</span>
                    {provider.notes && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({provider.notes})
                      </Text>
                    )}
                  </Space>
                </Option>
              ))}
            </Select>
          </Card>

          <Divider />

          {/* Configuraci³n SMTP */}
          <Title level={4}>
            <SecurityScanOutlined className="mr-2" />
            Configuraci³n SMTP
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Form.Item
              label="Servidor SMTP"
              name="smtp_host"
              rules={[{ required: true, message: 'Ingresa el servidor SMTP' }]}
            >
              <Input placeholder="mail.omegaboletos.com" />
            </Form.Item>

            <Form.Item
              label="Puerto"
              name="smtp_port"
              rules={[{ required: true, message: 'Ingresa el puerto SMTP' }]}
            >
              <Input type="number" placeholder="465" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Form.Item
              label="Usuario"
              name="smtp_user"
              rules={[{ required: true, message: 'Ingresa el usuario SMTP' }]}
            >
              <Input placeholder="reportes@omegaboletos.com" />
            </Form.Item>

            <Form.Item
              label="Contrase±a"
              name="smtp_pass"
              rules={[{ required: true, message: 'Ingresa la contrase±a SMTP' }]}
            >
              <Input.Password placeholder="Contrase±a del correo" />
            </Form.Item>
          </div>

          <Form.Item
            label="Conexi³n Segura (SSL/TLS)"
            name="smtp_secure"
            valuePropName="checked"
            className="mb-6"
          >
            <Switch />
          </Form.Item>

          <Divider />

          {/* Configuraci³n del remitente */}
          <Title level={4}>
            <MailOutlined className="mr-2" />
            Configuraci³n del Remitente
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Form.Item
              label="Email de env­o"
              name="from_email"
              rules={[
                { required: true, message: 'Ingresa el email de env­o' },
                { type: 'email', message: 'Ingresa un email v¡lido' }
              ]}
            >
              <Input placeholder="reportes@omegaboletos.com" />
            </Form.Item>

            <Form.Item
              label="Nombre del remitente"
              name="from_name"
              rules={[{ required: true, message: 'Ingresa el nombre del remitente' }]}
            >
              <Input placeholder="Omega Boletos" />
            </Form.Item>
          </div>

          <Form.Item
            label="Email de respuesta"
            name="reply_to"
            rules={[{ type: 'email', message: 'Ingresa un email v¡lido' }]}
          >
            <Input placeholder="reportes@omegaboletos.com" />
          </Form.Item>

          <Form.Item
            label="Configuraci³n activa"
            name="is_active"
            valuePropName="checked"
            className="mb-6"
          >
            <Switch />
          </Form.Item>

          {/* Botones de acci³n */}
          <div className="space-y-6">
            {/* Botones principales - Responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap w-full sm:w-auto">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className="w-full sm:w-auto"
                >
                  Guardar Configuraci³n
                </Button>

                <Button
                  icon={<ExperimentOutlined />}
                  onClick={handleTest}
                  loading={testing}
                  size="large"
                  className="w-full sm:w-auto"
                >
                  Probar Configuraci³n
                </Button>
              </div>

              <div className="text-left sm:text-right">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {activeTab === 'tenant' ? 'Configuraci³n espec­fica del tenant' : 'Configuraci³n global del sistema'}
                </Text>
              </div>
            </div>

            <Divider className="my-0" />

            <div>
              <Title level={4}>
                <ExperimentOutlined className="mr-2" />
                Pruebas r¡pidas de correo
              </Title>
              <Text type="secondary" className="block mb-4">
                Env­a correos de prueba espec­ficos para validar la recepci³n interna y los mensajes de bienvenida.
              </Text>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  icon={<InboxOutlined />}
                  onClick={handleInboundTest}
                  loading={sendingInbound}
                  block
                  size="large"
                >
                  Enviar prueba a email@omegaboletos.com
                </Button>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Form.Item
                    name="welcome_target_email"
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[{ type: 'email', message: 'Ingresa un email v¡lido' }]}
                  >
                    <Input 
                      placeholder="correo@ejemplo.com" 
                      size="large"
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendWelcome}
                    loading={sendingWelcome}
                    size="large"
                    className="sm:flex-shrink-0"
                  >
                    Enviar correo de bienvenida
                  </Button>
                </div>
              </Space>
            </div>
          </div>
        </Form>

        {/* Informaci³n adicional */}
        <Collapse className="mt-6">
          <Panel header="Informaci³n sobre configuraci³n SMTP" key="1">
            <div className="space-y-4">
              <div>
                <Title level={5}>Configuraci³n recomendada para Omega Boletos:</Title>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Servidor:</strong> mail.omegaboletos.com</li>
                  <li><strong>Puerto:</strong> 465 (SSL/TLS)</li>
                  <li><strong>Usuario:</strong> reportes@omegaboletos.com</li>
                  <li><strong>Contrase±a:</strong> La contrase±a de la cuenta de correo</li>
                  <li><strong>Conexi³n segura:</strong> Activada</li>
                </ul>
              </div>
              
              <div>
                <Title level={5}>Configuraci³n para otros proveedores:</Title>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Gmail:</strong> smtp.gmail.com:587 (TLS) - Requiere contrase±a de aplicaci³n</li>
                  <li><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS) - Requiere autenticaci³n de dos factores</li>
                  <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS) - Requiere contrase±a de aplicaci³n</li>
                </ul>
              </div>
            </div>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default TenantEmailConfigPanel;


