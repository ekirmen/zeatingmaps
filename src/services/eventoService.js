import { supabase } from '../backoffice/services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Allow bucket name to be configured via environment variable
const rawEventBucket = process.env.REACT_APP_EVENT_BUCKET || 'eventos';
const EVENT_BUCKET = rawEventBucket.replace(/^\/+|\/+$/g, '');
// Optional subdirectory inside the bucket
const rawEventFolder = process.env.REACT_APP_EVENT_FOLDER || '';
const EVENT_FOLDER = rawEventFolder.replace(/^\/+|\/+$/g, '');


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
  // Determine if this is a new event (no ID was provided initially)
  const isExisting = !!eventoData.id;
  if (!isExisting) {
    // Generate an ID so uploaded images can go inside a folder named
    // after the event ID and so we can insert the record with this ID
    eventoData.id = uuidv4();
  }

  // Handle image upload if provided
  if (files.imagenDestacada) {
    const file = files.imagenDestacada;
    const filename = `${Date.now()}-${file.name}`;
    const idPath = `${eventoData.id}/`;
    const base = EVENT_FOLDER ? `${EVENT_FOLDER}/${idPath}` : idPath;
    const path = `${base}${filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(EVENT_BUCKET)
      .upload(path, file);

    if (uploadError) {
      throw new Error(`Error uploading image: ${uploadError.message}`);
    }

    const publicUrl = supabase.storage
      .from(EVENT_BUCKET)
      .getPublicUrl(uploadData.path).data.publicUrl;

    eventoData.imagenDestacada = publicUrl;
  }

  // Insertar o actualizar según si el evento existía previamente
  const query = isExisting
    ? supabase.from('eventos').update(eventoData).eq('id', eventoData.id)
    : supabase.from('eventos').insert([eventoData]);

  const { data, error } = await query.select().single();

  if (error) throw new Error(`Error saving event: ${error.message}`);
  return data;
};
