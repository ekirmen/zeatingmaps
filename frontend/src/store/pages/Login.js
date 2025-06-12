import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button, message } from 'antd';

const Login = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        const formattedToken = data.token.startsWith('Bearer') ? data.token : `Bearer ${data.token}`;
        localStorage.setItem('token', formattedToken);
        localStorage.setItem('userId', data.user._id);

        if (data.passwordPending) {
          setPendingUser(data.user);
          setIsPasswordModalVisible(true);
          return;
        }

        onLogin?.({ token: data.token, user: data.user });
        message.success('Inicio de sesión exitoso');
        navigate('/store');
      } else {
        message.error(data.message || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      message.error('Error al iniciar sesión');
    }
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

  return (
    <>
    <form onSubmit={handleSubmit}>
      <div>
        <label>Login:</label>
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button
        type="primary"
        htmlType="submit"
        className="mt-4"
      >
        Iniciar Sesión
      </Button>
    </form>

    <Modal
      title="Establecer Contraseña"
      open={isPasswordModalVisible}
      onCancel={() => setIsPasswordModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsPasswordModalVisible(false)}>Cancelar</Button>,
        <Button key="save" type="primary" onClick={handleSavePassword}>Guardar</Button>,
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
    </>
  );
};

export default Login;