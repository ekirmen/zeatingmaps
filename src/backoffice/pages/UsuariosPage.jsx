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

const { Text } = Typography;

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

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
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500', color: '#1e293b' }}>
              {text || record.email}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
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
      render: (rol) => (
        <Tag color={getRoleColor(rol)}>
          {getRoleText(rol)}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={getStatusColor(estado)}>
          {getStatusText(estado)}
        </Tag>
      ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (text) => text || 'No especificado',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setSelectedUser(record)}
          >
            Ver
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => window.open(`/backoffice/usuarios/${record.id}`, '_blank')}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
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
      title="Usuarios"
      subtitle="Gestiona todos los usuarios del sistema"
      actions={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            Crear Usuario
          </Button>
        </Space>
      }
    >
      <DataTable
        title="Lista de Usuarios"
        dataSource={usuarios}
        columns={columns}
        loading={loading}
        onRefresh={loadUsuarios}
        onAdd={() => window.open('/backoffice/usuarios/nuevo', '_blank')}
        searchPlaceholder="Buscar usuarios..."
        addButtonText="Crear Usuario"
      />

      {/* Modal de Detalles del Usuario */}
      <Modal
        title="Detalles del Usuario"
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedUser(null)}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              window.open(`/backoffice/usuarios/${selectedUser?.id}`, '_blank');
              setSelectedUser(null);
            }}
          >
            Editar
          </Button>,
        ]}
        width={600}
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar
                size={64}
                src={selectedUser.avatar}
                icon={<UserOutlined />}
              />
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>
                  {selectedUser.nombre || selectedUser.email}
                </h3>
                <Text type="secondary">{selectedUser.email}</Text>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <MailOutlined style={{ marginRight: '4px' }} />
                  Email
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedUser.email}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <PhoneOutlined style={{ marginRight: '4px' }} />
                  Teléfono
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedUser.telefono || 'No especificado'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <UserOutlined style={{ marginRight: '4px' }} />
                  Rol
                </div>
                <Tag color={getRoleColor(selectedUser.rol)}>
                  {getRoleText(selectedUser.rol)}
                </Tag>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Estado
                </div>
                <Tag color={getStatusColor(selectedUser.estado)}>
                  {getStatusText(selectedUser.estado)}
                </Tag>
              </div>
            </div>

            {selectedUser.direccion && (
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Dirección
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedUser.direccion}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Fecha de Registro
              </div>
              <div style={{ fontWeight: '500' }}>
                {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'No disponible'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        title="Confirmar Eliminación"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setUserToDelete(null);
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>
          ¿Estás seguro de que quieres eliminar al usuario "{userToDelete?.nombre || userToDelete?.email}"?
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default UsuariosPage;
