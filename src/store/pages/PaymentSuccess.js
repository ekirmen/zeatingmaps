import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { loadMetaPixel } from '../utils/analytics';
import { useCartStore } from '../../store/cartStore';
import downloadTicket from '../../utils/downloadTicket';
import downloadPkpass from '../../utils/downloadPkpass';
import { useAuth } from '../../contexts/AuthContext';
import seatLocatorService from '../services/seatLocatorService';

const PaymentSuccess = () => {
  const clearCart = useCartStore(state => state.clearCart);
  const params = useParams();
  const location = useLocation();
  const locator = location.state?.locator || params.locator;
  const emailSent = location.state?.emailSent;
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const isReservation = paymentDetails?.status === 'reservado' || paymentDetails?.status === 'pending';

  useEffect(() => {
    // Limpiar carrito (sin intentar desbloquear asientos ya vendidos)
    clearCart(true);
  }, [clearCart]);

  useEffect(() => {
    const pixelId = localStorage.getItem('metaPixelId');
    if (pixelId) {
      loadMetaPixel(pixelId);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/store/login', { state: { from: location }, replace: true });
    }
  }, [authLoading, user, navigate, location]);

  useEffect(() => {
    if (!locator || !user) return;

    const fetchPaymentDetails = async () => {
      try {
        const transactionWithSeats = await seatLocatorService.getTransactionWithSeats(locator);

        if (transactionWithSeats?.transaction) {
          // Parsear asientos si vienen como string
          let seats = transactionWithSeats.seats || [];
          if (transactionWithSeats.transaction.seats) {
            try {
              if (typeof transactionWithSeats.transaction.seats === 'string') {
                seats = JSON.parse(transactionWithSeats.transaction.seats);
              } else if (Array.isArray(transactionWithSeats.transaction.seats)) {
                seats = transactionWithSeats.transaction.seats;
              }
            } catch (e) {
              console.warn('Error parseando asientos desde transaction:', e);
              // Usar seats de transactionWithSeats si hay error
              seats = transactionWithSeats.seats || [];
            }
          }
          
          console.log('📋 [PaymentSuccess] Asientos obtenidos:', seats);
          console.log('📋 [PaymentSuccess] Número de asientos:', seats.length);
          
          setPaymentDetails({
            ...transactionWithSeats.transaction,
            seats: seats
          });
          
          // Verificar si el evento tiene wallet habilitado
          if (transactionWithSeats.event?.datosBoleto) {
            try {
              const datosBoleto = typeof transactionWithSeats.event.datosBoleto === 'string'
                ? JSON.parse(transactionWithSeats.event.datosBoleto)
                : transactionWithSeats.event.datosBoleto;
              
              setWalletEnabled(datosBoleto?.habilitarWallet === true);
            } catch (e) {
              console.warn('Error parseando datosBoleto:', e);
              setWalletEnabled(false);
            }
          } else {
            // Si no hay datosBoleto, el wallet no está habilitado
            setWalletEnabled(false);
          }
        } else {
          console.error('No transaction found for locator:', locator);
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }
    };

    fetchPaymentDetails();
  }, [locator, user]);


  const handleDownloadAllTickets = async () => {
    try {
      await downloadTicket(locator, null, 'web');
    } catch {
      toast.error('No se pudo descargar el ticket');
    }
  };
  
  const handleDownloadPkpass = async () => {
    try {
      await downloadPkpass(locator, null, 'web');
    } catch (error) {
      console.error('Error descargando .pkpass:', error);
      // El error ya se muestra en downloadPkpass
    }
  };

  const formatPurchaseDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

    const day = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const time = date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
      .toUpperCase();

    return `${day}, ${time}`;
  };


  const handleContinuePayment = async () => {
    try {
      if (!user) {
        toast.error('Debes iniciar sesión para continuar');
        navigate('/store/login', { state: { from: location }, replace: true });
        return;
      }

      const transaction =
        paymentDetails ?? (await seatLocatorService.getTransactionWithSeats(locator))?.transaction;

      if (!transaction) {
        toast.error('No se pudo cargar la reserva');
        return;
      }

      if (transaction.status === 'pending' || transaction.status === 'reservado') {
        navigate('/store/cart');
      } else {
        toast.error('Esta transacción ya ha sido procesada');
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      toast.error('Error al cargar la reserva');
    }
  };

  if (!locator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Localizador no proporcionado.</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="mb-6 md:mb-8 md:flex md:items-center md:justify-between md:text-left text-center">
            <div className="flex items-center justify-center md:justify-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isReservation ? '¡Reserva Exitosa!' : '¡Pago Exitoso!'}
                </h2>
                <p className="mt-1 text-base text-gray-600">
                  {isReservation ? 'Tu reserva ha sido registrada con éxito' : 'Tu compra ha sido registrada con éxito'}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2 justify-center md:justify-end">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {isReservation ? 'Reservado' : 'Pagado'}
              </span>
            </div>
          </div>

        <div className="border-t border-b border-gray-200 py-4 my-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Localizador:</span>
            <span className="font-mono font-bold text-lg">{locator}</span>
          </div>

          {paymentDetails && (
            <>
              {!isReservation && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Total Pagado:</span>
                    <span className="font-bold">$ {paymentDetails.amount}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Método de Pago:</span>
                    <span className="capitalize">{paymentDetails.paymentMethod}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fecha de la Compra:</span>
                <span>{formatPurchaseDate(paymentDetails.created_at)}</span>
              </div>
            </>
          )}
        </div>
        
        {isReservation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Reserva temporal:</strong> Tienes tiempo limitado para completar el pago.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  <strong>Tiempo para pagar:</strong> {paymentDetails?.tiempo_caducidad_reservas ? 
                    `${Math.abs(paymentDetails.tiempo_caducidad_reservas)} minutos` : 
                    'Contacta para más información'
                  }
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  <strong>Contacto:</strong> +1 (555) 123-4567
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!isReservation && paymentDetails && (
          <div className="my-6">
            {paymentDetails.seats && Array.isArray(paymentDetails.seats) && paymentDetails.seats.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets ({paymentDetails.seats.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {paymentDetails.seats.map((seat, index) => {
                    const ticketNumber = index + 1; // Número del ticket (1, 2, 3...)
                    const seatId = seat.seat_id || seat.id || seat._id || `seat-${index}`;
                    const zonaNombre = seat.zona_nombre || seat.zonaNombre || seat.zona?.nombre || seat.zona || null;
                    const mesaId = seat.table_id || seat.mesa_id || seat.mesaId || seat.mesa?.id || seat.mesa || null;
                    const filaNombre = seat.fila_nombre || seat.filaNombre || seat.fila?.nombre || seat.fila || seat.row || null;
                    // Obtener el número real del asiento (puede estar en diferentes campos)
                    const asientoNumero = seat.asiento || seat.numero || seat.seat || seat.name || seat.asientoNombre || null;
                    
                    // Construir la línea de información (Zona, Mesa/Fila, Asiento)
                    const infoParts = [];
                    if (zonaNombre) infoParts.push(`Zona: ${zonaNombre}`);
                    if (mesaId) infoParts.push(`Mesa: ${mesaId}`);
                    if (filaNombre && !mesaId) infoParts.push(`Fila: ${filaNombre}`);
                    if (asientoNumero) infoParts.push(`Asiento: ${asientoNumero}`);
                    const infoLine = infoParts.join(' | ');
                    
                    return (
                      <div key={seatId || index} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-2">
                              Ticket N{ticketNumber}
                            </p>
                            {infoLine && (
                              <p className="text-sm text-gray-700 mb-2">
                                {infoLine}
                              </p>
                            )}
                            {seat.precio && (
                              <p className="text-sm text-gray-600 font-semibold mt-1">
                                Precio: ${seat.precio}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded ml-2 whitespace-nowrap">
                            Confirmado
                          </span>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              console.log(`📥 [PaymentSuccess] Descargando ticket ${ticketNumber} (índice ${index})`);
                              await downloadTicket(locator, null, 'web', index);
                            } catch (error) {
                              console.error('Error descargando ticket individual:', error);
                              toast.error('Error al descargar el ticket');
                            }
                          }}
                          className="w-full mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <FontAwesomeIcon icon={faTicketAlt} className="mr-2" />
                          Descargar Ticket N{ticketNumber}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  <strong>Nota:</strong> No se encontraron asientos para esta transacción. 
                  {paymentDetails.status === 'completed' || paymentDetails.status === 'pagado' 
                    ? ' Contacta con soporte si necesitas ayuda.' 
                    : ' Los asientos aparecerán cuando el pago esté completo.'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          {!isReservation && (
            <>
              <button
                onClick={handleDownloadAllTickets}
                className="flex items-center justify-center px-6 py-3 store-button store-button-primary"
                style={{ background: 'linear-gradient(135deg, var(--store-primary) 0%, var(--store-secondary) 100%)' }}
              >
                <FontAwesomeIcon icon={faTicketAlt} className="mr-2" />
                Descargar todos los PDF
              </button>
              {walletEnabled && (
                <button
                  onClick={handleDownloadPkpass}
                  className="flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Descargar Wallet
                </button>
              )}
            </>
          )}
          {isReservation && (
            <button
              onClick={handleContinuePayment}
              className="px-6 py-3 store-button store-button-primary"
              style={{ background: 'linear-gradient(135deg, var(--store-primary) 0%, var(--store-secondary) 100%)' }}
            >
              Completar Pago
            </button>
          )}

          <button
            onClick={() => {
              const path = refParam ? `/store?ref=${refParam}` : '/store';
              navigate(path);
            }}
            className="px-6 py-3 store-button store-button-secondary"
          >
            Volver al Inicio
          </button>
        </div>


        {emailSent && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Se ha enviado un correo electrónico con los detalles de tu compra</p>
            <p className="mt-1">Guarda tu localizador para futuras referencias</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
