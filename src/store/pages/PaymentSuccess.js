import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { loadMetaPixel } from '../utils/analytics';
import { supabase } from '../../supabaseClient';
import { useCartStore } from '../../store/cartStore';
import downloadTicket from '../../utils/downloadTicket';

const PaymentSuccess = () => {
  const addToCart = useCartStore(state => state.addToCart);
  const clearCart = useCartStore(state => state.clearCart);
  const params = useParams();
  const location = useLocation();
  const locator = location.state?.locator || params.locator;
  const emailSent = location.state?.emailSent;
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [eventOptions, setEventOptions] = useState({});

  const isReservation = paymentDetails?.status === 'reservado' || paymentDetails?.status === 'pending';

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const pixelId = localStorage.getItem('metaPixelId');
    if (pixelId) {
      loadMetaPixel(pixelId);
    }
  }, []);

  useEffect(() => {
    if (!locator) return;

    const fetchPaymentDetails = async () => {
      // Buscar en payment_transactions usando el locator como order_id
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', locator)
        .single();

      if (transactionError || !transaction) {
        console.error('Error fetching payment transaction:', transactionError);
        return;
      }

      // Simular datos de pago para compatibilidad con el componente existente
      const payment = {
        id: transaction.id,
        locator: transaction.order_id,
        amount: transaction.amount,
        status: transaction.status,
        paymentMethod: 'Método de pago procesado',
        created_at: transaction.created_at,
        // Datos simulados para compatibilidad
        event: { otrasOpciones: {} },
        seats: [],
        funcion: null
      };

      setPaymentDetails(payment);
      setEventOptions(payment.event?.otrasOpciones || {});
    };

    fetchPaymentDetails();
  }, [locator]);

  const handleDownloadAllTickets = async () => {
    try {
      await downloadTicket(locator);
    } catch {
      toast.error('No se pudo descargar el ticket');
    }
  };

  const handleDownloadSingleTicket = async (ticketId) => {
    try {
      await downloadTicket(locator, ticketId);
    } catch {
      toast.error('No se pudo descargar el ticket');
    }
  };

  const handleContinuePayment = async () => {
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`*, seats, funcion`)
      .eq('locator', locator)
      .single();

    if (error || !payment) {
      console.error('Load reservation error:', error);
      toast.error('No se pudo cargar la reserva');
      return;
    }

    addToCart(
      payment.seats.map(seat => ({
        _id: seat.id,
        nombre: seat.name,
        precio: seat.price,
        nombreMesa: seat.mesa?.nombre || '',
        zona: seat.zona?.id || seat.zona,
        zonaNombre: seat.zona?.nombre || ''
      })),
      payment.funcion?.id || payment.funcion
    );
    navigate('/store/payment');
  };

  if (!locator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Localizador no proporcionado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isReservation ? 'Reserva Confirmada' : 'Compra Exitosa'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isReservation ? 'Tu reserva ha sido registrada' : 'Tu compra ha sido procesada'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {isReservation ? 'Reservado' : 'Pagado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <FontAwesomeIcon icon={faCheckCircle} className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              {isReservation ? '¡Reserva Exitosa!' : '¡Pago Exitoso!'}
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              {isReservation ? 'Tu reserva ha sido registrada con éxito' : 'Tu compra ha sido registrada con éxito'}
            </p>
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
                <span className="text-gray-600">Fecha:</span>
                <span>{new Date(paymentDetails.created_at).toLocaleString()}</span>
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
        
        {!isReservation && paymentDetails?.seats?.length > 0 && (
          <div className="my-6">
            <div className="grid grid-cols-3 font-medium text-gray-700 py-2 border-b">
              <span>Boleto</span>
              <span>Método de Pago</span>
              <span className="text-right">Acciones</span>
            </div>
            {paymentDetails.seats.map(seat => (
              <div key={seat.id} className="grid grid-cols-3 items-center py-2 border-b">
                <span>{seat.name}</span>
                <span className="capitalize">{paymentDetails.paymentMethod}</span>
                <button
                  onClick={() => handleDownloadSingleTicket(seat.id)}
                  className="justify-self-end px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          {!isReservation && (
            <button
              onClick={handleDownloadAllTickets}
              className="flex items-center justify-center px-6 py-3 store-button store-button-primary"
              style={{ background: 'linear-gradient(135deg, var(--store-primary) 0%, var(--store-secondary) 100%)' }}
            >
              <FontAwesomeIcon icon={faTicketAlt} className="mr-2" />
              Descargar Todos
            </button>
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

        {eventOptions.observacionesEmail?.mostrar && (
          <div
            className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm"
            dangerouslySetInnerHTML={{ __html: String(eventOptions.observacionesEmail.texto || '') }}
          ></div>
        )}

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
