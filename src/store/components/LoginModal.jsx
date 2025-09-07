import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Divider, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const { Text, Link } = Typography;

const LoginModal = ({ 
  visible, 
  onClose, 
  onLoginSuccess,
  title = "Iniciar Sesión",
  showRegisterLink = true 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const { setUser } = useAuth();

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      
      if (loginMethod === 'password') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        if (data?.session) {
          setUser(data.user);
          message.success('¡Sesión iniciada correctamente!');
          onLoginSuccess?.(data.user);
          onClose();
          form.resetFields();
        }
      } else {
        // OTP login
        const { error } = await supabase.auth.signInWithOtp({ 
          email: values.email, 
          options: { 
            emailRedirectTo: `${window.location.origin}/store` 
          } 
        });

        if (error) throw error;
        
        message.success('Se ha enviado un enlace de acceso a tu correo electrónico');
        setLoginMethod('password'); // Switch back to password form
        form.resetFields();
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setLoginMethod('password');
    onClose();
  };

  const switchToRegister = () => {
    onClose();
    // Navigate to register page or show register modal
    window.location.href = '/store/register';
  };

  return (
    <Modal
      title={
        <div className="store-text-center">
          <UserOutlined className="store-text-2xl store-text-primary mb-2" />
          <div className="store-text-lg store-font-semibold">{title}</div>
          <div className="store-text-sm store-text-gray-600">
            Accede a tu cuenta para continuar
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      className="store-modal"
    >
      <Form
        form={form}
        name="login"
        onFinish={handleLogin}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          label="Correo electrónico"
          rules={[
            { required: true, message: 'Por favor ingresa tu correo electrónico' },
            { type: 'email', message: 'Por favor ingresa un correo válido' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </Form.Item>

        {loginMethod === 'password' && (
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Tu contraseña"
              autoComplete="current-password"
            />
          </Form.Item>
        )}

        <Form.Item className="mb-4">
          <button
            type="submit"
            disabled={loading}
            className="store-button store-button-primary store-button-lg store-button-block"
          >
            {loading ? (
              <>
                <div className="store-loading"></div>
                Procesando...
              </>
            ) : (
              loginMethod === 'password' ? 'Iniciar Sesión' : 'Enviar Enlace'
            )}
          </button>
        </Form.Item>

        {loginMethod === 'password' && (
          <div className="text-center mb-4">
            <Button
              type="link"
              onClick={() => setLoginMethod('otp')}
              className="text-blue-600"
            >
              ¿No tienes contraseña? Enviar enlace de acceso
            </Button>
          </div>
        )}

        {loginMethod === 'otp' && (
          <div className="text-center mb-4">
            <Button
              type="link"
              onClick={() => setLoginMethod('password')}
              className="text-blue-600"
            >
              Tengo contraseña, iniciar sesión normal
            </Button>
          </div>
        )}

        {showRegisterLink && (
          <>
            <Divider>
              <Text type="secondary" className="text-sm">o</Text>
            </Divider>
            
            <div className="text-center">
              <Text type="secondary" className="text-sm">
                ¿No tienes cuenta?{' '}
                <Link onClick={switchToRegister} className="text-blue-600">
                  Crear cuenta nueva
                </Link>
              </Text>
            </div>
          </>
        )}

        <div className="text-center mt-4">
          <Link 
            href="/store/forgot-password" 
            className="text-sm text-gray-500"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </Form>
    </Modal>
  );
};

export default LoginModal;
