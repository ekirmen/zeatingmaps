import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

const EnhancedEditUserForm = ({ user, onUpdateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    // Basic user info
    login: '',
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    
    // User profile and status
    perfil: '',
    activo: true,
    
    // Channels
    canales: {
      boxOffice: false,
      internet: false,
      marcaBlanca: false,
      test: false
    },
    
    // Permissions for SaaS multi-tenant system
    permisos: {
      // System Administration
      SYSTEM_ADMIN: false,
      TENANT_MANAGEMENT: false,
      USER_MANAGEMENT: false,
      BILLING_MANAGEMENT: false,
      SYSTEM_CONFIGURATION: false,
      
      // Tenant Administration
      TENANT_ADMIN: false,
      TENANT_USERS: false,
      TENANT_SETTINGS: false,
      TENANT_BILLING: false,
      
      // Event Management
      EVENT_CREATE: false,
      EVENT_EDIT: false,
      EVENT_DELETE: false,
      EVENT_PUBLISH: false,
      VENUE_MANAGEMENT: false,
      
      // Sales Management
      SALES_VIEW: false,
      SALES_CREATE: false,
      SALES_EDIT: false,
      SALES_CANCEL: false,
      SALES_REFUND: false,
      SALES_REPORTS: false,
      
      // Customer Support
      SUPPORT_TICKETS: false,
      CUSTOMER_DATA: false,
      SUPPORT_REPORTS: false,
      
      // Marketing
      MARKETING_CAMPAIGNS: false,
      EMAIL_MARKETING: false,
      ANALYTICS: false,
      
      // Finance
      FINANCE_VIEW: false,
      FINANCE_EDIT: false,
      INVOICE_MANAGEMENT: false,
      PAYMENT_PROCESSING: false,
      
      // Technical
      TECHNICAL_SUPPORT: false,
      API_ACCESS: false,
      SYSTEM_LOGS: false
    },
    
    // Payment methods
    metodosPago: {
      efectivo: false,
      zelle: false,
      pagoMovil: false,
      paypal: false,
      puntoVenta: false,
      procesadorPago: false
    },
    
    // Venues access
    recintos: []
  });

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectAllVenues, setSelectAllVenues] = useState(false);

  // User profile options for SaaS multi-tenant system
  const profileOptions = [
    { value: 'super_admin', label: 'Super Administrador' },
    { value: 'tenant_admin', label: 'Administrador de Tenant' },
    { value: 'event_manager', label: 'Gestor de Eventos' },
    { value: 'sales_manager', label: 'Gestor de Ventas' },
    { value: 'box_office', label: 'Taquilla' },
    { value: 'customer_support', label: 'Soporte al Cliente' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'reports', label: 'Reportes y Analytics' },
    { value: 'finance', label: 'Finanzas y Facturación' },
    { value: 'technical', label: 'Soporte Técnico' }
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        login: user.login || '',
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        empresa: user.empresa || '',
        perfil: user.perfil || '',
        activo: user.activo !== false,
        canales: user.canales || {
          boxOffice: false,
          internet: false,
          marcaBlanca: false,
          test: false
        },
        permisos: user.permisos || {
          // System Administration
          SYSTEM_ADMIN: false, TENANT_MANAGEMENT: false, USER_MANAGEMENT: false,
          BILLING_MANAGEMENT: false, SYSTEM_CONFIGURATION: false,
          
          // Tenant Administration
          TENANT_ADMIN: false, TENANT_USERS: false, TENANT_SETTINGS: false,
          TENANT_BILLING: false,
          
          // Event Management
          EVENT_CREATE: false, EVENT_EDIT: false, EVENT_DELETE: false,
          EVENT_PUBLISH: false, VENUE_MANAGEMENT: false,
          
          // Sales Management
          SALES_VIEW: false, SALES_CREATE: false, SALES_EDIT: false,
          SALES_CANCEL: false, SALES_REFUND: false, SALES_REPORTS: false,
          
          // Customer Support
          SUPPORT_TICKETS: false, CUSTOMER_DATA: false, SUPPORT_REPORTS: false,
          
          // Marketing
          MARKETING_CAMPAIGNS: false, EMAIL_MARKETING: false, ANALYTICS: false,
          
          // Finance
          FINANCE_VIEW: false, FINANCE_EDIT: false, INVOICE_MANAGEMENT: false,
          PAYMENT_PROCESSING: false,
          
          // Technical
          TECHNICAL_SUPPORT: false, API_ACCESS: false, SYSTEM_LOGS: false
        },
        metodosPago: user.metodospago || {
          efectivo: false, zelle: false, pagoMovil: false, paypal: false,
          puntoVenta: false, procesadorPago: false
        },
        recintos: user.recintos || []
      });
    }
    loadVenues();
  }, [user]);

  // Función para obtener email del usuario desde auth.users
  const getUserEmail = async (userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_email', { user_id: userId });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  };

  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('recintos')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error loading venues:', error);
      toast.error('Error al cargar recintos');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChannelChange = (channel, checked) => {
    setFormData(prev => ({
      ...prev,
      canales: {
        ...prev.canales,
        [channel]: checked
      }
    }));
  };

  const handlePermissionChange = (permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [permission]: checked
      }
    }));
  };

  const handlePaymentMethodChange = (method, checked) => {
    setFormData(prev => ({
      ...prev,
      metodosPago: {
        ...prev.metodosPago,
        [method]: checked
      }
    }));
  };

  const handleVenueChange = (venueId, checked) => {
    setFormData(prev => ({
      ...prev,
      recintos: checked 
        ? [...prev.recintos, venueId]
        : prev.recintos.filter(id => id !== venueId)
    }));
  };

  const handleSelectAllVenues = (checked) => {
    setSelectAllVenues(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recintos: venues.map(v => v.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recintos: []
      }));
    }
  };

  const handleSelectAllPermissions = (checked) => {
    const allPermissions = Object.keys(formData.permisos);
    setFormData(prev => ({
      ...prev,
      permisos: allPermissions.reduce((acc, permission) => {
        acc[permission] = checked;
        return acc;
      }, {})
    }));
  };

  const handleSelectAllPaymentMethods = (checked) => {
    const allMethods = Object.keys(formData.metodosPago);
    setFormData(prev => ({
      ...prev,
      metodosPago: allMethods.reduce((acc, method) => {
        acc[method] = checked;
        return acc;
      }, {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          login: formData.login,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          empresa: formData.empresa,
          perfil: formData.perfil,
          activo: formData.activo,
          canales: formData.canales,
          permisos: formData.permisos,
          metodospago: formData.metodosPago,
          recintos: formData.recintos
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      onUpdateUser(data);
      toast.success('Usuario actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar el perfil:', err.message);
      toast.error('Error al actualizar el perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasSelectedChannels = Object.values(formData.canales).some(channel => channel);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empresa
          </label>
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perfil
          </label>
          <select
            value={formData.perfil}
            onChange={(e) => handleInputChange('perfil', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Debe seleccionar el perfil del usuario</option>
            {profileOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => handleInputChange('activo', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Activo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Login
          </label>
          <input
            type="text"
            value={formData.login}
            onChange={(e) => handleInputChange('login', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Inicio de sesión del usuario"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de usuario"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Correo electrónico del usuario"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Teléfono"
          />
        </div>
      </div>

      {/* Channels Section */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Canales</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="boxOffice"
              checked={formData.canales.boxOffice}
              onChange={(e) => handleChannelChange('boxOffice', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="boxOffice" className="ml-2 text-sm text-gray-700">
              Box office
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="internet"
              checked={formData.canales.internet}
              onChange={(e) => handleChannelChange('internet', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="internet" className="ml-2 text-sm text-gray-700">
              Internet
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="marcaBlanca"
              checked={formData.canales.marcaBlanca}
              onChange={(e) => handleChannelChange('marcaBlanca', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="marcaBlanca" className="ml-2 text-sm text-gray-700">
              Marca blanca 1
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="test"
              checked={formData.canales.test}
              onChange={(e) => handleChannelChange('test', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="test" className="ml-2 text-sm text-gray-700">
              Test
            </label>
          </div>
        </div>
        
        {!hasSelectedChannels && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  No hay canales seleccionados, este perfil tiene acceso a los datos de todos los canales.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Section */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Permisos</h4>
        
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllPermissions"
              onChange={(e) => handleSelectAllPermissions(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAllPermissions" className="ml-2 text-sm text-gray-700">
              Seleccionar todos los permisos
            </label>
          </div>
        </div>

        {/* System Administration Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Administración del Sistema</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'SYSTEM_ADMIN', label: 'Super Administrador' },
              { key: 'TENANT_MANAGEMENT', label: 'Gestión de Tenants' },
              { key: 'USER_MANAGEMENT', label: 'Gestión de Usuarios' },
              { key: 'BILLING_MANAGEMENT', label: 'Gestión de Facturación' },
              { key: 'SYSTEM_CONFIGURATION', label: 'Configuración del Sistema' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Tenant Administration Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Administración de Tenant</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'TENANT_ADMIN', label: 'Administrador de Tenant' },
              { key: 'TENANT_USERS', label: 'Usuarios del Tenant' },
              { key: 'TENANT_SETTINGS', label: 'Configuración del Tenant' },
              { key: 'TENANT_BILLING', label: 'Facturación del Tenant' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Event Management Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Gestión de Eventos</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'EVENT_CREATE', label: 'Crear Eventos' },
              { key: 'EVENT_EDIT', label: 'Editar Eventos' },
              { key: 'EVENT_DELETE', label: 'Eliminar Eventos' },
              { key: 'EVENT_PUBLISH', label: 'Publicar Eventos' },
              { key: 'VENUE_MANAGEMENT', label: 'Gestión de Recintos' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Management Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Gestión de Ventas</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'SALES_VIEW', label: 'Ver Ventas' },
              { key: 'SALES_CREATE', label: 'Crear Ventas' },
              { key: 'SALES_EDIT', label: 'Editar Ventas' },
              { key: 'SALES_CANCEL', label: 'Cancelar Ventas' },
              { key: 'SALES_REFUND', label: 'Reembolsos' },
              { key: 'SALES_REPORTS', label: 'Reportes de Ventas' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Support Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Soporte al Cliente</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'SUPPORT_TICKETS', label: 'Tickets de Soporte' },
              { key: 'CUSTOMER_DATA', label: 'Datos de Clientes' },
              { key: 'SUPPORT_REPORTS', label: 'Reportes de Soporte' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Marketing</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'MARKETING_CAMPAIGNS', label: 'Campañas de Marketing' },
              { key: 'EMAIL_MARKETING', label: 'Email Marketing' },
              { key: 'ANALYTICS', label: 'Analytics' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Finance Permissions */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-3">Finanzas</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'FINANCE_VIEW', label: 'Ver Finanzas' },
              { key: 'FINANCE_EDIT', label: 'Editar Finanzas' },
              { key: 'INVOICE_MANAGEMENT', label: 'Gestión de Facturas' },
              { key: 'PAYMENT_PROCESSING', label: 'Procesamiento de Pagos' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Permissions */}
        <div>
          <h5 className="text-md font-medium text-gray-800 mb-3">Soporte Técnico</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'TECHNICAL_SUPPORT', label: 'Soporte Técnico' },
              { key: 'API_ACCESS', label: 'Acceso a API' },
              { key: 'SYSTEM_LOGS', label: 'Logs del Sistema' }
            ].map(permission => (
              <div key={permission.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.key}
                  checked={formData.permisos[permission.key]}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.key} className="ml-2 text-sm text-gray-700">
                  {permission.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Formas de pago</h4>
        
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllPaymentMethods"
              onChange={(e) => handleSelectAllPaymentMethods(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAllPaymentMethods" className="ml-2 text-sm text-gray-700">
              Selecciona todos los métodos de pago
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'procesadorPago', label: 'Fee procesador de pago' },
            { key: 'efectivo', label: 'Efectivo' },
            { key: 'zelle', label: 'Zelle' },
            { key: 'pagoMovil', label: 'Pago Móvil' },
            { key: 'paypal', label: 'Paypal' },
            { key: 'puntoVenta', label: 'Punto de Venta' }
          ].map(method => (
            <div key={method.key} className="flex items-center">
              <input
                type="checkbox"
                id={method.key}
                checked={formData.metodosPago[method.key]}
                onChange={(e) => handlePaymentMethodChange(method.key, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={method.key} className="ml-2 text-sm text-gray-700">
                {method.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Venues Section */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recintos usuario</h4>
        
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllVenues"
              checked={selectAllVenues}
              onChange={(e) => handleSelectAllVenues(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAllVenues" className="ml-2 text-sm text-gray-700">
              Seleccionar todos los recintos
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {venues.map(venue => (
            <div key={venue.id} className="flex items-center">
              <input
                type="checkbox"
                id={`venue-${venue.id}`}
                checked={formData.recintos.includes(venue.id)}
                onChange={(e) => handleVenueChange(venue.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`venue-${venue.id}`} className="ml-2 text-sm text-gray-700 truncate">
                {venue.nombre}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
};

export default EnhancedEditUserForm;
