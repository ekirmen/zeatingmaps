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
} from '../../utils/antdComponents';
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
import { useTenant } from '../../contexts/TenantContext';
import { resolveTenantId } from '../../utils/tenantUtils';
import CryptoJS from 'crypto-js';

const { Title, Text } = Typography;

const PaymentMethodsConfig = () => {
  const { currentTenant } = useTenant();
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

  // Mapeo de method_id a type
  const getMethodType = (methodId) => {
    const typeMap = {
      'stripe': 'gateway',
      'paypal': 'gateway',
      'cashea': 'gateway',
      'apple_pay': 'wallet',
      'google_pay': 'wallet',
      'transferencia': 'bank_transfer',
      'pago_movil': 'mobile_payment',
      'efectivo_tienda': 'cash',
      'efectivo': 'cash'
    };
    return typeMap[methodId] || 'gateway';
  };

  // M©todos de pago disponibles
  const availableMethods = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <CreditCardOutlined style={{ color: '#6772e5', fontSize: '24px' }} />,
      description: 'Tarjetas de cr©dito y d©bito',
      enabled: true,
      recommended: true,
      processingTime: 'Instant¡neo',
      fee: '2.9% + $0.30',
      configs: [
        { key: 'publishable_key', label: 'Clave Pºblica', required: true },
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
      description: 'Pagos a trav©s de PayPal',
      enabled: true,
      recommended: true,
      processingTime: 'Instant¡neo',
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
      id: 'cashea',
      name: 'Cashea',
      icon: <CreditCardOutlined style={{ color: '#111827', fontSize: '24px' }} />,
      description: 'Compra ahora y paga despu©s con Cashea',
      enabled: true,
      recommended: false,
      processingTime: 'Aprobaci³n instant¡nea',
      fee: 'Configurable',
      configs: [
        { key: 'api_base_url', label: 'API Base URL', required: true, placeholder: 'https://api.cashea.example.com' },
        { key: 'create_order_endpoint', label: 'Endpoint para crear orden', required: false, placeholder: '/orders' },
        { key: 'api_key', label: 'API Key', required: true, secret: true },
        { key: 'api_secret', label: 'API Secret', required: false, secret: true },
        { key: 'access_token', label: 'Access Token', required: false, secret: true },
        { key: 'merchant_id', label: 'Merchant ID', required: true },
        { key: 'store_id', label: 'Store/Branch ID', required: false },
        { key: 'default_currency', label: 'Moneda por defecto', required: false, placeholder: 'USD' },
        { key: 'allow_sandbox_fallback', label: 'Permitir modo sandbox (true/false)', required: false, placeholder: 'true' }
      ]
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: <AppleOutlined style={{ color: '#000000', fontSize: '24px' }} />,
      description: 'Pagos para usuarios iOS',
      enabled: true,
      recommended: true,
      processingTime: 'Instant¡neo',
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
      processingTime: 'Instant¡neo',
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
      processingTime: '1-3 d­as h¡biles',
      fee: 'Sin comisi³n',
      configs: [
        { key: 'bank_name', label: 'Nombre del Banco', required: true },
        { key: 'account_number', label: 'Nºmero de Cuenta', required: true },
        { key: 'account_holder', label: 'Titular de la Cuenta', required: true },
        { key: 'routing_number', label: 'C³digo de Enrutamiento', required: false },
        { key: 'swift_code', label: 'C³digo SWIFT', required: false }
      ]
    },
    {
      id: 'pago_movil',
      name: 'Pago M³vil',
      icon: <MobileOutlined style={{ color: '#1890ff', fontSize: '24px' }} />,
      description: 'Pagos m³viles (MercadoPago, etc.)',
      enabled: true,
      recommended: false,
      processingTime: 'Instant¡neo',
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
      description: 'Pagos en efectivo en tienda f­sica',
      enabled: true,
      recommended: false,
      processingTime: 'Inmediato',
      fee: 'Sin comisi³n',
      configs: [
        { key: 'store_address', label: 'Direcci³n de la Tienda', required: true },
        { key: 'store_hours', label: 'Horarios de Atenci³n', required: true },
        { key: 'contact_phone', label: 'Tel©fono de Contacto', required: true },
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
      fee: 'Sin comisi³n',
      configs: [
        { key: 'instructions', label: 'Instrucciones', required: false, type: 'textarea' },
        { key: 'location', label: 'Ubicaci³n', required: false },
        { key: 'contact', label: 'Contacto', required: false }
      ]
    }
  ];

  // Clave secreta para encriptaci³n (en producci³n deber­a estar en variables de entorno)
  const SECRET_KEY = 'ekirmen-payment-secret-key-2024';

  // Funci³n para encriptar datos sensibles
  const encryptSensitiveData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  };

  // Funci³n para desencriptar datos sensibles
  const decryptSensitiveData = (encryptedData) => {
    try {
      // Si no hay datos encriptados, retornar objeto vac­o
      if (!encryptedData || encryptedData === '{}' || encryptedData === '') {
        return {};
      }

      // Si ya es un objeto JSON v¡lido, retornarlo directamente
      if (typeof encryptedData === 'object') {
        return encryptedData;
      }

      // Si es una cadena que parece JSON v¡lido, parsearla directamente
      if (typeof encryptedData === 'string' && encryptedData.startsWith('{')) {
        return JSON.parse(encryptedData);
      }

      // Intentar desencriptar
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        return {};
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return {};
    }
  };

  // Funci³n para validar API keys
  const validateApiKey = async (method, config) => {
    try {
      setTestingConnection(prev => ({ ...prev, [method]: true }));

      // Simular validaci³n de API key (en producci³n ser­a una llamada real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular resultado de validaci³n
      const isValid = Math.random() > 0.3; // 70% de ©xito simulado

      setConnectionStatus(prev => ({
        ...prev,
        [method]: {
          status: isValid ? 'success' : 'error',
          message: isValid ? 'Conexi³n exitosa' : 'API Key inv¡lida',
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
          message: 'Error de conexi³n',
          lastTested: new Date().toISOString()
        }
      }));
      return false;
    }
  };

  // Funci³n para obtener configuraci³n por pa­s/regi³n
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

      // Obtener tenant_id
      const tenantId = currentTenant?.id || resolveTenantId();

      // Cargar m©todos de pago desde la base de datos, filtrando por tenant_id si existe
      let query = supabase
        .from('payment_methods')
        .select('*');

      // Si hay tenant_id, filtrar por ©l (priorizar m©todos espec­ficos del tenant)
      // Si no hay tenant_id, cargar todos para ver qu© hay
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      query = query.order('is_recommended', { ascending: false })
        .order('name');

      const { data: methods, error } = await query;

      if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no existe
      }

      // Si no hay datos en la BD o no hay tenant_id, usar los m©todos por defecto
      if (!methods || methods.length === 0) {
        setPaymentMethods(availableMethods);
      } else {
        // Si hay tenant_id, usar solo los m©todos del tenant
        // Si no hay tenant_id, agrupar por method_id y priorizar los que tienen tenant_id
        let filteredMethods = methods;

        if (!tenantId) {
          // Si no hay tenant_id, agrupar por method_id y tomar el primero (que deber­a ser el m¡s reciente)
          const methodMap = new Map();
          methods.forEach(m => {
            const key = m.method_id;
            if (!methodMap.has(key)) {
              methodMap.set(key, m);
            } else {
              // Priorizar el que tiene tenant_id sobre el que tiene null
              const existing = methodMap.get(key);
              if (!existing.tenant_id && m.tenant_id) {
                methodMap.set(key, m);
              } else if (existing.tenant_id && !m.tenant_id) {
                // Mantener el que tiene tenant_id
              } else {
                // Si ambos tienen o no tienen tenant_id, tomar el m¡s reciente
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                const currentDate = new Date(m.updated_at || m.created_at || 0);
                if (currentDate > existingDate) {
                  methodMap.set(key, m);
                }
              }
            }
          });
          filteredMethods = Array.from(methodMap.values());
        }

        // Combinar con los m©todos disponibles
        const combinedMethods = availableMethods.map(method => {
          // Buscar el m©todo guardado, priorizando los que tienen tenant_id
          const savedMethod = filteredMethods.find(m => m.method_id === method.id);
          return {
            ...method,
            enabled: savedMethod ? savedMethod.enabled : method.enabled,
            config: savedMethod ? (savedMethod.config ? decryptSensitiveData(savedMethod.config) : {}) : {},
            is_recommended: savedMethod ? savedMethod.is_recommended : method.recommended,
            processing_time: savedMethod ? savedMethod.processing_time : method.processingTime,
            fee_structure: savedMethod ? savedMethod.fee_structure : { percentage: 2.9, fixed: 0.30 }
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
      // Simular carga de historial (en producci³n ser­a desde la BD)
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
      // Cargar m©todos favoritos desde localStorage
      const favorites = JSON.parse(localStorage.getItem('favoritePaymentMethods') || '[]');
      setFavoriteMethods(favorites);
    } catch (error) {
      console.error('Error loading favorite methods:', error);
    }
  };

  const handleMethodToggle = async (methodId, enabled) => {
    try {
      // Obtener el m©todo completo del estado
      const method = paymentMethods.find(m => m.id === methodId);
      if (!method) {
        throw new Error('M©todo de pago no encontrado');
      }

      // Obtener tenant_id
      const tenantId = currentTenant?.id || resolveTenantId();
      if (!tenantId) {
        throw new Error('No se pudo determinar el tenant_id');
      }

      // Actualizar estado local
      setPaymentMethods(prev =>
        prev.map(m =>
          m.id === methodId ? { ...m, enabled } : m
        )
      );

      // Verificar si el m©todo ya existe en la BD
      const { data: existingMethod } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('method_id', methodId)
        .eq('tenant_id', tenantId)
        .single();

      // Preparar datos para upsert con todos los campos requeridos
      const methodData = {
        method_id: methodId,
        name: method.name || methodId,
        type: existingMethod?.type || getMethodType(methodId),
        enabled: enabled,
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      };

      // Si existe, incluir campos adicionales para mantener la integridad
      if (existingMethod) {
        methodData.config = existingMethod.config || {};
        methodData.processing_time = existingMethod.processing_time || method.processingTime || 'Instant¡neo';
        methodData.fee_structure = existingMethod.fee_structure || method.fee_structure || { percentage: 0, fixed: 0 };
        methodData.is_recommended = existingMethod.is_recommended !== undefined ? existingMethod.is_recommended : method.recommended || false;
        methodData.description = existingMethod.description || method.description || '';
      } else {
        // Si no existe, incluir valores por defecto
        methodData.config = {};
        methodData.processing_time = method.processingTime || 'Instant¡neo';
        methodData.fee_structure = method.fee_structure || { percentage: 0, fixed: 0 };
        methodData.is_recommended = method.recommended || false;
        methodData.description = method.description || '';
        methodData.created_at = new Date().toISOString();
      }

      // Guardar en la base de datos
      const { error } = await supabase
        .from('payment_methods')
        .upsert(methodData, {
          onConflict: 'method_id,tenant_id'
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

      message.success(`M©todo de pago ${enabled ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      message.error('Error al actualizar el m©todo de pago');

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

    // Cargar configuraci³n existente
    const { data: config, error } = await supabase
      .from('payment_methods')
      .select('config')
      .eq('method_id', method.id)
      .single();

    if (error && error.code !== 'PGRST116') {
    }

    // Llenar el formulario con la configuraci³n existente
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
          message.warning('La API key no es v¡lida, pero se guardar¡ la configuraci³n');
        }
      }

      // Obtener tenant_id
      const tenantId = currentTenant?.id || resolveTenantId();
      if (!tenantId) {
        throw new Error('No se pudo determinar el tenant_id');
      }

      // Encriptar datos sensibles
      const encryptedConfig = encryptSensitiveData(values);

      // Verificar si el m©todo ya existe en la BD
      const { data: existingMethod } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('method_id', selectedMethod.id)
        .eq('tenant_id', tenantId)
        .single();

      // Preparar datos para upsert con todos los campos requeridos
      const methodData = {
        method_id: selectedMethod.id,
        name: selectedMethod.name || selectedMethod.id,
        type: existingMethod?.type || getMethodType(selectedMethod.id),
        enabled: selectedMethod.enabled,
        tenant_id: tenantId,
        config: encryptedConfig,
        updated_at: new Date().toISOString()
      };

      // Si existe, incluir campos adicionales para mantener la integridad
      if (existingMethod) {
        methodData.processing_time = existingMethod.processing_time || selectedMethod.processingTime || 'Instant¡neo';
        methodData.fee_structure = existingMethod.fee_structure || selectedMethod.fee_structure || { percentage: 0, fixed: 0 };
        methodData.is_recommended = existingMethod.is_recommended !== undefined ? existingMethod.is_recommended : selectedMethod.recommended || false;
        methodData.description = existingMethod.description || selectedMethod.description || '';
      } else {
        // Si no existe, incluir valores por defecto
        methodData.processing_time = selectedMethod.processingTime || 'Instant¡neo';
        methodData.fee_structure = selectedMethod.fee_structure || { percentage: 0, fixed: 0 };
        methodData.is_recommended = selectedMethod.recommended || false;
        methodData.description = selectedMethod.description || '';
        methodData.created_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payment_methods')
        .upsert(methodData, {
          onConflict: 'method_id,tenant_id'
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

      message.success('Configuraci³n guardada correctamente');
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
      message.error('Error al guardar la configuraci³n');
    }
  };

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Funci³n para bulk actions
  const handleBulkAction = async (action) => {
    try {
      setBulkActionLoading(true);

      // Obtener tenant_id
      const tenantId = currentTenant?.id || resolveTenantId();
      if (!tenantId) {
        throw new Error('No se pudo determinar el tenant_id');
      }

      // Preparar updates con todos los campos requeridos
      const updates = await Promise.all(
        paymentMethods.map(async (method) => {
          // Verificar si el m©todo ya existe en la BD
          const { data: existingMethod } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('method_id', method.id)
            .eq('tenant_id', tenantId)
            .single();

          const methodData = {
            method_id: method.id,
            name: method.name || method.id,
            type: existingMethod?.type || getMethodType(method.id),
            enabled: action === 'enable',
            tenant_id: tenantId,
            updated_at: new Date().toISOString()
          };

          // Si existe, incluir campos adicionales para mantener la integridad
          if (existingMethod) {
            methodData.config = existingMethod.config || {};
            methodData.processing_time = existingMethod.processing_time || method.processingTime || 'Instant¡neo';
            methodData.fee_structure = existingMethod.fee_structure || method.fee_structure || { percentage: 0, fixed: 0 };
            methodData.is_recommended = existingMethod.is_recommended !== undefined ? existingMethod.is_recommended : method.recommended || false;
            methodData.description = existingMethod.description || method.description || '';
          } else {
            // Si no existe, incluir valores por defecto
            methodData.config = {};
            methodData.processing_time = method.processingTime || 'Instant¡neo';
            methodData.fee_structure = method.fee_structure || { percentage: 0, fixed: 0 };
            methodData.is_recommended = method.recommended || false;
            methodData.description = method.description || '';
            methodData.created_at = new Date().toISOString();
          }

          return methodData;
        })
      );

      const { error } = await supabase
        .from('payment_methods')
        .upsert(updates, {
          onConflict: 'method_id,tenant_id'
        });

      if (error) throw error;

      // Actualizar estado local
      setPaymentMethods(prev =>
        prev.map(method => ({ ...method, enabled: action === 'enable' }))
      );

      message.success(`Todos los m©todos ${action === 'enable' ? 'activados' : 'desactivados'} correctamente`);
    } catch (error) {
      console.error('Error in bulk action:', error);
      message.error('Error en la acci³n masiva');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Funci³n para toggle favorito
  const toggleFavorite = (methodId) => {
    const isFavorite = favoriteMethods.includes(methodId);
    const newFavorites = isFavorite
      ? favoriteMethods.filter(id => id !== methodId)
      : [...favoriteMethods, methodId];

    setFavoriteMethods(newFavorites);
    localStorage.setItem('favoritePaymentMethods', JSON.stringify(newFavorites));

    message.success(`M©todo ${isFavorite ? 'removido de' : 'agregado a'} favoritos`);
  };

  // Funci³n para exportar configuraci³n
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

    message.success('Configuraci³n exportada correctamente');
  };

  // Funci³n para importar configuraci³n
  const importConfig = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const config = JSON.parse(e.target.result);

        // Validar estructura
        if (!Array.isArray(config)) {
          throw new Error('Formato de archivo inv¡lido');
        }

        // Obtener tenant_id
        const tenantId = currentTenant?.id || resolveTenantId();
        if (!tenantId) {
          throw new Error('No se pudo determinar el tenant_id');
        }

        // Aplicar configuraci³n
        for (const methodConfig of config) {
          // Buscar el m©todo en availableMethods para obtener datos completos
          const availableMethod = availableMethods.find(m => m.id === methodConfig.id);

          // Verificar si el m©todo ya existe en la BD
          const { data: existingMethod } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('method_id', methodConfig.id)
            .eq('tenant_id', tenantId)
            .single();

          const methodData = {
            method_id: methodConfig.id,
            name: availableMethod?.name || methodConfig.id,
            type: existingMethod?.type || getMethodType(methodConfig.id),
            enabled: methodConfig.enabled,
            tenant_id: tenantId,
            config: methodConfig.config ? encryptSensitiveData(methodConfig.config) : (existingMethod?.config || {}),
            updated_at: new Date().toISOString()
          };

          // Si existe, incluir campos adicionales para mantener la integridad
          if (existingMethod) {
            methodData.processing_time = existingMethod.processing_time || availableMethod?.processingTime || 'Instant¡neo';
            methodData.fee_structure = existingMethod.fee_structure || availableMethod?.fee_structure || { percentage: 0, fixed: 0 };
            methodData.is_recommended = existingMethod.is_recommended !== undefined ? existingMethod.is_recommended : (availableMethod?.recommended || false);
            methodData.description = existingMethod.description || availableMethod?.description || '';
          } else {
            // Si no existe, incluir valores por defecto
            methodData.processing_time = availableMethod?.processingTime || 'Instant¡neo';
            methodData.fee_structure = availableMethod?.fee_structure || { percentage: 0, fixed: 0 };
            methodData.is_recommended = availableMethod?.recommended || false;
            methodData.description = availableMethod?.description || '';
            methodData.created_at = new Date().toISOString();
          }

          await supabase
            .from('payment_methods')
            .upsert(methodData, {
              onConflict: 'method_id,tenant_id'
            });
        }

        // Recargar m©todos
        await loadPaymentMethods();
        message.success('Configuraci³n importada correctamente');
      } catch (error) {
        console.error('Error importing config:', error);
        message.error('Error al importar la configuraci³n');
      }
    };
    reader.readAsText(file);
  };

  // Funci³n para obtener badge de estado
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

  // Funci³n para obtener icono de conexi³n
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
          <span>M©todos de Pago</span>
        </Space>
      }
      extra={
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Space size="small" wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportConfig}
              size="small"
            >
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Exp</span>
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportExportModalVisible(true)}
              size="small"
            >
              <span className="hidden sm:inline">Importar</span>
              <span className="sm:hidden">Imp</span>
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setHistoryModalVisible(true)}
              size="small"
            >
              <span className="hidden sm:inline">Historial</span>
              <span className="sm:hidden">Hist</span>
            </Button>
          </Space>
          <Space size="small" wrap>
            <Popconfirm
              title="¿Activar todos los m©todos?"
              onConfirm={() => handleBulkAction('enable')}
              okText="S­"
              cancelText="No"
            >
              <Button
                icon={<CheckOutlined />}
                loading={bulkActionLoading}
                size="small"
              >
                <span className="hidden sm:inline">Activar Todos</span>
                <span className="sm:hidden">Activar</span>
              </Button>
            </Popconfirm>
            <Popconfirm
              title="¿Desactivar todos los m©todos?"
              onConfirm={() => handleBulkAction('disable')}
              okText="S­"
              cancelText="No"
            >
              <Button
                icon={<ExclamationCircleOutlined />}
                loading={bulkActionLoading}
                size="small"
                danger
              >
                <span className="hidden sm:inline">Desactivar Todos</span>
                <span className="sm:hidden">Desactivar</span>
              </Button>
            </Popconfirm>
          </Space>
        </div>
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
                  title="Favorito"
                />,
                <Button
                  key="test"
                  type="text"
                  icon={<WifiOutlined />}
                  onClick={() => validateApiKey(method.id, method.config)}
                  loading={testingConnection[method.id]}
                  disabled={!method.enabled || !method.config}
                  title="Probar conexi³n"
                />,
                <Button
                  key="config"
                  type="link"
                  icon={<SettingOutlined />}
                  onClick={() => openConfigModal(method)}
                  disabled={!method.enabled}
                  className="!text-xs sm:!text-sm"
                >
                  <span className="hidden sm:inline">Configurar</span>
                  <span className="sm:hidden">Config</span>
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

      {/* Modal de Configuraci³n */}
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
            message="Informaci³n del M©todo"
            description={
              <div>
                <p><strong>Tiempo de procesamiento:</strong> {selectedMethod?.processingTime}</p>
                <p><strong>Comisi³n:</strong> {selectedMethod?.fee}</p>
                {selectedMethod?.recommended && (
                  <p><Tag color="blue">M©todo recomendado</Tag></p>
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
              Guardar Configuraci³n
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
            <span>Importar/Exportar Configuraci³n</span>
          </Space>
        }
        open={importExportModalVisible}
        onCancel={() => setImportExportModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="space-y-4">
          <Card title="Exportar Configuraci³n" size="small">
            <p className="text-sm text-gray-600 mb-3">
              Descarga un archivo JSON con toda la configuraci³n actual de m©todos de pago.
            </p>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportConfig}
              block
            >
              Exportar Configuraci³n
            </Button>
          </Card>

          <Card title="Importar Configuraci³n" size="small">
            <p className="text-sm text-gray-600 mb-3">
              Sube un archivo JSON para restaurar una configuraci³n anterior.
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


