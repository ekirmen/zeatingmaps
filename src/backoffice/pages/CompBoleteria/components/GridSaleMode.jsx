import React, { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Select, Space, Typography, Divider, Alert, Spin, Row, Col, Badge, Table, Tag } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, MinusOutlined, InfoCircleOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';
import { fetchZonasPorSala } from '../../../services/apibackoffice';

const { Title, Text } = Typography;
const { Option } = Select;

const GridSaleMode = ({ 
  evento, 
  funcion, 
  onAddToCart, 
  onRemoveFromCart, 
  cartItems = [], 
  loading = false,
  selectedClient,
  onClientSelect
}) => {
  const [zonas, setZonas] = useState([]);
  const [precios, setPrecios] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [error, setError] = useState(null);

  // Cargar zonas y precios del evento
  useEffect(() => {
    console.log('🔄 [GridSaleMode] useEffect triggered:', { 
      eventoId: evento?.id, 
      funcionId: funcion?.id,
      evento: evento,
      funcion: funcion
    });
    
    if (!evento?.id || !funcion?.id) {
      console.log('❌ [GridSaleMode] Missing required data, skipping load');
      return;
    }
    
    loadZonasAndPrecios();
  }, [evento?.id, funcion?.id]);

  const loadZonasAndPrecios = async () => {
    try {
      setLoadingZonas(true);
      setError(null);

      console.log('🔍 [GridSaleMode] Cargando zonas para evento:', evento);
      console.log('🔍 [GridSaleMode] Sala del evento:', evento.sala);

      // Cargar zonas del evento usando la función estándar
      const zonasData = await fetchZonasPorSala(evento.sala);
      console.log('🏷️ [GridSaleMode] Zonas cargadas:', zonasData);

      setZonas(zonasData || []);

      // Cargar plantillas (precios) del evento
      const { data: plantillasData, error: plantillasError } = await supabase
        .from('plantillas')
        .select('*')
        .eq('recinto', evento.recinto)
        .eq('sala', evento.sala);

      if (plantillasError) throw plantillasError;

      // Procesar precios desde el JSON de detalles
      const preciosPorZona = {};
      plantillasData?.forEach(plantilla => {
        try {
          const detalles = JSON.parse(plantilla.detalles || '[]');
          detalles.forEach(detalle => {
            if (detalle.zonaId && detalle.precio) {
              preciosPorZona[detalle.zonaId] = {
                precio: detalle.precio,
                comision: detalle.comision || 0,
                precioGeneral: detalle.precioGeneral || 0,
                canales: detalle.canales || [],
                orden: detalle.orden || 0
              };
            }
          });
        } catch (parseError) {
          console.warn('Error parseando detalles de plantilla:', parseError);
        }
      });

      setPrecios(preciosPorZona);

      // Inicializar cantidades
      const cantidadesIniciales = {};
      zonasData?.forEach(zona => {
        cantidadesIniciales[zona.id] = 0;
      });
      setCantidades(cantidadesIniciales);

    } catch (err) {
      console.error('Error cargando zonas y precios:', err);
      setError('Error al cargar información de venta');
    } finally {
      setLoadingZonas(false);
    }
  };

  const handleCantidadChange = (zonaId, cantidad) => {
    setCantidades(prev => ({
      ...prev,
      [zonaId]: Math.max(0, cantidad)
    }));
  };

  const handleAddToCart = (zona) => {
    const cantidad = cantidades[zona.id] || 0;
    if (cantidad <= 0) return;

    const precio = precios[zona.id];
    if (!precio) {
      setError('No hay precio configurado para esta zona');
      return;
    }

    const item = {
      id: `grid_${zona.id}_${funcion.id}`,
      zona_id: zona.id,
      zona_nombre: zona.nombre,
      funcion_id: funcion.id,
      precio: precio.precio,
      cantidad: cantidad,
      tipo: 'grid',
      descripcion: `${zona.nombre} - ${funcion.nombre || 'Función'}`,
      fecha: funcion.fecha,
      hora: funcion.hora
    };

    onAddToCart(item);
    
    // Limpiar cantidad después de agregar
    setCantidades(prev => ({
      ...prev,
      [zona.id]: 0
    }));

    setError(null);
  };

  const handleRemoveFromCart = (zonaId) => {
    const itemId = `grid_${zonaId}_${funcion.id}`;
    onRemoveFromCart(itemId);
  };

  const getCantidadEnCarrito = (zonaId) => {
    const itemId = `grid_${zonaId}_${funcion.id}`;
    const item = cartItems.find(item => item.id === itemId);
    return item ? item.cantidad : 0;
  };

  const getTotalPrecio = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
  };

  const getTotalCantidad = () => {
    return cartItems.reduce((total, item) => {
      return total + item.cantidad;
    }, 0);
  };

  // Columnas para la tabla de zonas
  const columns = [
    {
      title: 'Zona',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.descripcion && (
            <div>
              <Text type="secondary" className="text-xs">
                {record.descripcion}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'id',
      key: 'precio',
      render: (zonaId) => {
        const precio = precios[zonaId];
        return precio ? (
          <Text className="text-lg font-bold text-green-600">
            ${precio.precio.toLocaleString()}
          </Text>
        ) : (
          <Tag color="red">Sin precio</Tag>
        );
      },
    },
    {
      title: 'Cantidad',
      dataIndex: 'id',
      key: 'cantidad',
      render: (zonaId) => (
        <InputNumber
          min={0}
          max={zonas.find(z => z.id === zonaId)?.aforo || 999}
          value={cantidades[zonaId] || 0}
          onChange={(value) => handleCantidadChange(zonaId, value)}
          size="small"
          style={{ width: '80px' }}
        />
      ),
    },
    {
      title: 'En Carrito',
      dataIndex: 'id',
      key: 'carrito',
      render: (zonaId) => {
        const cantidadEnCarrito = getCantidadEnCarrito(zonaId);
        return cantidadEnCarrito > 0 ? (
          <Badge count={cantidadEnCarrito} color="green">
            <Button
              type="link"
              size="small"
              onClick={() => handleRemoveFromCart(zonaId)}
              className="text-green-600"
            >
              Ver
            </Button>
          </Badge>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Acciones',
      dataIndex: 'id',
      key: 'acciones',
      render: (zonaId) => {
        const zona = zonas.find(z => z.id === zonaId);
        const cantidad = cantidades[zonaId] || 0;
        const precio = precios[zonaId];
        
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddToCart(zona)}
              disabled={cantidad <= 0 || !precio}
              loading={loading}
            >
              Agregar
            </Button>
          </Space>
        );
      },
    },
  ];

  if (loadingZonas) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
        <Text className="ml-2">Cargando zonas y precios...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadZonasAndPrecios}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (!zonas || zonas.length === 0) {
    return (
      <Alert
        message="No hay zonas configuradas"
        description="Este evento no tiene zonas de venta configuradas."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div className="grid-sale-mode">
      <div className="mb-4">
        <Title level={4} className="flex items-center gap-2">
          <ShoppingCartOutlined />
          Venta en Modo Grid
        </Title>
        <Text type="secondary">
          Selecciona la cantidad de entradas para cada zona
        </Text>
      </div>

      {/* Información del cliente */}
      {selectedClient ? (
        <Card className="mb-4" size="small">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserOutlined />
              <Text strong>Cliente: {selectedClient.nombre || selectedClient.email}</Text>
            </div>
            <Button 
              size="small" 
              onClick={onClientSelect}
            >
              Cambiar
            </Button>
          </div>
        </Card>
      ) : (
        <Alert
          message="Selecciona un cliente"
          description="Debes seleccionar un cliente antes de realizar la venta."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={onClientSelect}>
              Seleccionar Cliente
            </Button>
          }
        />
      )}

      {/* Zonas en tarjetas (modo store) */}
      <Row gutter={[16, 16]}>
        {zonas
          .slice()
          .sort((a, b) => {
            const ordenA = precios[a.id]?.orden ?? 0;
            const ordenB = precios[b.id]?.orden ?? 0;
            if (ordenA !== ordenB) return ordenA - ordenB;
            const nombreCompare = (a.nombre || '').localeCompare(b.nombre || '');
            if (nombreCompare !== 0) return nombreCompare;
            const precioA = precios[a.id]?.precio ?? Infinity;
            const precioB = precios[b.id]?.precio ?? Infinity;
            return precioA - precioB;
          })
          .map((zona) => {
            const precio = precios[zona.id];
            const cantidadActual = cantidades[zona.id] || 0;
            const cantidadEnCarrito = getCantidadEnCarrito(zona.id);
            const aforoNum = typeof zona.aforo === 'number' ? zona.aforo : Number(zona.aforo || 0);
            const isAgotado = aforoNum <= 0;

            return (
              <Col xs={24} sm={24} md={24} lg={24} key={zona.id}>
                <Card className={`zona-card ${cantidadEnCarrito > 0 ? 'zona-selected' : ''}`} hoverable>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Text strong>ZONA:</Text>
                      <Title level={4} className="mb-0">{zona.nombre}</Title>
                    </div>

                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Text strong>PRECIO:</Text>
                      {isAgotado ? (
                        <Tag color="red">AGOTADO</Tag>
                      ) : precio ? (
                        <Text className="text-2xl font-bold text-green-600">
                          ${precio.precio ? precio.precio.toLocaleString() : '0'}
                        </Text>
                      ) : (
                        <Tag color="red">Sin precio</Tag>
                      )}
                    </div>

                    <div className="flex items-center gap-2 min-w-[200px]">
                      <Text strong>CANTIDAD:</Text>
                      <Button icon={<MinusOutlined />} onClick={() => setCantidades(prev => ({ ...prev, [zona.id]: Math.max(0, (prev[zona.id] || 0) - 1) }))} disabled={isAgotado || cantidadActual <= 0} />
                      <InputNumber
                        min={0}
                        max={aforoNum > 0 ? aforoNum : 0}
                        value={cantidadActual}
                        onChange={(value) => handleCantidadChange(zona.id, value)}
                        className="w-24"
                        size="large"
                        disabled={isAgotado}
                      />
                      <Button icon={<PlusOutlined />} onClick={() => setCantidades(prev => ({ ...prev, [zona.id]: Math.max(0, (prev[zona.id] || 0) + 1) }))} disabled={isAgotado} />
                      {Number.isFinite(aforoNum) && (
                        isAgotado ? (
                          <Text type="danger" className="text-xs ml-2 text-red-600">AGOTADO</Text>
                        ) : (
                          <Text type="secondary" className="text-xs ml-2">Disponible: {aforoNum} entradas</Text>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddToCart(zona)}
                        disabled={isAgotado || cantidadActual <= 0 || !precio || !(precio?.precio > 0) || !selectedClient}
                        loading={loading}
                      >
                        Agregar al Carrito
                      </Button>
                      {cantidadEnCarrito > 0 && (
                        <Badge count={cantidadEnCarrito} color="green">
                          <Button type="link" onClick={() => handleRemoveFromCart(zona.id)} className="text-green-600">
                            En carrito: {cantidadEnCarrito}
                          </Button>
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
      </Row>

      {/* Resumen del carrito */}
      {cartItems.length > 0 && (
        <Card className="mb-4" size="small">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCartOutlined />
              <Text strong>
                {getTotalCantidad()} entradas seleccionadas
              </Text>
            </div>
            <div className="text-right">
              <Text className="text-lg font-bold text-green-600">
                Total: ${getTotalPrecio().toLocaleString()}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Información adicional */}
      <Card size="small">
        <div className="flex items-start gap-2">
          <InfoCircleOutlined className="text-blue-500 mt-1" />
          <div>
            <Text strong className="block mb-1">
              Información del modo Grid:
            </Text>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Las entradas se venden por zona sin selección específica de asientos</li>
              <li>• El cliente puede elegir cualquier asiento disponible en la zona</li>
              <li>• Ideal para eventos generales o con asientos no numerados</li>
              <li>• Los precios se configuran por zona en el dashboard</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GridSaleMode;
