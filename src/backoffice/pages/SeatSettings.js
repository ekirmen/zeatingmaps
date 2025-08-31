import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  InputNumber, 
  Button, 
  Typography, 
  Space,
  Alert,
  Divider,
  Switch,
  Select,
  message,
  Spin,
  Tooltip
} from 'antd';
import { 
  ClockCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SeatSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [currentSettings, setCurrentSettings] = useState({
    lockExpirationMinutes: 15,
    enableAutoCleanup: true,
    cleanupInterval: 5,
    preserveTimeMinutes: 5,
    warningTimeMinutes: 3,
    enableNotifications: true,
    enableRestoration: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Cargar configuraciones desde localStorage (temporal)
      const lockExpirationMinutes = parseInt(localStorage.getItem('cart_lock_minutes') || '15', 10);
      const enableAutoCleanup = localStorage.getItem('seat_auto_cleanup') !== 'false';
      const cleanupInterval = parseInt(localStorage.getItem('seat_cleanup_interval') || '5', 10);
      const preserveTimeMinutes = parseInt(localStorage.getItem('seat_preserve_time') || '5', 10);
      const warningTimeMinutes = parseInt(localStorage.getItem('seat_warning_time') || '3', 10);
      const enableNotifications = localStorage.getItem('seat_notifications') !== 'false';
      const enableRestoration = localStorage.getItem('seat_restoration') !== 'false';

      const settings = {
        lockExpirationMinutes,
        enableAutoCleanup,
        cleanupInterval,
        preserveTimeMinutes,
        warningTimeMinutes,
        enableNotifications,
        enableRestoration
      };

      setCurrentSettings(settings);
      form.setFieldsValue(settings);
      
    } catch (error) {
      console.error('Error loading seat settings:', error);
      message.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (values) => {
    try {
      setSaving(true);
      
      // Guardar en localStorage (temporal - después se migrará a base de datos)
      localStorage.setItem('cart_lock_minutes', values.lockExpirationMinutes.toString());
      localStorage.setItem('seat_auto_cleanup', values.enableAutoCleanup.toString());
      localStorage.setItem('seat_cleanup_interval', values.cleanupInterval.toString());
      localStorage.setItem('seat_preserve_time', values.preserveTimeMinutes.toString());
      localStorage.setItem('seat_warning_time', values.warningTimeMinutes.toString());
      localStorage.setItem('seat_notifications', values.enableNotifications.toString());
      localStorage.setItem('seat_restoration', values.enableRestoration.toString());

      // TODO: Migrar a tabla de configuraciones en base de datos
      // const { error } = await supabase
      //   .from('seat_settings')
      //   .upsert({
      //     tenant_id: currentTenantId,
      //     settings: values
      //   });

      setCurrentSettings(values);
      message.success('Configuraciones guardadas exitosamente');
      
    } catch (error) {
      console.error('Error saving seat settings:', error);
      message.error('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      lockExpirationMinutes: 15,
      enableAutoCleanup: true,
      cleanupInterval: 5,
      preserveTimeMinutes: 5,
      warningTimeMinutes: 3,
      enableNotifications: true,
      enableRestoration: true
    };
    
    form.setFieldsValue(defaultSettings);
    setCurrentSettings(defaultSettings);
    message.info('Configuraciones restablecidas a valores por defecto');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Title level={2} className="mb-6">
        <ClockCircleOutlined className="mr-2" />
        Configuración de Asientos
      </Title>

      <Alert
        message="Configuración de Tiempos de Expiración"
        description="Estas configuraciones controlan cómo se manejan los asientos seleccionados por los usuarios."
        type="info"
        showIcon
        className="mb-6"
      />

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={saveSettings}
          initialValues={currentSettings}
        >
          <Row gutter={[24, 24]}>
            {/* Configuración Principal */}
            <Col xs={24} lg={12}>
              <Card title="⏰ Tiempos de Expiración" className="h-full">
                <Form.Item
                  name="lockExpirationMinutes"
                  label={
                    <Space>
                      <Text strong>Tiempo de Bloqueo (minutos)</Text>
                      <Tooltip title="Tiempo total que un asiento permanece bloqueado antes de liberarse automáticamente">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  rules={[
                    { required: true, message: 'Este campo es requerido' },
                    { type: 'number', min: 1, max: 120, message: 'Debe estar entre 1 y 120 minutos' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={120}
                    placeholder="15"
                    addonAfter="minutos"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="preserveTimeMinutes"
                  label={
                    <Space>
                      <Text strong>Tiempo de Preservación (minutos)</Text>
                      <Tooltip title="Tiempo durante el cual los asientos se preservan si el usuario regresa rápidamente">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  rules={[
                    { required: true, message: 'Este campo es requerido' },
                    { type: 'number', min: 1, max: 30, message: 'Debe estar entre 1 y 30 minutos' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={30}
                    placeholder="5"
                    addonAfter="minutos"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="warningTimeMinutes"
                  label={
                    <Space>
                      <Text strong>Tiempo de Advertencia (minutos)</Text>
                      <Tooltip title="Tiempo antes de la expiración en el que se muestra una advertencia al usuario">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  rules={[
                    { required: true, message: 'Este campo es requerido' },
                    { type: 'number', min: 1, max: 10, message: 'Debe estar entre 1 y 10 minutos' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={10}
                    placeholder="3"
                    addonAfter="minutos"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* Configuración de Limpieza */}
            <Col xs={24} lg={12}>
              <Card title="🧹 Limpieza Automática" className="h-full">
                <Form.Item
                  name="enableAutoCleanup"
                  label="Habilitar Limpieza Automática"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="cleanupInterval"
                  label={
                    <Space>
                      <Text strong>Intervalo de Limpieza (minutos)</Text>
                      <Tooltip title="Cada cuánto tiempo se ejecuta la limpieza automática de asientos abandonados">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  rules={[
                    { required: true, message: 'Este campo es requerido' },
                    { type: 'number', min: 1, max: 60, message: 'Debe estar entre 1 y 60 minutos' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={60}
                    placeholder="5"
                    addonAfter="minutos"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="enableRestoration"
                  label="Habilitar Restauración"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="enableNotifications"
                  label="Habilitar Notificaciones"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Información de Configuración Actual */}
          <Card title="📊 Configuración Actual" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <Text strong className="block text-lg">
                    {currentSettings.lockExpirationMinutes} min
                  </Text>
                  <Text type="secondary">Tiempo de Bloqueo</Text>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="text-center p-3 bg-green-50 rounded">
                  <Text strong className="block text-lg">
                    {currentSettings.preserveTimeMinutes} min
                  </Text>
                  <Text type="secondary">Tiempo de Preservación</Text>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <Text strong className="block text-lg">
                    {currentSettings.warningTimeMinutes} min
                  </Text>
                  <Text type="secondary">Tiempo de Advertencia</Text>
                </div>
              </Col>
            </Row>
          </Card>

          <Divider />

          {/* Botones de Acción */}
          <div className="flex justify-between items-center">
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={saving}
              >
                Restablecer
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadSettings}
                disabled={saving}
              >
                Recargar
              </Button>
            </Space>

            <Button 
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={saving}
              size="large"
            >
              Guardar Configuraciones
            </Button>
          </div>
        </Form>
      </Spin>

      {/* Información Adicional */}
      <Card title="ℹ️ Información" className="mt-6">
        <Paragraph>
          <strong>Tiempo de Bloqueo:</strong> Es el tiempo total que un asiento permanece bloqueado 
          antes de liberarse automáticamente.
        </Paragraph>
        <Paragraph>
          <strong>Tiempo de Preservación:</strong> Durante este tiempo, si el usuario regresa a la página, 
          sus asientos se restauran automáticamente.
        </Paragraph>
        <Paragraph>
          <strong>Tiempo de Advertencia:</strong> Antes de que expiren los asientos, se muestra una 
          advertencia al usuario para que complete su compra.
        </Paragraph>
        <Paragraph>
          <strong>Limpieza Automática:</strong> Sistema que elimina asientos abandonados y notifica 
          a los usuarios sobre el estado de sus selecciones.
        </Paragraph>
      </Card>
    </div>
  );
};

export default SeatSettings;
