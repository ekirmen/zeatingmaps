import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const Login = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        const token = `Bearer ${data.token}`;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', data.userId);
        
        // Llamar a onLogin con el token y los datos del usuario
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

  return (
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
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Iniciar Sesión
      </button>
    </form>
  );
};

export default Login;