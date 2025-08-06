import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Table, 
  Modal, 
  Form, 
  message, 
  Select, 
  InputNumber,
  Space,
  Tag,
  Tooltip,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Option } = Select;
const { TextArea } = Input;

const PlantillaProductos = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Cargar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('id, nombre, fecha_evento, recintos(nombre)')
          .order('fecha_evento', { ascending: false });

        if (error) throw error;
        setEventos(data || []);
      } catch (error) {
        console.error('Error cargando eventos:', error);
        message.error('Error al cargar eventos');
      }
    };

    fetchEventos();
  }, []);

  // Cargar productos cuando se selecciona un evento
  useEffect(() => {
    if (eventoSeleccionado) {
      loadProductos();
      loadPlantillas();
    } else {
      setProductos([]);
      setPlantillas([]);
    }
  }, [eventoSeleccionado]);

  const loadProductos = async () => {
    if (!eventoSeleccionado) return;

    try {
      const { data, error } = await supabase
        .from('plantillas_productos')
        .select('*')
        .eq('evento_id', eventoSeleccionado)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      message.error('Error al cargar productos');
    }
  };

  const loadPlantillas = async () => {
    if (!eventoSeleccionado) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plantillas_productos_template')
        .select('*')
        .eq('evento_id', eventoSeleccionado)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setPlantillas(data || []);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      message.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (eventId) => {
    setEventoSeleccionado(eventId);
  };

  const handleCreatePlantilla = () => {
    setEditingPlantilla(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditPlantilla = (plantilla) => {
    setEditingPlantilla(plantilla);
    form.setFieldsValue({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      activo: plantilla.activo,
      productos: plantilla.productos || []
    });
    setModalVisible(true);
  };

  const handleDeletePlantilla = async (plantilla) => {
    try {
      const { error } = await supabase
        .from('plantillas_productos_template')
        .update({ activo: false })
        .eq('id', plantilla.id);

      if (error) throw error;
      message.success('Plantilla eliminada correctamente');
      loadPlantillas();
    } catch (error) {
      console.error('Error eliminando plantilla:', error);
      message.error('Error al eliminar plantilla');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const plantillaData = {
        ...values,
        evento_id: eventoSeleccionado,
        activo: true
      };

      if (editingPlantilla) {
        // Actualizar plantilla existente
        const { error } = await supabase
          .from('plantillas_productos_template')
          .update(plantillaData)
          .eq('id', editingPlantilla.id);

        if (error) throw error;
        message.success('Plantilla actualizada correctamente');
      } else {
        // Crear nueva plantilla
        const { error } = await supabase
          .from('plantillas_productos_template')
          .insert([plantillaData]);

        if (error) throw error;
        message.success('Plantilla creada correctamente');
      }

      setModalVisible(false);
      loadPlantillas();
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      message.error('Error al guardar plantilla');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Productos',
      dataIndex: 'productos',
      key: 'productos',
      render: (productos) => {
        if (!productos || !Array.isArray(productos)) return '-';
        return (
          <div>
            {productos.map((prod, index) => (
              <Tag key={index} color="blue" className="mb-1">
                {prod.nombre} - ${prod.precio?.toFixed(2) || '0.00'}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditPlantilla(record)}
          >
            Editar
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeletePlantilla(record)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plantillas de Productos
          </h1>
          <p className="text-gray-600">
            Crea plantillas de productos para asignar a funciones
          </p>
        </div>

        {/* Selector de Evento */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Evento
              </label>
              <Select
                placeholder="Busca y selecciona un evento"
                showSearch
                optionFilterProp="children"
                value={eventoSeleccionado}
                onChange={handleEventSelect}
                style={{ width: '100%' }}
                loading={!eventos.length}
              >
                {eventos.map((evento) => (
                  <Option key={evento.id} value={evento.id}>
                    <div>
                      <div className="font-medium">{evento.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(evento.fecha_evento).toLocaleDateString()} - 
                        {evento.recintos?.nombre}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            {eventoSeleccionado && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePlantilla}
              >
                Crear Plantilla
              </Button>
            )}
          </div>
        </Card>

        {/* Lista de Plantillas */}
        {eventoSeleccionado && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Plantillas Disponibles
              </h2>
              {plantillas.length === 0 && !loading && (
                <p className="text-gray-500 mt-2">
                  No hay plantillas disponibles para este evento
                </p>
              )}
            </div>

            <Table
              columns={columns}
              dataSource={plantillas}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} de ${total} plantillas`,
              }}
            />
          </Card>
        )}

        {/* Modal para Crear/Editar Plantilla */}
        <Modal
          title={editingPlantilla ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              activo: true,
              productos: []
            }}
          >
            <Form.Item
              name="nombre"
              label="Nombre de la Plantilla"
              rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
            >
              <Input placeholder="Ej: Plantilla Básica" />
            </Form.Item>

            <Form.Item
              name="descripcion"
              label="Descripción"
              rules={[{ required: true, message: 'Por favor ingresa la descripción' }]}
            >
              <TextArea
                rows={3}
                placeholder="Describe la plantilla..."
              />
            </Form.Item>

            <Divider>Productos de la Plantilla</Divider>

            <Form.List name="productos">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="border p-4 rounded mb-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Form.Item
                          {...restField}
                          name={[name, 'producto_id']}
                          label="Producto"
                          rules={[{ required: true, message: 'Selecciona un producto' }]}
                        >
                          <Select placeholder="Selecciona un producto">
                            {productos.map((producto) => (
                              <Option key={producto.id} value={producto.id}>
                                {producto.nombre} - ${producto.precio_base?.toFixed(2) || '0.00'}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'precio']}
                          label="Precio"
                          rules={[{ required: true, message: 'Ingresa el precio' }]}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="0.00"
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'impuesto']}
                          label="Impuesto (%)"
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            step={0.01}
                            style={{ width: '100%' }}
                            placeholder="0.00"
                          />
                        </Form.Item>
                      </div>

                      <Button
                        type="link"
                        danger
                        onClick={() => remove(name)}
                        className="mt-2"
                      >
                        Eliminar Producto
                      </Button>
                    </div>
                  ))}

                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Agregar Producto
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.Item
              name="activo"
              label="Estado"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>Activo</Option>
                <Option value={false}>Inactivo</Option>
              </Select>
            </Form.Item>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPlantilla ? 'Actualizar' : 'Crear'} Plantilla
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default PlantillaProductos; 