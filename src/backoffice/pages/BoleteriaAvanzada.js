import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Select, 
  message, 
  Tabs, 
  Modal, 
  Input, 
  Spin, 
  Typography, 
  Tag, 
  Divider,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Badge
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  LockOutlined,
  UnlockOutlined,
  DollarOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import { useBoleteria } from '../hooks/useBoleteria';
import { useSeatLockStore } from '../../components/seatLockStore';
import ClientModals from './CompBoleteria/components/ClientModals';
import PaymentModal from './CompBoleteria/PaymentModal';
import { downloadTicket } from '../../utils/downloadTicket';
import { createPayment } from '../services/apibackoffice';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const BoleteriaAvanzada = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [selectedZona, setSelectedZona] = useState(null);
  const [showMapa, setShowMapa] = useState(false);
  const [isBlockingMode, setIsBlockingMode] = useState(false);
  const [blockedSeats, setBlockedSeats] = useState(new Set());
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [ticketLocator, setTicketLocator] = useState(null);
  
  // Estados de modales
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isLocatorModalVisible, setIsLocatorModalVisible] = useState(false);
  
  // Estados de búsqueda
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [paymentResults, setPaymentResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Hook principal de boletería
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    zonas,
    carrito,
    setCarrito,
    selectedClient,
    setSelectedClient,
    handleEventSelect,
    handleFunctionSelect,
    loading,
    error
  } = useBoleteria();

  // Hook de locks de asientos
  const {
    subscribeToFunction,
    unsubscribe,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe
  } = useSeatLockStore();

  // Suscribirse a cambios de locks cuando se selecciona una función
  useEffect(() => {
    if (selectedFuncion?.id) {
      subscribeToFunction(selectedFuncion.id);
    }
    return () => {
      if (selectedFuncion?.id) {
        unsubscribe();
      }
    };
  }, [selectedFuncion, subscribeToFunction, unsubscribe]);

  // Manejar selección de zona
  const handleZonaSelect = useCallback((zona) => {
    console.log('🎯 [BoleteriaAvanzada] Zona seleccionada:', zona);
    setSelectedZona(zona);
    setShowMapa(true);
    message.success(`Zona "${zona.nombre}" seleccionada`);
  }, []);

  // Manejar toggle de asiento con funcionalidades avanzadas
  const handleSeatToggle = useCallback(async (seat) => {
    console.log('🪑 [BoleteriaAvanzada] Seat toggle:', seat);
    
    if (isBlockingMode) {
      // Modo bloqueo: alternar estado de bloqueo
      const seatId = seat._id || seat.id;
      setBlockedSeats(prev => {
        const newBlocked = new Set(prev);
        if (newBlocked.has(seatId)) {
          newBlocked.delete(seatId);
          message.success('Asiento desbloqueado');
        } else {
          newBlocked.add(seatId);
          message.success('Asiento bloqueado');
        }
        return newBlocked;
      });
    } else {
      // Modo normal: selección de asientos para venta
      if (!selectedClient) {
        message.warning('Debes seleccionar un cliente antes de seleccionar asientos');
        setIsClientModalVisible(true);
        return;
      }

      const seatId = seat._id || seat.id;
      const seatData = {
        _id: seatId,
        nombre: seat.nombre || seat.numero || `Asiento ${seatId}`,
        zona: selectedZona?.nombre || seat.zona?.nombre || 'General',
        precio: getSeatPrice(seat),
        funcionId: selectedFuncion?.id,
        funcionFecha: selectedFuncion?.fecha_celebracion,
        clienteId: selectedClient.id,
        clienteNombre: selectedClient.nombre
      };

      // Verificar si el asiento ya está en el carrito
      const existingIndex = carrito.findIndex(item => item._id === seatId);
      
      if (existingIndex >= 0) {
        // Remover del carrito y desbloquear
        const newCarrito = carrito.filter((_, index) => index !== existingIndex);
        setCarrito(newCarrito);
        await unlockSeat(seatId, selectedFuncion?.id);
        message.success('Asiento removido del carrito');
      } else {
        // Bloquear asiento y agregar al carrito
        const ok = await lockSeat(seatId, 'seleccionado', selectedFuncion?.id);
        if (!ok) {
          message.error('No se pudo bloquear el asiento');
          return;
        }
        
        const newCarrito = [...carrito, seatData];
        setCarrito(newCarrito);
        message.success('Asiento agregado al carrito');
      }
    }
  }, [isBlockingMode, selectedClient, selectedZona, selectedFuncion, carrito, setCarrito, lockSeat, unlockSeat]);

  // Obtener precio del asiento basado en zona y plantilla
  const getSeatPrice = useCallback((seat) => {
    if (!selectedPlantilla?.detalles) return 50; // Precio por defecto
    
    try {
      const detalles = Array.isArray(selectedPlantilla.detalles) 
        ? selectedPlantilla.detalles 
        : JSON.parse(selectedPlantilla.detalles);
      
      const zonaId = selectedZona?.id || seat.zona?.id;
      const detalle = detalles.find(d => d.zonaId === zonaId);
      
      return detalle?.precio || 50;
    } catch (error) {
      console.error('Error obteniendo precio:', error);
      return 50;
    }
  }, [selectedPlantilla, selectedZona]);

  // Calcular estadísticas de asientos por zona
  const zoneStats = useMemo(() => {
    if (!mapa?.contenido) return {};
    
    const stats = {};
    mapa.contenido.forEach(elemento => {
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        elemento.sillas.forEach(silla => {
          const zonaId = elemento.zona?.id || 'general';
          if (!stats[zonaId]) {
            stats[zonaId] = {
              total: 0,
              disponibles: 0,
              seleccionados: 0,
              vendidos: 0,
              reservados: 0,
              bloqueados: 0,
              precio: getSeatPrice(silla)
            };
          }
          
          stats[zonaId].total++;
          
          // Determinar estado del asiento
          if (isSeatLocked(silla._id)) {
            if (isSeatLockedByMe(silla._id)) {
              stats[zonaId].seleccionados++;
            } else {
              stats[zonaId].bloqueados++;
            }
          } else if (silla.estado === 'vendido' || silla.estado === 'pagado') {
            stats[zonaId].vendidos++;
          } else if (silla.estado === 'reservado') {
            stats[zonaId].reservados++;
          } else {
            stats[zonaId].disponibles++;
          }
        });
      }
    });
    
    return stats;
  }, [mapa, isSeatLocked, isSeatLockedByMe, getSeatPrice]);

  // Manejar búsqueda unificada
  const handleUnifiedSearch = async (searchTerm) => {
    console.log('🔍 [BoleteriaAvanzada] Unified search for:', searchTerm);
    setSearchLoading(true);
    setSearchResults([]);
    setPaymentResults([]);

    try {
      // Buscar en profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, login, nombre, apellido, telefono, email')
        .or(
          `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );

      if (profilesError) {
        console.error('[BoleteriaAvanzada] Profiles search error:', profilesError);
        throw profilesError;
      }

      const mappedProfiles = profiles?.map((p) => ({
        _id: p.id,
        id: p.id,
        nombre: p.login || p.nombre,
        email: p.email || '',
        telefono: p.telefono,
      })) || [];

      setSearchResults(mappedProfiles);

      // Buscar en payments por localizador
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .ilike('locator', `%${searchTerm}%`);

      if (paymentsError) {
        console.error('[BoleteriaAvanzada] Payments search error:', paymentsError);
      } else {
        setPaymentResults(payments || []);
      }

      if (mappedProfiles.length === 0 && (!payments || payments.length === 0)) {
        message.info('No se encontraron resultados');
      }

    } catch (err) {
      console.error('[BoleteriaAvanzada] Unified search error:', err);
      message.error(err.message || 'Error en la búsqueda');
    } finally {
      setSearchLoading(false);
    }
  };

  // Manejar pago
  const handlePayment = async (paymentData) => {
    try {
      console.log('💳 [BoleteriaAvanzada] Procesando pago:', paymentData);
      
      const paymentResult = await createPayment({
        ...paymentData,
        seats: carrito,
        funcion: selectedFuncion?.id,
        event: selectedEvent?.id,
        monto: carrito.reduce((total, seat) => total + (seat.precio || 0), 0)
      });

      console.log('✅ [BoleteriaAvanzada] Pago procesado:', paymentResult);
      
      setPaymentCompleted(true);
      setTicketLocator(paymentResult.locator);
      setCarrito([]); // Limpiar carrito
      
      message.success('Pago procesado exitosamente. Ticket generado.');
      
    } catch (error) {
      console.error('❌ [BoleteriaAvanzada] Error en pago:', error);
      message.error('Error al procesar el pago: ' + error.message);
    }
  };

  // Manejar descarga de ticket
  const handleDownloadTicket = useCallback(async (locator) => {
    if (!locator) {
      message.error('No hay localizador disponible para descargar');
      return;
    }

    try {
      console.log('🎫 [BoleteriaAvanzada] Downloading ticket:', locator);
      await downloadTicket(locator);
      message.success('Ticket descargado exitosamente');
    } catch (error) {
      console.error('❌ [BoleteriaAvanzada] Error descargando ticket:', error);
      message.error('Error al descargar el ticket: ' + error.message);
    }
  }, []);

  // Toggle modo bloqueo
  const toggleBlockingMode = () => {
    setIsBlockingMode(!isBlockingMode);
    if (isBlockingMode) {
      setBlockedSeats(new Set());
      message.info('Modo venta activado');
    } else {
      message.info('Modo bloqueo activado');
    }
  };

  // Limpiar asientos bloqueados
  const clearAllBlockedSeats = () => {
    setBlockedSeats(new Set());
    message.success('Todos los asientos desbloqueados');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <Text type="danger">Error: {error}</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/backoffice')}
            >
              Volver al Dashboard
            </Button>
            <Title level={3} className="mb-0">Boletería Avanzada</Title>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type={isBlockingMode ? 'primary' : 'default'}
              icon={isBlockingMode ? <LockOutlined /> : <UnlockOutlined />}
              onClick={toggleBlockingMode}
            >
              {isBlockingMode ? 'Modo Bloqueo' : 'Modo Venta'}
            </Button>
            
            {isBlockingMode && (
              <Button onClick={clearAllBlockedSeats}>
                Limpiar Bloqueos
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <Row gutter={[16, 16]}>
          {/* Panel de Eventos y Funciones */}
          <Col span={6}>
            <Card title="Eventos y Funciones" className="h-full">
              <Space direction="vertical" className="w-full">
                <div>
                  <Text strong>Evento:</Text>
                  <Select
                    className="w-full mt-1"
                    placeholder="Seleccionar evento"
                    value={selectedEvent?.id}
                    onChange={handleEventSelect}
                    loading={loading}
                  >
                    {eventos.map(evento => (
                      <Select.Option key={evento.id} value={evento.id}>
                        {evento.nombre}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <Text strong>Función:</Text>
                  <Select
                    className="w-full mt-1"
                    placeholder="Seleccionar función"
                    value={selectedFuncion?.id}
                    onChange={handleFunctionSelect}
                    loading={loading}
                  >
                    {funciones.map(funcion => (
                      <Select.Option key={funcion.id} value={funcion.id}>
                        {new Date(funcion.fecha_celebracion).toLocaleString()}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Panel de Zonas */}
          <Col span={6}>
            <Card title="Zonas Disponibles" className="h-full">
              <Space direction="vertical" className="w-full">
                {zonas.map(zona => {
                  const stats = zoneStats[zona.id] || { total: 0, disponibles: 0, precio: 0 };
                  const ocupacion = stats.total > 0 ? Math.round(((stats.total - stats.disponibles) / stats.total) * 100) : 0;
                  
                  return (
                    <Card 
                      key={zona.id} 
                      size="small" 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleZonaSelect(zona)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong>{zona.nombre}</Text>
                          <br />
                          <Text type="secondary">
                            {stats.disponibles}/{stats.total} disponibles
                          </Text>
                          <br />
                          <Text type="success">${stats.precio}</Text>
                        </div>
                        <div className="text-right">
                          <Progress 
                            type="circle" 
                            size={40} 
                            percent={ocupacion}
                            strokeColor={ocupacion > 80 ? '#ff4d4f' : ocupacion > 50 ? '#faad14' : '#52c41a'}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </Space>
            </Card>
          </Col>

          {/* Panel de Cliente y Carrito */}
          <Col span={12}>
            <Card title="Cliente y Carrito" className="h-full">
              <Tabs defaultActiveKey="cliente">
                <TabPane tab="Cliente" key="cliente">
                  <Space direction="vertical" className="w-full">
                    {selectedClient ? (
                      <Card size="small">
                        <div className="flex justify-between items-center">
                          <div>
                            <Text strong>{selectedClient.nombre}</Text>
                            <br />
                            <Text type="secondary">{selectedClient.email}</Text>
                          </div>
                          <Button onClick={() => setSelectedClient(null)}>
                            Cambiar
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <Button 
                        type="dashed" 
                        icon={<UserOutlined />}
                        onClick={() => setIsClientModalVisible(true)}
                        className="w-full"
                      >
                        Seleccionar Cliente
                      </Button>
                    )}
                  </Space>
                </TabPane>
                
                <TabPane tab="Carrito" key="carrito">
                  <Space direction="vertical" className="w-full">
                    {carrito.length > 0 ? (
                      <>
                        {carrito.map((item, index) => (
                          <Card key={index} size="small">
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>{item.nombre}</Text>
                                <br />
                                <Text type="secondary">{item.zona}</Text>
                              </div>
                              <div className="text-right">
                                <Text strong>${item.precio}</Text>
                                <br />
                                <Button 
                                  size="small" 
                                  type="link"
                                  onClick={() => {
                                    const newCarrito = carrito.filter((_, i) => i !== index);
                                    setCarrito(newCarrito);
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        <Divider />
                        
                        <div className="flex justify-between items-center">
                          <Text strong>
                            Total: ${carrito.reduce((total, item) => total + (item.precio || 0), 0)}
                          </Text>
                          <Space>
                            <Button 
                              onClick={() => setIsPaymentModalVisible(true)}
                              type="primary"
                              icon={<DollarOutlined />}
                            >
                              Proceder al Pago
                            </Button>
                          </Space>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                        <br />
                        <Text type="secondary">Carrito vacío</Text>
                      </div>
                    )}
                  </Space>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>

        {/* Mapa de Asientos */}
        {showMapa && mapa && selectedFuncion && selectedZona && (
          <Card title={`Mapa de Asientos - ${selectedZona.nombre}`} className="mt-4">
            <div className="bg-white rounded-lg border overflow-hidden" style={{ height: 'calc(100vh - 400px)' }}>
              <div className={`p-2 border-b text-center ${isBlockingMode ? 'bg-red-50' : 'bg-blue-50'}`}>
                <p className={`text-sm ${isBlockingMode ? 'text-red-700' : 'text-blue-700'}`}>
                  🎫 <strong>Zona: {selectedZona.nombre}</strong> - {isBlockingMode ? 'Modo Bloqueo Activo' : 'Sistema de colores activo'}
                </p>
                <p className={`text-xs mt-1 ${isBlockingMode ? 'text-red-600' : 'text-blue-600'}`}>
                  {isBlockingMode ? 'Haz clic en asientos para bloquear/desbloquear' : 'Verde: Disponible | Azul: Seleccionado | Rojo: Vendido | Púrpura: Reservado | Gris: Bloqueado'}
                </p>
              </div>
              <SeatingMapUnified
                funcionId={selectedFuncion?.id}
                mapa={mapa}
                zonas={zonas}
                selectedFuncion={selectedFuncion}
                selectedEvent={selectedEvent}
                onSeatToggle={handleSeatToggle}
                carrito={carrito}
                modoVenta={!isBlockingMode}
                showPrices={true}
                showZones={true}
                showLegend={true}
                allowSeatSelection={true}
                debug={true}
                blockedSeats={blockedSeats}
                isSeatLocked={isSeatLocked}
                isSeatLockedByMe={isSeatLockedByMe}
              />
            </div>
          </Card>
        )}

        {/* Modales */}
        <ClientModals
          visible={isClientModalVisible}
          onClose={() => setIsClientModalVisible(false)}
          onSelectClient={setSelectedClient}
          searchResults={searchResults}
          paymentResults={paymentResults}
          searchLoading={searchLoading}
          onSearch={handleUnifiedSearch}
          onClearSearch={() => {
            setSearchResults([]);
            setPaymentResults([]);
          }}
        />

        <PaymentModal
          visible={isPaymentModalVisible}
          onClose={() => setIsPaymentModalVisible(false)}
          onPayment={handlePayment}
          carrito={carrito}
          selectedClient={selectedClient}
          selectedFuncion={selectedFuncion}
        />

        {/* Modal de descarga de ticket */}
        <Modal
          title="Ticket Generado"
          open={paymentCompleted}
          onCancel={() => setPaymentCompleted(false)}
          footer={[
            <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadTicket(ticketLocator)}>
              Descargar Ticket
            </Button>,
            <Button key="close" onClick={() => setPaymentCompleted(false)}>
              Cerrar
            </Button>
          ]}
        >
          <div className="text-center">
            <Text strong>Pago Completado</Text>
            <br />
            <Text>Localizador: {ticketLocator}</Text>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BoleteriaAvanzada;
