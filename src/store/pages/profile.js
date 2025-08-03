import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Upload,
  Divider,
  List,
  Tag,
  Modal,
  Alert,
  Spin,
  Space,
  Typography,
  Badge
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  EditOutlined,
  SaveOutlined,
  LockOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UploadOutlined,
  HistoryOutlined,
  BellOutlined,
  SafetyOutlined,
  FormOutlined,
  PictureOutlined,
  SaveOutlined,
  LockOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { getPaymentTransactionsByOrder } from '../services/paymentGatewaysService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadUserTransactions();
    loadUserNotifications();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        const userData = {
          ...user,
          ...profile
        };
        setUser(userData);
        profileForm.setFieldsValue(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      message.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadUserTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Primero verificamos si la tabla existe
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.warn('Tabla payment_transactions no disponible:', error.message);
          setTransactions([]);
          return;
        }
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const loadUserNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Primero verificamos si la tabla existe
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          // Si la tabla no existe, simplemente establecer un array vacío
          console.warn('Tabla notifications no disponible:', error.message);
          setNotifications([]);
          return;
        }
        setNotifications(data || []);
      }
    } catch (error) {
      // Manejar cualquier otro error de manera silenciosa
      console.warn('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const handleProfileUpdate = async (values) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...values,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        message.success('Perfil actualizado correctamente');
        loadUserProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (values) => {
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (error) throw error;

      message.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('Error updating password:', error);
      message.error('Error al actualizar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Actualizar perfil con nueva URL de avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      message.success('Avatar actualizado correctamente');
      loadUserProfile();
      return false; // Prevenir upload automático
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Error al subir el avatar');
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Eliminar datos del usuario
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.from('notifications').delete().eq('user_id', user.id);

        // Eliminar cuenta de autenticación
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) throw error;

        message.success('Cuenta eliminada correctamente');
        // Redirigir al login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      message.error('Error al eliminar la cuenta');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const getTransactionStatusColor = (status) => {
    const colors = {
      completed: 'green',
      pending: 'orange',
      failed: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'blue';
  };

  const getNotificationIcon = (type) => {
    const icons = {
      payment: <CreditCardOutlined />,
      refund: <HistoryOutlined />,
      system: <BellOutlined />
    };
    return icons[type] || <BellOutlined />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Title level={2}>Mi Perfil</Title>
          <Text type="secondary">Gestiona tu información personal y preferencias</Text>
        </div>

        <Tabs defaultActiveKey="profile" size="large">
          {/* Perfil Personal */}
          <TabPane
            tab={<span><UserOutlined />Perfil Personal</span>}
            key="profile"
          >
            <Card>
              <div className="flex items-center space-x-6 mb-6">
                <div className="text-center">
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={handleAvatarUpload}
                    accept="image/*"
                  >
                    <div className="relative">
                      <Avatar
                        size={100}
                        src={user?.avatar_url}
                        icon={<UserOutlined />}
                        className="cursor-pointer"
                      />
                      <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                        <PictureOutlined className="text-white text-sm" />
                      </div>
                    </div>
                  </Upload>
                  <Text className="text-sm text-gray-500 mt-2">Haz clic para cambiar</Text>
                </div>

                <div className="flex-1">
                  <Title level={4}>{user?.full_name || 'Usuario'}</Title>
                  <Text type="secondary">{user?.email}</Text>
                  <div className="mt-2">
                    <Tag color="blue">Cliente Activo</Tag>
                    <Tag color="green">Verificado</Tag>
                  </div>
                </div>
              </div>

              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="full_name"
                    label="Nombre Completo"
                    rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu email' },
                      { type: 'email', message: 'Email inválido' }
                    ]}
                  >
                    <Input disabled />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Teléfono"
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="birth_date"
                    label="Fecha de Nacimiento"
                  >
                    <Input type="date" />
                  </Form.Item>

                  <Form.Item
                    name="address"
                    label="Dirección"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  <Form.Item
                    name="city"
                    label="Ciudad"
                  >
                    <Input />
                  </Form.Item>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={<SaveOutlined />}
                  >
                    Guardar Cambios
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>

          {/* Seguridad */}
          <TabPane
                            tab={<span><SafetyOutlined />Seguridad</span>}
            key="security"
          >
            <Card>
              <div className="space-y-6">
                {/* Cambiar Contraseña */}
                <div>
                  <Title level={4}>Cambiar Contraseña</Title>
                  <Button
                    type="primary"
                    icon={<LockOutlined />}
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>

                <Divider />

                {/* Autenticación de Dos Factores */}
                <div>
                  <Title level={4}>Autenticación de Dos Factores</Title>
                  <Alert
                    message="Protege tu cuenta con autenticación de dos factores"
                    description="Recibirás un código por SMS o email cada vez que inicies sesión"
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                  <Button>Configurar 2FA</Button>
                </div>

                <Divider />

                {/* Sesiones Activas */}
                <div>
                  <Title level={4}>Sesiones Activas</Title>
                  <List
                    size="small"
                    dataSource={[
                      { device: 'Chrome en Windows', location: 'Madrid, España', lastActive: 'Hace 2 horas' },
                      { device: 'Safari en iPhone', location: 'Barcelona, España', lastActive: 'Hace 1 día' }
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.device}
                          description={`${item.location} • ${item.lastActive}`}
                        />
                        <Button size="small" danger>Cerrar Sesión</Button>
                      </List.Item>
                    )}
                  />
                </div>

                <Divider />

                {/* Eliminar Cuenta */}
                <div>
                  <Title level={4} className="text-red-600">Zona de Peligro</Title>
                  <Alert
                    message="Eliminar cuenta permanentemente"
                    description="Esta acción no se puede deshacer. Se eliminarán todos tus datos, transacciones y configuraciones."
                    type="error"
                    showIcon
                    className="mb-4"
                  />
                  <Button
                    danger
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Eliminar Cuenta
                  </Button>
                </div>
              </div>
            </Card>
          </TabPane>

          {/* Historial de Transacciones */}
          <TabPane
            tab={<span><HistoryOutlined />Historial</span>}
            key="history"
          >
            <Card>
              <List
                dataSource={transactions}
                renderItem={(transaction) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar icon={<CreditCardOutlined />} />
                      }
                      title={`Transacción ${transaction.id.slice(0, 8)}`}
                      description={
                        <div>
                          <div>Pasarela: {transaction.payment_gateways?.name}</div>
                          <div>Fecha: {new Date(transaction.created_at).toLocaleString()}</div>
                        </div>
                      }
                    />
                    <div className="text-right">
                      <div className="text-lg font-bold">${transaction.amount}</div>
                      <Tag color={getTransactionStatusColor(transaction.status)}>
                        {transaction.status.toUpperCase()}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          {/* Notificaciones */}
          <TabPane
            tab={
              <span>
                <BellOutlined />
                Notificaciones
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge count={notifications.filter(n => !n.read).length} className="ml-2" />
                )}
              </span>
            }
            key="notifications"
          >
            <Card>
              <List
                dataSource={notifications}
                renderItem={(notification) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar icon={getNotificationIcon(notification.type)} />
                      }
                      title={notification.title}
                      description={
                        <div>
                          <div>{notification.message}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                      }
                    />
                    {!notification.read && (
                      <Tag color="blue">Nueva</Tag>
                    )}
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>
        </Tabs>

        {/* Modal de Cambio de Contraseña */}
        <Modal
          title="Cambiar Contraseña"
          open={showPasswordModal}
          onCancel={() => {
            setShowPasswordModal(false);
            passwordForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordReset}
          >
            <Form.Item
              name="currentPassword"
              label="Contraseña Actual"
              rules={[{ required: true, message: 'Por favor ingresa tu contraseña actual' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Nueva Contraseña"
              rules={[
                { required: true, message: 'Por favor ingresa la nueva contraseña' },
                { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirmar Nueva Contraseña"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Por favor confirma la nueva contraseña' },
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
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                >
                  Cambiar Contraseña
                </Button>
                <Button onClick={() => {
                  setShowPasswordModal(false);
                  passwordForm.resetFields();
                }}>
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal de Eliminar Cuenta */}
        <Modal
          title="Eliminar Cuenta"
          open={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>,
            <Button
              key="delete"
              danger
              loading={saving}
              onClick={handleDeleteAccount}
            >
              Eliminar Permanentemente
            </Button>
          ]}
        >
          <Alert
            message="¿Estás seguro?"
            description="Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer."
            type="warning"
            showIcon
          />
        </Modal>
      </div>
    </div>
  );
};

export default Profile;
