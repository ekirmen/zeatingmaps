import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Input, Button, Radio, DatePicker, Select, Table, message } from 'antd';
import { AiOutlineDelete } from 'react-icons/ai';
import { Typography } from 'antd';
import { createPayment, updatePayment } from '../../services/apibackoffice';
import generateRandomLocator from '../../../utils/generateLocator';
import { useAuth } from '../../../contexts/AuthContext';
import { isUuid } from '../../../utils/isUuid';

const { TabPane } = Tabs;
const { Option } = Select;

const { Text } = Typography;

const PaymentModal = ({ open, onCancel, carrito, selectedClient, selectedFuncion, selectedAffiliate }) => {
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

  const existingPaymentId = carrito?.[0]?.paymentId;
  const existingLocator = carrito?.[0]?.locator;

  const handleEmailTicket = async () => {
    if (!locator || !emailToSend) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/${locator}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend })
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Correo enviado');
        setShowConfirmation(false);
        setEmailToSend('');
      } else {
        message.error(data.message || 'Error al enviar correo');
      }
    } catch (err) {
      console.error('Send email error:', err);
      message.error('Error al enviar correo');
    }
  };

  const handleDownloadTicket = () => {
    if (locator) {
      window.open(`${process.env.REACT_APP_API_URL}/api/payments/${locator}/download`, '_blank');
    }
  };

  // Add the date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const subtotal = carrito.reduce((sum, item) => sum + (item.precio || 0), 0);
  const commission = selectedAffiliate ? (selectedAffiliate.base || 0) + subtotal * ((selectedAffiliate.percentage || 0) / 100) : 0;
  const total = subtotal - commission;
  const totalPagado = paymentEntries.reduce((sum, entry) => sum + entry.importe, 0);
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

  const handleConfirmPayment = () => {
    if (paymentAmount && paymentAmount !== '0.00') {
      const newEntry = {
        sc: scCounter,
        formaPago: selectedPaymentMethod,
        importe: parseFloat(paymentAmount)
      };
      setPaymentEntries([...paymentEntries, newEntry]);
      setScCounter(scCounter + 1);
      setPaymentAmount('0.00');
    }
  };

  const handleDeleteEntry = (sc) => {
    // Remove the entry
    const updatedEntries = paymentEntries.filter(entry => entry.sc !== sc);
    
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

  // Generate a random 7 character locator consisting of letters and numbers
  const generateLocator = () => generateRandomLocator();

  const handlePaymentOrReservation = async () => {
    if (!selectedClient) {
      message.error('Por favor seleccione un cliente');
      return;
    }

    if (!selectedFuncion) {
      message.error('Por favor seleccione una función');
      return;
    }

    setIsProcessing(true);
    try {
      if (existingPaymentId) {
        const newStatus = diferencia > 0 ? 'reservado' : 'pagado';
        const data = await updatePayment(existingPaymentId, {
          status: newStatus,
          payments: paymentEntries.map(entry => ({
            method: entry.formaPago,
            amount: entry.importe
          }))
        });
        setLocator(data.locator || existingLocator);
        setShowConfirmation(true);
        message.success('Pago actualizado');
        onCancel();
      } else {
        // Group seats by event
        const seatsByEvent = carrito.reduce((acc, item) => {
          // Some seats only contain the raw event ID rather than an object.
          // `selectedFuncion.evento` can also be either a UUID value or an
          // object. Normalise these cases to reliably obtain the identifier.
          const eventId =
            item.evento?.id ||
            item.evento?._id ||
            item.evento ||
            selectedFuncion.evento?.id ||
            selectedFuncion.evento?._id ||
            selectedFuncion.evento;

          // Event IDs may be numeric or UUID. Only skip if the value is null or
          // undefined to allow both formats.
          if (eventId === null || eventId === undefined) {
            console.error('Missing event ID for seat:', item);
            return acc;
          }

          if (!acc[eventId]) {
            acc[eventId] = [];
          }
          acc[eventId].push(item);
          return acc;
        }, {});

        // Create a payment for each event
        const paymentPromises = Object.entries(seatsByEvent).map(([eventId, seats]) => {
        const paymentData = {
          user: selectedClient.id || selectedClient._id,
          event: eventId,
          funcion: selectedFuncion.id || selectedFuncion._id,
          processed_by: isUuid(user?.id) ? user.id : null,
          seats: seats.map(item => ({
              id: item.id || item._id,
              name: item.nombre,
              price: item.precio,
              zona: item.zonaId || (item.zona?._id || null),
              mesa: item.mesa?._id || null,
              ...(item.abonoGroup ? { abonoGroup: item.abonoGroup } : {})
            })),
            locator: generateLocator(),
            status: diferencia > 0 ? 'reservado' : 'pagado',
            payments: paymentEntries.map(entry => ({
              method: entry.formaPago,
              amount: entry.importe
            })),
            ...(selectedAffiliate ? { referrer: selectedAffiliate.user.login } : {})
          };

          console.log('Creating payment with data:', paymentData);

          // Add reservation deadline if applicable
          if (reservationType === '2') {
            paymentData.reservationDeadline = new Date(Date.now() + 16 * 60000);
          } else if (reservationType === '3' && selectedDate) {
            paymentData.reservationDeadline = selectedDate.toDate();
          }

          return createPayment(paymentData);
        });

        const results = await Promise.all(paymentPromises);
        if (results && results.length > 0 && results[0]) {
          setLocator(results[0].locator);
        }
        setShowConfirmation(true);
        message.success('Pago procesado exitosamente');
        onCancel();
      }
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Modal
        title="Payment Details"
        open={open}
        onCancel={onCancel}
        width={800}
        footer={
          <div>
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
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                  <div>
                    <label>Forma de pago</label>
                    <Select 
                      value={selectedPaymentMethod}
                      onChange={setSelectedPaymentMethod}
                      style={{ width: '150px' }}
                    >
                      <Option value="Zelle">Zelle</Option>
                      <Option value="Pago movil">Pago móvil</Option>
                    </Select>
                  </div>
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
                  disabled={!emailToSend}
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