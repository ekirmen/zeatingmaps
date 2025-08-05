import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Space, Typography, Divider } from 'antd';
import { GiftOutlined, CrownOutlined, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Text, Title } = Typography;

const DynamicPriceSelector = ({ 
  selectedFuncion, 
  onPriceSelect, 
  selectedPriceId 
}) => {
  const [priceOptions, setPriceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadPriceOptions = useCallback(async () => {
    console.log('loadPriceOptions called with:', { selectedFuncion });
    if (!selectedFuncion) {
      console.log('Missing selectedFuncion, returning early');
      return;
    }

    setLoading(true);
    try {
      // Obtener la función con su plantilla asignada
      const { data: funcion, error: funcionError } = await supabase
        .from('funciones')
        .select('*, plantilla(*)')
        .eq('id', selectedFuncion.id)
        .single();

      if (funcionError) {
        console.error('Error loading funcion:', funcionError);
        return;
      }

      if (!funcion.plantilla) {
        console.error('La función no tiene plantilla asignada');
        return;
      }

      console.log('Función cargada:', funcion);
      console.log('Plantilla asignada:', funcion.plantilla);

      // Cargar las entradas disponibles para este evento
      const { data: entradas, error: entradasError } = await supabase
        .from('entradas')
        .select('*')
        .order('nombre_entrada');

      if (entradasError) {
        console.error('Error loading entradas:', entradasError);
        return;
      }

      // Cargar las zonas del mapa (filtrar por la sala de la función)
      const { data: zonas, error: zonasError } = await supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', funcion.sala.toString())
        .order('nombre');

      if (zonasError) {
        console.error('Error loading zonas:', zonasError);
        return;
      }

      // Usar la plantilla asignada a la función
      const plantilla = funcion.plantilla;

      // Parsear los detalles de la plantilla
      let plantillaDetalles = [];
      if (plantilla && plantilla.detalles) {
        try {
          plantillaDetalles = typeof plantilla.detalles === 'string' 
            ? JSON.parse(plantilla.detalles) 
            : plantilla.detalles;
        } catch (parseError) {
          console.error('Error parsing plantilla detalles:', parseError);
          plantillaDetalles = [];
        }
      }

      console.log('Plantilla cargada:', plantilla);
      console.log('Detalles de plantilla:', plantillaDetalles);
      console.log('Entradas disponibles:', entradas);
      console.log('Zonas disponibles:', zonas);
      console.log('Función sala:', funcion.sala);
      console.log('Función sala tipo:', typeof funcion.sala);
      
      // Log detallado de los detalles de la plantilla
      if (plantillaDetalles.length > 0) {
        console.log('Detalles de plantilla (primeros 3):', plantillaDetalles.slice(0, 3));
        plantillaDetalles.forEach((detalle, index) => {
          console.log(`Detalle ${index}:`, {
            zonaId: detalle.zonaId,
            productoId: detalle.productoId,
            precio: detalle.precio,
            tipo: typeof detalle.zonaId
          });
        });
      }

      // Crear opciones de precio combinando entradas y zonas
      const options = [];
      
      entradas.forEach(entrada => {
        zonas.forEach(zona => {
          console.log(`Buscando precio para entrada ${entrada.id} (${entrada.nombre_entrada}) y zona ${zona.id} (${zona.nombre})`);
          
          // Buscar precio en la plantilla - comparar tanto como string como número
          const precioDetalle = plantillaDetalles.find(detalle => 
            (detalle.zonaId === zona.id || detalle.zonaId === zona.id.toString()) && 
            (detalle.productoId === entrada.id || detalle.productoId === entrada.id.toString())
          );
          
          console.log('Precio detalle encontrado:', precioDetalle);

          if (precioDetalle && precioDetalle.precio) {
            // Determinar categoría basada en el nombre de la entrada
            let category = 'regular';
            if ((entrada.nombre_entrada && entrada.nombre_entrada.toLowerCase().includes('cortesía')) || 
                (entrada.nombre_entrada && entrada.nombre_entrada.toLowerCase().includes('cortesia'))) {
              category = 'cortesia';
            } else if (entrada.nombre_entrada && entrada.nombre_entrada.toLowerCase().includes('vip')) {
              category = 'vip';
            } else if (entrada.nombre_entrada && entrada.nombre_entrada.toLowerCase().includes('premium')) {
              category = 'premium';
            }

            options.push({
              id: `${entrada.id}_${zona.id}`,
              entrada: entrada,
              zona: zona,
              precio: precioDetalle.precio,
              comision: precioDetalle.comision || 0,
              precioOriginal: precioDetalle.precio_original || precioDetalle.precio,
              nombre: `${entrada.nombre_entrada} - ${zona.nombre}`,
              color: entrada.color || '#5C1473',
              category: category,
              descripcion: entrada.descripcion || ''
            });
          }
        });
      });

      console.log('Opciones de precio generadas:', options);
      setPriceOptions(options);
    } catch (error) {
      console.error('Error loading price options:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFuncion]);

  useEffect(() => {
    console.log('DynamicPriceSelector useEffect triggered:', { selectedFuncion });
    if (selectedFuncion) {
      loadPriceOptions();
    }
  }, [selectedFuncion, loadPriceOptions]);

  const handlePriceSelect = (priceOption) => {
    onPriceSelect(priceOption);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'cortesia':
        return <GiftOutlined style={{ color: '#52c41a' }} />;
      case 'vip':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'premium':
        return <DollarOutlined style={{ color: '#722ed1' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'cortesia':
        return 'Cortesía';
      case 'vip':
        return 'VIP';
      case 'premium':
        return 'Premium';
      default:
        return 'Regular';
    }
  };

  // Función auxiliar para determinar categoría basada en nombre de entrada
  const getCategoryFromEntrada = (entradaNombre) => {
    if (!entradaNombre) return 'regular';
    const nombre = entradaNombre.toLowerCase();
    if (nombre.includes('cortesía') || nombre.includes('cortesia')) {
      return 'cortesia';
    } else if (nombre.includes('vip')) {
      return 'vip';
    } else if (nombre.includes('premium')) {
      return 'premium';
    }
    return 'regular';
  };

  // Generar botones dinámicos basados en zonas
  const generateZonaButtons = () => {
    if (!priceOptions.length) return [];
    
    // Obtener zonas únicas de la base de datos
    const uniqueZonas = [...new Set(priceOptions.map(opt => opt.zona.nombre))];
    
    const buttons = [];
    
    // Botón "Todas"
    buttons.push(
      <Button 
        key="all"
        type={selectedCategory === 'all' ? 'primary' : 'default'}
        onClick={() => setSelectedCategory('all')}
      >
        Todas
      </Button>
    );

    // Botones por cada zona única
    uniqueZonas.forEach(zonaNombre => {
      const count = priceOptions.filter(opt => opt.zona.nombre === zonaNombre).length;
      
      buttons.push(
        <Button 
          key={zonaNombre}
          type={selectedCategory === zonaNombre ? 'primary' : 'default'}
          icon={getCategoryIcon(getCategoryFromEntrada(priceOptions.find(opt => opt.zona.nombre === zonaNombre)?.entrada.nombre_entrada))}
          onClick={() => setSelectedCategory(zonaNombre)}
        >
          {zonaNombre} ({count})
        </Button>
      );
    });

    return buttons;
  };

  // Filtrar opciones por zona seleccionada
  const filteredOptions = selectedCategory === 'all' 
    ? priceOptions 
    : priceOptions.filter(option => option.zona.nombre === selectedCategory);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando opciones de precio...</p>
        </div>
      </div>
    );
  }

  if (!selectedFuncion) {
    return (
      <div className="mb-6">
        <div className="text-center py-4">
          <p className="text-gray-600">Selecciona un evento y función para ver las opciones de precio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Title level={4} style={{ margin: 0 }}>Selecciona Zona y Precio</Title>
        <Text type="secondary">Paso 1: Elige la zona y tipo de entrada</Text>
      </div>

      {/* Filtros por zona - DINÁMICOS */}
      <div className="mb-4">
        <Space wrap>
          {generateZonaButtons()}
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOptions.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPriceId === option.id
                ? 'ring-2 ring-orange-500 shadow-lg'
                : ''
            }`}
            onClick={() => handlePriceSelect(option)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(option.category)}
                <Badge 
                  count={getCategoryLabel(option.category)} 
                  style={{ 
                    backgroundColor: option.category === 'cortesia' ? '#52c41a' : 
                               option.category === 'vip' ? '#faad14' : 
                               option.category === 'premium' ? '#722ed1' : '#1890ff'
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Text strong className="text-lg">
                  {option.entrada.nombre_entrada}
                </Text>
              </div>
              
              <div>
                <Text type="secondary">
                  Zona: {option.zona.nombre}
                </Text>
              </div>

              {option.descripcion && (
                <div>
                  <Text type="secondary" className="text-sm">
                    {option.descripcion}
                  </Text>
                </div>
              )}

              <Divider style={{ margin: '8px 0' }} />

              <div className="text-center">
                <div 
                  className="text-white px-4 py-2 rounded-lg text-lg font-bold"
                  style={{ backgroundColor: option.color }}
                >
                  ${option.precio.toFixed(2)}
                </div>
                
                {option.comision > 0 && (
                  <Text type="secondary" className="text-sm">
                    +${option.comision.toFixed(2)} comisión
                  </Text>
                )}
                
                {option.precioOriginal !== option.precio && (
                  <Text delete className="text-sm">
                    ${option.precioOriginal.toFixed(2)}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredOptions.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No hay opciones de precio disponibles</h3>
            <p className="text-yellow-700 mb-4">
              {selectedCategory === 'all' 
                ? 'No se encontraron opciones de precio para esta función y plantilla.'
                : `No hay opciones de precio para la zona "${selectedCategory}" disponibles.`
              }
            </p>
            <div className="text-sm text-yellow-600">
              <p>• Verifica que la plantilla de precios tenga configurados los precios</p>
              <p>• Asegúrate de que las entradas y zonas estén activas</p>
              <p>• Intenta cambiar la zona de filtro</p>
              <p>• Revisa la consola del navegador para más detalles de depuración</p>
            </div>
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Información de depuración:</strong></p>
              <p>• Función seleccionada: {selectedFuncion?.id || 'Ninguna'} - {selectedFuncion?.sala?.nombre || 'Sin sala'}</p>
              <p>• Plantilla asignada: {selectedFuncion?.plantilla?.id || 'Ninguna'} - {selectedFuncion?.plantilla?.nombre || 'Sin plantilla'}</p>
              <p>• Opciones de precio cargadas: {priceOptions.length}</p>
              <p>• Zona filtrada: {selectedCategory === 'all' ? 'Todas' : selectedCategory}</p>
            </div>
          </div>
        </div>
      )}

      {selectedPriceId && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <Text strong>Precio seleccionado</Text>
          </div>
          <Text className="text-sm text-gray-600 mt-1">
            Ahora puedes seleccionar asientos en el mapa. El precio se aplicará automáticamente.
          </Text>
        </div>
      )}
    </div>
  );
};

export default DynamicPriceSelector; 