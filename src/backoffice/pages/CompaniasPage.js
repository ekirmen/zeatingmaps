// pages/CompaniasPage.js
import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title } = Typography;

const CompaniasPage = () => {
  const [companias, setCompanias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompania, setEditingCompania] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCompanias();
  }, []);

  const loadCompanias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.warn('Error loading compañías:', error);
        setCompanias([]);
        return;
      }

      setCompanias(data || []);
    } catch (error) {
      console.error('Error loading compañías:', error);
      message.error('Error al cargar compañías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCompania) {
        // Actualizar compañía existente
        const { error } = await supabase
          .from('companias')
          .update(values)
          .eq('id', editingCompania.id);

        if (error) throw error;
        message.success('Compañía actualizada correctamente');
      } else {
        // Crear nueva compañía
        const { error } = await supabase
          .from('companias')
          .insert([values]);

        if (error) throw error;
        message.success('Compañía creada correctamente');
      }

      setModalVisible(false);
      setEditingCompania(null);
      form.resetFields();
      loadCompanias();
    } catch (error) {
      console.error('Error saving compañía:', error);
      message.error('Error al guardar compañía');
    }
  };

  const handleEdit = (record) => {
    setEditingCompania(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('companias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Compañía eliminada correctamente');
      loadCompanias();
    } catch (error) {
      console.error('Error deleting compañía:', error);
      message.error('Error al eliminar compañía');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>Compañías</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCompania(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Nueva Compañía
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={companias}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />

        <Modal
          title={editingCompania ? 'Editar Compañía' : 'Nueva Compañía'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingCompania(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="nombre"
              label="Nombre"
              rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Por favor ingresa el email' },
                { type: 'email', message: 'Email inválido' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="telefono"
              label="Teléfono"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="direccion"
              label="Dirección"
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingCompania ? 'Actualizar' : 'Crear'}
                </Button>
                <Button onClick={() => {
                  setModalVisible(false);
                  setEditingCompania(null);
                  form.resetFields();
                }}>
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default CompaniasPage;
