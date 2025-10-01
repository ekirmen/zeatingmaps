import React, { useState } from 'react';
import { Modal, Input, Table, Button, message } from 'antd';
import { AiOutlineUserAdd } from 'react-icons/ai';
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
  console.log('🔍 [ClientModals] Props recibidas:', {
    isSearchModalVisible,
    searchResults: searchResults?.length || 0,
    paymentResults: paymentResults?.length || 0,
    searchLoading,
    onSearchCancel: typeof onSearchCancel,
    onClientSelect: typeof onClientSelect,
    handleUnifiedSearch: typeof handleUnifiedSearch
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  const handleSearch = async () => {
    console.log('🔍 [ClientModals] Iniciando búsqueda con término:', searchTerm);
    console.log('🔍 [ClientModals] handleUnifiedSearch type:', typeof handleUnifiedSearch);
    if (!searchTerm.trim()) {
      message.warning('Por favor ingresa un término de búsqueda');
      return;
    }

    try {
      if (handleUnifiedSearch && typeof handleUnifiedSearch === 'function') {
        console.log('🔍 [ClientModals] Usando handleUnifiedSearch');
        const result = await handleUnifiedSearch(searchTerm);
        console.log('🔍 [ClientModals] Resultado de búsqueda:', result);
      } else {
        // Fallback to direct search if handleUnifiedSearch is not provided
        const { data, error } = await supabase
          .from('profiles')
          .select('id, login, nombre, apellido, telefono, email')
          .or(
            `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
          );

        if (error) throw error;

        const mappedResults = data.map((p) => ({
          _id: p.id,
          nombre: p.login,
          email: p.email || '',
          telefono: p.telefono,
        }));

        if (mappedResults.length === 0) {
          message.info('No se encontraron clientes con ese criterio');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error(error.message || 'Error en la búsqueda');
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

      message.success('Usuario creado con éxito');
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
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
    },
    {
      title: 'Acción',
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
        console.log('🔍 [ClientModals] onCancel llamado');
        console.log('🔍 [ClientModals] onSearchCancel type:', typeof onSearchCancel);
        resetSearch();
        if (typeof onSearchCancel === 'function') {
          onSearchCancel();
        } else {
          console.error('❌ [ClientModals] onSearchCancel no es una función:', onSearchCancel);
        }
      }}
      footer={null}
      width={600}
      centered
    >
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <Input.Search
          placeholder="Buscar por email"
          enterButton="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          loading={searchLoading}
          allowClear
        />

        {/* Botón para crear nueva cuenta */}
        <Button 
          type="default" 
          block 
          icon={<AiOutlineUserAdd />}
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
              onChange={(e) => setNewClientForm({...newClientForm, nombre: e.target.value})}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newClientForm.email}
              onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})}
            />
            <Input
              placeholder="Teléfono (opcional)"
              value={newClientForm.telefono}
              onChange={(e) => setNewClientForm({...newClientForm, telefono: e.target.value})}
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
