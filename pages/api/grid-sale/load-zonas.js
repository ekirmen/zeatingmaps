import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evento } = req.body;

    if (!evento?.recinto || !evento?.sala) {
      return res.status(400).json({ 
        success: false, 
        message: 'Evento debe tener recinto y sala' 
      });
    }

    // Cargar zonas del evento
    const { data: zonasData, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', evento.sala)
      .order('nombre');

    if (zonasError) throw zonasError;

    // Cargar plantillas (precios) del evento
    const { data: plantillasData, error: plantillasError } = await supabase
      .from('plantillas')
      .select('*')
      .eq('recinto', evento.recinto)
      .eq('sala', evento.sala);

    if (plantillasError) throw plantillasError;

    // Procesar precios desde el JSON de detalles
    const preciosPorZona = {};
    plantillasData?.forEach(plantilla => {
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
        zonas: zonasData || [],
        precios: preciosPorZona
      }
    });

  } catch (error) {
    console.error('Error cargando zonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar zonas y precios',
      error: error.message
    });
  }
}
