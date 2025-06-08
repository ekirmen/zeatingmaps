
import { useEffect } from 'react';
import { fetchMapa, saveMapa } from '../services/apibackoffice';

export const useMapaLoadingSaving = (salaId, elements, zones, setElements, setZones) => {
  useEffect(() => {
    const loadMapa = async () => {
      if (!salaId) return;
      try {
        const data = await fetchMapa(salaId);
        if (!data) return;

        const zonasCargadas = data?.zonas || [];

        const elementosCrudos = (data.contenido || []).flatMap(mesa => {
          // Create mesa with all necessary properties
          const mesaConZona = {
            ...mesa,
            type: 'mesa',
            shape: mesa.shape || (mesa.radius ? 'circle' : 'rect'),
            radius: mesa.radius || mesa.width / 2,
            width: mesa.width || mesa.radius * 2,
            height: mesa.height || mesa.radius * 2,
            posicion: mesa.posicion || { x: 0, y: 0 },
            zona: typeof mesa.zona === 'string' ? zonasCargadas.find(z => z._id === mesa.zona) : mesa.zona,
            zonaId: typeof mesa.zona === 'string' ? mesa.zona : mesa.zona?._id || null,
          };

          // Transform sillas array
          const sillas = (mesa.sillas || []).map(silla => ({
            ...silla,
            type: 'silla',
            parentId: mesa._id,
            width: silla.width || 20,
            height: silla.height || 20,
            nombre: silla.nombre || '',
            label: silla.nombre || '',  // Add label for display
            labelPlacement: 'top',      // Position label above chair
            labelStyle: {
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px'
            },
            zona: typeof silla.zona === 'string' ? zonasCargadas.find(z => z._id === silla.zona) : silla.zona,
            zonaId: typeof silla.zona === 'string' ? silla.zona : silla.zona?._id || null,
          }));

          return [mesaConZona, ...sillas];
        });

        setZones(zonasCargadas);
        setElements(elementosCrudos);
      } catch (error) {
        console.error('Error al cargar el mapa:', error);
      }
    };

    loadMapa();
  }, [salaId, setElements, setZones]);

  const transformarParaGuardar = (elements) => {
    const mesas = elements.filter(e => e.type === 'mesa');
    return mesas.map(mesa => {
      const sillas = elements
        .filter(el => el.type === 'silla' && el.parentId === mesa._id)
        .map(silla => ({
          _id: silla._id,
          type: 'silla',
          posicion: silla.posicion,
          width: silla.width || 20,
          height: silla.height || 20,
          nombre: silla.nombre || silla.numero || '',  // Save the actual name
          zona: silla.zonaId || silla.zona?._id || null,
          parentId: silla.parentId,
          mesa_id: mesa._id
        }));

      const mesaData = {
        _id: mesa._id,
        type: 'mesa',
        shape: mesa.shape || 'circle',
        posicion: mesa.posicion || { x: 0, y: 0 },
        width: mesa.shape === 'circle' ? mesa.radius * 2 : (mesa.width || 100),
        height: mesa.shape === 'circle' ? mesa.radius * 2 : (mesa.height || 100),
        radius: mesa.radius || 50,
        nombre: mesa.nombre || '',
        zona: mesa.zonaId || mesa.zona?._id || null,
        sillas: sillas  // Include sillas array
      };

      // Clean up any null or undefined values
      Object.entries(mesaData).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          if (key === 'sillas') {
            mesaData[key] = [];  // Empty array for sillas if null/undefined
          } else if (key === 'zona') {
            mesaData[key] = null;  // Explicit null for zona if not set
          } else {
            delete mesaData[key];  // Remove other null/undefined properties
          }
        }
      });

      return mesaData;
    });
  };

  const handleSave = async () => {
    if (!salaId) {
      console.error('No hay sala seleccionada');
      return false;
    }
    try {
      // Add console.log to check what we're working with
      console.log('Elements before transform:', elements);
      
      const elementosParaGuardar = transformarParaGuardar(elements);
      
      // Add console.log to check transformed data
      console.log('Elementos para guardar:', elementosParaGuardar);
      console.log('Zonas para guardar:', zones);

      // Verify that we have actual data before saving
      if (!elementosParaGuardar.length) {
        console.warn('No hay elementos para guardar');
      }

      if (!zones || !zones.length) {
        console.warn('No hay zonas para guardar');
      }

      const dataToSave = {
        contenido: elementosParaGuardar.length ? elementosParaGuardar : [],
        zonas: zones || [],
      };

      // Final check of what we're sending
      console.log('Data being sent to server:', dataToSave);

      await saveMapa(salaId, dataToSave);
      console.log('Mapa guardado correctamente');
      return true;
    } catch (error) {
      console.error('Error al guardar el mapa:', error);
      return false;
    }
  };

  return {
    handleSave,
  };
};
