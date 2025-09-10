import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug es requerido'
      });
    }

    // Buscar evento por slug
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select(`
        *,
        recintos:recinto(*),
        salas:sala(*)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (eventoError || !evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Cargar funciones del evento
    const { data: funciones, error: funcionesError } = await supabase
      .from('funciones')
      .select('*')
      .eq('evento_id', evento.id)
      .eq('is_active', true)
      .order('fecha', { ascending: true });

    if (funcionesError) {
      console.warn('Error cargando funciones:', funcionesError);
    }

    // Cargar zonas del evento
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', evento.sala)
      .order('nombre');

    if (zonasError) {
      console.warn('Error cargando zonas:', zonasError);
    }

    // Cargar plantillas (precios)
    const { data: plantillas, error: plantillasError } = await supabase
      .from('plantillas')
      .select('*')
      .eq('recinto', evento.recinto)
      .eq('sala', evento.sala);

    if (plantillasError) {
      console.warn('Error cargando plantillas:', plantillasError);
    }

    // Procesar precios desde plantillas
    const preciosPorZona = {};
    plantillas?.forEach(plantilla => {
      try {
        const detalles = JSON.parse(plantilla.detalles || '[]');
        detalles.forEach(detalle => {
          if (detalle.zonaId && detalle.precio) {
            preciosPorZona[detalle.zonaId] = {
              precio: detalle.precio,
              comision: detalle.comision || 0,
              precioGeneral: detalle.precioGeneral || 0,
              canales: detalle.canales || [],
              orden: detalle.orden || 0
            };
          }
        });
      } catch (parseError) {
        console.warn('Error parseando detalles de plantilla:', parseError);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        evento: {
          ...evento,
          funciones: funciones || [],
          zonas: zonas || [],
          precios: preciosPorZona
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
}
