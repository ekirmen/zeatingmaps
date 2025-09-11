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
    
    // Debug: Log initial state
    if (DEBUG) console.log('Header component mounted, initial modal state:', isAccountModalVisible);
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
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${SITE_URL}/store/reset-password`,
      });
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

  const openAccountModal = () => {
    try {
      setAccountMode('login');
      setFormData({ email: '', password: '' });
      setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
      setForgotEmail('');
      setError('');
      setIsAccountModalVisible(true);
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  };

  const { theme } = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  console.log('Modal state in render:', isAccountModalVisible, 'Account mode:', accountMode);
  console.log('Component re-rendering, modal should be:', isAccountModalVisible ? 'visible' : 'hidden');
  console.log('Current form data:', formData);
  console.log('Current register data:', registerData);
  console.log('Modal visibility state:', isAccountModalVisible);
  console.log('Modal mode state:', accountMode);
  console.log('Modal will render with these props:', { isAccountModalVisible, accountMode, formData, registerData });
  const DEBUG = typeof window !== 'undefined' && window.__DEBUG === true;
  if (DEBUG) console.log('Modal will render with className: account-modal and wrapClassName: account-modal-wrapper');
  
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

          {/* Desktop Auth */}
          <div className="hidden lg:flex gap-2">
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
          <div className="flex lg:hidden items-center gap-2">
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
      {console.log('Rendering modal with state:', isAccountModalVisible)}
      {isAccountModalVisible && console.log('Modal should be visible now')}
      {isAccountModalVisible && console.log('Modal DOM element should be created')}
      {isAccountModalVisible && console.log('Modal props:', { accountMode, formData: Object.keys(formData) })}
      {isAccountModalVisible && console.log('Modal will render with title:', accountMode === 'login' ? t('header.login') : accountMode === 'register' ? t('header.signup') : t('header.forgot'))}
      {isAccountModalVisible && console.log('Modal will render with footer button text:', accountMode === 'login' ? t('header.login') : accountMode === 'register' ? t('header.register') : t('button.continue'))}
      {isAccountModalVisible && console.log('Modal will render with wrapClassName: account-modal-wrapper')}
      <Modal
        title={
          accountMode === 'login'
            ? t('header.login')
            : accountMode === 'register'
            ? t('header.signup')
            : t('header.forgot')
        }
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
          console.log('Modal closed, cleaning up state');
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
        className="account-modal"
        titleRender={(title) => (
          <div style={{ color: theme.headerText, fontWeight: 'bold' }}>
            {title}
          </div>
        )}
        onCancel={() => {
          setIsAccountModalVisible(false);
          setAccountMode('login');
          setFormData({ email: '', password: '' });
          setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
          setForgotEmail('');
          setError('');
        }}
        footer={[
          <Button
            key="submit"
            type="primary"
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
            <div className="flex mb-4">
              <select
                value={registerData.phoneCode}
                onChange={(e) => setRegisterData({ ...registerData, phoneCode: e.target.value })}
                className="border rounded-l px-2"
              >
                <option value="+58">🇻🇪 +58</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+34">🇪🇸 +34</option>
              </select>
              <Input
                placeholder={t('profile.phone')}
                value={registerData.phone}
                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                className="flex-1 rounded-l-none"
              />
            </div>
            <Input.Password
              placeholder={t('password.new')}
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
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
        zIndex={1000}
        width={400}
        centered
        maskClosable={true}
        destroyOnClose={true}
        getContainer={() => document.body}
        forceRender={true}
        afterClose={() => {
          console.log('Password modal closed, cleaning up state');
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
