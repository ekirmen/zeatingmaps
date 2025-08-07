import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

const AuthCheck = ({ visible, onClose, onSuccess, cartData }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Inicio de sesión exitoso');
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            nombre: values.nombre,
            telefono: values.telefono
          }
        }
      });

      if (error) throw error;

      message.success('Registro exitoso. Revisa tu email para confirmar tu cuenta.');
      setIsLogin(true);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (values) => {
    if (isLogin) {
      handleLogin(values);
    } else {
      handleRegister(values);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isLogin 
              ? 'Inicia sesión para completar tu compra' 
              : 'Crea una cuenta para continuar'
            }
          </p>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <div className="py-4">
        {/* Resumen del carrito */}
        {cartData && (
          <Alert
            message="Resumen de tu compra"
            description={
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-bold">{cartData.itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold">${cartData.total.toFixed(2)}</span>
                </div>
              </div>
            }
            type="info"
            className="mb-4"
            showIcon
          />
        )}

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          {!isLogin && (
            <>
              <Form.Item
                name="nombre"
                rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nombre completo"
                />
              </Form.Item>

              <Form.Item
                name="telefono"
                rules={[{ required: true, message: 'Por favor ingresa tu teléfono' }]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Teléfono"
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu email' },
              { type: 'email', message: 'Por favor ingresa un email válido' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Contraseña"
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Por favor confirma tu contraseña' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Las contraseñas no coinciden'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirmar contraseña"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Button type="link" onClick={switchMode}>
            {isLogin 
              ? '¿No tienes cuenta? Regístrate aquí' 
              : '¿Ya tienes cuenta? Inicia sesión aquí'
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthCheck;
