import { supabase } from '../backoffice/services/supabaseClient';


// Obtener todos los eventos
export const fetchEventos = async () => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching events: ${error.message}`);
  return data;
};

export const getEventos = fetchEventos;

// Eliminar evento
export const deleteEvento = async (id) => {
  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting event: ${error.message}`);
};

// Duplicar evento
export const duplicateEvento = async (id) => {
  const { data: original, error: fetchError } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Error fetching original event: ${fetchError.message}`);

  // Remover campos que no se deben duplicar
  const { id: _, created_at, updated_at, ...duplicatedData } = original;

  const { data: duplicated, error: insertError } = await supabase
    .from('eventos')
    .insert([duplicatedData])
    .select()
    .single();

  if (insertError) throw new Error(`Error duplicating event: ${insertError.message}`);
  return duplicated;
};

// Crear o actualizar evento (si tiene ID, lo actualiza)
export const saveEvento = async (eventoData, files = {}) => {
  // Si tienes que subir imágenes, debes hacerlo con Supabase Storage
  if (files.imagenDestacada) {
    const file = files.imagenDestacada;
    const filename = `${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('eventos')
      .upload(filename, file);

    if (uploadError) throw new Error(`Error uploading image: ${uploadError.message}`);

    const publicUrl = supabase.storage
      .from('eventos')
      .getPublicUrl(uploadData.path).data.publicUrl;

    eventoData.imagenDestacada = publicUrl;
  }

  // Insertar o actualizar según si tiene `id`
  const isUpdate = !!eventoData.id;
  const query = isUpdate
    ? supabase.from('eventos').update(eventoData).eq('id', eventoData.id)
    : supabase.from('eventos').insert([eventoData]);

  const { data, error } = await query.select().single();

  if (error) throw new Error(`Error saving event: ${error.message}`);
  return data;
};
