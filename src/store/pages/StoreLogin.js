import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Input, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { registerUser, loginUser } from '../services/authService';
import { getAuthMessage } from '../../utils/authErrorMessages';
import { SITE_URL } from '../../utils/siteUrl';

const StoreLogin = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
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
  const [loading, setLoading] = useState(false);

  // Obtener la ruta de donde vino el usuario
  const from = location.state?.from?.pathname || '/store';

  const handleRegister = async () => {
    try {
      setLoading(true);
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
      setAccountMode('login');
      setRegisterData({ email: '', password: '', phone: '', phoneCode: '+58' });
    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
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
        message.success(t('login.success'));
        setFormData({ email: '', password: '' });
        // Redirigir a la página de donde vino o al store
        navigate(from, { replace: true });
      } else {
        message.success(t('login.email_sent'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const feedbackMessage = getAuthMessage(error, t, 'errors.login');
      const messageType = error?.type && message[error.type] ? error.type : 'error';
      setError(feedbackMessage);
      message[messageType](feedbackMessage);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${SITE_URL}/store/reset-password`,
      });
      if (error) throw error;
      message.success(t('forgot.sent'));
      setForgotEmail('');
      setAccountMode('login');
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.message || t('errors.request', 'Error al procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {accountMode === 'login' 
              ? 'Iniciar Sesión' 
              : accountMode === 'register' 
              ? 'Crear Cuenta' 
              : 'Recuperar Contraseña'
            }
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {accountMode === 'login' 
              ? 'Accede a tu cuenta para continuar' 
              : accountMode === 'register' 
              ? 'Crea tu cuenta para comenzar' 
              : 'Ingresa tu email para recuperar tu contraseña'
            }
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {error && (
            <div className="mb-4 text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          {accountMode === 'login' && (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <Input
                  placeholder="tu@email.com"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  size="large"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <Input.Password
                  placeholder="Tu contraseña"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  size="large"
                  required
                />
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                htmlType="submit"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary,
                  height: '44px'
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <div className="text-center text-sm space-x-4">
                <span 
                  className="cursor-pointer text-blue-600 hover:underline" 
                  onClick={() => setAccountMode('forgot')}
                >
                  ¿Olvidaste tu contraseña?
                </span>
                <span 
                  className="cursor-pointer text-blue-600 hover:underline" 
                  onClick={() => setAccountMode('register')}
                >
                  Crear cuenta
                </span>
              </div>
            </form>
          )}

          {accountMode === 'register' && (
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <Input
                  placeholder="tu@email.com"
                  name="email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  size="large"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="flex">
                  <select
                    value={registerData.phoneCode}
                    onChange={(e) => setRegisterData({ ...registerData, phoneCode: e.target.value })}
                    className="border rounded-l px-3 py-2 border-r-0"
                  >
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+34">🇪🇸 +34</option>
                  </select>
                  <Input
                    placeholder="Número de teléfono"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="flex-1 rounded-l-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <Input.Password
                  placeholder="Mínimo 6 caracteres"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  size="large"
                  required
                />
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                htmlType="submit"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary,
                  height: '44px'
                }}
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              <div className="text-center text-sm">
                <span 
                  className="cursor-pointer text-blue-600 hover:underline" 
                  onClick={() => setAccountMode('login')}
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </span>
              </div>
            </form>
          )}

          {accountMode === 'forgot' && (
            <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <Input
                  placeholder="tu@email.com"
                  name="email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  size="large"
                  required
                />
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                htmlType="submit"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary,
                  height: '44px'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <div className="text-center text-sm">
                <span 
                  className="cursor-pointer text-blue-600 hover:underline" 
                  onClick={() => setAccountMode('login')}
                >
                  Volver al inicio de sesión
                </span>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/store')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Volver al store
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreLogin;
