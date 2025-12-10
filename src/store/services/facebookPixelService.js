import { supabase } from '../../supabaseClient';

// Obtener píxel de Facebook por evento
export const getFacebookPixelByEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .select('*')
      .eq('evento', eventId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting Facebook pixel:', error);
    return null;
  }
};

// Crear o actualizar píxel de Facebook
export const upsertFacebookPixel = async (pixelData) => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .upsert(pixelData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting Facebook pixel:', error);
    throw error;
  }
};

// Eliminar píxel de Facebook
export const deleteFacebookPixel = async (pixelId) => {
  try {
    const { error } = await supabase
      .from('facebook_pixels')
      .delete()
      .eq('id', pixelId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting Facebook pixel:', error);
    throw error;
  }
};

// Obtener todos los píxeles de Facebook
export const getAllFacebookPixels = async () => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .select(`
        *,
        eventos (
          id,
          nombre,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all Facebook pixels:', error);
    return [];
  }
};

// Verificar si el píxel debe trackear en una página específica
export const shouldTrackOnPage = (pixel, pageName) => {
  if (!pixel || !pixel.tracking_pages) return false;
  
  const trackingPages = typeof pixel.tracking_pages === 'string' 
    ? JSON.parse(pixel.tracking_pages) 
    : pixel.tracking_pages;
  
  return trackingPages[pageName] === true;
};

// Eventos estándar de Facebook para e-commerce
export const FACEBOOK_EVENTS = {
  VIEW_CONTENT: 'ViewContent',
  ADD_TO_CART: 'AddToCart',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  ADD_PAYMENT_INFO: 'AddPaymentInfo',
  PURCHASE: 'Purchase',
  LEAD: 'Lead',
  COMPLETE_REGISTRATION: 'CompleteRegistration'
}; 
