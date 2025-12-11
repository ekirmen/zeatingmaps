import { supabase } from '../supabaseClient';

export 

  return data;
};

export 
  if (error) throw error;
  return data;
};

export 
  if (error) throw error;
  return data;
};

export const deleteEvento = async (id) => {
  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
