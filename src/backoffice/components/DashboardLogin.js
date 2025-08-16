import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Input, Button, message } from 'antd';
import { loginUser } from '../services/authService';

const DashboardLogin = ({ onLogin }) => {
  const { theme } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!formData.email || !formData.password) {
        throw new Error('Por favor complete todos los campos');
      }

      const { user, session } = await loginUser({
        email: formData.email.trim(),
        password: formData.password.trim()
      });

      if (session && session.access_token) {
        const token = session.access_token;
        localStorage.setItem('token', token);
        onLogin?.({ token, user });
        message.success('Inicio de sesión exitoso');
        setIsModalVisible(false);
      } else {
        message.success('Se envió un enlace a tu correo');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
      message.error(error.message || 'Error al iniciar sesión');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCancel = () => {
    // No permitir cerrar el modal si no hay sesión
    if (!localStorage.getItem('token')) {
      return;
    }
    setIsModalVisible(false);
  };

  // Si ya hay sesión, no mostrar el modal
  if (localStorage.getItem('token')) {
    return null;
  }

  return (
    <Modal
      title="Iniciar Sesión - Panel de Administración"
      open={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      width={400}
      centered
      zIndex={1000}
      style={{ position: 'relative' }}
      className="dashboard-login-modal"
      wrapClassName="dashboard-login-modal-wrapper"
    >
      <div className="space-y-4">
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <Input
            placeholder="tu@email.com"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            size="large"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <Input.Password
            placeholder="Tu contraseña"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            size="large"
          />
        </div>
        
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handleLogin}
          style={{ 
            backgroundColor: theme.primary, 
            borderColor: theme.primary,
            height: '44px'
          }}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          Solo usuarios autorizados pueden acceder al panel de administración
        </div>
      </div>
    </Modal>
  );
};

export default DashboardLogin;
