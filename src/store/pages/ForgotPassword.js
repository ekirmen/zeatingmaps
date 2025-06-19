import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../backoffice/services/supabaseClient';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      message.success(t('forgot.sent'));
      setEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.message || t('errors.request', 'Error al procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">{t('password.change')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder={t('forgot.placeholder', 'Ingresa tu email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('button.continue')}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;
