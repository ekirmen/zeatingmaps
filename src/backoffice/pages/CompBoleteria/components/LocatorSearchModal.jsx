import React, { useState } from 'react';
import { Modal, Input, Button, message, Spin, Card, Typography, Tag, Divider } from 'antd';
import { SearchOutlined, UserOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Text, Title } = Typography;
const { Search } = Input;

const LocatorSearchModal = ({ open, onCancel }) => {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (value) => {
    if (!value || value.trim() === '') {
      message.warning('Por favor ingresa un localizador válido');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      console.log('[LocatorSearch] Searching for locator:', value);
      
      // Search in payment_transactions table (FIXED: removed user relation)
      const { data: payment, error: paymentError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          event:eventos(*),
          funcion:funciones(
            id,
            fecha_celebracion,
            evento_id,
            sala_id,
            plantilla
          )
        `)
        .eq('locator', value.trim())
        .single();

      if (paymentError) {
        console.error('[LocatorSearch] Error searching payment:', paymentError);
        throw new Error('No se encontró el localizador');
      }

      if (!payment) {
        throw new Error('No se encontró el localizador');
      }

      console.log('[LocatorSearch] Payment found:', payment);
      setSearchResult(payment);
      message.success('Localizador encontrado');

    } catch (err) {
      console.error('[LocatorSearch] Search error:', err);
      setError(err.message);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setSearchResult(null);
    setError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const parseSeats = (seatsData) => {
    if (!seatsData) return [];
    try {
      if (Array.isArray(seatsData)) return seatsData;
      if (typeof seatsData === 'string') {
        return JSON.parse(seatsData);
      }
      return [];
    } catch (e) {
      console.error('Error parsing seats:', e);
      return [];
    }
  };

  return (
    <Modal
      title="Buscar por Localizador"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <Search
            placeholder="Ingresa el localizador (ej: ORDER-1757205787086-1NNVL87H0)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            enterButton={
              <Button type="primary" icon={<SearchOutlined />} loading={loading}>
                Buscar
              </Button>
            }
            size="large"
            className="flex-1"
          />
          <Button onClick={handleClear} disabled={loading}>
            Limpiar
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Buscando localizador...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">❌</div>
            <div className="text-red-600 font-medium">{error}</div>
            <div className="text-gray-500 text-sm mt-2">
              Verifica que el localizador sea correcto
            </div>
          </div>
        )}

        {/* Search Result */}
        {searchResult && !loading && (
          <Card className="mt-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Title level={4} className="mb-0">
                  Detalles del Localizador
                </Title>
                <Tag color={searchResult.status === 'pagado' ? 'green' : 'orange'}>
                  {searchResult.status?.toUpperCase() || 'DESCONOCIDO'}
                </Tag>
              </div>

              <Divider />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text strong>Localizador:</Text>
                  <div className="text-lg font-mono">{searchResult.locator}</div>
                </div>
                <div>
                  <Text strong>Monto Total:</Text>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(searchResult.monto)}
                  </div>
                </div>
              </div>

              {/* Event Info */}
              {searchResult.event && (
                <div>
                  <Text strong className="flex items-center">
                    <CalendarOutlined className="mr-2" />
                    Evento:
                  </Text>
                  <div className="ml-6">
                    <div className="font-medium">{searchResult.event.nombre}</div>
                    <div className="text-gray-500 text-sm">
                      {formatDate(searchResult.event.fecha_evento)}
                    </div>
                  </div>
                </div>
              )}

              {/* Function Info */}
              {searchResult.funcion && (
                <div>
                  <Text strong className="flex items-center">
                    <CalendarOutlined className="mr-2" />
                    Función:
                  </Text>
                  <div className="ml-6">
                    <div className="font-medium">Función ID: {searchResult.funcion.id}</div>
                    <div className="text-gray-500 text-sm">
                      {formatDate(searchResult.funcion.fecha_celebracion)}
                    </div>
                  </div>
                </div>
              )}

              {/* User Info */}
              {searchResult.user_id && (
                <div>
                  <Text strong className="flex items-center">
                    <UserOutlined className="mr-2" />
                    Cliente:
                  </Text>
                  <div className="ml-6">
                    <div className="font-medium">
                      Usuario ID: {searchResult.user_id}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Información de usuario no disponible
                    </div>
                  </div>
                </div>
              )}

              {/* Seats Info */}
              {(searchResult.seats || searchResult.gateway_response) && (
                <div>
                  <Text strong className="flex items-center">
                    <DollarOutlined className="mr-2" />
                    Asientos ({parseSeats(searchResult.seats || searchResult.gateway_response).length}):
                  </Text>
                  <div className="ml-6">
                    {parseSeats(searchResult.seats || searchResult.gateway_response).map((seat, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="font-medium">
                          {seat.name || seat.nombre || seat.seat_name || `Asiento ${index + 1}`}
                        </span>
                        <span className="text-green-600 font-bold">
                          {formatCurrency(seat.price || seat.precio || seat.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div>
                <Text strong className="flex items-center">
                  <DollarOutlined className="mr-2" />
                  Información de Pago:
                </Text>
                <div className="ml-6">
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium">Monto:</span>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(searchResult.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium">Moneda:</span>
                    <span className="text-gray-600">{searchResult.currency || 'USD'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium">Estado:</span>
                    <span className={`font-bold ${
                      searchResult.status === 'pending' ? 'text-yellow-600' :
                      searchResult.status === 'completed' ? 'text-green-600' :
                      searchResult.status === 'failed' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {searchResult.status === 'pending' ? 'Pendiente' :
                       searchResult.status === 'completed' ? 'Completado' :
                       searchResult.status === 'failed' ? 'Fallido' :
                       searchResult.status}
                    </span>
                  </div>
                  {searchResult.payment_method && (
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium">Método:</span>
                      <span className="text-gray-600">{searchResult.payment_method}</span>
                    </div>
                  )}
                  {searchResult.gateway_name && (
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium">Gateway:</span>
                      <span className="text-gray-600">{searchResult.gateway_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Created Date */}
              <div>
                <Text strong>Fecha de Creación:</Text>
                <div className="ml-6 text-gray-500">
                  {formatDate(searchResult.created_at)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        {!searchResult && !loading && !error && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">🔍</div>
            <div className="font-medium mb-2">Buscar por Localizador</div>
            <div className="text-sm">
              Ingresa el localizador completo para encontrar los detalles del pago
            </div>
            <div className="text-xs mt-2 text-gray-400">
              Ejemplo: ORDER-1757205787086-1NNVL87H0
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LocatorSearchModal;
