import React from 'react';
import { 
  Card, 
  Button, 
  List, 
  Typography, 
  Space, 
  Divider, 
  Tag, 
  Popconfirm,
  Tooltip,
  Badge,
  Row,
  Col,
  Statistic
} from '../../../../utils/antdComponents';
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  DollarOutlined, 
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const AdvancedCart = ({ 
  carrito, 
  setCarrito, 
  selectedClient, 
  selectedFuncion,
  onPayment,
  onClientSelect,
  showPrices = true,
  showClient = true,
  compact = false
}) => {
  const total = carrito.reduce((sum, item) => sum + (item.precio || 0), 0);
  const totalItems = carrito.length;

  const handleRemoveItem = (index) => {
    const newCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(newCarrito);
  };

  const handleUpdateQuantity = (index, delta) => {
    const newCarrito = [...carrito];
    const item = newCarrito[index];
    
    if (delta > 0) {
      // Agregar m¡s del mismo asiento (si es posible)
      const newItem = { ...item, _id: `${item._id}_${Date.now()}` };
      newCarrito.splice(index + 1, 0, newItem);
    } else {
      // Remover el asiento
      newCarrito.splice(index, 1);
    }
    
    setCarrito(newCarrito);
  };

  const getSeatStatusColor = (item) => {
    if (item.tipoPrecio === 'descuento') return 'green';
    if (item.tipoPrecio === 'promocion') return 'blue';
    return 'default';
  };

  const getSeatStatusText = (item) => {
    if (item.tipoPrecio === 'descuento') return 'Descuento';
    if (item.tipoPrecio === 'promocion') return 'Promoci³n';
    return 'Normal';
  };

  if (compact) {
    return (
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Carrito</span>
            <Badge count={totalItems} showZero />
          </div>
        }
        size="small"
        className="h-full"
      >
        {carrito.length > 0 ? (
          <div className="space-y-2">
            {carrito.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <Text strong className="text-sm">{item.nombre}</Text>
                  <br />
                  <Text type="secondary" className="text-xs">{item.zona}</Text>
                </div>
                <div className="text-right">
                  <Text strong className="text-sm">${item.precio}</Text>
                  <br />
                  <Button 
                    size="small" 
                    type="link" 
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(index)}
                  />
                </div>
              </div>
            ))}
            
            <Divider className="my-2" />
            
            <div className="flex justify-between items-center">
              <Text strong>Total: ${total}</Text>
              <Button 
                type="primary" 
                size="small"
                onClick={onPayment}
                disabled={!selectedClient}
              >
                Pagar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingCartOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
            <br />
            <Text type="secondary">Carrito vac­o</Text>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <span>Carrito de Compras</span>
          <Badge count={totalItems} showZero />
        </div>
      }
      className="h-full"
    >
      {carrito.length > 0 ? (
        <div className="space-y-4">
          {/* Informaci³n del cliente */}
          {showClient && (
            <Card size="small" className="bg-blue-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <UserOutlined />
                  <div>
                    <Text strong>{selectedClient?.nombre || 'Sin cliente'}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {selectedClient?.email || 'Selecciona un cliente'}
                    </Text>
                  </div>
                </div>
                <Button 
                  size="small" 
                  onClick={onClientSelect}
                  disabled={!!selectedClient}
                >
                  {selectedClient ? 'Cambiar' : 'Seleccionar'}
                </Button>
              </div>
            </Card>
          )}

          {/* Informaci³n de la funci³n */}
          {selectedFuncion && (
            <Card size="small" className="bg-green-50">
              <div className="flex items-center space-x-2">
                <CalendarOutlined />
                <div>
                  <Text strong>Funci³n seleccionada</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    {new Date(selectedFuncion.fecha_celebracion).toLocaleString()}
                  </Text>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de asientos */}
          <List
            dataSource={carrito}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Tooltip title="Remover asiento">
                    <Button 
                      size="small" 
                      type="text" 
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(index)}
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center space-x-2">
                      <Text strong>{item.nombre}</Text>
                      <Tag color={getSeatStatusColor(item)}>
                        {getSeatStatusText(item)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <TagOutlined className="text-xs" />
                        <Text type="secondary" className="text-xs">{item.zona}</Text>
                      </div>
                      {item.descuentoNombre && (
                        <div className="flex items-center space-x-2">
                          <Text type="success" className="text-xs">
                            Descuento: {item.descuentoNombre}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
                <div className="text-right">
                  <Text strong className="text-lg">${item.precio}</Text>
                </div>
              </List.Item>
            )}
          />

          <Divider />

          {/* Resumen de precios */}
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Subtotal"
                value={total}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Total de asientos"
                value={totalItems}
                prefix={<UserOutlined />}
              />
            </Col>
          </Row>

          {/* Botones de acci³n */}
          <div className="space-y-2">
            <Button
              type="primary"
              size="large"
              block
              icon={<DollarOutlined />}
              onClick={onPayment}
              disabled={!selectedClient}
            >
              {selectedClient ? 'Proceder al Pago' : 'Selecciona un cliente primero'}
            </Button>
            
            {!selectedClient && (
              <Button
                size="large"
                block
                icon={<UserOutlined />}
                onClick={onClientSelect}
              >
                Seleccionar Cliente
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <br />
          <Title level={4} type="secondary">Carrito vac­o</Title>
          <Text type="secondary">
            Selecciona asientos en el mapa para agregarlos al carrito
          </Text>
        </div>
      )}
    </Card>
  );
};

export default AdvancedCart;


