import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Space, Tag, Select, Input, Modal, Form, message, Row, Col, Statistic, Drawer, Badge, Avatar, Tooltip } from '../../utils/antdComponents';
import {
  UserOutlined,
  TeamOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  CrownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagementSimple = () => {
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

      // Obtener usuarios directamente desde profiles con tenant_id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          nombre,
          apellido,
          tenant_id,
          is_active,
          activo,
          role,
          created_at,
          updated_at,
          tenants:tenant_id(id, company_name, subdomain, contact_email),
          tenant_roles:tenant_user_roles(
            id,
            is_active,
            custom_roles:role_id(id, name, description)
          )
        `);

      if (profilesError) throw profilesError;

      // Obtener informaci³n adicional de user_tenant_info si existe
      const userIds = profiles?.map(p => p.id) || [];
      const { data: userTenantInfo, error: tenantError } = await supabase
        .from('user_tenant_info')
        .select('user_id, is_active, last_login, login_count')
        .in('user_id', userIds);

      if (tenantError) {
      }

      // Transformar los datos
      const transformedUsers = profiles?.map(profile => {
        const tenantInfo = userTenantInfo?.find(uti => uti.user_id === profile.id);
        return {
          user_id: profile.id,
          users: {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              full_name: (profile.nombre || '') + ' ' + (profile.apellido || '')
            },
            created_at: profile.created_at
          },
          tenant_id: profile.tenant_id,
          tenants: profile.tenants,
          is_active: profile.is_active ?? profile.activo ?? true, // Usar is_active o activo
          last_login: tenantInfo?.last_login,
          login_count: tenantInfo?.login_count || 0,
          tenant_roles: profile.tenant_roles || [],
          created_at: profile.created_at,
          role: profile.role
        };
      }) || [];

      // Aplicar filtros
      let filteredUsers = transformedUsers;

      if (filters.tenant !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.tenant_id === filters.tenant);
      }

      if (filters.status !== 'all') {
        filteredUsers = filteredUsers.filter(user =>
          filters.status === 'active' ? (user.is_active || user.activo) : (!user.is_active && !user.activo)
        );
      }

      if (filters.search) {
        filteredUsers = filteredUsers.filter(user =>
          user.users?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.users?.user_metadata?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.tenants?.company_name?.toLowerCase().includes(filters.search.toLowerCase())
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
        .select('id, company_name, subdomain, contact_email')
        .order('company_name');

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
      // Obtener estad­sticas desde profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, tenant_id, is_active, activo');

      if (profilesError) throw profilesError;

      // Obtener informaci³n adicional de user_tenant_info si existe
      const userIds = profiles?.map(p => p.id) || [];
      const { data: userTenantInfo, error: tenantError } = await supabase
        .from('user_tenant_info')
        .select('user_id, is_active, last_login')
        .in('user_id', userIds);

      const statsData = {
        total: profiles?.length || 0,
        active: profiles?.filter(p => p.is_active || p.activo).length || 0,
        inactive: profiles?.filter(p => !p.is_active && !p.activo).length || 0,
        online: userTenantInfo?.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length || 0
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
      is_active: user.is_active || user.activo || true,
      tenant_id: user.tenant_id
    });
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();

      // Actualizar informaci³n en profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nombre: values.full_name?.split(' ')[0] || '',
          apellido: values.full_name?.split(' ').slice(1).join(' ') || '',
          tenant_id: values.tenant_id,
          is_active: values.is_active,
          activo: values.is_active
        })
        .eq('id', selectedUser.user_id);

      if (profileError) throw profileError;

      // Actualizar informaci³n del usuario en user_tenant_info si existe
      const { error: tenantError } = await supabase
        .from('user_tenant_info')
        .update({
          is_active: values.is_active,
          tenant_id: values.tenant_id
        })
        .eq('user_id', selectedUser.user_id);

      if (tenantError) {
      }

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
        <Tag color="blue">{tenant?.company_name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, record) => (
        <Space wrap>
          {/* Mostrar rol de la tabla profiles si existe */}
          {record.role && (
            <Tag color="blue">
              {record.role}
            </Tag>
          )}
          {/* Mostrar roles de tenant_user_roles si existen */}
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
      render: (isActive, record) => {
        const active = isActive || record.activo;
        return (
          <Tag color={active ? 'green' : 'red'}>
            {active ? 'Activo' : 'Inactivo'}
          </Tag>
        );
      },
    },
    {
      title: 'šltimo Login',
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
          Gesti³n de Usuarios
        </Title>
        <Text type="secondary">
          Administra usuarios y roles de todos los tenants
        </Text>
      </div>

      {/* Estad­sticas */}
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
              title="En l­nea (24h)"
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
                  {tenant.company_name}
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

      {/* Drawer de edici³n de usuario */}
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
                  {tenant.company_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default UserManagementSimple;


