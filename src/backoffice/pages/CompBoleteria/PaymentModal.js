import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Input, Button, Radio, DatePicker, Select, Table, message } from 'antd';
import { AiOutlineDelete } from 'react-icons/ai';
import { Typography } from 'antd';
import { createPayment, updatePayment } from '../../services/apibackoffice';
import { generateSimpleLocator } from '../../../utils/generateLocator';
import { useAuth } from '../../../contexts/AuthContext';
import { isUuid } from '../../../utils/isUuid';
import API_BASE_URL from '../../../utils/apiBase';
import downloadTicket from '../../../utils/downloadTicket';
import { supabase } from '../../../supabaseClient';

const { TabPane } = Tabs;
const { Option } = Select;

const { Text } = Typography;

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

  const existingPaymentId = safeCarrito?.[0]?.paymentId;
  const existingLocator = safeCarrito?.[0]?.locator;

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
    if (!locator || !emailToSend) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/${locator}/email`, {
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

      // Create a payment for each event
      const paymentPromises = Object.entries(seatsByEvent).map(async ([eventId, seats]) => {
        // Verificar si ya existe un pago para estos asientos
        const existingPayment = seats.find(seat => seat.paymentId && seat.locator);
        
        const paymentData = {
          usuario_id: selectedClient.id || selectedClient._id, // Cambiar user_id por usuario_id
          event: eventId,
          funcion: selectedFuncion.id || selectedFuncion._id,
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
            status: diferencia > 0 ? 'reservado' : 'pagado',
            payments: paymentEntries.map(entry => ({
              method: entry.formaPago,
              amount: entry.importe
            })),
            ...(selectedAffiliate ? { referrer: selectedAffiliate.user.login } : {})
          };

          console.log('Payment data:', paymentData);

          // Actualizar seat_locks con el locator final y estado correcto antes de crear el pago
          if (paymentData.locator) {
            try {
              // Determinar el estado final basado en el tipo de pago
              let finalStatus = 'vendido'; // Por defecto vendido
              if (reservationType === '2' || reservationType === '3') {
                finalStatus = 'reservado'; // Si es reserva temporal o con fecha
              }
              
              const { error: updateLocksError } = await supabase
                .from('seat_locks')
                .update({ 
                  locator: paymentData.locator,
                  status: finalStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('funcion_id', paymentData.funcion)
                .eq('session_id', paymentData.usuario_id)
                .like('locator', 'TEMP-%');
              
              if (updateLocksError) {
                console.error('Error actualizando seat_locks con locator final:', updateLocksError);
              } else {
                console.log(`✅ Seat_locks actualizados con locator final: ${paymentData.locator}, estado: ${finalStatus}`);
              }
            } catch (e) {
              console.error('Error actualizando seat_locks:', e);
            }
          }

          // Si ya existe un pago, actualizarlo en lugar de crear uno nuevo
          if (existingPayment) {
            console.log('Updating existing payment:', existingPayment.paymentId);
            return updatePayment(existingPayment.paymentId, paymentData);
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
        if (results && results.length > 0 && results[0]) {
          setLocator(results[0].locator);
        }

        // Asignar tags del evento al comprador si el pago fue exitoso
        if (selectedEvent?.tags && selectedClient?.id) {
          await assignEventTagsToUser(selectedClient.id, selectedEvent.tags);
        }

        setShowConfirmation(true);
        message.success('Pago procesado exitosamente');
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
        title="Payment Details"
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