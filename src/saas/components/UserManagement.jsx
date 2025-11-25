import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Space, Tag, Select, Input, Modal, Form, message, Row, Col, Statistic, Drawer, Tabs, Badge, Avatar, Tooltip } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  CrownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDrawerVisible, setUserDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    tenant: 'all',
    role: 'all',
    status: 'all',
    search: ''
  });
  const [stats, setStats] = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
    loadTenants();
    loadRoles();
    loadStats();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Primero obtener todos los usuarios de auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Luego obtener la información de tenant para cada usuario
      const { data: userTenantInfo, error: tenantError } = await supabase
        .from('user_tenant_info')
        .select(`
          *,
          tenants:tenant_id(id, name, email),
          tenant_roles:tenant_user_roles(
            id,
            is_active,
            custom_roles:role_id(id, name, description)
          )
        `);

      if (tenantError) throw tenantError;

      // Combinar la información
      const combinedUsers = authUsers.users.map(authUser => {
        const tenantInfo = userTenantInfo?.find(uti => uti.user_id === authUser.id);
        return {
          user_id: authUser.id,
          users: {
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata,
            created_at: authUser.created_at
          },
          tenant_id: tenantInfo?.tenant_id,
          tenants: tenantInfo?.tenants,
          is_active: tenantInfo?.is_active || false,
          last_login: tenantInfo?.last_login,
          login_count: tenantInfo?.login_count || 0,
          tenant_roles: tenantInfo?.tenant_roles || [],
          created_at: tenantInfo?.created_at || authUser.created_at
        };
      });

      // Aplicar filtros
      let filteredUsers = combinedUsers;

      if (filters.tenant !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.tenant_id === filters.tenant);
      }

      if (filters.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          filters.status === 'active' ? user.is_active : !user.is_active
        );
      }

      if (filters.search) {
        filteredUsers = filteredUsers.filter(user => 
          user.users?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.users?.user_metadata?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.tenants?.name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          user.tenant_roles?.some(tr => 
            tr.is_active && tr.custom_roles?.id === filters.role
          )
        );
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('id, name, description, level')
        .order('level', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tenant_info')
        .select('tenant_id, is_active, last_login');

      if (error) throw error;

      const statsData = {
        total: data.length,
        active: data.filter(u => u.is_active).length,
        inactive: data.filter(u => !u.is_active).length,
        online: data.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserDrawerVisible(true);
    form.setFieldsValue({
      email: user.users?.email,
      full_name: user.users?.user_metadata?.full_name,
      is_active: user.is_active,
      tenant_id: user.tenant_id
    });
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      
      // Actualizar información del usuario
      const { error: userError } = await supabase
        .from('user_tenant_info')
        .update({
          is_active: values.is_active
        })
        .eq('user_id', selectedUser.user_id)
        .eq('tenant_id', selectedUser.tenant_id);

      if (userError) throw userError;

      // Actualizar metadatos del usuario
      const { error: authError } = await supabase.auth.admin.updateUserById(
        selectedUser.user_id,
        {
          user_metadata: {
            ...selectedUser.users?.user_metadata,
            full_name: values.full_name
          }
        }
      );

      if (authError) throw authError;

      message.success('Usuario actualizado exitosamente');
      setUserDrawerVisible(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Error al actualizar usuario');
    }
  };

  const handleAssignRole = async (userId, tenantId, roleId) => {
    try {
      const { error } = await supabase
        .from('tenant_user_roles')
        .upsert({
          user_id: userId,
          tenant_id: tenantId,
          role_id: roleId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      message.success('Rol asignado exitosamente');
      loadUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      message.error('Error al asignar rol');
    }
  };

  const handleRemoveRole = async (userId, tenantId, roleId) => {
    try {
      const { error } = await supabase
        .from('tenant_user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('role_id', roleId);

      if (error) throw error;

      message.success('Rol removido exitosamente');
      loadUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      message.error('Error al remover rol');
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'admin': 'red',
      'manager': 'orange',
      'staff': 'blue',
      'viewer': 'green',
      'support': 'purple'
    };
    return colors[roleName?.toLowerCase()] || 'default';
  };

  const userColumns = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{record.users?.user_metadata?.full_name || record.users?.email}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.users?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenants',
      key: 'tenant',
      render: (tenant) => (
        <Tag color="blue">{tenant?.name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, record) => (
        <Space wrap>
          {record.tenant_roles?.filter(tr => tr.is_active).map(role => (
            <Tag 
              key={role.id} 
              color={getRoleColor(role.custom_roles?.name)}
              closable
              onClose={() => handleRemoveRole(record.user_id, record.tenant_id, role.custom_roles?.id)}
            >
              {role.custom_roles?.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Último Login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date) => date ? new Date(date).toLocaleDateString('es-ES') : 'Nunca',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            Editar
          </Button>
          <Select
            placeholder="Asignar rol"
            style={{ width: 120 }}
            onChange={(roleId) => handleAssignRole(record.user_id, record.tenant_id, roleId)}
          >
            {roles.map(role => (
              <Option key={role.id} value={role.id}>
                {role.name}
              </Option>
            ))}
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          Gestión de Usuarios
        </Title>
        <Text type="secondary">
          Administra usuarios y roles de todos los tenants
        </Text>
      </div>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Usuarios"
              value={stats.total || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Activos"
              value={stats.active || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Inactivos"
              value={stats.inactive || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="En línea (24h)"
              value={stats.online || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Buscar usuarios..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por tenant"
              value={filters.tenant}
              onChange={(value) => setFilters(prev => ({ ...prev, tenant: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">Todos los tenants</Option>
              {tenants.map(tenant => (
                <Option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por rol"
              value={filters.role}
              onChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">Todos los roles</Option>
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por estado"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">Todos los estados</Option>
              <Option value="active">Activos</Option>
              <Option value="inactive">Inactivos</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tabla de usuarios */}
      <Card title="Lista de Usuarios">
        <Table
          columns={userColumns}
          dataSource={users}
          loading={loading}
          rowKey={(record) => `${record.user_id}-${record.tenant_id}`}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Drawer de edición de usuario */}
      <Drawer
        title="Editar Usuario"
        placement="right"
        width={500}
        open={userDrawerVisible}
        onClose={() => setUserDrawerVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setUserDrawerVisible(false)}>
              Cancelar
            </Button>
            <Button type="primary" onClick={handleSaveUser}>
              Guardar Cambios
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email requerido' }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Nombre Completo"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Estado"
            valuePropName="checked"
          >
            <Select>
              <Option value={true}>Activo</Option>
              <Option value={false}>Inactivo</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tenant_id"
            label="Tenant"
          >
            <Select disabled>
              {tenants.map(tenant => (
                <Option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default UserManagement;
