import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Input, message, Spin } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Simular carga de datos del usuario
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Debes iniciar sesión para ver tu perfil');
      navigate('/store');
      return;
    }

    // Simular datos del usuario
    setUserData({
      id: localStorage.getItem('userId') || 'user-123',
      login: 'usuario@ejemplo.com',
      nombre: 'Usuario',
      apellido: 'Ejemplo',
      empresa: 'Empresa Demo',
      telefono: '+58 412-123-4567',
      email: 'usuario@ejemplo.com'
    });

    setLoading(false);
  }, [navigate]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      
      // Simular actualización
      console.log('Actualizando perfil:', values);
      
      setUserData(prev => ({
        ...prev,
        ...values
      }));

      message.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      message.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    message.success('Sesión cerrada correctamente');
    navigate('/store');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Perfil
          </h1>
          <p className="text-gray-600">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Perfil */}
          <div className="lg:col-span-2">
            <Card title="Información Personal" className="mb-6">
              <Form
                form={form}
                layout="vertical"
                initialValues={userData}
                onFinish={handleUpdateProfile}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="nombre"
                    label="Nombre"
                    rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Tu nombre" />
                  </Form.Item>

                  <Form.Item
                    name="apellido"
                    label="Apellido"
                    rules={[{ required: true, message: 'Por favor ingresa tu apellido' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Tu apellido" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu email' },
                      { type: 'email', message: 'Email inválido' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="tu@email.com" />
                  </Form.Item>

                  <Form.Item
                    name="telefono"
                    label="Teléfono"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+58 412-123-4567" />
                  </Form.Item>

                  <Form.Item
                    name="empresa"
                    label="Empresa"
                  >
                    <Input prefix={<BankOutlined />} placeholder="Nombre de tu empresa" />
                  </Form.Item>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button onClick={() => navigate('/store')}>
                    Cancelar
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Actualizar Perfil
                  </Button>
                </div>
              </Form>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            <Card title="Acciones Rápidas">
              <div className="space-y-3">
                <Button 
                  type="primary" 
                  block 
                  onClick={() => navigate('/store/cart')}
                >
                  Ver Carrito
                </Button>
                <Button 
                  block 
                  onClick={() => navigate('/store')}
                >
                  Ver Eventos
                </Button>
                <Button 
                  danger 
                  block 
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </Button>
              </div>
            </Card>

            <Card title="Información de la Cuenta">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Usuario:</span>
                  <span className="font-mono">{userData?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Login:</span>
                  <span>{userData?.login}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="text-green-600">Activo</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 