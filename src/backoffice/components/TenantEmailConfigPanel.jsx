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
  Modal,
  List,
  Tag
} from 'antd';
import {
  MailOutlined,
  SettingOutlined,
  ExperimentOutlined,
  SaveOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  TeamOutlined
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
  const [tenantConfig, setTenantConfig] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('custom');
  const [activeTab, setActiveTab] = useState('tenant');
  const [userRole, setUserRole] = useState('user');

  const diagnosticsStepLabels = {
    request: 'Solicitud inicial',
    'validate-config': 'Validación de datos',
    'prepare-connection': 'Preparando conexión',
    connect: 'Conexión al servidor SMTP',
    banner: 'Bienvenida del servidor',
    ehlo: 'Comando EHLO',
    'auth-login': 'Inicio de autenticación',
    'auth-user': 'Usuario SMTP',
    'auth-pass': 'Contraseña SMTP',
    'mail-from': 'Remitente (MAIL FROM)',
    'rcpt-to': 'Destinatario (RCPT TO)',
    'data-start': 'Inicio de DATA',
    'data-end': 'Contenido del mensaje',
    quit: 'Cierre de sesión',
    cleanup: 'Cierre de conexión'
  };

  const formatStepName = (step) => diagnosticsStepLabels[step] || step;

  const showDiagnosticsModal = (diagnostics, { success = false, title, message: modalMessage } = {}) => {
    if (!diagnostics) return;

    const steps = diagnostics.steps || [];
    const summary = diagnostics.summary;
    const modalType = success ? 'success' : 'error';
    const stepItems = steps.length > 0 ? steps : [];

    Modal[modalType]({
      title: title || (success ? 'Diagnóstico de la prueba SMTP' : 'Detalles del error SMTP'),
      width: 720,
      okText: 'Entendido',
      content: (
        <div className="space-y-4">
          {modalMessage && (
            <Alert
              type={success ? 'success' : 'error'}
              showIcon
              message={modalMessage}
            />
          )}

          {summary && (
            <Alert
              type={success ? 'success' : summary.category === 'desconocido' ? 'warning' : 'error'}
              showIcon
              message={summary.title}
              description={(
                <div className="space-y-1">
                  <Text>{summary.hint}</Text>
                  <div className="text-xs text-gray-500">
                    {summary.step && (
                      <span>
                        Paso: <strong>{formatStepName(summary.step)}</strong>
                      </span>
                    )}
                    {summary.code && (
                      <span className="ml-2">
                        Código: <strong>{summary.code}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            />
          )}

          <List
            bordered
            dataSource={stepItems}
            locale={{ emptyText: 'No hay información de diagnóstico disponible.' }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={(
                    <Space>
                      <Tag color={item.status === 'success' ? 'green' : item.status === 'warning' ? 'orange' : 'red'}>
                        {item.status ? item.status.toUpperCase() : 'INFO'}
                      </Tag>
                      <Text strong>{formatStepName(item.step)}</Text>
                    </Space>
                  )}
                  description={(
                    <div className="space-y-1">
                      {item.message && (
                        <Text>{item.message}</Text>
                      )}
                      {item.error && (
                        <Text type="danger">{item.error}</Text>
                      )}
                      <div className="text-xs text-gray-500 space-x-2">
                        {item.code && <span>Código: {item.code}</span>}
                        {item.host && <span>Host: {item.host}</span>}
                        {item.port && <span>Puerto: {item.port}</span>}
                        {typeof item.secure === 'boolean' && (
                          <span>SSL: {item.secure ? 'Sí' : 'No'}</span>
                        )}
                      </div>
                      {item.note && (
                        <Text type="secondary">{item.note}</Text>
                      )}
                    </div>
                  )}
                />
              </List.Item>
            )}
          />
        </div>
      )
    });
  };
  
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
      
      // Cargar configuración del tenant
      const tenantEmailConfig = await TenantEmailConfigService.getTenantEmailConfig();
      setTenantConfig(tenantEmailConfig);
      
      // Cargar configuración global
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
        // Guardar configuración del tenant
        await TenantEmailConfigService.saveTenantEmailConfig(values);
        message.success('Configuración de correo del tenant guardada exitosamente');
      } else {
        // Guardar configuración global
        await TenantEmailConfigService.saveGlobalEmailConfig(values);
        message.success('Configuración global de correo guardada exitosamente');
      }
      
      await loadConfigurations();
      
    } catch (error) {
      message.error(`Error guardando configuración: ${error.message}`);
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
      if (result?.diagnostics) {
        showDiagnosticsModal(result.diagnostics, {
          success: true,
          title: 'Resultado de la prueba SMTP',
          message: 'La configuración de correo respondió correctamente.'
        });
      }

    } catch (error) {
      message.error(`Error probando configuración: ${error.message}`);
      console.error(error);
      if (error?.diagnostics) {
        showDiagnosticsModal(error.diagnostics, {
          success: false,
          title: 'Error en la prueba SMTP',
          message: error.message
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const providers = TenantEmailConfigService.getCommonEmailProviders();

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Title level={2}>
            <MailOutlined className="mr-2" />
            Configuración de Correo
          </Title>
          <Text type="secondary">
            Configura el servidor SMTP para enviar correos desde tu empresa
          </Text>
        </div>

        {/* Información del tenant actual */}
        <Alert
          message="Configuración de Correo Electrónico"
          description="Configura las opciones de correo para reportes y notificaciones"
          type="info"
          showIcon
          className="mb-6"
        />

        {/* Tabs para configuración del tenant vs global */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="mb-6"
        >
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                Configuración del Tenant
                {tenantConfig && !tenantConfig.is_global && (
                  <Badge status="success" style={{ marginLeft: 8 }} />
                )}
              </span>
            } 
            key="tenant"
          >
            <Alert
              message="Configuración específica del tenant"
              description="Esta configuración solo se aplicará a tu empresa. Si no configuras nada aquí, se usará la configuración global del sistema."
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
                  Configuración Global
                  {globalConfig && (
                    <Badge status="processing" style={{ marginLeft: 8 }} />
                  )}
                </span>
              } 
              key="global"
            >
              <Alert
                message="Configuración global del sistema"
                description="Esta configuración se aplicará a todos los tenants que no tengan su propia configuración específica."
                type="warning"
                showIcon
                className="mb-6"
              />
            </TabPane>
          )}
        </Tabs>

        <Alert
          message="Información importante"
          description="Para usar Gmail, Outlook u otros proveedores, necesitarás generar contraseñas de aplicación o habilitar la autenticación de dos factores."
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
          {/* Selección de proveedor */}
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

          {/* Configuración SMTP */}
          <Title level={4}>
            <SecurityScanOutlined className="mr-2" />
            Configuración SMTP
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
              label="Contraseña"
              name="smtp_pass"
              rules={[{ required: true, message: 'Ingresa la contraseña SMTP' }]}
            >
              <Input.Password placeholder="Contraseña del correo" />
            </Form.Item>
          </div>

          <Form.Item
            label="Conexión Segura (SSL/TLS)"
            name="smtp_secure"
            valuePropName="checked"
            className="mb-6"
          >
            <Switch />
          </Form.Item>

          <Divider />

          {/* Configuración del remitente */}
          <Title level={4}>
            <MailOutlined className="mr-2" />
            Configuración del Remitente
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Form.Item
              label="Email de envío"
              name="from_email"
              rules={[
                { required: true, message: 'Ingresa el email de envío' },
                { type: 'email', message: 'Ingresa un email válido' }
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
            rules={[{ type: 'email', message: 'Ingresa un email válido' }]}
          >
            <Input placeholder="reportes@omegaboletos.com" />
          </Form.Item>

          <Form.Item
            label="Configuración activa"
            name="is_active"
            valuePropName="checked"
            className="mb-6"
          >
            <Switch />
          </Form.Item>

          {/* Botones de acción */}
          <div className="flex justify-between items-center">
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
              >
                Guardar Configuración
              </Button>
              
              <Button
                icon={<ExperimentOutlined />}
                onClick={handleTest}
                loading={testing}
              >
                Probar Configuración
              </Button>
            </Space>

            <div className="text-right">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {activeTab === 'tenant' ? 'Configuración específica del tenant' : 'Configuración global del sistema'}
              </Text>
            </div>
          </div>
        </Form>

        {/* Información adicional */}
        <Collapse className="mt-6">
          <Panel header="Información sobre configuración SMTP" key="1">
            <div className="space-y-4">
              <div>
                <Title level={5}>Configuración recomendada para Omega Boletos:</Title>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Servidor:</strong> mail.omegaboletos.com</li>
                  <li><strong>Puerto:</strong> 465 (SSL/TLS)</li>
                  <li><strong>Usuario:</strong> reportes@omegaboletos.com</li>
                  <li><strong>Contraseña:</strong> La contraseña de la cuenta de correo</li>
                  <li><strong>Conexión segura:</strong> Activada</li>
                </ul>
              </div>
              
              <div>
                <Title level={5}>Configuración para otros proveedores:</Title>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Gmail:</strong> smtp.gmail.com:587 (TLS) - Requiere contraseña de aplicación</li>
                  <li><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS) - Requiere autenticación de dos factores</li>
                  <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS) - Requiere contraseña de aplicación</li>
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
