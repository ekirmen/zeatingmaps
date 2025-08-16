import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getDynamicDomainConfig, isMainDomain } from '../config/domainConfig';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domainConfig, setDomainConfig] = useState(null);

  // Detectar tenant de cualquier dominio
  const detectTenant = useCallback(async () => {
    try {
      setError(null);
      const hostname = window.location.hostname;
      console.log('🔍 Detectando tenant para hostname:', hostname);
      
      // Caso 1: localhost (desarrollo)
      if (hostname === 'localhost' || hostname.includes('localhost')) {
        console.log('📍 Entorno de desarrollo detectado');
        setCurrentTenant(null);
        setLoading(false);
        return;
      }
      
      // Caso 2: Dominio principal (sistema.veneventos.com)
      if (isMainDomain()) {
        console.log('🏠 Dominio principal detectado: sistema.veneventos.com');
        // Para el dominio principal, establecer tenant y configuración por defecto
        const mainTenant = {
          id: '00000000-0000-0000-0000-000000000000', // UUID válido para dominio principal
          company_name: 'Veneventos - Sistema Principal',
          full_url: 'sistema.veneventos.com',
          domain: 'veneventos.com',
          subdomain: 'sistema',
          status: 'active',
          isMainDomain: true
        };
        
        setCurrentTenant(mainTenant);
        
        // Establecer configuración por defecto para el dominio principal
        const mainConfig = {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Veneventos - Sistema Principal',
          theme: {
            primaryColor: '#1890ff',
            secondaryColor: '#52c41a',
            logo: '/assets/logo-veneventos.png'
          },
          features: {
            showSaaS: true,
            showStore: true,
            showBackoffice: true,
            showTicketing: true,
            showEvents: true,
            showVenues: true
          },
          branding: {
            companyName: 'Veneventos - Sistema Principal',
            tagline: 'Sistema de Eventos Profesional',
            contactEmail: 'info@veneventos.com'
          },
          customRoutes: [],
          isMainDomain: true,
          tenantType: 'main'
        };
        
        setDomainConfig(mainConfig);
        setLoading(false);
        return;
      }
      
      // Caso 3: Vercel preview deployments (ej: zeatingmaps-ekirmens-projects.vercel.app)
      if (hostname.includes('.vercel.app')) {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          const firstPart = parts[0];
          if (firstPart.includes('-')) {
            const subdomain = firstPart.split('-')[0];
            console.log('🔍 Subdominio Vercel detectado:', subdomain);
            await searchTenantBySubdomain(subdomain);
            return;
          }
        }
      }
      
      // Caso 4: Búsqueda universal por hostname completo
      console.log('🔍 Buscando tenant por hostname completo:', hostname);
      await searchTenantByHostname(hostname);
      
    } catch (error) {
      console.error('❌ Error in tenant detection:', error);
      setError(`Error inesperado: ${error.message}`);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar tenant por hostname completo
  const searchTenantByHostname = async (hostname) => {
    try {
      // Buscar por URL completa exacta
      let { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('full_url', hostname)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (tenant) {
        console.log('✅ Tenant encontrado por URL completa:', tenant);
        setCurrentTenant(tenant);
        
        // Cargar configuración dinámica
        const dynamicConfig = await getDynamicDomainConfig(supabase, hostname);
        if (dynamicConfig) {
          setDomainConfig(dynamicConfig);
        }
        return;
      }

      // Si no se encuentra por URL completa, buscar por dominio
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        const domain = domainParts.slice(-2).join('.');
        const subdomain = domainParts.length > 2 ? domainParts[0] : null;
        
        console.log('🔍 Buscando por dominio:', domain, 'subdominio:', subdomain);
        
        if (subdomain && subdomain !== 'www') {
          // Buscar por subdominio + dominio
          const searchUrl = `${subdomain}.${domain}`;
          ({ data: tenant, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('full_url', searchUrl)
            .eq('status', 'active')
            .single());
          
          if (tenant) {
            console.log('✅ Tenant encontrado por subdominio + dominio:', tenant);
            setCurrentTenant(tenant);
            
            // Cargar configuración dinámica
            const dynamicConfig = await getDynamicDomainConfig(supabase, hostname);
            if (dynamicConfig) {
              setDomainConfig(dynamicConfig);
            } else {
              // Si no hay configuración dinámica, usar configuración por defecto
              const defaultConfig = {
                id: tenant.id,
                name: tenant.company_name,
                theme: {
                  primaryColor: tenant.primary_color || '#1890ff',
                  secondaryColor: tenant.secondary_color || '#52c41a',
                  logo: tenant.logo_url || '/assets/logo.png'
                },
                features: {
                  showSaaS: true,
                  showStore: true,
                  showBackoffice: true,
                  showTicketing: true,
                  showEvents: true,
                  showVenues: true
                },
                branding: {
                  companyName: tenant.company_name,
                  tagline: 'Sistema de Gestión de Eventos',
                  contactEmail: tenant.contact_email
                },
                customRoutes: [],
                isMainDomain: false,
                tenantType: 'company'
              };
              setDomainConfig(defaultConfig);
            }
            return;
          }
        }
        
        // Buscar por dominio solo (para dominios completos)
        ({ data: tenant, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('domain', domain)
          .is('subdomain', null)
          .eq('status', 'active')
          .single());
        
        if (tenant) {
          console.log('✅ Tenant encontrado por dominio:', tenant);
          setCurrentTenant(tenant);
          
          // Cargar configuración dinámica
          const dynamicConfig = await getDynamicDomainConfig(supabase, hostname);
          if (dynamicConfig) {
            setDomainConfig(dynamicConfig);
          } else {
            // Si no hay configuración dinámica, usar configuración por defecto
            const defaultConfig = {
              id: tenant.id,
              name: tenant.company_name,
              theme: {
                primaryColor: tenant.primary_color || '#1890ff',
                secondaryColor: tenant.secondary_color || '#52c41a',
                logo: tenant.logo_url || '/assets/logo.png'
              },
              features: {
                showSaaS: true,
                showStore: true,
                showBackoffice: true,
                showTicketing: true,
                showEvents: true,
                showVenues: true
              },
              branding: {
                companyName: tenant.company_name,
                tagline: 'Sistema de Gestión de Eventos',
                contactEmail: tenant.contact_email
              },
              customRoutes: [],
              isMainDomain: false,
              tenantType: 'company'
            };
            setDomainConfig(defaultConfig);
          }
          return;
        }
      }

      // Si no se encuentra, mostrar error
      console.log('📍 No se encontró tenant para hostname:', hostname);
      setError(`No se encontró una empresa configurada para: ${hostname}`);
      setCurrentTenant(null);
      
    } catch (error) {
      console.error('❌ Error searching tenant by hostname:', error);
      setError(`Error al detectar empresa: ${error.message}`);
      setCurrentTenant(null);
    }
  };

  // Buscar tenant por subdominio (para casos especiales como Vercel)
  const searchTenantBySubdomain = async (subdomain) => {
    try {
      console.log('🔍 Buscando tenant por subdominio:', subdomain);
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📍 No se encontró tenant para subdominio:', subdomain);
          setError(`No se encontró una empresa configurada para el subdominio: ${subdomain}`);
        } else {
          throw error;
        }
        setCurrentTenant(null);
      } else if (tenant && typeof tenant === 'object') {
        if (tenant.id && tenant.subdomain && tenant.company_name) {
          console.log('✅ Tenant encontrado por subdominio:', tenant);
          setCurrentTenant(tenant);
          
          // Cargar configuración dinámica
          const dynamicConfig = await getDynamicDomainConfig(supabase, `${subdomain}.vercel.app`);
          if (dynamicConfig) {
            setDomainConfig(dynamicConfig);
          } else {
            // Si no hay configuración dinámica, usar configuración por defecto
            const defaultConfig = {
              id: tenant.id,
              name: tenant.company_name,
              theme: {
                primaryColor: tenant.primary_color || '#1890ff',
                secondaryColor: tenant.secondary_color || '#52c41a',
                logo: tenant.logo_url || '/assets/logo.png'
              },
              features: {
                showSaaS: true,
                showStore: true,
                showBackoffice: true,
                showTicketing: true,
                showEvents: true,
                showVenues: true
              },
              branding: {
                companyName: tenant.company_name,
                tagline: 'Sistema de Gestión de Eventos',
                contactEmail: tenant.contact_email
              },
              customRoutes: [],
              isMainDomain: false,
              tenantType: 'company'
            };
            setDomainConfig(defaultConfig);
          }
        } else {
          console.warn('⚠️ Tenant encontrado pero con datos incompletos:', tenant);
          setError('La empresa encontrada tiene datos incompletos');
          setCurrentTenant(null);
        }
      }
    } catch (error) {
      console.error('❌ Error searching tenant by subdomain:', error);
      setError(`Error al detectar empresa: ${error.message}`);
      setCurrentTenant(null);
    }
  };

  useEffect(() => {
    detectTenant();
  }, [detectTenant]);

  // Exponer el tenant actual globalmente para que otros servicios puedan acceder
  useEffect(() => {
    if (currentTenant?.id) {
      // Guardar en localStorage para acceso desde servicios
      localStorage.setItem('currentTenantId', currentTenant.id);
      
      // Exponer globalmente para acceso desde servicios de autenticación
      if (typeof window !== 'undefined') {
        window.__TENANT_CONTEXT__ = {
          currentTenant,
          getTenantId: () => currentTenant?.id
        };
      }
    }
  }, [currentTenant]);

  const value = {
    currentTenant,
    loading,
    error,
    domainConfig,
    detectTenant,
    // Función helper para verificar si el tenant es válido
    isTenantValid: () => {
      return currentTenant && 
             typeof currentTenant === 'object' && 
             currentTenant.id && 
             (currentTenant.subdomain || currentTenant.domain);
    },
    // Función helper para obtener la URL completa del tenant
    getTenantUrl: () => {
      if (!currentTenant || typeof currentTenant !== 'object') return null;
      
      // Si tiene full_url, usarla directamente
      if (currentTenant.full_url) {
        return currentTenant.full_url;
      }
      
      // Si tiene subdomain y domain, construir la URL
      if (currentTenant.subdomain && currentTenant.domain) {
        return `${currentTenant.subdomain}.${currentTenant.domain}`;
      }
      
      // Si solo tiene domain
      if (currentTenant.domain) {
        return currentTenant.domain;
      }
      
      // Si solo tiene subdomain
      if (currentTenant.subdomain) {
        return currentTenant.subdomain;
      }
      
      return null;
    },
    // Función helper para verificar si es el dominio principal
    isMainDomain: () => isMainDomain()
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
