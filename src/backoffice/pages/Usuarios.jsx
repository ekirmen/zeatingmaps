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
  Checkbox
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  CrownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useRole } from '../components/RoleBasedAccess';

const { Title, Text } = Typography;
const { Option } = Select;

const Usuarios = () => {
  const { hasPermission, isAdmin } = useRole();
  const [usuarios, setUsuarios] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRecintos, setSelectedRecintos] = useState([]);
  const [form] = Form.useForm();

  // Definir roles disponibles
  const roles = [
    { value: 'admin', label: 'Administrador', color: 'red', icon: <CrownOutlined /> },
    { value: 'gerente', label: 'Gerente', color: 'orange', icon: <SettingOutlined /> },
    { value: 'taquilla', label: 'Taquilla', color: 'blue', icon: <UserOutlined /> },
    { value: 'call_center', label: 'Call Center', color: 'green', icon: <UserOutlined /> },
    { value: 'agencias', label: 'Agencias', color: 'purple', icon: <UserOutlined /> },
    { value: 'contenido_marketing', label: 'Contenido/Marketing', color: 'cyan', icon: <UserOutlined /> },
    { value: 'atencion_cliente', label: 'Atención al Cliente', color: 'magenta', icon: <UserOutlined /> },
    { value: 'vendedor_externo', label: 'Vendedor Externo', color: 'lime', icon: <UserOutlined /> },
    { value: 'reportes', label: 'Reportes', color: 'geekblue', icon: <UserOutlined /> }
  ];

  useEffect(() => {
    loadUsuarios();
    loadRecintos();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      
      // Obtener usuarios desde profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar usuarios para mostrar información relevante
      const processedUsers = (data || []).map(user => ({
        ...user,
        role: user.permisos?.role || user.role || 'usuario_store',
        isActive: user.activo !== false,
        displayName: user.nombre || user.login || 'Sin nombre',
        displayEmail: user.login || user.email || 'Sin email'
      }));

      setUsuarios(processedUsers);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      message.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRecintos = async () => {
    try {
      const { data, error } = await supabase
        .from('recintos')
        .select('id, nombre, direccion, ciudad')
        .order('nombre');

      if (error) throw error;
      setRecintos(data || []);
    } catch (error) {
      console.error('Error loading recintos:', error);
      message.error('Error al cargar recintos');
    }
  };

  const loadUserRecintos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_recinto_assignments')
        .select('recinto_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(item => String(item.recinto_id));
    } catch (error) {
      console.error('Error loading user recintos:', error);
      return [];
    }
  };

  const saveUserRecintos = async (userId, recintoIds) => {
    try {
      // Eliminar asignaciones existentes
      await supabase
        .from('user_recinto_assignments')
        .delete()
        .eq('user_id', userId);

      // Crear nuevas asignaciones
      if (recintoIds.length > 0) {
        const assignments = recintoIds.map(recintoId => ({
          user_id: userId,
          recinto_id: parseInt(recintoId) // Convertir string a integer
        }));

        const { error } = await supabase
          .from('user_recinto_assignments')
          .insert(assignments);

        if (error) throw error;
      }

      message.success('Recintos asignados correctamente');
    } catch (error) {
      console.error('Error saving user recintos:', error);
      message.error('Error al asignar recintos');
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setSelectedRecintos([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = async (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      nombre: user.nombre,
      login: user.login,
      email: user.email,
      telefono: user.telefono,
      role: user.role,
      activo: user.isActive
    });
    
    // Cargar recintos asignados al usuario
    const userRecintos = await loadUserRecintos(user.id);
    setSelectedRecintos(userRecintos);
    
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      message.success('Usuario eliminado correctamente');
      loadUsuarios();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Error al eliminar usuario');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ activo: !user.isActive })
        .eq('id', user.id);

      if (error) throw error;

      message.success(`Usuario ${!user.isActive ? 'activado' : 'desactivado'} correctamente`);
      loadUsuarios();
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error('Error al cambiar estado del usuario');
    }
  };

  const handleSubmit = async (values) => {
    try {
      let userId;
      
      if (editingUser) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nombre: values.nombre,
            login: values.login,
            email: values.email,
            telefono: values.telefono,
            permisos: { role: values.role },
            activo: values.activo
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        
        userId = editingUser.id;
        message.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        const { data: userResp, error: authError } = await supabase.auth.admin.createUser({
          email: values.login,
          password: 'defaultPassword123',
          email_confirm: true,
          user_metadata: { password_set: false }
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userResp.user.id,
            nombre: values.nombre,
            login: values.login,
            email: values.email,
            telefono: values.telefono,
            permisos: { role: values.role },
            activo: values.activo
          });

        if (profileError) throw profileError;
        
        userId = userResp.user.id;
        message.success('Usuario creado correctamente');
      }

      // Guardar asignaciones de recintos
      if (userId && selectedRecintos.length > 0) {
        await saveUserRecintos(userId, selectedRecintos);
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedRecintos([]);
      loadUsuarios();
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Error al guardar usuario');
    }
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || { 
      value: role, 
      label: role, 
      color: 'default', 
      icon: <UserOutlined /> 
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
          <Tag color={roleInfo.color} icon={roleInfo.icon}>
            {roleInfo.label}
          </Tag>
        );
      },
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (telefono) => telefono || '-',
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
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {hasPermission('editar_usuarios') && (
            <Tooltip title="Editar usuario">
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => handleEditUser(record)}
              />
            </Tooltip>
          )}
          
          {hasPermission('editar_usuarios') && (
            <Tooltip title={record.isActive ? 'Desactivar' : 'Activar'}>
              <Button 
                type={record.isActive ? 'default' : 'primary'}
                icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
                size="small"
                onClick={() => handleToggleActive(record)}
              />
            </Tooltip>
          )}
          
          {hasPermission('eliminar_usuarios') && (
            <Popconfirm
              title="¿Estás seguro de eliminar este usuario?"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Tooltip title="Eliminar usuario">
                <Button 
                  type="primary" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Verificar permisos
  if (!hasPermission('usuarios')) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Acceso Denegado</Title>
        <Text>No tienes permisos para acceder a la gestión de usuarios.</Text>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Gestión de Usuarios</Title>
            <Text type="secondary">Administra los usuarios y sus roles en el sistema</Text>
          </Col>
          <Col>
            {hasPermission('crear_usuarios') && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
              >
                Crear Usuario
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* Información de Roles */}
      <Card className="mb-6">
        <Title level={4}>Roles Disponibles</Title>
        <Row gutter={[16, 16]}>
          {roles.map(role => (
            <Col key={role.value} xs={24} sm={12} md={8} lg={6}>
              <div style={{ 
                padding: '12px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>
                  {role.icon}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {role.label}
                </div>
                <Tag color={role.color} size="small">
                  {role.value}
                </Tag>
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
              `${range[0]}-${range[1]} de ${total} usuarios`
          }}
        />
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal
        title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
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
                  { type: 'email', message: 'Debe ser un email válido' }
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
                label="Teléfono"
              >
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[{ required: true, message: 'El rol es requerido' }]}
              >
                <Select placeholder="Seleccionar rol">
                  {roles.map(role => (
                    <Option key={role.value} value={role.value}>
                      {role.icon} {role.label}
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

          <Divider />

          <Form.Item
            label="Recintos Asignados"
            help="Selecciona los recintos que puede gestionar este usuario"
          >
            <Checkbox.Group
              value={selectedRecintos}
              onChange={setSelectedRecintos}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 8]}>
                {recintos && recintos.length > 0 ? (
                  recintos.map(recinto => (
                    <Col span={24} key={recinto.id}>
                      <Checkbox value={String(recinto.id)}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{recinto.nombre || 'Sin nombre'}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {recinto.direccion || 'Sin dirección'} - {recinto.ciudad || 'Sin ciudad'}
                          </div>
                        </div>
                      </Checkbox>
                    </Col>
                  ))
                ) : (
                  <Col span={24}>
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      No hay recintos disponibles
                    </div>
                  </Col>
                )}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;
