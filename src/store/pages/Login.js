import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../backoffice/services/supabaseClient';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.user_metadata?.password_set === false) {
      setIsPasswordModalVisible(true);
    }
  }, [user]);

  // Detectar si ya hay sesión activa
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
  

  const handleLogin = async (e) => {
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
        ({ error } = await supabase.auth.signInWithOtp({ email: login }));
      }

      if (error) {
        throw new Error(error.message);
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
      message.error(err.message || t('errors.login', 'Error al iniciar sesión'));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword)
        throw new Error(t('errors.fields_required', 'Complete ambos campos'));

      if (passwordData.newPassword !== passwordData.confirmPassword)
        throw new Error(t('errors.passwords_no_match', 'Las contraseñas no coinciden'));

      if (passwordData.newPassword.length < 6)
        throw new Error(t('errors.password_min_length', 'Mínimo 6 caracteres'));

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword.trim(),
        data: { password_set: true }
      });

      if (error) throw error;

      setIsPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      message.success(t('password.updated'));
    } catch (error) {
      console.error(error);
      message.error(error.message || t('errors.save_password', 'Error al guardar contraseña'));
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!resetEmail) throw new Error('Debes ingresar un correo válido');
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;
      message.success('Se envió un correo para recuperar tu contraseña.');
      setIsForgotModalVisible(false);
      setResetEmail('');
    } catch (err) {
      message.error(err.message || 'Error al solicitar recuperación');
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
            onChange={(e) => setLogin(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">{t('password.new')}:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            onClick={() => setIsForgotModalVisible(true)}
          >
            ¿Olvidaste tu contraseña?
          </button>
          {user && (
            <button
              type="button"
              className="text-green-600 hover:underline"
              onClick={() => setIsPasswordModalVisible(true)}
            >
              Cambiar contraseña
            </button>
          )}
        </div>
      </form>

      {/* Modal cambiar contraseña */}
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

      {/* Modal recuperar contraseña */}
      <Modal
        title="Recuperar contraseña"
        open={isForgotModalVisible}
        onCancel={() => setIsForgotModalVisible(false)}
        footer={[
          <Button key="send" type="primary" onClick={handleForgotPassword}>
            Enviar correo
          </Button>,
        ]}
      >
        <Input
          type="email"
          placeholder="Correo de recuperación"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default Login;
