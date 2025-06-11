import React, { useState } from 'react';
import { Modal, Input, Table, Tag, Tabs, Form, Button, Divider, message } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';

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
      const response = await fetch(
        `http://localhost:5000/api/user/search?term=${searchTerm.trim()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error searching clients');
      }

      const data = await response.json();

      const mappedResults = data.map((user) => ({
        _id: user._id,
        nombre: user.login,
        email: user.email,
        telefono: user.telefono,
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
    if (typeof clearSearchResults === 'function') {
      clearSearchResults();
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
        <Tag color={status === 'paid' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
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

  const handleAddClient = async (values) => {
    try {
      const clientData = {
        login: values.email,
        password: 'defaultPassword',
        email: values.email,
        telefono: values.telefono,
        perfil: 'cliente',
        empresa: values.empresa || 'Sin empresa',
      };

      const response = await fetch('http://localhost:5000/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (response.status === 409) {
        throw new Error('El usuario ya existe');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
      }

      await response.json();

      message.success('Usuario creado con éxito');
      form.resetFields();
      setActiveTab('search');
    } catch (error) {
      console.error('Error creating client:', error);
      message.error(`Error al crear el usuario: ${error.message}`);
    }
  };

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
                <SearchOutlined /> Search
              </>
            }
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            loading={searchLoading}
            allowClear
            onClear={resetSearch}
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
          <Form.Item name="empresa" label="Company">
            <Input className="rounded-md" />
          </Form.Item>
          <Form.Item>
            <Button type="default" variant="outlined" block htmlType="submit" icon={<UserAddOutlined />}>
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
      bodyStyle={{ padding: '1rem 1.5rem' }}
      destroyOnClose
      className="max-w-3xl mx-auto"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </Modal>
  );
};

export default ClientModals;
