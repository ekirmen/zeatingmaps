import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Input, Button, message, Drawer } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { registerUser, loginUser } from '../services/authService';
import { getAuthMessage } from '../../utils/authErrorMessages';
import LinkWithRef from './LinkWithRef';
import { SITE_URL } from '../../utils/siteUrl';
import { useRefParam } from '../../contexts/RefContext';
import { useHeader } from '../../contexts/HeaderContext';
import {
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  HomeOutlined,
  CloseOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

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
    email: '',
    password: '',
    phone: '',
    phoneCode: '+58',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  });
  const [passwordVisibility, setPasswordVisibility] = useState({ login: false, register: false });
  const [isSubmitting, setIsSubmitting] = useState({ login: false, register: false, forgot: false });
  const [postLoginRedirect, setPostLoginRedirect] = useState(null);
  
  // Close mobile drawer automatically on desktop viewport
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const DEBUG = typeof window !== 'undefined' && window.__DEBUG === true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const current = data.session?.user;
      if (current && current.user_metadata?.password_set === false) {
        setIsPasswordModalVisible(true);
      }
    };
    checkSession();

    // Debug eliminado
  }, [isAccountModalVisible]);

  useEffect(() => {
    let isMounted = true;

    const syncSessionState = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        const hasSession = !!data?.session?.access_token;
        if (hasSession && typeof window !== 'undefined') {
          localStorage.setItem('token', data.session.access_token);
        }
        setIsAuthenticated(prev => hasSession || (typeof window !== 'undefined' ? !!localStorage.getItem('token') : prev));
      } catch (error) {
        if (!isMounted) return;
        if (typeof window !== 'undefined') {
          setIsAuthenticated(!!localStorage.getItem('token'));
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    syncSessionState();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window !== 'undefined') {
        if (session?.access_token) {
          localStorage.setItem('token', session.access_token);
        } else {
          localStorage.removeItem('token');
        }
      }
      if (isMounted) {
        setIsAuthenticated(!!session?.access_token);
      }
    });

    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        setIsAuthenticated(!!event.newValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  const handleRegister = async () => {
    try {
      if (!registerData.email || !registerData.password || !registerData.phone)
        throw new Error(t('errors.fields_required', 'Todos los campos son obligatorios'));

      if (registerData.password.length < 6)
        throw new Error(t('errors.password_min_length', 'Mínimo 6 caracteres'));

      await registerUser({
        email: registerData.email.trim(),
        password: registerData.password.trim(),
        phone: `${registerData.phoneCode}${registerData.phone}`,
      });

      message.success(t('register.success'));
      setIsAccountModalVisible(false);
      setAccountMode('login');
      setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
    } catch (error) {
      const feedbackMessage = error?.message || t('errors.request', 'Error al procesar la solicitud');
      setError(feedbackMessage);
      message.error(feedbackMessage);
    }
  };

  const handleLogin = async () => {
    try {
      setError('');
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
        setIsAuthenticated(true);
        setIsAccountModalVisible(false);
        setFormData({ email: '', password: '' });
        message.success(t('login.success'));
        if (user?.user_metadata?.password_set !== true) {
          setIsPasswordModalVisible(true);
        }
        const targetPath = postLoginRedirect || (refParam ? `/store?ref=${refParam}` : '/store');
        setPostLoginRedirect(null);
        navigate(targetPath);
      } else {
        message.success(t('login.email_sent'));
      }
    } catch (error) {
      const feedbackMessage = getAuthMessage(error, t, 'errors.login');
      const messageType = error?.type && message[error.type] ? error.type : 'error';
      setError(feedbackMessage);
      message[messageType](feedbackMessage);
      localStorage.removeItem('token');
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${SITE_URL}/store/reset-password`,
      });
      if (error) throw error;
      message.success(t('forgot.sent'));
      setForgotEmail('');
      setIsAccountModalVisible(false);
      setAccountMode('login');
    } catch (error) {
      const feedbackMessage = error?.message || t('errors.request', 'Error al procesar la solicitud');
      setError(feedbackMessage);
      message.error(feedbackMessage);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    if (typeof onLogout === 'function') onLogout();
    message.success(t('logout.success'));
    setIsAuthenticated(false);
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
    setIsAuthenticated(!!token);
    message.success(t('password.updated'));
    navigate(refParam ? `/store?ref=${refParam}` : '/store');
    } catch (error) {
      message.error(error.message || 'Error al guardar contraseña');
    }
  };

  const openAccountModal = () => {
    try {
      setAccountMode('login');
      setFormData({ email: '', password: '' });
      setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
      setForgotEmail('');
      setError('');
      setPasswordVisibility({ login: false, register: false });
      setPostLoginRedirect(null);
      setIsAccountModalVisible(true);
    } catch (error) {
      // Silencioso
    }
  };

  const handleSwitchMode = (mode) => {
    setAccountMode(mode);
    setError('');
    setPasswordVisibility({ login: false, register: false });
  };

  useEffect(() => {
    const handleExternalModalOpen = (event) => {
      const detail = event.detail || {};
      const targetMode = detail.mode || 'login';
      setAccountMode(targetMode);
      if (detail?.prefill?.email) {
        setFormData(prev => ({ ...prev, email: detail.prefill.email }));
      }
      setError('');
      setPasswordVisibility({ login: false, register: false });
      const redirectTarget =
        detail.redirectTo || detail.redirect_to || detail.redirect || null;
      setPostLoginRedirect(redirectTarget);
      setIsAccountModalVisible(true);
    };

    window.addEventListener('store:open-account-modal', handleExternalModalOpen);

    return () => {
      window.removeEventListener('store:open-account-modal', handleExternalModalOpen);
    };
  }, []);

  const { theme } = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (accountMode === 'login' && !isSubmitting.login) {
      setIsSubmitting(prev => ({ ...prev, login: true }));
      try {
        await handleLogin();
      } finally {
        setIsSubmitting(prev => ({ ...prev, login: false }));
      }
    } else if (accountMode === 'register' && !isSubmitting.register) {
      setIsSubmitting(prev => ({ ...prev, register: true }));
      try {
        await handleRegister();
      } finally {
        setIsSubmitting(prev => ({ ...prev, register: false }));
      }
    } else if (accountMode === 'forgot' && !isSubmitting.forgot) {
      setIsSubmitting(prev => ({ ...prev, forgot: true }));
      try {
        await handleForgotPassword();
      } finally {
        setIsSubmitting(prev => ({ ...prev, forgot: false }));
      }
    }
  };

  
  const DEBUG = typeof window !== 'undefined' && window.__DEBUG === true;
  
  
  return (
    <header className="store-header">
      <div className="store-container">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <LinkWithRef to="/store" className="store-header logo">
            {header.logoUrl && (
              <img src={header.logoUrl} alt="Logo" className="store-header logo img" />
            )}
            <span className="hidden sm:inline">{header.companyName}</span>
          </LinkWithRef>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex store-header nav">
            <LinkWithRef to="/store">{t('header.home')}</LinkWithRef>
            <LinkWithRef to="/store/cart">{t('header.cart')}</LinkWithRef>
            {isAuthenticated && (
              <LinkWithRef to="/store/perfil">
                {t('header.profile')}
              </LinkWithRef>
            )}
          </nav>

          {/* Desktop Language Selector */}
          <div className="hidden md:flex items-center gap-3">
            <select 
              value={i18n.language} 
              onChange={e => i18n.changeLanguage(e.target.value)} 
              className="store-header language-selector"
              style={{
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(5px)'
              }}
            >
              <option value="es" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>ES</option>
              <option value="en" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>EN</option>
            </select>
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="store-button store-button-outline">
                {t('header.logout')}
              </button>
            ) : (
              <button onClick={openAccountModal} className="store-button store-button-primary">
                {t('header.account')}
              </button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="mobile-actions flex lg:hidden items-center gap-2">
            {/* Mobile Account */}
            {isAuthenticated ? (
              <LinkWithRef to="/store/perfil" className="store-header mobile-action-btn">
                <UserOutlined />
              </LinkWithRef>
            ) : (
              <button
                onClick={openAccountModal}
                className="store-header mobile-action-btn"
                aria-label="Cuenta"
              >
                <UserOutlined />
              </button>
            )}

            {/* Mobile Cart */}
            <LinkWithRef to="/store/cart" className="store-header mobile-action-btn">
              <ShoppingCartOutlined />
            </LinkWithRef>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="store-header mobile-action-btn"
            >
              <MenuOutlined />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#1f2937',
            fontWeight: '600'
          }}>
            {header.logoUrl && (
              <img src={header.logoUrl} alt="Logo" style={{ height: '24px', width: 'auto' }} />
            )}
            <span>{header.companyName}</span>
          </div>
        }
        placement="right"
        onClose={() => setIsMobileMenuOpen(false)}
        open={isMobileMenuOpen}
        width={280}
        className="mobile-menu-drawer"
        styles={{
          body: {
            padding: '16px',
            backgroundColor: '#ffffff'
          },
          header: {
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px'
          },
          content: {
            backgroundColor: '#ffffff'
          }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LinkWithRef 
              to="/store" 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                color: '#1f2937',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'all 0.2s',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HomeOutlined style={{ marginRight: '8px', fontSize: '16px' }} />
              {t('header.home')}
            </LinkWithRef>
            
            <LinkWithRef 
              to="/store/cart" 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                color: '#1f2937',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'all 0.2s',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingCartOutlined style={{ marginRight: '8px', fontSize: '16px' }} />
              {t('header.cart')}
            </LinkWithRef>
            
            {isAuthenticated && (
              <LinkWithRef
                to="/store/perfil"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  color: '#1f2937',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1f2937';
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserOutlined style={{ marginRight: '8px', fontSize: '16px' }} />
                {t('header.profile')}
              </LinkWithRef>
            )}
          </div>

          {/* Language Selector */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Idioma
            </label>
            <select 
              value={i18n.language} 
              onChange={e => i18n.changeLanguage(e.target.value)} 
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                color: '#1f2937'
              }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Auth Section */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: '#1f2937',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                {t('header.logout')}
              </button>
            ) : (
              <button 
                onClick={() => {
                  openAccountModal();
                  setIsMobileMenuOpen(false);
                }} 
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                {t('header.account')}
              </button>
            )}
          </div>
        </div>
      </Drawer>

      {/* Modal Cuenta */}
      
      <Modal
        title={null}
        open={isAccountModalVisible}
        zIndex={1000}
        style={{ position: 'relative' }}
        width={typeof window !== 'undefined' && window.innerWidth <= 768 ? '90%' : 420}
        centered
        maskClosable={true}
        destroyOnClose={true}
        getContainer={() => document.body}
        forceRender={true}
        afterClose={() => {
          setAccountMode('login');
          setFormData({ email: '', password: '' });
          setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
          setForgotEmail('');
          setError('');
          setPasswordVisibility({ login: false, register: false });
          setIsSubmitting({ login: false, register: false, forgot: false });
        }}
        keyboard={true}
        closable={false}
        confirmLoading={false}
        wrapClassName="account-modal-wrapper"
        className="account-modal store-modal improved-account-modal"
        bodyStyle={{ padding: 0 }}
        onCancel={() => {
          setIsAccountModalVisible(false);
          setAccountMode('login');
          setFormData({ email: '', password: '' });
          setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
          setForgotEmail('');
          setError('');
          setPasswordVisibility({ login: false, register: false });
          setIsSubmitting({ login: false, register: false, forgot: false });
        }}
        footer={null}
      >
        <div className="account-modal-panel">
          <button
            type="button"
            className="account-modal-close"
            onClick={() => {
              setIsAccountModalVisible(false);
              setAccountMode('login');
              setFormData({ email: '', password: '' });
              setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
              setForgotEmail('');
              setError('');
              setPasswordVisibility({ login: false, register: false });
              setIsSubmitting({ login: false, register: false, forgot: false });
            }}
            aria-label="Cerrar"
          >
            <CloseOutlined />
          </button>

          <div className="account-modal-header">
            <div className="account-modal-avatar">
              <UserOutlined />
            </div>
            <h2 className="account-modal-title">
              {accountMode === 'login'
                ? 'Iniciar Sesión'
                : accountMode === 'register'
                ? 'Crear Cuenta'
                : 'Recuperar Contraseña'}
            </h2>
            {accountMode !== 'login' && (
              <p className="account-modal-subtitle">
                {accountMode === 'register'
                  ? 'Crea tu cuenta y disfruta de beneficios exclusivos'
                  : 'Te enviaremos un enlace para restablecer tu contraseña'}
              </p>
            )}
          </div>

          <div className="account-modal-tabs">
            <button
              type="button"
              className={`account-modal-tab ${accountMode === 'login' ? 'is-active' : ''}`}
              onClick={() => handleSwitchMode('login')}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`account-modal-tab ${accountMode === 'register' ? 'is-active' : ''}`}
              onClick={() => handleSwitchMode('register')}
            >
              Crear Cuenta
            </button>
          </div>

          <form id={accountMode} className="account-form" onSubmit={handleFormSubmit}>
            {error && <div className="account-form-error">{error}</div>}

            {accountMode === 'login' && (
              <>
                <div className="account-form-field">
                  <label htmlFor="login_email" className="account-form-label">
                    Correo electrónico
                  </label>
                  <div className="account-input-wrapper">
                    <MailOutlined className="account-input-icon" />
                    <input
                      autoComplete="email"
                      placeholder="tu@email.com"
                      id="login_email"
                      aria-required="true"
                      className="account-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="account-form-field">
                  <label htmlFor="login_password" className="account-form-label">
                    Contraseña
                  </label>
                  <div className="account-input-wrapper">
                    <LockOutlined className="account-input-icon" />
                    <input
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
                      id="login_password"
                      aria-required="true"
                      className="account-input"
                      type={passwordVisibility.login ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="account-password-toggle"
                      onClick={() =>
                        setPasswordVisibility(prev => ({ ...prev, login: !prev.login }))
                      }
                      aria-label={passwordVisibility.login ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {passwordVisibility.login ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="store-button store-button-primary store-button-lg store-button-block account-submit"
                  disabled={isSubmitting.login}
                >
                  {isSubmitting.login ? 'Procesando...' : 'Iniciar Sesión'}
                </button>

                <a className="account-link-muted" href="/store/forgot-password">
                  ¿Olvidaste tu contraseña?
                </a>
              </>
            )}

            {accountMode === 'register' && (
              <>
                <div className="account-form-field">
                  <label htmlFor="register_email" className="account-form-label">
                    Correo electrónico
                  </label>
                  <div className="account-input-wrapper">
                    <MailOutlined className="account-input-icon" />
                    <input
                      autoComplete="email"
                      placeholder="tu@email.com"
                      id="register_email"
                      aria-required="true"
                      className="account-input"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="account-form-field">
                  <label htmlFor="register_phone" className="account-form-label">
                    Teléfono
                  </label>
                  <div className="account-phone-group">
                    <div className="account-phone-prefix">
                      <PhoneOutlined />
                      <select
                        value={registerData.phoneCode}
                        onChange={(e) => setRegisterData({ ...registerData, phoneCode: e.target.value })}
                      >
                        <option value="+58">🇻🇪 +58</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                    </div>
                    <input
                      placeholder="Número de teléfono"
                      id="register_phone"
                      aria-required="true"
                      className="account-input"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="account-form-field">
                  <label htmlFor="register_password" className="account-form-label">
                    Contraseña
                  </label>
                  <div className="account-input-wrapper">
                    <LockOutlined className="account-input-icon" />
                    <input
                      autoComplete="new-password"
                      placeholder="Crea una contraseña segura"
                      id="register_password"
                      aria-required="true"
                      className="account-input"
                      type={passwordVisibility.register ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="account-password-toggle"
                      onClick={() =>
                        setPasswordVisibility(prev => ({ ...prev, register: !prev.register }))
                      }
                      aria-label={passwordVisibility.register ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {passwordVisibility.register ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="store-button store-button-primary store-button-lg store-button-block account-submit"
                  disabled={isSubmitting.register}
                >
                  {isSubmitting.register ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>

                <div className="account-divider">
                  <span>o</span>
                </div>

                <p className="account-alt-text">
                  ¿Ya tienes cuenta?
                  <button
                    type="button"
                    className="account-inline-link"
                    onClick={() => handleSwitchMode('login')}
                  >
                    Iniciar sesión
                  </button>
                </p>
              </>
            )}

            {accountMode === 'forgot' && (
              <>
                <div className="account-form-field">
                  <label htmlFor="forgot_email" className="account-form-label">
                    Correo electrónico
                  </label>
                  <div className="account-input-wrapper">
                    <MailOutlined className="account-input-icon" />
                    <input
                      autoComplete="email"
                      placeholder="tu@email.com"
                      id="forgot_email"
                      aria-required="true"
                      className="account-input"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="store-button store-button-primary store-button-lg store-button-block account-submit"
                  disabled={isSubmitting.forgot}
                >
                  {isSubmitting.forgot ? 'Enviando...' : 'Enviar Enlace'}
                </button>

                <p className="account-alt-text">
                  ¿Recordaste tu contraseña?
                  <button
                    type="button"
                    className="account-inline-link"
                    onClick={() => handleSwitchMode('login')}
                  >
                    Iniciar sesión
                  </button>
                </p>
              </>
            )}
          </form>
        </div>
      </Modal>

      {/* Modal Nueva Contraseña */}
      <Modal
        title={t('password.change')}
        open={isPasswordModalVisible}
        zIndex={1000}
        width={400}
        centered
        maskClosable={true}
        destroyOnClose={true}
        getContainer={() => document.body}
        forceRender={true}
        afterClose={() => {
          setPasswordData({ newPassword: '', confirmPassword: '' });
        }}
        keyboard={true}
        closable={true}
        confirmLoading={false}
        okButtonProps={{ type: 'primary' }}
        cancelButtonProps={{ type: 'default' }}
        wrapClassName="password-modal-wrapper"
        className="password-modal"
        titleRender={(title) => (
          <div style={{ color: theme.headerText, fontWeight: 'bold' }}>
            {title}
          </div>
        )}
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
