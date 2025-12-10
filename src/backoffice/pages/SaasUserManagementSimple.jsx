import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
  Tag, 
  Space, 
  Popconfirm,
  Row,
  Col,
  Typography,
  Divider,
  Badge,
  Tooltip,
  Transfer,
  Tabs
} from '../../utils/antdComponents';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  CrownOutlined,
  SettingOutlined,
  TeamOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useRole } from '../components/RoleBasedAccess';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const SaasUserManagementSimple = () => {
  const { hasPermission } = useRole();
  const [usuarios, setUsuarios] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [targetKeys, setTargetKeys] = useState([]);

  // Definir roles del sistema SaaS
  const saasRoles = [
    { 
      value: 'super_admin', 
      label: 'Super Administrador', 
      color: 'red', 
      icon: <CrownOutlined />,
      level: 100,
      description: 'Acceso completo al sistema SaaS'
    },
    { 
      value: 'admin_sistema', 
      label: 'Administrador Sistema', 
      color: 'orange', 
      icon: <SettingOutlined />,
      level: 80,
      description: 'Administraci³n completa de tenants'
    },
    { 
      value: 'gerente_sistema', 
      label: 'Gerente Sistema', 
      color: 'blue', 
      icon: <SettingOutlined />,
      level: 60,
      description: 'Gesti³n de tenants y soporte'
    },
    { 
      value: 'soporte_sistema', 
      label: 'Soporte Sistema', 
      color: 'green', 
      icon: <TeamOutlined />,
      level: 40,
      description: 'Solo soporte t©cnico'
    },
    { 
      value: 'visualizador_sistema', 
      label: 'Visualizador Sistema', 
      color: 'purple', 
      icon: <EyeOutlined />,
      level: 20,
      description: 'Solo lectura de informaci³n'
    }
  ];

  useEffect(() => {
    loadUsuarios();
    loadTenants();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      // Simular carga de usuarios
      setUsuarios([]);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      message.error('Error al cargar usuarios del sistema');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      // Simular carga de tenants
      const tenantOptions = [
        { key: '1', title: 'Tenant 1', description: 'tenant1.com' },
        { key: '2', title: 'Tenant 2', description: 'tenant2.com' },
        { key: '3', title: 'Tenant 3', description: 'tenant3.com' }
      ];
      setTenants(tenantOptions);
    } catch (error) {
      console.error('Error loading tenants:', error);
      message.error('Error al cargar tenants');
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setTargetKeys([]);
    setIsModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      nombre: user.nombre,
      login: user.login,
      email: user.email,
      telefono: user.telefono,
      role: user.role,
      activo: user.isActive
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      message.success('Usuario guardado correctamente');
      setIsModalVisible(false);
      form.resetFields();
      setTargetKeys([]);
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Error al guardar usuario');
    }
  };

  const getRoleInfo = (role) => {
    return saasRoles.find(r => r.value === role) || { 
      value: role, 
      label: role, 
      color: 'default', 
      icon: <UserOutlined />,
      level: 0,
      description: 'Rol no definido'
    };
  };

  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <div>
            <div><strong>{record.displayName}</strong></div>
            <Text type="secondary">{record.displayEmail}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleInfo = getRoleInfo(role);
        return (
          <Space direction="vertical" size="small">
            <Tag color={roleInfo.color} icon={roleInfo.icon}>
              {roleInfo.label}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Nivel {roleInfo.level}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_, record) => (
        <Badge 
          status={record.isActive ? 'success' : 'error'} 
          text={record.isActive ? 'Activo' : 'Inactivo'} 
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar usuario">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Verificar permisos
  if (!hasPermission('saas_roles')) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Acceso Denegado</Title>
        <Text>No tienes permisos para acceder a la gesti³n de usuarios del sistema.</Text>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Gesti³n de Usuarios del Sistema</Title>
            <Text type="secondary">Administra los usuarios del sistema SaaS y sus asignaciones de tenants</Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Crear Usuario del Sistema
            </Button>
          </Col>
        </Row>
      </div>

      {/* Informaci³n de Roles del Sistema */}
      <Card className="mb-6">
        <Title level={4}>Roles del Sistema SaaS</Title>
        <Row gutter={[16, 16]}>
          {saasRoles.map(role => (
            <Col key={role.value} xs={24} sm={12} md={8} lg={6}>
              <div style={{ 
                padding: '16px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px',
                textAlign: 'center',
                background: role.level >= 80 ? '#fff2e8' : role.level >= 60 ? '#e6f7ff' : '#f6ffed'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {role.icon}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {role.label}
                </div>
                <Tag color={role.color} size="small">
                  Nivel {role.level}
                </Tag>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  {role.description}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        <Table
          columns={columns}
          dataSource={usuarios}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} usuarios del sistema`
          }}
        />
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal
        title={editingUser ? 'Editar Usuario del Sistema' : 'Crear Usuario del Sistema'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setTargetKeys([]);
        }}
        footer={null}
        width={800}
      >
        <Tabs defaultActiveKey="user-info">
          <TabPane tab="Informaci³n del Usuario" key="user-info">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="nombre"
                    label="Nombre Completo"
                    rules={[{ required: true, message: 'El nombre es requerido' }]}
                  >
                    <Input placeholder="Nombre completo" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="login"
                    label="Email/Login"
                    rules={[
                      { required: true, message: 'El email es requerido' },
                      { type: 'email', message: 'Debe ser un email v¡lido' }
                    ]}
                  >
                    <Input placeholder="usuario@ejemplo.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="telefono"
                    label="Tel©fono"
                  >
                    <Input placeholder="+1 234 567 8900" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="role"
                    label="Rol del Sistema"
                    rules={[{ required: true, message: 'El rol es requerido' }]}
                  >
                    <Select placeholder="Seleccionar rol del sistema">
                      {saasRoles.map(role => (
                        <Option key={role.value} value={role.value}>
                          <Space>
                            {role.icon}
                            <span>{role.label} (Nivel {role.level})</span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="activo"
                label="Estado"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Activo" 
                  unCheckedChildren="Inactivo" 
                />
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Asignaci³n de Tenants" key="tenant-assignment">
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Selecciona los tenants que este usuario puede gestionar:</Text>
            </div>
            <Transfer
              dataSource={tenants}
              titles={['Tenants Disponibles', 'Tenants Asignados']}
              targetKeys={targetKeys}
              onChange={setTargetKeys}
              render={item => item.title}
              listStyle={{
                width: 300,
                height: 300,
              }}
            />
          </TabPane>
        </Tabs>

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => {
              setIsModalVisible(false);
              form.resetFields();
              setTargetKeys([]);
            }}>
              Cancelar
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default SaasUserManagementSimple;


