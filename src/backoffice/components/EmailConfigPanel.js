import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Icon
} from 'antd';
import {
  MailOutlined,
  SettingOutlined,
  ExperimentOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { EmailConfigService } from '../services/emailConfigService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const EmailConfigPanel = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('custom');

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      const emailConfig = await EmailConfigService.getEmailConfig();
      if (emailConfig) {
        setConfig(emailConfig);
        form.setFieldsValue(emailConfig);
      }
    } catch (error) {
      message.error('Error cargando configuración de correo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    
    if (provider !== 'custom') {
      const providers = EmailConfigService.getCommonEmailProviders();
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
      
      // Validar configuración
      const validation = EmailConfigService.validateEmailConfig(values);
      if (!validation.isValid) {
        message.error(`Errores de validación: ${validation.errors.join(', ')}`);
        return;
      }

      // Guardar configuración
      await EmailConfigService.saveEmailConfig(values);
      message.success('Configuración de correo guardada correctamente');
      
      // Recargar configuración
      await loadEmailConfig();
      
    } catch (error) {
      message.error('Error guardando configuración de correo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      
      const result = await EmailConfigService.testEmailConfig(values);
      
      if (result.success) {
        message.success('Correo de prueba enviado correctamente');
      } else {
        message.error('Error enviando correo de prueba');
      }
      
    } catch (error) {
      if (error.errorFields) {
        message.error('Por favor, completa todos los campos requeridos');
      } else {
        message.error('Error enviando correo de prueba');
        console.error(error);
      }
    } finally {
      setTesting(false);
    }
  };

  const providers = EmailConfigService.getCommonEmailProviders();

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Title level={2}>
            <MailOutlined className="mr-2" />
            Configuración de Correo
          </Title>
          <Text type="secondary">
            Configura el servidor SMTP para enviar correos con tickets desde tu empresa
          </Text>
        </div>

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
            smtp_port: 587,
            smtp_secure: true
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
            Configuración del Servidor SMTP
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="smtp_host"
              label="Host SMTP"
              rules={[{ required: true, message: 'Host SMTP es requerido' }]}
            >
              <Input placeholder="smtp.gmail.com" />
            </Form.Item>

            <Form.Item
              name="smtp_port"
              label="Puerto SMTP"
              rules={[{ required: true, message: 'Puerto SMTP es requerido' }]}
            >
              <Input type="number" placeholder="587" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="smtp_user"
              label="Usuario SMTP"
              rules={[{ required: true, message: 'Usuario SMTP es requerido' }]}
            >
              <Input placeholder="tu-email@gmail.com" />
            </Form.Item>

            <Form.Item
              name="smtp_password"
              label="Contraseña SMTP"
              rules={[{ required: true, message: 'Contraseña SMTP es requerida' }]}
            >
              <Input.Password placeholder="Contraseña o contraseña de aplicación" />
            </Form.Item>
          </div>

          <Form.Item
            name="smtp_secure"
            label="Conexión segura (SSL/TLS)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          {/* Configuración del remitente */}
          <Title level={4}>
            <MailOutlined className="mr-2" />
            Configuración del Remitente
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="from_email"
              label="Email del remitente"
              rules={[
                { required: true, message: 'Email del remitente es requerido' },
                { type: 'email', message: 'Formato de email inválido' }
              ]}
            >
              <Input placeholder="ventas@tuempresa.com" />
            </Form.Item>

            <Form.Item
              name="from_name"
              label="Nombre del remitente"
              rules={[{ required: true, message: 'Nombre del remitente es requerido' }]}
            >
              <Input placeholder="Tu Empresa" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="reply_to_email"
              label="Email de respuesta (opcional)"
              rules={[
                { type: 'email', message: 'Formato de email inválido' }
              ]}
            >
              <Input placeholder="soporte@tuempresa.com" />
            </Form.Item>

            <Form.Item
              name="reply_to_name"
              label="Nombre de respuesta (opcional)"
            >
              <Input placeholder="Soporte" />
            </Form.Item>
          </div>

          <Divider />

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4">
            <Button
              type="default"
              icon={<ExperimentOutlined />}
              onClick={handleTest}
              loading={testing}
              size="large"
            >
              Probar Configuración
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Guardar Configuración
            </Button>
          </div>
        </Form>

        {/* Información adicional */}
        <Collapse className="mt-6">
          <Panel header="Información adicional y ayuda" key="1">
            <div className="space-y-4">
              <div>
                <Title level={5}>Gmail</Title>
                <Paragraph>
                  Para usar Gmail, necesitas:
                  <ol>
                    <li>Habilitar la verificación en dos pasos</li>
                    <li>Generar una contraseña de aplicación</li>
                    <li>Usar esa contraseña en lugar de tu contraseña normal</li>
                  </ol>
                </Paragraph>
              </div>

              <div>
                <Title level={5}>Outlook/Hotmail</Title>
                <Paragraph>
                  Para Outlook, necesitas:
                  <ol>
                    <li>Habilitar la autenticación de dos factores</li>
                    <li>Generar una contraseña de aplicación</li>
                    <li>Usar el host smtp-mail.outlook.com</li>
                  </ol>
                </Paragraph>
              </div>

              <div>
                <Title level={5}>Proveedor personalizado</Title>
                <Paragraph>
                  Si tienes tu propio servidor de correo:
                  <ol>
                    <li>Verifica el host y puerto con tu proveedor</li>
                    <li>Asegúrate de que el puerto esté abierto</li>
                    <li>Verifica si requiere SSL/TLS</li>
                  </ol>
                </Paragraph>
              </div>
            </div>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default EmailConfigPanel;
