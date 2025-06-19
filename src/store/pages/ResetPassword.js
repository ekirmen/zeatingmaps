import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      message.error(t('errors.passwords_no_match'));
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
      if (!response.ok) throw new Error(data.message || t('errors.reset_password', 'Error al restablecer contraseña'));
      message.success(t('password.updated'));
      navigate('/store');
    } catch (error) {
      console.error('Reset password error:', error);
      message.error(error.message || t('errors.request', 'Error al procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">{t('password.change')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input.Password
          placeholder={t('password.new')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input.Password
          placeholder={t('password.repeat')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('button.save')}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
