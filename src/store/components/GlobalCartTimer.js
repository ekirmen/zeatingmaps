import React, { useState, useEffect } from 'react';
import { Badge, Button, Tooltip, Modal, Card } from '../../utils/antdComponents';
import { ClockCircleOutlined, ShoppingCartOutlined, RightOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { notification, message } from '../../utils/antdComponents';
import { useSeatLockStore } from '../../components/seatLockStore';

const GlobalCartTimer = () => {
  const [showTimer, setShowTimer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const { timeLeft, getItemCount, calculateTotal, items, products, clearCart, cartExpiration } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const unlockSeat = useSeatLockStore(state => state.unlockSeat);

  const itemCount = getItemCount();
  const total = calculateTotal();

  // P¡ginas donde NO mostrar el carrito flotante (ya tienen su propio carrito o est¡n en proceso de pago)
  const isSeatSelectionPage = location.pathname.includes('/map') || 
                               location.pathname.includes('/seat-selection') || 
                               location.pathname === '/store/cart' ||
                               location.pathname === '/store/payment';

  // Mostrar el carrito flotante si hay items y no estamos en p¡gina de selecci³n o pago
  useEffect(() => {
    setShowTimer(itemCount > 0 && !isSeatSelectionPage);
  }, [itemCount, isSeatSelectionPage]);

  // Verificar expiraci³n del carrito
  useEffect(() => {
    if (!cartExpiration) return;

    const checkExpiration = async () => {
      if (Date.now() > cartExpiration) {
        notification.warning({
          message: 'Tu selecci³n ha expirado',
          description: 'Hemos liberado los asientos de tu carrito por inactividad.',
          placement: 'topRight',
        });

        // Liberar asientos
        for (const item of items) {
          await unlockSeat(
            item.sillaId || item.id || item._id,
            item.functionId || item.funcionId
          );
        }

        clearCart();
      }
    };

    const timeoutId = setTimeout(checkExpiration, cartExpiration - Date.now() + 1000);
    return () => clearTimeout(timeoutId);
  }, [cartExpiration, items, unlockSeat, clearCart]);

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
    if (timeLeft <= 60) return '#ff4d4f'; // Rojo para ºltimos 60 segundos
    if (timeLeft <= 300) return '#faad14'; // Amarillo para ºltimos 5 minutos
    return '#52c41a'; // Verde para el resto
  };

  // Manejar checkout desde el carrito flotante
  const handleCheckout = () => {
    if (itemCount === 0) {
      message.warning('El carrito est¡ vac­o');
      return;
    }
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    navigate('/store/payment');
  };

  return (
    <>
      {/* Carrito flotante - Solo mostrar si hay items y no estamos en p¡gina de selecci³n */}
      {showTimer && (
        <div 
          className="fixed bottom-6 right-6 z-50"
          style={{
            maxWidth: '320px',
            width: '100%'
          }}
        >
          <Card
            className="store-cart-floating-card"
            style={{
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              borderRadius: '12px',
              border: `2px solid ${getTimerColor()}`,
              background: 'white'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            {/* Header con timer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCartOutlined style={{ fontSize: '20px', color: getTimerColor() }} />
                <span style={{ fontWeight: 600, fontSize: '16px' }}>
                  Carrito ({itemCount})
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: timeLeft <= 60 ? '#fff1f0' : '#f0f7ff',
                border: `1px solid ${getTimerColor()}`,
                fontSize: '12px',
                fontWeight: 600,
                color: getTimerColor()
              }}>
                <ClockCircleOutlined />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Resumen */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#666' }}>Total:</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: '#1890ff' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
              {items.length > 0 && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {items.length} asiento{items.length > 1 ? 's' : ''} seleccionado{items.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Bot³n de comprar */}
            <Button
              type="primary"
              block
              size="large"
              icon={<CreditCardOutlined />}
              onClick={handleCheckout}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                height: '40px',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(24,144,255,0.3)'
              }}
            >
              Proceder al Pago
            </Button>

            {/* Link para ver carrito completo */}
            <Button
              type="link"
              block
              size="small"
              onClick={() => navigate('/store/cart')}
              style={{
                marginTop: '8px',
                padding: '4px 0',
                fontSize: '12px',
                height: 'auto'
              }}
            >
              Ver carrito completo <RightOutlined />
            </Button>
          </Card>
        </div>
      )}

      {/* Modal de login/registro */}
      <Modal
        title="Inicia sesi³n para continuar"
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
            Iniciar Sesi³n
          </Button>
        ]}
        width={400}
      >
        <div className="text-center py-4">
          <ShoppingCartOutlined className="text-4xl text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tu carrito est¡ esperando</h3>
          <p className="text-gray-600 mb-4">
            Tienes {formatTime(timeLeft)} para completar tu compra. 
            Inicia sesi³n o reg­strate para continuar.
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
            ° Tu reserva expira en {formatTime(timeLeft)}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GlobalCartTimer;


