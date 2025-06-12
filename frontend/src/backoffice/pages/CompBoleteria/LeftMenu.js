import React, { useState } from 'react';
import { Button, message, Modal, Input, Card, Table, Tag, Form } from 'antd';
import { SearchOutlined, UserAddOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';

const LeftMenu = ({ onAddClientClick, selectedClient, onClientRemove, setCarrito, setSelectedClient, onFunctionSelect, setSelectedEvent }) => {
  // Estados para búsqueda de tickets
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('locator'); // 'locator' o 'email'
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  
  // Estados para datos
  const [userData, setUserData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [emailSearchResults, setEmailSearchResults] = useState([]);
  
  // Estados para gestión de cuentas
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [accountSearchResults, setAccountSearchResults] = useState([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [form] = Form.useForm();

  // Función para obtener datos del evento
  const fetchEventData = async (eventId) => {
    try {
      const token = localStorage.getItem('token')?.replace('Bearer ', '');
      const response = await fetch(`http://localhost:5000/api/eventos/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener datos del evento');
      return await response.json();
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  };

  // Búsqueda unificada (localizador o email)
  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      if (searchMode === 'locator') {
        await handleTicketSearch(searchTerm);
      } else {
        await handleEmailSearch(searchTerm);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Búsqueda por email (para tickets)
  const handleEmailSearch = async (email) => {
    const response = await fetch(`http://localhost:5000/api/payments/by-email/${encodeURIComponent(email)}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Error en la búsqueda');

    setEmailSearchResults(data.data || []);
    message.success(`Se encontraron ${data.data.length} localizadores`);
  };

  // Búsqueda por localizador
  const handleTicketSearch = async (locator) => {
    const token = localStorage.getItem('token')?.replace('Bearer ', '');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`http://localhost:5000/api/payments/locator/${locator}`, { headers });
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Error al buscar el ticket');
    if (!data.success) throw new Error(data.message || 'Pago no encontrado');

    const payment = data.data;
    setTicketData(payment);

    if (payment.funcion && typeof onFunctionSelect === 'function') {
      try {
        await onFunctionSelect(payment.funcion);
      } catch (err) {
        console.error('Error setting function from ticket search:', err);
      }
    }

    // Actualizar carrito
    if (typeof setCarrito === 'function') {
      setCarrito(payment.seats.map(seat => ({
        _id: seat._id || seat.id,
        nombre: seat.name,
        precio: seat.price || 0,
        nombreMesa: seat.mesa?.nombre || '',
        zona: seat.zona?.nombre || 'General',
        status: payment.status,
        paymentId: payment._id,
        locator: payment.locator
      })));
    }

    // Si el pago tiene usuario, establecerlo como cliente seleccionado
    if (payment.user) {
      setUserData(payment.user);
      setSelectedClient(payment.user);
    }

    // Si el pago tiene evento, guardar la información
    if (payment.event) {
      setEventData(payment.event);
      if (typeof setSelectedEvent === 'function') {
        setSelectedEvent(payment.event);
      }
    }

    setIsSearchModalVisible(false);
    message.success('Ticket encontrado y cargado correctamente');
  };

  // Búsqueda de cuentas por email
  const handleAccountSearch = async (searchTerm) => {
    setSearchLoading(true);
    try {
      // Ensure the search term is properly encoded
      const encodedTerm = encodeURIComponent(searchTerm.trim());
      
      const response = await fetch(`http://localhost:5000/api/user/search?term=${encodedTerm}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Error en la búsqueda');
      
      // Ensure the results have valid IDs
      const validResults = data.filter(user => user._id && typeof user._id === 'string');
      
      setAccountSearchResults(validResults);
      message.success(validResults.length > 0 ? 'Cuenta encontrada' : 'No se encontraron cuentas');
    } catch (error) {
      message.error(error.message);
      setAccountSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Crear nueva cuenta
  const handleAddAccount = async (values) => {
    setSearchLoading(true);
    try {
      // Create the user object with all required fields
      const userData = {
        login: values.login,
        email: values.email,
        telefono: values.telefono,
        empresa: values.empresa || 'Sin empresa',
        perfil: 'cliente', // Default profile
        password: 'defaultPassword', // Default password
        permisos: {
          administracion: { sistema: false, usuarios: false, informes: false },
          programacion: {
            adminFunciones: false,
            gestionEventos: false,
            modificarComisionesUsuario: false,
            gestionCupos: false,
            gestionFidelizaciones: false,
            gestionEncuestas: false,
            gestionColasVirtuales: false
          },
          venta: {
            venta: false,
            cancelacion: false,
            devolucion: false,
            reimpresion: false,
            buscarVentas: false,
            reservas: false,
            ventaAcumulada: false,
            bloqueos: false
          }
        },
        formaDePago: {
          stripe: false,
          efectivo: false,
          zelle: false,
          pagoMovil: false,
          paypal: false,
          puntoDeVenta: false
        }
      };
  
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la cuenta');
      }
  
      const newUser = await response.json();
      setSelectedClient(newUser);
      setUserData(newUser);
      form.resetFields();
      setIsAddingAccount(false);
      message.success('Cuenta creada exitosamente');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Limpiar cliente seleccionado
  const handleClearClient = () => {
    setUserData(null);
    setTicketData(null);
    setEventData(null);
    if (typeof onClientRemove === 'function') onClientRemove();
  };

  // Columnas para la tabla de asientos
  const ticketColumns = [
    { title: 'Asiento', dataIndex: 'name', key: 'name', width: 100 },
    { 
      title: 'Zona', 
      dataIndex: 'zone', 
      key: 'zone', 
      width: 120,
      render: (zone) => zone || 'General' 
    },
    { 
      title: 'Precio', 
      dataIndex: 'price', 
      key: 'price', 
      width: 100,
      render: (price) => `$${price?.toFixed(2) || '0.00'}` 
    },
    { 
      title: 'Estado', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status) => (
        <Tag color={status === 'pagado' ? 'green' : 'orange'}>
          {status?.toUpperCase()}
        </Tag>
      ) 
    },
  ];

  // Modal para búsqueda de tickets
  const renderSearchModal = () => (
    <Modal
      title="Buscar Tickets"
      open={isSearchModalVisible}
      onCancel={() => {
        setIsSearchModalVisible(false);
        setEmailSearchResults([]);
      }}
      footer={null}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        <Button
          type="default"
          variant="outlined"
          block
          onClick={() => setSearchMode('locator')}
          style={{ marginRight: 8 }}
        >
          Por Localizador
        </Button>
        <Button
          type="default"
          variant="outlined"
          block
          onClick={() => setSearchMode('email')}
        >
          Por Email
        </Button>
      </div>

      <Input.Search
        placeholder={searchMode === 'locator' ? 
          "Ingrese el localizador (ej: ABC123XY)" : 
          "Ingrese el email del cliente"}
        enterButton="Buscar"
        size="large"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onSearch={handleSearch}
        loading={searchLoading}
      />
      
      {searchMode === 'email' && emailSearchResults.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Table
            columns={[
              { title: 'Localizador', dataIndex: 'locator', key: 'locator' },
              { 
                title: 'Fecha', 
                dataIndex: 'date', 
                key: 'date', 
                render: date => new Date(date).toLocaleDateString() 
              },
              { 
                title: 'Estado', 
                dataIndex: 'status', 
                key: 'status',
                render: status => <Tag color={status === 'pagado' ? 'green' : 'orange'}>{status}</Tag> 
              },
              { 
                title: 'Acción', 
                key: 'action',
                render: (_, record) => (
                  <Button 
                    type="link" 
                    onClick={() => {
                      handleTicketSearch(record.locator);
                      setEmailSearchResults([]);
                    }}
                  >
                    Cargar
                  </Button>
                )
              }
            ]}
            dataSource={emailSearchResults}
            rowKey="locator"
            size="small"
            pagination={{ pageSize: 5 }}
            style={{ tableLayout: 'fixed' }} 
          />
        </div>
      )}
    </Modal>
  );

  // Modal para gestión de cuentas
  const renderAccountModal = () => (
    <Modal
      title={isAddingAccount ? "Añadir Nueva Cuenta" : "Buscar Cuenta"}
      open={isAccountModalVisible}
      onCancel={() => {
        setIsAccountModalVisible(false);
        setIsAddingAccount(false);
        setAccountSearchResults([]);
        form.resetFields();
      }}
      footer={null}
      width={600}
    >
      {isAddingAccount ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddAccount}
        >
          <Form.Item
            name="login"
            label="Nombre de usuario"
            rules={[{ required: true, message: 'Por favor ingrese un nombre de usuario' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Por favor ingrese un email' },
              { type: 'email', message: 'Ingrese un email válido' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="telefono"
            label="Teléfono"
            rules={[{ required: true, message: 'Por favor ingrese un teléfono' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="empresa"
            label="Empresa"
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button
              type="default"
              variant="outlined"
              block
              htmlType="submit"
              loading={searchLoading}
            >
              Crear Cuenta
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <>
          <Input.Search
            placeholder="Buscar cuenta por email"
            enterButton="Buscar"
            size="large"
            loading={searchLoading}
            onSearch={handleAccountSearch}
            style={{ marginBottom: 16 }}
          />
          
          <Button 
            type="dashed" 
            icon={<UserAddOutlined />}
            onClick={() => setIsAddingAccount(true)}
            block
          >
            Crear Nueva Cuenta
          </Button>

          {accountSearchResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Table
                columns={[
                  { title: 'Nombre', dataIndex: 'login', key: 'login' },
                  { title: 'Email', dataIndex: 'email', key: 'email' },
                  { title: 'Teléfono', dataIndex: 'telefono', key: 'telefono' },
                  {
                    title: 'Acción',
                    key: 'action',
                    render: (_, record) => (
                      <Button 
                        type="link" 
                        onClick={() => {
                          setSelectedClient(record);
                          setUserData(record);
                          setIsAccountModalVisible(false);
                        }}
                      >
                        Seleccionar
                      </Button>
                    )
                  }
                ]}
                dataSource={accountSearchResults}
                rowKey="_id"
                size="small"
                pagination={false}
              />
            </div>
          )}
        </>
      )}
    </Modal>
  );

  return (
    <div className="left-menu">
      {/* Botón para buscar tickets */}
      <Button 
        icon={<SearchOutlined />} 
        onClick={() => setIsSearchModalVisible(true)}
        block
      >
        Buscar Tickets
      </Button>

      {/* Botón para gestionar cuentas */}
      <Button
        type="default"
        variant="outlined"
        icon={<UserAddOutlined />}
        onClick={() => setIsAccountModalVisible(true)}
        block
        style={{ marginTop: 16 }}
      >
        Buscar/Añadir Cuenta
      </Button>
      
      {/* Mostrar información del cliente seleccionado */}
      {(userData || selectedClient) && (
        <Card style={{ marginTop: 16 }} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{(userData || selectedClient).login}</strong>
              <div style={{ fontSize: 12 }}>{(userData || selectedClient).empresa || 'Sin empresa'}</div>
            </div>
            <div>
              <Button
                type="default"
                variant="outlined"
                block
                icon={<EditOutlined />}
                onClick={() => setIsAccountModalVisible(true)}
                size="small"
                style={{ marginRight: 8 }}
              >
                Editar
              </Button>
              <Button 
                type="text" 
                danger
                icon={<CloseOutlined />}
                onClick={handleClearClient}
                size="small"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Modales */}
      {renderSearchModal()}
      {renderAccountModal()}

      {/* Modal de detalles del ticket (se mantiene igual) */}
      <Modal
        title={`Detalles de Compra - ${userData?.login || 'Cliente'}`}
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={null}
        width={800}
      >
        {/* ... (contenido igual que antes) ... */}
      </Modal>
    </div>
  );
};

export default LeftMenu;