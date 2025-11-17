import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Alert, Typography, Input, Button, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabaseClient';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('checking');
  const [userEmail, setUserEmail] = useState('');

  const hashParams = useMemo(() => new URLSearchParams(location.hash.replace(/^#/, '')), [location.hash]);

  useEffect(() => {
    const prepareSession = async () => {
      try {
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (!accessToken || !refreshToken || type !== 'recovery') {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus('ready');
            setUserEmail(data.session.user?.email || '');
            return;
          }
          setStatus('invalid');
          return;
        }

        const { error, data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error || !data.session) {
          console.error('Error setting recovery session', error);
          setStatus('invalid');
          return;
        }

        window.history.replaceState({}, '', location.pathname);
        setUserEmail(data.session.user?.email || '');
        setStatus('ready');
      } catch (error) {
        console.error('Recovery flow failed', error);
        setStatus('invalid');
      }
    };

    prepareSession();
  }, [hashParams, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      message.error(t('errors.passwords_no_match'));
      return;
    }
    if (password.trim().length < 8) {
      message.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });
      if (error) throw error;
      message.success(t('password.updated'));
      navigate('/store/login');
    } catch (error) {
      console.error('Reset password error:', error);
      message.error(error.message || t('errors.request', 'Error al procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Card loading title="Validando enlace seguro" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Card>
          <Alert
            type="error"
            showIcon
            message="El enlace de recuperación no es válido o expiró"
            description={(
              <Space direction="vertical">
                <Typography.Paragraph className="mb-0">
                  Solicita un nuevo enlace desde la opción "¿Olvidaste tu contraseña?" para continuar.
                </Typography.Paragraph>
                <Button type="primary" onClick={() => navigate('/store/forgot-password')}>
                  Solicitar nuevo enlace
                </Button>
              </Space>
            )}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <Typography.Title level={3} className="mb-2">
          {t('password.change')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="mb-4">
          {userEmail ? `Actualiza la contraseña para ${userEmail}` : 'Crea una nueva contraseña segura.'}
        </Typography.Paragraph>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input.Password
            placeholder={t('password.new')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input.Password
            placeholder={t('password.repeat')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Button type="primary" htmlType="submit" loading={loading} block>
            {t('button.save')}
          </Button>
          <Button type="link" onClick={() => navigate('/store/login')} block>
            Volver al inicio de sesión
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
