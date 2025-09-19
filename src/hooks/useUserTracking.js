import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para tracking automático de usuarios
 * Agrega automáticamente campos de auditoría a las operaciones de base de datos
 */
export const useUserTracking = () => {
  const { user } = useAuth();
  
  /**
   * Obtiene el identificador del usuario actual
   * @returns {string} Email del usuario o ID si no hay email
   */
  const getCurrentUser = () => {
    if (!user) return 'anonymous';
    return user.email || user.id || 'anonymous';
  };
  
  /**
   * Agrega campos de tracking para operaciones de inserción
   * @param {Object} data - Datos a insertar
   * @returns {Object} Datos con campos de tracking agregados
   */
  const addUserTracking = (data) => {
    const currentUser = getCurrentUser();
    const now = new Date().toISOString();
    
    return {
      ...data,
      created_by: currentUser,
      updated_by: currentUser,
      created_at: now,
      updated_at: now
    };
  };
  
  /**
   * Agrega campos de tracking para operaciones de actualización
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Datos con campos de tracking agregados
   */
  const addUpdateTracking = (data) => {
    const currentUser = getCurrentUser();
    const now = new Date().toISOString();
    
    return {
      ...data,
      updated_by: currentUser,
      updated_at: now
    };
  };
  
  /**
   * Agrega solo el campo updated_by para actualizaciones simples
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Datos con updated_by agregado
   */
  const addUpdateUser = (data) => {
    const currentUser = getCurrentUser();
    
    return {
      ...data,
      updated_by: currentUser
    };
  };
  
  /**
   * Agrega solo el campo updated_at para actualizaciones simples
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Datos con updated_at agregado
   */
  const addUpdateTime = (data) => {
    const now = new Date().toISOString();
    
    return {
      ...data,
      updated_at: now
    };
  };
  
  return {
    getCurrentUser,
    addUserTracking,
    addUpdateTracking,
    addUpdateUser,
    addUpdateTime
  };
};

export default useUserTracking;
