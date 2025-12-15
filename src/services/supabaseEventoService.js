import { supabase } from '../supabaseClient';


const AutoWrapped_6cn7ee = (props) => {
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

};

export default AutoWrapped_6cn7ee;