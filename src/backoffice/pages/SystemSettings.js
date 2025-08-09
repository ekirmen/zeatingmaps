import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Switch, 
  Input, 
  Button, 
  Select, 
  Typography, 
  Space,
  Alert,
  Divider,
  List,
  Tag,
  Modal,
  message,
  Spin
} from 'antd';
import { 
  SettingOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: 30,
      includeFiles: true
    },
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordPolicy: 'strong'
    },
    performance: {
      cacheEnabled: true,
      compression: true,
      cdn: false
    }
  });
  const [backupHistory, setBackupHistory] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSettings();
    loadBackupHistory();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Cargar configuraciones desde Supabase
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(JSON.parse(data.settings || '{}'));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackupHistory = async () => {
    try {
      // Simular historial de backups
      const history = [
        {
          id: 1,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          type: 'automated',
          status: 'completed',
          size: '2.5 MB',
          duration: '45s'
        },
        {
          id: 2,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          type: 'manual',
          status: 'completed',
          size: '2.3 MB',
          duration: '42s'
        },
        {
          id: 3,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          type: 'automated',
          status: 'failed',
          size: '0 MB',
          duration: '0s'
        }
      ];
      setBackupHistory(history);
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  };

  const saveSettings = async (values) => {
    try {
      setLoading(true);
      
      const updatedSettings = {
        ...settings,
        ...values
      };

      // Guardar en Supabase
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          settings: JSON.stringify(updatedSettings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(updatedSettings);
      message.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (values) => {
    try {
      setLoading(true);
      
      // Simular creación de backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup = {
        id: Date.now(),
        date: new Date(),
        type: 'manual',
        status: 'completed',
        size: '2.4 MB',
        duration: '38s',
        description: values.description
      };

      setBackupHistory(prev => [newBackup, ...prev]);
      message.success('Backup creado correctamente');
      setShowBackupModal(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating backup:', error);
      message.error('Error al crear el backup');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      setLoading(true);
      
      // Simular restauración
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Backup restaurado correctamente');
    } catch (error) {
      console.error('Error restoring backup:', error);
      message.error('Error al restaurar el backup');
    } finally {
      setLoading(false);
    }
  };

  const getBackupStatusColor = (status) => {
    const colors = {
      completed: 'green',
      failed: 'red',
      in_progress: 'orange'
    };
    return colors[status] || 'blue';
  };

  const getBackupTypeIcon = (type) => {
    return type === 'automated' ? <ReloadOutlined /> : <UploadOutlined />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>Configuración del Sistema</Title>
        <Text type="secondary">Gestiona la configuración general del sistema</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        initialValues={settings}
      >
        {/* Configuración de Backup */}
        <Card title="Configuración de Backup" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name={['backup', 'enabled']}
                label="Backup Automático"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={['backup', 'frequency']}
                label="Frecuencia"
              >
                <Select>
                  <Option value="hourly">Cada hora</Option>
                  <Option value="daily">Diario</Option>
                  <Option value="weekly">Semanal</Option>
                  <Option value="monthly">Mensual</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={['backup', 'retention']}
                label="Retención (días)"
              >
                <Input type="number" min={1} max={365} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={['backup', 'includeFiles']}
                label="Incluir Archivos"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button 
              type="primary" 
                              icon={<UploadOutlined />}
              onClick={() => setShowBackupModal(true)}
            >
              Crear Backup Manual
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => message.info('Descargando último backup...')}
            >
              Descargar Último Backup
            </Button>
          </Space>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card title="Configuración de Notificaciones" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name={['notifications', 'email']}
                label="Notificaciones por Email"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['notifications', 'sms']}
                label="Notificaciones por SMS"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['notifications', 'push']}
                label="Notificaciones Push"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Configuración de Seguridad */}
        <Card title="Configuración de Seguridad" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name={['security', 'twoFactor']}
                label="Autenticación de Dos Factores"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['security', 'sessionTimeout']}
                label="Timeout de Sesión (minutos)"
              >
                <Input type="number" min={5} max={480} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['security', 'passwordPolicy']}
                label="Política de Contraseñas"
              >
                <Select>
                  <Option value="weak">Débil</Option>
                  <Option value="medium">Media</Option>
                  <Option value="strong">Fuerte</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Configuración de Rendimiento */}
        <Card title="Configuración de Rendimiento" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name={['performance', 'cacheEnabled']}
                label="Habilitar Cache"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['performance', 'compression']}
                label="Compresión"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['performance', 'cdn']}
                label="Usar CDN"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SettingOutlined />}
            size="large"
          >
            Guardar Configuración
          </Button>
        </Form.Item>
      </Form>

      {/* Historial de Backups */}
      <Card title="Historial de Backups" className="mt-6">
        <List
          dataSource={backupHistory}
          renderItem={(backup) => (
            <List.Item
              actions={[
                <Button 
                  key="restore" 
                  size="small"
                  onClick={() => restoreBackup(backup.id)}
                  disabled={backup.status !== 'completed'}
                >
                  Restaurar
                </Button>,
                <Button 
                  key="download" 
                  size="small" 
                  icon={<DownloadOutlined />}
                  disabled={backup.status !== 'completed'}
                >
                  Descargar
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={getBackupTypeIcon(backup.type)}
                title={
                  <Space>
                    <span>Backup #{backup.id}</span>
                    <Tag color={getBackupStatusColor(backup.status)}>
                      {backup.status.toUpperCase()}
                    </Tag>
                    <Tag color={backup.type === 'automated' ? 'blue' : 'green'}>
                      {backup.type === 'automated' ? 'Automático' : 'Manual'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">
                      {backup.date.toLocaleString()} • {backup.size} • {backup.duration}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Modal de Backup Manual */}
      <Modal
        title="Crear Backup Manual"
        open={showBackupModal}
        onCancel={() => setShowBackupModal(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={createBackup}
        >
          <Form.Item
            name="description"
            label="Descripción (opcional)"
          >
            <TextArea rows={3} placeholder="Descripción del backup..." />
          </Form.Item>

          <Alert
            message="Información del Backup"
            description="El backup incluirá todos los datos de la base de datos y archivos del sistema. Este proceso puede tomar varios minutos."
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<UploadOutlined />}
              >
                Crear Backup
              </Button>
              <Button onClick={() => setShowBackupModal(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemSettings; 