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
  Upload,
  Image,
  Space,
  Tag,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UploadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const { Option } = Select;
const { TextArea } = Input;

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { addTenantFilter, addTenantToInsert } = useTenantFilter();

  // Cargar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        // Consultar eventos directamente (sin JOIN inicial para evitar errores de sintaxis)
        let query = supabase
          .from('eventos')
          .select('id, nombre, recinto_id, created_at')
          .eq('activo', true);
        
        // Aplicar filtro de tenant
        query = addTenantFilter(query);
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error cargando eventos:', error);
          message.error('Error al cargar eventos');
          setEventos([]);
          return;
        }

        // Procesar datos: obtener la fecha más próxima de las funciones activas para cada evento
        const eventosWithFecha = await Promise.all(
          (data || []).map(async (evento) => {
            // Obtener la primera función activa para este evento
            const { data: funcionData } = await supabase
              .from('funciones')
              .select('fecha_celebracion')
              .eq('evento_id', evento.id)
              .eq('activo', true)
              .order('fecha_celebracion', { ascending: true })
              .limit(1)
              .maybeSingle();
            
            return {
              ...evento,
              fecha_celebracion: funcionData?.fecha_celebracion || null
            };
          })
        );
        
        setEventos(eventosWithFecha);
      } catch (error) {
        console.error('Error cargando eventos:', error);
        message.error('Error al cargar eventos');
      }
    };

    fetchEventos();
  }, [addTenantFilter]);

  // Cargar productos cuando se selecciona un evento
  useEffect(() => {
    if (eventoSeleccionado) {
      loadProductos();
    } else {
      setProductos([]);
    }
  }, [eventoSeleccionado]);

  const loadProductos = async () => {
    if (!eventoSeleccionado) return;

    setLoading(true);
    try {
      // 🛍️ CARGAR PRODUCTOS DESDE MÚLTIPLES TABLAS
      // Plantillas de productos (tabla principal)
      let plantillasQuery = supabase
        .from('plantillas_productos')
        .select('*')
        .eq('evento_id', eventoSeleccionado)
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      plantillasQuery = addTenantFilter(plantillasQuery);
      
      // Productos generales (si la tabla existe, con manejo de errores)
      let productosQuery = supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      productosQuery = addTenantFilter(productosQuery);
      
      // Productos específicos del evento (si la tabla existe, con manejo de errores)
      let productosEventosQuery = supabase
        .from('productos_eventos')
        .select(`
          *,
          productos:producto_id(nombre, descripcion, precio_base, categoria)
        `)
        .eq('evento_id', eventoSeleccionado)
        .eq('activo', true)
        .order('created_at', { ascending: false });
      
      productosEventosQuery = addTenantFilter(productosEventosQuery);
      
      const [plantillasData, productosData, productosEventosData] = await Promise.all([
        plantillasQuery,
        productosQuery.catch(err => {
          // Si la tabla no existe o hay error, retornar estructura vacía
          if (err.code === 'PGRST116' || err.message?.includes('does not exist')) {
            return { data: [], error: null };
          }
          return { data: null, error: err };
        }),
        productosEventosQuery.catch(err => {
          // Si la tabla no existe o hay error, retornar estructura vacía
          if (err.code === 'PGRST116' || err.message?.includes('does not exist')) {
            return { data: [], error: null };
          }
          return { data: null, error: err };
        })
      ]);

      // ✅ COMBINAR PRODUCTOS DE TODAS LAS FUENTES
      let allProductos = [];

      // Agregar plantillas de productos (tabla principal)
      if (plantillasData.data && !plantillasData.error) {
        const plantillasWithSource = plantillasData.data.map(p => ({
          ...p,
          source: 'plantillas_productos',
          tipo: 'plantilla'
        }));
        allProductos = [...allProductos, ...plantillasWithSource];
        console.log('✅ Plantillas de productos cargadas:', plantillasWithSource.length);
      } else if (plantillasData.error) {
        console.error('❌ Error cargando plantillas_productos:', plantillasData.error);
      }

      // Agregar productos generales (si la tabla existe y no hay error)
      if (productosData.data && !productosData.error) {
        const productosWithSource = productosData.data.map(p => ({
          ...p,
          source: 'productos',
          tipo: 'producto_general'
        }));
        allProductos = [...allProductos, ...productosWithSource];
        console.log('✅ Productos generales cargados:', productosWithSource.length);
      } else if (productosData.error && productosData.error.code !== 'PGRST116') {
        // PGRST116 = tabla no existe, ignorar silenciosamente
        console.warn('⚠️ Error cargando productos:', productosData.error);
      }

      // Agregar productos específicos del evento (si la tabla existe y no hay error)
      if (productosEventosData.data && !productosEventosData.error) {
        const productosEventosWithSource = productosEventosData.data.map(p => ({
          ...p,
          source: 'productos_eventos',
          tipo: 'producto_evento',
          // Usar datos del producto relacionado si está disponible
          nombre: p.productos?.nombre || p.nombre,
          descripcion: p.productos?.descripcion || p.descripcion,
          precio_base: p.productos?.precio_base || p.precio_base,
          categoria: p.productos?.categoria || p.categoria
        }));
        allProductos = [...allProductos, ...productosEventosWithSource];
        console.log('✅ Productos del evento cargados:', productosEventosWithSource.length);
      } else if (productosEventosData.error && productosEventosData.error.code !== 'PGRST116') {
        // PGRST116 = tabla no existe, ignorar silenciosamente
        console.warn('⚠️ Error cargando productos_eventos:', productosEventosData.error);
      }

      setProductos(allProductos);
      console.log('🛍️ Total de productos cargados:', allProductos.length);

    } catch (error) {
      console.error('Error cargando productos:', error);
      message.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (eventId) => {
    setEventoSeleccionado(eventId);
  };

  const handleCreateProduct = () => {
    setEditingProducto(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProduct = (producto) => {
    setEditingProducto(producto);
    form.setFieldsValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen_url: producto.imagen_url,
      precio_base: producto.precio_base,
      categoria: producto.categoria,
      activo: producto.activo
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (producto) => {
    try {
      let deleteQuery = supabase
        .from('plantillas_productos')
        .update({ activo: false })
        .eq('id', producto.id);
      
      deleteQuery = addTenantFilter(deleteQuery);
      const { error } = await deleteQuery;

      if (error) throw error;
      message.success('Producto eliminado correctamente');
      loadProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      message.error('Error al eliminar producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleSubmit = async (values) => {
    try {
      const productoData = {
        ...values,
        evento_id: eventoSeleccionado,
        activo: values.activo !== false // Asegurar que activo sea boolean
      };

      if (editingProducto) {
        // Actualizar producto existente
        let updateQuery = supabase
          .from('plantillas_productos')
          .update(productoData)
          .eq('id', editingProducto.id);
        
        updateQuery = addTenantFilter(updateQuery);
        const { error } = await updateQuery;

        if (error) throw error;
        message.success('Producto actualizado correctamente');
      } else {
        // Crear nuevo producto - agregar tenant_id
        const productoDataWithTenant = addTenantToInsert(productoData);
        
        const { error } = await supabase
          .from('plantillas_productos')
          .insert([productoDataWithTenant]);

        if (error) throw error;
        message.success('Producto creado correctamente');
      }

      setModalVisible(false);
      loadProductos();
    } catch (error) {
      console.error('Error guardando producto:', error);
      message.error('Error al guardar producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const columns = [
    {
      title: 'Imagen',
      dataIndex: 'imagen_url',
      key: 'imagen_url',
      width: 80,
      render: (imagen_url) => (
        <Image
          width={50}
          height={50}
          src={imagen_url || 'https://via.placeholder.com/50'}
          fallback="https://via.placeholder.com/50"
          style={{ objectFit: 'cover', borderRadius: '4px' }}
        />
      ),
    },
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
      title: 'Precio Base',
      dataIndex: 'precio_base',
      key: 'precio_base',
      render: (precio) => `$${precio?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => (
        <Tag color="blue">{categoria || 'Sin categoría'}</Tag>
      ),
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
            onClick={() => handleEditProduct(record)}
          >
            Editar
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteProduct(record)}
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
            Gestión de Productos
          </h1>
          <p className="text-gray-600">
            Crea y gestiona productos para tus eventos
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
                      {evento.fecha_celebracion && (
                        <div className="text-sm text-gray-500">
                          {new Date(evento.fecha_celebracion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                      {!evento.fecha_celebracion && (
                        <div className="text-sm text-gray-400">
                          Sin fecha programada
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            {eventoSeleccionado && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateProduct}
              >
                Crear Producto
              </Button>
            )}
          </div>
        </Card>

        {/* Lista de Productos */}
        {eventoSeleccionado && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Productos Disponibles
              </h2>
              {productos.length === 0 && !loading && (
                <p className="text-gray-500 mt-2">
                  No hay productos disponibles para este evento
                </p>
              )}
            </div>

            <Table
              columns={columns}
              dataSource={productos}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} de ${total} productos`,
              }}
            />
          </Card>
        )}

        {/* Modal para Crear/Editar Producto */}
        <Modal
          title={editingProducto ? 'Editar Producto' : 'Crear Nuevo Producto'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              activo: true,
              precio_base: 0,
            }}
          >
            <Form.Item
              name="nombre"
              label="Nombre del Producto"
              rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
            >
              <Input placeholder="Ej: Camiseta del evento" />
            </Form.Item>

            <Form.Item
              name="descripcion"
              label="Descripción"
              rules={[{ required: true, message: 'Por favor ingresa la descripción' }]}
            >
              <TextArea
                rows={4}
                placeholder="Describe el producto detalladamente..."
              />
            </Form.Item>

            <Form.Item
              name="imagen_url"
              label="Imagen del Producto"
            >
              <Upload
                beforeUpload={async (file) => {
                  try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `productos/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from('productos')
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('productos')
                      .getPublicUrl(filePath);

                    form.setFieldsValue({ imagen_url: publicUrl });
                    message.success('Imagen subida correctamente');
                  } catch (error) {
                    console.error('Error uploading image:', error);
                    message.error('Error al subir imagen');
                  }
                  return false;
                }}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>
                  Subir Imagen
                </Button>
              </Upload>
              {form.getFieldValue('imagen_url') && (
                <div className="mt-2">
                  <Image
                    width={100}
                    height={100}
                    src={form.getFieldValue('imagen_url')}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
              )}
            </Form.Item>

            <Form.Item
              name="precio_base"
              label="Precio Base"
              rules={[{ required: true, message: 'Por favor ingresa el precio' }]}
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
              name="categoria"
              label="Categoría"
            >
              <Select placeholder="Selecciona una categoría">
                <Option value="merchandising">Merchandising</Option>
                <Option value="alimentos">Alimentos y Bebidas</Option>
                <Option value="servicios">Servicios</Option>
                <Option value="otros">Otros</Option>
              </Select>
            </Form.Item>

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
                {editingProducto ? 'Actualizar' : 'Crear'} Producto
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Productos; 