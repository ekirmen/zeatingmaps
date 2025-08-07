import React, { useState } from 'react';
import { Card, Button, Space, Typography, Tooltip, Badge } from 'antd';
import { 
  ShoppingCartOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  HistoryOutlined,
  PlusOutlined,
  UserOutlined,
  PackageOutlined
} from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import SavedCartsWidget from './SavedCartsWidget';

const { Title, Text } = Typography;

const QuickActionsWidget = () => {
  const [savedCartsVisible, setSavedCartsVisible] = useState(false);
  const { 
    getItemCount, 
    calculateTotal, 
    clearCart,
    items,
    products
  } = useCartStore();

  const itemCount = getItemCount();
  const total = calculateTotal();
  const seatsCount = items.length;
  const productsCount = products.length;

  const handleClearCart = () => {
    clearCart();
  };

  return (
    <>
      <Card 
        title={
          <div className="flex items-center space-x-2">
            <ShoppingCartOutlined className="text-blue-500" />
            <span>Acciones Rápidas</span>
          </div>
        }
        className="mb-4"
      >
        <div className="space-y-3">
          {/* Cart Summary */}
          {itemCount > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Text strong>Resumen del Carrito</Text>
                <Badge count={itemCount} size="small" />
              </div>
              
              <div className="space-y-1 text-sm">
                {seatsCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <UserOutlined className="text-blue-500" />
                    <Text>{seatsCount} asientos</Text>
                  </div>
                )}
                {productsCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <PackageOutlined className="text-green-500" />
                    <Text>{productsCount} productos</Text>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t">
                  <Text strong>Total:</Text>
                  <Text strong className="text-blue-600">
                    ${total.toFixed(2)}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <Tooltip title="Guardar carrito actual">
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                block
                onClick={() => setSavedCartsVisible(true)}
                disabled={itemCount === 0}
              >
                Guardar Carrito
              </Button>
            </Tooltip>

            <Tooltip title="Ver carritos guardados">
              <Button 
                icon={<HistoryOutlined />}
                block
                onClick={() => setSavedCartsVisible(true)}
              >
                Carritos Guardados
              </Button>
            </Tooltip>

            {itemCount > 0 && (
              <Tooltip title="Limpiar carrito actual">
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  block
                  onClick={handleClearCart}
                >
                  Limpiar Carrito
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Empty State */}
          {itemCount === 0 && (
            <div className="text-center py-4">
              <ShoppingCartOutlined className="text-3xl text-gray-300 mb-2" />
              <Text type="secondary" className="block">
                No hay items en el carrito
              </Text>
              <Text type="secondary" className="text-xs">
                Selecciona asientos o productos para comenzar
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Saved Carts Modal */}
      <SavedCartsWidget 
        visible={savedCartsVisible}
        onClose={() => setSavedCartsVisible(false)}
      />
    </>
  );
};

export default QuickActionsWidget;
