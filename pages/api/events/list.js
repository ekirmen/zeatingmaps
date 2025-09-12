import { supabase } from '../../src/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      tenant_id, 
      recinto, 
      sala, 
      limit = 50, 
      offset = 0,
      search,
      status = 'active'
    } = req.query;

    let query = supabase
      .from('eventos')
      .select(`
        *,
        recintos:recinto(nombre),
        salas:sala(nombre)
      `)
      .eq('tenant_id', tenant_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros opcionales
    if (recinto) {
      query = query.eq('recinto', recinto);
    }

    if (sala) {
      query = query.eq('sala', sala);
    }

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`);
    }

    const { data: eventos, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: {
        eventos: eventos || [],
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: eventos?.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error listando eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar eventos',
      error: error.message
    });
  }
}
