import React, { useState, useEffect } from 'react';
import { Modal, Input, Card, Table, Form, Button, message, Select, Checkbox } from '../../../utils/antdComponents';
import { Search, UserPlus, X, Edit, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../../supabaseClient';
import { getUserByEmail } from '../../services/adminUsers';
import downloadTicket from '../../../utils/downloadTicket';
import { useCartStore } from '../../../store/cartStore';

const LeftMenu = ({
  onAddClientClick,
  selectedClient,
  onClientRemove,
  setCarrito,
  setSelectedClient,
  onFunctionSelect,
  setSelectedEvent,
  isMenuCollapsed,
  setIsMenuCollapsed
}) => {
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState('locator');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchResults, setEmailSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [userData, setUserData] = useState(selectedClient || null);
  const [ticketData, setTicketData] = useState(null);
  const [eventData, setEventData] = useState(null);

  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [accountSearchResults, setAccountSearchResults] = useState([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedClient) {
      setUserData(selectedClient);
    } else {
      setUserData(null);
    }
  }, [selectedClient]);

  const handleTicketSearch = async (locator) => {
    setSearchLoading(true);
    try {
      const { data: payment, error } = await supabase
        .from('payment_transactions')
        .select(`*,
            user:profiles!user_id(*),
            seats,
            event:eventos(*),
            funcion:funciones(
              id,
              fecha_celebracion,
              evento_id,
              sala_id,
              plantilla
            )`)
        .eq('locator', locator)
        .single();

      if (error) {
        console.error(`[Boleteria] Error searching ticket for locator ${locator}:`, error);
        throw new Error('Ticket no encontrado');
      }

      if (!payment) {
        throw new Error('Ticket no encontrado');
      }
      // Parse seats if stored as JSON string
      let seats = [];
      if (Array.isArray(payment.seats)) {
        seats = payment.seats;
      } else if (typeof payment.seats === 'string') {
        try {
          seats = JSON.parse(payment.seats);
        } catch {
          try {
            seats = JSON.parse(JSON.parse(payment.seats));
          } catch {
            seats = [];
          }
        }
      }

      const normalizedSeats = seats.map((seat, index) => {
        const nombre =
          seat.nombre ||
          seat.name ||
          seat.nombreAsiento ||
          seat.seatLabel ||
          seat._id ||
          seat.id ||
          `Asiento ${index + 1}`;

        return {
          key: seat._id || seat.id || index,
          nombre,
          nombreZona: seat.nombreZona || seat.zona?.nombre || seat.zona || 'Sin zona',
          mesa: seat.mesa?.nombre || seat.mesa || '',
          precio: seat.precio || seat.price || seat.total || 0,
          raw: seat
        };
      });

      let parsedPayments = [];
      if (Array.isArray(payment.payments)) {
        parsedPayments = payment.payments;
      } else if (typeof payment.payments === 'string') {
        try {
          parsedPayments = JSON.parse(payment.payments);
        } catch {
          try {
            parsedPayments = JSON.parse(JSON.parse(payment.payments));
          } catch {
            parsedPayments = [];
          }
        }
      }

      setTicketData({ ...payment, seats, normalizedSeats, parsedPayments });
      if (payment.user) setUserData(payment.user);
      if (payment.event) setEventData(payment.event);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadTicketIntoPOS = async () => {
    if (!ticketData) return;

    if (ticketData.user) {
      setSelectedClient(ticketData.user);
    }

    if (ticketData.seats && setCarrito) {
      const seatsToCart = ticketData.seats.map((seat) => ({
        _id: seat._id || seat.id || seat.sillaId,
        nombre: seat.nombre || seat.name || `Asiento ${seat._id || seat.id}`,
        precio: seat.precio || seat.price || 0,
        nombreMesa: seat.mesa?.nombre || '',
        zona: seat.nombreZona || seat.zona?.nombre || 'General',
        status: ticketData.status,
        paymentId: ticketData.id,
        locator: ticketData.locator,
        funcionId: ticketData.funcion?.id || ticketData.funcion,
        funcionFecha: ticketData.funcion?.fecha_celebracion
      }));

      setCarrito(seatsToCart);
    }

    if (ticketData.event && setSelectedEvent) {
      setSelectedEvent(ticketData.event);
    }

    if (ticketData.funcion && typeof onFunctionSelect === 'function') {
      // Pasar un parámetro para indicar que no se debe limpiar el carrito
      await onFunctionSelect(ticketData.funcion, { preserveCart: true });
    }

    setIsSearchModalVisible(false);
    message.success('Ticket cargado correctamente');
  };

  const handleDownloadTicket = async (locator) => {
    try {
      await downloadTicket(locator);
      message.success('Ticket descargado correctamente');
    } catch (error) {
      console.error('Error downloading ticket:', error);
      message.error(`Error al descargar ticket: ${error.message}`);
    }
  };

  const handleEmailSearch = async (email) => {
    setSearchLoading(true);
    try {
      // Obtener primero el usuario por email para tener su id asociado
      const { data: userResp, error: userError } = await getUserByEmail(email);

      if (userError || !userResp || !userResp.user) {
        throw userError || new Error('Usuario no encontrado');
      }

      const { data, error } = await supabase
        .from('payment_transactions')
        .select(
          `id, locator, status, created_at, evento_id as event, eventData:eventos(nombre),
           funcion_id as funcion, funcion:funciones(id, fecha_celebracion, evento)`
        )
        .eq('user_id', userResp.user.id);

      if (error) throw error;

      const payments = data || [];

      // Si falta información de evento, intentar completarla a partir de la función
      for (const payment of payments) {
        if (!payment.event && payment.funcion?.evento_id) {
          await supabase
            .from('payment_transactions')
            .update({ evento_id: payment.funcion.evento_id })
            .eq('id', payment.id);
          payment.event = payment.funcion.evento_id;
        }
      }

      const formatted = payments.map((p) => ({
        ...p,
        event_name: p.eventData?.nombre || 'Sin evento',
        funcion_fecha: p.funcion?.fecha_celebracion || null
      }));

      setEmailSearchResults(formatted);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    setTicketData(null);
    setUserData(null);
    setEventData(null);
    if (searchMode === 'locator') {
      await handleTicketSearch(searchTerm);
    } else {
      await handleEmailSearch(searchTerm);
    }
  };

  const handleAccountSearch = async (term) => {
    setSearchLoading(true);
    try {
      const cleanTerm = term.trim();
      if (!cleanTerm) {
        setAccountSearchResults([]);
        message.info('Usuario no encontrado y/o campo vacío');
        return;
      }

      // Look up the user by email using the helper which handles
      // different supabase-js versions gracefully.
      const { data: userResp, error: userError } = await getUserByEmail(cleanTerm);

      if (userError || !userResp || !userResp.user) {
        setAccountSearchResults([]);
        message.info('Usuario no encontrado y/o campo vacío');
        return;
      }

      // Fetch the related profile data using the user id
      const profileResult = await supabase
        .from('profiles')
        .select('id, login, telefono')
        .eq('id', userResp.user.id)
        .maybeSingle();

      let profileData = profileResult.data;
      let profileError = profileResult.error;

      if (profileError && profileError.code === '42703') {
        const fallbackResult = await supabase
          .from('profiles')
          .select('id, login, telefono')
          .eq('id', userResp.user.id)
          .maybeSingle();

        profileData = fallbackResult.data
          ? { ...fallbackResult.data }
          : null;
        profileError = fallbackResult.error;
      }

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profileData) {
        setAccountSearchResults([]);
        message.info('Usuario no encontrado y/o campo vacío');
        return;
      }

      setAccountSearchResults([
        { ...profileData, email: userResp.user.email }
      ]);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddAccount = async (values) => {
    setSearchLoading(true);
    try {
      // Create auth user first
      const { data: userResp, error } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        password: values.password || 'defaultPassword',
        email_confirm: true,
        user_metadata: { password_set: !!values.password },
      });

      if (error) throw error;

      // Wait a bit for the trigger to create the profile
      await new Promise((res) => setTimeout(res, 1500));

      const client = supabaseAdmin || supabase;
      const { data, error: profileError } = await client
        .from('profiles')
        .update({
          login: values.login,
          telefono: values.telefono,
          perfil: 'cliente',
          permisos: { role: 'usuario' },
        })
        .eq('id', userResp.user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      setSelectedClient(data);
      setUserData(data);
      form.resetFields();
      setIsAddingAccount(false);
      setIsAccountModalVisible(false);
      message.success('Cuenta creada exitosamente');
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearClient = () => {
    setUserData(null);
    setTicketData(null);
    setEventData(null);
    setSelectedClient(null);
    if (typeof onClientRemove === 'function') onClientRemove();
  };

  const toggleMenu = () => {
    setIsMenuCollapsed(!isMenuCollapsed);
  };

  return (
    <div className="relative h-full">
      {/* Botón para mostrar/ocultar menú */}
      <div className={`flex justify-center p-2 border-b border-gray-100 mb-2 ${isMenuCollapsed ? '' : 'justify-end'}`}>
        <Button
          type="text"
          icon={isMenuCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          onClick={toggleMenu}
          className="bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all"
          title={isMenuCollapsed ? "Mostrar menú" : "Ocultar menú"}
        />
      </div>

      <div className={`flex flex-col gap-3 p-2 transition-all duration-300 ${isMenuCollapsed ? 'items-center' : ''}`}>
        <Button
          icon={<Search size={18} />}
          onClick={() => setIsSearchModalVisible(true)}
          className={isMenuCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center border-none shadow-none bg-transparent hover:bg-purple-50 text-purple-600' : ''}
          block={!isMenuCollapsed}
          type={isMenuCollapsed ? "text" : "default"}
          title="Buscar Tickets"
        >
          {!isMenuCollapsed && "Buscar Tickets"}
        </Button>

        <Button
          icon={<UserPlus size={18} />}
          onClick={() => setIsAccountModalVisible(true)}
          className={isMenuCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center border-none shadow-none bg-transparent hover:bg-purple-50 text-purple-600' : ''}
          block={!isMenuCollapsed}
          type={isMenuCollapsed ? "text" : "default"}
          title="Buscar/Añadir Cuenta"
        >
          {!isMenuCollapsed && "Buscar/Añadir Cuenta"}
        </Button>

        <Button
          icon={<Settings size={18} />}
          onClick={() => setIsConfigModalVisible(true)}
          className={isMenuCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center border-none shadow-none bg-transparent hover:bg-purple-50 text-purple-600' : ''}
          block={!isMenuCollapsed}
          type={isMenuCollapsed ? "text" : "default"}
          title="Configuración"
        >
          {!isMenuCollapsed && "Configuración"}
        </Button>

        <Button
          icon={<X size={18} />}
          onClick={() => {
            const { clearCart } = useCartStore.getState();
            clearCart();
          }}
          className={isMenuCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center border-none shadow-none bg-transparent hover:bg-red-50 text-red-600' : ''}
          block={!isMenuCollapsed}
          type={isMenuCollapsed ? "text" : "default"}
          danger={!isMenuCollapsed}
          title="Remove Seats"
        >
          {!isMenuCollapsed && "Remove Seats"}
        </Button>

        {!isMenuCollapsed && userData && (
          <Card size="small" className="border border-purple-100 bg-purple-50/30 mt-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs truncate">
                  {userData.login || userData.nombre || userData.email || 'Cliente'}
                </div>
                <div className="text-[10px] text-gray-400 truncate">{userData.email || userData.telefono}</div>
              </div>
              <div className="flex gap-1">
                <Button size="small" type="text" icon={<Edit size={12} />} onClick={() => setIsAccountModalVisible(true)} className="h-6 w-6 p-0" />
                <Button size="small" type="text" danger icon={<X size={12} />} onClick={handleClearClient} className="h-6 w-6 p-0" />
              </div>
            </div>
          </Card>
        )}

        {isMenuCollapsed && userData && (
          <div className="mt-2 text-purple-600 relative group cursor-pointer" onClick={() => setIsAccountModalVisible(true)}>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-xs border border-purple-200">
              {(userData.login || userData.email || 'C').substring(0, 1).toUpperCase()}
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              {userData.login || userData.email}
            </div>
          </div>
        )}
      </div>

      {/* MODAL búsqueda */}
      <Modal
        open={isSearchModalVisible}
        title="Buscar Tickets"
        onCancel={() => setIsSearchModalVisible(false)}
        footer={null}
      >
        <div className="flex gap-2 mb-2">
          <Button onClick={() => setSearchMode('locator')}>Por Localizador</Button>
          <Button onClick={() => setSearchMode('email')}>Por Email</Button>
        </div>

        <Input.Search
          placeholder={searchMode === 'locator' ? 'Ingrese localizador' : 'Ingrese email'}
          enterButton="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          loading={searchLoading}
        />

        {ticketData && (
          <div className="mt-4 space-y-2">
            {userData && (
              <div>
                <strong>Comprador:</strong> {userData.login} ({userData.email})
              </div>
            )}
            {eventData && (
              <div>
                <strong>Evento:</strong> {eventData.nombre}
              </div>
            )}
            {ticketData.funcion && (
              <div>
                <strong>Función:</strong>{' '}
                {ticketData.funcion.fecha_celebracion ? new Date(ticketData.funcion.fecha_celebracion).toLocaleString() : 'Fecha no disponible'}
              </div>
            )}
            <div>
              <strong>Localizador:</strong> {ticketData.locator || 'Sin localizador'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Estado:</strong> {ticketData.status || 'Desconocido'}
              </div>
              <div>
                <strong>Monto:</strong> {ticketData.amount ? `$${Number(ticketData.amount).toFixed(2)} ${ticketData.currency || ''}` : 'No registrado'}
              </div>
              <div>
                <strong>Forma de pago:</strong> {ticketData.payment_method || ticketData.gateway_name || 'No registrado'}
              </div>
              <div>
                <strong>Creado:</strong>{' '}
                {ticketData.created_at ? new Date(ticketData.created_at).toLocaleString() : 'Fecha no disponible'}
              </div>
            </div>
            {ticketData.normalizedSeats?.length > 0 && (
              <Table
                dataSource={ticketData.normalizedSeats}
                rowKey={(s) => s.key}
                size="small"
                pagination={false}
                columns={[
                  { title: 'Asiento', dataIndex: 'nombre' },
                  { title: 'Mesa', dataIndex: 'mesa' },
                  { title: 'Zona', dataIndex: 'nombreZona' },
                  {
                    title: 'Precio',
                    dataIndex: 'precio',
                    render: (value) => `$${Number(value || 0).toFixed(2)}`
                  }
                ]}
              />
            )}
            {ticketData?.parsedPayments?.length > 0 && (
              <div className="mt-2">
                <strong>Pagos registrados</strong>
                <Table
                  dataSource={ticketData.parsedPayments}
                  rowKey={(p, idx) => p.id || p.reference || idx}
                  size="small"
                  pagination={false}
                  className="mt-1"
                  columns={[
                    {
                      title: 'Forma de pago',
                      dataIndex: 'method',
                      render: (value) => value || ticketData.payment_method || ticketData.gateway_name || 'N/D'
                    },
                    {
                      title: 'Importe',
                      dataIndex: 'amount',
                      render: (value) => `$${Number(value || 0).toFixed(2)}`
                    },
                    { title: 'Estado', dataIndex: 'status', render: (value) => value || ticketData.status || 'N/D' },
                    { title: 'Referencia', dataIndex: 'reference', render: (value) => value || ticketData.locator || 'N/D' }
                  ]}
                />
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button type="primary" onClick={loadTicketIntoPOS} block>
                Seleccionar
              </Button>
              {ticketData.status === 'pagado' && (
                <Button type="default" onClick={() => handleDownloadTicket(ticketData.locator)} block>
                  Descargar Ticket
                </Button>
              )}
            </div>
          </div>
        )}

        {emailSearchResults.length > 0 && (
          <Table
            dataSource={emailSearchResults}
            rowKey="locator"
            size="small"
            className="mt-4"
            columns={[
              { title: 'Localizador', dataIndex: 'locator' },
              { title: 'Evento', dataIndex: 'event_name' },
              {
                title: 'Función',
                dataIndex: 'funcion_fecha',
                render: (date) => (date ? new Date(date).toLocaleString() : '-')
              },
              { title: 'Estado', dataIndex: 'status' },
              { title: 'Fecha', dataIndex: 'created_at', render: (date) => new Date(date).toLocaleDateString() },
              {
                title: 'Acción',
                render: (_, record) => (
                  <Button type="link" onClick={() => handleTicketSearch(record.locator)}>
                    Ver
                  </Button>
                )
              }
            ]}
          />
        )}
      </Modal>

      {/* MODAL cuentas */}
      <Modal
        open={isAccountModalVisible}
        title={isAddingAccount ? 'Añadir Cuenta' : 'Buscar Cuenta'}
        onCancel={() => {
          setIsAccountModalVisible(false);
          setIsAddingAccount(false);
          setAccountSearchResults([]);
          configForm.resetFields();
        }}
        footer={null}
      >
        {isAddingAccount ? (
          <Form layout="vertical" form={configForm} onFinish={handleAddAccount}>
            <Form.Item name="login" label="Nombre" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="telefono" label="Teléfono">
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              Crear Cuenta
            </Button>
            <Button
              className="mt-2"
              onClick={() => setIsAddingAccount(false)}
              block
            >
              Volver a buscar
            </Button>
          </Form>
        ) : (
          <>
            <Input.Search
              placeholder="Buscar por email"
              enterButton="Buscar"
              onSearch={handleAccountSearch}
              loading={searchLoading}
            />
            <Button className="mt-2" onClick={() => setIsAddingAccount(true)} block icon={<UserPlus />}>
              Crear nueva cuenta
            </Button>

            {accountSearchResults.length > 0 && (
              <Table
                dataSource={accountSearchResults}
                rowKey="id"
                size="small"
                className="mt-4"
                columns={[
                  { title: 'Nombre', dataIndex: 'login' },
                  { title: 'Email', dataIndex: 'email' },
                  {
                    title: 'Acción',
                    render: (_, record) => (
                      <Button type="link" onClick={() => {
                        setSelectedClient(record);
                        setUserData(record);
                        setIsAccountModalVisible(false);
                      }}>
                        Seleccionar
                      </Button>
                    )
                  }
                ]}
              />
            )}
          </>
        )}
      </Modal>

      <Modal
        open={isConfigModalVisible}
        title="Configuración de Impresión"
        onCancel={() => setIsConfigModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfigModalVisible(false)}>
            Cancelar
          </Button>,
          <Button key="save" type="primary" onClick={() => configForm.submit()}>
            Guardar
          </Button>
        ]}
        width={600}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={(values) => {
            message.success('Configuración guardada exitosamente');
            setIsConfigModalVisible(false);
          }}
          initialValues={{
            ticketPaperType: '1',
            automaticTicketPrint: false,
            receiptPaperType: '2',
            automaticReceiptPrint: false
          }}
        >
          <div className="space-y-6">
            {/* Configuración de Tickets */}
            <div>
              <h4 className="font-semibold mb-4">Entradas</h4>
              <Form.Item
                name="ticketPaperType"
                label="Tipo de papel de tickets"
              >
                <Select>
                  <Select.Option value="1">DIN-A4</Select.Option>
                  <Select.Option value="2">80mm continuos</Select.Option>
                  <Select.Option value="28">139x50</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="automaticTicketPrint"
                valuePropName="checked"
              >
                <Checkbox>Impresión automática de tickets</Checkbox>
              </Form.Item>
            </div>

            {/* Configuración de Recibos */}
            <div>
              <h4 className="font-semibold mb-4">Recibo</h4>
              <Form.Item
                name="receiptPaperType"
                label="Tipo de papel de recibos"
              >
                <Select>
                  <Select.Option value="2">80mm continuos</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="automaticReceiptPrint"
                valuePropName="checked"
              >
                <Checkbox>Impresión automática de recibos</Checkbox>
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div >
  );
};

export default LeftMenu;


