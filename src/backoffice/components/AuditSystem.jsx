import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Timeline,
  Avatar,
  Tooltip,
  message,
  Drawer,
  Descriptions,
  Divider,
  Select,
  DatePicker,
  Input,
  Badge
} from '../../utils/antdComponents';
import {
  AuditOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  HistoryOutlined,
  UserOutlined,
  DatabaseOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const AuditSystem = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    action: 'all',
    severity: 'all',
    dateRange: null,
    searchTerm: '',
    tenant: 'all'
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // La tabla audit_logs no existe, usar datos simulados
      // Datos simulados para auditor­a
      const simulatedLogs = [
        {
          id: 1,
          action: 'login',
          details: 'Usuario inici³ sesi³n en el sistema',
          severity: 'info',
          tenant_id: '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
          created_at: new Date().toISOString(),
          tenants: { company_name: 'Sistema Principal', subdomain: 'sistema' },
          admin_user: { email: 'admin@veneventos.com' }
        },
        {
          id: 2,
          action: 'tenant_created',
          details: 'Nuevo tenant creado: ZeatingMaps',
          severity: 'info',
          tenant_id: '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          tenants: { company_name: 'Sistema Principal', subdomain: 'sistema' },
          admin_user: { email: 'admin@veneventos.com' }
        },
        {
          id: 3,
          action: 'backup_created',
          details: 'Backup autom¡tico del sistema completado',
          severity: 'info',
          tenant_id: '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          tenants: { company_name: 'Sistema Principal', subdomain: 'sistema' },
          admin_user: { email: 'admin@veneventos.com' }
        }
      ];

      setAuditLogs(simulatedLogs);

    } catch (error) {
      console.error('Error loading audit logs:', error);
      message.error('Error al cargar logs de auditor­a');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setDetailDrawerVisible(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'error': return 'orange';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <PlusOutlined />;
      case 'update': return <EditOutlined />;
      case 'delete': return <DeleteOutlined />;
      case 'login': return <UserOutlined />;
      case 'backup_created': return <DatabaseOutlined />;
      case 'backup_restored': return <DatabaseOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'create': return 'Crear';
      case 'update': return 'Actualizar';
      case 'delete': return 'Eliminar';
      case 'login': return 'Inicio de Sesi³n';
      case 'backup_created': return 'Backup Creado';
      case 'backup_restored': return 'Backup Restaurado';
      case 'tenant_created': return 'Tenant Creado';
      case 'tenant_updated': return 'Tenant Actualizado';
      case 'support_ticket_created': return 'Ticket Creado';
      case 'support_ticket_updated': return 'Ticket Actualizado';
      default: return action;
    }
  };

  const columns = [
    {
      title: 'Acci³n',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Space>
          {getActionIcon(action)}
          <span>{getActionText(action)}</span>
        </Space>
      ),
    },
    {
      title: 'Severidad',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenants',
      key: 'tenant',
      render: (tenant) => (
        tenant ? (
          <div>
            <div>{tenant.company_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {tenant.subdomain}.ticketera.com
            </div>
          </div>
        ) : (
          <Text type="secondary">Sistema</Text>
        )
      ),
    },
    {
      title: 'Administrador',
      dataIndex: 'admin_user',
      key: 'admin_user',
      render: (admin) => (
        <div>
          {admin ? (
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{admin.email}</span>
            </Space>
          ) : (
            <Text type="secondary">Sistema</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Detalles',
      dataIndex: 'details',
      key: 'details',
      render: (details) => (
        <Tooltip title={details}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {details}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip) => (
        <Text code>{ip || 'N/A'}</Text>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <div>
          <div>{new Date(date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(date).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewLog(record)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <AuditOutlined />
            <span>Sistema de Auditor­a</span>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="Buscar en logs..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              onSearch={() => loadAuditLogs()}
              allowClear
              style={{ width: 200 }}
            />
            <Select
              placeholder="Acci³n"
              value={filters.action}
              onChange={(value) => setFilters({...filters, action: value})}
              style={{ width: 120 }}
            >
              <Option value="all">Todas</Option>
              <Option value="create">Crear</Option>
              <Option value="update">Actualizar</Option>
              <Option value="delete">Eliminar</Option>
              <Option value="login">Login</Option>
              <Option value="backup_created">Backup Creado</Option>
              <Option value="backup_restored">Backup Restaurado</Option>
            </Select>
            <Select
              placeholder="Severidad"
              value={filters.severity}
              onChange={(value) => setFilters({...filters, severity: value})}
              style={{ width: 120 }}
            >
              <Option value="all">Todas</Option>
              <Option value="info">Info</Option>
              <Option value="warning">Warning</Option>
              <Option value="error">Error</Option>
              <Option value="critical">Critical</Option>
            </Select>
            <Button
              icon={<ExportOutlined />}
              onClick={() => message.info('Exportar logs de auditor­a')}
            >
              Exportar
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={auditLogs}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} logs`
          }}
        />
      </Card>

      {/* Drawer para ver detalles del log */}
      <Drawer
        title={`Log de Auditor­a #${selectedLog?.id?.slice(0, 8)}`}
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        visible={detailDrawerVisible}
      >
        {selectedLog && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Space>
                  {getActionIcon(selectedLog.action)}
                  <Title level={4}>{getActionText(selectedLog.action)}</Title>
                </Space>
                <Tag color={getSeverityColor(selectedLog.severity)}>
                  {selectedLog.severity?.toUpperCase()}
                </Tag>
              </div>
              <Paragraph>{selectedLog.details}</Paragraph>
            </Card>

            <Divider />

            <Descriptions title="Informaci³n del Log" bordered column={1}>
              <Descriptions.Item label="ID del Log">
                {selectedLog.id}
              </Descriptions.Item>
              <Descriptions.Item label="Acci³n">
                {getActionText(selectedLog.action)}
              </Descriptions.Item>
              <Descriptions.Item label="Severidad">
                <Tag color={getSeverityColor(selectedLog.severity)}>
                  {selectedLog.severity?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tenant">
                {selectedLog.tenants ? (
                  <div>
                    <div>{selectedLog.tenants.company_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {selectedLog.tenants.subdomain}.ticketera.com
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">Sistema</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Administrador">
                {selectedLog.admin_user ? (
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>{selectedLog.admin_user.email}</span>
                  </Space>
                ) : (
                  <Text type="secondary">Sistema</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="IP Address">
                <Text code>{selectedLog.ip_address || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                <Text code style={{ fontSize: '12px' }}>
                  {selectedLog.user_agent || 'N/A'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo de Recurso">
                {selectedLog.resource_type || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="ID del Recurso">
                {selectedLog.resource_id || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha y Hora">
                {new Date(selectedLog.created_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {(selectedLog.old_values || selectedLog.new_values) && (
              <>
                <Divider />
                <Title level={5}>Cambios Realizados</Title>

                {selectedLog.old_values && (
                  <Card size="small" style={{ marginBottom: 8 }}>
                    <Title level={6}>Valores Anteriores</Title>
                    <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </Card>
                )}

                {selectedLog.new_values && (
                  <Card size="small">
                    <Title level={6}>Valores Nuevos</Title>
                    <pre style={{ fontSize: '12px', backgroundColor: '#f0f8ff', padding: 8, borderRadius: 4 }}>
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AuditSystem;


