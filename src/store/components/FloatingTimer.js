import React, { useState, useEffect } from 'react';
import { Badge, Button, Tooltip, Modal, message, Form, Input, Tabs } from '../../utils/antdComponents';
import { ClockCircleOutlined, ShoppingCartOutlined, CloseOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { getAuthMessage } from '../../utils/authErrorMessages';

const FloatingTimer = () => {
  const [showTimer, setShowTimer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { timeLeft, getItemCount, calculateTotal, items, products } = useCartStore();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const itemCount = getItemCount();
  const total = calculateTotal();

  // Mostrar el temporizador si hay items en el carrito
  useEffect(() => {
    setShowTimer(itemCount > 0);
  }, [itemCount]);

  // Formatear el tiempo restante
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Manejar el click en el temporizador
  const handleTimerClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      navigate('/store/cart');
    }
  };

  // Manejar el login


  // Manejar el registro
  const handleRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  // Manejar login desde formulario
  const handleLoginSubmit = async (values) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      setShowLoginModal(false);
      loginForm.resetFields();
      message.success('¡Bienvenido!');
    } catch (error) {
      const feedbackMessage = getAuthMessage(error);
      const messageType = error?.type && typeof message[error.type] === 'function' ? error.type : 'error';
      message[messageType](feedbackMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro desde formulario
  const handleRegisterSubmit = async (values) => {
    setLoading(true);
    try {
      await signUp(values.email, values.password, {
        nombre: values.nombre,
        telefono: values.telefono
      });
      setShowRegisterModal(false);
      registerForm.resetFields();
      message.success('¡Cuenta creada exitosamente!');
    } catch (error) {
      message.error('Error al crear cuenta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Si no hay items, no mostrar nada
  if (!showTimer || itemCount === 0) {
    return null;
  }

  // Determinar el color del temporizador basado en el tiempo restante
  const getTimerColor = () => {
    if (timeLeft <= 300) return '#ff4d4f'; // Rojo para ºltimos 5 minutos
    if (timeLeft <= 600) return '#faad14'; // Amarillo para ºltimos 10 minutos
    return '#52c41a'; // Verde para el resto
  };

  return (
    <>
      {/* Temporizador flotante */}
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50">
        <Tooltip
          title={
            <div className="text-center">
              <div className="font-bold mb-2">Tu carrito expira en {formatTime(timeLeft)}</div>
              <div className="text-sm">
                {items.length > 0 && <div>Asientos: {items.length}</div>}
                {products.length > 0 && <div>Productos: {products.length}</div>}
                <div className="font-bold mt-1">Total: ${total.toFixed(2)}</div>
              </div>
              <div className="text-xs mt-2">
                {user ? 'Haz clic para ver el carrito' : 'Inicia sesi³n para continuar'}
              </div>
            </div>
          }
          placement="left"
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ClockCircleOutlined />}
            onClick={handleTimerClick}
            style={{
              backgroundColor: getTimerColor(),
              borderColor: getTimerColor(),
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              width: '60px',
              height: '60px',
              fontSize: '20px'
            }}
            className="flex items-center justify-center"
          >
            <Badge count={itemCount} size="small" offset={[-5, 5]}>
              <div></div>
            </Badge>
          </Button>
        </Tooltip>

        {/* Texto del tiempo restante */}
        <div
          className="absolute -top-8 right-0 bg-white px-2 py-1 rounded shadow-md text-sm font-bold whitespace-nowrap"
          style={{ color: getTimerColor() }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Modal de login */}
      <Modal
        title="Inicia sesi³n para continuar"
        open={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        footer={null}
        width={400}
      >
        <div className="text-center py-4">
          <ShoppingCartOutlined className="text-4xl text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tu carrito est¡ esperando</h3>
          <p className="text-gray-600 mb-4">
            Tienes {formatTime(timeLeft)} para completar tu compra.
            Inicia sesi³n para continuar.
          </p>

          <div className="bg-blue-50 p-3 rounded mb-4">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Items en carrito:</span>
                <span className="font-bold">{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Form
            form={loginForm}
            onFinish={handleLoginSubmit}
            layout="vertical"
            className="text-left"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Por favor ingresa tu email' },
                { type: 'email', message: 'Email inv¡lido' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Por favor ingresa tu contrase±a' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Contrase±a"
                size="large"
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowLoginModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegister}
                className="flex-1"
              >
                Crear Cuenta
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="flex-1"
              >
                Iniciar Sesi³n
              </Button>
            </div>
          </Form>

          <div className="text-xs text-gray-500 mt-4">
            ° Tu reserva expira en {formatTime(timeLeft)}
          </div>
        </div>
      </Modal>

      {/* Modal de registro */}
      <Modal
        title="Crear cuenta nueva"
        open={showRegisterModal}
        onCancel={() => setShowRegisterModal(false)}
        footer={null}
        width={400}
      >
        <div className="text-center py-4">
          <UserOutlined className="text-4xl text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Crea tu cuenta</h3>
          <p className="text-gray-600 mb-4">
            Reg­strate para completar tu compra y gestionar tus entradas.
          </p>

          <Form
            form={registerForm}
            onFinish={handleRegisterSubmit}
            layout="vertical"
            className="text-left"
          >
            <Form.Item
              name="nombre"
              rules={[
                { required: true, message: 'Por favor ingresa tu nombre' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nombre completo"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Por favor ingresa tu email' },
                { type: 'email', message: 'Email inv¡lido' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="telefono"
              rules={[
                { required: true, message: 'Por favor ingresa tu tel©fono' }
              ]}
            >
              <Input
                placeholder="Tel©fono"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Por favor ingresa una contrase±a' },
                { min: 6, message: 'La contrase±a debe tener al menos 6 caracteres' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Contrase±a"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Por favor confirma tu contrase±a' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Las contrase±as no coinciden'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirmar contrase±a"
                size="large"
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
                className="flex-1"
              >
                Ya tengo cuenta
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="flex-1"
              >
                Crear Cuenta
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default FloatingTimer;


