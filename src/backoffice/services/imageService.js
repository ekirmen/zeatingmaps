import { supabase } from '../../config/supabase';

export class ImageService {
  // Obtener imágenes de un evento
  static async getEventImages(eventId) {
    try {
      const { data, error } = await supabase
        .from('evento_imagenes')
        .select('*')
        .eq('evento_id', eventId)
        .eq('is_active', true)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo imágenes del evento:', error);
      throw error;
    }
  }

  // Obtener imágenes de un recinto
  static async getVenueImages(venueId) {
    try {
      const { data, error } = await supabase
        .from('recinto_imagenes')
        .select('*')
        .eq('recinto_id', venueId)
        .eq('is_active', true)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo imágenes del recinto:', error);
      throw error;
    }
  }

  // Agregar imagen a un evento
  static async addEventImage(eventId, imageData) {
    try {
      const { data, error } = await supabase
        .from('evento_imagenes')
        .insert([{
          evento_id: eventId,
          url: imageData.url,
          alt_text: imageData.alt_text || '',
          tipo: imageData.tipo || 'galeria',
          orden: imageData.orden || 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error agregando imagen al evento:', error);
      throw error;
    }
  }

  // Agregar imagen a un recinto
  static async addVenueImage(venueId, imageData) {
    try {
      const { data, error } = await supabase
        .from('recinto_imagenes')
        .insert([{
          recinto_id: venueId,
          url: imageData.url,
          alt_text: imageData.alt_text || '',
          tipo: imageData.tipo || 'galeria',
          orden: imageData.orden || 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error agregando imagen al recinto:', error);
      throw error;
    }
  }

  // Actualizar imagen
  static async updateImage(imageId, imageData, tableName = 'evento_imagenes') {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          url: imageData.url,
          alt_text: imageData.alt_text,
          tipo: imageData.tipo,
          orden: imageData.orden,
          is_active: imageData.is_active
        })
        .eq('id', imageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando imagen:', error);
      throw error;
    }
  }

  // Eliminar imagen
  static async deleteImage(imageId, tableName = 'evento_imagenes') {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      throw error;
    }
  }

  // Desactivar imagen (soft delete)
  static async deactivateImage(imageId, tableName = 'evento_imagenes') {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: false })
        .eq('id', imageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error desactivando imagen:', error);
      throw error;
    }
  }

  // Reordenar imágenes
  static async reorderImages(imageIds, tableName = 'evento_imagenes') {
    try {
      const updates = imageIds.map((id, index) => ({
        id,
        orden: index + 1
      }));

      const { error } = await supabase
        .from(tableName)
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error reordenando imágenes:', error);
      throw error;
    }
  }

  // Obtener imagen principal de un evento
  static async getEventMainImage(eventId) {
    try {
      const { data, error } = await supabase
        .from('evento_imagenes')
        .select('*')
        .eq('evento_id', eventId)
        .eq('tipo', 'principal')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error obteniendo imagen principal del evento:', error);
      return null;
    }
  }

  // Obtener imagen principal de un recinto
  static async getVenueMainImage(venueId) {
    try {
      const { data, error } = await supabase
        .from('recinto_imagenes')
        .select('*')
        .eq('recinto_id', venueId)
        .eq('tipo', 'principal')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error obteniendo imagen principal del recinto:', error);
      return null;
    }
  }

  // Validar URL de imagen
  static isValidImageUrl(url) {
    if (!url) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
    
    return hasValidExtension && isValidUrl;
  }

  // Generar URL de imagen por defecto
  static getDefaultImageUrl(type = 'event') {
    const defaultImages = {
      event: 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Evento',
      venue: 'https://via.placeholder.com/400x300/50C878/FFFFFF?text=Recinto',
      placeholder: 'https://via.placeholder.com/400x300/CCCCCC/666666?text=Imagen'
    };
    
    return defaultImages[type] || defaultImages.placeholder;
  }

  // Obtener estadísticas de imágenes
  static async getImageStats() {
    try {
      const [eventImages, venueImages] = await Promise.all([
        supabase.from('evento_imagenes').select('id', { count: 'exact' }),
        supabase.from('recinto_imagenes').select('id', { count: 'exact' })
      ]);

      return {
        totalEventImages: eventImages.count || 0,
        totalVenueImages: venueImages.count || 0,
        totalImages: (eventImages.count || 0) + (venueImages.count || 0)
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de imágenes:', error);
      return { totalEventImages: 0, totalVenueImages: 0, totalImages: 0 };
    }
  }
}
