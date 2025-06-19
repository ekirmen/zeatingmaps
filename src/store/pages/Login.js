import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { Modal, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const navigate = useNavigate();
  const { refParam } = useRefParam();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: login, password });

      if (error || !data.session) {
        throw new Error(error?.message || t('errors.auth', 'Error de autenticación'));
      }

      const token = data.session.access_token;
      localStorage.setItem('token', token);

      onLogin?.({ token, user: data.user });
      message.success(t('login.success'));
      navigate(refParam ? `/store?ref=${refParam}` : '/store');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      message.error(error.message || t('errors.login', 'Error al iniciar sesión'));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword)
        throw new Error(t('errors.fields_required', 'Complete ambos campos'));
      if (passwordData.newPassword !== passwordData.confirmPassword)
        throw new Error(t('errors.passwords_no_match', 'Las contraseñas no coinciden'));
      if (passwordData.newPassword.length < 6)
        throw new Error(t('errors.password_min_length', 'La contraseña debe tener al menos 6 caracteres'));

      const { data, error } = await supabase.auth.updateUser({ password: passwordData.newPassword.trim() });
      if (error) throw error;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) localStorage.setItem('token', token);
      setIsPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      onLogin?.({ token, user: data.user });
      message.success(t('password.updated'));
      navigate(refParam ? `/store?ref=${refParam}` : '/store');
    } catch (error) {
      console.error('Set password error:', error);
      message.error(error.message || t('errors.save_password', 'Error al guardar contraseña'));
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
      <div>
        <label>{t('header.login')}:</label>
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
      </div>
      <div>
        <label>{t('password.new')}:</label>
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
        {t('header.login')}
      </Button>
      <div className="mt-2">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          {t('header.forgot')}
        </Link>
      </div>
    </form>

    <Modal
      title={t('password.change')}
      open={isPasswordModalVisible}
      onCancel={() => setIsPasswordModalVisible(false)}
      footer={[
        <Button key="save" type="primary" onClick={handleSavePassword}>{t('button.save')}</Button>,
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