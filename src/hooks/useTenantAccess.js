import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { verifyTenantAccess } from '../store/services/authService';

export 
  const [accessStatus, setAccessStatus] = useState({
    hasAccess: false,
    loading: true,
    reason: null,
    profile: null
  });

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAccessStatus({
        hasAccess: false,
        loading: false,
        reason: 'Usuario no autenticado',
        profile: null

      return;
    }

    setAccessStatus(prev => ({ ...prev, loading: true }));

    try {
      const result = await verifyTenantAccess(user.id);
      setAccessStatus({
        hasAccess: result.hasAccess,
        loading: false,
        reason: result.reason,
        profile: result.profile
      });
    } catch (error) {
      console.error('Error al verificar acceso del usuario:', error);
      setAccessStatus({
        hasAccess: false,
        loading: false,
        reason: 'Error al verificar acceso',
        profile: null
      });
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const refreshAccess = useCallback(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    ...accessStatus,
    refreshAccess,
    isTenantUser: accessStatus.hasAccess && accessStatus.profile?.tenant_id,
    userTenantId: accessStatus.profile?.tenant_id
  };
};
