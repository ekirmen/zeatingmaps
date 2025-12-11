import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

export 
  const { currentTenant } = useTenant();

  // Obtener tenant_id para filtrado
  const getTenantId = () => {
    // Si es SaaS admin (sin tenant específico)

      return null; // Puede ver todos los datos
    }
    
    // Si hay tenant en el contexto
    if (currentTenant?.id) {
      return currentTenant.id;
    }
    
    // Si el usuario tiene tenant_id en sus metadatos
    if (user?.user_metadata?.tenant_id) {
      return user.user_metadata.tenant_id;
    }
    
    return null;
  };

  // Función para agregar filtro tenant_id a consultas
  const addTenantFilter = (query) => {
    const tenantId = getTenantId();
    
    if (tenantId) {
      return query.eq('tenant_id', tenantId);
    }
    
    return query;
  };

  // Función para agregar tenant_id en inserts
  const addTenantToInsert = (data) => {
    const tenantId = getTenantId();
    
    if (tenantId) {
      return { ...data, tenant_id: tenantId };
    }
    
    return data;
  };

  return {
    getTenantId,
    addTenantFilter,
    addTenantToInsert,
    currentTenant
  };
};
