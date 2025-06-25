import React, { useState } from 'react';
import { Modal, Input, Card, Table, Tag, Form, Button, message } from 'antd';
import { AiOutlineSearch, AiOutlineUserAdd, AiOutlineClose, AiOutlineEdit } from 'react-icons/ai';
import { supabase, supabaseAdmin } from '../../services/supabaseClient';
import { getUserByEmail } from '../../services/adminUsers';

const LeftMenu = ({ onAddClientClick, selectedClient, onClientRemove, setCarrito, setSelectedClient, onFunctionSelect, setSelectedEvent }) => {
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState('locator');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchResults, setEmailSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [userData, setUserData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [eventData, setEventData] = useState(null);

  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [accountSearchResults, setAccountSearchResults] = useState([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [form] = Form.useForm();

  const handleTicketSearch = async (locator) => {
    setSearchLoading(true);
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*, user:profiles(*), seats, event:event_id(*), funcion:funcion_id(fecha)')
        .eq('locator', locator)
        .single();

      if (error || !payment) throw new Error('Ticket no encontrado');

      setTicketData(payment);

      if (payment.user) {
        setUserData(payment.user);
        setSelectedClient(payment.user);
      }

      if (payment.seats && setCarrito) {
        setCarrito(payment.seats.map((seat) => ({
          _id: seat._id || seat.id,
          nombre: seat.name,
          precio: seat.price || 0,
          nombreMesa: seat.mesa?.nombre || '',
          zona: seat.zona?.nombre || 'General',
          status: payment.status,
          paymentId: payment.id,
          locator: payment.locator,
          funcionId: payment.funcion_id
        })));
      }

      if (payment.event && setSelectedEvent) {
        setEventData(payment.event);
        setSelectedEvent(payment.event);
      }

      if (payment.funcion && typeof onFunctionSelect === 'function') {
        await onFunctionSelect(payment.funcion_id);
      }

      setIsSearchModalVisible(false);
      message.success('Ticket cargado correctamente');
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDownloadTicket = (locator) => {
    if (locator) {
      window.open(`${process.env.REACT_APP_API_URL}/api/payments/${locator}/download`, '_blank');
    }
  };

  const handleEmailSearch = async (email) => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('locator, status, created_at')
        .eq('email', email);

      if (error) throw error;
      setEmailSearchResults(data || []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, login, telefono, empresa')
        .eq('id', userResp.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        setAccountSearchResults([]);
        message.info('Usuario no encontrado y/o campo vacío');
        return;
      }

      setAccountSearchResults([
        { ...data, email: userResp.user.email }
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

  return (
    <div className="p-4 space-y-4 bg-white shadow rounded">
      <Button icon={<AiOutlineSearch />} onClick={() => setIsSearchModalVisible(true)} block>
        Buscar Tickets
      </Button>

      <Button
        icon={<AiOutlineUserAdd />}
        onClick={() => setIsAccountModalVisible(true)}
        block
      >
        Buscar/Añadir Cuenta
      </Button>

      {userData && (
        <Card size="small" className="border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{userData.login}</div>
              <div className="text-sm text-gray-500">{userData.empresa || 'Sin empresa'}</div>
            </div>
            <div className="flex gap-2">
              <Button size="small" icon={<AiOutlineEdit />} onClick={() => setIsAccountModalVisible(true)} />
              <Button size="small" icon={<AiOutlineClose />} danger onClick={handleClearClient} />
            </div>
          </div>
        </Card>
      )}

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

        {searchMode === 'email' && emailSearchResults.length > 0 && (
          <Table
            dataSource={emailSearchResults}
            rowKey="locator"
            size="small"
            className="mt-4"
            columns={[
              { title: 'Localizador', dataIndex: 'locator' },
              {
                title: 'Fecha',
                dataIndex: 'created_at',
                render: date => new Date(date).toLocaleDateString()
              },
              {
                title: 'Estado',
                dataIndex: 'status',
                render: status => (
                  <Tag color={status === 'pagado' ? 'green' : 'orange'}>{status}</Tag>
                )
              },
              {
                title: 'Acciones',
                render: (_, record) => (
                  <>
                    <Button type="link" onClick={() => handleTicketSearch(record.locator)}>
                      Cargar
                    </Button>
                    {record.status === 'pagado' && (
                      <Button type="link" onClick={() => handleDownloadTicket(record.locator)}>
                        Descargar
                      </Button>
                    )}
                  </>
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
          form.resetFields();
        }}
        footer={null}
      >
        {isAddingAccount ? (
          <Form layout="vertical" form={form} onFinish={handleAddAccount}>
            <Form.Item name="login" label="Nombre" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="telefono" label="Teléfono">
              <Input />
            </Form.Item>
            <Button htmlType="submit" block>
              Crear Cuenta
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
            <Button className="mt-2" onClick={() => setIsAddingAccount(true)} block icon={<AiOutlineUserAdd />}>
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
    </div>
  );
};

export default LeftMenu;
