import { useState, useCallback } from 'react';
import { API_ENDPOINTS, apiRequest, handleApiError } from '../config/apiEndpoints';
import { eventosService, zonasService } from '../services/supabaseServices';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función genérica para hacer requests
  const request = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest(endpoint, options);
      return response;

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Grid Sale APIs
  const gridSale = {
    loadZonas: useCallback(async (salaId) => {
      // Usar Supabase directo con RLS
      setLoading(true);
      setError(null);
      try {
        const zonas = await zonasService.list(salaId);
        return zonas;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    validateSale: useCallback(async (items, evento, funcion) => {
      return request(API_ENDPOINTS.GRID_SALE.VALIDATE_SALE, {
        method: 'POST',
        body: JSON.stringify({ items, evento, funcion })
      });
    }, [request]),

    processSale: useCallback(async (items, evento, funcion, cliente, paymentData) => {
      return request(API_ENDPOINTS.GRID_SALE.PROCESS_SALE, {
        method: 'POST',
        body: JSON.stringify({ items, evento, funcion, cliente, paymentData })
      });
    }, [request])
  };

  // Events APIs
  const events = {
    list: useCallback(async (filters = {}) => {
      // Usar Supabase directo con RLS
      setLoading(true);
      setError(null);
      try {
        const eventos = await eventosService.list(filters);
        return eventos;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    getBySlug: useCallback(async (slug) => {
      return request(`${API_ENDPOINTS.EVENTS.GET_BY_SLUG}?slug=${slug}`);
    }, [request]),

    create: useCallback(async (eventoData) => {
      return request(API_ENDPOINTS.EVENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(eventoData)
      });
    }, [request]),

    update: useCallback(async (eventoData) => {
      return request(API_ENDPOINTS.EVENTS.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(eventoData)
      });
    }, [request]),

    delete: useCallback(async (eventoId) => {
      return request(API_ENDPOINTS.EVENTS.DELETE, {
        method: 'DELETE',
        body: JSON.stringify({ id: eventoId })
      });
    }, [request])
  };

  // SaaS APIs
  const saas = {
    getDashboardStats: useCallback(async (tenantId, period = '30d') => {
      return request(`${API_ENDPOINTS.SAAS.DASHBOARD_STATS}?tenant_id=${tenantId}&period=${period}`);
    }, [request]),

    getUsers: useCallback(async (tenantId, params = {}) => {
      const queryParams = new URLSearchParams({ tenant_id: tenantId, ...params }).toString();
      return request(`${API_ENDPOINTS.SAAS.USER_MANAGEMENT}?${queryParams}`);
    }, [request]),

    createUser: useCallback(async (userData) => {
      return request(API_ENDPOINTS.SAAS.USER_MANAGEMENT, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    }, [request]),

    updateUser: useCallback(async (userData) => {
      return request(API_ENDPOINTS.SAAS.USER_MANAGEMENT, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    }, [request]),

    deleteUser: useCallback(async (userId, tenantId) => {
      return request(API_ENDPOINTS.SAAS.USER_MANAGEMENT, {
        method: 'DELETE',
        body: JSON.stringify({ user_id: userId, tenant_id: tenantId })
      });
    }, [request])
  };

  // Analytics APIs
  const analytics = {
    getSalesReport: useCallback(async (tenantId, params = {}) => {
      const queryParams = new URLSearchParams({ tenant_id: tenantId, ...params }).toString();
      return request(`${API_ENDPOINTS.ANALYTICS.SALES_REPORT}?${queryParams}`);
    }, [request]),

    getEventReport: useCallback(async (tenantId, eventId) => {
      return request(`${API_ENDPOINTS.ANALYTICS.EVENT_REPORT}?tenant_id=${tenantId}&event_id=${eventId}`);
    }, [request]),

    getClientReport: useCallback(async (tenantId) => {
      return request(`${API_ENDPOINTS.ANALYTICS.CLIENT_REPORT}?tenant_id=${tenantId}`);
    }, [request]),

    getRevenueReport: useCallback(async (tenantId, period = '30d') => {
      return request(`${API_ENDPOINTS.ANALYTICS.REVENUE_REPORT}?tenant_id=${tenantId}&period=${period}`);
    }, [request])
  };

  // Payment APIs
  const payment = {
    testStripe: useCallback(async (stripeData) => {
      return request(API_ENDPOINTS.PAYMENT.TEST_STRIPE, {
        method: 'POST',
        body: JSON.stringify(stripeData)
      });
    }, [request]),

    testPayPal: useCallback(async (paypalData) => {
      return request(API_ENDPOINTS.PAYMENT.TEST_PAYPAL, {
        method: 'POST',
        body: JSON.stringify(paypalData)
      });
    }, [request]),

    processStripe: useCallback(async (paymentData) => {
      return request(API_ENDPOINTS.PAYMENT.PROCESS_STRIPE, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
    }, [request]),

    processPayPal: useCallback(async (paymentData) => {
      return request(API_ENDPOINTS.PAYMENT.PROCESS_PAYPAL, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
    }, [request]),

    refund: useCallback(async (refundData) => {
      return request(API_ENDPOINTS.PAYMENT.REFUND_PAYMENT, {
        method: 'POST',
        body: JSON.stringify(refundData)
      });
    }, [request])
  };

  // Functions APIs
  const functions = {
    list: useCallback(async (eventoId) => {
      // Usar Supabase directo con RLS
      setLoading(true);
      setError(null);
      try {
        const { funcionesService } = await import('../services/supabaseServices');
        const funciones = await funcionesService.list({ evento_id: eventoId });
        return funciones;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    create: useCallback(async (funcionData) => {
      setLoading(true);
      setError(null);
      try {
        const { funcionesService } = await import('../services/supabaseServices');
        const funcion = await funcionesService.create(funcionData);
        return funcion;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    update: useCallback(async (funcionData) => {
      setLoading(true);
      setError(null);
      try {
        const { funcionesService } = await import('../services/supabaseServices');
        const funcion = await funcionesService.update(funcionData.id, funcionData);
        return funcion;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    delete: useCallback(async (funcionId) => {
      setLoading(true);
      setError(null);
      try {
        const { funcionesService } = await import('../services/supabaseServices');
        await funcionesService.delete(funcionId);
        return { success: true };
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, [])
  };

  // Zones APIs
  const zones = {
    list: useCallback(async (salaId) => {
      // Usar Supabase directo con RLS
      setLoading(true);
      setError(null);
      try {
        const { zonasService } = await import('../services/supabaseServices');
        const zonas = await zonasService.list(salaId);
        return zonas;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    create: useCallback(async (zonaData) => {
      setLoading(true);
      setError(null);
      try {
        const { zonasService } = await import('../services/supabaseServices');
        const zona = await zonasService.create(zonaData);
        return zona;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    update: useCallback(async (zonaData) => {
      setLoading(true);
      setError(null);
      try {
        const { zonasService } = await import('../services/supabaseServices');
        const zona = await zonasService.update(zonaData.id, zonaData);
        return zona;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []),

    delete: useCallback(async (zonaId) => {
      setLoading(true);
      setError(null);
      try {
        const { zonasService } = await import('../services/supabaseServices');
        await zonasService.delete(zonaId);
        return { success: true };
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, [])
  };

  // Sales APIs
  const sales = {
    list: useCallback(async (tenantId, params = {}) => {
      const queryParams = new URLSearchParams({ tenant_id: tenantId, ...params }).toString();
      return request(`${API_ENDPOINTS.SALES.LIST}?${queryParams}`);
    }, [request]),

    create: useCallback(async (ventaData) => {
      return request(API_ENDPOINTS.SALES.CREATE, {
        method: 'POST',
        body: JSON.stringify(ventaData)
      });
    }, [request]),

    update: useCallback(async (ventaData) => {
      return request(API_ENDPOINTS.SALES.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(ventaData)
      });
    }, [request]),

    cancel: useCallback(async (ventaId) => {
      return request(API_ENDPOINTS.SALES.CANCEL, {
        method: 'POST',
        body: JSON.stringify({ id: ventaId })
      });
    }, [request])
  };

  // Clients APIs
  const clients = {
    list: useCallback(async (tenantId, params = {}) => {
      const queryParams = new URLSearchParams({ tenant_id: tenantId, ...params }).toString();
      return request(`${API_ENDPOINTS.CLIENTS.LIST}?${queryParams}`);
    }, [request]),

    search: useCallback(async (query, tenantId) => {
      return request(`${API_ENDPOINTS.CLIENTS.SEARCH}?q=${query}&tenant_id=${tenantId}`);
    }, [request]),

    create: useCallback(async (clienteData) => {
      return request(API_ENDPOINTS.CLIENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(clienteData)
      });
    }, [request]),

    update: useCallback(async (clienteData) => {
      return request(API_ENDPOINTS.CLIENTS.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(clienteData)
      });
    }, [request]),

    delete: useCallback(async (clienteId) => {
      return request(API_ENDPOINTS.CLIENTS.DELETE, {
        method: 'DELETE',
        body: JSON.stringify({ id: clienteId })
      });
    }, [request])
  };

  return {
    loading,
    error,
    clearError: () => setError(null),
    gridSale,
    events,
    saas,
    analytics,
    payment,
    functions,
    zones,
    sales,
    clients
  };
};

export default useApi;
