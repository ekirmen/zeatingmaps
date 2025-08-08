import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, Modal, message, Avatar, Typography } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { supabase } from '../../supabaseClient';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const { Text } = Typography;

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { addTenantFilter } = useTenantFilter();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await addTenantFilter(
        supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      message.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    setUserToDelete(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      message.success('Usuario eliminado correctamente');
      setDeleteModalVisible(false);
      setUserToDelete(null);
      loadUsuarios();
    } catch (error) {
      console.error('Error deleting usuario:', error);
      message.error('Error al eliminar el usuario');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'red';
      case 'organizer': return 'blue';
      case 'user': return 'green';
      default: return 'default';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'organizer': return 'Organizador';
      case 'user': return 'Usuario';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            src={record.avatar_url}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (telefono) => telefono || 'No especificado',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => setSelectedUser(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
          >
            Editar
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Gestión de Usuarios"
      subtitle="Administra todos los usuarios del sistema"
    >
      <DataTable
        title="Usuarios"
        dataSource={usuarios}
        columns={columns}
        loading={loading}
        onRefresh={loadUsuarios}
        showSearch={true}
        searchPlaceholder="Buscar usuarios..."
        addButtonText="Crear Usuario"
        onAdd={() => console.log('Crear usuario')}
      />

      {/* Modal para ver detalles del usuario */}
      <Modal
        title="Detalles del Usuario"
        visible={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Avatar
                size={64}
                src={selectedUser.avatar_url}
                icon={<UserOutlined />}
              />
              <div style={{ marginLeft: '16px' }}>
                <h3 style={{ margin: 0 }}>{selectedUser.nombre}</h3>
                <Text type="secondary">{selectedUser.email}</Text>
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Rol:</strong> 
              <Tag color={getRoleColor(selectedUser.rol)} style={{ marginLeft: '8px' }}>
                {getRoleText(selectedUser.rol)}
              </Tag>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Teléfono:</strong> {selectedUser.telefono || 'No especificado'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Estado:</strong> 
              <Tag color={getStatusColor(selectedUser.estado)} style={{ marginLeft: '8px' }}>
                {getStatusText(selectedUser.estado)}
              </Tag>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Fecha de registro:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        title="Confirmar Eliminación"
        visible={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setUserToDelete(null);
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que quieres eliminar al usuario "{userToDelete?.nombre}"?</p>
        <p>Esta acción no se puede deshacer.</p>
      </Modal>
    </DashboardLayout>
  );
};

export default UsuariosPage;
