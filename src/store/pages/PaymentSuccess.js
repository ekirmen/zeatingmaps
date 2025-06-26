import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { loadMetaPixel } from '../utils/analytics';
import { supabase } from '../../backoffice/services/supabaseClient';
import API_BASE_URL from '../../utils/apiBase';

const PaymentSuccess = () => {
  const params = useParams();
  const location = useLocation();
  const locator = location.state?.locator || params.locator;
  const emailSent = location.state?.emailSent;
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const { setCart } = useCart();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [eventOptions, setEventOptions] = useState({});

  const isReservation = paymentDetails?.status === 'reservado';

  useEffect(() => {
    const pixelId = localStorage.getItem('metaPixelId');
    if (pixelId) {
      loadMetaPixel(pixelId);
    }
  }, []);

  useEffect(() => {
    if (!locator) return;

    const fetchPaymentDetails = async () => {
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`*, event:event (id, otrasOpciones), seats, funcion`)
        .eq('locator', locator)
        .single();

      if (error || !payment) {
        console.error('Error fetching payment details:', error);
        return;
      }

      const amount = payment.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const paymentMethod = payment.payments?.map(p => p.method).join(', ') || '';

      setPaymentDetails({ ...payment, amount, paymentMethod });
      setEventOptions(payment.event?.otrasOpciones || {});
    };

    fetchPaymentDetails();
  }, [locator]);

  const handleDownloadTickets = () => {
    window.open(`${API_BASE_URL}/api/payments/${locator}/download`, '_blank');
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

    setCart(
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
    navigate('/store/pay');
  };

  if (!locator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Localizador no proporcionado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
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

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          {!isReservation && (
            <button
              onClick={handleDownloadTickets}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FontAwesomeIcon icon={faTicketAlt} className="mr-2" />
              Descargar Entradas
            </button>
          )}
          {isReservation && (
            <button
              onClick={handleContinuePayment}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Completar Pago
            </button>
          )}

          <button
            onClick={() => {
              const path = refParam ? `/store?ref=${refParam}` : '/store';
              navigate(path);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Volver al Inicio
          </button>
        </div>

        {eventOptions.observacionesEmail?.mostrar && (
          <div
            className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm"
            dangerouslySetInnerHTML={{ __html: String(eventOptions.observacionesEmail.texto || '') }}
          />
        )}

        {emailSent && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Se ha enviado un correo electrónico con los detalles de tu compra</p>
            <p className="mt-1">Guarda tu localizador para futuras referencias</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
