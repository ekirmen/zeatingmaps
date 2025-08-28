import { supabase } from '../supabaseClient'; // Ajusta si la ruta es distinta

export const fetchTags = async () => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Usuario no autenticado, retornando tags vacíos');
      return [];
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      console.warn('Usuario sin tenant_id válido, retornando tags vacíos');
      return [];
    }

    console.log('🔍 [tagService] Obteniendo tags para tenant:', profile.tenant_id);

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      throw new Error('Error fetching tags: ' + error.message);
    }

    console.log('🔍 [tagService] Tags obtenidos:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchTags:', error);
    return [];
  }
};

export const createTag = async (tagData) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    console.log('🔍 [tagService] Creando tag para tenant:', profile.tenant_id);

    // Asegurar que el tag tenga el tenant_id
    const tagWithTenant = {
      ...tagData,
      tenant_id: profile.tenant_id
    };

    const { data, error } = await supabase
      .from('tags')
      .insert([tagWithTenant])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      throw new Error('Error creating tag: ' + error.message);
    }

    console.log('🔍 [tagService] Tag creado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error in createTag:', error);
    throw error;
  }
};

export const updateTag = async (id, updatedData) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    console.log('🔍 [tagService] Actualizando tag para tenant:', profile.tenant_id);

    // Asegurar que el tag tenga el tenant_id
    const tagWithTenant = {
      ...updatedData,
      tenant_id: profile.tenant_id
    };

    const { data, error } = await supabase
      .from('tags')
      .update(tagWithTenant)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id) // Solo actualizar tags del tenant del usuario
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      throw new Error('Error updating tag: ' + error.message);
    }

    console.log('🔍 [tagService] Tag actualizado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error in updateTag:', error);
    throw error;
  }
};

export const deleteTag = async (id) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    console.log('🔍 [tagService] Eliminando tag para tenant:', profile.tenant_id);

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id); // Solo eliminar tags del tenant del usuario

    if (error) {
      console.error('Error deleting tag:', error);
      throw new Error('Error deleting tag: ' + error.message);
    }

    console.log('🔍 [tagService] Tag eliminado exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteTag:', error);
    throw error;
  }
};
