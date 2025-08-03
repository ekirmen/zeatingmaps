import React, { useState } from 'react';
import { Modal, Input, Table, Tag, Tabs, Form, Button, Divider, message } from 'antd';
import { AiOutlineSearch, AiOutlineUserAdd } from 'react-icons/ai';
import { supabase } from '../../../supabaseClient';
import { supabaseAdmin } from '../../../supabaseClient';

const ClientModals = ({
  isSearchModalVisible,
  paymentResults,
  onSearchCancel,
  onClientSelect,
  onAddClient,
  clearSearchResults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [form] = Form.useForm();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      message.warning('Please enter a search term');
      return;
    }

    try {
      setSearchLoading(true);

      // IMPORTANT: 'profiles_with_auth' is likely a custom view or function.
      // Ensure it exists and is accessible via RLS for the 'anon' role
      // if this search is meant for public or unauthenticated users.
      // If it requires admin privileges, ensure supabaseAdmin is used and available.
      let { data, error } = await supabase
        .from('profiles_with_auth')
        .select('id, login, nombre, telefono, empresa, email')
        .or(
          `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );

      if (error && error.code === '42P01') {
        ({ data, error } = await supabase
          .from('profile_view')
          .select('id, login, nombre, telefono, empresa, email')
          .or(
            `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
          ));
      }

      if (error) throw error;

      const mappedResults = data.map((p) => ({
        _id: p.id,
        nombre: p.login,
        email: p.email || '',
        telefono: p.telefono,
      }));

      setSearchResults(mappedResults);

      if (mappedResults.length === 0) {
        message.info('No clients found with that criteria');
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error(error.message || 'Search error');
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    if (typeof clearSearchResults === 'function') clearSearchResults();
  };

  const handleAddClient = async (values) => {
    // Check if supabaseAdmin is available before using it
    if (!supabaseAdmin) {
      message.error('Admin client not available. Cannot create user.');
      console.error('Admin client (supabaseAdmin) is not initialized. Ensure Service Role Key is configured.');
      return;
    }

    try {
      const { data: userResp, error } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        password: values.password || 'defaultPassword',
        email_confirm: true,
        user_metadata: { password_set: !!values.password },
      });

      if (error) throw error;

      // Add a small delay to ensure user creation propagates before profile update
      await new Promise((res) => setTimeout(res, 1500));

      // Use supabaseAdmin for updating profiles related to admin operations
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          login: values.email,
          nombre: values.nombre,
          telefono: values.telefono,
          permisos: { role: 'usuario' }, // Ensure 'permisos' column is JSONB type
        })
        .eq('id', userResp.user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      message.success('Usuario creado con éxito');
      form.resetFields();
      setActiveTab('search');
      if (typeof onAddClient === 'function') onAddClient(profileData);
    } catch (error) {
      console.error('Error creating client:', error);
      message.error(`Error al crear el usuario: ${error.message}`);
    }
  };

  const paymentColumns = [
    {
      title: 'Locator',
      dataIndex: 'locator',
      key: 'locator',
      className: 'whitespace-nowrap',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount.toFixed(2)}`,
      className: 'text-right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
      className: 'whitespace-nowrap',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      className: 'whitespace-nowrap',
    },
  ];

  const clientColumns = [
    {
      title: 'Login',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true,
      className: 'whitespace-nowrap',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'telefono',
      key: 'telefono',
      className: 'whitespace-nowrap',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => onClientSelect(record)}
          className="text-blue-600 hover:text-blue-800"
        >
          Select
        </Button>
      ),
      className: 'text-center',
      width: 100,
    },
  ];

  const items = [
    {
      key: 'search',
      label: 'Search Clients',
      children: (
        <>
          <Input.Search
            placeholder="Search by name, email or phone"
            enterButton={
              <>
                <AiOutlineSearch className="mr-1" /> Search
              </>
            }
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            loading={searchLoading}
            allowClear
            className="mb-6"
          />

          {paymentResults?.length > 0 && (
            <>
              <Divider orientation="left">Payment Results</Divider>
              <Table
                columns={paymentColumns}
                dataSource={paymentResults}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                className="mb-6"
                scroll={{ x: true }}
                size="small"
              />
            </>
          )}

          {searchResults?.length > 0 && (
            <>
              <Divider orientation="left">Client Results</Divider>
              <Table
                columns={clientColumns}
                dataSource={searchResults}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: true }}
                size="small"
              />
            </>
          )}
        </>
      ),
    },
    {
      key: 'add',
      label: 'Add Client',
      children: (
        <Form form={form} layout="vertical" onFinish={handleAddClient} className="space-y-6">
          <Form.Item
            name="nombre"
            label="Name"
            rules={[{ required: true, message: 'Please input client name!' }]}
          >
            <Input className="rounded-md" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input client email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input className="rounded-md" />
          </Form.Item>
          <Form.Item
            name="telefono"
            label="Phone"
            rules={[{ required: true, message: 'Please input client phone!' }]}
          >
            <Input className="rounded-md" />
          </Form.Item>
          <Form.Item>
            <Button
              type="default"
              block
              htmlType="submit"
              icon={<AiOutlineUserAdd />}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Add Client
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Modal
      title="Client Management"
      open={isSearchModalVisible}
      onCancel={() => {
        resetSearch();
        onSearchCancel();
      }}
      footer={null}
      width="90vw"
      centered
      styles={{ body: { padding: '1rem 1.5rem' } }}
      destroyOnHidden // <-- Replaced destroyOnClose with destroyOnHidden
      className="max-w-3xl mx-auto"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </Modal>
  );
};

export default ClientModals;
