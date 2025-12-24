import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { message } from '../../utils/antdComponents';
import realtimeService from '../services/realtimeService';
import { saveMapa, fetchMapa } from '../services/apibackoffice';
import { syncSeatsForSala } from '../services/apibackoffice';
import { useTenant } from '../../contexts/TenantContext';

export const useMapaLoadingSaving = () => {
  const { salaId } = useParams();
  const { currentTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const lastSavedElements = useRef(null); // Referencia para evitar recargas innecesarias

  // Configurar Realtime usando Edge Functions
  useEffect(() => {
    if (!salaId) return;

    if (process.env.NODE_ENV === 'development') {
    }

    // Sistema de realtime optimizado - solo en producción
    if (process.env.NODE_ENV === 'production') {
      // Implementar realtime solo cuando sea necesario
    } else {
    }

    // Cleanup al desmontar
    return () => {
      if (process.env.NODE_ENV === 'development') {
      }
    };
  }, [salaId]);

  const transformarParaGuardar = (elements, zones = []) => {
    console.log('[transformarParaGuardar] Inicio. Elementos:', elements?.length);
    if (!elements || !Array.isArray(elements)) {
      return { contenido: [], zonas: zones || [], tenant_id: currentTenant?.id };
    }

    // 1. Extract Background Image
    let imagen_fondo = null;
    const backgroundElement = elements.find(el => el && el.type === 'background');

    console.log('[transformarParaGuardar] Background encontrado:', backgroundElement ? 'SÍ' : 'NO');
    if (backgroundElement) {
      // Extract the heavy image data
      imagen_fondo = backgroundElement.imageData || backgroundElement.imageUrl || null;
      console.log('[transformarParaGuardar] Imagen fondo extraída:', imagen_fondo ? 'PRESENTE' : 'NULL');
      // We keep the background element in the JSON but WITHOUT the heavy image data
    }

    const mesas = elements.filter(el => el && el.type === 'mesa');
    const contenido = mesas.map(mesa => {
      if (!mesa || !mesa._id) {
        return null;
      }
      const sillas = elements
        .filter(el => el && el.type === 'silla' && el.parentId === mesa._id)
        .map(silla => {
          if (!silla || !silla._id) {
            return null;
          }

          // Optimized: Only save zonaId
          const zonaId = silla.zonaId || (silla.zona && typeof silla.zona === 'object' ? silla.zona.id : silla.zona);

          return {
            _id: silla._id,
            nombre: silla.nombre || '',
            posicion: silla.posicion || { x: 0, y: 0 },
            width: silla.width || 20,
            height: silla.height || 20,
            zona: zonaId || null,
            estado: silla.estado || 'disponible'
          };
        })
        .filter(silla => silla !== null);

      // Optimized: Only save zonaId
      const zonaId = mesa.zonaId || (mesa.zona && typeof mesa.zona === 'object' ? mesa.zona.id : mesa.zona);

      return {
        _id: mesa._id,
        nombre: mesa.nombre || '',
        posicion: mesa.posicion || { x: 0, y: 0 },
        width: mesa.width || 100,
        height: mesa.height || 100,
        radius: mesa.radius || null,
        shape: mesa.shape || 'rect',
        zona: zonaId || null,
        sillas: sillas
      };
    }).filter(mesa => mesa !== null);

    // Add back the lightweight background element if it existed
    if (backgroundElement) {
      const lightBackground = {
        ...backgroundElement,
        imageData: null,
        imageUrl: null,
        _isBackgroundRef: true
      };
      contenido.unshift(lightBackground);
    }

    const payload = {
      contenido: contenido,
      zonas: zones || [],
      tenant_id: currentTenant?.id,
      imagen_fondo: imagen_fondo
    };
    console.log('[transformarParaGuardar] Payload final generated with imagen_fondo:', !!imagen_fondo, payload);
    return payload;
  };

  const loadMapa = useCallback(async (salaId, setElements, setZones) => {
    if (!salaId) {
      return;
    }
    setIsLoading(true);

    try {
      // Usar la API local en lugar de Supabase
      const response = await fetch(`/api/mapas/${salaId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success || !data.data || !data.data.contenido) {
        // Crear elementos de prueba para verificar que el renderizado funciona
        const elementosPrueba = [
          {
            _id: 'mesa_prueba_1', type: 'mesa', shape: 'rect', posicion: { x: 100, y: 100 }, width: 120, height: 80, nombre: 'Mesa de Prueba 1', zonaId: null, sillas: []
          },
          {
            _id: 'mesa_prueba_2', type: 'mesa', shape: 'circle', posicion: { x: 300, y: 100 }, radius: 60, nombre: 'Mesa de Prueba 2', zonaId: null, sillas: []
          }
        ];
        setElements(elementosPrueba);
        setZones([]);
        return;
      }

      const mapaData = data.data;

      // Cargar zonas si no están disponibles
      let zonasCargadas = mapaData.zonas || [];
      if (zonasCargadas.length === 0) {
        try {
          const zonasResponse = await fetch(`/api/zonas?salaId=${salaId}`);
          if (zonasResponse.ok) {
            zonasCargadas = await zonasResponse.json();
          }
        } catch (error) { }
      }

      // Transformar elementos del mapa
      const elementosCrudos = (mapaData.contenido || []).reduce((acc, mesa) => {
        // Handle Background Restoration
        if (mesa && (mesa.type === 'background' || mesa._isBackgroundRef)) {
          // Restore background image from mapaData.imagen_fondo if available
          const restoredBackground = {
            ...mesa,
            type: 'background',
            imageData: mapaData.imagen_fondo || mesa.imageData || null,
            imageUrl: mapaData.imagen_fondo || mesa.imageUrl || null
          };
          return [...acc, restoredBackground];
        }

        if (!mesa || !mesa._id || mesa.type !== 'mesa') {
          return acc;
        }

        // Create mesa with all necessary properties
        const mesaConZona = {
          ...mesa,
          type: 'mesa',
          shape: mesa.shape || (mesa.radius ? 'circle' : 'rect'),
          radius: mesa.radius || (mesa.width ? mesa.width / 2 : 50),
          width: mesa.width || (mesa.radius ? mesa.radius * 2 : 100),
          height: mesa.height || (mesa.radius ? mesa.radius * 2 : 100),
          posicion: mesa.posicion || { x: 0, y: 0 },
          zona: ['string', 'number'].includes(typeof mesa.zona)
            ? zonasCargadas.find(z => z && z.id === mesa.zona)
            : mesa.zona,
          zonaId: ['string', 'number'].includes(typeof mesa.zona)
            ? mesa.zona
            : (mesa.zona && typeof mesa.zona === 'object' ? mesa.zona.id : null),
        };

        // Transform sillas array
        const sillas = (mesa.sillas || []).map(silla => {
          if (!silla || !silla._id) {
            return null;
          }

          return {
            ...silla,
            type: 'silla',
            parentId: mesa._id,
            width: silla.width || 20,
            height: silla.height || 20,
            nombre: silla.nombre || '',
            label: silla.nombre || '',
            labelPlacement: 'top',
            labelStyle: {
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px'
            },
            zona: ['string', 'number'].includes(typeof silla.zona)
              ? zonasCargadas.find(z => z && z.id === silla.zona)
              : silla.zona,
            zonaId: ['string', 'number'].includes(typeof silla.zona)
              ? silla.zona
              : (silla.zona && typeof silla.zona === 'object' ? silla.zona.id : null),
          };
        }).filter(silla => silla !== null);

        return [...acc, mesaConZona, ...sillas];
      }, []);
      // Guardar referencia de los elementos cargados para evitar recargas innecesarias
      lastSavedElements.current = JSON.stringify(elementosCrudos);
      setZones(zonasCargadas);
      setElements(elementosCrudos);
    } catch (error) {
      console.error('Error al cargar el mapa desde API local:', error);
      // Fallback: intentar cargar desde Supabase si la API local falla
      try {
        const data = await fetchMapa(salaId);
        if (data && data.contenido) {
          // ... resto del código de transformación existente
          const elementosCrudos = (data.contenido || []).reduce((acc, mesa) => {
            if (!mesa || !mesa._id) {
              return acc;
            }

            const mesaConZona = {
              ...mesa,
              type: 'mesa',
              shape: mesa.shape || (mesa.radius ? 'circle' : 'rect'),
              radius: mesa.radius || (mesa.width ? mesa.width / 2 : 50),
              width: mesa.width || (mesa.radius ? mesa.radius * 2 : 100),
              height: mesa.height || (mesa.radius ? mesa.radius * 2 : 100),
              posicion: mesa.posicion || { x: 0, y: 0 },
              zona: ['string', 'number'].includes(typeof mesa.zona)
                ? (data.zonas || []).find(z => z && z.id === mesa.zona)
                : mesa.zona,
              zonaId: ['string', 'number'].includes(typeof mesa.zona)
                ? mesa.zona
                : (mesa.zona && typeof mesa.zona === 'object' ? mesa.zona.id : null),
            };

            const sillas = (mesa.sillas || []).map(silla => {
              if (!silla || !silla._id) {
                return null;
              }

              return {
                ...silla,
                type: 'silla',
                parentId: mesa._id,
                width: silla.width || 20,
                height: silla.height || 20,
                nombre: silla.nombre || '',
                label: silla.nombre || '',
                labelPlacement: 'top',
                labelStyle: {
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                },
                zona: ['string', 'number'].includes(typeof silla.zona)
                  ? (data.zonas || []).find(z => z && z.id === silla.zona)
                  : silla.zona,
                zonaId: ['string', 'number'].includes(typeof silla.zona)
                  ? silla.zona
                  : (silla.zona && typeof silla.zona === 'object' ? silla.zona.id : null),
              };
            }).filter(silla => silla !== null);

            return [...acc, mesaConZona, ...sillas];
          }, []);

          console.log('[loadMapa] Elementos cargados desde Supabase (fallback):', elementosCrudos.length);
          lastSavedElements.current = JSON.stringify(elementosCrudos);
          setZones(data.zonas || []);
          setElements(elementosCrudos);
        }
      } catch (fallbackError) {
        console.error('Error en fallback a Supabase:', fallbackError);
        setElements([]);
        setZones([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (salaId, elements, zones) => {
    if (!salaId || !elements) {
      console.error('[handleSave] Datos insuficientes para guardar');
      return;
    }

    // Validar que zones sea un array
    const zonasValidas = Array.isArray(zones) ? zones : [];
    // Verificar si realmente hay cambios que guardar
    const currentElementsString = JSON.stringify(elements);
    if (lastSavedElements.current === currentElementsString) {
      return;
    }
    setIsSaving(true);

    try {
      const datosParaGuardar = transformarParaGuardar(elements, zonasValidas);
      // Usar la API local en lugar de Supabase
      const response = await fetch(`/api/mapas/${salaId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaGuardar),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // Actualizar la referencia de elementos guardados
      lastSavedElements.current = currentElementsString;
      setLastSavedAt(new Date().toISOString());

      // Notificar cambio al RealtimeService
      if (realtimeService) {
        realtimeService.notifyChange(salaId, 'mapa_updated');
      }

    } catch (error) {
      console.error('[handleSave] Error al guardar en API local:', error);

      // Fallback: intentar guardar en Supabase si la API local falla
      try {
        const result = await saveMapa(salaId, transformarParaGuardar(elements, zonasValidas), zonasValidas);
        console.log('[handleSave] Mapa guardado exitosamente en Supabase (fallback):', result);

        lastSavedElements.current = currentElementsString;
        setLastSavedAt(new Date().toISOString());

        if (realtimeService) {
          realtimeService.notifyChange(salaId, 'mapa_updated');
        }
      } catch (fallbackError) {
        console.error('[handleSave] Error en fallback a Supabase:', fallbackError);
        throw fallbackError;
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    isLoading,
    isSaving,
    lastSavedAt,
    loadMapa,
    handleSave,
    transformarParaGuardar
  };
};


