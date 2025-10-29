import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, message } from 'antd';
import {
    DeleteOutlined,
    DownloadOutlined,
    UserOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { useCartStore } from '../cartStore';
// Nota: El carrito debe ser visible incluso en modo incógnito (sin login)
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent, FACEBOOK_EVENTS, shouldTrackOnPage } from '../services/facebookPixelService';
// import ValidationWidget from '../../components/ValidationWidget';
import VisualNotifications from '../../utils/VisualNotifications';
import { useAuth } from '../../contexts/AuthContext';

// import AuthCheck from '../components/AuthCheck';

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
                VisualNotifications.show('purchaseComplete', `${paidSeats.length} tickets descargados correctamente`);
            } else {
                message.error('Error al descargar tickets');
                VisualNotifications.show('error', 'Error al descargar tickets');
            }
        } catch (error) {
            
            message.error('Error al descargar tickets');
            VisualNotifications.show('error', 'Error al descargar tickets');
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

// Main Cart Component
const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        items,
        products,
        clearCart,
        removeFromCart,
        removeProduct
    } = useCartStore();
    
    // State to track paid seats
    const [paidSeatsSet, setPaidSeatsSet] = useState(new Set());

    // Smart cart state
    const [currentLocator] = useState(null);
    const [locatorSeats] = useState([]);
    const [pendingCheckout, setPendingCheckout] = useState(false);

    const itemCount = (items && Array.isArray(items) ? items.length : 0) + (products && Array.isArray(products) ? products.length : 0);

    // Format price helper
    const formatPrice = (price) => {
        return typeof price === 'number' ? price.toFixed(2) : '0.00';
    };

    // Calculate totals
    const subtotal = (items && Array.isArray(items) ? items.reduce((sum, item) => sum + (item.precio || 0), 0) : 0) +
                    (products && Array.isArray(products) ? products.reduce((sum, product) => sum + (product.price || 0), 0) : 0);


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
        const invalidSeats = items?.filter(item => !(item.id || item._id || item.sillaId)) || [];
        if (invalidSeats.length > 0) {
            message.error('Algunos asientos no tienen IDs válidos. Por favor, recarga la página.');
            return;
        }

        // Validar que no haya asientos duplicados
        const seatIds = items?.map(item => item.id || item._id || item.sillaId) || [];
        const uniqueSeatIds = [...new Set(seatIds)];
        if (seatIds.length !== uniqueSeatIds.length) {
            message.error('Hay asientos duplicados en el carrito. Por favor, verifica.');
            return;
        }
        
        // Check if user is authenticated
        if (!user) {
            setPendingCheckout(true);
            window.dispatchEvent(
                new CustomEvent('store:open-account-modal', {
                    detail: { mode: 'login', source: 'cart' }
                })
            );
            return;
        }
        
        // Redirect to the payment page within the store
        navigate('/store/payment');
    };

    // Handle successful login
    useEffect(() => {
        if (pendingCheckout && user) {
            setPendingCheckout(false);
            navigate('/store/payment');
        }
    }, [pendingCheckout, user, navigate]);

    // Check which seats are paid when items change
    useEffect(() => {
        const checkPaidSeats = async () => {
            if (!items || items.length === 0) {
                setPaidSeatsSet(new Set());
                return;
            }
            
            const currentSessionId = localStorage.getItem('anonSessionId');
            const paidSeatsSet = new Set();
            
            for (const item of items) {
                const seatId = item.sillaId || item._id || item.id;
                const functionId = item.functionId || item.funcionId;
                
                if (seatId && functionId) {
                    try {
                        const seatPaymentChecker = await import('../services/seatPaymentChecker');
                        const paymentCheck = await seatPaymentChecker.default.isSeatPaidByUser(seatId, functionId, currentSessionId);
                        
                        if (paymentCheck.isPaid) {
                            paidSeatsSet.add(seatId);
                        }
                    } catch (error) {
                        console.error('Error checking payment status for seat:', seatId, error);
                    }
                }
            }
            
            setPaidSeatsSet(paidSeatsSet);
        };
        
        checkPaidSeats();
    }, [items]);

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

    // El carrito se muestra sin requerir sesión; el login se solicita al pagar

    return (
        <div className="store-container store-container-sm">
            {/* Facebook Pixel */}
            <FacebookPixel />

            <div className="store-card">
                <div className="store-card-header">
                    <h1 className="store-text-2xl store-font-bold store-text-center">Carrito de Compras</h1>
                </div>
                
                <div className="store-card-body">
                    {/* Quick Actions */}
                    {itemCount > 0 && (
                        <div className="store-space-y-4 mb-6">
                            <button
                                onClick={clearCart}
                                className="store-button store-button-secondary store-button-sm"
                            >
                                <DeleteOutlined />
                                Limpiar Carrito
                            </button>
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="max-h-[400px] overflow-y-auto store-space-y-4">
                        {itemCount === 0 && !currentLocator ? (
                            <div className="store-text-center store-text-gray-500 py-8">
                                <ShoppingCartOutlined className="text-4xl mb-2" />
                                <p className="store-text-lg store-font-medium">No hay items en el carrito</p>
                                <p className="store-text-sm store-text-gray-400 mt-2">Añade asientos al carrito</p>
                                <button 
                                    onClick={() => navigate('/store')}
                                    className="store-button store-button-primary store-button-lg mt-4"
                                >
                                    Explorar Eventos
                                </button>
                            </div>
                ) : (
                    <>
                            {/* Locator Seats Section */}
                            {currentLocator && locatorSeats.length > 0 && (
                                <div className="store-space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="store-text-lg store-font-semibold store-text-gray-900">
                                            <UserOutlined className="mr-2" />
                                            Asientos del Localizador: {currentLocator}
                                        </h3>
                                        <BulkTicketsDownloadButton
                                            locator={currentLocator}
                                            paidSeats={paidSeats}
                                            totalSeats={locatorSeats.length}
                                        />
                                    </div>
                                
                                    {locatorSeats.map((seat) => (
                                        <div key={seat.id} className="store-cart-item">
                                            <div className="store-cart-item-header">
                                                <div className="store-cart-item-title">
                                                    {seat.nombre || `Asiento ${seat.id}`}
                                                </div>
                                                <div className="store-cart-item-price">
                                                    ${formatPrice(seat.precio)}
                                                </div>
                                            </div>
                                            <div className="store-text-sm store-text-gray-600 mb-3">
                                                {seat.zona || 'General'} - {seat.isPaid ? 'PAGADO' : 'RESERVADO'}
                                            </div>
                                            <div className="store-cart-item-actions">
                                                <TicketDownloadButton
                                                    seat={seat}
                                                    locator={currentLocator}
                                                    isPaid={seat.isPaid}
                                                />
                                                <button 
                                                    disabled={seat.isPaid}
                                                    className={`store-button store-button-sm ${seat.isPaid ? 'store-button-ghost' : 'store-button-secondary'}`}
                                                >
                                                    <DeleteOutlined />
                                                    {seat.isPaid ? 'Pagado' : 'Quitar'}
                                                </button>
                                                {!seat.isPaid && (
                                                    <span className="store-badge store-badge-warning">Pendiente</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                
                                    {/* Payment Status Summary */}
                                    <div className="store-alert store-alert-info">
                                        <div className="flex justify-between items-center store-text-sm">
                                            <span>Asientos Pagados: <strong className="store-text-success">{paidSeats.length}</strong></span>
                                            <span>Asientos Pendientes: <strong className="store-text-warning">{unpaidSeats.length}</strong></span>
                                        </div>
                                        {unpaidSeats.length > 0 && (
                                            <div className="store-alert store-alert-warning mt-3">
                                                ⚠️ Hay {unpaidSeats.length} asientos pendientes de pago. 
                                                Los tickets solo se pueden descargar cuando estén completamente pagados.
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
                                {(items && Array.isArray(items) ? items.map((item) => {
                                    const seatId = item.sillaId || item._id || item.id;
                                    const isPaid = paidSeatsSet.has(seatId);
                                    
                                    return (
                                        <Card 
                                            key={item.sillaId} 
                                            size="small" 
                                            className="mb-2"
                                            actions={[
                                                <Button 
                                                    type="text"
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => removeFromCart(seatId)}
                                                    size="small"
                                                    disabled={isPaid}
                                                    className={isPaid ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-900"}
                                                >
                                                    {isPaid ? 'Pagado' : 'Eliminar'}
                                                </Button>
                                            ]}
                                        >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {item.nombre || `Asiento ${item.sillaId}`}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {item.nombreZona || 'General'}{item.nombreMesa ? ` - Mesa ${item.nombreMesa}` : ''}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">
                                                    ${formatPrice(item.precio)}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                    );
                                }) : null)}
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
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeProduct(product.id)}
                                                size="small"
                                                className="text-gray-600 hover:text-gray-900"
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
                        <div className="store-cart-summary">
                            <div className="store-space-y-3 mb-4">
                                <div className="store-cart-summary-row">
                                    <span className="store-text-gray-600">Subtotal:</span>
                                    <span className="store-font-semibold">${formatPrice(subtotal)}</span>
                                </div>
                                {currentLocator && unpaidSeats.length > 0 && (
                                    <div className="store-cart-summary-row store-text-warning">
                                        <span>Pendiente de pago:</span>
                                        <span>${formatPrice((unpaidSeats && Array.isArray(unpaidSeats) ? unpaidSeats.reduce((sum, seat) => sum + (seat.precio || 0), 0) : 0))}</span>
                                    </div>
                                )}
                                <div className="store-cart-summary-total">
                                    <span>Total a pagar:</span>
                                    <span>${formatPrice(subtotal)}</span>
                                </div>
                            </div>

                            <div className="store-space-x-4">
                                {itemCount > 0 && (
                                    <button 
                                        onClick={handleCheckout}
                                        className="store-button store-button-primary store-button-lg store-button-block"
                                    >
                                        Proceder al Pago
                                    </button>
                                )}
                                {currentLocator && paidSeats.length > 0 && (
                                    <button 
                                        onClick={() => {
                                            // Trigger bulk download
                                            const downloadBtn = document.querySelector('[data-bulk-download]');
                                            if (downloadBtn) downloadBtn.click();
                                        }}
                                        className="store-button store-button-secondary store-button-lg store-button-block"
                                    >
                                        <DownloadOutlined />
                                        Descargar Tickets Pagados
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Widget de Validación en Tiempo Real (deshabilitado por solicitud) */}
        </div>
    );
};

export default Cart;
