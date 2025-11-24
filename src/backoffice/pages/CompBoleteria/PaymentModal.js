import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Input, Button, Radio, DatePicker, Select, Table, message, Alert } from 'antd';
import { AiOutlineDelete } from 'react-icons/ai';
import { Typography } from 'antd';
import { createPayment, updatePayment } from '../../services/apibackoffice';
import { createPaymentTransaction } from '../../../store/services/paymentGatewaysService';
import seatLocatorService from '../../../store/services/seatLocatorService';
import determineSeatLockStatus from '../../../services/ticketing/seatStatus';
import { generateSimpleLocator } from '../../../utils/generateLocator';
import { useAuth } from '../../../contexts/AuthContext';
import { isUuid } from '../../../utils/isUuid';
import { buildRelativeApiUrl } from '../../../utils/apiConfig';
import downloadTicket from '../../../utils/downloadTicket';
import { supabase } from '../../../supabaseClient';
import { createCasheaOrder } from '../../../services/casheaService';

const { TabPane } = Tabs;
const { Option } = Select;

const { Text } = Typography;

const CASHEA_STEPS = [
  { label: 'Importe', status: 'active' },
  { label: 'Scan QR', status: 'upcoming' },
  { label: 'Seguridad', status: 'upcoming' },
  { label: 'ID Factura', status: 'upcoming' },
  { label: 'Confirmar', status: 'upcoming' }
];

const CheckIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CasheaStepIndicator = ({ label, status }) => {
  const isActive = status === 'active';

  const circleClasses = [
    'flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors duration-200',
    isActive ? 'bg-black border-black text-white' : 'bg-[#9E9E9E] border-[#9E9E9E] text-gray-400'
  ].join(' ');

  const labelClasses = [
    'text-sm font-bold transition-colors duration-200',
    isActive ? 'text-black' : 'text-gray-400'
  ].join(' ');

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={circleClasses}>
          <CheckIcon className="w-4 h-4" />
        </div>
        <div className="text-center">
          <span className={labelClasses}>{label}</span>
        </div>
      </div>
    </div>
  );
};

const CasheaStepper = () => (
  <div className="flex items-center justify-center">
    {CASHEA_STEPS.map((step, index) => (
      <React.Fragment key={step.label}>
        <CasheaStepIndicator {...step} />
        {index < CASHEA_STEPS.length - 1 && (
          <div className="h-0.5 w-14 mx-1 transition-colors duration-200 bg-[#BCB8BC]" />
        )}
      </React.Fragment>
    ))}
  </div>
);

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '$0.00';
  }
  return `$${numericValue.toFixed(2)}`;
};

const CasheaOrderPanel = ({
  selectedEvent,
  selectedFuncion,
  amount,
  onAmountChange,
  onCreateOrder,
  disabled,
  isProcessing,
  total,
  order,
  error,
  seats = []
}) => {
  const sanitizedAmount = amount ?? '';
  const eventName = selectedEvent?.nombre || 'Boletería';
  const salaName =
    selectedFuncion?.sala?.nombre ||
    selectedFuncion?.sala?.name ||
    selectedFuncion?.sala?.displayName ||
    'Caja 1';
  const functionName = selectedFuncion?.nombre || selectedFuncion?.titulo;
  const normalizedSeats = Array.isArray(seats) ? seats : [];
  const seatCount = normalizedSeats.length;

  const handleAmountChange = (value) => {
    const rawValue = typeof value === 'string' ? value : '';
    const normalized = rawValue.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    onAmountChange(normalized);
  };

  const orderDetails = [
    { label: 'Evento', value: eventName },
    functionName ? { label: 'Función', value: functionName } : null,
    { label: 'Asientos seleccionados', value: seatCount.toString() },
    { label: 'Total estimado', value: formatCurrency(total) }
  ].filter(Boolean);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {eventName} | {salaName}
            </h1>
            <div className="flex gap-4">
              <button
                type="button"
                className="text-gray-700 text-sm font-semibold cursor-pointer underline hover:text-gray-900"
              >
                Crear orden sin conexión
              </button>
            </div>
          </div>

          <div className="mb-4 flex justify-start">
            <CasheaStepper />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 rounded-2xl border border-gray-300 bg-[#FAFAFA] p-8 shadow">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-base font-bold text-gray-900">Monto total de orden</h2>
                <p className="text-xs font-bold text-gray-600">Es el total a facturar</p>
              </div>
              <div className="space-y-6">
                <div className="relative h-12 w-full rounded-lg border-2 border-gray-300 transition-all duration-200 focus-within:border-gray-400 focus-within:bg-white hover:border-gray-400 hover:bg-white">
                  <input
                    className="h-full w-full rounded-lg bg-transparent px-4 text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                    maxLength={100}
                    placeholder="USD 0.00"
                    type="text"
                    inputMode="decimal"
                    value={sanitizedAmount}
                    onChange={(event) => handleAmountChange(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 lg:w-72">
              <div className="flex-1 rounded-2xl bg-[#F2F2F2] p-4">
                <h3 className="text-base font-bold text-gray-900">Detalle</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  {orderDetails.map((detail) => (
                    <div key={detail.label} className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {detail.label}
                      </span>
                      <span className="font-semibold text-gray-800">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  className={`cashea-order-button inline-flex h-12 w-full items-center justify-center rounded-md px-12 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                    disabled || isProcessing
                      ? 'cursor-not-allowed bg-[#DCDCDC] text-gray-500'
                      : 'bg-black text-white hover:bg-black/80'
                  }`}
                  type="button"
                  onClick={onCreateOrder}
                  disabled={disabled || isProcessing}
                >
                  {isProcessing ? 'Procesando…' : 'Crear orden'}
                </button>
              </div>
            </div>
          </div>
          {(order || error) && (
            <div className="mt-4 space-y-3">
              {error && (
                <Alert
                  type="error"
                  showIcon
                  message="No se pudo crear la orden Cashea"
                  description={error}
                />
              )}
              {order && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Orden Cashea generada</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    {order.invoiceId && (
                      <div>
                        <span className="font-semibold">ID Factura:</span> {order.invoiceId}
                      </div>
                    )}
                    {order.orderId && (
                      <div>
                        <span className="font-semibold">Orden:</span> {order.orderId}
                      </div>
                    )}
                    {order.securityCode && (
                      <div>
                        <span className="font-semibold">Código de seguridad:</span> {order.securityCode}
                      </div>
                    )}
                    {order.status && (
                      <div>
                        <span className="font-semibold">Estado:</span> {order.status}
                      </div>
                    )}
                  </div>
                  {order.checkoutUrl && (
                    <div className="mt-3">
                      <a
                        href={order.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
                      >
                        Abrir flujo Cashea
                      </a>
                    </div>
                  )}
                  {order.qrImage && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={order.qrImage}
                        alt="QR de Cashea"
                        className="h-32 w-32 rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const resolveTenantId = ({ user, selectedEvent, selectedFuncion, seats = [], carrito = [] }) => {
  const candidateValues = [
    user?.tenant_id,
    user?.user_metadata?.tenant_id,
    selectedEvent?.tenant_id,
    selectedEvent?.tenantId,
    selectedFuncion?.tenant_id,
    selectedFuncion?.tenantId,
    selectedFuncion?.sala?.tenant_id,
    selectedFuncion?.sala?.tenantId,
    selectedFuncion?.mapa?.tenant_id,
    selectedFuncion?.mapa?.tenantId,
    selectedFuncion?.plantilla?.tenant_id,
    selectedFuncion?.plantilla?.tenantId,
    selectedFuncion?.plantilla?.mapa?.tenant_id,
    selectedFuncion?.plantilla?.mapa?.tenantId,
  ];

  for (const value of candidateValues) {
    if (value) {
      return value;
    }
  }

  const seatSources = [...seats, ...carrito];
  for (const seat of seatSources) {
    if (!seat) continue;
    if (seat.tenant_id) return seat.tenant_id;
    if (seat.tenantId) return seat.tenantId;
    if (seat.mapa?.tenant_id) return seat.mapa.tenant_id;
    if (seat.mapa?.tenantId) return seat.mapa.tenantId;
  }

  return null;
};

const PaymentModal = ({ open, onCancel, carrito = [], selectedClient, selectedFuncion, selectedAffiliate, selectedEvent }) => {
  // Ensure carrito is always an array
  const safeCarrito = Array.isArray(carrito) ? carrito : [];
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('1');
  const [reservationType, setReservationType] = useState('1');
  const [paymentEntries, setPaymentEntries] = useState([]);
  const [entregado, setEntregado] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Zelle');

  useEffect(() => {
    const storedMethod = localStorage.getItem('lastPaymentMethod');
    if (storedMethod) {
      setSelectedPaymentMethod(storedMethod);
    }
  }, []);

  useEffect(() => {
    if (selectedPaymentMethod) {
      localStorage.setItem('lastPaymentMethod', selectedPaymentMethod);
    }
  }, [selectedPaymentMethod]);
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [scCounter, setScCounter] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Add these new state variables
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [locator, setLocator] = useState('');
  const [emailToSend, setEmailToSend] = useState('');
  const [seatLockSessionId, setSeatLockSessionId] = useState(null);
  const [casheaOrder, setCasheaOrder] = useState(null);
  const [casheaError, setCasheaError] = useState(null);
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email?.trim());

  const parsePaymentsFromTransaction = (paymentsData) => {
    if (!paymentsData) return [];

    let parsedPayments = paymentsData;

    if (!Array.isArray(parsedPayments)) {
      try {
        parsedPayments = typeof paymentsData === 'string' ? JSON.parse(paymentsData) : [];
      } catch (error) {
        console.warn('No se pudieron parsear los pagos existentes:', error);
        parsedPayments = [];
      }
    }

    if (!Array.isArray(parsedPayments)) return [];

    return parsedPayments.map((payment, index) => {
      const normalizedAmount = Number(payment.amount ?? payment.importe ?? 0);
      return {
        sc: index + 1,
        formaPago:
          payment.method ||
          payment.payment_method ||
          payment.paymentMethod ||
          payment.gateway_name ||
          payment.gatewayName ||
          'Desconocido',
        importe: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
        metadata: payment.metadata || null,
      };
    });
  };

  useEffect(() => {
    if (selectedPaymentMethod !== 'Cashea') {
      setCasheaOrder(null);
      setCasheaError(null);
    }
  }, [selectedPaymentMethod]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedSessionId = localStorage.getItem('anonSessionId');

    if (user?.id) {
      if (storedSessionId !== user.id) {
        localStorage.setItem('anonSessionId', user.id);
      }
      setSeatLockSessionId(user.id);
    } else if (storedSessionId) {
      setSeatLockSessionId(storedSessionId);
    }
  }, [user?.id]);

  const existingPaymentId = safeCarrito?.[0]?.paymentId;
  const existingLocator = safeCarrito?.[0]?.locator;

  useEffect(() => {
    const emailCandidate = selectedClient?.email || selectedClient?.correo || selectedClient?.mail;
    if (emailCandidate) {
      setEmailToSend(emailCandidate);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (!open || !existingLocator) return;

    const fetchExistingPayments = async () => {
      try {
        const transactionResponse = await seatLocatorService.getTransactionWithSeats(existingLocator);
        const transaction = transactionResponse?.transaction || transactionResponse;

        if (transaction?.locator) {
          setLocator(transaction.locator);
        } else {
          setLocator((prev) => prev || existingLocator);
        }

        const parsedPayments = parsePaymentsFromTransaction(transaction?.payments || transaction?.payment_methods);

        if (parsedPayments.length > 0) {
          setPaymentEntries(parsedPayments);
          setScCounter(parsedPayments.length + 1);
        }
      } catch (error) {
        console.error('Error cargando métodos de pago existentes:', error);
      }
    };

    fetchExistingPayments();
  }, [open, existingLocator]);

  // Función para asignar tags del evento al comprador
  const assignEventTagsToUser = async (userId, eventTags) => {
    if (!eventTags || eventTags.length === 0) return;
    
    try {
      // Obtener el perfil actual del usuario
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('tags')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === '42703') {
          console.warn('Tags column missing in profiles table, skipping tag assignment');
          return;
        }
        if (fetchError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', fetchError);
          return;
        }
      }

      // Combinar tags existentes con los nuevos tags del evento
      const existingTags = currentProfile?.tags || [];
      const newTags = Array.isArray(eventTags) ? eventTags : [eventTags];
      
      // Filtrar tags duplicados
      const uniqueTags = [...new Set([...existingTags, ...newTags])];

      // Actualizar el perfil del usuario con los nuevos tags
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          tags: uniqueTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        if (updateError.code === '42703') {
          console.warn('Tags column missing in profiles table, skipping tag update');
        } else {
          console.error('Error updating user tags:', updateError);
        }
      } else {
        console.log(`Tags del evento asignados al usuario ${userId}:`, newTags);
      }
    } catch (error) {
      console.error('Error assigning event tags to user:', error);
    }
  };

  const handleEmailTicket = async () => {
    const trimmedEmail = emailToSend?.trim();
    if (!locator || !trimmedEmail) return;

    if (!isValidEmail(trimmedEmail)) {
      message.error('Ingresa un correo electrónico válido');
      return;
    }
    try {
      const emailUrl = buildRelativeApiUrl(`payments/${locator}/email`);
      const res = await fetch(emailUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, downloadOnly: true })
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Correo enviado');
        setShowConfirmation(false);
        setEmailToSend('');
      } else {
        const errorMessage = data?.error?.message || data?.message || 'Error al enviar correo';
        message.error(errorMessage);
      }
    } catch (err) {
      console.error('Send email error:', err);
      message.error('Error al enviar correo');
    }
  };

  const handleDownloadTicket = async () => {
    try {
      await downloadTicket(locator);
    } catch (err) {
      message.error('Error al descargar ticket');
    }
  };

  // Add the date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const subtotal = safeCarrito.reduce((sum, item) => sum + (item.precio || 0), 0);
  const commission = selectedAffiliate ? (selectedAffiliate.base || 0) + subtotal * ((selectedAffiliate.percentage || 0) / 100) : 0;
  const total = subtotal - commission;
  const totalPagado = paymentEntries.reduce((sum, entry) => sum + entry.importe, 0);

  useEffect(() => {
    if (selectedPaymentMethod === 'Cashea') {
      const formattedTotal = Number(total || 0).toFixed(2);
      const numericAmount = Number(paymentAmount);
      if (!paymentAmount || Number.isNaN(numericAmount) || numericAmount === 0) {
        setPaymentAmount(formattedTotal);
      }
    }
  }, [selectedPaymentMethod, total, paymentAmount]);

  const isCasheaAmountValid = selectedPaymentMethod !== 'Cashea'
    || (!!paymentAmount && !Number.isNaN(Number(paymentAmount)) && Number(paymentAmount) > 0);
  const diferencia = total - totalPagado;
  const isFullyPaid = diferencia <= 0;

  const handleCashInput = (value) => {
    setEntregado(value);
    if (value && !isNaN(value)) {
      const newEntry = {
        sc: scCounter,
        formaPago: 'Efectivo',
        importe: parseFloat(value)
      };
      setPaymentEntries([{ ...newEntry }]);
      setScCounter(scCounter + 1);
    } else {
      setPaymentEntries([]);
    }
  };

  const handleCashAll = () => {
    setEntregado(total.toString());
    handleCashInput(total.toString());
  };

  const handleCreateCasheaOrder = async () => {
    if (!selectedClient) {
      message.error('Debe seleccionar un cliente antes de crear la orden Cashea');
      return;
    }

    const resolvedTenantId = resolveTenantId({
      user,
      selectedEvent,
      selectedFuncion,
      seats: safeCarrito,
      carrito: safeCarrito,
    });

    if (!resolvedTenantId) {
      message.error('No se pudo determinar el tenant para Cashea');
      return;
    }

    const sanitizedAmountString = typeof paymentAmount === 'string'
      ? paymentAmount.replace(/,/g, '.').trim()
      : String(paymentAmount || '');
    const parsedAmount = Number(sanitizedAmountString || total || 0);

    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      message.error('Monto inválido para crear la orden Cashea');
      return;
    }

    setIsProcessing(true);
    setCasheaError(null);

    try {
      const invoiceId = existingLocator ? `INV-${existingLocator}` : `INV-${generateSimpleLocator()}`;
      const orderReference = generateSimpleLocator();
      const currency = selectedFuncion?.moneda || selectedFuncion?.currency || 'USD';

      const response = await createCasheaOrder({
        tenantId: resolvedTenantId,
        amount: parsedAmount,
        currency,
        description: selectedEvent?.nombre
          ? `Pago boletería - ${selectedEvent.nombre}`
          : 'Pago boletería',
        customer: {
          name:
            `${selectedClient?.nombre || selectedClient?.name || ''} ${selectedClient?.apellido || selectedClient?.lastName || ''}`.trim() ||
            selectedClient?.fullName ||
            undefined,
          email: selectedClient?.email || selectedClient?.correo || selectedClient?.mail || undefined,
          document: selectedClient?.documento || selectedClient?.document || selectedClient?.dni || undefined,
          phone: selectedClient?.telefono || selectedClient?.phone || selectedClient?.celular || undefined,
        },
        items: safeCarrito,
        metadata: {
          invoiceId,
          orderId: orderReference,
          locator: existingLocator || null,
        },
      });

      const metadata = {
        gateway: 'cashea',
        orderId: response.orderId,
        invoiceId: response.invoiceId,
        securityCode: response.securityCode,
        checkoutUrl: response.checkoutUrl,
        qrImage: response.qrImage,
        status: response.status || 'pending',
        raw: response.raw || response,
      };

      setCasheaOrder({ ...response, metadata });
      setPaymentAmount(parsedAmount.toFixed(2));

      setPaymentEntries((prev) => {
        const withoutCashea = prev.filter((entry) => entry.formaPago !== 'Cashea');
        const newEntry = {
          sc: scCounter,
          formaPago: 'Cashea',
          importe: parsedAmount,
          metadata,
        };
        return [...withoutCashea, newEntry];
      });

      setScCounter((prev) => prev + 1);
      message.success('Orden Cashea creada correctamente');
    } catch (error) {
      console.error('Error creando orden Cashea:', error);
      const errorMessage = error?.message || 'No se pudo crear la orden Cashea';
      setCasheaError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = () => {
    if (paymentAmount && paymentAmount !== '0.00') {
      const newEntry = {
        sc: scCounter,
        formaPago: selectedPaymentMethod,
        importe: parseFloat(paymentAmount)
      };
      setPaymentEntries((prev) => [...prev, newEntry]);
      setScCounter((prev) => prev + 1);
      setPaymentAmount('0.00');
    }
  };

  const handleDeleteEntry = (sc) => {
    // Remove the entry
    const removedEntry = paymentEntries.find(entry => entry.sc === sc);
    const updatedEntries = paymentEntries.filter(entry => entry.sc !== sc);

    if (removedEntry?.formaPago === 'Cashea') {
      setCasheaOrder(null);
      setCasheaError(null);
    }

    // Reorder SC numbers
    const reorderedEntries = updatedEntries.map((entry, index) => ({
      ...entry,
      sc: index + 1
    }));

    setPaymentEntries(reorderedEntries);
    setScCounter(reorderedEntries.length + 1);
  };

  const columns = [
    { title: 'SC', dataIndex: 'sc', key: 'sc' },
    { title: 'Forma de pago', dataIndex: 'formaPago', key: 'formaPago' },
    { 
      title: 'Importe', 
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          ${record.importe.toFixed(2)}
          <Button 
            type="text" 
            danger 
            icon={<AiOutlineDelete />} 
            onClick={() => handleDeleteEntry(record.sc)}
          />
        </div>
      )
    }
  ];

  const getPaymentStatus = () => {
    if (paymentEntries.some(entry => entry.metadata?.gateway === 'cashea')) {
      return {
        text: 'Pago pendiente de aprobación Cashea',
        color: '#faad14'
      };
    }
    if (diferencia > 0) {
      return {
        text: `Pendiente: $${diferencia.toFixed(2)}`,
        color: '#ff4d4f'
      };
    } else if (diferencia < 0) {
      return {
        text: `Pago en exceso: $${Math.abs(diferencia).toFixed(2)}`,
        color: '#faad14'
      };
    }
    return {
      text: 'Pago completo',
      color: '#52c41a'
    };
  };

  const paymentStatus = getPaymentStatus();
  const effectiveLocator = locator || existingLocator || '';
  const showContinueButton = isFullyPaid && paymentEntries.length > 0;

  // Generate simple locator of 8 characters (numbers and letters)
  const generateLocator = () => {
    return generateSimpleLocator();
  };

  const handlePaymentOrReservation = async () => {
    if (!selectedClient) {
      message.error('Debe seleccionar un cliente');
      return;
    }

    if (paymentEntries.length === 0) {
      message.error('Debe agregar al menos un método de pago');
      return;
    }

    if (diferencia > 0) {
      message.error(`Falta pagar $${diferencia.toFixed(2)}`);
      return;
    }

    // Validar que todos los asientos tengan IDs válidos
    const invalidSeats = safeCarrito.filter(item => !(item.id || item._id || item.sillaId));
    if (invalidSeats.length > 0) {
      message.error('Algunos asientos no tienen IDs válidos. Por favor, recarga la página.');
      return;
    }

    // Verificar que no haya asientos duplicados
    const seatIds = safeCarrito.map(item => item.id || item._id || item.sillaId);
    const uniqueSeatIds = [...new Set(seatIds)];
    if (seatIds.length !== uniqueSeatIds.length) {
      message.error('Hay asientos duplicados en el carrito. Por favor, verifica.');
      return;
    }

    setIsProcessing(true);

    try {
      // Agrupar asientos por evento
      const seatsByEvent = safeCarrito.reduce((acc, item) => {
        const eventId = item.eventId || selectedEvent?.id;
        if (!acc[eventId]) {
          acc[eventId] = [];
        }
        acc[eventId].push(item);
        return acc;
      }, {});

      const hasCasheaPaymentOverall = paymentEntries.some(entry => entry.metadata?.gateway === 'cashea');

      // Create a payment for each event
      const paymentPromises = Object.entries(seatsByEvent).map(async ([eventId, seats]) => {
        // Verificar si ya existe un pago para estos asientos
        const existingPayment = seats.find(seat => seat.paymentId && seat.locator);

        const resolvedTenantId = resolveTenantId({
          user,
          selectedEvent,
          selectedFuncion,
          seats,
          carrito: safeCarrito,
        });

        if (!resolvedTenantId) {
          console.warn('⚠️ No se pudo determinar tenant_id para la transacción de pago', {
            eventId,
            funcionId: selectedFuncion?.id || selectedFuncion?._id || null,
          });
        }

        const primaryMethod = (paymentEntries[0]?.formaPago || selectedPaymentMethod || 'manual');
        const hasCasheaPayment = hasCasheaPaymentOverall;
        const paymentStatus = hasCasheaPayment
          ? 'pending'
          : diferencia > 0
            ? 'reserved'
            : 'completed';
        const normalizedPayments = paymentEntries.map(entry => ({
          method: entry.formaPago,
          amount: Number(entry.importe) || 0,
          metadata: entry.metadata || null,
          reference: entry.metadata?.orderId || entry.metadata?.invoiceId || null,
          status: entry.metadata?.status || (hasCasheaPayment ? 'pending' : 'completed'),
        }));
        const paymentData = {
          user_id: selectedClient.id || selectedClient._id, // Usar user_id según el esquema
          evento_id: eventId,
          funcion_id: selectedFuncion.id || selectedFuncion._id,
          processed_by: isUuid(user?.id) ? user.id : null,
          seats: seats.map(item => ({
            id: item.id || item._id || item.sillaId,
            name: item.nombre,
            price: item.precio,
            zona: item.zonaId || (item.zona?._id || null),
            mesa: item.mesa?._id || null,
            ...(item.abonoGroup ? { abonoGroup: item.abonoGroup } : {})
          })),
          // Usar localizador existente si ya hay uno, sino generar uno nuevo
          locator: existingPayment ? existingPayment.locator : generateLocator(),
          // Estandarizar estado: 'completed' cuando está totalmente pagado, 'reserved' en caso contrario
          status: paymentStatus,
          payments: normalizedPayments,
          // Asegurar columnas de monto/amount para la inserción
          amount: paymentEntries.length > 0
            ? paymentEntries.reduce((s, e) => s + (Number(e.importe) || 0), 0)
            : seats.reduce((s, i) => s + (Number(i.precio) || 0), 0),
          monto: paymentEntries.length > 0
            ? paymentEntries.reduce((s, e) => s + (Number(e.importe) || 0), 0)
            : seats.reduce((s, i) => s + (Number(i.precio) || 0), 0),
          // Campos faltantes para compatibilidad y tracking
          order_id: existingPayment ? existingPayment.locator : undefined, // lo normalizamos en service a locator
          payment_method: hasCasheaPayment ? 'Cashea' : primaryMethod,
          tenant_id: resolvedTenantId || undefined,
          gateway_name: hasCasheaPayment ? 'Cashea' : 'manual',
          // columnas legacy de compatibilidad
          event: eventId,
          funcion: selectedFuncion.id || selectedFuncion._id,
          user: (selectedClient.id || selectedClient._id) || null,
          fecha: new Date().toISOString(),
          ...(selectedAffiliate ? { referrer: selectedAffiliate.user.login } : {})
        };

        console.log('Payment data:', paymentData);

        // Actualizar seat_locks con el locator final y estado correcto antes de crear el pago
        if (paymentData.locator) {
          try {
            const normalizedMethodId = hasCasheaPayment
              ? 'cashea'
              : (selectedPaymentMethod || '')
                  .toString()
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, '_');

            const isReservationFlow = hasCasheaPayment || reservationType === '2' || reservationType === '3' || diferencia > 0;
            const seatStatus = determineSeatLockStatus({
              methodId: normalizedMethodId || 'boleteria_manual',
              transactionStatus: paymentData.status,
              isReservation: isReservationFlow,
              manualStatus: hasCasheaPayment || isReservationFlow ? 'reservado' : 'pagado',
            });

            await seatLocatorService.finalizeSeatsAfterPayment({
              seats,
              locator: paymentData.locator,
              userId: paymentData.user_id || null,
              tenantId: resolvedTenantId || null,
              funcionId: paymentData.funcion_id,
              status: seatStatus,
              sessionId: seatLockSessionId,
            });
          } catch (e) {
            console.error('Error actualizando seat_locks:', e);
          }
        }

          // Si ya existe un pago, verificar que no esté completamente pagado antes de actualizar
          if (existingPayment) {
            // Verificar el estado del pago existente
            try {
              const { data: existingPaymentData, error: fetchError } = await supabase
                .from('payment_transactions')
                .select('id, status, amount, locator')
                .eq('id', existingPayment.paymentId)
                .single();

              if (fetchError) {
                console.error('Error obteniendo pago existente:', fetchError);
                throw new Error('Error al verificar el estado del pago existente');
              }

              // Verificar si el pago ya está completado
              if (existingPaymentData && existingPaymentData.status === 'completed') {
                message.error(`Este ticket ya está completamente pagado (Localizador: ${existingPaymentData.locator || existingPayment.locator}). No se puede procesar otro pago.`);
                throw new Error(`El ticket ya está pagado (Localizador: ${existingPaymentData.locator || existingPayment.locator})`);
              }

              // Si el pago existe pero no está completado, actualizarlo
              console.log('Updating existing payment:', existingPayment.paymentId);
              return updatePayment(existingPayment.paymentId, paymentData);
            } catch (error) {
              console.error('Error validando pago existente:', error);
              throw error;
            }
          } else {
            console.log('Creating new payment');
            
            // Add reservation deadline if applicable (solo para pagos nuevos)
            if (reservationType === '2') {
              paymentData.reservationDeadline = new Date(Date.now() + 16 * 60000);
            } else if (reservationType === '3' && selectedDate) {
              paymentData.reservationDeadline = selectedDate.toDate();
            }
            
            return createPayment(paymentData);
          }
        });

        const results = await Promise.all(paymentPromises);
        const tenantIdForTransactions = resolveTenantId({
          user,
          selectedEvent,
          selectedFuncion,
          seats: safeCarrito,
          carrito: safeCarrito,
        });

        if (!tenantIdForTransactions) {
          console.warn('⚠️ No se pudo determinar tenant_id para las transacciones manuales', {
            eventId: selectedEvent?.id || null,
            funcionId: selectedFuncion?.id || selectedFuncion?._id || null,
          });
        }
        if (results && results.length > 0 && results[0]) {
          setLocator(results[0].locator);
          const locator = results[0].locator;
          const userId = selectedClient?.id || selectedClient?._id;

          // Crear payment_transaction para cada método de pago usado
          try {
            const paymentTransactionPromises = paymentEntries.map(async (entry) => {
              const entryIsCashea = entry.metadata?.gateway === 'cashea' || entry.formaPago === 'Cashea';
              const entryStatus = entry.metadata?.status || (entryIsCashea ? 'pending' : 'completed');
              const transactionData = {
                orderId: locator,
                gatewayId: null, // Para pagos manuales no hay gateway
                amount: Number(entry.importe) || 0,
                currency: entry.metadata?.currency || selectedFuncion?.moneda || selectedFuncion?.currency || 'USD',
                status: entryStatus,
                gatewayTransactionId: entry.metadata?.orderId || entry.metadata?.transactionId || null,
                gatewayResponse: entry.metadata?.raw || entry.metadata || null,
                locator: locator,
                tenantId: tenantIdForTransactions || null,
                userId: userId,
                eventoId: selectedEvent?.id,
                funcionId: selectedFuncion?.id || selectedFuncion?._id,
                paymentMethod: entry.formaPago,
                gatewayName: entryIsCashea ? 'Cashea' : 'manual',
                metadata: entry.metadata || null,
                payments: [
                  {
                    method: entry.formaPago,
                    amount: Number(entry.importe) || 0,
                    metadata: entry.metadata || null,
                    reference: entry.metadata?.orderId || entry.metadata?.invoiceId || null,
                    status: entryStatus,
                  },
                ],
              };

              return await createPaymentTransaction(transactionData);
            });
            
            const transactions = await Promise.all(paymentTransactionPromises);
            console.log('✅ Payment transactions created successfully');
            
            // Determinar el status final del pago (completed si todos están completados, sino reservado/pending)
            const finalStatus = hasCasheaPaymentOverall || diferencia > 0 || paymentStatus === 'reserved'
              ? 'reservado'
              : 'completed';
            
            // Enviar correo automáticamente según el status
            if (locator && userId) {
              try {
                // Importar dinámicamente para evitar problemas de ciclo
                const { sendPaymentEmailByStatus } = await import('../../../store/services/paymentEmailService');
                
                const emailResult = await sendPaymentEmailByStatus({
                  locator,
                  user_id: userId,
                  status: finalStatus,
                  transactionId: transactions[0]?.id,
                  amount: total,
                });
                
                if (emailResult.success) {
                  console.log('✅ [PAYMENT_MODAL] Correo enviado exitosamente');
                } else {
                  console.warn('⚠️ [PAYMENT_MODAL] Error enviando correo:', emailResult.error);
                }
              } catch (emailError) {
                console.error('❌ [PAYMENT_MODAL] Error enviando correo:', emailError);
                // No bloquear el flujo si falla el envío de correo
              }
            }
          } catch (transactionError) {
            console.error('❌ Error creating payment transactions:', transactionError);
            // No fallar el pago por esto, solo loggear el error
          }
        }

        // Asignar tags del evento al comprador si el pago fue exitoso
        if (selectedEvent?.tags && selectedClient?.id) {
          await assignEventTagsToUser(selectedClient.id, selectedEvent.tags);
        }

        if (!hasCasheaPaymentOverall) {
          setShowConfirmation(true);
        }
        const successMessage = hasCasheaPaymentOverall
          ? 'Orden registrada con Cashea. Pendiente de confirmación.'
          : 'Pago procesado exitosamente';
        message.success(successMessage);
        onCancel();
    } catch (error) {
      console.error('Payment error:', error);
      
      // Mensajes de error más amigables
      let errorMessage = 'Error al procesar el pago';
      
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        errorMessage = '❌ Error: Uno o más asientos ya están vendidos. Por favor, selecciona otros asientos.';
      } else if (error.message?.includes('ya está vendido')) {
        errorMessage = `❌ ${error.message}`;
      } else if (error.message?.includes('ya está reservado')) {
        errorMessage = `❌ ${error.message}`;
      } else if (error.message?.includes('Asiento sin ID válido')) {
        errorMessage = '❌ Error: Algunos asientos no tienen IDs válidos. Por favor, verifica.';
      } else if (error.message?.includes('invalid input syntax for type json')) {
        errorMessage = '❌ Error: Los datos de los asientos no tienen el formato correcto. Por favor, verifica.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Modal
        title="Detalles de Pago"
        open={open}
        onCancel={onCancel}
        width={800}
        footer={
          <div>
            {/* Información de la taquilla */}
            {user && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                background: '#e6f7ff', 
                borderRadius: '4px',
                border: '1px solid #91d5ff'
              }}>
                <Text strong style={{ color: '#1890ff' }}>
                  🎫 Taquilla: {user.email || user.user_metadata?.email || 'Usuario actual'}
                </Text>
              </div>
            )}
            
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              background: '#f5f5f5', 
              borderRadius: '4px' 
            }}>
              {selectedAffiliate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <Text strong>{`Com.Ref ${selectedAffiliate.user.login}:`}</Text>
                  <Input style={{ width: '200px' }} value={`-$${commission.toFixed(2)}`} disabled />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <Text strong>Total a pagar:</Text>
                <Input
                  style={{ width: '200px' }}
                  value={`$${total.toFixed(2)}`}
                  disabled
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Estado:</Text>
                <Text style={{ color: paymentStatus.color, fontSize: '16px' }}>
                  {paymentStatus.text}
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={onCancel}>Cancelar</Button>
              {showContinueButton ? (
                <Button
                  type="default"
                  variant="outlined"
                  block
                  onClick={() => setShowConfirmation(true)}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="default"
                  variant="outlined"
                  block
                  onClick={handlePaymentOrReservation}
                  loading={isProcessing}
                  disabled={!selectedClient || (diferencia === 0 && paymentEntries.length === 0)}  // Updated condition
                >
                  {diferencia > 0 ? 'Reservar' : 'Pagar'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Efectivo" key="1">
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Input 
                      placeholder="Entregado"
                      value={entregado}
                      onChange={(e) => handleCashInput(e.target.value)}
                      style={{ width: '200px' }}
                    />
                    <Button onClick={handleCashAll}>Todo</Button>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h4>Fecha límite de reserva</h4>
                    <Radio.Group 
                      onChange={(e) => setReservationType(e.target.value)}
                      value={reservationType}
                    >
                      <Radio value="1">Sin fecha límite</Radio>
                      <Radio value="2">Reserva temporal</Radio>
                      <Radio value="3">Selecciona una fecha específica</Radio>
                    </Radio.Group>

                    {reservationType === '3' && (
                      <DatePicker 
                        showTime
                        style={{ marginTop: '10px', width: '100%' }}
                        onChange={handleDateChange}
                        value={selectedDate}
                      />
                    )}
                  </div>
                </div>
              </TabPane>

              <TabPane tab="Otros" key="2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <label>Forma de pago</label>
                      <Select
                        value={selectedPaymentMethod}
                        onChange={setSelectedPaymentMethod}
                        style={{ width: '180px' }}
                      >
                        <Option value="Efectivo">Efectivo</Option>
                        <Option value="Zelle">Zelle</Option>
                        <Option value="Pago movil">Pago móvil</Option>
                        <Option value="Transferencia">Transferencia bancaria</Option>
                        <Option value="Tarjeta">Tarjeta de crédito/débito</Option>
                        <Option value="PayPal">PayPal</Option>
                        <Option value="Stripe">Stripe</Option>
                        <Option value="Cashea">Cashea</Option>
                        <Option value="Criptomoneda">Criptomoneda</Option>
                        <Option value="Cheque">Cheque</Option>
                        <Option value="Otro">Otro</Option>
                      </Select>
                    </div>
                    {selectedPaymentMethod !== 'Cashea' && (
                      <>
                        <div>
                          <label>Importe</label>
                          <Input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            style={{ width: '150px' }}
                          />
                        </div>
                        <Button onClick={handleConfirmPayment}>Confirmar</Button>
                      </>
                    )}
                  </div>

                  {selectedPaymentMethod === 'Cashea' && (
                    <CasheaOrderPanel
                      selectedEvent={selectedEvent}
                      selectedFuncion={selectedFuncion}
                      amount={paymentAmount}
                      onAmountChange={setPaymentAmount}
                      onCreateOrder={handleCreateCasheaOrder}
                      disabled={!isCasheaAmountValid}
                      isProcessing={isProcessing}
                      total={total}
                      order={casheaOrder}
                      error={casheaError}
                      seats={safeCarrito}
                    />
              )}
                </div>
              </TabPane>
            </Tabs>
          </div>

          <div style={{ flex: 1 }}>
            <Table
              dataSource={paymentEntries}
              columns={columns}
              pagination={false}
              size="small"
            />
          </div>
        </div>
      </Modal>
      <Modal
        title="Confirmación"
        open={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        footer={[
          <Button key="close" onClick={() => setShowConfirmation(false)}>
            Cerrar
          </Button>,
          ...(isFullyPaid
            ? [
                <Button
                  key="email"
                  type="default"
                  variant="outlined"
                  block
                  onClick={handleEmailTicket}
                  disabled={!emailToSend || !isValidEmail(emailToSend)}
                >
                  Enviar por correo
                </Button>,
                <Button
                  key="download"
                  type="default"
                  variant="outlined"
                  block
                  onClick={handleDownloadTicket}
                  disabled={!locator}
                >
                  Descargar Ticket
                </Button>
              ]
            : [])
        ]}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2>Localizador: {locator}</h2>
          <Input
            placeholder="Correo electrónico"
            value={emailToSend}
            onChange={(e) => setEmailToSend(e.target.value)}
            style={{ marginTop: '20px' }}
          />
        </div>
      </Modal>
    </>
  );
};

export default PaymentModal;