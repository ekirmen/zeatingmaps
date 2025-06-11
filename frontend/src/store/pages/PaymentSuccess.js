import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaTicketAlt } from 'react-icons/fa';

const PaymentSuccess = () => {
  const params = useParams();
  const location = useLocation();
  const locator = location.state?.locator || params.locator;
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [eventOptions, setEventOptions] = useState({});
  const isReservation = paymentDetails?.status === 'reservado';

  if (!locator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Localizador no proporcionado.</p>
      </div>
    );
  }

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/payments/locator/${locator}`);
        const data = await response.json();
        if (data?.data) {
          setPaymentDetails(data.data);
          const eventId = data.data.event?._id;
          if (eventId) {
            const evRes = await fetch(`http://localhost:5000/api/events/${eventId}`);
            const evData = await evRes.json();
            setEventOptions(evData.otrasOpciones || {});
          }
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }
    };
    fetchPaymentDetails();
  }, [locator]);

  const handleDownloadTickets = () => {
    // Implement ticket download functionality
    window.open(`http://localhost:5000/api/tickets/download/${locator}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <FaCheckCircle className="mx-auto h-16 w-16 text-green-500" />
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
                    <span className="font-bold">
                      $ {paymentDetails.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Método de Pago:</span>
                    <span className="capitalize">{paymentDetails.paymentMethod}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fecha:</span>
                <span>{new Date(paymentDetails.createdAt).toLocaleString()}</span>
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
              <FaTicketAlt className="mr-2" />
              Descargar Entradas
            </button>
          )}
          
          <button
            onClick={() => navigate('/store')}
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

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Se ha enviado un correo electrónico con los detalles de tu compra</p>
          <p className="mt-1">Guarda tu localizador para futuras referencias</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
