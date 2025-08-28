import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, InputNumber, Modal, Input, List, Tag, Space, Typography, Divider, Badge, Alert, message } from 'antd';
import { 
    ShoppingCartOutlined, 
    SaveOutlined, 
    DeleteOutlined, 
    DownloadOutlined,
    SearchOutlined,
    LockOutlined,
    FileTextOutlined,
    UserOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { useAuth } from '../../contexts/AuthContext';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent, FACEBOOK_EVENTS, shouldTrackOnPage } from '../services/facebookPixelService';

import AuthCheck from '../components/AuthCheck';
import EnhancedPaymentSearch from '../components/EnhancedPaymentSearch';

const { Title, Text } = Typography;





// Individual Ticket Download Button
const TicketDownloadButton = ({ seat, locator, isPaid }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!locator || !isPaid) return;
        
        setDownloading(true);
        try {
            const response = await fetch(`/api/payments/${locator}/download?mode=full`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                    'Accept': 'application/pdf'
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ticket-${locator}-${seat.id || seat.sillaId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                message.success('Ticket descargado correctamente');
            } else {
                message.error('Error al descargar ticket');
            }
        } catch (error) {
            console.error('Download error:', error);
            message.error('Error al descargar ticket');
        } finally {
            setDownloading(false);
        }
    };

    if (!locator || !isPaid) return null;

    return (
        <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            loading={downloading}
            className="text-blue-600 hover:text-blue-800"
        >
            Descargar
        </Button>
    );
};

// Bulk Tickets Download Button
const BulkTicketsDownloadButton = ({ locator, paidSeats, totalSeats }) => {
    const [downloading, setDownloading] = useState(false);

    const handleBulkDownload = async () => {
        if (!locator || paidSeats.length === 0) return;
        
        setDownloading(true);
        try {
            const response = await fetch(`/api/payments/${locator}/download?mode=bulk`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                    'Accept': 'application/pdf'
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tickets-${locator}-completos.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                message.success(`${paidSeats.length} tickets descargados correctamente`);
            } else {
                message.error('Error al descargar tickets');
            }
        } catch (error) {
            console.error('Bulk download error:', error);
            message.error('Error al descargar tickets');
        } finally {
            setDownloading(false);
        }
    };

    if (!locator || paidSeats.length === 0) return null;

    return (
        <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleBulkDownload}
            loading={downloading}
            className="bg-blue-600 hover:bg-blue-700"
            data-bulk-download
        >
            Descargar Todos ({paidSeats.length}/{totalSeats})
        </Button>
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
                                        type="primary" 
                                        size="small"
                                        onClick={() => onLoadCart(cart)}
                                    >
                                        Cargar
                                    </Button>,
                                    <Button 
                                        key="delete" 
                                        type="text" 
                                        danger 
                                        size="small"
                                        onClick={() => onDeleteCart(cart.id)}
                                    >
                                        Eliminar
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={cart.name}
                                    description={`${cart.seats?.length || 0} asientos, ${cart.products?.length || 0} productos`}
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

// Main Cart Component
const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        items,
        products,
        cartExpiration,
        timeLeft,
        savedCarts,
        savedCartsLoading,
        clearCart,
        loadSavedCart,
        deleteSavedCart,
        saveCurrentCart,
        toggleSeat,
        removeProduct
    } = useCartStore();

    // Smart cart state
    const [currentLocator, setCurrentLocator] = useState(null);
    const [foundPayment, setFoundPayment] = useState(null);
    const [locatorSeats, setLocatorSeats] = useState([]);
    const [savedCartsVisible, setSavedCartsVisible] = useState(false);

    const itemCount = (items && Array.isArray(items) ? items.length : 0) + (products && Array.isArray(products) ? products.length : 0);

    // Format price helper
    const formatPrice = (price) => {
        return typeof price === 'number' ? price.toFixed(2) : '0.00';
    };

    // Calculate totals
    const subtotal = (items && Array.isArray(items) ? items.reduce((sum, item) => sum + (item.precio || 0), 0) : 0) +
                    (products && Array.isArray(products) ? products.reduce((sum, product) => sum + (product.price || 0), 0) : 0);

    // Handle locator found
    const handleLocatorFound = useCallback((payment, locator) => {
        setCurrentLocator(locator);
        setFoundPayment(payment);
        
        // Parse seats from payment
        let seats = [];
        if (Array.isArray(payment.seats)) {
            seats = payment.seats;
        } else if (typeof payment.seats === 'string') {
            try {
                seats = JSON.parse(payment.seats);
            } catch {
                seats = [];
            }
        }
        
        // Process seats for display
        const processedSeats = seats.map(seat => ({
            ...seat,
            id: seat.id || seat._id,
            nombre: seat.name || seat.nombre,
            precio: seat.price || seat.precio,
            zona: seat.zona?.nombre || seat.zona,
            paymentId: payment.id,
            locator: locator,
            isPaid: payment.status === 'pagado'
        }));
        
        setLocatorSeats(processedSeats);
        
        // Clear current cart items if they exist
        if (items && Array.isArray(items) && items.length > 0) {
            clearCart();
            message.info('Carrito anterior limpiado para cargar localizador');
        }
    }, [clearCart, items.length]);

    // Handle clear locator
    const handleClearLocator = useCallback(() => {
        setCurrentLocator(null);
        setFoundPayment(null);
        setLocatorSeats([]);
    }, []);

    // Get paid seats count
    const paidSeats = (locatorSeats && Array.isArray(locatorSeats) ? locatorSeats.filter(seat => seat.isPaid) : []);
    const unpaidSeats = (locatorSeats && Array.isArray(locatorSeats) ? locatorSeats.filter(seat => !seat.isPaid) : []);

    // Handle checkout
    const handleCheckout = () => {
        if (itemCount === 0) {
            message.warning('El carrito está vacío');
            return;
        }
        
        // Validar que todos los asientos tengan IDs válidos
        const invalidSeats = items?.filter(item => !item.id && !item._id) || [];
        if (invalidSeats.length > 0) {
            message.error('Algunos asientos no tienen IDs válidos. Por favor, recarga la página.');
            return;
        }
        
        // Validar que no haya asientos duplicados
        const seatIds = items?.map(item => item.id || item._id) || [];
        const uniqueSeatIds = [...new Set(seatIds)];
        if (seatIds.length !== uniqueSeatIds.length) {
            message.error('Hay asientos duplicados en el carrito. Por favor, verifica.');
            return;
        }
        
        navigate('/checkout');
    };

    // Facebook Pixel tracking
    useEffect(() => {
        if (shouldTrackOnPage('cart') && itemCount > 0) {
            getFacebookPixelByEvent(FACEBOOK_EVENTS.VIEW_CART, {
                content_ids: (items && Array.isArray(items) ? items.map(item => item.sillaId || item.id) : []),
                content_type: 'product',
                value: subtotal,
                currency: 'USD',
                num_items: itemCount
            });
        }
    }, [itemCount, items, subtotal]);

    if (!user) {
        return <AuthCheck />;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            {/* Facebook Pixel */}
            <FacebookPixel />

            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div className="flex items-center space-x-2">
                    <ShoppingCartOutlined className="text-xl text-blue-500" />
                    <Title level={4} className="mb-0">Carrito de Compras</Title>
                    {itemCount > 0 && (
                        <Badge count={itemCount} size="small" />
                    )}
                </div>
                {cartExpiration && (
                    <div className="flex items-center space-x-2 text-red-500 font-mono text-sm">
                        <ClockCircleOutlined />
                        <span>Expira en: {Math.max(0, Math.floor((cartExpiration - Date.now()) / 60000))}:{Math.max(0, Math.floor(((cartExpiration - Date.now()) % 60000) / 1000)).toString().padStart(2, '0')}</span>
                    </div>
                )}
            </div>

            {/* Enhanced Payment Search */}
            <EnhancedPaymentSearch
                onLocatorFound={handleLocatorFound}
                onClearLocator={handleClearLocator}
                currentLocator={currentLocator}
            />

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
                {itemCount === 0 && !currentLocator ? (
                    <div className="text-center text-gray-500 py-8">
                        <ShoppingCartOutlined className="text-4xl mb-2" />
                        <p>No hay items en el carrito</p>
                        <p className="text-sm mt-2">Busca un localizador o añade asientos</p>
                    </div>
                ) : (
                    <>
                        {/* Locator Seats Section */}
                        {currentLocator && locatorSeats.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Title level={5} className="mb-0">
                                        <UserOutlined className="mr-2" />
                                        Asientos del Localizador: {currentLocator}
                                    </Title>
                                    <BulkTicketsDownloadButton
                                        locator={currentLocator}
                                        paidSeats={paidSeats}
                                        totalSeats={locatorSeats.length}
                                    />
                                </div>
                                
                                {locatorSeats.map((seat) => (
                                    <Card 
                                        key={seat.id} 
                                        size="small" 
                                        className="mb-2"
                                        actions={[
                                            <TicketDownloadButton
                                                key="download"
                                                seat={seat}
                                                locator={currentLocator}
                                                isPaid={seat.isPaid}
                                            />,
                                            <Button 
                                                key="remove"
                                                type="text" 
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                disabled={seat.isPaid}
                                            >
                                                {seat.isPaid ? 'Pagado' : 'Quitar'}
                                            </Button>
                                        ]}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {seat.nombre || `Asiento ${seat.id}`}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {seat.zona || 'General'} - {seat.isPaid ? 'PAGADO' : 'RESERVADO'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">
                                                    ${formatPrice(seat.precio)}
                                                </div>
                                                {!seat.isPaid && (
                                                    <Tag color="orange" size="small">
                                                        Pendiente
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                
                                {/* Payment Status Summary */}
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Asientos Pagados: <strong className="text-green-600">{paidSeats.length}</strong></span>
                                        <span>Asientos Pendientes: <strong className="text-orange-600">{unpaidSeats.length}</strong></span>
                                    </div>
                                    {unpaidSeats.length > 0 && (
                                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                            <Text type="warning" className="text-xs">
                                                ⚠️ Hay {unpaidSeats.length} asientos pendientes de pago. 
                                                Los tickets solo se pueden descargar cuando estén completamente pagados.
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Current Cart Seats Section */}
                        {items && Array.isArray(items) && items.length > 0 && (
                            <div className="mb-6">
                                <Title level={5} className="mb-2">
                                    <UserOutlined className="mr-2" />
                                    Asientos Seleccionados ({(items && Array.isArray(items) ? items.length : 0)})
                                </Title>
                                {(items && Array.isArray(items) ? items.map((item) => (
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
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {item.nombre || `Asiento ${item.sillaId}`}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {item.nombreZona || 'General'} - NUEVO
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">
                                                    ${formatPrice(item.precio)}
                                                </div>
                                                <Tag color="blue" size="small">
                                                    Nuevo
                                                </Tag>
                                            </div>
                                        </div>
                                    </Card>
                                )) : null)}
                            </div>
                        )}

                        {/* Products Section */}
                        {products && Array.isArray(products) && products.length > 0 && (
                            <div>
                                <Title level={5} className="mb-2">
                                    <ShoppingCartOutlined className="mr-2" />
                                    Productos ({(products && Array.isArray(products) ? products.length : 0)})
                                </Title>
                                {(products && Array.isArray(products) ? products.map((product) => (
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
                                            <div>
                                                <Text strong>{product.name}</Text>
                                                <br />
                                                <Text type="secondary">
                                                    Cantidad: {product.quantity}
                                                </Text>
                                            </div>
                                            <Text strong className="text-lg">
                                                ${formatPrice(product.price * product.quantity)}
                                            </Text>
                                        </div>
                                    </Card>
                                )) : null)}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Summary and Checkout */}
            {(itemCount > 0 || currentLocator) && (
                <div className="mt-6 border-t pt-4">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${formatPrice(subtotal)}</span>
                        </div>
                        {currentLocator && unpaidSeats.length > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>Pendiente de pago:</span>
                                <span>${formatPrice((unpaidSeats && Array.isArray(unpaidSeats) ? unpaidSeats.reduce((sum, seat) => sum + (seat.precio || 0), 0) : 0))}</span>
                            </div>
                        )}
                        <Divider />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total a pagar:</span>
                            <span>${formatPrice(subtotal)}</span>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {itemCount > 0 && (
                            <Button 
                                type="primary" 
                                size="large" 
                                onClick={handleCheckout}
                                className="flex-1"
                            >
                                Proceder al Pago
                            </Button>
                        )}
                        {currentLocator && paidSeats.length > 0 && (
                            <Button 
                                type="default" 
                                size="large"
                                icon={<DownloadOutlined />}
                                onClick={() => {
                                    // Trigger bulk download
                                    const downloadBtn = document.querySelector('[data-bulk-download]');
                                    if (downloadBtn) downloadBtn.click();
                                }}
                                className="flex-1"
                            >
                                Descargar Tickets Pagados
                            </Button>
                        )}
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
        </div>
    );
};

export default Cart;
