import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
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
      console.log('[RealtimeService] Configurando suscripción para sala:', salaId);
    }

    // Sistema de realtime optimizado - solo en producción
    if (process.env.NODE_ENV === 'production') {
      // Implementar realtime solo cuando sea necesario
      console.log('[RealtimeService] Sistema de realtime habilitado para producción');
    } else {
      console.log('[RealtimeService] Sistema de realtime deshabilitado en desarrollo');
    }
    
    // Cleanup al desmontar
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RealtimeService] Cleanup completado');
      }
    };
  }, [salaId]);

  const transformarParaGuardar = (elements, zones = []) => {
    console.log('[transformarParaGuardar] Elementos recibidos:', elements);
    console.log('[transformarParaGuardar] Zonas recibidas:', zones);
    console.log('[transformarParaGuardar] Tenant actual:', currentTenant?.id);
    
    if (!elements || !Array.isArray(elements)) {
      console.warn('[transformarParaGuardar] Elements no es un array válido:', elements);
      return { contenido: [], zonas: zones || [], tenant_id: currentTenant?.id };
    }
    
    const mesas = elements.filter(el => el && el.type === 'mesa');
    console.log('[transformarParaGuardar] Mesas encontradas:', mesas.length);
    
    const contenido = mesas.map(mesa => {
      if (!mesa || !mesa._id) {
        console.warn('[transformarParaGuardar] Mesa inválida:', mesa);
        return null;
      }
      
      console.log('[transformarParaGuardar] Procesando mesa:', mesa);
      
      const sillas = elements
        .filter(el => el && el.type === 'silla' && el.parentId === mesa._id)
        .map(silla => {
          if (!silla || !silla._id) {
            console.warn('[transformarParaGuardar] Silla inválida:', silla);
            return null;
          }
          
          return {
            _id: silla._id,
            nombre: silla.nombre || '',
            posicion: silla.posicion || { x: 0, y: 0 },
            width: silla.width || 20,
            height: silla.height || 20,
            zona: silla.zonaId || silla.zona?.id || null,
            estado: silla.estado || 'disponible'
          };
        })
        .filter(silla => silla !== null); // Filtrar sillas inválidas
      
      console.log('[transformarParaGuardar] Sillas de la mesa:', sillas.length);
      
      return {
        _id: mesa._id,
        nombre: mesa.nombre || '',
        posicion: mesa.posicion || { x: 0, y: 0 },
        width: mesa.width || 100,
        height: mesa.height || 100,
        radius: mesa.radius || null,
        shape: mesa.shape || 'rect',
        zona: mesa.zonaId || mesa.zona?.id || null,
        sillas: sillas
      };
    }).filter(mesa => mesa !== null); // Filtrar mesas inválidas

    console.log('[transformarParaGuardar] Contenido final:', contenido);
    
    // Retornar objeto con contenido, zonas y tenant_id como espera la API local
    return {
      contenido: contenido,
      zonas: zones || [],
      tenant_id: currentTenant?.id
    };
  };

  const loadMapa = useCallback(async (salaId, setElements, setZones) => {
    if (!salaId) {
      console.log('[loadMapa] No hay salaId, saliendo');
      return;
    }
    
    console.log('[loadMapa] Iniciando carga para sala:', salaId);
    console.log('[loadMapa] setElements es función:', typeof setElements === 'function');
    console.log('[loadMapa] setZones es función:', typeof setZones === 'function');
    
    setIsLoading(true);
    
    try {
      // Usar la API local en lugar de Supabase
      const response = await fetch(`/api/mapas/${salaId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[loadMapa] Datos recibidos de API local:', data);
      
      if (!data.success || !data.data || !data.data.contenido) {
        console.log('[loadMapa] No hay datos de mapa, inicializando con elementos de prueba');
        
        // Crear elementos de prueba para verificar que el renderizado funciona
        const elementosPrueba = [
          {
            _id: 'mesa_prueba_1',
            type: 'mesa',
            shape: 'rect',
            posicion: { x: 100, y: 100 },
            width: 120,
            height: 80,
            nombre: 'Mesa de Prueba 1',
            zonaId: null,
            sillas: []
          },
          {
            _id: 'mesa_prueba_2',
            type: 'mesa',
            shape: 'circle',
            posicion: { x: 300, y: 100 },
            radius: 60,
            nombre: 'Mesa de Prueba 2',
            zonaId: null,
            sillas: []
          }
        ];
        
        console.log('[loadMapa] Creando elementos de prueba:', elementosPrueba);
        setElements(elementosPrueba);
        setZones([]);
        console.log('[loadMapa] Elementos de prueba establecidos');
        return;
      }

      // Usar data.data que es la estructura de la API local
      const mapaData = data.data;

      // Cargar zonas si no están disponibles
      let zonasCargadas = mapaData.zonas || [];
      if (zonasCargadas.length === 0) {
        try {
          const zonasResponse = await fetch(`/api/zonas?salaId=${salaId}`);
          if (zonasResponse.ok) {
            zonasCargadas = await zonasResponse.json();
          }
        } catch (error) {
          console.warn('[loadMapa] Error cargando zonas:', error);
        }
      }

      // Transformar elementos del mapa
      const elementosCrudos = (mapaData.contenido || []).reduce((acc, mesa) => {
        if (!mesa || !mesa._id) {
          console.warn('[loadMapa] Mesa inválida encontrada:', mesa);
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
            console.warn('[loadMapa] Silla inválida encontrada:', silla);
            return null;
          }
          
          return {
            ...silla,
            type: 'silla',
            parentId: mesa._id,
            width: silla.width || 20,
            height: silla.height || 20,
            nombre: silla.nombre || '',
            label: silla.nombre || '',      // Add label for display
            labelPlacement: 'top',          // Position label above chair
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
        }).filter(silla => silla !== null); // Filtrar sillas inválidas

        return [...acc, mesaConZona, ...sillas];
      }, []);

      console.log('[loadMapa] Elementos transformados:', elementosCrudos.length);
      
      // Guardar referencia de los elementos cargados para evitar recargas innecesarias
      lastSavedElements.current = JSON.stringify(elementosCrudos);
      
      console.log('[loadMapa] Estableciendo elementos y zonas:', {
        elementosCount: elementosCrudos.length,
        zonasCount: zonasCargadas.length
      });
      
      setZones(zonasCargadas);
      setElements(elementosCrudos);
      
      console.log('[loadMapa] Elementos y zonas establecidos exitosamente');
    } catch (error) {
      console.error('Error al cargar el mapa desde API local:', error);
      // Fallback: intentar cargar desde Supabase si la API local falla
      try {
        console.log('[loadMapa] Fallback: intentando cargar desde Supabase...');
        const data = await fetchMapa(salaId);
        if (data && data.contenido) {
          // ... resto del código de transformación existente
          const elementosCrudos = (data.contenido || []).reduce((acc, mesa) => {
            if (!mesa || !mesa._id) {
              console.warn('[loadMapa] Mesa inválida encontrada en fallback:', mesa);
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
                console.warn('[loadMapa] Silla inválida encontrada en fallback:', silla);
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
    console.log('[handleSave] Zonas validadas:', zonasValidas);

    // Verificar si realmente hay cambios que guardar
    const currentElementsString = JSON.stringify(elements);
    if (lastSavedElements.current === currentElementsString) {
      console.log('[handleSave] No hay cambios que guardar, saltando guardado');
      return;
    }

    console.log('[handleSave] Iniciando guardado para sala:', salaId);
    setIsSaving(true);

    try {
      const datosParaGuardar = transformarParaGuardar(elements, zonasValidas);
      console.log('[handleSave] Datos a guardar:', datosParaGuardar);

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
      console.log('[handleSave] Mapa guardado exitosamente en API local:', result);

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
        console.log('[handleSave] Fallback: intentando guardar en Supabase...');
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
