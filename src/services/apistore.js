import { supabase } from '../supabaseClient';

export async function getFunciones(eventId) {
  try {
    // Primero obtener el evento para obtener su tenant_id
    const { data: eventoData, error: eventoError } = await supabase
      .from('eventos')
      .select('tenant_id')
      .eq('id', eventId)
      .single();

    if (eventoError) {
      console.error('Error fetching evento tenant:', eventoError.message);
      return [];
    }

    if (!eventoData) {
      console.error('Evento no encontrado');
      return [];
    }

    // Ahora obtener las funciones filtrando por tenant_id
    const { data, error } = await supabase
      .from('funciones')
      .select('id, fecha_celebracion, evento, sala')
      .eq('evento', eventId)
      .eq('tenant_id', eventoData.tenant_id)
      .order('fecha_celebracion', { ascending: true });

    if (error) {
      console.error('Error fetching funciones:', error.message);
      return [];
    }

    // Map data to expected format with renamed fields if needed
    return (data || []).map(func => ({
      id: func.id,
      fecha_celebracion: func.fecha_celebracion,
      evento: func.evento,
      sala: func.sala
    }));
  } catch (err) {
    console.error('Exception fetching funciones:', err.message || err);
    return [];
  }
}
