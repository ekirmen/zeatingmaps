import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Usa la Service Role Key para poder saltar RLS en operaciones administrativas
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export async function DELETE(request, { params }) {
  try {
    const recintoId = params.id;

    if (!recintoId) {
      return NextResponse.json(
        { error: 'Missing recinto id' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1) Obtener eventos del recinto
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('id')
      .eq('recinto_id', recintoId);

    if (eventosError) throw eventosError;

    const eventoIds = (eventos || []).map((e) => e.id);

    // 2) Si hay eventos, borrar dependencias que NO tienen ON DELETE CASCADE
    if (eventoIds.length > 0) {
      // 2.a) Obtener funciones para esos eventos (soportar columnas antiguas o nuevas)
      let funciones = [];
      {
        const { data, error } = await supabase
          .from('funciones')
          .select('id')
          .in('evento_id', eventoIds);
        if (!error) funciones = data || [];
        else if (error && (error.code === '42703' || /column .* does not exist/i.test(error.message))) {
          const { data: dataAlt, error: errAlt } = await supabase
            .from('funciones')
            .select('id')
            .in('evento', eventoIds);
          if (!errAlt) funciones = dataAlt || [];
          else if (errAlt && errAlt.code !== '42P01') throw errAlt;
        } else if (error && error.code !== '42P01') throw error;
      }

      const funcionIds = (funciones || []).map((f) => f.id);

      // 2.b) Borrar locks y seats por funcion_id si existen (no siempre hay FK cascade)
      if (funcionIds.length > 0) {
        const { error: slErr } = await supabase
          .from('seat_locks')
          .delete()
          .in('funcion_id', funcionIds);
        if (slErr && slErr.code !== '42P01') throw slErr;

        const { error: seatsErr } = await supabase
          .from('seats')
          .delete()
          .in('funcion_id', funcionIds);
        if (seatsErr && seatsErr.code !== '42P01') throw seatsErr;
      }

      // plantillas_productos_template -> evento_id (sin cascade)
      const { error: pptError } = await supabase
        .from('plantillas_productos_template')
        .delete()
        .in('evento_id', eventoIds);
      if (pptError && pptError.code !== '42P01') throw pptError;

      // plantillas_productos -> evento_id (sin cascade en migración original)
      const { error: ppError } = await supabase
        .from('plantillas_productos')
        .delete()
        .in('evento_id', eventoIds);
      if (ppError && ppError.code !== '42P01') throw ppError;
    }

    // 3) Borrar eventos del recinto (cascadeará a funciones por FK ON DELETE CASCADE)
    const { error: deleteEventosError } = await supabase
      .from('eventos')
      .delete()
      .eq('recinto_id', recintoId);
    if (deleteEventosError) throw deleteEventosError;

    // 4) Borrar salas del recinto (cascadeará a mapas, zonas, seats)
    const { error: deleteSalasError } = await supabase
      .from('salas')
      .delete()
      .eq('recinto_id', recintoId);
    if (deleteSalasError) throw deleteSalasError;

    // 5) Borrar el recinto
    const { error: deleteRecintoError } = await supabase
      .from('recintos')
      .delete()
      .eq('id', recintoId);
    if (deleteRecintoError) throw deleteRecintoError;

    return NextResponse.json({ 
      success: true, 
      message: 'Recinto eliminado con cascada',
      deletedId: recintoId
    });

  } catch (error) {
    console.error('[delete recinto] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// También puedes agregar otros métodos si los necesitas
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('recintos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      data 
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('recintos')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Recinto actualizado correctamente',
      data
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
