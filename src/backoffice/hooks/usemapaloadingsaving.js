
import { useEffect } from 'react';
import { message } from 'antd';
import { fetchMapa, saveMapa, updateZona } from '../services/apibackoffice';

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
            zona: ['string', 'number'].includes(typeof mesa.zona)
              ? zonasCargadas.find(z => z.id === mesa.zona)
              : mesa.zona,
            zonaId: ['string', 'number'].includes(typeof mesa.zona)
              ? mesa.zona
              : mesa.zona?.id || null,
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
            zona: ['string', 'number'].includes(typeof silla.zona)
              ? zonasCargadas.find(z => z.id === silla.zona)
              : silla.zona,
            zonaId: ['string', 'number'].includes(typeof silla.zona)
              ? silla.zona
              : silla.zona?.id || null,
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
    const resultado = [];

    const mesas = elements.filter(e => e.type === 'mesa');
    mesas.forEach(mesa => {
      const sillas = elements
        .filter(el => el.type === 'silla' && el.parentId === mesa._id)
        .map(silla => ({
          _id: silla._id,
          type: 'silla',
          posicion: silla.posicion,
          width: silla.width || 20,
          height: silla.height || 20,
          nombre: silla.nombre || silla.numero || '',
          zona: silla.zonaId || silla.zona?.id || null,
          parentId: silla.parentId,
          mesa_id: mesa._id,
        }));

      const mesaData = {
        _id: mesa._id,
        type: 'mesa',
        shape: mesa.shape || 'circle',
        posicion: mesa.posicion || { x: 0, y: 0 },
        width:
          mesa.shape === 'circle'
            ? mesa.radius * 2
            : mesa.width || 100,
        height:
          mesa.shape === 'circle'
            ? mesa.radius * 2
            : mesa.height || 100,
        radius: mesa.radius || 50,
        nombre: mesa.nombre || '',
        zona: mesa.zonaId || mesa.zona?.id || null,
        sillas,
      };

      Object.entries(mesaData).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          if (key === 'sillas') {
            mesaData[key] = [];
          } else if (key === 'zona') {
            mesaData[key] = null;
          } else {
            delete mesaData[key];
          }
        }
      });

      resultado.push(mesaData);
    });

    const sillasSueltas = elements.filter(
      e => e.type === 'silla' && !e.parentId
    );
    sillasSueltas.forEach(silla => {
      resultado.push({
        _id: silla._id,
        type: 'silla',
        posicion: silla.posicion,
        width: silla.width || 20,
        height: silla.height || 20,
        nombre: silla.nombre || silla.numero || '',
        zona: silla.zonaId || silla.zona?.id || null,
        parentId: null,
      });
    });

    const otros = elements.filter(
      el => !['mesa', 'silla'].includes(el.type)
    );
    otros.forEach(el => {
      const obj = {
        _id: el._id,
        type: el.type,
        posicion: el.posicion,
        zona: el.zonaId || el.zona?.id || null,
      };
      if (el.width !== undefined) obj.width = el.width;
      if (el.height !== undefined) obj.height = el.height;
      if (el.radius !== undefined) obj.radius = el.radius;
      if (el.shape) obj.shape = el.shape;
      if (el.text) obj.text = el.text;
      if (el.fontSize) obj.fontSize = el.fontSize;
      if (el.fill) obj.fill = el.fill;
      if (el.points) obj.points = el.points;
      if (el.rotation !== undefined) obj.rotation = el.rotation;
      resultado.push(obj);
    });

    return resultado;
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

      // Calcular aforo para zonas numeradas basado en las sillas asignadas
      const seatCounts = elements.reduce((acc, el) => {
        if (el.type === 'silla') {
          const zId = el.zonaId || el.zona?.id;
          if (zId) acc[zId] = (acc[zId] || 0) + 1;
        }
        return acc;
      }, {});

      const updatedZones = zones.map(z =>
        z.numerada ? { ...z, aforo: seatCounts[z.id] || 0 } : z
      );

      // Actualizar backend con nuevos aforos
      try {
        await Promise.all(updatedZones.map(z => updateZona(z.id, { aforo: z.aforo })));
        setZones(updatedZones);
      } catch (e) {
        console.error('Error actualizando aforo de zonas', e);
      }

      const dataToSave = {
        contenido: elementosParaGuardar.length ? elementosParaGuardar : [],
      };

      // Final check of what we're sending
      console.log('Data being sent to server:', dataToSave);

      await saveMapa(salaId, dataToSave);
      console.log('Mapa guardado correctamente');
      message.success('Mapa guardado correctamente');
      return true;
    } catch (error) {
      console.error('Error al guardar el mapa:', error);
      message.error('Error al guardar el mapa');
      return false;
    }
  };

  return {
    handleSave,
  };
};
