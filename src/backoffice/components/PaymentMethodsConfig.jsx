import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Switch, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Checkbox,
  Badge,
  Tooltip,
  Select,
  Upload,
  Progress,
  Alert,
  Tag,
  Timeline,
  Popconfirm
} from 'antd';
import { 
  CreditCardOutlined, 
  BankOutlined, 
  MobileOutlined, 
  DollarOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
  WifiOutlined,
  HistoryOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  StarFilled,
  AppleOutlined,
  AndroidOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import CryptoJS from 'crypto-js';

const { Title, Text } = Typography;

const PaymentMethodsConfig = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [configForm] = Form.useForm();
  const [showSecrets, setShowSecrets] = useState({});
  const [testingConnection, setTestingConnection] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({});
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [importExportModalVisible, setImportExportModalVisible] = useState(false);
  const [favoriteMethods, setFavoriteMethods] = useState([]);

  // Métodos de pago disponibles
  const availableMethods = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <CreditCardOutlined style={{ color: '#6772e5', fontSize: '24px' }} />,
      description: 'Tarjetas de crédito y débito',
      enabled: true,
      recommended: true,
      processingTime: 'Instantáneo',
      fee: '2.9% + $0.30',
      configs: [
        { key: 'publishable_key', label: 'Clave Pública', required: true },
        { key: 'secret_key', label: 'Clave Secreta', required: true, secret: true },
        { key: 'webhook_secret', label: 'Webhook Secret', required: false, secret: true },
        { key: 'environment', label: 'Ambiente', required: true, type: 'select', options: ['sandbox', 'live'] },
        { key: 'tasa_fija', label: 'Tasa Fija ($)', required: false, type: 'number', placeholder: '0.30' },
        { key: 'porcentaje', label: 'Porcentaje (%)', required: false, type: 'number', placeholder: '2.9' }
      ]
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <DollarOutlined style={{ color: '#0070ba', fontSize: '24px' }} />,
      description: 'Pagos a través de PayPal',
      enabled: true,
      recommended: true,
      processingTime: 'Instantáneo',
      fee: '2.9% + $0.30',
      configs: [
        { key: 'client_id', label: 'Client ID', required: true },
        { key: 'client_secret', label: 'Client Secret', required: true, secret: true },
        { key: 'mode', label: 'Modo (sandbox/live)', required: true, type: 'select', options: ['sandbox', 'live'] },
        { key: 'tasa_fija', label: 'Tasa Fija ($)', required: false, type: 'number', placeholder: '0.30' },
        { key: 'porcentaje', label: 'Porcentaje (%)', required: false, type: 'number', placeholder: '2.9' }
      ]
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: <AppleOutlined style={{ color: '#000000', fontSize: '24px' }} />,
      description: 'Pagos para usuarios iOS',
      enabled: true,
      recommended: true,
      processingTime: 'Instantáneo',
      fee: '2.9% + $0.30',
      configs: [
        { key: 'merchant_id', label: 'Merchant ID', required: true },
        { key: 'certificate', label: 'Certificado', required: true, type: 'file' },
        { key: 'private_key', label: 'Clave Privada', required: true, secret: true },
        { key: 'environment', label: 'Ambiente', required: true, type: 'select', options: ['sandbox', 'production'] }
      ]
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: <AndroidOutlined style={{ color: '#4285f4', fontSize: '24px' }} />,
      description: 'Pagos para usuarios Android',
      enabled: true,
      recommended: true,
      processingTime: 'Instantáneo',
      fee: '2.9% + $0.30',
      configs: [
        { key: 'merchant_id', label: 'Merchant ID', required: true },
        { key: 'api_key', label: 'API Key', required: true, secret: true },
        { key: 'environment', label: 'Ambiente', required: true, type: 'select', options: ['test', 'production'] }
      ]
    },
    {
      id: 'transferencia',
      name: 'Transferencia Bancaria',
      icon: <BankOutlined style={{ color: '#52c41a', fontSize: '24px' }} />,
      description: 'Transferencias bancarias directas',
      enabled: true,
      recommended: false,
      processingTime: '1-3 días hábiles',
      fee: 'Sin comisión',
      configs: [
        { key: 'bank_name', label: 'Nombre del Banco', required: true },
        { key: 'account_number', label: 'Número de Cuenta', required: true },
        { key: 'account_holder', label: 'Titular de la Cuenta', required: true },
        { key: 'routing_number', label: 'Código de Enrutamiento', required: false },
        { key: 'swift_code', label: 'Código SWIFT', required: false }
      ]
    },
    {
      id: 'pago_movil',
      name: 'Pago Móvil',
      icon: <MobileOutlined style={{ color: '#1890ff', fontSize: '24px' }} />,
      description: 'Pagos móviles (MercadoPago, etc.)',
      enabled: true,
      recommended: false,
      processingTime: 'Instantáneo',
      fee: 'Variable',
      configs: [
        { key: 'provider', label: 'Proveedor', required: true, type: 'select', options: ['MercadoPago', 'PayU', 'Otro'] },
        { key: 'api_key', label: 'API Key', required: true, secret: true },
        { key: 'access_token', label: 'Access Token', required: true, secret: true },
        { key: 'environment', label: 'Ambiente', required: true, type: 'select', options: ['sandbox', 'production'] },
        { key: 'tasa_fija', label: 'Tasa Fija ($)', required: false, type: 'number', placeholder: '0.30' },
        { key: 'porcentaje', label: 'Porcentaje (%)', required: false, type: 'number', placeholder: '2.9' }
      ]
    },
    {
      id: 'efectivo_tienda',
      name: 'Pago en Efectivo en Tienda',
      icon: <ShopOutlined style={{ color: '#fa8c16', fontSize: '24px' }} />,
      description: 'Pagos en efectivo en tienda física',
      enabled: true,
      recommended: false,
      processingTime: 'Inmediato',
      fee: 'Sin comisión',
      configs: [
        { key: 'store_address', label: 'Dirección de la Tienda', required: true },
        { key: 'store_hours', label: 'Horarios de Atención', required: true },
        { key: 'contact_phone', label: 'Teléfono de Contacto', required: true },
        { key: 'instructions', label: 'Instrucciones', required: false, type: 'textarea' }
      ]
    },
    {
      id: 'efectivo',
      name: 'Efectivo',
      icon: <DollarOutlined style={{ color: '#fa8c16', fontSize: '24px' }} />,
      description: 'Pagos en efectivo',
      enabled: true,
      recommended: false,
      processingTime: 'Inmediato',
      fee: 'Sin comisión',
      configs: [
        { key: 'instructions', label: 'Instrucciones', required: false, type: 'textarea' },
        { key: 'location', label: 'Ubicación', required: false },
        { key: 'contact', label: 'Contacto', required: false }
      ]
    }
  ];

  // Clave secreta para encriptación (en producción debería estar en variables de entorno)
  const SECRET_KEY = 'ekirmen-payment-secret-key-2024';

  // Función para encriptar datos sensibles
  const encryptSensitiveData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  };

  // Función para desencriptar datos sensibles
  const decryptSensitiveData = (encryptedData) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Error decrypting data:', error);
      return {};
    }
  };

  // Función para validar API keys
  const validateApiKey = async (method, config) => {
    try {
      setTestingConnection(prev => ({ ...prev, [method]: true }));
      
      // Simular validación de API key (en producción sería una llamada real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado de validación
      const isValid = Math.random() > 0.3; // 70% de éxito simulado
      
      setConnectionStatus(prev => ({
        ...prev,
        [method]: {
          status: isValid ? 'success' : 'error',
          message: isValid ? 'Conexión exitosa' : 'API Key inválida',
          lastTested: new Date().toISOString()
        }
      }));
      
      setTestingConnection(prev => ({ ...prev, [method]: false }));
      return isValid;
    } catch (error) {
      setTestingConnection(prev => ({ ...prev, [method]: false }));
      setConnectionStatus(prev => ({
        ...prev,
        [method]: {
          status: 'error',
          message: 'Error de conexión',
          lastTested: new Date().toISOString()
        }
      }));
      return false;
    }
  };

  // Función para obtener configuración por país/región
  const getRegionalConfig = (country) => {
    const regionalConfigs = {
      'US': {
        stripe: { currency: 'USD', country: 'US' },
        paypal: { currency: 'USD', country: 'US' }
      },
      'MX': {
        stripe: { currency: 'MXN', country: 'MX' },
        paypal: { currency: 'MXN', country: 'MX' }
      },
      'ES': {
        stripe: { currency: 'EUR', country: 'ES' },
        paypal: { currency: 'EUR', country: 'ES' }
      }
    };
    return regionalConfigs[country] || {};
  };

  useEffect(() => {
    loadPaymentMethods();
    loadPaymentHistory();
    loadFavoriteMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      
      // Cargar métodos de pago desde la base de datos
      const { data: methods, error } = await supabase
        .from('payment_methods_global')
        .select('*');

      if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no existe
        console.warn('Error loading payment methods:', error);
      }

      // Si no hay datos en la BD, usar los métodos por defecto
      if (!methods || methods.length === 0) {
        setPaymentMethods(availableMethods);
      } else {
        // Combinar con los métodos disponibles
        const combinedMethods = availableMethods.map(method => {
          const savedMethod = methods.find(m => m.method_id === method.id);
          return {
            ...method,
            enabled: savedMethod ? savedMethod.enabled : method.enabled,
            config: savedMethod ? (savedMethod.config ? decryptSensitiveData(savedMethod.config) : {}) : {}
          };
        });
        setPaymentMethods(combinedMethods);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods(availableMethods);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      // Simular carga de historial (en producción sería desde la BD)
      const mockHistory = [
        {
          id: 1,
          method: 'stripe',
          action: 'enabled',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: 'admin'
        },
        {
          id: 2,
          method: 'paypal',
          action: 'configured',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          user: 'admin'
        }
      ];
      setPaymentHistory(mockHistory);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const loadFavoriteMethods = async () => {
    try {
      // Cargar métodos favoritos desde localStorage
      const favorites = JSON.parse(localStorage.getItem('favoritePaymentMethods') || '[]');
      setFavoriteMethods(favorites);
    } catch (error) {
      console.error('Error loading favorite methods:', error);
    }
  };

  const handleMethodToggle = async (methodId, enabled) => {
    try {
      // Actualizar estado local
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === methodId ? { ...method, enabled } : method
        )
      );

      // Guardar en la base de datos
      const { error } = await supabase
        .from('payment_methods_global')
        .upsert({
          method_id: methodId,
          enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Agregar al historial
      const historyEntry = {
        id: Date.now(),
        method: methodId,
        action: enabled ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString(),
        user: 'admin'
      };
      setPaymentHistory(prev => [historyEntry, ...prev]);

      message.success(`Método de pago ${enabled ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      message.error('Error al actualizar el método de pago');
      
      // Revertir cambio local
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === methodId ? { ...method, enabled: !enabled } : method
        )
      );
    }
  };

  const openConfigModal = async (method) => {
    setSelectedMethod(method);
    
    // Cargar configuración existente
    const { data: config, error } = await supabase
      .from('payment_methods_global')
      .select('config')
      .eq('method_id', method.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error loading config:', error);
    }

    // Llenar el formulario con la configuración existente
    configForm.setFieldsValue(config?.config || {});
    setConfigModalVisible(true);
  };

  const handleSaveConfig = async (values) => {
    try {
      // Validar API keys antes de guardar
      const hasApiKey = selectedMethod.configs.some(config => 
        config.secret && values[config.key]
      );
      
      if (hasApiKey) {
        const isValid = await validateApiKey(selectedMethod.id, values);
        if (!isValid) {
          message.warning('La API key no es válida, pero se guardará la configuración');
        }
      }

      // Encriptar datos sensibles
      const encryptedConfig = encryptSensitiveData(values);

      const { error } = await supabase
        .from('payment_methods_global')
        .upsert({
          method_id: selectedMethod.id,
          enabled: selectedMethod.enabled,
          config: encryptedConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Agregar al historial
      const historyEntry = {
        id: Date.now(),
        method: selectedMethod.id,
        action: 'configured',
        timestamp: new Date().toISOString(),
        user: 'admin'
      };
      setPaymentHistory(prev => [historyEntry, ...prev]);

      message.success('Configuración guardada correctamente');
      setConfigModalVisible(false);
      configForm.resetFields();
      
      // Actualizar estado local
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === selectedMethod.id 
            ? { ...method, config: values }
            : method
        )
      );
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('Error al guardar la configuración');
    }
  };

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Función para bulk actions
  const handleBulkAction = async (action) => {
    try {
      setBulkActionLoading(true);
      
      const updates = paymentMethods.map(method => ({
        method_id: method.id,
        enabled: action === 'enable',
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('payment_methods_global')
        .upsert(updates);

      if (error) throw error;

      // Actualizar estado local
      setPaymentMethods(prev => 
        prev.map(method => ({ ...method, enabled: action === 'enable' }))
      );

      message.success(`Todos los métodos ${action === 'enable' ? 'activados' : 'desactivados'} correctamente`);
    } catch (error) {
      console.error('Error in bulk action:', error);
      message.error('Error en la acción masiva');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Función para toggle favorito
  const toggleFavorite = (methodId) => {
    const isFavorite = favoriteMethods.includes(methodId);
    const newFavorites = isFavorite 
      ? favoriteMethods.filter(id => id !== methodId)
      : [...favoriteMethods, methodId];
    
    setFavoriteMethods(newFavorites);
    localStorage.setItem('favoritePaymentMethods', JSON.stringify(newFavorites));
    
    message.success(`Método ${isFavorite ? 'removido de' : 'agregado a'} favoritos`);
  };

  // Función para exportar configuración
  const exportConfig = () => {
    const config = paymentMethods.map(method => ({
      id: method.id,
      enabled: method.enabled,
      config: method.config
    }));
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `payment-methods-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    message.success('Configuración exportada correctamente');
  };

  // Función para importar configuración
  const importConfig = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const config = JSON.parse(e.target.result);
        
        // Validar estructura
        if (!Array.isArray(config)) {
          throw new Error('Formato de archivo inválido');
        }
        
        // Aplicar configuración
        for (const methodConfig of config) {
          await supabase
            .from('payment_methods_global')
            .upsert({
              method_id: methodConfig.id,
              enabled: methodConfig.enabled,
              config: encryptSensitiveData(methodConfig.config),
              updated_at: new Date().toISOString()
            });
        }
        
        // Recargar métodos
        await loadPaymentMethods();
        message.success('Configuración importada correctamente');
      } catch (error) {
        console.error('Error importing config:', error);
        message.error('Error al importar la configuración');
      }
    };
    reader.readAsText(file);
  };

  // Función para obtener badge de estado
  const getStatusBadge = (method) => {
    const hasConfig = Object.keys(method.config || {}).length > 0;
    const isConfigured = hasConfig && method.config[method.configs?.[0]?.key];
    
    if (isConfigured) {
      return <Badge status="success" text="Configurado" />;
    } else if (hasConfig) {
      return <Badge status="warning" text="Parcialmente configurado" />;
    } else {
      return <Badge status="default" text="Sin configurar" />;
    }
  };

  // Función para obtener icono de conexión
  const getConnectionIcon = (methodId) => {
    const status = connectionStatus[methodId];
    if (testingConnection[methodId]) {
      return <Progress type="circle" size={16} percent={50} />;
    }
    if (status?.status === 'success') {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else if (status?.status === 'error') {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
  };

  return (
    <Card 
      title={
        <Space>
          <SettingOutlined />
          <span>Métodos de Pago</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportConfig}
            size="small"
          >
            Exportar
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportExportModalVisible(true)}
            size="small"
          >
            Importar
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setHistoryModalVisible(true)}
            size="small"
          >
            Historial
          </Button>
          <Popconfirm
            title="¿Activar todos los métodos?"
            onConfirm={() => handleBulkAction('enable')}
            okText="Sí"
            cancelText="No"
          >
            <Button
              icon={<CheckOutlined />}
              loading={bulkActionLoading}
              size="small"
            >
              Activar Todos
            </Button>
          </Popconfirm>
          <Popconfirm
            title="¿Desactivar todos los métodos?"
            onConfirm={() => handleBulkAction('disable')}
            okText="Sí"
            cancelText="No"
          >
            <Button
              icon={<ExclamationCircleOutlined />}
              loading={bulkActionLoading}
              size="small"
              danger
            >
              Desactivar Todos
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        {paymentMethods
          .sort((a, b) => {
            // Ordenar por favoritos primero, luego por recomendados
            const aFavorite = favoriteMethods.includes(a.id);
            const bFavorite = favoriteMethods.includes(b.id);
            if (aFavorite && !bFavorite) return -1;
            if (!aFavorite && bFavorite) return 1;
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            return 0;
          })
          .map((method) => (
          <Col xs={24} sm={12} lg={8} key={method.id}>
            <Card
              size="small"
              className="h-full"
              actions={[
                <Button
                  key="favorite"
                  type="text"
                  icon={favoriteMethods.includes(method.id) ? <StarFilled /> : <StarOutlined />}
                  onClick={() => toggleFavorite(method.id)}
                  style={{ color: favoriteMethods.includes(method.id) ? '#faad14' : '#d9d9d9' }}
                />,
                <Button
                  key="test"
                  type="text"
                  icon={<WifiOutlined />}
                  onClick={() => validateApiKey(method.id, method.config)}
                  loading={testingConnection[method.id]}
                  disabled={!method.enabled || !method.config}
                />,
                <Button
                  key="config"
                  type="link"
                  icon={<SettingOutlined />}
                  onClick={() => openConfigModal(method)}
                  disabled={!method.enabled}
                >
                  Configurar
                </Button>
              ]}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {method.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <Title level={5} className="mb-1">
                        {method.name}
                      </Title>
                      {method.recommended && (
                        <Tag color="blue" size="small">Recomendado</Tag>
                      )}
                      {favoriteMethods.includes(method.id) && (
                        <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />
                      )}
                    </div>
                    <Text type="secondary" className="text-sm">
                      {method.description}
                    </Text>
                    <div className="flex items-center gap-2 mt-1">
                      <Text type="secondary" className="text-xs">
                        <ClockCircleOutlined /> {method.processingTime}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        <DollarOutlined /> {method.fee}
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    checked={method.enabled}
                    onChange={(checked) => handleMethodToggle(method.id, checked)}
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren=""
                  />
                  {getConnectionIcon(method.id)}
                </div>
              </div>
              
              <div className="mt-2">
                {getStatusBadge(method)}
                {connectionStatus[method.id] && (
                  <div className="mt-1">
                    <Text 
                      type={connectionStatus[method.id].status === 'success' ? 'success' : 'danger'} 
                      className="text-xs"
                    >
                      {connectionStatus[method.id].message}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal de Configuración */}
      <Modal
        title={
          <Space>
            {selectedMethod?.icon}
            <span>Configurar {selectedMethod?.name}</span>
          </Space>
        }
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          configForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <div className="mb-4">
          <Alert
            message="Información del Método"
            description={
              <div>
                <p><strong>Tiempo de procesamiento:</strong> {selectedMethod?.processingTime}</p>
                <p><strong>Comisión:</strong> {selectedMethod?.fee}</p>
                {selectedMethod?.recommended && (
                  <p><Tag color="blue">Método recomendado</Tag></p>
                )}
              </div>
            }
            type="info"
            showIcon
          />
        </div>

        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
        >
          {selectedMethod?.configs?.map((config) => (
            <Form.Item
              key={config.key}
              name={config.key}
              label={config.label}
              rules={[
                { required: config.required, message: `${config.label} es requerido` }
              ]}
            >
              {config.type === 'select' ? (
                <Select
                  placeholder={`Selecciona ${config.label.toLowerCase()}`}
                  options={config.options?.map(option => ({
                    label: option,
                    value: option
                  }))}
                />
              ) : config.type === 'textarea' ? (
                <Input.TextArea rows={3} placeholder={config.placeholder} />
              ) : config.type === 'file' ? (
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>
                    Seleccionar Archivo
                  </Button>
                </Upload>
              ) : config.type === 'number' ? (
                <Input
                  type="number"
                  placeholder={config.placeholder}
                  addonAfter={config.key.includes('porcentaje') ? '%' : '$'}
                />
              ) : config.secret ? (
                <Input
                  type={showSecrets[config.key] ? 'text' : 'password'}
                  placeholder={config.placeholder}
                  addonAfter={
                    <Button
                      type="text"
                      icon={showSecrets[config.key] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => toggleSecretVisibility(config.key)}
                    />
                  }
                />
              ) : (
                <Input placeholder={config.placeholder} />
              )}
            </Form.Item>
          ))}

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setConfigModalVisible(false)}>
              Cancelar
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              icon={<CheckOutlined />}
            >
              Guardar Configuración
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal de Historial */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Historial de Cambios</span>
          </Space>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={600}
      >
        <Timeline>
          {paymentHistory.map((entry) => (
            <Timeline.Item
              key={entry.id}
              color={entry.action === 'enabled' || entry.action === 'configured' ? 'green' : 'red'}
            >
              <div>
                <strong>{entry.method}</strong> - {entry.action}
                <br />
                <Text type="secondary">
                  {new Date(entry.timestamp).toLocaleString()} por {entry.user}
                </Text>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>

      {/* Modal de Import/Export */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            <span>Importar/Exportar Configuración</span>
          </Space>
        }
        open={importExportModalVisible}
        onCancel={() => setImportExportModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="space-y-4">
          <Card title="Exportar Configuración" size="small">
            <p className="text-sm text-gray-600 mb-3">
              Descarga un archivo JSON con toda la configuración actual de métodos de pago.
            </p>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={exportConfig}
              block
            >
              Exportar Configuración
            </Button>
          </Card>
          
          <Card title="Importar Configuración" size="small">
            <p className="text-sm text-gray-600 mb-3">
              Sube un archivo JSON para restaurar una configuración anterior.
            </p>
            <Upload
              beforeUpload={importConfig}
              accept=".json"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} block>
                Seleccionar Archivo JSON
              </Button>
            </Upload>
          </Card>
        </div>
      </Modal>
    </Card>
  );
};

export default PaymentMethodsConfig;
