import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      message.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al restablecer contraseña');
      message.success('Contraseña restablecida correctamente');
      navigate('/store/login-register');
    } catch (error) {
      console.error('Reset password error:', error);
      message.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Restablecer Contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input.Password
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input.Password
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
