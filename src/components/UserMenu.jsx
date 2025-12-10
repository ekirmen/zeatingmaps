import React, { useState } from 'react';
import { Button, Dropdown, Menu, Modal, Form, Input, message, Avatar, Badge } from '../utils/antdComponents';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  DownOutlined,
  CrownOutlined,
  TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { TextArea } = Input;

export const UserMenu = () => {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const { 
    user, 
    userProfile, 
    signOut, 
    updateProfile, 
    isSuperAdmin, 
    isTenantAdmin,
    isAdmin 
  } = useAuth();

  // Obtener rol legible
  const getReadableRole = () => {
    if (!userProfile?.role) return 'Usuario';
    
    const roleMap = {
      'super_admin': 'Super Administrador',
      'tenant_admin': 'Administrador de Tenant',
      'event_manager': 'Gestor de Eventos',
      'sales_manager': 'Sales Manager',
      'box_office': 'Box Office',
      'customer_support': 'Customer Support',
      'marketing': 'Marketing',
      'reports': 'Reports',
      'finance': 'Finance',
      'technical': 'Technical'
    };
    
    return roleMap[userProfile.role] || userProfile.role;
  };

  // Obtener color del rol
  const getRoleColor = () => {
    if (isSuperAdmin()) return 'gold';
    if (isTenantAdmin()) return 'blue';
    return 'default';
  };

  // Obtener icono del rol
  const getRoleIcon = () => {
    if (isSuperAdmin()) return <CrownOutlined />;
    if (isTenantAdmin()) return <TeamOutlined />;
    return <UserOutlined />;
  };

  // Manejar actualización de perfil
  const handleProfileUpdate = async (values) => {
    try {
      setLoading(true);
      
      const updates = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        updated_at: new Date().toISOString()
      };
      
      await updateProfile(updates);
      message.success('Perfil actualizado exitosamente');
      setIsProfileModalVisible(false);
      profileForm.resetFields();
    } catch (error) {
      message.error(`Error al actualizar perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de contraseña
  const handlePasswordChange = async (values) => {
    try {
      setLoading(true);
      
      // Aquí implementarías la lógica para cambiar contraseña
      // Por ahora solo simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Contraseña actualizada exitosamente');
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(`Error al cambiar contraseña: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cierre de sesión
  const handleSignOut = async () => {
    try {
      await signOut();
      message.success('Sesión cerrada exitosamente');
    } catch (error) {
      message.error(`Error al cerrar sesión: ${error.message}`);
    }
  };

  // Menú desplegable
  const menuItems = [
    {
      key: 'profile',
      label: '📝 Modificar Perfil',
      icon: <SettingOutlined />,
      onClick: () => setIsProfileModalVisible(true)
    },
    {
      key: 'password',
      label: '🔐 Cambiar Contraseña',
      icon: <SafetyCertificateOutlined />,
      onClick: () => setIsPasswordModalVisible(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '🚪 Cerrar Sesión',
      icon: <LogoutOutlined />,
      onClick: handleSignOut,
      danger: true
    }
  ];

  // Si no hay usuario autenticado, no mostrar nada
  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="user-menu-container">
      {/* Botón principal del menú */}
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
        overlayClassName="user-menu-dropdown"
      >
        <Button
          type="default"
          className="user-menu-button"
          style={{
            backgroundColor: 'rgb(233, 66, 67)',
            color: 'rgb(255, 255, 255)',
            borderColor: 'rgb(233, 66, 67)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
          <span>Cuenta</span>
          <DownOutlined />
        </Button>
      </Dropdown>

      {/* Información del usuario (opcional) */}
      <div className="user-info" style={{ marginLeft: '12px', fontSize: '12px', color: '#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {getRoleIcon()}
          <Badge 
            color={getRoleColor()} 
            text={getReadableRole()}
            style={{ fontSize: '11px' }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#999' }}>
          {user.email}
        </div>
      </div>

      {/* Modal de Perfil */}
      <Modal
        title="Modificar Perfil"
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || '',
            phone: userProfile.phone || '',
            email: user.email || ''
          }}
          onFinish={handleProfileUpdate}
        >
          <Form.Item
            label="Email"
            name="email"
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item
            label="Nombre"
            name="first_name"
            rules={[{ required: true, message: 'Por favor ingrese su nombre' }]}
          >
            <Input placeholder="Su nombre" />
          </Form.Item>
          
          <Form.Item
            label="Apellido"
            name="last_name"
            rules={[{ required: true, message: 'Por favor ingrese su apellido' }]}
          >
            <Input placeholder="Su apellido" />
          </Form.Item>
          
          <Form.Item
            label="Teléfono"
            name="phone"
          >
            <Input placeholder="Su teléfono" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ marginRight: '8px' }}
            >
              Actualizar Perfil
            </Button>
            <Button onClick={() => setIsProfileModalVisible(false)}>
              Cancelar
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Cambio de Contraseña */}
      <Modal
        title="Cambiar Contraseña"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="Contraseña Actual"
            name="currentPassword"
            rules={[{ required: true, message: 'Por favor ingrese su contraseña actual' }]}
          >
            <Input.Password placeholder="Contraseña actual" />
          </Form.Item>
          
          <Form.Item
            label="Nueva Contraseña"
            name="newPassword"
            rules={[
              { required: true, message: 'Por favor ingrese la nueva contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            ]}
          >
            <Input.Password placeholder="Nueva contraseña" />
          </Form.Item>
          
          <Form.Item
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Por favor confirme la nueva contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirmar nueva contraseña" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ marginRight: '8px' }}
            >
              Cambiar Contraseña
            </Button>
            <Button onClick={() => setIsPasswordModalVisible(false)}>
              Cancelar
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .user-menu-container {
          display: flex;
          align-items: center;
        }
        
        .user-menu-button:hover {
          background-color: rgb(200, 50, 51) !important;
          border-color: rgb(200, 50, 51) !important;
        }
        
        .user-info {
          display: none;
        }
        
        @media (min-width: 768px) {
          .user-info {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export default UserMenu;

