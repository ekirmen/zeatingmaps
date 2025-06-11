import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import MetodoPago from '../components/MetodoPago';
import { Modal } from 'antd';
import { toast } from 'react-hot-toast';

const Pay = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  const subtotal = carrito?.reduce((sum, item) => sum + item.precio, 0) || 0;
  const impuestos = subtotal * 0.16;
  const total = subtotal + impuestos;

  useEffect(() => {
    if (!funcionId) return;

    const fetchOptions = async () => {
      try {
        const funcRes = await fetch(`http://localhost:5000/api/funcions/${funcionId}`);
        const funcData = await funcRes.json();
        const eventId = funcData.evento?._id || funcData.evento;

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
    if (eventOptions.observacionesCompra?.mostrar) {
      setIsObservacionesModalVisible(true);
    }
  }, [eventOptions]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Por favor selecciona un método de pago");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          funcionId,
          seats: carrito,
          paymentMethod: selectedPaymentMethod,
          amount: total
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/payment-success/${data.locator}`);
      } else {
        toast.error("Error al procesar el pago");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Error al procesar el pago");
    }
  };

  // ✅ Render condicional después de los hooks
  if (!carrito || !funcionId) {
    return <Navigate to="/store" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>

      {/* Cart Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Resumen del Carrito</h2>
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between py-2 border-b">
            <span>{item.zona} - {item.nombreMesa}</span>
            <span>${item.precio}</span>
          </div>
        ))}
        <div className="mt-4">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
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

      {/* Process Payment Button */}
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
