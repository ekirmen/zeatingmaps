import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <- Cambiado
import { message } from '../utils/antdComponents';
import API_BASE_URL from '../utils/apiBase';

const Login = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // <- Cambiado

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const API_URL = API_BASE_URL;
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        onLogin(data.userId);

        message.success('Inicio de sesión exitoso');
        navigate('/store'); // <- Cambiado
      } else {
        message.error(data.message);
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
        <input type="text" value={login} onChange={e => setLogin(e.target.value)} required />
      </div>
      <div>
        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};

export default Login;
