import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';

const Header = ({ onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [registerData, setRegisterData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [pendingUser, setPendingUser] = useState(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const handleRegister = async () => {
    try {
      if (!registerData.login || !registerData.email || !registerData.password)
        throw new Error('Todos los campos son obligatorios');

      if (registerData.password !== registerData.confirmPassword)
        throw new Error('Las contraseñas no coinciden');

      if (registerData.password.length < 6)
        throw new Error('La contraseña debe tener al menos 6 caracteres');

      const response = await fetch('http://localhost:5000/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: registerData.login.trim(),
          perfil: 'cliente',
          email: registerData.email.trim(),
          password: registerData.password.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al registrar usuario');

      message.success('Usuario registrado exitosamente');
      setIsRegisterModalVisible(false);
      setRegisterData({ login: '', email: '', password: '', confirmPassword: '' });

    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      if (!formData.login || !formData.password)
        throw new Error('Por favor ingrese usuario y contraseña');

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: formData.login.trim(),
          password: formData.password.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Credenciales incorrectas');

      const cleanToken = data.token.replace('Bearer ', '');
      const formattedToken = `Bearer ${cleanToken}`;

      localStorage.setItem('token', formattedToken);
      localStorage.setItem('userId', data.user._id);

      if (data.passwordPending) {
        setPendingUser(data.user);
        setIsPasswordModalVisible(true);
        setIsModalVisible(false);
        setFormData({ login: '', password: '' });
        return;
      }

      onLogin?.({ token: cleanToken, user: data.user });
      setIsModalVisible(false);
      setFormData({ login: '', password: '' });
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
    if (window.location.pathname === '/store/perfil') navigate('/store');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword)
        throw new Error('Complete ambos campos');
      if (passwordData.newPassword !== passwordData.confirmPassword)
        throw new Error('Las contraseñas no coinciden');
      if (passwordData.newPassword.length < 6)
        throw new Error('La contraseña debe tener al menos 6 caracteres');

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ newPassword: passwordData.newPassword.trim() })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al guardar contraseña');

      setIsPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      onLogin?.({ token: token.replace('Bearer ', ''), user: data.user });
      message.success('Contraseña actualizada');
      navigate('/store');
    } catch (error) {
      console.error('Set password error:', error);
      message.error(error.message || 'Error al guardar contraseña');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <header className="bg-gray-900 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/store" className="text-xl font-bold">
          🎟️ TuEmpresa
        </Link>

        <nav className="flex gap-4 text-sm">
          <Link to="/store" className="hover:underline">Inicio</Link>
          <Link to="/companias" className="hover:underline">Compañías</Link>
          <Link to="/store/seating-demo" className="hover:underline">Demo</Link>
          <Link to="/store/cart" className="hover:underline">Carrito</Link>
          <Link to="/store/perfil" className="hover:underline">Perfil</Link>
          <Link to="/store/login-register" className="hover:underline">
            Registrarse
          </Link>
        </nav>

        <div className="space-x-2">
          {localStorage.getItem('token') ? (
            <Button onClick={handleLogout} className="bg-red-600 text-white">
              Cerrar Sesión
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsModalVisible(true)} className="bg-green-600 text-white">
                Iniciar Sesión
              </Button>
              <Button onClick={() => setIsRegisterModalVisible(true)} className="bg-indigo-600 text-white">
                Registrarse
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal Login */}
      <Modal
        title="Iniciar Sesión"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setError('');
          setFormData({ login: '', password: '' });
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>Cancelar</Button>,
          <Button key="submit" type="default" variant="outlined" block onClick={handleLogin}>Iniciar Sesión</Button>,
        ]}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <Input placeholder="Usuario" name="login" value={formData.login} onChange={handleInputChange} className="mb-4" />
        <Input.Password placeholder="Contraseña" name="password" value={formData.password} onChange={handleInputChange} />
      </Modal>

      {/* Modal Registro */}
      <Modal
        title="Registrar Nueva Cuenta"
        open={isRegisterModalVisible}
        onCancel={() => setIsRegisterModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRegisterModalVisible(false)}>Cancelar</Button>,
          <Button key="submit" type="default" variant="outlined" block onClick={handleRegister}>Registrar</Button>,
        ]}
      >
        <Input placeholder="Usuario" value={registerData.login} onChange={(e) => setRegisterData({ ...registerData, login: e.target.value })} className="mb-4" />
        <Input placeholder="Email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="mb-4" />
        <Input.Password placeholder="Contraseña" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="mb-4" />
        <Input.Password placeholder="Confirmar Contraseña" value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} />
      </Modal>

      {/* Modal Nueva Contraseña */}
      <Modal
        title="Establecer Contraseña"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPasswordModalVisible(false)}>Cancelar</Button>,
          <Button key="submit" type="default" onClick={handleSavePassword}>Guardar</Button>,
        ]}
      >
        <Input.Password
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          placeholder="Nueva contraseña"
          className="mb-4"
        />
        <Input.Password
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          placeholder="Repetir contraseña"
        />
      </Modal>
    </header>
  );
};

export default Header;
