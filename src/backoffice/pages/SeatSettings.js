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
} from '../../utils/antdComponents';
import { 
  ClockCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const clampValue = (value, fallback, min = 1, max = 120) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

const SeatSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [currentSettings, setCurrentSettings] = useState({
    lockExpirationMinutes: 15,
    mobileLockExpirationMinutes: 1,
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

      if (typeof window === 'undefined' || !window.localStorage) {
        form.setFieldsValue(currentSettings);
        return;
      }

      // Cargar configuraciones desde localStorage (temporal)
      const lockExpirationMinutes = clampValue(parseInt(localStorage.getItem('cart_lock_minutes') || '15', 10), 15);
      const mobileLockExpirationMinutes = clampValue(
        parseInt(localStorage.getItem('cart_lock_minutes_mobile') || '', 10),
        currentSettings.mobileLockExpirationMinutes
      );
      const enableAutoCleanup = localStorage.getItem('seat_auto_cleanup') !== 'false';
      const cleanupInterval = clampValue(parseInt(localStorage.getItem('seat_cleanup_interval') || '5', 10), 5, 1, 60);
      const preserveTimeMinutes = clampValue(parseInt(localStorage.getItem('seat_preserve_time') || '5', 10), 5, 1, 30);
      const warningTimeMinutes = clampValue(parseInt(localStorage.getItem('seat_warning_time') || '3', 10), 3, 1, 30);
      const enableNotifications = localStorage.getItem('seat_notifications') !== 'false';
      const enableRestoration = localStorage.getItem('seat_restoration') !== 'false';

      const settings = {
        lockExpirationMinutes,
        mobileLockExpirationMinutes,
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
      
      // Guardar en localStorage (temporal - despu©s se migrar¡ a base de datos)
      const sanitizedLock = clampValue(values.lockExpirationMinutes, currentSettings.lockExpirationMinutes);
      const sanitizedMobile = clampValue(
        values.mobileLockExpirationMinutes,
        currentSettings.mobileLockExpirationMinutes,
        1,
        120
      );
      const sanitizedCleanup = clampValue(values.cleanupInterval, currentSettings.cleanupInterval, 1, 60);
      const sanitizedPreserve = clampValue(values.preserveTimeMinutes, currentSettings.preserveTimeMinutes, 1, 30);
      const sanitizedWarning = clampValue(values.warningTimeMinutes, currentSettings.warningTimeMinutes, 1, 30);

      const sanitizedValues = {
        ...values,
        lockExpirationMinutes: sanitizedLock,
        mobileLockExpirationMinutes: sanitizedMobile,
        cleanupInterval: sanitizedCleanup,
        preserveTimeMinutes: sanitizedPreserve,
        warningTimeMinutes: sanitizedWarning
      };

      localStorage.setItem('cart_lock_minutes', sanitizedValues.lockExpirationMinutes.toString());
      localStorage.setItem('cart_lock_minutes_mobile', sanitizedValues.mobileLockExpirationMinutes.toString());
      localStorage.setItem('seat_auto_cleanup', sanitizedValues.enableAutoCleanup.toString());
      localStorage.setItem('seat_cleanup_interval', sanitizedValues.cleanupInterval.toString());
      localStorage.setItem('seat_preserve_time', sanitizedValues.preserveTimeMinutes.toString());
      localStorage.setItem('seat_warning_time', sanitizedValues.warningTimeMinutes.toString());
      localStorage.setItem('seat_notifications', values.enableNotifications.toString());
      localStorage.setItem('seat_restoration', values.enableRestoration.toString());

      // TODO: Migrar a tabla de configuraciones en base de datos
      // const { error } = await supabase
      //   .from('seat_settings')
      //   .upsert({
      //     tenant_id: currentTenantId,
      //     settings: values
      //   });

      setCurrentSettings(sanitizedValues);
      form.setFieldsValue(sanitizedValues);
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
      mobileLockExpirationMinutes: 1,
      enableAutoCleanup: true,
      cleanupInterval: 5,
      preserveTimeMinutes: 5,
      warningTimeMinutes: 3,
      enableNotifications: true,
      enableRestoration: true
    };
    
    form.setFieldsValue(defaultSettings);
    setCurrentSettings(defaultSettings);
    localStorage.setItem('cart_lock_minutes', '15');
    localStorage.setItem('cart_lock_minutes_mobile', '1');
    localStorage.setItem('seat_auto_cleanup', 'true');
    localStorage.setItem('seat_cleanup_interval', '5');
    localStorage.setItem('seat_preserve_time', '5');
    localStorage.setItem('seat_warning_time', '3');
    localStorage.setItem('seat_notifications', 'true');
    localStorage.setItem('seat_restoration', 'true');
    message.info('Configuraciones restablecidas a valores por defecto');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Title level={2} className="mb-6">
        <ClockCircleOutlined className="mr-2" />
        Configuraci³n de Asientos
      </Title>

      <Alert
        message="Configuraci³n de Tiempos de Expiraci³n"
        description="Estas configuraciones controlan c³mo se manejan los asientos seleccionados por los usuarios."
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
            {/* Configuraci³n Principal */}
            <Col xs={24} lg={12}>
              <Card title="° Tiempos de Expiraci³n" className="h-full">
                <Form.Item
                  name="lockExpirationMinutes"
                  label={
                    <Space>
                      <Text strong>Tiempo de Bloqueo (minutos)</Text>
                      <Tooltip title="Tiempo total que un asiento permanece bloqueado antes de liberarse autom¡ticamente">
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
                  name="mobileLockExpirationMinutes"
                  label={
                    <Space>
                      <Text strong>Tiempo de Bloqueo en M³viles (minutos)</Text>
                      <Tooltip title="Tiempo de reserva cuando el cliente compra desde un dispositivo m³vil">
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
                    placeholder="1"
                    addonAfter="minutos"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="preserveTimeMinutes"
                  label={
                    <Space>
                      <Text strong>Tiempo de Preservaci³n (minutos)</Text>
                      <Tooltip title="Tiempo durante el cual los asientos se preservan si el usuario regresa r¡pidamente">
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
                      <Tooltip title="Tiempo antes de la expiraci³n en el que se muestra una advertencia al usuario">
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

            {/* Configuraci³n de Limpieza */}
            <Col xs={24} lg={12}>
              <Card title="ðŸ§¹ Limpieza Autom¡tica" className="h-full">
                <Form.Item
                  name="enableAutoCleanup"
                  label="Habilitar Limpieza Autom¡tica"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="cleanupInterval"
                  label={
                    <Space>
                      <Text strong>Intervalo de Limpieza (minutos)</Text>
                      <Tooltip title="Cada cu¡nto tiempo se ejecuta la limpieza autom¡tica de asientos abandonados">
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
                  label="Habilitar Restauraci³n"
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

          {/* Informaci³n de Configuraci³n Actual */}
          <Card title="ðŸ“Š Configuraci³n Actual" size="small">
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
                <div className="text-center p-3 bg-indigo-50 rounded">
                  <Text strong className="block text-lg">
                    {currentSettings.mobileLockExpirationMinutes} min
                  </Text>
                  <Text type="secondary">Bloqueo en M³viles</Text>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="text-center p-3 bg-green-50 rounded">
                  <Text strong className="block text-lg">
                    {currentSettings.preserveTimeMinutes} min
                  </Text>
                  <Text type="secondary">Tiempo de Preservaci³n</Text>
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

          {/* Botones de Acci³n */}
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

      {/* Informaci³n Adicional */}
      <Card title="„¹ï¸ Informaci³n" className="mt-6">
        <Paragraph>
          <strong>Tiempo de Bloqueo:</strong> Es el tiempo total que un asiento permanece bloqueado
          antes de liberarse autom¡ticamente.
        </Paragraph>
        <Paragraph>
          <strong>Bloqueo en M³viles:</strong> Define un tiempo espec­fico para compras desde tel©fonos o
          tablets, permiti©ndote ajustar reservas m¡s cortas o largas segºn tu estrategia.
        </Paragraph>
        <Paragraph>
          <strong>Tiempo de Preservaci³n:</strong> Durante este tiempo, si el usuario regresa a la p¡gina, 
          sus asientos se restauran autom¡ticamente.
        </Paragraph>
        <Paragraph>
          <strong>Tiempo de Advertencia:</strong> Antes de que expiren los asientos, se muestra una 
          advertencia al usuario para que complete su compra.
        </Paragraph>
        <Paragraph>
          <strong>Limpieza Autom¡tica:</strong> Sistema que elimina asientos abandonados y notifica 
          a los usuarios sobre el estado de sus selecciones.
        </Paragraph>
      </Card>
    </div>
  );
};

export default SeatSettings;


