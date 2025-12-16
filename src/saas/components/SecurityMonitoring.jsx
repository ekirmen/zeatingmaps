import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Badge, Alert, Statistic, Row, Col, Timeline, Select, DatePicker, Drawer } from '../../utils/antdComponents';
import {
  SecurityScanOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ShieldOutlined,
  LockOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SecurityMonitoring = () => {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    eventType: 'all',
    dateRange: null
  });

  const severityColors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'purple'
  };

  const severityIcons = {
    low: <CheckCircleOutlined />,
    medium: <WarningOutlined />,
    high: <ExclamationCircleOutlined />,
    critical: <SecurityScanOutlined />
  };

  useEffect(() => {
    loadSecurityEvents();
    loadSecurityAlerts();
  }, [filters]);

  const loadSecurityEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('security_events')
        .select(`
          *,
          tenants:tenant_id(name),
          users:sender_id(email, user_metadata)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }

      if (filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        query = query
          .gte('created_at', filters.dateRange[0].toISOString())
          .lte('created_at', filters.dateRange[1].toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Error loading security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select(`
          *,
          tenants:tenant_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setSecurityAlerts(data || []);
    } catch (error) {
      console.error('Error loading security alerts:', error);
    }
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'login_failed': 'Intento de login fallido',
      'suspicious_login': 'Login sospechoso',
      'unauthorized_access': 'Acceso no autorizado',
      'data_breach_attempt': 'Intento de violaci³n de datos',
      'unusual_activity': 'Actividad inusual',
      'password_brute_force': 'Ataque de fuerza bruta',
      'api_abuse': 'Abuso de API',
      'file_upload_attack': 'Ataque de carga de archivos',
      'sql_injection_attempt': 'Intento de inyecci³n SQL',
      'xss_attempt': 'Intento de XSS'
    };

    return labels[eventType] || eventType;
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'login_failed': <LockOutlined />,
      'suspicious_login': <ExclamationCircleOutlined />,
      'unauthorized_access': <SecurityScanOutlined />,
      'data_breach_attempt': <ShieldOutlined />,
      'unusual_activity': <WarningOutlined />,
      'password_brute_force': <LockOutlined />,
      'api_abuse': <GlobalOutlined />,
      'file_upload_attack': <SecurityScanOutlined />,
      'sql_injection_attempt': <SecurityScanOutlined />,
      'xss_attempt': <SecurityScanOutlined />
    };
    return icons[eventType] || <SecurityScanOutlined />;
  };

  const eventColumns = [
    {
      title: 'Tipo de Evento',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (eventType) => (
        <Space>
          {getEventIcon(eventType)}
          <Text>{getEventTypeLabel(eventType)}</Text>
        </Space>
      ),
    },
    {
      title: 'Severidad',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={severityColors[severity]} icon={severityIcons[severity]}>
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenants',
      key: 'tenant',
      render: (tenant) => tenant?.name || 'N/A',
    },
    {
      title: 'Usuario',
      dataIndex: 'users',
      key: 'user',
      render: (user) => user?.email || 'Sistema',
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip) => <Text code>{ip || 'N/A'}</Text>,
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString('es-ES'),
    },
    {
      title: 'Estado',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (resolved) => (
        <Tag color={resolved ? 'green' : 'red'}>
          {resolved ? 'Resuelto' : 'Pendiente'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedEvent(record);
            setDrawerVisible(true);
          }}
        >
          Ver detalles
        </Button>
      ),
    },
  ];

  const alertColumns = [
    {
      title: 'Alerta',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space>
          <Badge status={record.acknowledged ? 'success' : 'error'} />
          <Text strong={!record.acknowledged}>{title}</Text>
        </Space>
      ),
    },
    {
      title: 'Severidad',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={severityColors[severity]} icon={severityIcons[severity]}>
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenants',
      key: 'tenant',
      render: (tenant) => tenant?.name || 'N/A',
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString('es-ES'),
    },
  ];

  const getSecurityStats = () => {
    const total = securityEvents.length;
    const critical = securityEvents.filter(e => e.severity === 'critical').length;
    const high = securityEvents.filter(e => e.severity === 'high').length;
    const unresolved = securityEvents.filter(e => !e.resolved).length;
    const activeAlerts = securityAlerts.filter(a => !a.acknowledged).length;

    return { total, critical, high, unresolved, activeAlerts };
  };

  const stats = getSecurityStats();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SecurityScanOutlined style={{ marginRight: '8px' }} />
          Monitoreo de Seguridad
        </Title>
        <Text type="secondary">
          Supervisa eventos de seguridad y alertas en tiempo real
        </Text>
      </div>

      {/* Alertas cr­ticas */}
      {stats.activeAlerts > 0 && (
        <Alert
          message={`${stats.activeAlerts} alertas de seguridad activas`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Estad­sticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Eventos"
              value={stats.total}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Cr­ticos"
              value={stats.critical}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Alto Riesgo"
              value={stats.high}
              valueStyle={{ color: '#d4380d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sin Resolver"
              value={stats.unresolved}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Select
            value={filters.severity}
            onChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
            style={{ width: 150 }}
          >
            <Option value="all">Todas las severidades</Option>
            <Option value="low">Baja</Option>
            <Option value="medium">Media</Option>
            <Option value="high">Alta</Option>
            <Option value="critical">Cr­tica</Option>
          </Select>
          <Select
            value={filters.eventType}
            onChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}
            style={{ width: 200 }}
          >
            <Option value="all">Todos los tipos</Option>
            <Option value="login_failed">Login fallido</Option>
            <Option value="suspicious_login">Login sospechoso</Option>
            <Option value="unauthorized_access">Acceso no autorizado</Option>
            <Option value="data_breach_attempt">Intento de violaci³n</Option>
            <Option value="unusual_activity">Actividad inusual</Option>
          </Select>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
          />
          <Button onClick={loadSecurityEvents}>
            Actualizar
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Eventos de Seguridad */}
        <Col xs={24} lg={16}>
          <Card title="Eventos de Seguridad Recientes">
            <Table
              columns={eventColumns}
              dataSource={securityEvents}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        {/* Alertas Activas */}
        <Col xs={24} lg={8}>
          <Card title="Alertas Activas">
            <Table
              columns={alertColumns}
              dataSource={securityAlerts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Drawer de detalles */}
      <Drawer
        title="Detalles del Evento de Seguridad"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedEvent && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Informaci³n General</Title>
                <Space direction="vertical">
                  <Text><strong>Tipo:</strong> {getEventTypeLabel(selectedEvent.event_type)}</Text>
                  <Text><strong>Severidad:</strong>
                    <Tag color={severityColors[selectedEvent.severity]} style={{ marginLeft: 8 }}>
                      {selectedEvent.severity.toUpperCase()}
                    </Tag>
                  </Text>
                  <Text><strong>Descripci³n:</strong> {selectedEvent.description}</Text>
                  <Text><strong>Fecha:</strong> {new Date(selectedEvent.created_at).toLocaleString('es-ES')}</Text>
                </Space>
              </div>

              <div>
                <Title level={4}>Informaci³n del Usuario</Title>
                <Space direction="vertical">
                  <Text><strong>Usuario:</strong> {selectedEvent.users?.email || 'Sistema'}</Text>
                  <Text><strong>Tenant:</strong> {selectedEvent.tenants?.name || 'N/A'}</Text>
                  <Text><strong>IP:</strong> <Text code>{selectedEvent.ip_address || 'N/A'}</Text></Text>
                  <Text><strong>User Agent:</strong> {selectedEvent.user_agent || 'N/A'}</Text>
                </Space>
              </div>

              {selectedEvent.metadata && (
                <div>
                  <Title level={4}>Metadatos</Title>
                  <pre style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <Title level={4}>Estado</Title>
                <Tag color={selectedEvent.resolved ? 'green' : 'red'}>
                  {selectedEvent.resolved ? 'Resuelto' : 'Pendiente'}
                </Tag>
                {selectedEvent.resolved && (
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">
                      Resuelto por: {selectedEvent.resolved_by} el {new Date(selectedEvent.resolved_at).toLocaleString('es-ES')}
                    </Text>
                  </div>
                )}
              </div>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SecurityMonitoring;


