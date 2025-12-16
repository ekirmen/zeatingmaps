import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Select,
  Input,
  Typography,
  Space,
  Tag,
  Modal,
  Descriptions,
  Timeline,
  message,
  Row,
  Col,
  Divider,
  Statistic,
  Alert
} from '../../utils/antdComponents';
import {
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloudOutlined,
  SafetyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import auditService from '../../services/auditService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const AuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    action: null,
    user: null,
    severity: null,
    resourceType: null
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    critical: 0
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      // Construir filtros para el servicio de auditor­a
      const auditFilters = {};

      if (filters.dateRange && filters.dateRange.length === 2) {
        auditFilters.startDate = filters.dateRange[0].toISOString();
        auditFilters.endDate = filters.dateRange[1].toISOString();
      }

      if (filters.action && filters.action !== 'all') {
        auditFilters.action = filters.action;
      }

      if (filters.user) {
        // Buscar por usuario (necesitar­amos obtener el ID del usuario)
        // Por ahora, buscar por acci³n que contenga el t©rmino
        auditFilters.action = filters.user;
      }

      if (filters.severity && filters.severity !== 'all') {
        auditFilters.severity = filters.severity;
      }

      if (filters.resourceType && filters.resourceType !== 'all') {
        auditFilters.resourceType = filters.resourceType;
      }

      // Cargar logs desde el servicio de auditor­a
      const auditLogs = await auditService.getLogs(auditFilters, 100);

      // Formatear logs para la tabla
      const formattedLogs = auditLogs.map(log => {

        return {
          id: log.id,
          timestamp: new Date(log.created_at),
          user: log.user_id || 'Sistema',
          action: log.action,
          severity: log.severity || 'info',
          description: getActionDescription(log),
          ip: log.ip_address || 'N/A',
          userAgent: log.user_agent || 'N/A',
          details: details,
          metadata: log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : {},
          resourceId: log.resource_id,
          resourceType: log.resource_type,
          sessionId: log.session_id,
          url: log.url,
          referrer: log.referrer
        };
      });

      setLogs(formattedLogs);

      // Calcular estad­sticas
      setStats({
        total: formattedLogs.length,
        errors: formattedLogs.filter(log => log.severity === 'error').length,
        warnings: formattedLogs.filter(log => log.severity === 'warning').length,
        info: formattedLogs.filter(log => log.severity === 'info').length,
        critical: formattedLogs.filter(log => log.severity === 'critical').length
      });

    } catch (error) {
      console.error('Error loading audit logs:', error);
      message.error('Error al cargar los logs de auditor­a');

      // Cargar logs locales como fallback
      try {
        const localLogs = JSON.parse(localStorage.getItem('audit_logs_backup') || '[]');
        if (localLogs.length > 0) {
          message.warning('Usando logs locales como fallback');
          setLogs(localLogs.map(log => ({
            ...log,
            timestamp: new Date(log.created_at || log.timestamp)
          })));
        }
      } catch (localError) {
        console.error('Error loading local logs:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Funci³n helper para obtener descripci³n de acci³n
  const getActionDescription = (log) => {
    const action = log.action || '';
    const details = log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : {};

    if (action.startsWith('payment_')) {
      const status = action.replace('payment_', '');
      return `Pago ${status}: $${details.amount || 'N/A'} - ${details.paymentMethod || 'N/A'}`;
    }

    if (action.startsWith('seat_')) {
      const seatAction = action.replace('seat_', '');
      return `Asiento ${seatAction}: ${details.seatId || 'N/A'} - Funci³n ${details.functionId || 'N/A'}`;
    }

    if (action.startsWith('user_')) {
      const userAction = action.replace('user_', '');
      return `Usuario ${userAction}: ${details.email || details.userId || 'N/A'}`;
    }

    if (action.startsWith('security_')) {
      const securityEvent = action.replace('security_', '');
      return `Evento de seguridad: ${securityEvent}`;
    }

    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        'Timestamp,User,Action,Severity,Description,IP,Resource Type,Resource ID',
        ...logs.map(log =>
          `${log.timestamp.toISOString()},"${log.user}","${log.action}","${log.severity || 'info'}","${log.description}","${log.ip}","${log.resourceType || ''}","${log.resourceId || ''}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success('Logs exportados correctamente');
    } catch (error) {
      console.error('Error exporting logs:', error);
      message.error('Error al exportar los logs');
    }
  };

  const getActionColor = (action) => {
    const colors = {
      login: 'blue',
      logout: 'gray',
      payment_update: 'orange',
      ticket_purchase: 'green',
      user_delete: 'red',
      backup_created: 'purple',
      system: 'cyan'
    };
    return colors[action] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'red'
    };
    return colors[severity] || 'default';
  };

  // Alias para compatibilidad

  const getActionIcon = (action) => {
    const icons = {
      login: <UserOutlined />,
      logout: <UserOutlined />,
      payment_update: <CloudOutlined />,
      ticket_purchase: <SafetyOutlined />,
      user_delete: <SafetyOutlined />,
      backup_created: <ClockCircleOutlined />,
      system: <CloudOutlined />
    };
    return icons[action] || <ClockCircleOutlined />;
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp.toLocaleString(),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'Usuario',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space>
          <UserOutlined />
          {user}
        </Space>
      )
    },
    {
      title: 'Acci³n',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Space>
          {getActionIcon(action)}
          <Tag color={getActionColor(action)}>
            {action.replace('_', ' ').toUpperCase()}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Severidad',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity?.toUpperCase() || 'INFO'}
        </Tag>
      )
    },
    {
      title: 'Descripci³n',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => <Text code>{ip}</Text>
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewLogDetails(record)}
        >
          Ver Detalles
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>Logs de Auditor­a</Title>
        <Text type="secondary">Monitoreo de actividades del sistema</Text>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text strong>Rango de Fechas:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Acci³n:</Text>
            <Select
              value={filters.action}
              onChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="all">Todas las Acciones</Option>
              <Option value="payment_initiated">Pago Iniciado</Option>
              <Option value="payment_completed">Pago Completado</Option>
              <Option value="payment_failed">Pago Fallido</Option>
              <Option value="seat_locked">Asiento Bloqueado</Option>
              <Option value="seat_unlocked">Asiento Desbloqueado</Option>
              <Option value="user_login">Usuario Login</Option>
              <Option value="user_logout">Usuario Logout</Option>
              <Option value="security_login_failed">Intento de Login Fallido</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Nivel:</Text>
            <Select
              value={filters.severity || 'all'}
              onChange={(value) => setFilters(prev => ({ ...prev, severity: value === 'all' ? null : value }))}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="all">Todos los Niveles</Option>
              <Option value="info">Info</Option>
              <Option value="warning">Warning</Option>
              <Option value="error">Error</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Usuario:</Text>
            <Search
              placeholder="Buscar usuario..."
              style={{ marginTop: 8 }}
              onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
            />
          </Col>
        </Row>

        <Divider />

        <Space>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={loadAuditLogs}
            loading={loading}
          >
            Aplicar Filtros
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadAuditLogs}
            loading={loading}
          >
            Actualizar
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportLogs}
          >
            Exportar Logs
          </Button>
        </Space>
      </Card>

      {/* Estad­sticas */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total de Logs"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Errores"
              value={stats.errors}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Advertencias"
              value={stats.warnings}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Cr­ticos"
              value={stats.critical}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Informaci³n"
              value={stats.info}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Logs */}
      <Card title="Logs de Auditor­a">
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} logs`
          }}
        />
      </Card>

      {/* Modal de Detalles */}
      <Modal
        title="Detalles del Log"
        open={showLogModal}
        onCancel={() => setShowLogModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowLogModal(false)}>
            Cerrar
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Descriptions title="Informaci³n General" bordered>
              <Descriptions.Item label="ID" span={3}>
                {selectedLog.id}
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp" span={3}>
                {selectedLog.timestamp.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Usuario" span={3}>
                {selectedLog.user}
              </Descriptions.Item>
              <Descriptions.Item label="Acci³n" span={3}>
                <Tag color={getActionColor(selectedLog.action)}>
                  {selectedLog.action.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Severidad" span={3}>
                <Tag color={getSeverityColor(selectedLog.severity || selectedLog.level)}>
                  {(selectedLog.severity || selectedLog.level || 'info').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              {selectedLog.resourceType && (
                <Descriptions.Item label="Tipo de Recurso" span={3}>
                  {selectedLog.resourceType}
                </Descriptions.Item>
              )}
              {selectedLog.resourceId && (
                <Descriptions.Item label="ID de Recurso" span={3}>
                  <Text code>{selectedLog.resourceId}</Text>
                </Descriptions.Item>
              )}
              {selectedLog.sessionId && (
                <Descriptions.Item label="Session ID" span={3}>
                  <Text code>{selectedLog.sessionId}</Text>
                </Descriptions.Item>
              )}
              {selectedLog.url && (
                <Descriptions.Item label="URL" span={3}>
                  <Text ellipsis style={{ maxWidth: 400 }}>{selectedLog.url}</Text>
                </Descriptions.Item>
              )}
              {selectedLog.referrer && (
                <Descriptions.Item label="Referrer" span={3}>
                  <Text ellipsis style={{ maxWidth: 400 }}>{selectedLog.referrer}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Descripci³n" span={3}>
                {selectedLog.description}
              </Descriptions.Item>
              <Descriptions.Item label="IP" span={3}>
                <Text code>{selectedLog.ip}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="User Agent" span={3}>
                {selectedLog.userAgent}
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.details && (
              <div className="mt-6">
                <Title level={4}>Detalles Adicionales</Title>
                <Timeline>
                  {Object.entries(selectedLog.details).map(([key, value]) => (
                    <Timeline.Item key={key}>
                      <Text strong>{key}:</Text> {JSON.stringify(value)}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;

