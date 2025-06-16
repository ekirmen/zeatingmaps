import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const Header = ({ onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleRegister = async () => {
    try {
      if (!registerData.email || !registerData.password) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (registerData.password !== registerData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (registerData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const response = await fetch('http://localhost:5000/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: registerData.email.trim(),
          perfil: 'cliente',
          email: registerData.email.trim(),
          password: registerData.password.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data.error?.message || 'Error al registrar usuario';
        throw new Error(errorMsg);
      }

      if (!data.token || !data.user?._id) {
        throw new Error('Respuesta de registro inválida');
      }

      const cleanToken = data.token.replace('Bearer ', '');
      const formattedToken = `Bearer ${cleanToken}`;
      localStorage.setItem('token', formattedToken);
      localStorage.setItem('userId', data.user._id);
      onLogin?.({ token: cleanToken, user: data.user });

      message.success('Usuario registrado exitosamente');
      setIsRegisterModalVisible(false);
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      navigate('/store');

    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async () => {
    try {
      if (!formData.email || !formData.password) {
        throw new Error('Por favor ingrese correo y contraseña');
      }

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: formData.email.trim(),
          password: formData.password.trim()
        }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      if (!data.token || !data.user?._id) {
        throw new Error('Respuesta de autenticación inválida');
      }

      const cleanToken = data.token.replace('Bearer ', '');
      const formattedToken = `Bearer ${cleanToken}`;
      localStorage.setItem('token', formattedToken);
      localStorage.setItem('userId', data.user._id);

      onLogin?.({
        token: cleanToken,
        user: data.user || data.userData
      });

      setIsModalVisible(false);
      setFormData({ email: '', password: '' });
      message.success('Inicio de sesión exitoso');
      navigate('/store');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
      message.error(error.message || 'Error al iniciar sesión');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    if (typeof onLogout === 'function') onLogout();
    message.success('Sesión cerrada correctamente');
    if (window.location.pathname === '/store/perfil') {
      navigate('/store');
    }
  };

  return (
    <div className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-md">
      <div className="text-3xl font-bold text-blue-600">
        Mi Aplicación
      </div>

      <div className="space-x-4">
        {localStorage.getItem('token') ? (
          <>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
              onClick={() => navigate('/store/perfil')}
            >
              Mi Perfil
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
              onClick={() => setIsModalVisible(true)}
            >
              Iniciar Sesión
            </button>
            <button
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded transition"
              onClick={() => setIsRegisterModalVisible(true)}
            >
              Registrarse
            </button>
          </>
        )}
      </div>

      {/* Modal de inicio de sesión */}
      <Modal
        title="Iniciar Sesión"
        open={isModalVisible}
        onOk={handleLogin}
        onCancel={() => {
          setIsModalVisible(false);
          setError('');
          setFormData({ email: '', password: '' });
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancelar
          </Button>,
          <Button key="submit" type="default" variant="outlined" block onClick={handleLogin}>
            Iniciar Sesión
          </Button>
        ]}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <Input
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="mb-4"
        />
        <Input.Password
          placeholder="Contraseña"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
        />
      </Modal>

      {/* Modal de registro */}
      <Modal
        title="Registrar Nueva Cuenta"
        open={isRegisterModalVisible}
        onOk={handleRegister}
        onCancel={() => setIsRegisterModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRegisterModalVisible(false)}>
            Cancelar
          </Button>,
          <Button key="submit" type="default" variant="outlined" block onClick={handleRegister}>
            Registrar
          </Button>
        ]}
      >
        <Input
          placeholder="Email"
          name="email"
          value={registerData.email}
          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
          className="mb-4"
        />
        <Input.Password
          placeholder="Contraseña"
          name="password"
          value={registerData.password}
          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          className="mb-4"
        />
        <Input.Password
          placeholder="Confirmar Contraseña"
          name="confirmPassword"
          value={registerData.confirmPassword}
          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
        />
      </Modal>
    </div>
  );
};

export default Header;
