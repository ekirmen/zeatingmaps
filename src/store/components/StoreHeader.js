import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../backoffice/services/supabaseClient';
import { registerUser, loginUser } from '../services/authService';
import LinkWithRef from './LinkWithRef';
import { SITE_URL } from '../../utils/siteUrl';
import { useRefParam } from '../../contexts/RefContext';
import { useHeader } from '../../contexts/HeaderContext';

const Header = ({ onLogin, onLogout }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const { header } = useHeader();
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [accountMode, setAccountMode] = useState('login'); // login | register | forgot
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const current = data.session?.user;
      if (current && current.user_metadata?.password_set === false) {
        setIsPasswordModalVisible(true);
      }
    };
    checkSession();
  }, []);

  const handleRegister = async () => {
    try {
      if (!registerData.email)
        throw new Error(t('errors.fields_required', 'Todos los campos son obligatorios'));

      await registerUser({ email: registerData.email.trim() });

      message.success(t('register.success'));
      setIsAccountModalVisible(false);
      setAccountMode('login');
      setRegisterData({ email: '' });
    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message);
    }
  };

    const handleLogin = async () => {
      try {
        if (!formData.email)
          throw new Error(t('errors.enter_credentials', 'Por favor ingrese correo'));

        const { user, session } = await loginUser({
          email: formData.email.trim(),
          password: formData.password.trim()
        });

        if (session && session.access_token) {
          const token = session.access_token;
          localStorage.setItem('token', token);
          onLogin?.({ token, user });
          setIsAccountModalVisible(false);
          setFormData({ email: '', password: '' });
          message.success(t('login.success'));
          if (user?.user_metadata?.password_set !== true) {
            setIsPasswordModalVisible(true);
          }
          navigate(refParam ? `/store?ref=${refParam}` : '/store');
        } else {
          message.success(t('login.email_sent'));
        }
      } catch (error) {
        console.error('Login error:', error);
        setError(error.message || t('errors.login', 'Error al iniciar sesión'));
        message.error(error.message || t('errors.login', 'Error al iniciar sesión'));
        localStorage.removeItem('token');
      }
    };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: SITE_URL });
      if (error) throw error;
      message.success(t('forgot.sent'));
      setForgotEmail('');
      setIsAccountModalVisible(false);
      setAccountMode('login');
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.message || t('errors.request', 'Error al procesar la solicitud'));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    if (typeof onLogout === 'function') onLogout();
    message.success(t('logout.success'));
    if (window.location.pathname === '/store/perfil') {
      navigate(refParam ? `/store?ref=${refParam}` : '/store');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword)
        throw new Error('Complete ambos campos');
      if (passwordData.newPassword !== passwordData.confirmPassword)
        throw new Error('Las contraseñas no coinciden');
      if (passwordData.newPassword.length < 6)
        throw new Error('La contraseña debe tener al menos 6 caracteres');

    const { data, error } = await supabase.auth.updateUser({
      password: passwordData.newPassword.trim(),
      data: { password_set: true }
    });
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
      message.error(error.message || 'Error al guardar contraseña');
    }
  };

  const handleSearch = () => {
    const base = '/store';
    const q = encodeURIComponent(searchTerm.trim());
    const url = refParam
      ? `${base}?ref=${refParam}&q=${q}`
      : `${base}?q=${q}`;
    navigate(url);
  };

  const { theme } = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <header className="header-custom py-4 shadow-md" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
      <div className="container mx-auto flex justify-between items-center px-4">
        <LinkWithRef to="/store" className="text-xl font-bold flex items-center gap-2">
          {header.logoUrl && (
            <img src={header.logoUrl} alt="Logo" className="h-6 w-auto" />
          )}
          {header.companyName}
        </LinkWithRef>

        <nav className="flex gap-4 text-sm">
          <LinkWithRef to="/store" className="hover:underline">{t('header.home')}</LinkWithRef>
          <LinkWithRef to="/store/cart" className="hover:underline">{t('header.cart')}</LinkWithRef>
        </nav>

        <div className="flex items-center gap-2">
          <Input
            placeholder={t('search.placeholder')}
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button onClick={handleSearch} size="small">{t('search.button')}</Button>
          <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} className="border rounded px-1 text-sm">
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </div>

        <div className="space-x-2">
          {localStorage.getItem('token') ? (
            <Button onClick={handleLogout} style={{ backgroundColor: theme.primary, color: theme.btnPrimaryText, borderColor: theme.primary }}>
              {t('header.logout')}
            </Button>
          ) : (
            <Button onClick={() => { setAccountMode('login'); setIsAccountModalVisible(true); }} style={{ backgroundColor: theme.primary, color: theme.btnPrimaryText, borderColor: theme.primary }}>
              {t('header.account')}
            </Button>
          )}
        </div>
      </div>

      {/* Modal Cuenta */}
      <Modal
        title={
          accountMode === 'login'
            ? t('header.login')
            : accountMode === 'register'
            ? t('header.signup')
            : t('header.forgot')
        }
        open={isAccountModalVisible}
        onCancel={() => setIsAccountModalVisible(false)}
        footer={[
          <Button
            key="submit"
            type="default"
            variant="outlined"
            block
            onClick={
              accountMode === 'login'
                ? handleLogin
                : accountMode === 'register'
                ? handleRegister
                : handleForgotPassword
            }
          >
            {accountMode === 'login'
              ? t('header.login')
              : accountMode === 'register'
              ? t('header.register')
              : t('button.continue')}
          </Button>,
        ]}
      >
        {accountMode === 'login' && (
          <>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <Input placeholder={t('header.email')} name="email" value={formData.email} onChange={handleInputChange} className="mb-4" />
            <Input.Password placeholder={t('password.new')} name="password" value={formData.password} onChange={handleInputChange} />
            <div className="mt-2 text-sm space-x-4">
              <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => setAccountMode('forgot')}>{t('header.forgot')}</span>
              <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => setAccountMode('register')}>{t('header.register')}</span>
            </div>
          </>
        )}
        {accountMode === 'register' && (
          <>
            <Input
              placeholder={t('header.email')}
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              className="mb-4"
            />
            <div className="mt-2 text-sm">
              <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => setAccountMode('login')}>{t('header.login')}</span>
            </div>
          </>
        )}
        {accountMode === 'forgot' && (
          <>
            <Input type="email" placeholder={t('forgot.placeholder')} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="mb-4" />
            <div className="mt-2 text-sm">
              <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => setAccountMode('login')}>{t('header.login')}</span>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Nueva Contraseña */}
      <Modal
        title={t('password.change')}
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={[
          <Button key="submit" type="default" onClick={handleSavePassword}>{t('button.save')}</Button>,
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
    </header>
  );
};

export default Header;
