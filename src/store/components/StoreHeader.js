import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Input, Button, message, Drawer } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { registerUser, loginUser } from '../services/authService';
import LinkWithRef from './LinkWithRef';
import { SITE_URL } from '../../utils/siteUrl';
import { useRefParam } from '../../contexts/RefContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MenuOutlined, SearchOutlined, UserOutlined, ShoppingCartOutlined, HomeOutlined } from '@ant-design/icons';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
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
        setError(error.message || t('errors.login', 'Error al iniciar sesión'));
        message.error(error.message || t('errors.login', 'Error al iniciar sesión'));
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

  const openAccountModal = () => {
    try {
      setAccountMode('login');
      setFormData({ email: '', password: '' });
      setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
      setForgotEmail('');
      setError('');
      setIsAccountModalVisible(true);
    } catch (error) {
      // Silencioso
    }
  };

  const { theme } = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
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
            {localStorage.getItem('token') && (
              <LinkWithRef to="/store/perfil">
                {t('header.profile')}
              </LinkWithRef>
            )}
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex store-header search-container">
            <input
              type="text"
              placeholder={t('search.placeholder')}
              className="store-header search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={handleSearch} className="store-header search-button">
              {t('search.button')}
            </button>
            <select 
              value={i18n.language} 
              onChange={e => i18n.changeLanguage(e.target.value)} 
              className="store-header language-selector"
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* Desktop Auth + Cart */}
          <div className="hidden lg:flex items-center gap-2">
            <LinkWithRef to="/store/cart" className="store-button store-button-outline">
              {t('header.cart')}
            </LinkWithRef>
            {localStorage.getItem('token') ? (
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
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="store-header mobile-action-btn"
            >
              <SearchOutlined />
            </button>
            
            {/* Mobile Account */}
            {localStorage.getItem('token') ? (
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

        {/* Mobile Search Bar */}
        {isSearchVisible && (
          <div className="md:hidden pb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="store-header search-input flex-1"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button onClick={handleSearch} className="store-header search-button">
                {t('search.button')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            {header.logoUrl && (
              <img src={header.logoUrl} alt="Logo" className="h-6 w-auto" />
            )}
            {header.companyName}
          </div>
        }
        placement="right"
        onClose={() => setIsMobileMenuOpen(false)}
        open={isMobileMenuOpen}
        width={280}
        className="mobile-menu-drawer"
      >
        <div className="flex flex-col space-y-4">
          {/* Navigation Links */}
          <div className="space-y-2">
            <LinkWithRef 
              to="/store" 
              className="mobile-menu-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HomeOutlined className="mr-2" />
              {t('header.home')}
            </LinkWithRef>
            
            <LinkWithRef 
              to="/store/cart" 
              className="mobile-menu-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingCartOutlined className="mr-2" />
              {t('header.cart')}
            </LinkWithRef>
            
            {localStorage.getItem('token') && (
              <LinkWithRef 
                to="/store/perfil" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserOutlined className="mr-2" />
                {t('header.profile')}
              </LinkWithRef>
            )}
          </div>

          {/* Language Selector */}
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium mb-2">Idioma</label>
            <select 
              value={i18n.language} 
              onChange={e => i18n.changeLanguage(e.target.value)} 
              className="w-full p-2 border rounded"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Auth Section */}
          <div className="pt-4 border-t">
            {localStorage.getItem('token') ? (
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }} 
                className="w-full store-button store-button-outline"
              >
                {t('header.logout')}
              </button>
            ) : (
              <button 
                onClick={() => {
                  openAccountModal();
                  setIsMobileMenuOpen(false);
                }} 
                className="w-full store-button store-button-primary"
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
        width={400}
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
        }}
        keyboard={true}
        closable={true}
        confirmLoading={false}
        okButtonProps={{ type: 'primary' }}
        cancelButtonProps={{ type: 'default' }}
        wrapClassName="account-modal-wrapper"
        className="account-modal store-modal"
        onCancel={() => {
          setIsAccountModalVisible(false);
          setAccountMode('login');
          setFormData({ email: '', password: '' });
          setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
          setForgotEmail('');
          setError('');
        }}
        footer={null}
      >
        {/* Header personalizado */}
        <div className="store-text-center">
          <UserOutlined className="store-text-2xl store-text-primary mb-2" />
          <div className="store-text-lg store-font-semibold">
            {accountMode === 'login' ? 'Iniciar Sesión para Continuar' : 
             accountMode === 'register' ? 'Crear Cuenta Nueva' : 
             'Recuperar Contraseña'}
          </div>
          <div className="store-text-sm store-text-gray-600">
            {accountMode === 'login' ? 'Accede a tu cuenta para continuar' :
             accountMode === 'register' ? 'Crea tu cuenta para comenzar' :
             'Te enviaremos un enlace para restablecer tu contraseña'}
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              accountMode === 'login' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAccountMode('login')}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              accountMode === 'register' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAccountMode('register')}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Contenido del formulario */}
        <form id={accountMode} className="ant-form ant-form-vertical ant-form-large">
          {accountMode === 'login' && (
            <>
              {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
              <div className="ant-form-item ant-form-item-has-success">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-label">
                    <label htmlFor="login_email" className="ant-form-item-required" title="Correo electrónico">
                      Correo electrónico
                    </label>
                  </div>
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <span className="ant-input-affix-wrapper ant-input-affix-wrapper-lg ant-input-outlined ant-input-status-success">
                          <span className="ant-input-prefix">
                            <span role="img" aria-label="mail" className="anticon anticon-mail">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="mail" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232l-42.8-33.3-39.3 50.5 27.6 21.5 341.6 265.6a55.99 55.99 0 0068.7 0L888 270.8l27.6-21.5-39.3-50.5-42.7 33.2z"></path>
                              </svg>
                            </span>
                          </span>
                          <input
                            autoComplete="email"
                            placeholder="tu@email.com"
                            id="login_email"
                            aria-required="true"
                            className="ant-input ant-input-lg"
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-form-item ant-form-item-has-success">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-label">
                    <label htmlFor="login_password" className="ant-form-item-required" title="Contraseña">
                      Contraseña
                    </label>
                  </div>
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <span className="ant-input-affix-wrapper ant-input-affix-wrapper-lg ant-input-outlined ant-input-status-success ant-input-password">
                          <span className="ant-input-prefix">
                            <span role="img" aria-label="lock" className="anticon anticon-lock">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="lock" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z"></path>
                              </svg>
                            </span>
                          </span>
                          <input
                            autoComplete="current-password"
                            placeholder="Tu contraseña"
                            id="login_password"
                            aria-required="true"
                            type="password"
                            className="ant-input ant-input-lg"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                          />
                          <span className="ant-input-suffix">
                            <span role="img" aria-label="eye" tabIndex="-1" className="anticon anticon-eye ant-input-password-icon">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="eye" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"></path>
                              </svg>
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-form-item mb-4">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <button 
                          type="submit" 
                          className="store-button store-button-primary store-button-lg store-button-block"
                          onClick={handleLogin}
                        >
                          Iniciar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mb-4">
                <button 
                  type="button" 
                  className="ant-btn ant-btn-link ant-btn-color-link ant-btn-variant-link ant-btn-lg text-blue-600"
                  onClick={() => setAccountMode('forgot')}
                >
                  ¿No tienes contraseña? Enviar enlace de acceso
                </button>
              </div>
              <div className="ant-divider ant-divider-horizontal ant-divider-with-text ant-divider-with-text-center" role="separator">
                <span className="ant-divider-inner-text">
                  <span className="ant-typography ant-typography-secondary text-sm">o</span>
                </span>
              </div>
              <div className="text-center">
                <span className="ant-typography ant-typography-secondary text-sm">
                  ¿No tienes cuenta? 
                  <button 
                    type="button"
                    className="ant-typography text-blue-600 cursor-pointer hover:underline ml-1"
                    onClick={() => setAccountMode('register')}
                  >
                    Crear cuenta nueva
                  </button>
                </span>
              </div>
              <div className="text-center mt-4">
                <a className="ant-typography text-sm text-gray-500" href="/store/forgot-password">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </>
          )}

          {accountMode === 'register' && (
            <>
              {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
              <div className="ant-form-item ant-form-item-has-success">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-label">
                    <label htmlFor="register_email" className="ant-form-item-required" title="Correo electrónico">
                      Correo electrónico
                    </label>
                  </div>
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <span className="ant-input-affix-wrapper ant-input-affix-wrapper-lg ant-input-outlined ant-input-status-success">
                          <span className="ant-input-prefix">
                            <span role="img" aria-label="mail" className="anticon anticon-mail">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="mail" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232l-42.8-33.3-39.3 50.5 27.6 21.5 341.6 265.6a55.99 55.99 0 0068.7 0L888 270.8l27.6-21.5-39.3-50.5-42.7 33.2z"></path>
                              </svg>
                            </span>
                          </span>
                          <input
                            autoComplete="email"
                            placeholder="tu@email.com"
                            id="register_email"
                            aria-required="true"
                            className="ant-input ant-input-lg"
                            type="text"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-form-item ant-form-item-has-success">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-label">
                    <label htmlFor="register_phone" className="ant-form-item-required" title="Teléfono">
                      Teléfono
                    </label>
                  </div>
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <div className="flex">
                          <select
                            value={registerData.phoneCode}
                            onChange={(e) => setRegisterData({ ...registerData, phoneCode: e.target.value })}
                            className="border border-gray-300 rounded-l-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="+58">🇻🇪 +58</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+52">🇲🇽 +52</option>
                            <option value="+34">🇪🇸 +34</option>
                          </select>
                          <input
                            placeholder="Número de teléfono"
                            id="register_phone"
                            aria-required="true"
                            className="ant-input ant-input-lg flex-1 rounded-l-none"
                            type="tel"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-form-item ant-form-item-has-success">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-label">
                    <label htmlFor="register_password" className="ant-form-item-required" title="Contraseña">
                      Contraseña
                    </label>
                  </div>
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <span className="ant-input-affix-wrapper ant-input-affix-wrapper-lg ant-input-outlined ant-input-status-success ant-input-password">
                          <span className="ant-input-prefix">
                            <span role="img" aria-label="lock" className="anticon anticon-lock">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="lock" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z"></path>
                              </svg>
                            </span>
                          </span>
                          <input
                            autoComplete="new-password"
                            placeholder="Tu contraseña"
                            id="register_password"
                            aria-required="true"
                            type="password"
                            className="ant-input ant-input-lg"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          />
                          <span className="ant-input-suffix">
                            <span role="img" aria-label="eye" tabIndex="-1" className="anticon anticon-eye ant-input-password-icon">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="eye" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"></path>
                              </svg>
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-form-item mb-4">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <button 
                          type="submit" 
                          className="store-button store-button-primary store-button-lg store-button-block"
                          onClick={handleRegister}
                        >
                          Crear Cuenta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-divider ant-divider-horizontal ant-divider-with-text ant-divider-with-text-center" role="separator">
                <span className="ant-divider-inner-text">
                  <span className="ant-typography ant-typography-secondary text-sm">o</span>
                </span>
              </div>
              <div className="text-center">
                <span className="ant-typography ant-typography-secondary text-sm">
                  ¿Ya tienes cuenta? 
                  <button 
                    type="button"
                    className="ant-typography text-blue-600 cursor-pointer hover:underline ml-1"
                    onClick={() => setAccountMode('login')}
                  >
                    Iniciar sesión
                  </button>
                </span>
              </div>
            </>
          )}

          {accountMode === 'forgot' && (
            <>
              <div className="ant-form-item ant-form-item-has-success">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-label">
                    <label htmlFor="forgot_email" className="ant-form-item-required" title="Correo electrónico">
                      Correo electrónico
                    </label>
                  </div>
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <span className="ant-input-affix-wrapper ant-input-affix-wrapper-lg ant-input-outlined ant-input-status-success">
                          <span className="ant-input-prefix">
                            <span role="img" aria-label="mail" className="anticon anticon-mail">
                              <svg viewBox="64 64 896 896" focusable="false" data-icon="mail" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232l-42.8-33.3-39.3 50.5 27.6 21.5 341.6 265.6a55.99 55.99 0 0068.7 0L888 270.8l27.6-21.5-39.3-50.5-42.7 33.2z"></path>
                              </svg>
                            </span>
                          </span>
                          <input
                            autoComplete="email"
                            placeholder="tu@email.com"
                            id="forgot_email"
                            aria-required="true"
                            className="ant-input ant-input-lg"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ant-form-item mb-4">
                <div className="ant-row ant-form-item-row">
                  <div className="ant-col ant-form-item-control">
                    <div className="ant-form-item-control-input">
                      <div className="ant-form-item-control-input-content">
                        <button 
                          type="submit" 
                          className="store-button store-button-primary store-button-lg store-button-block"
                          onClick={handleForgotPassword}
                        >
                          Enviar Enlace
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <span className="ant-typography ant-typography-secondary text-sm">
                  ¿Recordaste tu contraseña? 
                  <button 
                    type="button"
                    className="ant-typography text-blue-600 cursor-pointer hover:underline ml-1"
                    onClick={() => setAccountMode('login')}
                  >
                    Iniciar sesión
                  </button>
                </span>
              </div>
            </>
          )}
        </form>
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
