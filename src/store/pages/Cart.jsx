import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import logger from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, message } from 'antd';
import {
    DeleteOutlined,
    DownloadOutlined,
    UserOutlined,
    ShoppingCartOutlined,
    ClockCircleOutlined
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
                const errorText = await response.text().catch(() => 'Error desconocido');
                console.error('❌ [DOWNLOAD] Error en respuesta:', response.status, errorText);
                message.error(`Error al descargar ticket: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Manejar errores correctamente, asegurándose de que el mensaje sea un string
            const errorMessage = error instanceof Error 
                ? error.message 
                : typeof error === 'string' 
                    ? error 
                    : error?.message || 'Error desconocido al descargar el ticket';
            
            console.error('❌ [DOWNLOAD] Error descargando ticket:', error);
            console.error('❌ [DOWNLOAD] Error message:', errorMessage);
            message.error(`Error al descargar ticket: ${errorMessage}`);
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
                const errorText = await response.text().catch(() => 'Error desconocido');
                console.error('❌ [DOWNLOAD] Error en respuesta bulk:', response.status, errorText);
                const errorMsg = `Error al descargar tickets: ${response.status} ${response.statusText}`;
                message.error(errorMsg);
                VisualNotifications.show('error', errorMsg);
            }
        } catch (error) {
            // Manejar errores correctamente, asegurándose de que el mensaje sea un string
            const errorMessage = error instanceof Error 
                ? error.message 
                : typeof error === 'string' 
                    ? error 
                    : error?.message || 'Error desconocido al descargar los tickets';
            
            console.error('❌ [DOWNLOAD] Error descargando tickets (bulk):', error);
            console.error('❌ [DOWNLOAD] Error message:', errorMessage);
            const errorMsg = `Error al descargar tickets: ${errorMessage}`;
            message.error(errorMsg);
            VisualNotifications.show('error', errorMsg);
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
const Cart = ({ items: propsItems, removeFromCart: propsRemoveFromCart, selectedFunctionId, hideCheckoutButton = false, showTimer = true }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const cartStore = useCartStore();
    const {
        items: storeItems,
        products,
        clearCart,
        removeFromCart: storeRemoveFromCart,
        removeProduct,
        timeLeft
    } = cartStore;
    
    // Usar props si están disponibles, sino usar el store
    const items = propsItems || storeItems;
    const removeFromCart = propsRemoveFromCart || storeRemoveFromCart;
    
    // Si hay selectedFunctionId, filtrar items de esa función
    const filteredItems = selectedFunctionId 
      ? items.filter(item => {
          const itemFunctionId = item.functionId || item.funcionId;
          const matches = String(itemFunctionId) === String(selectedFunctionId);
          // Debug: log si hay items que no coinciden
          if (!matches && itemFunctionId) {
            console.log('🔍 [CART] Item no coincide con función:', {
              itemFunctionId,
              selectedFunctionId,
              item: item.sillaId || item.id || item._id
            });
          }
          return matches;
        })
      : items;
    
    // State to track paid seats
    const [paidSeatsSet, setPaidSeatsSet] = useState(new Set());

    // Smart cart state
    const [currentLocator] = useState(null);
    const [locatorSeats] = useState([]);
    const [pendingCheckout, setPendingCheckout] = useState(false);

    const itemCount = (filteredItems && Array.isArray(filteredItems) ? filteredItems.length : 0) + (products && Array.isArray(products) ? products.length : 0);
    
    // Debug: verificar itemCount y hideCheckoutButton
    useEffect(() => {
      if (itemCount > 0) {
        console.log('🛒 [CART] Item count:', itemCount, 'hideCheckoutButton:', hideCheckoutButton, 'filteredItems:', filteredItems.length, 'total items:', items.length);
      }
    }, [itemCount, hideCheckoutButton, filteredItems.length, items.length]);

    // Format price helper
    const formatPrice = (price) => {
        return typeof price === 'number' ? price.toFixed(2) : '0.00';
    };

    // Calculate totals
    const subtotal = (filteredItems && Array.isArray(filteredItems) ? filteredItems.reduce((sum, item) => sum + (item.precio || 0), 0) : 0) +
                    (products && Array.isArray(products) ? products.reduce((sum, product) => sum + (product.price || 0), 0) : 0);
    
    // Formatear tiempo restante
    const formatTime = (seconds) => {
      if (!seconds || seconds <= 0) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    // Obtener color del temporizador
    const getTimerColor = () => {
      if (!timeLeft || timeLeft <= 0) return '#999';
      if (timeLeft <= 60) return '#ff4d4f'; // Rojo últimos 60 segundos
      if (timeLeft <= 300) return '#faad14'; // Amarillo últimos 5 minutos
      return '#52c41a'; // Verde por defecto
    };


    // Get paid seats count
    const paidSeats = (locatorSeats && Array.isArray(locatorSeats) ? locatorSeats.filter(seat => seat.isPaid) : []);
    const unpaidSeats = (locatorSeats && Array.isArray(locatorSeats) ? locatorSeats.filter(seat => !seat.isPaid) : []);

    // Handle checkout - Optimizado para mobile (async, no bloqueante)
    const handleCheckout = () => {
        // Validación rápida primero (síncrona)
        if (itemCount === 0) {
            message.warning('El carrito está vacío');
            return;
        }
        
        // Ejecutar validaciones y navegación de forma no bloqueante
        // Esto previene que el UI se congele en mobile
        const executeCheckout = () => {
            try {
                // Validar que todos los asientos tengan IDs válidos
                const invalidSeats = filteredItems?.filter(item => !(item.id || item._id || item.sillaId)) || [];
                if (invalidSeats.length > 0) {
                    message.error('Algunos asientos no tienen IDs válidos. Por favor, recarga la página.');
                    return;
                }

                // Validar que no haya asientos duplicados (usar Set para mejor performance)
                const seatIds = filteredItems?.map(item => item.id || item._id || item.sillaId) || [];
                const uniqueSeatIds = new Set(seatIds);
                if (seatIds.length !== uniqueSeatIds.size) {
                    message.error('Hay asientos duplicados en el carrito. Por favor, verifica.');
                    return;
                }
                
                // Check if user is authenticated
                if (!user) {
                    setPendingCheckout(true);
                    // Dispatchear evento en window y document para máxima compatibilidad con iOS
                    // iOS Safari a veces no captura eventos solo en window
                    const eventDetail = { 
                        mode: 'login', 
                        source: 'cart', 
                        redirectTo: '/store/payment' 
                    };
                    
                    // Crear evento con bubbles para que se propague
                    const customEvent = new CustomEvent('store:open-account-modal', {
                        detail: eventDetail,
                        bubbles: true,
                        cancelable: true
                    });
                    
                    // Dispatch inmediato en window (para navegadores normales)
                    window.dispatchEvent(customEvent);
                    
                    // También dispatch en document después de requestAnimationFrame (para iOS)
                    // iOS a veces necesita que el evento se dispare en el document después del window
                    requestAnimationFrame(() => {
                        document.dispatchEvent(new CustomEvent('store:open-account-modal', {
                            detail: eventDetail,
                            bubbles: true,
                            cancelable: true
                        }));
                    });
                    
                    return;
                }
                
                // Navigate de forma asíncrona para no bloquear el UI thread
                setTimeout(() => {
                    navigate('/store/payment');
                }, 0);
            } catch (error) {
                console.error('Error en checkout:', error);
                message.error('Error al procesar el checkout. Por favor, intenta nuevamente.');
            }
        };
        
        // En mobile, usar requestIdleCallback si está disponible para mejor UX
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            requestIdleCallback(executeCheckout, { timeout: 100 });
        } else {
            // Fallback: usar setTimeout con delay mínimo
            setTimeout(executeCheckout, 0);
        }
    };

    // Handle successful login
    useEffect(() => {
        if (pendingCheckout && user) {
            setPendingCheckout(false);
            navigate('/store/payment');
        }
    }, [pendingCheckout, user, navigate]);

    // Check which seats are paid when items change (optimized with batch verification)
    useEffect(() => {
        const checkPaidSeats = async () => {
            if (!filteredItems || filteredItems.length === 0) {
                setPaidSeatsSet(new Set());
                return;
            }
            
            const currentSessionId = localStorage.getItem('anonSessionId');
            
            // Agrupar asientos por función para verificación batch
            const seatsByFunction = new Map();
            filteredItems.forEach(item => {
                const seatId = item.sillaId || item._id || item.id;
                const functionId = item.functionId || item.funcionId;
                
                if (seatId && functionId) {
                    if (!seatsByFunction.has(functionId)) {
                        seatsByFunction.set(functionId, []);
                    }
                    seatsByFunction.get(functionId).push(seatId);
                }
            });
            
            // Verificar todos los asientos en batch por función
            const paidSeatsSet = new Set();
            try {
                const seatPaymentChecker = await import('../services/seatPaymentChecker');
                
                // Verificar todas las funciones en paralelo
                const verificationPromises = Array.from(seatsByFunction.entries()).map(
                    async ([functionId, seatIds]) => {
                        try {
                            const batchResults = await seatPaymentChecker.default.checkSeatsBatch(
                                seatIds,
                                functionId,
                                currentSessionId,
                                { useCache: true, timeout: 5000 }
                            );
                            
                            // Agregar asientos pagados al Set
                            batchResults.forEach((result, seatId) => {
                                if (result.isPaid) {
                                    paidSeatsSet.add(seatId);
                                }
                            });
                        } catch (error) {
                            console.error(`Error checking seats for function ${functionId}:`, error);
                        }
                    }
                );
                
                await Promise.all(verificationPromises);
            } catch (error) {
                console.error('Error checking paid seats:', error);
            }
            
            setPaidSeatsSet(paidSeatsSet);
        };
        
        checkPaidSeats();
    }, [filteredItems]);

    // Facebook Pixel tracking
    useEffect(() => {
        if (shouldTrackOnPage('cart') && itemCount > 0) {
            getFacebookPixelByEvent(FACEBOOK_EVENTS.VIEW_CART, {
                content_ids: (filteredItems && Array.isArray(filteredItems) ? filteredItems.map(item => item.sillaId || item.id) : []),
                content_type: 'product',
                value: subtotal,
                currency: 'USD',
                num_items: itemCount
            });
        }
    }, [itemCount, filteredItems, subtotal]);

    // El carrito se muestra sin requerir sesión; el login se solicita al pagar

    return (
        <>
            {/* Facebook Pixel */}
            <FacebookPixel />

            <div className="store-card-header" style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderBottom: '1px solid var(--store-gray-200)',
              paddingBottom: '16px'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h1 className="store-text-xl md:store-text-2xl store-font-bold">
                  Carrito de Compras
                  {itemCount > 0 && (
                    <span className="store-ml-2 store-text-base store-font-normal store-text-gray-500">
                      ({itemCount})
                    </span>
                  )}
                </h1>
              </div>
              {/* Timer arriba */}
              {showTimer && Number(timeLeft) > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: timeLeft <= 60 ? '#fff1f0' : '#f0f7ff',
                  border: timeLeft <= 60 ? '2px solid #ff4d4f' : '1px solid #1890ff',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: getTimerColor(),
                  width: 'fit-content',
                  animation: timeLeft <= 60 ? 'pulse 2s infinite' : 'none'
                }}>
                  <ClockCircleOutlined />
                  <span>Tiempo restante: {formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
            
            <div className="store-card-body" style={{ flex: '1 1 auto', overflow: 'auto' }}>
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
                        </div>
                    ) : (
                    <>
                            {/* Locator Seats Section */}
                            {currentLocator && locatorSeats.length > 0 && (
                                <div className="store-space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                                        <h3 className="store-text-base md:store-text-lg store-font-semibold store-text-gray-900 break-words">
                                            <UserOutlined className="mr-2" />
                                            <span className="block sm:inline">Asientos del Localizador:</span>
                                            <span className="block sm:inline font-mono text-xs sm:text-sm">{currentLocator}</span>
                                        </h3>
                                        <div className="flex-shrink-0">
                                            <BulkTicketsDownloadButton
                                                locator={currentLocator}
                                                paidSeats={paidSeats}
                                                totalSeats={locatorSeats.length}
                                            />
                                        </div>
                                    </div>
                                
                                    {locatorSeats.map((seat) => (
                                        <div key={seat.id} className="store-cart-item">
                                            <div className="store-cart-item-header">
                                                <div className="store-cart-item-title break-words">
                                                    {seat.nombre || `Asiento ${seat.id}`}
                                                </div>
                                                <div className="store-cart-item-price">
                                                    ${formatPrice(seat.precio)}
                                                </div>
                                            </div>
                                            <div className="store-text-xs md:store-text-sm store-text-gray-600 mb-2 md:mb-3">
                                                {seat.zona || 'General'} - {seat.isPaid ? 'PAGADO' : 'RESERVADO'}
                                            </div>
                                            <div className="store-cart-item-actions flex flex-wrap gap-2">
                                                <TicketDownloadButton
                                                    seat={seat}
                                                    locator={currentLocator}
                                                    isPaid={seat.isPaid}
                                                />
                                                <button 
                                                    disabled={seat.isPaid}
                                                    className={`store-button store-button-sm flex-1 sm:flex-none ${seat.isPaid ? 'store-button-ghost' : 'store-button-secondary'}`}
                                                >
                                                    <DeleteOutlined />
                                                    <span className="hidden sm:inline">{seat.isPaid ? 'Pagado' : 'Quitar'}</span>
                                                    <span className="sm:hidden">{seat.isPaid ? 'Pagado' : 'Quitar'}</span>
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
                        {filteredItems && Array.isArray(filteredItems) && filteredItems.length > 0 && (
                            <div className="mb-6">
                                <Title level={5} className="mb-2">
                                    <UserOutlined className="mr-2" />
                                    Asientos Seleccionados ({(filteredItems && Array.isArray(filteredItems) ? filteredItems.length : 0)})
                                </Title>
                                {(filteredItems && Array.isArray(filteredItems) ? filteredItems.map((item) => {
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
                                                    {item.nombre || `Asiento ${item.sillaId || item.id || item._id}`}
                                                </div>
                                                <div className="text-xs text-gray-600" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {item.nombreZona && (
                                                      <div>Zona: {item.nombreZona}</div>
                                                    )}
                                                    {item.nombreMesa && (
                                                      <div>Mesa: {item.nombreMesa}</div>
                                                    )}
                                                    {!item.nombreZona && !item.nombreMesa && (
                                                      <div>General</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">
                                                    ${formatPrice(item.precio || 0)}
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

                {/* Summary and Checkout - Siempre visible */}
                <div className="store-cart-summary" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--store-gray-200)' }}>
                    {itemCount > 0 && (
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
                    )}
                    
                    {/* Botón de pago - Siempre visible si hay items */}
                    {itemCount > 0 && (
                        <button 
                            onClick={handleCheckout}
                            className="store-button store-button-primary store-button-lg store-button-block"
                            style={{
                                marginTop: '0',
                                width: '100%',
                                display: 'block'
                            }}
                        >
                            Proceder al Pago
                        </button>
                    )}
                    
                    {/* Botón de descarga de tickets pagados */}
                    {currentLocator && paidSeats.length > 0 && (
                        <button 
                            onClick={() => {
                                const downloadBtn = document.querySelector('[data-bulk-download]');
                                if (downloadBtn) downloadBtn.click();
                            }}
                            className="store-button store-button-secondary store-button-lg store-button-block"
                            style={{ marginTop: '8px' }}
                        >
                            <DownloadOutlined />
                            Descargar Tickets Pagados
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Cart;
