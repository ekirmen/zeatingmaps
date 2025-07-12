import { supabase } from '../supabaseClient';

export async function getFunciones(eventId) {
  try {
    const { data, error } = await supabase
      .from('funciones')
      .select('id, nombre, fecha_evento, sala, evento')
      .eq('evento', eventId)
      .order('fecha_evento', { ascending: true });

    if (error) {
      console.error('Error fetching funciones:', error.message);
      return [];
    }

    // Map data to expected format with renamed fields if needed
    return (data || []).map(func => ({
      id: func.id,
      nombre: func.nombre,
      fecha_celebracion: func.fecha_evento,
      sala: func.sala,
      evento: func.evento
    }));
  } catch (err) {
    console.error('Exception fetching funciones:', err.message || err);
    return [];
  }
}
