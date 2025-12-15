// Servicio para manejar imágenes de mapas optimizadas
import { supabase } from '../supabaseClient';

class MapaImageService {
  /**
   * Restaura las imágenes completas de un mapa para edición
   * @param {number} mapaId - ID del mapa

   * @returns {Promise<Array>} - Elementos con imágenes restauradas
   */
  async restoreImagesForEditing(mapaId, elementos) {
    try {
      const elementosRestaurados = await Promise.all(
        elementos.map(async elemento => {
          // Si el elemento tiene imageDataRef, restaurar la imagen comprimida para vista previa
          if (elemento.imageDataRef && elemento.type === 'background') {
            try {
              // Obtener imagen comprimida para vista previa
              const { data: imagenComprimida, error } = await supabase.rpc(
                'get_mapa_imagen_compressed',
                {
                  mapa_id_param: mapaId,
                  elemento_id_param: elemento.imageDataRef,
                }
              );

              if (error) {
                console.error('❌ [MAPA_IMAGE_SERVICE] Error obteniendo imagen comprimida:', error);
                return elemento; // Retornar elemento sin cambios si hay error
              }

              if (imagenComprimida) {
                // Crear objeto de imagen para Konva
                const img = new window.Image();
                img.src = imagenComprimida;

                // Retornar elemento con imageData restaurado
                return {
                  ...elemento,
                  imageData: imagenComprimida,
                  image: img,
                  imageDataRef: undefined, // Remover la referencia
                };
              }
            } catch (error) {
              console.error('❌ [MAPA_IMAGE_SERVICE] Error procesando imagen:', error);
            }
          }

          return elemento;
        })
      );
      return elementosRestaurados;
    } catch (error) {
      console.error('❌ [MAPA_IMAGE_SERVICE] Error restaurando imágenes:', error);
      return elementos; // Retornar elementos originales si hay error
    }
  }

  /**
   * Optimiza un mapa después de la edición
   * @param {number} mapaId - ID del mapa
   * @param {Array} elementos - Array de elementos del mapa
   * @returns {Promise<boolean>} - True si se optimizó exitosamente
   */
  async optimizeMapAfterEditing(mapaId, elementos) {
    try {
      const { data, error } = await supabase.rpc('optimize_mapa_after_editing', {
        mapa_id_param: mapaId,
        nuevo_contenido: elementos,
      });

      if (error) {
        console.error('❌ [MAPA_IMAGE_SERVICE] Error optimizando mapa:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ [MAPA_IMAGE_SERVICE] Error optimizando mapa:', error);
      return false;
    }
  }

  /**
   * Obtiene una imagen específica de un mapa
   * @param {number} mapaId - ID del mapa
   * @param {string} elementoId - ID del elemento
   * @param {boolean} original - Si obtener la imagen original (true) o comprimida (false)
   * @returns {Promise<string|null>} - URL de la imagen o null si no se encuentra
   */
  async getMapImage(mapaId, elementoId, original = false) {
    try {
      const functionName = original ? 'get_mapa_imagen_original' : 'get_mapa_imagen_compressed';

      const { data, error } = await supabase.rpc(functionName, {
        mapa_id_param: mapaId,
        elemento_id_param: elementoId,
      });

      if (error) {
        console.error('❌ [MAPA_IMAGE_SERVICE] Error obteniendo imagen:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ [MAPA_IMAGE_SERVICE] Error obteniendo imagen:', error);
      return null;
    }
  }

  /**
   * Verifica si un mapa tiene imágenes optimizadas
   * @param {Array} elementos - Array de elementos del mapa
   * @returns {boolean} - True si tiene elementos con imageDataRef
   */
  hasOptimizedImages(elementos) {
    return elementos.some(elemento => elemento.type === 'background' && elemento.imageDataRef);
  }

  /**
   * Carga imágenes de fondo para elementos con imageDataRef
   * @param {number} mapaId - ID del mapa
   * @param {Array} elementos - Array de elementos del mapa
   * @returns {Promise<Array>} - Elementos con imágenes cargadas
   */
  async loadBackgroundImages(mapaId, elementos) {
    try {
      const elementosConImagenes = await Promise.all(
        elementos.map(async elemento => {
          if (elemento.imageDataRef && elemento.type === 'background') {
            try {
              // Obtener imagen comprimida para vista previa
              const imagenComprimida = await this.getMapImage(mapaId, elemento.imageDataRef, false);

              if (imagenComprimida) {
                const img = new window.Image();
                img.src = imagenComprimida;

                return {
                  ...elemento,
                  image: img,
                  imageUrl: imagenComprimida,
                };
              }
            } catch (error) {
              console.error('❌ [MAPA_IMAGE_SERVICE] Error cargando imagen de fondo:', error);
            }
          }

          return elemento;
        })
      );
      return elementosConImagenes;
    } catch (error) {
      console.error('❌ [MAPA_IMAGE_SERVICE] Error cargando imágenes de fondo:', error);
      return elementos;
    }
  }
}

export default new MapaImageService();
