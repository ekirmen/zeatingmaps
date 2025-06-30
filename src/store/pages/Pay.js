import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import MetodoPago from '../components/MetodoPago';
import { Modal } from 'antd';
import { toast } from 'react-hot-toast';
import { loadMetaPixel } from '../utils/analytics';
import { supabase } from '../../backoffice/services/supabaseClient';
import { updateSeat } from '../../backoffice/services/supabaseSeats';
import { isUuid } from '../../utils/isUuid';


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
  const [funcionDetails, setFuncionDetails] = useState(null);
  const [affiliate, setAffiliate] = useState(null);

  useEffect(() => {
    const pixelId = localStorage.getItem('metaPixelId');
    if (pixelId) {
      loadMetaPixel(pixelId);
    }
  }, []);

  const subtotal = carrito?.reduce((sum, item) => sum + item.precio, 0) || 0;
  const commission = affiliate ? (affiliate.base || 0) + subtotal * ((affiliate.percentage || 0) / 100) : 0;
  const subtotalAfter = subtotal - commission;
  const impuestos = subtotalAfter * 0.16;
  const total = subtotalAfter + impuestos;

  useEffect(() => {
    if (!funcionId) return;

    const fetchOptions = async () => {
      try {
        const { data: funcData, error: funcErr } = await supabase
          .from('funciones')
          .select('*, permitirReservasWeb:permitir_reservas_web')
          .eq('id', funcionId)
          .single();
        if (funcErr) throw funcErr;
        setFuncionDetails(funcData);
        const eventId = funcData.evento?.id || funcData.evento;
        setAllowReservation(!!funcData.permitirReservasWeb);
        setCurrentEventId(eventId);

        if (eventId) {
          const { data: eventData, error: evErr } = await supabase
            .from('eventos')
            .select('*')
            .eq('id', eventId)
            .single();
          if (evErr) throw evErr;
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
        const { data, error } = await supabase
          .from('affiliate_users')
          .select('*')
          .eq('login', refParam)
          .single();
        if (error) throw error;
        setAffiliate(data);
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
      const isValidFuncionId = Number.isInteger(Number(funcionId)) && Number(funcionId) > 0;
      if (!isUuid(user?.id) || !isUuid(currentEventId) || !isValidFuncionId) {
        console.error('Invalid IDs provided for reservation');
        toast.error('Error al procesar la reserva');
        return;
      }
      const seatsPayload = carrito.map(item => ({
        id: item._id,
        name: item.nombre || '',
        price: item.precio,
        zona: item.zona,
      }));
      const discountCode = carrito.find(it => it.descuentoNombre)?.descuentoNombre;
  
      const { data, error } = await supabase.from('payments').insert([{
        usuario_id: user.id,
        event: currentEventId,
        funcion: funcionId,
        seats: seatsPayload,
        status: 'reservado',
        referrer: refParam || null,
        discountCode: discountCode || null,
        created_at: new Date().toISOString()
      }]).select().single();
  
      if (error) throw error;

      await Promise.all(
        carrito.map(item => updateSeat(item._id, { status: 'reservado' }))
      );

      navigate('/payment-success', { state: { locator: data.locator || data.id, emailSent: false } });
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
      const isValidFuncionId = Number.isInteger(Number(funcionId)) && Number(funcionId) > 0;
      if (!isUuid(user?.id) || !isUuid(currentEventId) || !isValidFuncionId) {
        console.error('Invalid IDs provided for payment');
        toast.error('Error al procesar el pago');
        return;
      }
      const seatsPayload = carrito.map(item => ({
        id: item._id,
        name: item.nombre || '',
        price: item.precio,
        zona: item.zona,
      }));
      const discountCode = carrito.find(it => it.descuentoNombre)?.descuentoNombre;
  
      const { data, error } = await supabase.from('payments').insert([{
        usuario_id: user.id,
        event: currentEventId,
        funcion: funcionId,
        seats: seatsPayload,
        status: 'pagado',
        payments: [{ method: selectedPaymentMethod, amount: total }],
        referrer: refParam || null,
        discountCode: discountCode || null,
        created_at: new Date().toISOString()
      }]).select().single();
  
      if (error) throw error;

      await Promise.all(
        carrito.map(item => updateSeat(item._id, { status: 'pagado' }))
      );

      navigate('/payment-success', { state: { locator: data.locator || data.id, emailSent: true } });
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
        {funcionDetails && (
          <div className="mb-2 font-medium">
            {new Date(funcionDetails.fechaCelebracion).toLocaleString()}
          </div>
        )}
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
