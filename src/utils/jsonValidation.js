/**
 * Utilidades para validar y limpiar campos JSON corruptos
 * Previene la corrupción de datos en la base de datos
 */

/**
 * Valida y limpia un campo JSON que puede estar corrupto
 * @param {any} value - El valor a validar
 * @param {string} fieldName - Nombre del campo para logging
 * @param {any} defaultValue - Valor por defecto si el campo está corrupto
 * @returns {any} - El valor limpio o el valor por defecto
 */
export const validateAndCleanJsonField = (value, fieldName, defaultValue = {}) => {
  try {
    // Si es null o undefined, retornar valor por defecto
    if (!value) {
      console.log(`🔄 Campo ${fieldName} vacío, inicializando...`);
      return defaultValue;
    }

    // Si es string, intentar parsearlo
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      
      // Verificar si el JSON parseado tiene propiedades numeradas (indicador de corrupción)
      const hasNumericKeys = Object.keys(parsed).some(key => !isNaN(parseInt(key)));
      
      if (hasNumericKeys) {
        console.warn(`⚠️ Campo ${fieldName} corrupto detectado, limpiando...`, value);
        return defaultValue;
      }
      
      return parsed;
    }

    // Si es objeto, verificar que no tenga propiedades numeradas
    if (typeof value === 'object') {
      const hasNumericKeys = Object.keys(value).some(key => !isNaN(parseInt(key)));
      
      if (hasNumericKeys) {
        console.warn(`⚠️ Campo ${fieldName} corrupto detectado, limpiando...`, value);
        return defaultValue;
      }
      
      return value;
    }

    // Si no es ninguno de los tipos esperados, retornar valor por defecto
    console.warn(`⚠️ Tipo de campo ${fieldName} no válido, limpiando...`, typeof value);
    return defaultValue;
  } catch (error) {
    console.error(`❌ Error validando campo ${fieldName}, limpiando...`, error);
    return defaultValue;
  }
};

/**
 * Limpia todos los campos JSON de un objeto de evento
 * @param {Object} evento - El objeto evento a limpiar
 * @returns {Object} - El evento con campos JSON limpios
 */
export const cleanEventoJsonFields = (evento) => {
  if (!evento) return evento;

  const eventoLimpio = { ...evento };
  
  const jsonFieldsToClean = [
    { field: 'imagenes', defaultValue: {} },
    { field: 'datosComprador', defaultValue: {} },
    { field: 'datosBoleto', defaultValue: {} },
    { field: 'analytics', defaultValue: { enabled: false, gtmId: '' } },
    { field: 'otrasOpciones', defaultValue: {} },
    { field: 'tags', defaultValue: [] }
  ];

  jsonFieldsToClean.forEach(({ field, defaultValue }) => {
    if (eventoLimpio[field] !== undefined) {
      const cleanValue = validateAndCleanJsonField(eventoLimpio[field], field, defaultValue);
      eventoLimpio[field] = cleanValue;
      if (cleanValue !== evento[field]) {
        console.log(`🔄 Campo ${field} corrupto detectado y limpiado en evento ${evento.id}:`, cleanValue);
      }
    }
  });

  return eventoLimpio;
};

/**
 * Limpia un array de eventos
 * @param {Array} eventos - Array de eventos a limpiar
 * @returns {Array} - Array de eventos con campos JSON limpios
 */
export const cleanEventosArray = (eventos) => {
  if (!Array.isArray(eventos)) return [];
  
  return eventos.map(evento => cleanEventoJsonFields(evento));
};

/**
 * Valida que un campo JSON sea válido sin corromperse
 * @param {any} value - El valor a validar
 * @returns {boolean} - true si el campo es válido, false si está corrupto
 */
export const isJsonFieldValid = (value) => {
  try {
    if (!value) return true;
    
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      return !Object.keys(parsed).some(key => !isNaN(parseInt(key)));
    }
    
    if (typeof value === 'object') {
      return !Object.keys(value).some(key => !isNaN(parseInt(key)));
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
