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
  Alert,
  Spin,
  message,
  Row,
  Col,
  Divider,
  Statistic
} from 'antd';
import { 
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DatabaseOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const AuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    action: 'all',
    user: '',
    level: 'all'
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Simular logs de auditoría
      const mockLogs = [
        {
          id: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          user: 'admin@example.com',
          action: 'login',
          level: 'info',
          description: 'Usuario inició sesión exitosamente',
          ip: '192.168.1.100',
          userAgent: 'Chrome/91.0.4472.124',
          details: {
            sessionId: 'sess_123456',
            location: 'Madrid, España',
            device: 'Desktop'
          }
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          user: 'admin@example.com',
          action: 'payment_update',
          level: 'warning',
          description: 'Actualización de configuración de pago',
          ip: '192.168.1.100',
          userAgent: 'Chrome/91.0.4472.124',
          details: {
            gateway: 'Stripe',
            changes: ['API Key actualizada', 'Webhook URL modificada'],
            oldValues: { apiKey: 'sk_test_old' },
            newValues: { apiKey: 'sk_test_new' }
          }
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          user: 'user@example.com',
          action: 'ticket_purchase',
          level: 'info',
          description: 'Compra de ticket realizada',
          ip: '192.168.1.101',
          userAgent: 'Firefox/89.0',
          details: {
            eventId: 'evt_123',
            ticketCount: 2,
            amount: 50.00,
            paymentMethod: 'Stripe'
          }
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          user: 'admin@example.com',
          action: 'user_delete',
          level: 'error',
          description: 'Intento de eliminación de usuario fallido',
          ip: '192.168.1.100',
          userAgent: 'Chrome/91.0.4472.124',
          details: {
            targetUser: 'user@example.com',
            reason: 'Permisos insuficientes',
            error: 'Access denied'
          }
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          user: 'system',
          action: 'backup_created',
          level: 'info',
          description: 'Backup automático creado exitosamente',
          ip: '127.0.0.1',
          userAgent: 'System/1.0',
          details: {
            backupId: 'backup_20231201_120000',
            size: '2.5 MB',
            duration: '45s',
            type: 'automated'
          }
        }
      ];

      // Aplicar filtros
      let filteredLogs = mockLogs;

      if (filters.dateRange) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= filters.dateRange[0] && logDate <= filters.dateRange[1];
        });
      }

      if (filters.action !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }

      if (filters.user) {
        filteredLogs = filteredLogs.filter(log => 
          log.user.toLowerCase().includes(filters.user.toLowerCase())
        );
      }

      if (filters.level !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      message.error('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        'Timestamp,User,Action,Level,Description,IP',
        ...logs.map(log => 
          `${log.timestamp.toISOString()},"${log.user}","${log.action}","${log.level}","${log.description}","${log.ip}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
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

  const getLevelColor = (level) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'red'
    };
    return colors[level] || 'default';
  };

  const getActionIcon = (action) => {
    const icons = {
      login: <UserOutlined />,
      logout: <UserOutlined />,
      payment_update: <DatabaseOutlined />,
      ticket_purchase: <SecurityScanOutlined />,
      user_delete: <SecurityScanOutlined />,
      backup_created: <ClockCircleOutlined />,
      system: <DatabaseOutlined />
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
      title: 'Acción',
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
      title: 'Nivel',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag color={getLevelColor(level)}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Descripción',
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
        <Title level={2}>Logs de Auditoría</Title>
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
            <Text strong>Acción:</Text>
            <Select
              value={filters.action}
              onChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="all">Todas las Acciones</Option>
              <Option value="login">Login</Option>
              <Option value="logout">Logout</Option>
              <Option value="payment_update">Actualización de Pago</Option>
              <Option value="ticket_purchase">Compra de Ticket</Option>
              <Option value="user_delete">Eliminación de Usuario</Option>
              <Option value="backup_created">Backup Creado</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Nivel:</Text>
            <Select
              value={filters.level}
              onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
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
            icon={<DownloadOutlined />}
            onClick={exportLogs}
          >
            Exportar Logs
          </Button>
        </Space>
      </Card>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total de Logs"
              value={logs.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Errores"
              value={logs.filter(log => log.level === 'error').length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Advertencias"
              value={logs.filter(log => log.level === 'warning').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Información"
              value={logs.filter(log => log.level === 'info').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Logs */}
      <Card title="Logs de Auditoría">
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
            <Descriptions title="Información General" bordered>
              <Descriptions.Item label="ID" span={3}>
                {selectedLog.id}
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp" span={3}>
                {selectedLog.timestamp.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Usuario" span={3}>
                {selectedLog.user}
              </Descriptions.Item>
              <Descriptions.Item label="Acción" span={3}>
                <Tag color={getActionColor(selectedLog.action)}>
                  {selectedLog.action.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nivel" span={3}>
                <Tag color={getLevelColor(selectedLog.level)}>
                  {selectedLog.level.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Descripción" span={3}>
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