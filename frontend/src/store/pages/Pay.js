import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import MetodoPago from '../components/MetodoPago';
import { Modal } from 'antd';
import { toast } from 'react-hot-toast';

const Pay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const { user } = useAuth();

  // Accede de forma segura a los datos de navegación
  const { carrito: stateCarrito, funcionId: stateFuncionId } = location.state || {};
  const { cart, functionId: contextFuncionId } = useCart();
  const carrito = stateCarrito || cart;
  const funcionId = stateFuncionId || contextFuncionId;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [eventOptions, setEventOptions] = useState({});
  const [isObservacionesModalVisible, setIsObservacionesModalVisible] = useState(false);
  const [availableMethods, setAvailableMethods] = useState(["stripe", "paypal", "transferencia"]);
  const [allowReservation, setAllowReservation] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [affiliate, setAffiliate] = useState(null);

  const subtotal = carrito?.reduce((sum, item) => sum + item.precio, 0) || 0;
  const commission = affiliate ? (affiliate.base || 0) + subtotal * ((affiliate.percentage || 0) / 100) : 0;
  const subtotalAfter = subtotal - commission;
  const impuestos = subtotalAfter * 0.16;
  const total = subtotalAfter + impuestos;

  useEffect(() => {
    if (!funcionId) return;

    const fetchOptions = async () => {
      try {
        const funcRes = await fetch(`http://localhost:5000/api/funcions/${funcionId}`);
        const funcData = await funcRes.json();
        const eventId = funcData.evento?._id || funcData.evento;
        setAllowReservation(!!funcData.permitirReservasWeb);
        setCurrentEventId(eventId);

        if (eventId) {
          const eventRes = await fetch(`http://localhost:5000/api/events/${eventId}`);
          const eventData = await eventRes.json();
          setEventOptions(eventData.otrasOpciones || {});
          if (eventData.otrasOpciones?.metodosPagoPermitidos?.length) {
            setAvailableMethods(eventData.otrasOpciones.metodosPagoPermitidos);
          }
        }
      } catch (error) {
        console.error('Error cargando opciones del evento:', error);
      }
    };

    fetchOptions();
  }, [funcionId]);

  useEffect(() => {
    const fetchAffiliate = async () => {
      if (!refParam) {
        setAffiliate(null);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/affiliate-users?login=${encodeURIComponent(refParam)}`);
        if (res.ok) {
          const data = await res.json();
          setAffiliate(data);
        } else {
          setAffiliate(null);
        }
      } catch (err) {
        console.error('Error fetching affiliate', err);
        setAffiliate(null);
      }
    };
    fetchAffiliate();
  }, [refParam]);

  useEffect(() => {
    if (eventOptions.observacionesCompra?.mostrar) {
      setIsObservacionesModalVisible(true);
    }
  }, [eventOptions]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleProcessReservation = async () => {
    try {
      const seatsPayload = carrito.map(item => ({
        id: item._id,
        name: item.nombre || '',
        price: item.precio,
        zona: item.zona,
      }));
      const discountCode = carrito.find(it => it.descuentoNombre)?.descuentoNombre;

      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          user: user._id,
          event: currentEventId,
          funcion: funcionId,
          seats: seatsPayload,
          status: 'reservado',
          ...(refParam ? { referrer: refParam } : {}),
          ...(discountCode ? { discountCode } : {})
        })
      });

      const data = await response.json();

      if (data.locator) {
        navigate('/payment-success', { state: { locator: data.locator, emailSent: data.emailSent } });
      } else {
        toast.error('Error al procesar la reserva');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error('Error al procesar la reserva');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Por favor selecciona un método de pago");
      return;
    }

    try {
      const seatsPayload = carrito.map(item => ({
        id: item._id,
        name: item.nombre || '',
        price: item.precio,
        zona: item.zona,
      }));
      const discountCode = carrito.find(it => it.descuentoNombre)?.descuentoNombre;

      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          user: user._id,
          event: currentEventId,
          funcion: funcionId,
          seats: seatsPayload,
          status: 'pagado',
          payments: [{ method: selectedPaymentMethod, amount: total }],
          ...(refParam ? { referrer: refParam } : {}),
          ...(discountCode ? { discountCode } : {})
        })
      });

      const data = await response.json();

      if (data.locator) {
        navigate('/payment-success', { state: { locator: data.locator, emailSent: data.emailSent } });
      } else {
        toast.error('Error al procesar el pago');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Error al procesar el pago");
    }
  };

  // ✅ Render condicional después de los hooks
  if (!carrito || !funcionId) {
    const path = refParam ? `/store?ref=${refParam}` : '/store';
    return <Navigate to={path} replace />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>

      {/* Cart Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Resumen del Carrito</h2>
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between py-2 border-b">
            <span>{item.zonaNombre} - {item.nombreMesa}</span>
            <span>${item.precio}</span>
          </div>
        ))}
        <div className="mt-4">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {affiliate && (
            <>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Comisión {affiliate.user.login} ({Number(affiliate.base || 0).toFixed(2)} + {affiliate.percentage}%):</span>
                <span>- ${commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Subtotal con descuento:</span>
                <span>${subtotalAfter.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between py-2">
            <span>Impuestos (16%):</span>
            <span>${impuestos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>


      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Método de Pago</h2>
        <MetodoPago
          metodosDisponibles={availableMethods}
          onSelect={handlePaymentMethodSelect}
          selected={selectedPaymentMethod}
        />
      </div>

      {/* Process Payment / Reservation Buttons */}
      {allowReservation && (
        <button
          onClick={handleProcessReservation}
          className="w-full mb-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
        >
          Reservar
        </button>
      )}
      <button
        onClick={handleProcessPayment}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        disabled={!selectedPaymentMethod}
      >
        Proceder al Pago
      </button>

      {eventOptions.observacionesCompra?.mostrar && (
        <Modal
          open={isObservacionesModalVisible}
          closable={false}
          maskClosable={true}
          onOk={() => setIsObservacionesModalVisible(false)}
          onCancel={() => setIsObservacionesModalVisible(false)}
          okText="Continuar"
          cancelButtonProps={{ style: { display: 'none' } }}
        >
          <p>{eventOptions.observacionesCompra.texto}</p>
        </Modal>
      )}
    </div>
  );
};

export default Pay;
