import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detectar tenant del subdominio
  const detectTenant = async () => {
    try {
      setError(null);
      const hostname = window.location.hostname;
      console.log('🔍 Detectando tenant para hostname:', hostname);
      
      // Extraer subdominio de diferentes formatos de hostname
      let subdomain = null;
      
      // Caso 1: localhost (desarrollo)
      if (hostname === 'localhost' || hostname.includes('localhost')) {
        console.log('📍 Entorno de desarrollo detectado');
        setCurrentTenant(null);
        setLoading(false);
        return;
      }
      
      // Caso 2: Vercel preview deployments (ej: zeatingmaps-ekirmens-projects.vercel.app)
      if (hostname.includes('.vercel.app')) {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          // Tomar solo la primera parte antes del primer guión
          const firstPart = parts[0];
          if (firstPart.includes('-')) {
            subdomain = firstPart.split('-')[0];
          } else {
            subdomain = firstPart;
          }
        }
      }
      // Caso 3: Dominio personalizado (ej: empresa.ticketera.com)
      else if (hostname.includes('.')) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          subdomain = parts[0];
        }
      }
      
      console.log('🔍 Subdominio extraído:', subdomain);
      
      // Si no hay subdominio válido o es www, usar tenant por defecto
      if (!subdomain || subdomain === 'www' || subdomain === 'localhost') {
        console.log('📍 No se detectó subdominio válido, usando tenant por defecto');
        setCurrentTenant(null);
        setLoading(false);
        return;
      }

      // Buscar tenant por subdominio
      console.log('🔍 Buscando tenant con subdominio:', subdomain);
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró el tenant
          console.log('📍 No se encontró tenant activo para subdominio:', subdomain);
          setError(`No se encontró una empresa configurada para el subdominio: ${subdomain}`);
        } else {
          console.error('❌ Error detecting tenant:', error.message);
          setError(`Error al detectar empresa: ${error.message}`);
        }
        setCurrentTenant(null);
      } else if (tenant && typeof tenant === 'object') {
        // Verificar que el tenant tenga los campos mínimos requeridos
        if (tenant.id && tenant.subdomain && tenant.company_name) {
          console.log('✅ Tenant encontrado:', tenant);
          setCurrentTenant(tenant);
        } else {
          console.warn('⚠️ Tenant encontrado pero con datos incompletos:', tenant);
          setError('La empresa encontrada tiene datos incompletos');
          setCurrentTenant(null);
        }
      } else {
        console.warn('⚠️ Tenant encontrado pero no es un objeto válido:', tenant);
        setError('La empresa encontrada no tiene un formato válido');
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error('❌ Error in tenant detection:', error);
      setError(`Error inesperado: ${error.message}`);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectTenant();
  }, []);

  const value = {
    currentTenant,
    loading,
    error,
    detectTenant,
    // Función helper para verificar si el tenant es válido
    isTenantValid: () => {
      return currentTenant && 
             typeof currentTenant === 'object' && 
             currentTenant.id && 
             currentTenant.subdomain;
    }
  };

  return (
    <TenantContext.Provider value={value}>
      {!loading && children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
