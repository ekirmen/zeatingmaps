import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTenants, switchUserTenant, addUserToTenant } from '../store/services/authService';

export 
  const [userTenants, setUserTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los tenants del usuario
  const loadUserTenants = useCallback(async () => {
    if (!user) {
      setUserTenants([]);
      setActiveTenant(null);

      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const tenants = await getUserTenants(user.id);
      setUserTenants(tenants);
      
      // Encontrar el tenant activo (principal o el primero)
      const primary = tenants.find(t => t.is_primary);
      const active = primary || tenants[0];
      
      if (active) {
        setActiveTenant(active);
        // Actualizar localStorage con el tenant activo
        localStorage.setItem('currentTenantId', active.tenant_id);
      }
      
    } catch (error) {
      console.error('Error al cargar tenants del usuario:', error);
      setError('Error al cargar empresas disponibles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cambiar al tenant activo
  const switchToTenant = useCallback(async (tenantId) => {
    if (!user) return false;

    try {
      const success = await switchUserTenant(user.id, tenantId);
      
      if (success) {
        // Actualizar el estado local
        const newActiveTenant = userTenants.find(t => t.tenant_id === tenantId);
        if (newActiveTenant) {
          setActiveTenant(newActiveTenant);
          // Recargar la página para aplicar el cambio de tenant
          window.location.reload();
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al cambiar tenant:', error);
      setError('Error al cambiar de empresa');
      return false;
    }
  }, [user, userTenants]);

  // Agregar usuario a un nuevo tenant
  const joinTenant = useCallback(async (tenantId, role = 'usuario', permissions = {}) => {
    if (!user) return false;

    try {
      const success = await addUserToTenant(user.id, tenantId, role, permissions);
      
      if (success) {
        // Recargar la lista de tenants
        await loadUserTenants();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al unirse al tenant:', error);
      setError('Error al unirse a la empresa');
      return false;
    }
  }, [user, loadUserTenants]);

  // Verificar si el usuario tiene acceso a un tenant específico
  const hasTenantAccess = useCallback((tenantId) => {
    return userTenants.some(t => t.tenant_id === tenantId && t.is_active);
  }, [userTenants]);

  // Obtener el rol del usuario en un tenant específico
  const getUserRoleInTenant = useCallback((tenantId) => {
    const tenant = userTenants.find(t => t.tenant_id === tenantId);
    return tenant?.role || null;
  }, [userTenants]);

  // Cargar tenants al montar el componente
  useEffect(() => {
    loadUserTenants();
  }, [loadUserTenants]);

  return {
    // Estado
    userTenants,
    activeTenant,
    loading,
    error,
    
    // Acciones
    switchToTenant,
    joinTenant,
    loadUserTenants,
    
    // Utilidades
    hasTenantAccess,
    getUserRoleInTenant,
    
    // Información derivada
    canSwitchTenants: userTenants.length > 1,
    totalTenants: userTenants.length,
    isMultiTenantUser: userTenants.length > 1
  };
};
