import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Card, Button, Space, Typography, Tooltip, Badge } from '../../utils/antdComponents';
import { 
  ShoppingCartOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  HistoryOutlined,
  UserOutlined,
  ShoppingOutlined  
} from '@ant-design/icons';
import { useCartStore } from '../cartStore';

// Lazy-load del modal para optimizar bundle
const SavedCartsWidget = lazy(() => import('./SavedCartsWidget'));

const { Text } = Typography;

const QuickActionsWidget = () => {
  const [savedCartsVisible, setSavedCartsVisible] = useState(false);
  const { getItemCount, calculateTotal, clearCart, items, products } = useCartStore();

  // Memoizar cálculos del carrito
  const { itemCount, total, seatsCount, productsCount } = useMemo(() => ({
    itemCount: getItemCount(),
    total: calculateTotal(),
    seatsCount: items.length,
    productsCount: products.length
  }), [getItemCount, calculateTotal, items.length, products.length]);

  const handleClearCart = useCallback(() => clearCart(), [clearCart]);
  const openSavedCarts = useCallback(() => setSavedCartsVisible(true), []);
  const closeSavedCarts = useCallback(() => setSavedCartsVisible(false), []);

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
                    <ShoppingOutlined className="text-green-500" />
                    <Text>{productsCount} productos</Text>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t">
                  <Text strong>Total:</Text>
                  <Text strong className="text-blue-600">${total.toFixed(2)}</Text>
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
                onClick={openSavedCarts}
                disabled={itemCount === 0}
              >
                Guardar Carrito
              </Button>
            </Tooltip>

            <Tooltip title="Ver carritos guardados">
              <Button 
                icon={<HistoryOutlined />}
                block
                onClick={openSavedCarts}
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
      <Suspense fallback={null}>
        <SavedCartsWidget visible={savedCartsVisible} onClose={closeSavedCarts} />
      </Suspense>
    </>
  );
};

export default QuickActionsWidget;


