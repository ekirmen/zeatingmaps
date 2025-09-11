import React, { useState, useEffect } from 'react';
import { Badge, Button, Tooltip, Modal, message } from 'antd';
import { ClockCircleOutlined, ShoppingCartOutlined, CloseOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FloatingTimer = () => {
  const [showTimer, setShowTimer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { timeLeft, getItemCount, calculateTotal, items, products } = useCartStore();
  const { user } = useAuth();
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
    const remainingSeconds = seconds % 60;
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
  const handleLogin = () => {
    setShowLoginModal(false);
    navigate('/store/login');
  };

  // Manejar el registro
  const handleRegister = () => {
    setShowLoginModal(false);
    navigate('/store/register');
  };

  // Si no hay items, no mostrar nada
  if (!showTimer || itemCount === 0) {
    return null;
  }

  // Determinar el color del temporizador basado en el tiempo restante
  const getTimerColor = () => {
    if (timeLeft <= 300) return '#ff4d4f'; // Rojo para últimos 5 minutos
    if (timeLeft <= 600) return '#faad14'; // Amarillo para últimos 10 minutos
    return '#52c41a'; // Verde para el resto
  };

  return (
    <>
      {/* Temporizador flotante */}
      <div className="fixed bottom-4 right-4 z-50">
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
                {user ? 'Haz clic para ver el carrito' : 'Inicia sesión para continuar'}
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

      {/* Modal de login/registro */}
      <Modal
        title="Inicia sesión para continuar"
        open={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowLoginModal(false)}>
            Cancelar
          </Button>,
          <Button key="register" onClick={handleRegister}>
            Registrarse
          </Button>,
          <Button key="login" type="primary" onClick={handleLogin}>
            Iniciar Sesión
          </Button>
        ]}
        width={400}
      >
        <div className="text-center py-4">
          <ShoppingCartOutlined className="text-4xl text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tu carrito está esperando</h3>
          <p className="text-gray-600 mb-4">
            Tienes {formatTime(timeLeft)} para completar tu compra. 
            Inicia sesión o regístrate para continuar.
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

          <div className="text-xs text-gray-500">
            ⏰ Tu reserva expira en {formatTime(timeLeft)}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FloatingTimer;
