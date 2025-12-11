import { supabase } from '../supabaseClient';

export 

  const { data, error } = await supabase
    .from('abonos')
    .select('*')
    .eq('usuario_id', userId);


  return data.map((a) => ({
    ...a,
    user: a.usuario_id,
    seat: a.seat_id,
    packageType: a.package_type,
    startDate: a.start_date,
    endDate: a.end_date,
  }));
};

export 

  if (error) throw new Error(`Error al crear abono: ${error.message}`);
  return data;
};

export 

  if (error) throw new Error(`Error al renovar abono: ${error.message}`);
  return data;
};
