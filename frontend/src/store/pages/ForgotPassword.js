import React, { useState } from 'react';
import { Input, Button, message } from 'antd';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al enviar correo');
      message.success('Se envió un enlace de recuperación a tu correo');
      setEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Recuperar Contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Ingresa tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="primary" htmlType="submit" loading={loading}>
          Enviar enlace
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;
