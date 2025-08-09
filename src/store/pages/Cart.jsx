import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, InputNumber, Modal, Input, List, Tag, Space, Typography, Divider, Badge, Alert } from 'antd';
import { 
  ShoppingCartOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  MinusOutlined,
  ClockCircleOutlined,
  UserOutlined,

  LockOutlined
} from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { useAuth } from '../../contexts/AuthContext';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent, shouldTrackOnPage, FACEBOOK_EVENTS } from '../services/facebookPixelService';
import AuthCheck from '../components/AuthCheck';

const { Title, Text } = Typography;

// Enhanced Timer component
const Timer = ({ expiresAt }) => {
    const [remainingTime, setRemainingTime] = useState(expiresAt ? expiresAt - Date.now() : 0);

    useEffect(() => {
        if (!expiresAt) {
            setRemainingTime(0);
            return;
        }

        const interval = setInterval(() => {
            const timeLeft = expiresAt - Date.now();
            setRemainingTime(timeLeft > 0 ? timeLeft : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt || remainingTime <= 0) return null;

    const minutes = Math.floor((remainingTime / 1000) / 60);
    const seconds = Math.floor((remainingTime / 1000) % 60);

    return (
        <div className="flex items-center space-x-2 text-red-500 font-mono">
            <ClockCircleOutlined />
            <span>Expira en: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
    );
};

// Saved Carts Modal
const SavedCartsModal = ({ visible, onClose, savedCarts, onLoadCart, onDeleteCart, loading }) => {
    const [cartName, setCartName] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const { saveCurrentCart } = useCartStore();

    const handleSaveCart = async () => {
        if (!cartName.trim()) {
            return;
        }
        await saveCurrentCart(cartName);
        setCartName('');
        setShowSaveModal(false);
    };

    return (
        <>
            <Modal
                title="Carritos Guardados"
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="save" type="primary" onClick={() => setShowSaveModal(true)}>
                        Guardar Carrito Actual
                    </Button>,
                    <Button key="close" onClick={onClose}>
                        Cerrar
                    </Button>
                ]}
                width={600}
            >
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <Text className="mt-2">Cargando carritos...</Text>
                    </div>
                ) : savedCarts.length === 0 ? (
                    <div className="text-center py-8">
                        <Text type="secondary">No hay carritos guardados</Text>
                    </div>
                ) : (
                    <List
                        dataSource={savedCarts}
                        renderItem={(cart) => (
                            <List.Item
                                actions={[
                                    <Button 
                                        key="load" 
                                        type="link" 
                                        onClick={() => onLoadCart(cart.id)}
                                    >
                                        Cargar
                                    </Button>,
                                    <Button 
                                        key="delete" 
                                        type="link" 
                                        danger
                                        onClick={() => onDeleteCart(cart.id)}
                                    >
                                        Eliminar
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={cart.name || `Carrito ${cart.id}`}
                                    description={
                                        <Space direction="vertical" size="small">
                                            <Text type="secondary">
                                                {new Date(cart.created_at).toLocaleString('es-ES')}
                                            </Text>
                                            <Space>
                                                {cart.seats?.length > 0 && (
                                                    <Tag color="blue">{cart.seats.length} asientos</Tag>
                                                )}
                                                {cart.products?.length > 0 && (
                                                    <Tag color="green">{cart.products.length} productos</Tag>
                                                )}
                                                <Text strong>Total: ${cart.total?.toFixed(2) || '0.00'}</Text>
                                            </Space>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>

            <Modal
                title="Guardar Carrito"
                open={showSaveModal}
                onCancel={() => setShowSaveModal(false)}
                onOk={handleSaveCart}
                okText="Guardar"
                cancelText="Cancelar"
            >
                <Input
                    placeholder="Nombre del carrito"
                    value={cartName}
                    onChange={(e) => setCartName(e.target.value)}
                    onPressEnter={handleSaveCart}
                />
            </Modal>
        </>
    );
};

const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { 
        items, 
        products, 
        cartExpiration, 
        toggleSeat, 
        clearCart,
        updateProductQuantity,
        removeProduct,
        savedCarts,
        savedCartsLoading,
        loadSavedCarts,
        loadSavedCart,
        deleteSavedCart,
        calculateTotal,
        getItemCount,
        getProductsTotal,
        getSeatsTotal
    } = useCartStore();
    
    const [facebookPixel, setFacebookPixel] = useState(null);
    const [savedCartsVisible, setSavedCartsVisible] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const formatPrice = (price) =>
        typeof price === 'number' ? price.toFixed(2) : '0.00';

    const total = calculateTotal();
    const itemCount = getItemCount();

    useEffect(() => {
        loadFacebookPixel();
        loadSavedCarts();
    }, [items, products, loadFacebookPixel, loadSavedCarts]);

    const loadFacebookPixel = useCallback(async () => {
        try {
            if (items.length > 0) {
                const firstEventId = items[0]?.eventId;
                if (firstEventId) {
                    const pixel = await getFacebookPixelByEvent(firstEventId);
                    setFacebookPixel(pixel);
                }
            }
        } catch (error) {
            console.error('Error loading Facebook pixel:', error);
        }
    }, [items]);

    const handleProceedToPayment = () => {
        if (itemCount === 0) {
            return;
        }
        
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        
        navigate('/store/payment', {
            state: {
                carrito: items,
                productos: products,
                funcionId: items[0]?.functionId || items[0]?.funcionId || null,
            },
        });
    };

    const handleAuthSuccess = () => {
        // El usuario se autenticó exitosamente, proceder al pago
        handleProceedToPayment();
    };

    return (
        <div className="bg-white shadow-md rounded-md p-4">
            {/* Facebook Pixel */}
            {facebookPixel && shouldTrackOnPage(facebookPixel, 'cart_page') && (
                <FacebookPixel
                    pixelId={facebookPixel.pixel_id}
                    pixelScript={facebookPixel.pixel_script}
                    eventName={FACEBOOK_EVENTS.ADD_TO_CART}
                    eventData={{
                        content_name: items.map(item => item.nombreEvento).join(', '),
                        content_category: 'Eventos',
                        content_ids: items.map(item => item.eventId),
                        value: total,
                        currency: 'USD',
                        num_items: itemCount
                    }}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div className="flex items-center space-x-2">
                    <ShoppingCartOutlined className="text-xl text-blue-500" />
                    <Title level={4} className="mb-0">Carrito de Compras</Title>
                    {itemCount > 0 && (
                        <Badge count={itemCount} size="small" />
                    )}
                </div>
                <Timer expiresAt={cartExpiration} />
            </div>

            {/* Quick Actions */}
            {itemCount > 0 && (
                <div className="mb-4 flex space-x-2">
                    <Button 
                        icon={<SaveOutlined />} 
                        size="small"
                        onClick={() => setSavedCartsVisible(true)}
                    >
                        Guardar
                    </Button>
                    <Button 
                        icon={<DeleteOutlined />} 
                        size="small" 
                        danger
                        onClick={clearCart}
                    >
                        Limpiar
                    </Button>
                </div>
            )}

            {/* Cart Items */}
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                {itemCount === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <ShoppingCartOutlined className="text-4xl mb-2" />
                        <p>No hay items en el carrito</p>
                    </div>
                ) : (
                    <>
                        {/* Seats Section */}
                        {items.length > 0 && (
                            <div>
                                <Title level={5} className="mb-2">
                                    <UserOutlined className="mr-2" />
                                    Asientos ({items.length})
                                </Title>
                                {items.map((item) => (
                                    <Card 
                                        key={item.sillaId} 
                                        size="small" 
                                        className="mb-2"
                                        actions={[
                                            <Button 
                                                type="text" 
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => toggleSeat(item)}
                                                size="small"
                                            >
                                                Eliminar
                                            </Button>
                                        ]}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Text strong>{item.nombre}</Text>
                                                <br />
                                                <Text type="secondary">
                                                    Zona: {item.nombreZona}
                                                </Text>
                                            </div>
                                            <Text strong className="text-lg">
                                                ${formatPrice(item.precio)}
                                            </Text>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Products Section */}
                        {products.length > 0 && (
                            <div>
                                <Title level={5} className="mb-2">
                                    <ShoppingCartOutlined className="mr-2" />
                                    Productos ({products.length})
                                </Title>
                                {products.map((product) => (
                                    <Card 
                                        key={product.id} 
                                        size="small" 
                                        className="mb-2"
                                        actions={[
                                            <Button 
                                                type="text" 
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeProduct(product.id)}
                                                size="small"
                                            >
                                                Eliminar
                                            </Button>
                                        ]}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <Text strong>{product.nombre}</Text>
                                                <br />
                                                <Text type="secondary">
                                                    ${formatPrice(product.precio)} c/u
                                                </Text>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    size="small"
                                                    icon={<MinusOutlined />}
                                                    onClick={() => updateProductQuantity(product.id, product.cantidad - 1)}
                                                />
                                                <InputNumber
                                                    size="small"
                                                    min={1}
                                                    max={product.stock_disponible || 999}
                                                    value={product.cantidad}
                                                    onChange={(value) => updateProductQuantity(product.id, value)}
                                                    style={{ width: 60 }}
                                                />
                                                <Button
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => updateProductQuantity(product.id, product.cantidad + 1)}
                                                    disabled={product.cantidad >= (product.stock_disponible || 999)}
                                                />
                                            </div>
                                            <Text strong className="text-lg ml-4">
                                                ${formatPrice(product.precio_total)}
                                            </Text>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Summary */}
            {itemCount > 0 && (
                <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="space-y-1">
                        {items.length > 0 && (
                            <div className="flex justify-between">
                                <Text>Asientos:</Text>
                                <Text>${formatPrice(getSeatsTotal())}</Text>
                            </div>
                        )}
                        {products.length > 0 && (
                            <div className="flex justify-between">
                                <Text>Productos:</Text>
                                <Text>${formatPrice(getProductsTotal())}</Text>
                            </div>
                        )}
                        <Divider />
                        <div className="flex justify-between">
                            <Text strong className="text-lg">Total:</Text>
                            <Text strong className="text-lg text-blue-600">
                                ${formatPrice(total)}
                            </Text>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {!user && (
                            <Alert
                                message="Autenticación requerida"
                                description="Debes iniciar sesión o registrarte para continuar con la compra"
                                type="warning"
                                showIcon
                                icon={<LockOutlined />}
                                className="mb-2"
                            />
                        )}
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleProceedToPayment}
                            icon={user ? <ShoppingCartOutlined /> : <LockOutlined />}
                        >
                            {user ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Saved Carts Modal */}
            <SavedCartsModal
                visible={savedCartsVisible}
                onClose={() => setSavedCartsVisible(false)}
                savedCarts={savedCarts}
                onLoadCart={loadSavedCart}
                onDeleteCart={deleteSavedCart}
                loading={savedCartsLoading}
            />

            {/* Auth Check Modal */}
            <AuthCheck
                visible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
                cartData={{
                    itemCount,
                    total,
                    items: items.length,
                    products: products.length
                }}
            />
        </div>
    );
};

export default Cart;
