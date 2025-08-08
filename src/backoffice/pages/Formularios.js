import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, message, Badge, Tabs, Switch, Select } from 'antd';
import { FormOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { TabPane } = Tabs;
const { Option } = Select;

const Formularios = () => {
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar formularios (simulado)
      const formulariosSimulados = [
        {
          id: 1,
          nombre: 'Registro de Cliente',
          descripcion: 'Formulario para registro de nuevos clientes',
          estado: 'activo',
          campos: [
            { nombre: 'nombre', tipo: 'texto', requerido: true },
            { nombre: 'email', tipo: 'email', requerido: true },
            { nombre: 'telefono', tipo: 'texto', requerido: false }
          ],
          created_at: '2024-01-15',
          submissions_count: 25
        },
        {
          id: 2,
          nombre: 'Encuesta de Satisfacción',
          descripcion: 'Encuesta para medir satisfacción del cliente',
          estado: 'activo',
          campos: [
            { nombre: 'calificacion', tipo: 'numero', requerido: true },
            { nombre: 'comentarios', tipo: 'textarea', requerido: false }
          ],
          created_at: '2024-01-10',
          submissions_count: 15
        }
      ];

      // Cargar submissions (simulado)
      const submissionsSimulados = [
        {
          id: 1,
          form_id: 1,
          form_nombre: 'Registro de Cliente',
          datos: { nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '123456789' },
          created_at: '2024-01-15T10:30:00'
        },
        {
          id: 2,
          form_id: 1,
          form_nombre: 'Registro de Cliente',
          datos: { nombre: 'María García', email: 'maria@email.com', telefono: '987654321' },
          created_at: '2024-01-14T15:45:00'
        }
      ];

      setForms(formulariosSimulados);
      setSubmissions(submissionsSimulados);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (values) => {
    try {
      const formData = {
        nombre: values.nombre,
        descripcion: values.descripcion,
        estado: 'activo',
        campos: values.campos || [],
        created_at: new Date().toISOString()
      };

      // Simular creación
      const newForm = {
        id: Date.now(),
        ...formData,
        submissions_count: 0
      };

      setForms([newForm, ...forms]);
      message.success('Formulario creado exitosamente');
      setIsFormModalVisible(false);
      formForm.resetFields();
    } catch (error) {
      console.error('Error creating form:', error);
      message.error('Error al crear formulario');
    }
  };

  const handleEditForm = async (values) => {
    try {
      const updatedForms = forms.map(form => 
        form.id === selectedForm.id 
          ? { ...form, ...values }
          : form
      );

      setForms(updatedForms);
      message.success('Formulario actualizado exitosamente');
      setIsFormModalVisible(false);
      setIsEditMode(false);
      setSelectedForm(null);
      formForm.resetFields();
    } catch (error) {
      console.error('Error updating form:', error);
      message.error('Error al actualizar formulario');
    }
  };

  const handleDeleteForm = async (formId) => {
    try {
      const updatedForms = forms.filter(form => form.id !== formId);
      setForms(updatedForms);
      message.success('Formulario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting form:', error);
      message.error('Error al eliminar formulario');
    }
  };

  const openEditModal = (form) => {
    setSelectedForm(form);
    setIsEditMode(true);
    setIsFormModalVisible(true);
    formForm.setFieldsValue({
      nombre: form.nombre,
      descripcion: form.descripcion,
      campos: form.campos
    });
  };

  const formColumns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'activo' ? 'green' : 'red'}>
          {estado}
        </Tag>
      ),
    },
    {
      title: 'Campos',
      dataIndex: 'campos',
      key: 'campos',
      render: (campos) => campos?.length || 0,
    },
    {
      title: 'Submissions',
      dataIndex: 'submissions_count',
      key: 'submissions_count',
    },
    {
      title: 'Fecha creación',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (fecha) => new Date(fecha).toLocaleDateString(),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: `Formulario: ${record.nombre}`,
                content: (
                  <div>
                    <p><strong>Descripción:</strong> {record.descripcion}</p>
                    <p><strong>Estado:</strong> {record.estado}</p>
                    <p><strong>Campos:</strong></p>
                    <ul>
                      {record.campos?.map((campo, index) => (
                        <li key={index}>
                          {campo.nombre} ({campo.tipo}) {campo.requerido ? '(Requerido)' : ''}
                        </li>
                      ))}
                    </ul>
                    <p><strong>Submissions:</strong> {record.submissions_count}</p>
                  </div>
                ),
              });
            }}
          >
            Ver
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Editar
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteForm(record.id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  const submissionColumns = [
    {
      title: 'Formulario',
      dataIndex: 'form_nombre',
      key: 'form_nombre',
    },
    {
      title: 'Datos',
      dataIndex: 'datos',
      key: 'datos',
      render: (datos) => (
        <div>
          {Object.entries(datos).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (fecha) => new Date(fecha).toLocaleString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Formularios - Gestión de Formularios</h1>
          <p className="text-gray-600">Creación y gestión de formularios personalizados</p>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setIsEditMode(false);
              setSelectedForm(null);
              setIsFormModalVisible(true);
              formForm.resetFields();
            }}
            type="primary"
          >
            Crear Formulario
          </Button>
        </div>
      </div>

      <Tabs defaultActiveKey="forms">
        <TabPane tab="Formularios" key="forms">
          <Card title="Formularios Disponibles" extra={<Badge count={forms.length} />}>
            <Table
              dataSource={forms}
              columns={formColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Submissions" key="submissions">
          <Card title="Submissions Recibidos" extra={<Badge count={submissions.length} />}>
            <Table
              dataSource={submissions}
              columns={submissionColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal para crear/editar formulario */}
      <Modal
        title={isEditMode ? "Editar Formulario" : "Crear Nuevo Formulario"}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false);
          setIsEditMode(false);
          setSelectedForm(null);
          formForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={formForm}
          layout="vertical"
          onFinish={isEditMode ? handleEditForm : handleCreateForm}
        >
          <Form.Item
            name="nombre"
            label="Nombre del Formulario"
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input placeholder="Nombre del formulario" />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: 'Por favor ingrese la descripción' }]}
          >
            <Input.TextArea rows={3} placeholder="Descripción del formulario" />
          </Form.Item>

          <Form.Item
            name="campos"
            label="Campos del Formulario"
          >
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Nombre del campo" style={{ width: '40%' }} />
                <Select placeholder="Tipo" style={{ width: '30%' }}>
                  <Option value="texto">Texto</Option>
                  <Option value="email">Email</Option>
                  <Option value="numero">Número</Option>
                  <Option value="textarea">Área de texto</Option>
                  <Option value="select">Selector</Option>
                </Select>
                <Switch size="small" /> Requerido
              </div>
              <Button size="small" icon={<PlusOutlined />}>
                Agregar Campo
              </Button>
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {isEditMode ? 'Actualizar Formulario' : 'Crear Formulario'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Formularios;
