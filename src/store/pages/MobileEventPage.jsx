import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Button, Space, Badge, Drawer } from 'antd';
import { 
  ShoppingCartOutlined, 
  InfoCircleOutlined, 
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import CompactSeatingMap from '../components/CompactSeatingMap';
import { supabase } from '../../supabaseClient';
import VisualNotifications from '../../utils/VisualNotifications';

const { Title, Text, Paragraph } = Typography;

const MobileEventPage = () => {
  const { funcionId } = useParams();
  const [funcion, setFuncion] = useState(null);
  const [evento, setEvento] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Cargar datos de la función
  useEffect(() => {
    const loadFuncionData = async () => {
      try {
        setLoading(true);

        // Cargar función
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select(`
            *,
            eventos (*),
            mapas (*)
          `)
          .eq('id', funcionId)
          .single();

        if (funcionError) throw funcionError;

        setFuncion(funcionData);
        setEvento(funcionData.eventos);
        setMapa(funcionData.mapas);

        VisualNotifications.show('seatSelected', 'Evento cargado correctamente');

      } catch (error) {
        console.error('Error loading funcion data:', error);
        VisualNotifications.show('error', 'Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    if (funcionId) {
      loadFuncionData();
    }
  }, [funcionId]);

  // Función para agregar al carrito
  const handleAddToCart = (seat) => {
    const existingItem = cartItems.find(item => item._id === seat._id);
    
    if (existingItem) {
      VisualNotifications.show('seatBlocked', 'Este asiento ya está en el carrito');
      return;
    }

    setCartItems(prev => [...prev, seat]);
    VisualNotifications.show('cartUpdated', 'Asiento agregado al carrito');
  };

  // Función para eliminar del carrito
  const handleRemoveFromCart = (seatId) => {
    setCartItems(prev => prev.filter(item => item._id !== seatId));
    VisualNotifications.show('cartUpdated', 'Asiento eliminado del carrito');
  };

  // Función para proceder al pago
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      VisualNotifications.show('validationWarning', 'Agrega asientos al carrito primero');
      return;
    }

    // Aquí irías a la página de checkout
    VisualNotifications.show('purchaseComplete', 'Redirigiendo al pago...');
  };

  if (loading) {
    return (
      <div className="mobile-event-page loading">
        <div className="text-center py-8">
          <Text>Cargando evento...</Text>
        </div>
      </div>
    );
  }

  if (!funcion || !evento || !mapa) {
    return (
      <div className="mobile-event-page error">
        <div className="text-center py-8">
          <Text type="danger">Error al cargar el evento</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-event-page">
      {/* Header del evento */}
      <Card className="event-header" size="small">
        <div className="event-info">
          <Title level={4} className="mb-2">
            {evento.nombre}
          </Title>
          
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center">
              <CalendarOutlined className="mr-2" />
              <Text>{new Date(funcion.fecha).toLocaleDateString()}</Text>
            </div>
            
            <div className="flex items-center">
              <ClockCircleOutlined className="mr-2" />
              <Text>{funcion.hora_inicio}</Text>
            </div>
            
            <div className="flex items-center">
              <EnvironmentOutlined className="mr-2" />
              <Text>{evento.ubicacion}</Text>
            </div>
          </Space>
        </div>
      </Card>

      {/* Mapa de asientos compacto */}
      <Card className="map-card" size="small">
        <CompactSeatingMap
          funcionId={funcionId}
          mapa={mapa}
          selectedSeats={cartItems}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
          // Props adicionales para funcionalidad completa
          lockSeat={() => {}}
          unlockSeat={() => {}}
          lockTable={() => {}}
          unlockTable={() => {}}
          isSeatLocked={() => false}
          isSeatLockedByMe={() => false}
          isTableLocked={() => false}
          isTableLockedByMe={() => false}
          isAnySeatInTableLocked={() => false}
          areAllSeatsInTableLockedByMe={() => false}
          onSeatToggle={() => {}}
          onTableToggle={() => {}}
          onSeatInfo={() => {}}
          foundSeats={[]}
        />
      </Card>

      {/* Botón flotante del carrito */}
      <div className="floating-cart-button">
        <Badge count={cartItems.length} size="small">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => setShowCartDrawer(true)}
            className="cart-fab"
          />
        </Badge>
      </div>

      {/* Drawer del carrito */}
      <Drawer
        title="Carrito de Compras"
        placement="bottom"
        open={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        height="70%"
        className="mobile-cart-drawer"
      >
        <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="empty-cart text-center py-8">
              <ShoppingCartOutlined className="text-4xl text-gray-400 mb-4" />
              <Text type="secondary">Tu carrito está vacío</Text>
              <br />
              <Text type="secondary">Selecciona asientos en el mapa</Text>
            </div>
          ) : (
            <div className="cart-items">
              <div className="space-y-3 mb-4">
                {cartItems.map((item, index) => (
                  <Card key={index} size="small" className="cart-item">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <Text strong>{item.nombre || `Asiento ${item._id}`}</Text>
                        <br />
                        <Text type="secondary">${item.precio || 0}</Text>
                      </div>
                      <Button
                        size="small"
                        danger
                        onClick={() => handleRemoveFromCart(item._id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="flex justify-between items-center mb-4">
                  <Text strong className="text-lg">
                    Total: ${cartItems.reduce((sum, item) => sum + (item.precio || 0), 0)}
                  </Text>
                </div>
                
                <Button
                  type="primary"
                  size="large"
                  className="w-full"
                  onClick={handleCheckout}
                >
                  Proceder al Pago
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Estilos CSS */}
      <style jsx>{`
        .mobile-event-page {
          padding: 8px;
          background: #f5f5f5;
          min-height: 100vh;
        }
        
        .event-header {
          margin-bottom: 8px;
        }
        
        .map-card {
          margin-bottom: 80px; /* Espacio para el botón flotante */
        }
        
        .floating-cart-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .cart-fab {
          width: 56px;
          height: 56px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .mobile-cart-drawer .ant-drawer-body {
          padding: 16px;
        }
        
        .cart-item {
          border: 1px solid #d9d9d9;
        }
        
        .cart-summary {
          border-top: 1px solid #d9d9d9;
          padding-top: 16px;
        }
        
        @media (max-width: 768px) {
          .mobile-event-page {
            padding: 4px;
          }
          
          .event-header,
          .map-card {
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileEventPage;
