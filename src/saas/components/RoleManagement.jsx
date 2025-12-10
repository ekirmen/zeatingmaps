import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, message, Alert, Space, Typography, Row, Col, Table, Modal, Badge, Tag, Tabs, Statistic } from '../../utils/antdComponents';
import { 
  TeamOutlined, 
  SettingOutlined, 
  UserOutlined, 
  LockOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import accessControlService from '../services/accessControlService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const RoleManagement = () => {
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [roleStats, setRoleStats] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('roles');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesData, statsData] = await Promise.all([
        accessControlService.getAllRoles(),
        accessControlService.getRoleStats()
      ]);
      setRoles(rolesData);
      setRoleStats(statsData);
    } catch (error) {
      message.error('Error al cargar datos de roles');
    }
  };

  const loadUsersByRole = async (role) => {
    try {
      const usersData = await accessControlService.getUsersByRole(role);
      setUsers(usersData);
    } catch (error) {
      message.error('Error al cargar usuarios del rol');
    }
  };

  const handleAssignRole = async (values) => {
    try {
      setLoading(true);
      await accessControlService.assignRole(values.user_id, values.role, values.custom_permissions);
      message.success('Rol asignado exitosamente');
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(`Error al asignar rol: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (values) => {
    try {
      setLoading(true);
      await accessControlService.createCustomRole(values);
      message.success('Rol personalizado creado exitosamente');
      roleForm.resetFields();
      setRoleModalVisible(false);
      loadData();
    } catch (error) {
      message.error(`Error al crear rol: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    loadUsersByRole(role.id);
  };

  const getRoleLevelColor = (level) => {
    if (level >= 80) return 'red';
    if (level >= 60) return 'orange';
    if (level >= 40) return 'blue';
    if (level >= 20) return 'green';
    return 'default';
  };

  const getRoleBadge = (role) => {
    const stats = roleStats[role.id] || 0;
    return (
      <Badge 
        count={stats} 
        style={{ backgroundColor: getRoleLevelColor(role.level) }}
      />
    );
  };

  const renderRoleStats = () => (
    <Row gutter={[16, 16]}>
      {Object.entries(roleStats).map(([role, count]) => (
        <Col xs={24} sm={12} lg={6} key={role}>
          <Card>
            <Statistic
              title={role.replace('_', ' ').toUpperCase()}
              value={count}
              prefix={<UserOutlined />}
              valueStyle={{ color: getRoleLevelColor(roles.find(r => r.id === role)?.level || 0) }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderRolesTable = () => {
    const columns = [
      {
        title: 'Rol',
        dataIndex: 'name',
        key: 'name',
        render: (name, record) => (
          <Space>
            <Text strong>{name}</Text>
            {getRoleBadge(record)}
            {record.is_system && <Tag color="blue">Sistema</Tag>}
          </Space>
        ),
      },
      {
        title: 'Nivel',
        dataIndex: 'level',
        key: 'level',
        render: (level) => (
          <Tag color={getRoleLevelColor(level)}>
            Nivel {level}
          </Tag>
        ),
      },
      {
        title: 'Descripci³n',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Permisos',
        dataIndex: 'permissions',
        key: 'permissions',
        render: (permissions) => (
          <Space wrap>
            {permissions.slice(0, 3).map(permission => (
              <Tag key={permission} size="small">
                {permission === '*' ? 'Todos' : permission}
              </Tag>
            ))}
            {permissions.length > 3 && (
              <Tag size="small">+{permissions.length - 3} m¡s</Tag>
            )}
          </Space>
        ),
      },
      {
        title: 'Acciones',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleRoleSelect(record)}
            >
              Ver Usuarios
            </Button>
            {!record.is_system && (
              <Button 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => message.warning('Funci³n de eliminaci³n no implementada')}
              >
                Eliminar
              </Button>
            )}
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        pagination={false}
        onRow={(record) => ({
          onClick: () => handleRoleSelect(record),
          style: { cursor: 'pointer' }
        })}
      />
    );
  };

  const renderUsersTable = () => {
    const columns = [
      {
        title: 'Usuario',
        dataIndex: 'nombre',
        key: 'nombre',
        render: (nombre, record) => (
          <Space>
            <UserOutlined />
            <Text strong>{nombre}</Text>
          </Space>
        ),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Rol',
        dataIndex: 'role',
        key: 'role',
        render: (role) => (
          <Tag color={getRoleLevelColor(roles.find(r => r.id === role)?.level || 0)}>
            {role.replace('_', ' ').toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Fecha de Registro',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date) => new Date(date).toLocaleDateString(),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  const renderAssignRoleForm = () => (
    <Form form={form} layout="vertical" onFinish={handleAssignRole}>
      <Form.Item
        name="user_id"
        label="Usuario"
        rules={[{ required: true, message: 'Seleccione un usuario' }]}
      >
        <Select placeholder="Seleccionar usuario">
          {/* Aqu­ se cargar­an los usuarios disponibles */}
        </Select>
      </Form.Item>

      <Form.Item
        name="role"
        label="Rol"
        rules={[{ required: true, message: 'Seleccione un rol' }]}
      >
        <Select placeholder="Seleccionar rol">
          {roles.map(role => (
            <Option key={role.id} value={role.id}>
              {role.name} (Nivel {role.level})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="custom_permissions"
        label="Permisos Adicionales"
      >
        <Select mode="multiple" placeholder="Seleccionar permisos adicionales">
          {Object.entries(accessControlService.permissions).map(([key, description]) => (
            <Option key={key} value={key}>
              {description}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );

  const renderCreateRoleForm = () => (
    <Form form={roleForm} layout="vertical" onFinish={handleCreateRole}>
      <Form.Item
        name="name"
        label="Nombre del Rol"
        rules={[{ required: true, message: 'Nombre del rol requerido' }]}
      >
        <Input placeholder="Ej: Editor Avanzado" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Descripci³n"
        rules={[{ required: true, message: 'Descripci³n requerida' }]}
      >
        <Input.TextArea placeholder="Descripci³n del rol y sus responsabilidades" />
      </Form.Item>

      <Form.Item
        name="level"
        label="Nivel de Acceso"
        rules={[{ required: true, message: 'Nivel requerido' }]}
      >
        <Select placeholder="Seleccionar nivel">
          <Option value={90}>90 - Administrador Senior</Option>
          <Option value={70}>70 - Administrador</Option>
          <Option value={50}>50 - Gerente</Option>
          <Option value={30}>30 - Editor</Option>
          <Option value={10}>10 - Visualizador</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="permissions"
        label="Permisos"
        rules={[{ required: true, message: 'Seleccione al menos un permiso' }]}
      >
        <Select mode="multiple" placeholder="Seleccionar permisos">
          {Object.entries(accessControlService.permissions).map(([key, description]) => (
            <Option key={key} value={key}>
              {description}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Title level={2}>
            <TeamOutlined style={{ marginRight: '8px' }} />
            Gesti³n de Roles y Permisos
          </Title>
          <Text type="secondary">
            Administra los roles de usuario y sus permisos de acceso al sistema
          </Text>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Space>
                <TeamOutlined />
                <span>Roles</span>
              </Space>
            } 
            key="roles"
          >
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setRoleModalVisible(true)}
                >
                  Crear Rol Personalizado
                </Button>
                <Button 
                  icon={<SecurityScanOutlined />}
                  onClick={() => message.info('Funci³n de exportaci³n no implementada')}
                >
                  Exportar Configuraci³n
                </Button>
              </Space>
            </div>
            {renderRolesTable()}
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <UserOutlined />
                <span>Asignar Roles</span>
              </Space>
            } 
            key="assign"
          >
            <Alert
              message="Asignaci³n de Roles"
              description="Asigna roles a usuarios espec­ficos y configura permisos personalizados."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {renderAssignRoleForm()}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => form.submit()}
                loading={loading}
              >
                Asignar Rol
              </Button>
            </div>
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <LockOutlined />
                <span>Usuarios por Rol</span>
                {selectedRole && (
                  <Badge count={users.length} style={{ backgroundColor: '#52c41a' }} />
                )}
              </Space>
            } 
            key="users"
          >
            {selectedRole ? (
              <div>
                <Alert
                  message={`Usuarios con rol: ${selectedRole.name}`}
                  description={`Nivel ${selectedRole.level} - ${selectedRole.description}`}
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                {renderUsersTable()}
              </div>
            ) : (
              <Alert
                message="Selecciona un rol"
                description="Haz clic en un rol de la tabla para ver sus usuarios."
                type="warning"
                showIcon
              />
            )}
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <SettingOutlined />
                <span>Estad­sticas</span>
              </Space>
            } 
            key="stats"
          >
            <Title level={4}>Distribuci³n de Usuarios por Rol</Title>
            {renderRoleStats()}
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal para crear rol personalizado */}
      <Modal
        title="Crear Rol Personalizado"
        visible={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        footer={null}
        width={600}
      >
        {renderCreateRoleForm()}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setRoleModalVisible(false)}>
              Cancelar
            </Button>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => roleForm.submit()}
              loading={loading}
            >
              Crear Rol
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;


