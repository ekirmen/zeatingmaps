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
} from '../../utils/antdComponents';
import {
  MailOutlined,
  SettingOutlined,
  TestOutlined,
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
      message.error('Error cargando configuraci³n de correo');
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
      
      // Validar configuraci³n
      const validation = EmailConfigService.validateEmailConfig(values);
      if (!validation.isValid) {
        message.error(`Errores de validaci³n: ${validation.errors.join(', ')}`);
        return;
      }

      // Guardar configuraci³n
      await EmailConfigService.saveEmailConfig(values);
      message.success('Configuraci³n de correo guardada correctamente');
      
      // Recargar configuraci³n
      await loadEmailConfig();
      
    } catch (error) {
      message.error('Error guardando configuraci³n de correo');
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
            Configuraci³n de Correo
          </Title>
          <Text type="secondary">
            Configura el servidor SMTP para enviar correos con tickets desde tu empresa
          </Text>
        </div>

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
            smtp_port: 587,
            smtp_secure: true
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
            Configuraci³n del Servidor SMTP
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
              label="Contrase±a SMTP"
              rules={[{ required: true, message: 'Contrase±a SMTP es requerida' }]}
            >
              <Input.Password placeholder="Contrase±a o contrase±a de aplicaci³n" />
            </Form.Item>
          </div>

          <Form.Item
            name="smtp_secure"
            label="Conexi³n segura (SSL/TLS)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          {/* Configuraci³n del remitente */}
          <Title level={4}>
            <MailOutlined className="mr-2" />
            Configuraci³n del Remitente
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="from_email"
              label="Email del remitente"
              rules={[
                { required: true, message: 'Email del remitente es requerido' },
                { type: 'email', message: 'Formato de email inv¡lido' }
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
                { type: 'email', message: 'Formato de email inv¡lido' }
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

          {/* Botones de acci³n */}
          <div className="flex justify-end space-x-4">
            <Button
              type="default"
              icon={<TestOutlined />}
              onClick={handleTest}
              loading={testing}
              size="large"
            >
              Probar Configuraci³n
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Guardar Configuraci³n
            </Button>
          </div>
        </Form>

        {/* Informaci³n adicional */}
        <Collapse className="mt-6">
          <Panel header="Informaci³n adicional y ayuda" key="1">
            <div className="space-y-4">
              <div>
                <Title level={5}>Gmail</Title>
                <Paragraph>
                  Para usar Gmail, necesitas:
                  <ol>
                    <li>Habilitar la verificaci³n en dos pasos</li>
                    <li>Generar una contrase±a de aplicaci³n</li>
                    <li>Usar esa contrase±a en lugar de tu contrase±a normal</li>
                  </ol>
                </Paragraph>
              </div>

              <div>
                <Title level={5}>Outlook/Hotmail</Title>
                <Paragraph>
                  Para Outlook, necesitas:
                  <ol>
                    <li>Habilitar la autenticaci³n de dos factores</li>
                    <li>Generar una contrase±a de aplicaci³n</li>
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
                    <li>Asegºrate de que el puerto est© abierto</li>
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


