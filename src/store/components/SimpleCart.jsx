import React from 'react';
import { Card, Button, Typography, Space, Divider, Badge } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SimpleCart = () => {
  const { items, products, getItemCount, calculateTotal, toggleSeat, clearCart } = useCartStore();
  const navigate = useNavigate();

  const itemCount = getItemCount();
  const total = calculateTotal();
  const seatsCount = items.length;
  const productsCount = products.length;

  const handleCheckout = () => {
    if (itemCount === 0) return;
    navigate('/store/cart');
  };

  const handleClearCart = () => {
    clearCart();
  };

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined />
            <span>Carrito de Compras</span>
            {itemCount > 0 && (
              <Badge count={itemCount} size="small" />
            )}
          </div>
          {itemCount > 0 && (
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />}
              onClick={handleClearCart}
              className="text-red-500 hover:text-red-700"
            >
              Limpiar
            </Button>
          )}
        </div>
      }
      className="h-fit"
    >
      {itemCount === 0 ? (
        <div className="text-center py-8">
          <ShoppingCartOutlined className="text-4xl text-gray-400 mb-2" />
          <Text type="secondary">Tu carrito está vacío</Text>
          <br />
          <Text type="secondary" className="text-sm">Selecciona asientos en el mapa</Text>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Asientos seleccionados */}
          {seatsCount > 0 && (
            <div>
              <Title level={5} className="mb-2">
                <span className="text-blue-600">Asientos ({seatsCount})</span>
              </Title>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                  <div 
                    key={item._id || item.sillaId || index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <Text strong>{item.nombre || item._id || 'Asiento'}</Text>
                      <br />
                      <Text type="secondary" className="text-sm">
                        {item.nombreZona || 'Zona'} - ${item.precio || 0}
                      </Text>
                    </div>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<DeleteOutlined />}
                      onClick={() => toggleSeat(item)}
                      className="text-red-500 hover:text-red-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos seleccionados */}
          {productsCount > 0 && (
            <div>
              <Title level={5} className="mb-2">
                <span className="text-green-600">Productos ({productsCount})</span>
              </Title>
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div 
                    key={product.id || index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <Text strong>{product.name}</Text>
                      <br />
                      <Text type="secondary" className="text-sm">
                        Cantidad: {product.quantity} - ${product.price || 0}
                      </Text>
                    </div>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<DeleteOutlined />}
                      onClick={() => toggleSeat(product)}
                      className="text-red-500 hover:text-red-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Divider />

          {/* Resumen y checkout */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Text strong>Total:</Text>
              <Text strong className="text-lg text-green-600">
                ${total.toFixed(2)}
              </Text>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              icon={<CreditCardOutlined />}
              onClick={handleCheckout}
              className="w-full"
              disabled={itemCount === 0}
            >
              Proceder al Pago
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SimpleCart;
