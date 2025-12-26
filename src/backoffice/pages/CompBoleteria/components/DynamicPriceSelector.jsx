import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Badge, Button, Space, Typography, Divider } from '../../../../utils/antdComponents';
import { InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';
import { message } from '../../../../utils/antdComponents'; // Added message import

const { Text, Title } = Typography;

// Nota: No usamos flags globales por ID de evento en este proyecto.

const DynamicPriceSelector = ({
  selectedFuncion,
  selectedPlantilla,
  onPriceSelect,
  selectedPriceId
}) => {
  const [priceOptions, setPriceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadPriceOptions = useCallback(async () => {
    if (!selectedFuncion) {
      return;
    }

    setLoading(true);
    try {
      // Usar plantilla ya seleccionada si viene como prop, si no, cargar con la función
      let plantilla = selectedPlantilla;
      let funcion = selectedFuncion;

      if (!plantilla) {
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('*, plantilla(*)')
          .eq('id', selectedFuncion.id)
          .single();

        if (funcionError) {
          console.error('Error loading funcion:', funcionError);
          message.error('Error al cargar la función');
          return;
        }

        if (!funcionData) {
          console.error('No se encontró la función');
          message.error('No se encontró la función');
          return;
        }

        funcion = funcionData;
        plantilla = funcionData.plantilla;
      }

      if (!plantilla) {
        console.error('La función no tiene plantilla asignada');
        message.error('La función no tiene plantilla de precios asignada');
        return;
      }
      // Cargar las entradas disponibles para este evento (para resolver nombres)
      const { data: entradas, error: entradasError } = await supabase
        .from('entradas')
        .select('*')
        .order('nombre_entrada');

      if (entradasError) {
        console.error('Error loading entradas:', entradasError);
        message.error('Error al cargar entradas');
        return;
      }

      // Cargar las zonas del mapa (filtrar por la sala de la función) para resolver nombres de zona
      // Resolver salaId de forma robusta
      const salaId = funcion.sala?.id || funcion.sala_id || funcion.sala;
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
      // Log detallado de los detalles de la plantilla
      if (plantillaDetalles.length > 0) {
        console.log('Detalles de plantilla (primeros 3):', plantillaDetalles.slice(0, 3));
        plantillaDetalles.forEach((detalle, index) => {
        });
      }

      // Construir mapas para resolución rápida
      const entradasById = new Map((entradas || []).map(e => [String(e.id), e]));
      const zonasById = new Map((zonas || []).map(z => [String(z.id), z]));

      // Crear opciones šNICAMENTE desde los detalles de la plantilla
      const options = [];
      for (const detalle of plantillaDetalles) {
        const zonaKey = String(detalle.zonaId ?? detalle.zona?.id ?? detalle.zona);
        const prodKey = String(detalle.productoId ?? detalle.producto?.id ?? detalle.producto);
        if (!zonaKey || !prodKey) continue;
        const entrada = entradasById.get(prodKey);
        const zona = zonasById.get(zonaKey);
        if (!entrada || !zona) continue;

        if (detalle.precio == null) continue;

        options.push({
          id: `${entrada.id}_${zona.id}`,
          entrada,
          zona,
          precio: Number(detalle.precio),
          comision: Number(detalle.comision || 0),
          precioOriginal: Number(detalle.precio_original || detalle.precio),
          nombre: `${entrada.nombre_entrada} - ${zona.nombre}`,
          color: zona.color || entrada.color || '#5C1473',
          descripcion: entrada.descripcion || ''
        });
      }
      setPriceOptions(options);
    } catch (error) {
      console.error('Error loading price options:', error);
      message.error('Error al cargar opciones de precio');
    } finally {
      setLoading(false);
    }
  }, [selectedFuncion]);

  useEffect(() => {
    if (selectedFuncion) {
      loadPriceOptions();
    }
  }, [selectedFuncion, loadPriceOptions]);

  const handlePriceSelect = (priceOption) => {
    onPriceSelect(priceOption);
  };

  // No usamos categorías heurísticas ni íconos genéricos. Todo viene de BD.

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

  // Agrupar opciones por zona para mostrar en un cuadro
  const optionsByZona = useMemo(() => {
    const groups = {};
    filteredOptions.forEach(opt => {
      const key = opt.zona.nombre || String(opt.zona.id);
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return groups;
  }, [filteredOptions]);

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
      {/* Cabecera visible de plantilla y zona */}
      {selectedPlantilla && (
        <div className="mb-2">
          <Text className="text-xs text-gray-600">Plantilla: {selectedPlantilla.nombre || selectedPlantilla.id}</Text>
        </div>
      )}

      {/* Filtros de zona */}
      <div className="mb-2 flex flex-wrap gap-2">
        {generateZonaButtons()}
      </div>

      {/* Cuadro de Zonas y Precios */}
      <div className="border rounded-md bg-white">
        <div className="px-3 py-2 border-b font-medium text-sm text-gray-800">Zonas y precios</div>
        <div className="p-2 space-y-2">
          {Object.keys(optionsByZona).length === 0 && (
            <div className="text-xs text-gray-500 px-2 py-4 text-center">No hay opciones de precio disponibles</div>
          )}
          {Object.entries(optionsByZona).map(([zonaNombre, options]) => (
            <div key={zonaNombre} className="border rounded">
              <div className="px-3 py-2 bg-gray-50 text-xs font-semibold flex items-center justify-between">
                <span>{zonaNombre}</span>
                <span className="text-gray-500">{options.length} opción(es)</span>
              </div>
              <div className="divide-y">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-purple-50 ${
                      selectedPriceId === option.id ? 'bg-purple-50 ring-1 ring-purple-300' : ''
                    }`}
                    onClick={() => handlePriceSelect(option)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: option.color || '#5C1473' }}></div>
                      <div>
                        <div className="font-medium">{option.entrada.nombre_entrada}</div>
                        <div className="text-gray-500">{zonaNombre}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${option.precio.toFixed(2)}</div>
                      {option.comision > 0 && (
                        <div className="text-gray-500">+${option.comision.toFixed(2)} comisión</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicPriceSelector;

