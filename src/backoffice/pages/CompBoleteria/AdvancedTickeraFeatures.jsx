import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Button, 
  Input, 
  Select, 
  Table, 
  Tag, 
  Space, 
  Divider, 
  message, 
  Card, 
  Row, 
  Col,
  Typography,
  Switch,
  Slider,
  ColorPicker,
  Form,
  InputNumber,
  DatePicker,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  FileTextOutlined, 
  HistoryOutlined, 
  AuditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DollarOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ===== SISTEMA DE PLANTILLAS AVANZADAS =====
const EventTemplates = {
  theater: {
    name: 'Teatro Clásico',
    description: 'Configuración estándar para teatros y auditorios',
    seatSize: { width: 40, height: 35 },
    spacing: { x: 45, y: 40 },
    zones: ['orchestra', 'mezzanine', 'balcony'],
    defaultPrices: {
      orchestra: 150.00,
      mezzanine: 120.00,
      balcony: 90.00
    },
    gridConfig: {
      enabled: true,
      size: 20,
      snapToGrid: true
    }
  },
  concert: {
    name: 'Concierto',
    description: 'Configuración para conciertos y eventos musicales',
    seatSize: { width: 50, height: 45 },
    spacing: { x: 55, y: 50 },
    zones: ['floor', 'tier1', 'tier2', 'vip'],
    defaultPrices: {
      floor: 200.00,
      tier1: 150.00,
      tier2: 100.00,
      vip: 300.00
    },
    gridConfig: {
      enabled: true,
      size: 25,
      snapToGrid: true
    }
  },
  sports: {
    name: 'Estadio Deportivo',
    description: 'Configuración para estadios y arenas deportivas',
    seatSize: { width: 35, height: 30 },
    spacing: { x: 38, y: 33 },
    zones: ['field', 'stands', 'premium'],
    defaultPrices: {
      field: 80.00,
      stands: 60.00,
      premium: 120.00
    },
    gridConfig: {
      enabled: true,
      size: 15,
      snapToGrid: true
    }
  },
  conference: {
    name: 'Conferencia',
    description: 'Configuración para conferencias y eventos corporativos',
    seatSize: { width: 45, height: 40 },
    spacing: { x: 50, y: 45 },
    zones: ['main', 'side', 'vip'],
    defaultPrices: {
      main: 100.00,
      side: 80.00,
      vip: 150.00
    },
    gridConfig: {
      enabled: true,
      size: 20,
      snapToGrid: true
    }
  }
};

// ===== SISTEMA DE AUDITORÍA AVANZADA =====
const AuditSystem = {
  actions: [
    { 
      type: 'seat_reserved', 
      user: 'cliente@email.com', 
      timestamp: Date.now(), 
      seatId: 'A1',
      details: {
        eventId: 'evt_001',
        functionId: 'func_001',
        price: 150.00,
        paymentMethod: 'credit_card'
      }
    },
    { 
      type: 'price_changed', 
      user: 'admin@tickera.com', 
      timestamp: Date.now() - 3600000, 
      zoneId: 'vip', 
      oldPrice: 100, 
      newPrice: 120,
      details: {
        reason: 'Demanda alta',
        approvedBy: 'manager@tickera.com'
      }
    },
    { 
      type: 'zone_created', 
      user: 'admin@tickera.com', 
      timestamp: Date.now() - 7200000, 
      zoneId: 'new-zone',
      details: {
        name: 'Zona Premium Plus',
        capacity: 50,
        color: '#FFD700'
      }
    }
  ],
  
  getActionIcon: (type) => {
    const icons = {
      seat_reserved: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      price_changed: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      zone_created: <EditOutlined style={{ color: '#1890ff' }} />,
      seat_cancelled: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      payment_processed: <DollarOutlined style={{ color: '#52c41a' }} />,
      user_login: <UserOutlined style={{ color: '#1890ff' }} />
    };
    return icons[type] || <ClockCircleOutlined />;
  },
  
  getActionColor: (type) => {
    const colors = {
      seat_reserved: 'green',
      price_changed: 'orange',
      zone_created: 'blue',
      seat_cancelled: 'red',
      payment_processed: 'green',
      user_login: 'blue'
    };
    return colors[type] || 'default';
  }
};

// ===== SISTEMA DE VALIDACIONES EN TIEMPO REAL =====
const ValidationSystem = {
  rules: {
    maxSeatsPerUser: 10,
    maxSeatsPerTransaction: 20,
    minTimeBetweenReservations: 300000, // 5 minutos
    maxReservationTime: 900000, // 15 minutos
    requireClientInfo: true,
    requirePaymentMethod: true
  },
  
  validateSeatSelection: (seats, userId, eventId) => {
    const errors = [];
    
    // Validar límite de asientos por usuario
    if (seats.length > ValidationSystem.rules.maxSeatsPerUser) {
      errors.push(`Máximo ${ValidationSystem.rules.maxSeatsPerUser} asientos por usuario`);
    }
    
    // Validar límite de asientos por transacción
    if (seats.length > ValidationSystem.rules.maxSeatsPerTransaction) {
      errors.push(`Máximo ${ValidationSystem.rules.maxSeatsPerTransaction} asientos por transacción`);
    }
    
    // Validar que no haya asientos duplicados
    const seatIds = seats.map(s => s._id);
    if (new Set(seatIds).size !== seatIds.length) {
      errors.push('No se pueden seleccionar asientos duplicados');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  validatePayment: (paymentData) => {
    const errors = [];
    
    if (ValidationSystem.rules.requirePaymentMethod && !paymentData.method) {
      errors.push('Método de pago requerido');
    }
    
    if (ValidationSystem.rules.requireClientInfo && !paymentData.clientId) {
      errors.push('Información del cliente requerida');
    }
    
    if (paymentData.amount <= 0) {
      errors.push('Monto inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// ===== COMPONENTE PRINCIPAL =====
const AdvancedTickeraFeatures = ({ 
  visible, 
  onClose, 
  currentEvent, 
  onTemplateApply,
  onAuditExport 
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    seatSize: { width: 40, height: 35 },
    spacing: { x: 45, y: 40 },
    zones: [],
    defaultPrices: {},
    gridConfig: {
      enabled: true,
      size: 20,
      snapToGrid: true
    }
  });
  
  const [auditFilters, setAuditFilters] = useState({
    dateRange: null,
    actionType: 'all',
    userId: '',
    eventId: ''
  });
  
  const [validationSettings, setValidationSettings] = useState({
    ...ValidationSystem.rules,
    enableRealTimeValidation: true,
    showValidationWarnings: true,
    autoBlockInvalidSeats: false
  });

  // ===== FUNCIONES DE PLANTILLAS =====
  const handleTemplateSelect = useCallback((templateKey) => {
    const template = EventTemplates[templateKey];
    setSelectedTemplate(template);
    setCustomTemplate(template);
  }, []);

  const handleTemplateApply = useCallback(() => {
    if (!selectedTemplate) {
      message.warning('Selecciona una plantilla primero');
      return;
    }
    
    onTemplateApply && onTemplateApply(selectedTemplate);
    message.success('Plantilla aplicada exitosamente');
  }, [selectedTemplate, onTemplateApply]);

  const handleCustomTemplateSave = useCallback(() => {
    if (!customTemplate.name.trim()) {
      message.warning('El nombre de la plantilla es requerido');
      return;
    }
    
    // Aquí se guardaría en localStorage o base de datos
    const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    const newTemplate = {
      ...customTemplate,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    savedTemplates.push(newTemplate);
    localStorage.setItem('customTemplates', JSON.stringify(savedTemplates));
    
    message.success('Plantilla personalizada guardada');
  }, [customTemplate]);

  // ===== FUNCIONES DE AUDITORÍA =====
  const handleAuditExport = useCallback(() => {
    const filteredAudit = AuditSystem.actions.filter(action => {
      if (auditFilters.actionType !== 'all' && action.type !== auditFilters.actionType) {
        return false;
      }
      if (auditFilters.userId && !action.user.includes(auditFilters.userId)) {
        return false;
      }
      if (auditFilters.eventId && action.details?.eventId !== auditFilters.eventId) {
        return false;
      }
      return true;
    });
    
    const csvContent = generateAuditCSV(filteredAudit);
    downloadCSV(csvContent, `audit_${new Date().toISOString().split('T')[0]}.csv`);
    
    message.success('Reporte de auditoría exportado');
  }, [auditFilters]);

  const generateAuditCSV = (actions) => {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Detalles', 'ID Elemento'];
    const rows = actions.map(action => [
      new Date(action.timestamp).toLocaleString(),
      action.user,
      action.type,
      JSON.stringify(action.details),
      action.seatId || action.zoneId || 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ===== FUNCIONES DE VALIDACIÓN =====
  const handleValidationSettingsChange = useCallback((key, value) => {
    setValidationSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Aquí se aplicarían los cambios en tiempo real
    message.success('Configuración de validación actualizada');
  }, []);

  // ===== COLUMNAS DE LA TABLA DE AUDITORÍA =====
  const auditColumns = [
    {
      title: 'Acción',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={AuditSystem.getActionColor(type)} icon={AuditSystem.getActionIcon(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Reserva de Asiento', value: 'seat_reserved' },
        { text: 'Cambio de Precio', value: 'price_changed' },
        { text: 'Creación de Zona', value: 'zone_created' },
        { text: 'Cancelación', value: 'seat_cancelled' },
        { text: 'Pago', value: 'payment_processed' },
        { text: 'Login', value: 'user_login' }
      ],
      onFilter: (value, record) => record.type === value
    },
    {
      title: 'Usuario',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space>
          <UserOutlined />
          <Text code>{user}</Text>
        </Space>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{new Date(timestamp).toLocaleString()}</Text>
        </Space>
      ),
      sorter: (a, b) => a.timestamp - b.timestamp
    },
    {
      title: 'Elemento',
      dataIndex: 'seatId',
      key: 'element',
      render: (seatId, record) => (
        <Text code>{seatId || record.zoneId || 'N/A'}</Text>
      )
    },
    {
      title: 'Detalles',
      dataIndex: 'details',
      key: 'details',
      render: (details) => (
        <Tooltip title={JSON.stringify(details, null, 2)}>
          <Button size="small" icon={<EyeOutlined />}>
            Ver
          </Button>
        </Tooltip>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <StarOutlined style={{ color: '#1890ff' }} />
          <span>Funcionalidades Avanzadas de Tickera</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      className="advanced-tickera-modal"
    >
      <div className="space-y-6">
        {/* Tabs de navegación */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'templates', label: '📋 Plantillas', icon: <FileTextOutlined /> },
              { key: 'audit', label: '📊 Auditoría', icon: <AuditOutlined /> },
              { key: 'validation', label: '✅ Validaciones', icon: <CheckCircleOutlined /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de las tabs */}
        <div className="min-h-96">
          {/* Tab de Plantillas */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <Title level={4}>🎭 Plantillas de Eventos</Title>
              
              {/* Plantillas predefinidas */}
              <Card title="Plantillas Predefinidas" className="mb-4">
                <Row gutter={[16, 16]}>
                  {Object.entries(EventTemplates).map(([key, template]) => (
                    <Col xs={24} sm={12} lg={6} key={key}>
                      <Card
                        size="small"
                        hoverable
                        className={`cursor-pointer ${
                          selectedTemplate?.name === template.name ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleTemplateSelect(key)}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">
                            {key === 'theater' && '🎭'}
                            {key === 'concert' && '🎵'}
                            {key === 'sports' && '⚽'}
                            {key === 'conference' && '💼'}
                          </div>
                          <Title level={5} className="mb-1">{template.name}</Title>
                          <Text type="secondary" className="text-xs">
                            {template.description}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* Plantilla personalizada */}
              <Card title="Plantilla Personalizada" className="mb-4">
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Nombre de la Plantilla">
                        <Input
                          value={customTemplate.name}
                          onChange={(e) => setCustomTemplate(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                          placeholder="Mi Plantilla Personalizada"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Descripción">
                        <Input
                          value={customTemplate.description}
                          onChange={(e) => setCustomTemplate(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          placeholder="Descripción de la plantilla"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Tamaño de Asiento (Ancho)">
                        <InputNumber
                          value={customTemplate.seatSize.width}
                          onChange={(value) => setCustomTemplate(prev => ({
                            ...prev,
                            seatSize: { ...prev.seatSize, width: value }
                          }))}
                          min={20}
                          max={100}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Tamaño de Asiento (Alto)">
                        <InputNumber
                          value={customTemplate.seatSize.height}
                          onChange={(value) => setCustomTemplate(prev => ({
                            ...prev,
                            seatSize: { ...prev.seatSize, height: value }
                          }))}
                          min={20}
                          max={100}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Espaciado">
                        <InputNumber
                          value={customTemplate.spacing.x}
                          onChange={(value) => setCustomTemplate(prev => ({
                            ...prev,
                            spacing: { x: value, y: value }
                          }))}
                          min={30}
                          max={80}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />}
                      onClick={handleCustomTemplateSave}
                    >
                      Guardar Plantilla
                    </Button>
                    <Button 
                      type="default"
                      onClick={handleTemplateApply}
                      disabled={!selectedTemplate}
                    >
                      Aplicar Plantilla
                    </Button>
                  </div>
                </Form>
              </Card>
            </div>
          )}

          {/* Tab de Auditoría */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <Title level={4}>📊 Sistema de Auditoría</Title>
              
              {/* Filtros */}
              <Card title="Filtros de Auditoría" className="mb-4">
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item label="Tipo de Acción">
                      <Select
                        value={auditFilters.actionType}
                        onChange={(value) => setAuditFilters(prev => ({
                          ...prev,
                          actionType: value
                        }))}
                      >
                        <Option value="all">Todas las acciones</Option>
                        <Option value="seat_reserved">Reserva de asientos</Option>
                        <Option value="price_changed">Cambios de precio</Option>
                        <Option value="zone_created">Creación de zonas</Option>
                        <Option value="seat_cancelled">Cancelaciones</Option>
                        <Option value="payment_processed">Pagos</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Usuario">
                      <Input
                        value={auditFilters.userId}
                        onChange={(e) => setAuditFilters(prev => ({
                          ...prev,
                          userId: e.target.value
                        }))}
                        placeholder="Filtrar por usuario"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Evento">
                      <Input
                        value={auditFilters.eventId}
                        onChange={(e) => setAuditFilters(prev => ({
                          ...prev,
                          eventId: e.target.value
                        }))}
                        placeholder="Filtrar por evento"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Rango de Fechas">
                      <DatePicker.RangePicker
                        onChange={(dates) => setAuditFilters(prev => ({
                          ...prev,
                          dateRange: dates
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <div className="flex justify-between items-center">
                  <Text type="secondary">
                    Total de acciones: {AuditSystem.actions.length}
                  </Text>
                  <Button 
                    type="primary" 
                    icon={<FileTextOutlined />}
                    onClick={handleAuditExport}
                  >
                    Exportar CSV
                  </Button>
                </div>
              </Card>

              {/* Tabla de auditoría */}
              <Card title="Registro de Auditoría">
                <Table
                  columns={auditColumns}
                  dataSource={AuditSystem.actions}
                  rowKey="timestamp"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} de ${total} acciones`
                  }}
                  size="small"
                />
              </Card>
            </div>
          )}

          {/* Tab de Validaciones */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <Title level={4}>✅ Sistema de Validaciones</Title>
              
              {/* Configuración de validaciones */}
              <Card title="Configuración de Validaciones" className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="Validación en Tiempo Real">
                      <Switch
                        checked={validationSettings.enableRealTimeValidation}
                        onChange={(checked) => handleValidationSettingsChange('enableRealTimeValidation', checked)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Mostrar Advertencias">
                      <Switch
                        checked={validationSettings.showValidationWarnings}
                        onChange={(checked) => handleValidationSettingsChange('showValidationWarnings', checked)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item label="Máximo Asientos por Usuario">
                      <InputNumber
                        value={validationSettings.maxSeatsPerUser}
                        onChange={(value) => handleValidationSettingsChange('maxSeatsPerUser', value)}
                        min={1}
                        max={50}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Máximo Asientos por Transacción">
                      <InputNumber
                        value={validationSettings.maxSeatsPerTransaction}
                        onChange={(value) => handleValidationSettingsChange('maxSeatsPerTransaction', value)}
                        min={1}
                        max={100}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Tiempo de Reserva (minutos)">
                      <InputNumber
                        value={validationSettings.maxReservationTime / 60000}
                        onChange={(value) => handleValidationSettingsChange('maxReservationTime', value * 60000)}
                        min={5}
                        max={60}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="Requerir Información del Cliente">
                      <Switch
                        checked={validationSettings.requireClientInfo}
                        onChange={(checked) => handleValidationSettingsChange('requireClientInfo', checked)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Requerir Método de Pago">
                      <Switch
                        checked={validationSettings.requirePaymentMethod}
                        onChange={(checked) => handleValidationSettingsChange('requirePaymentMethod', checked)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Reglas de validación activas */}
              <Card title="Reglas de Validación Activas">
                <div className="space-y-3">
                  {Object.entries(validationSettings).map(([key, value]) => {
                    if (typeof value === 'boolean') return null;
                    if (key === 'maxReservationTime') {
                      value = `${Math.round(value / 60000)} minutos`;
                    }
                    
                    return (
                      <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <Text className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Text>
                        <Tag color="blue">{value}</Tag>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedTickeraFeatures;
