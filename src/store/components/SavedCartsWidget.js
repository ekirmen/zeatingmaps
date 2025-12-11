import React, { useState, useEffect } from 'react';
import { Card, Button, List, Tag, Space, Typography, Modal, Input, message, Tooltip, Badge } from '../../utils/antdComponents';
import { 
  SaveOutlined, 
  DeleteOutlined, 
  ShoppingCartOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useCartStore } from '../cartStore';

const { Title, Text } = Typography;

const SavedCartsWidget = ({ visible, onClose }) => {
  const [cartName, setCartName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { 
    savedCarts, 
    savedCartsLoading, 
    loadSavedCarts, 
    saveCurrentCart, 
    loadSavedCart, 
    deleteSavedCart,
    getItemCount,
    calculateTotal
  } = useCartStore();

  useEffect(() => {
    if (visible) {
      loadSavedCarts();
    }
  }, [visible]);

  const handleSaveCart = async () => {
    if (!cartName.trim()) {

      return;
    }

    if (getItemCount() === 0) {
      message.error('No hay items en el carrito para guardar');
      return;
    }

    await saveCurrentCart(cartName);
    setCartName('');
    setShowSaveModal(false);
  };

  const handleLoadCart = async (cartId) => {
    try {
      await loadSavedCart(cartId);
      message.success('Carrito cargado correctamente');
      onClose();
    } catch (error) {
      message.error('Error al cargar el carrito');
    }
  };

  const handleDeleteCart = async (cartId) => {
    try {
      await deleteSavedCart(cartId);
      message.success('Carrito eliminado correctamente');
    } catch (error) {
      message.error('Error al eliminar el carrito');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <ShoppingCartOutlined className="text-blue-500" />
            <span>Carritos Guardados</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button 
            key="save" 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowSaveModal(true)}
          >
            Guardar Carrito Actual
          </Button>,
          <Button key="close" onClick={onClose}>
            Cerrar
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        {savedCartsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <Text className="mt-2">Cargando carritos...</Text>
          </div>
        ) : savedCarts.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCartOutlined className="text-4xl text-gray-400 mb-4" />
            <Title level={4} className="text-gray-500">No hay carritos guardados</Title>
            <Text type="secondary">
              Guarda tu carrito actual para acceder a ©l m¡s tarde
            </Text>
          </div>
        ) : (
          <List
            dataSource={savedCarts}
            renderItem={(cart) => (
              <List.Item
                actions={[
                  <Tooltip key="load" title="Cargar carrito">
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleLoadCart(cart.id)}
                    >
                      Cargar
                    </Button>
                  </Tooltip>,
                  <Tooltip key="delete" title="Eliminar carrito">
                    <Button 
                      type="text" 
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCart(cart.id)}
                    >
                      Eliminar
                    </Button>
                  </Tooltip>
                ]}
                className="border rounded-lg p-4 mb-2 hover:bg-gray-50 transition-colors"
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center space-x-2">
                      <Text strong>{cart.name || `Carrito ${cart.id}`}</Text>
                      <Badge 
                        count={getItemCount()} 
                        size="small" 
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    </div>
                  }
                  description={
                    <Space direction="vertical" size="small" className="w-full">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <ClockCircleOutlined />
                        <Text type="secondary">{formatDate(cart.created_at)}</Text>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {cart.seats?.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <UserOutlined className="text-blue-500" />
                            <Tag color="blue">{cart.seats.length} asientos</Tag>
                          </div>
                        )}
                        {cart.products?.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <ShoppingCartOutlined className="text-green-500" />
                            <Tag color="green">{cart.products.length} productos</Tag>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Text strong className="text-lg text-blue-600">
                          Total: ${cart.total?.toFixed(2) || '0.00'}
                        </Text>
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      <Modal
        title="Guardar Carrito Actual"
        open={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        onOk={handleSaveCart}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <div className="space-y-4">
          <div>
            <Text>Nombre del carrito:</Text>
            <Input
              placeholder="Ej: Carrito para evento X"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              onPressEnter={handleSaveCart}
              autoFocus
            />
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <Text type="secondary">
              Items en carrito actual: {getItemCount()}
            </Text>
            <br />
            <Text type="secondary">
              Total: ${calculateTotal().toFixed(2)}
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SavedCartsWidget;


