import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Space, Typography, Divider } from 'antd';
import { GiftOutlined, CrownOutlined, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';
import { message } from 'antd'; // Added message import

const { Text, Title } = Typography;

// ==========================
// 1. CONFIGURACIÓN GLOBAL
// ==========================

// Aquí defines los eventos especiales. Puedes agregar o quitar IDs fácilmente:
const eventosOcultarIVA = ['4218', '4249', '4250', '4299', '4064','4371'];   // IDs que ocultarán el IVA
const eventosOcultarBs = ['4249', '4250'];            // IDs que ocultarán bolívares
const eventoEspecialEUR = ['4289', '4299','4371'];                    // Evento que usa tasa EUR
const eventosOcultarPrecioBase = ['4218', '4249', '4250', '4299', '4064', '4371']; // IDs que ocultarán precio base y cargos

// Obtener el ID del evento desde la URL:
const urlParams = new URLSearchParams(window.location.search);
const idEventoActual = urlParams.get('idEvento');

// Flags globales
const debeOcultarIVA = eventosOcultarIVA.includes(idEventoActual);
const debeOcultarBs = eventosOcultarBs.includes(idEventoActual);
const esEventoEspecial = eventoEspecialEUR.includes(idEventoActual);
const debeOcultarPrecioBase = eventosOcultarPrecioBase.includes(idEventoActual);

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
      console.log('Fetching funcion with ID:', selectedFuncion.id);
      const { data: funcion, error: funcionError } = await supabase
        .from('funciones')
        .select('*, plantilla(*)')
        .eq('id', selectedFuncion.id)
        .single();

      if (funcionError) {
        console.error('Error loading funcion:', funcionError);
        message.error('Error al cargar la función');
        return;
      }

      if (!funcion) {
        console.error('No se encontró la función');
        message.error('No se encontró la función');
        return;
      }

      if (!funcion.plantilla) {
        console.error('La función no tiene plantilla asignada');
        message.error('La función no tiene plantilla de precios asignada');
        return;
      }

      console.log('Función cargada:', funcion);
      console.log('Plantilla asignada:', funcion.plantilla);

      // Cargar las entradas disponibles para este evento
      console.log('Fetching entradas...');
      const { data: entradas, error: entradasError } = await supabase
        .from('entradas')
        .select('*')
        .order('nombre_entrada');

      if (entradasError) {
        console.error('Error loading entradas:', entradasError);
        message.error('Error al cargar entradas');
        return;
      }

      // Cargar las zonas del mapa (filtrar por la sala de la función)
      // Resolver salaId de forma robusta
      const salaId = funcion.sala?.id || funcion.sala_id || funcion.sala;
      console.log('Fetching zonas for sala:', salaId);
      const { data: zonas, error: zonasError } = await supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', salaId)
        .order('nombre');

      if (zonasError) {
        console.error('Error loading zonas:', zonasError);
        message.error('Error al cargar zonas');
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
      message.error('Error al cargar opciones de precio');
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
    <div className="mb-2">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {filteredOptions.map((option) => (
          <Card
            key={option.id}
            size="small"
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPriceId === option.id
                ? 'ring-2 ring-orange-500 shadow-lg'
                : ''
            }`}
            onClick={() => handlePriceSelect(option)}
          >
            <div className="space-y-1">
              <div>
                <span className="ant-typography text-xs">
                  <strong>{option.entrada.nombre_entrada}</strong>
                </span>
              </div>
              <div>
                <span className="ant-typography ant-typography-secondary text-xs">
                  {option.zona.nombre}
                </span>
              </div>
              <div className="ant-divider ant-divider-horizontal" role="separator" style={{ margin: 2 }}></div>
              <div className="text-center">
                <div className="text-white px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#5c1473' }}>
                  ${option.precio.toFixed(2)}
                </div>
                {option.comision > 0 && (
                  <span className="ant-typography ant-typography-secondary text-xs">
                    +${option.comision.toFixed(2)} comisión
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Cuando no hay opciones, no mostramos bloque intrusivo */}


    </div>
  );
};

export default DynamicPriceSelector; 