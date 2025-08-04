import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';

const DynamicPriceSelector = ({ 
  selectedFuncion, 
  selectedPlantilla, 
  onPriceSelect, 
  selectedPriceId 
}) => {
  const [priceOptions, setPriceOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFuncion && selectedPlantilla) {
      loadPriceOptions();
    }
  }, [selectedFuncion, selectedPlantilla]);

  const loadPriceOptions = async () => {
    if (!selectedFuncion || !selectedPlantilla) return;

    setLoading(true);
    try {
      // Cargar las entradas disponibles para este evento
      const { data: entradas, error: entradasError } = await supabase
        .from('entradas')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (entradasError) {
        console.error('Error loading entradas:', entradasError);
        return;
      }

      // Cargar las zonas del mapa
      const { data: zonas, error: zonasError } = await supabase
        .from('zonas')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (zonasError) {
        console.error('Error loading zonas:', zonasError);
        return;
      }

      // Cargar los detalles de la plantilla de precios
      const { data: plantillaDetalles, error: detallesError } = await supabase
        .from('plantillas_precios_detalles')
        .select('*')
        .eq('plantilla_id', selectedPlantilla.id);

      if (detallesError) {
        console.error('Error loading plantilla detalles:', detallesError);
        return;
      }

      // Crear opciones de precio combinando entradas y zonas
      const options = [];
      
      entradas.forEach(entrada => {
        zonas.forEach(zona => {
          // Buscar precio en la plantilla
          const precioDetalle = plantillaDetalles.find(detalle => 
            detalle.entrada_id === entrada.id && detalle.zona_id === zona.id
          );

          if (precioDetalle) {
            options.push({
              id: `${entrada.id}_${zona.id}`,
              entrada: entrada,
              zona: zona,
              precio: precioDetalle.precio,
              comision: precioDetalle.comision_usuario || 0,
              precioOriginal: precioDetalle.precio_original || precioDetalle.precio,
              nombre: `${entrada.nombre} - ${zona.nombre}`,
              color: entrada.color || '#5C1473'
            });
          }
        });
      });

      setPriceOptions(options);
    } catch (error) {
      console.error('Error loading price options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSelect = (priceOption) => {
    onPriceSelect(priceOption);
  };

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

  if (!selectedFuncion || !selectedPlantilla) {
    return (
      <div className="mb-6">
        <div className="text-center py-4">
          <p className="text-gray-600">Selecciona un evento y una plantilla de precios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Opciones de Precio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {priceOptions.map((option) => (
          <button
            key={option.id}
            className={`p-4 rounded-lg border-2 font-medium transition-all duration-200 ${
              selectedPriceId === option.id
                ? 'border-orange-500 bg-orange-50 shadow-lg'
                : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
            }`}
            onClick={() => handlePriceSelect(option)}
          >
            <div className="text-left">
              <div className="font-semibold text-gray-900 mb-2">
                {option.entrada.nombre}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Zona: {option.zona.nombre}
              </div>
              <div 
                className="text-white px-3 py-2 rounded text-sm font-medium"
                style={{ backgroundColor: option.color }}
              >
                ${option.precio.toFixed(2)}
                {option.comision > 0 && (
                  <span className="ml-2 text-xs opacity-90">
                    +${option.comision.toFixed(2)} comisión
                  </span>
                )}
              </div>
              {option.precioOriginal !== option.precio && (
                <div className="text-xs text-gray-500 mt-1 line-through">
                  ${option.precioOriginal.toFixed(2)}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {priceOptions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay opciones de precio configuradas para esta plantilla</p>
        </div>
      )}
    </div>
  );
};

export default DynamicPriceSelector; 