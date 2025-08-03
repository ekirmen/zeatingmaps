import React, { useState, useEffect } from 'react';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs } from 'antd';
import { SearchOutlined, UserOutlined, QrcodeOutlined, ShoppingCartOutlined, GiftOutlined } from '@ant-design/icons';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';
import ZonesAndPrices from './ZonesAndPrices';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import PrintTicketButton from '../../components/PrintTicketButton';
import ProductosWidget from '../../../store/components/ProductosWidget';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';

const { Search } = Input;
const { Option } = Select;

const BoleteriaMain = () => {
  // Usar los hooks existentes
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    mapa,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent
  } = useBoleteria();

  const {
    selectedClient,
    setSelectedClient,
    searchResults,
    paymentResults,
    searchLoading,
    handleAddClient,
    handleUnifiedSearch,
    clearSearchResults,
    handleLocatorSearch
  } = useClientManagement((seats) => {
    setCarrito(seats);
  });

  // Estados locales
  const [animatingSeats, setAnimatingSeats] = useState([]);
  const [showFunctions, setShowFunctions] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [locatorValue, setLocatorValue] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLocatorModal, setShowLocatorModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [productosCarrito, setProductosCarrito] = useState([]);

  const handlePaymentClick = () => {
    if (!selectedClient) {
      message.warning('Selecciona un cliente antes de continuar');
      return;
    }
    message.success('Redirigiendo a pagos...');
  };

  const handleSeatAnimation = (seat) => {
    setAnimatingSeats(prev => [...prev, seat]);
  };

  const handleAnimationComplete = (seatId) => {
    setAnimatingSeats(prev => prev.filter(seat => seat._id !== seatId));
  };

  const handleLocatorSearchSubmit = () => {
    if (!locatorValue.trim()) {
      message.warning('Ingresa un localizador válido');
      return;
    }
    // Aquí implementarías la búsqueda por localizador
    message.info(`Buscando localizador: ${locatorValue}`);
    setShowLocatorModal(false);
  };

  const handleClientSearch = (value) => {
    if (value.trim()) {
      handleUnifiedSearch(value);
    } else {
      clearSearchResults();
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(false);
    message.success(`Cliente seleccionado: ${client.nombre}`);
  };

  const handleProductAdded = (producto) => {
    setProductosCarrito(prev => {
      const existingProduct = prev.find(p => p.id === producto.id);
      if (existingProduct) {
        return prev.map(p => 
          p.id === producto.id 
            ? { ...p, cantidad: p.cantidad + producto.cantidad, precio_total: (p.cantidad + producto.cantidad) * p.precio }
            : p
        );
      } else {
        return [...prev, producto];
      }
    });
  };

  const handleSeatClick = (seat) => {
    if (blockMode) {
      // Modo bloqueo
      const isBlocked = blockedSeats.some(s => s._id === seat._id);
      if (isBlocked) {
        setBlockedSeats(prev => prev.filter(s => s._id !== seat._id));
      } else {
        setBlockedSeats(prev => [...prev, seat]);
      }
    } else {
      // Modo selección normal
      const isSelected = selectedSeats.some(s => s._id === seat._id);
      if (isSelected) {
        setSelectedSeats(prev => prev.filter(s => s._id !== seat._id));
        setCarrito(prev => prev.filter(s => s._id !== seat._id));
      } else {
        setSelectedSeats(prev => [...prev, seat]);
        setCarrito(prev => [...prev, {
          ...seat,
          funcionId: selectedFuncion?.id,
          zona: seat.zona,
          precio: seat.precio
        }]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar izquierda */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header del sidebar */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Boletería</h2>
          
          {/* Búsqueda de cliente */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cliente
            </label>
            <Search
              placeholder="Nombre, email o teléfono"
              onSearch={handleClientSearch}
              loading={searchLoading}
              enterButton={<SearchOutlined />}
            />
          </div>

          {/* Cliente seleccionado */}
          {selectedClient && (
            <Card size="small" className="mb-4">
              <div className="flex items-center">
                <Avatar icon={<UserOutlined />} className="mr-2" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{selectedClient.nombre}</div>
                  <div className="text-xs text-gray-500">{selectedClient.email}</div>
                </div>
                <Button 
                  size="small" 
                  type="text" 
                  onClick={() => setSelectedClient(null)}
                >
                  ✕
                </Button>
              </div>
            </Card>
          )}

          {/* Localizador */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localizador
            </label>
            <Button 
              icon={<QrcodeOutlined />} 
              block 
              onClick={() => setShowLocatorModal(true)}
            >
              Buscar por Localizador
            </Button>
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Resultados</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((client) => (
                  <Card 
                    key={client.id} 
                    size="small" 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="flex items-center">
                      <Avatar icon={<UserOutlined />} size="small" className="mr-2" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{client.nombre}</div>
                        <div className="text-xs text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Funciones disponibles */}
          {funciones.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Funciones</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {funciones.map((funcion) => (
                  <Card 
                    key={funcion.id} 
                    size="small" 
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedFuncion?.id === funcion.id ? 'border-purple-500 bg-purple-50' : ''
                    }`}
                    onClick={() => handleFunctionSelect(funcion)}
                  >
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(funcion.fechaCelebracion).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        Sala: {funcion.sala?.nombre || 'N/A'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenido del sidebar */}
        <div className="flex-1 p-4">
          <ZonesAndPrices
            eventos={eventos}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
            funciones={funciones}
            onShowFunctions={() => setShowFunctions(true)}
            selectedFuncion={selectedFuncion}
            carrito={carrito}
            setCarrito={setCarrito}
            selectedPlantilla={selectedPlantilla}
            selectedClient={selectedClient}
            abonos={[]}
            selectedAffiliate={selectedAffiliate}
            setSelectedAffiliate={setSelectedAffiliate}
            showSeatingMap={true}
            compact={true}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Plantillas de Precios */}
        {selectedEvent && (
          <div className="bg-gray-50 border-b px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Plantillas de Precios:</span>
                <div className="flex space-x-2">
                  {selectedPlantilla ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {selectedPlantilla.nombre}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      Sin plantilla seleccionada
                    </span>
                  )}
                </div>
              </div>
              <Button 
                size="small" 
                type="primary"
                onClick={() => message.info('Funcionalidad de plantillas en desarrollo')}
              >
                Cambiar Plantilla
              </Button>
            </div>
          </div>
        )}

        {/* Header principal */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedEvent ? selectedEvent.nombre : 'Seleccionar Evento'}
                </h1>
                {selectedFuncion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedFuncion.fechaCelebracion).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Badge count={carrito.length} showZero={false}>
                  <Button 
                    icon={<ShoppingCartOutlined />} 
                    type="primary"
                    onClick={handlePaymentClick}
                    disabled={carrito.length === 0}
                  >
                    Pagar
                  </Button>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Área principal con pestañas */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 h-full">
            <Tabs
              defaultActiveKey="asientos"
              items={[
                {
                  key: 'asientos',
                  label: 'Asientos',
                  children: (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Mapa de Asientos</h2>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={blockMode}
                              onChange={(e) => setBlockMode(e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm">🔒 Modo bloqueo</span>
                          </label>
                        </div>
                      </div>
                      <SimpleSeatingMap
                        selectedFuncion={selectedFuncion}
                        onSeatClick={handleSeatClick}
                        selectedSeats={selectedSeats}
                        blockedSeats={blockedSeats}
                        blockMode={blockMode}
                      />
                    </div>
                  ),
                },
                {
                  key: 'productos',
                  label: (
                    <span>
                      <GiftOutlined className="mr-2" />
                      Productos
                    </span>
                  ),
                  children: (
                    <div>
                      <ProductosWidget
                        eventoId={selectedEvent?.id}
                        onProductAdded={handleProductAdded}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Carrito fijo a la derecha */}
      <div className="w-96 bg-white shadow-lg border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Carrito</h3>
        </div>
        <div className="flex-1 p-4">
          <CartWithTimer
            carrito={carrito}
            setCarrito={setCarrito}
            onPaymentClick={handlePaymentClick}
            selectedClient={selectedClient}
            selectedAffiliate={selectedAffiliate}
            fixed={true}
          />
          
          {/* Productos en el carrito */}
          {productosCarrito.length > 0 && (
            <div className="mt-4 p-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Productos</h4>
              <div className="space-y-2">
                {productosCarrito.map((producto) => (
                  <div key={producto.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">
                        Cantidad: {producto.cantidad} x ${parseFloat(producto.precio).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      ${parseFloat(producto.precio_total).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium">Total Productos:</span>
                  <span className="text-sm font-bold">
                    ${productosCarrito.reduce((sum, p) => sum + parseFloat(p.precio_total), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Botón de impresión Boca */}
          {carrito.length > 0 && (
            <div className="mt-4 p-4 border-t border-gray-200">
              <PrintTicketButton
                ticketData={{
                  eventName: selectedEvent?.nombre || 'Evento',
                  eventDate: selectedFuncion?.fecha || new Date().toLocaleDateString(),
                  eventTime: selectedFuncion?.hora || '20:00',
                  seatNumber: carrito.map(seat => seat.numero_asiento).join(', '),
                  zoneName: carrito[0]?.zona_nombre || 'General',
                  price: carrito.reduce((sum, seat) => sum + (seat.precio || 0), 0).toFixed(2),
                  ticketNumber: `TKT-${Date.now()}`,
                  qrCode: `TICKET-${Date.now()}`
                }}
                onPrintComplete={() => {
                  message.success('Ticket impreso exitosamente');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de búsqueda de cliente */}
      <Modal
        title="Buscar Cliente"
        open={showClientModal}
        onCancel={() => setShowClientModal(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <Search
            placeholder="Nombre, email o teléfono"
            onSearch={handleClientSearch}
            loading={searchLoading}
            enterButton={<SearchOutlined />}
          />
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((client) => (
                <Card 
                  key={client.id} 
                  size="small" 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="flex items-center">
                    <Avatar icon={<UserOutlined />} size="small" className="mr-2" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{client.nombre}</div>
                      <div className="text-xs text-gray-500">{client.email}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de localizador */}
      <Modal
        title="Buscar por Localizador"
        open={showLocatorModal}
        onCancel={() => setShowLocatorModal(false)}
        onOk={handleLocatorSearchSubmit}
        okText="Buscar"
        cancelText="Cancelar"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localizador
            </label>
            <Input
              placeholder="Ingresa el localizador"
              value={locatorValue}
              onChange={(e) => setLocatorValue(e.target.value)}
              onPressEnter={handleLocatorSearchSubmit}
            />
          </div>
        </div>
      </Modal>

      {/* Animaciones de asientos */}
      {animatingSeats.map((seat) => (
        <SeatAnimation
          key={`${seat._id}-${Date.now()}`}
          seat={seat}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}
    </div>
  );
};

export default BoleteriaMain; 