import React, { useState } from 'react';
import { Modal, Input, Table, Button, message } from '../../../utils/antdComponents';
import { UserPlus } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../../supabaseClient';

const ClientModals = ({
  isSearchModalVisible,
  searchResults,
  paymentResults,
  searchLoading,
  onSearchCancel,
  onClientSelect,
  onAddClient,
  handleUnifiedSearch,
  clearSearchResults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      message.warning('Por favor ingresa un t©rmino de bºsqueda');
      return;
    }

    try {
      if (handleUnifiedSearch && typeof handleUnifiedSearch === 'function') {
        const result = await handleUnifiedSearch(searchTerm);
      } else {
        // Fallback to direct search if handleUnifiedSearch is not provided
        const { data, error } = await supabase
          .from('profiles')
          .select('id, login, nombre, apellido, telefono, email:login')
          .or(
            `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`
          );

        if (error) throw error;

        const mappedResults = data.map((p) => ({
          _id: p.id,
          nombre: p.login,
          email: p.email || p.login || '',
          telefono: p.telefono,
        }));

        if (mappedResults.length === 0) {
          message.info('No se encontraron clientes con ese criterio');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error(error.message || 'Error en la bºsqueda');
    }
  };

  const resetSearch = () => {
    setSearchTerm('');
    setIsAddingAccount(false);
    setNewClientForm({ nombre: '', email: '', telefono: '' });
    if (typeof clearSearchResults === 'function') clearSearchResults();
  };

  const handleAddClient = async () => {
    if (!newClientForm.nombre || !newClientForm.email) {
      message.warning('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!supabaseAdmin) {
      message.error('Cliente admin no disponible. No se puede crear usuario.');
      console.error('Admin client (supabaseAdmin) is not initialized. Ensure Service Role Key is configured.');
      return;
    }

    try {
      const { data: userResp, error } = await supabaseAdmin.auth.admin.createUser({
        email: newClientForm.email,
        password: 'defaultPassword',
        email_confirm: true,
        user_metadata: { password_set: false },
      });

      if (error) throw error;

      await new Promise((res) => setTimeout(res, 1500));

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          login: newClientForm.email,
          nombre: newClientForm.nombre,
          telefono: newClientForm.telefono,
          permisos: { role: 'usuario' },
        })
        .eq('id', userResp.user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      message.success('Usuario creado con ©xito');
      setNewClientForm({ nombre: '', email: '', telefono: '' });
      setIsAddingAccount(false);
    } catch (error) {
      console.error('Error creating client:', error);
      message.error(`Error al crear el usuario: ${error.message}`);
    }
  };

  const clientColumns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Tel©fono',
      dataIndex: 'telefono',
      key: 'telefono',
    },
    {
      title: 'Acci³n',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => onClientSelect(record)}
          className="text-blue-600 hover:text-blue-800"
        >
          Seleccionar
        </Button>
      ),
      className: 'text-center',
      width: 100,
    },
  ];

  return (
    <Modal
      title="Buscar Cuenta"
      open={isSearchModalVisible}
      onCancel={() => {
        resetSearch();
        if (typeof onSearchCancel === 'function') {
          onSearchCancel();
        } else {
          console.error('Œ [ClientModals] onSearchCancel no es una funci³n:', onSearchCancel);
        }
      }}
      footer={null}
      width={600}
      centered
    >
      <div className="space-y-4">
        {/* Barra de bºsqueda */}
        <Input.Search
          placeholder="Buscar por email"
          enterButton="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          loading={searchLoading}
          allowClear
        />

        {/* Bot³n para crear nueva cuenta */}
        <Button
          type="default"
          block
          icon={<UserPlus />}
          onClick={() => setIsAddingAccount(true)}
        >
          Crear nueva cuenta
        </Button>

        {/* Formulario para crear nueva cuenta */}
        {isAddingAccount && (
          <div className="border p-4 rounded-lg bg-gray-50 space-y-3">
            <h4 className="font-medium">Crear Nueva Cuenta</h4>
            <Input
              placeholder="Nombre completo"
              value={newClientForm.nombre}
              onChange={(e) => setNewClientForm({ ...newClientForm, nombre: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newClientForm.email}
              onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
            />
            <Input
              placeholder="Tel©fono (opcional)"
              value={newClientForm.telefono}
              onChange={(e) => setNewClientForm({ ...newClientForm, telefono: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                type="primary"
                onClick={handleAddClient}
                disabled={!newClientForm.nombre || !newClientForm.email}
              >
                Crear
              </Button>
              <Button onClick={() => setIsAddingAccount(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Tabla de resultados */}
        {searchResults?.length > 0 && (
          <Table
            columns={clientColumns}
            dataSource={searchResults}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
            size="small"
          />
        )}
      </div>
    </Modal>
  );
};

export default ClientModals;


