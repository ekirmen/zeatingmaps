import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button, message } from '../../utils/antdComponents';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabaseClient';
import { createAuthError, getAuthMessage } from '../../utils/authErrorMessages';

import { getStoreBaseUrl } from '../../utils/siteUrl';
const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.user_metadata?.password_set === false) {
      setIsPasswordModalVisible(true);
    }
  }, [user]);

  // Detectar si ya hay sesi³n activa
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
        onLogin?.({ user: data.session.user });
        if (data.session.user.user_metadata?.password_set === false) {
          setIsPasswordModalVisible(true);
        } else {
          navigate('/store');
        }
      }
    };
    checkSession();
  }, [navigate, onLogin]);

  const handleLogin = async e => {
    e.preventDefault();
    try {
      let data = null;
      let error = null;

      if (password) {
        ({ data, error } = await supabase.auth.signInWithPassword({
          email: login,
          password,
        }));
      } else {
        ({ error } = await supabase.auth.signInWithOtp({
          email: login,
          options: { emailRedirectTo: getStoreBaseUrl() },
        }));
      }

      if (error) {
        throw await createAuthError({ error, email: login, supabaseClient: supabase });
      }

      if (data?.session) {
        setUser(data.user);
        onLogin?.({ user: data.user });
        message.success(t('login.success'));
        if (data.user.user_metadata?.password_set === false) {
          setIsPasswordModalVisible(true);
        } else {
          navigate('/store');
        }
      } else {
        message.success(t('login.email_sent'));
      }
    } catch (err) {
      console.error(err);
      const feedbackMessage = getAuthMessage(err, t, 'errors.login');
      const messageType = err?.type && message[err.type] ? err.type : 'error';
      message[messageType](feedbackMessage);
    }
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword)
        throw new Error(t('errors.fields_required', 'Complete ambos campos'));

      if (passwordData.newPassword !== passwordData.confirmPassword)
        throw new Error(t('errors.passwords_no_match', 'Las contrase±as no coinciden'));

      if (passwordData.newPassword.length < 6)
        throw new Error(t('errors.password_min_length', 'M­nimo 6 caracteres'));

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword.trim(),
        data: { password_set: true },
      });

      if (error) throw await createAuthError({ error, email: login, supabaseClient: supabase });

      setIsPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      message.success(t('password.updated'));
    } catch (error) {
      console.error(error);
      message.error(error.message || t('errors.save_password', 'Error al guardar contrase±a'));
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto mt-10">
        <div>
          <label className="block mb-1">{t('header.login')}:</label>
          <input
            type="email"
            value={login}
            onChange={e => setLogin(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">{t('password.new')}:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <Button type="primary" htmlType="submit" className="w-full">
          {t('header.login')}
        </Button>

        <div className="flex justify-between text-sm mt-2">
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => navigate('/store/forgot-password')}
          >
            ¿Olvidaste tu contrase±a?
          </button>
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => navigate('/store/register')}
          >
            {t('header.register')}
          </button>
          {user && (
            <button
              type="button"
              className="text-green-600 hover:underline"
              onClick={() => setIsPasswordModalVisible(true)}
            >
              Cambiar contrase±a
            </button>
          )}
        </div>
      </form>

      {/* Modal cambiar contrase±a */}
      <Modal
        title={t('password.change')}
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={[
          <Button key="save" type="primary" onClick={handleSavePassword}>
            {t('button.save')}
          </Button>,
        ]}
      >
        <Input.Password
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          placeholder={t('password.new')}
          className="mb-4"
        />
        <Input.Password
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          placeholder={t('password.repeat')}
        />
      </Modal>
    </>
  );
};

export default Login;
