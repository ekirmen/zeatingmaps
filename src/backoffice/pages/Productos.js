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
      // Nota: La tabla productos_eventos puede no existir, por eso usamos manejo de errores
      let productosEventosQuery = supabase
        .from('productos_eventos')
        .select(`
          *,
          productos:producto_id(nombre, descripcion, precio, categoria)
        `)
        .eq('evento_id', eventoSeleccionado)
        .eq('activo', true)
        .order('created_at', { ascending: false });
      
      productosEventosQuery = addTenantFilter(productosEventosQuery);
      
      // También consultar productos directamente que tengan evento_id
      let productosConEventoQuery = supabase
        .from('productos')
        .select('*')
        .eq('evento_id', eventoSeleccionado)
        .eq('activo', true)
        .order('created_at', { ascending: false });
      
      productosConEventoQuery = addTenantFilter(productosConEventoQuery);
      
      // Ejecutar consultas con manejo de errores individual
      const [plantillasResult, productosResult, productosEventosResult, productosConEventoResult] = await Promise.allSettled([
        plantillasQuery,
        productosQuery,
        productosEventosQuery,
        productosConEventoQuery
      ]);

      // Procesar resultados
      const plantillasData = plantillasResult.status === 'fulfilled' 
        ? plantillasResult.value 
        : { data: null, error: plantillasResult.reason };
      
      // Helper para detectar si un error debe ser ignorado silenciosamente
      const shouldIgnoreError = (error) => {
        if (!error) return false;
        const errorMessage = error.message?.toLowerCase() || '';
        const errorHint = error.hint?.toLowerCase() || '';
        return (
          error.code === 'PGRST116' || // Tabla no existe
          error.status === 401 || // No autorizado
          error.status === 403 || // Prohibido
          errorMessage.includes('does not exist') ||
          errorMessage.includes('no api key found') ||
          errorMessage.includes('apikey') ||
          errorMessage.includes('permission denied') ||
          errorHint.includes('no `apikey`') ||
          errorHint.includes('api key')
        );
      };
      
      const productosData = productosResult.status === 'fulfilled'
        ? productosResult.value
        : shouldIgnoreError(productosResult.reason)
          ? { data: [], error: null } // Ignorar errores de autenticación o tabla no existente
          : { data: null, error: productosResult.reason };
      
      const productosEventosData = productosEventosResult.status === 'fulfilled'
        ? productosEventosResult.value
        : shouldIgnoreError(productosEventosResult.reason)
          ? { data: [], error: null } // Ignorar errores de autenticación o tabla no existente
          : { data: null, error: productosEventosResult.reason };
      
      const productosConEventoData = productosConEventoResult.status === 'fulfilled'
        ? productosConEventoResult.value
        : shouldIgnoreError(productosConEventoResult.reason)
          ? { data: [], error: null } // Ignorar errores de autenticación o tabla no existente
          : { data: null, error: productosConEventoResult.reason };

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
      // Nota: Solo productos que NO tengan evento_id (productos generales)
      if (productosData.data && !productosData.error) {
        // Filtrar productos que no tengan evento_id o que tengan evento_id null
        const productosGenerales = productosData.data.filter(p => !p.evento_id || p.evento_id !== eventoSeleccionado);
        const productosWithSource = productosGenerales.map(p => ({
          ...p,
          source: 'productos',
          tipo: 'producto_general',
          precio: p.precio || 0 // La tabla productos tiene 'precio', no 'precio_base'
        }));
        allProductos = [...allProductos, ...productosWithSource];
        console.log('✅ Productos generales cargados:', productosWithSource.length);
      } else if (productosData.error) {
        // Detectar errores de autenticación o tabla no existente
        const error = productosData.error;
        const errorMessage = error.message?.toLowerCase() || '';
        const errorHint = error.hint?.toLowerCase() || '';
        const isAuthError = 
          error.code === 'PGRST116' || // Tabla no existe
          error.status === 401 ||
          error.status === 403 ||
          errorMessage.includes('no api key found') ||
          errorMessage.includes('apikey') ||
          errorMessage.includes('permission denied') ||
          errorHint.includes('no `apikey`') ||
          errorHint.includes('api key');
        
        // Solo mostrar advertencia si no es un error de autenticación o tabla no existente
        if (!isAuthError) {
          console.warn('⚠️ Error cargando productos:', error);
        }
        // Ignorar silenciosamente errores de autenticación o tabla no existente
      }

      // Agregar productos específicos del evento desde productos_eventos (si la tabla existe)
      if (productosEventosData.data && !productosEventosData.error) {
        const productosEventosWithSource = productosEventosData.data.map(p => ({
          ...p,
          source: 'productos_eventos',
          tipo: 'producto_evento',
          // Usar datos del producto relacionado si está disponible
          nombre: p.productos?.nombre || p.nombre,
          descripcion: p.productos?.descripcion || p.descripcion,
          precio: p.productos?.precio || p.precio || p.precio_base || 0, // productos tiene 'precio', no 'precio_base'
          categoria: p.productos?.categoria || p.categoria
        }));
        allProductos = [...allProductos, ...productosEventosWithSource];
        console.log('✅ Productos del evento (productos_eventos) cargados:', productosEventosWithSource.length);
      } else if (productosEventosData.error) {
        // Detectar errores de autenticación, tabla no existente, o relación no encontrada
        const error = productosEventosData.error;
        const errorMessage = error.message?.toLowerCase() || '';
        const errorHint = error.hint?.toLowerCase() || '';
        const isIgnorableError = 
          error.code === 'PGRST116' || // Tabla no existe
          error.code === 'PGRST200' || // Relación no encontrada (tabla productos_eventos no existe o no tiene relación)
          error.status === 401 ||
          error.status === 403 ||
          errorMessage.includes('no api key found') ||
          errorMessage.includes('apikey') ||
          errorMessage.includes('permission denied') ||
          errorMessage.includes('could not find a relationship') ||
          errorMessage.includes('foreign key relationship') ||
          errorHint.includes('no `apikey`') ||
          errorHint.includes('api key') ||
          errorHint.includes('perhaps you meant');
        
        // Solo mostrar advertencia si no es un error que debemos ignorar
        if (!isIgnorableError) {
          console.warn('⚠️ Error cargando productos_eventos:', error);
        } else {
          // Log silencioso para debugging (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ productos_eventos no disponible (tabla o relación no existe), usando productos directos');
          }
        }
        // Ignorar silenciosamente errores esperados
      }
      
      // Agregar productos que tengan evento_id directamente (desde tabla productos)
      if (productosConEventoData.data && !productosConEventoData.error) {
        const productosConEventoWithSource = productosConEventoData.data.map(p => ({
          ...p,
          source: 'productos',
          tipo: 'producto_evento_directo',
          precio: p.precio || 0 // La tabla productos tiene 'precio', no 'precio_base'
        }));
        allProductos = [...allProductos, ...productosConEventoWithSource];
        console.log('✅ Productos con evento_id cargados:', productosConEventoWithSource.length);
      } else if (productosConEventoData.error) {
        // Detectar errores de autenticación
        const error = productosConEventoData.error;
        const errorMessage = error.message?.toLowerCase() || '';
        const errorHint = error.hint?.toLowerCase() || '';
        const isAuthError = 
          error.status === 401 ||
          error.status === 403 ||
          errorMessage.includes('no api key found') ||
          errorMessage.includes('apikey') ||
          errorMessage.includes('permission denied') ||
          errorHint.includes('no `apikey`') ||
          errorHint.includes('api key');
        
        // Solo mostrar advertencia si no es un error de autenticación
        if (!isAuthError) {
          console.warn('⚠️ Error cargando productos con evento_id:', error);
        }
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
    
    // Limpiar imagen_url si es un objeto JSON string
    let imagenUrl = producto.imagen_url;
    if (imagenUrl && typeof imagenUrl === 'string' && imagenUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(imagenUrl);
        // Intentar extraer la URL del objeto
        if (parsed.fileList && parsed.fileList.length > 0) {
          imagenUrl = parsed.fileList[0].response?.url || parsed.fileList[0].url || imagenUrl;
        } else if (parsed.url) {
          imagenUrl = parsed.url;
        }
        // Si no se puede extraer, mantener el valor original (puede ser una URL válida)
      } catch (e) {
        // Si no se puede parsear, asumir que es una URL válida o null
        console.warn('No se pudo parsear imagen_url al editar:', e);
      }
    }
    
    form.setFieldsValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen_url: imagenUrl, // Usar la URL limpia
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
      // Excluir precio_base ya que se asigna desde la plantilla de precios
      const { precio_base, ...valuesWithoutPrice } = values;
      
      // Limpiar imagen_url: asegurar que siempre sea una URL string, no un objeto JSON
      let imagenUrl = valuesWithoutPrice.imagen_url;
      
      // Si imagenUrl existe, procesarlo para extraer solo la URL
      if (imagenUrl) {
        // Caso 1: Es un string que parece JSON (empieza con '{')
        if (typeof imagenUrl === 'string' && imagenUrl.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(imagenUrl);
            // Buscar la URL en diferentes estructuras posibles
            if (parsed.fileList && Array.isArray(parsed.fileList) && parsed.fileList.length > 0) {
              const firstFile = parsed.fileList[0];
              imagenUrl = firstFile.response?.url || firstFile.url || firstFile.thumbUrl || null;
            } else if (parsed.url) {
              imagenUrl = parsed.url;
            } else if (parsed.file?.response?.url) {
              imagenUrl = parsed.file.response.url;
            } else {
              // Si no se encuentra URL en el JSON, establecer como null
              imagenUrl = null;
            }
          } catch (e) {
            // Si no se puede parsear, asumir que puede ser una URL válida que empieza con '{'
            // Pero es más seguro establecerlo como null si no parece una URL
            if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
              // Es una URL válida que casualmente empieza con '{'
              // Mantener el valor
            } else {
              imagenUrl = null;
            }
          }
        }
        // Caso 2: Es un objeto (no string)
        else if (typeof imagenUrl === 'object' && imagenUrl !== null) {
          if (imagenUrl.response?.url) {
            imagenUrl = imagenUrl.response.url;
          } else if (imagenUrl.url) {
            imagenUrl = imagenUrl.url;
          } else if (imagenUrl.thumbUrl) {
            imagenUrl = imagenUrl.thumbUrl;
          } else if (Array.isArray(imagenUrl.fileList) && imagenUrl.fileList.length > 0) {
            const firstFile = imagenUrl.fileList[0];
            imagenUrl = firstFile.response?.url || firstFile.url || firstFile.thumbUrl || null;
          } else {
            imagenUrl = null;
          }
        }
        // Caso 3: Es una URL string válida (no JSON)
        // Verificar que sea una URL válida
        else if (typeof imagenUrl === 'string') {
          // Si no empieza con http:// o https://, podría no ser una URL válida
          if (!imagenUrl.startsWith('http://') && !imagenUrl.startsWith('https://') && !imagenUrl.startsWith('/')) {
            // Si no parece una URL, establecer como null
            imagenUrl = null;
          }
          // Si es una URL válida, mantenerla
        }
        // Caso 4: Cualquier otro tipo (number, boolean, etc.) -> null
        else {
          imagenUrl = null;
        }
      } else {
        // Si imagenUrl es null, undefined, o vacío, establecer como null
        imagenUrl = null;
      }
      
      const productoData = {
        ...valuesWithoutPrice,
        imagen_url: imagenUrl, // Usar la URL limpia
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
      title: 'Precio',
      key: 'precio',
      render: (_, record) => {
        // plantillas_productos usa precio_base, productos usa precio
        const precioValue = record.precio ?? record.precio_base ?? 0;
        return `$${typeof precioValue === 'number' ? precioValue.toFixed(2) : '0.00'}`;
      },
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium flex-1 truncate">{evento.nombre}</span>
                      {evento.fecha_celebracion ? (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(evento.fecha_celebracion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 whitespace-nowrap">
                          Sin fecha
                        </span>
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