import React, { useState } from 'react';
import { Modal, Input, Button, message, Spin, Card, Typography, Tag, Divider } from 'antd';
import { SearchOutlined, UserOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Text, Title } = Typography;
const { Search } = Input;

const LocatorSearchModal = ({ open, onCancel, onSearch }) => {
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

              {/* Seats Info - Clickeable para cargar en carrito */}
              {(searchResult.seats || searchResult.gateway_response) && (
                <div>
                  <Text strong className="flex items-center">
                    <DollarOutlined className="mr-2" />
                    Asientos ({parseSeats(searchResult.seats || searchResult.gateway_response).length}):
                  </Text>
                  <div className="ml-6">
                    <div className="mb-2 text-xs text-gray-500">
                      🎯 Haz click en cualquier asiento para cargar TODA la transacción completa
                    </div>
                    {parseSeats(searchResult.seats || searchResult.gateway_response).map((seat, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center py-2 px-2 rounded hover:bg-blue-50 cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                        onClick={() => {
                          // 🎯 CARGAR TODA LA TRANSACCIÓN COMPLETA al hacer click en cualquier asiento
                          const allSeats = parseSeats(searchResult.seats || searchResult.gateway_response);
                          const seatsData = allSeats.map((seatItem, seatIndex) => ({
                            _id: seatItem.id || seatItem._id || `seat_${seatIndex}`,
                            nombre: seatItem.name || seatItem.nombre || seatItem.seat_name || `Asiento ${seatIndex + 1}`,
                            precio: seatItem.price || seatItem.precio || seatItem.amount || 0,
                            zona: seatItem.zona || seatItem.zonaNombre || 'General',
                            zonaId: seatItem.zonaId || seatItem.zona?.id || 'general',
                            mesa: seatItem.mesa || null,
                            locator: searchResult.locator,
                            transactionId: searchResult.id,
                            status: searchResult.status
                          }));
                          
                          // Disparar evento para cargar TODA la transacción
                          window.dispatchEvent(new CustomEvent('loadSeatToCart', {
                            detail: {
                              seats: seatsData,
                              transaction: searchResult,
                              action: 'loadCompleteTransaction',
                              clickedSeat: seat.name || seat.nombre || seat.seat_name || `Asiento ${index + 1}`
                            }
                          }));
                          
                          message.success(`🎫 Transacción completa cargada: ${seatsData.length} asientos desde ${searchResult.locator}`);
                        }}
                      >
                        <span className="font-medium">
                          {seat.name || seat.nombre || seat.seat_name || `Asiento ${index + 1}`}
                        </span>
                        <span className="text-green-600 font-bold">
                          {formatCurrency(seat.price || seat.precio || seat.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2">
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => {
                          // Cargar todos los asientos en el carrito
                          const allSeats = parseSeats(searchResult.seats || searchResult.gateway_response);
                          const seatsData = allSeats.map((seat, index) => ({
                            _id: seat.id || seat._id || `seat_${index}`,
                            nombre: seat.name || seat.nombre || seat.seat_name || `Asiento ${index + 1}`,
                            precio: seat.price || seat.precio || seat.amount || 0,
                            zona: seat.zona || seat.zonaNombre || 'General',
                            zonaId: seat.zonaId || seat.zona?.id || 'general',
                            mesa: seat.mesa || null,
                            locator: searchResult.locator,
                            transactionId: searchResult.id,
                            status: searchResult.status
                          }));
                          
                          // Disparar evento para cargar todos los asientos
                          window.dispatchEvent(new CustomEvent('loadSeatToCart', {
                            detail: {
                              seats: seatsData,
                              transaction: searchResult,
                              action: 'addAllSeats'
                            }
                          }));
                          
                          message.success(`${seatsData.length} asientos cargados en el carrito`);
                        }}
                      >
                        Cargar Todos los Asientos
                      </Button>
                    </div>
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

        {/* Acciones según el estado */}
        {searchResult && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {searchResult.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    onClick={async () => {
                      // Enviar al carrito para completar venta
                      if (searchResult.funcion) {
                        let eventData = searchResult.event;
                        
                        // Si no hay evento pero hay evento_id en la función, buscarlo
                        if (!eventData && searchResult.funcion.evento_id) {
                          try {
                            const { data: event, error } = await supabase
                              .from('eventos')
                              .select('*')
                              .eq('id', searchResult.funcion.evento_id)
                              .single();
                            
                            if (error) {
                              console.error('Error fetching event:', error);
                            } else {
                              eventData = event;
                            }
                          } catch (e) {
                            console.error('Error fetching event:', e);
                          }
                        }
                        
                        // Crear asientos desde gateway_response o seat_locks
                        const seats = [];
                        
                        // Primero intentar desde gateway_response
                        if (searchResult.gateway_response) {
                          try {
                            const responseData = typeof searchResult.gateway_response === 'string' 
                              ? JSON.parse(searchResult.gateway_response) 
                              : searchResult.gateway_response;
                            
                            if (responseData.seats && Array.isArray(responseData.seats)) {
                              seats.push(...responseData.seats);
                            } else if (responseData.seat && responseData.seat.name) {
                              seats.push(responseData.seat);
                            }
                          } catch (e) {
                            console.error('Error parsing gateway_response:', e);
                          }
                        }
                        
                        // Si no hay asientos en gateway_response, buscar en seat_locks por locator
                        if (seats.length === 0 && searchResult.locator) {
                          console.log('🔍 Buscando asientos en seat_locks por locator...');
                          console.log('🔍 locator:', searchResult.locator);
                          
                          try {
                            const { data: seatLocks, error } = await supabase
                              .from('seat_locks')
                              .select('*')
                              .eq('locator', searchResult.locator);
                            
                            console.log('🔍 Query seat_locks result:', { seatLocks, error });
                            
                            if (error) {
                              console.error('Error fetching seat_locks:', error);
                            } else if (seatLocks && seatLocks.length > 0) {
                              // Buscar información de zonas desde el mapa
                              let zonasInfo = {};
                              try {
                                const { data: zonas, error: zonasError } = await supabase
                                  .from('zonas')
                                  .select('*')
                                  .eq('funcion_id', searchResult.funcion_id);
                                
                                if (!zonasError && zonas) {
                                  zonasInfo = zonas.reduce((acc, zona) => {
                                    acc[zona.id] = zona;
                                    return acc;
                                  }, {});
                                  console.log('✅ Zonas encontradas:', zonasInfo);
                                }
                              } catch (e) {
                                console.error('Error fetching zonas:', e);
                              }
                              
                              // Convertir seat_locks a formato de asientos con información completa
                              const seatLocksAsSeats = seatLocks.map(lock => {
                                // Extraer información del seat_id
                                const seatIdParts = lock.seat_id.split('_');
                                const seatNumber = seatIdParts[seatIdParts.length - 1];
                                
                                // Buscar información de la zona (usar la primera zona disponible como fallback)
                                const primeraZona = Object.values(zonasInfo)[0];
                                const zonaNombre = primeraZona?.nombre || 'ORO';
                                const zonaId = primeraZona?.id || 'ORO';
                                
                                return {
                                  id: lock.seat_id,
                                  _id: lock.seat_id,
                                  nombre: `Asiento ${seatNumber}`,
                                  name: `Asiento ${seatNumber}`,
                                  precio: 10.00, // Precio por defecto, se puede ajustar
                                  price: 10.00,
                                  zona: zonaNombre,
                                  zonaId: zonaId,
                                  mesa: null,
                                  status: lock.status,
                                  lock_type: lock.lock_type,
                                  locked_at: lock.locked_at,
                                  expires_at: lock.expires_at,
                                  locator: lock.locator, // Incluir el locator
                                  // Campos adicionales para compatibilidad
                                  sillaId: lock.seat_id,
                                  zonaNombre: zonaNombre
                                };
                              });
                              
                              seats.push(...seatLocksAsSeats);
                              console.log('✅ Asientos encontrados en seat_locks por locator:', seatLocksAsSeats.length);
                              console.log('✅ Asientos convertidos:', seatLocksAsSeats);
                            } else {
                              console.log('⚠️ No se encontraron seat_locks para este locator');
                            }
                          } catch (e) {
                            console.error('Error loading seat_locks:', e);
                          }
                        }
                        
                        // Crear objeto de transacción para el carrito
                        const transactionData = {
                          id: searchResult.id,
                          locator: searchResult.locator,
                          amount: searchResult.amount,
                          currency: searchResult.currency,
                          status: searchResult.status,
                          event: eventData,
                          funcion: searchResult.funcion,
                          seats: seats,
                          user_id: searchResult.user_id,
                          created_at: searchResult.created_at,
                          payment_method: searchResult.payment_method,
                          gateway_name: searchResult.gateway_name
                        };
                        
                        // Emitir evento personalizado para cargar en el carrito
                        window.dispatchEvent(new CustomEvent('loadPendingTransaction', {
                          detail: transactionData
                        }));
                        
                        message.success('Transacción cargada en el carrito para completar venta');
                        onCancel();
                      } else {
                        message.error('No se pudo cargar la transacción: falta información de la función');
                      }
                    }}
                  >
                    Completar Venta
                  </Button>
                  <Button
                    danger
                    onClick={async () => {
                      // Anular transacción pendiente
                      try {
                        // Actualizar estado en payment_transactions
                        const { error: updateError } = await supabase
                          .from('payment_transactions')
                          .update({ 
                            status: 'cancelled',
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', searchResult.id);
                        
                        if (updateError) {
                          console.error('Error actualizando payment_transactions:', updateError);
                          message.error('Error al anular la transacción');
                          return;
                        }
                        
                        // Actualizar estado en seat_locks
                        const { error: locksError } = await supabase
                          .from('seat_locks')
                          .update({ 
                            status: 'anulado',
                            updated_at: new Date().toISOString()
                          })
                          .eq('locator', searchResult.locator);
                        
                        if (locksError) {
                          console.error('Error actualizando seat_locks:', locksError);
                          message.warning('Transacción anulada pero puede haber problemas con los asientos');
                        } else {
                          message.success('Transacción pendiente y asientos anulados correctamente');
                        }
                        
                        // Recargar la búsqueda para mostrar el nuevo estado
                        onSearch(searchResult.locator);
                        
                      } catch (error) {
                        console.error('Error anulando transacción:', error);
                        message.error('Error al anular la transacción');
                      }
                    }}
                  >
                    Anular Transacción
                  </Button>
                </>
              )}
              
              {searchResult.status === 'completed' && (
                <>
                  <Button
                    type="primary"
                    onClick={() => {
                      // Descargar tickets
                      message.success('Descargando tickets...');
                    }}
                  >
                    Descargar Tickets
                  </Button>
                  <Button
                    onClick={() => {
                      // Ver detalles completos
                      message.info('Mostrando detalles completos de la venta');
                    }}
                  >
                    Ver Detalles Completos
                  </Button>
                </>
              )}
              
              {searchResult.status === 'failed' && (
                <>
                  <Button
                    type="primary"
                    onClick={() => {
                      // Reintentar pago
                      message.info('Reintentando pago...');
                    }}
                  >
                    Reintentar Pago
                  </Button>
                  <Button
                    danger
                    onClick={async () => {
                      // Anular transacción
                      try {
                        // Actualizar estado en payment_transactions
                        const { error: updateError } = await supabase
                          .from('payment_transactions')
                          .update({ 
                            status: 'cancelled',
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', searchResult.id);
                        
                        if (updateError) {
                          console.error('Error actualizando payment_transactions:', updateError);
                          message.error('Error al anular la transacción');
                          return;
                        }
                        
                        // Actualizar estado en seat_locks
                        const { error: locksError } = await supabase
                          .from('seat_locks')
                          .update({ 
                            status: 'anulado',
                            updated_at: new Date().toISOString()
                          })
                          .eq('locator', searchResult.locator);
                        
                        if (locksError) {
                          console.error('Error actualizando seat_locks:', locksError);
                          message.warning('Transacción anulada pero puede haber problemas con los asientos');
                        } else {
                          message.success('Transacción y asientos anulados correctamente');
                        }
                        
                        // Recargar la búsqueda para mostrar el nuevo estado
                        onSearch(searchResult.locator);
                        
                      } catch (error) {
                        console.error('Error anulando transacción:', error);
                        message.error('Error al anular la transacción');
                      }
                    }}
                  >
                    Anular Transacción
                  </Button>
                </>
              )}
              
              {/* Acciones generales */}
              <Button
                onClick={() => {
                  // Imprimir información
                  window.print();
                }}
              >
                Imprimir
              </Button>
              
              <Button
                onClick={() => {
                  // Copiar localizador
                  navigator.clipboard.writeText(searchResult.locator);
                  message.success('Localizador copiado al portapapeles');
                }}
              >
                Copiar Localizador
              </Button>
            </div>
          </div>
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
