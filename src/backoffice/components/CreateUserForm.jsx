import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

const DEFAULT_CHANNELS = {
  boxOffice: false,
  internet: false,
  marcaBlanca: false,
  test: false
};

const DEFAULT_PERMISSIONS = {
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
};

const DEFAULT_PAYMENT_METHODS = {
  efectivo: false,
  zelle: false,
  pagoMovil: false,
  paypal: false,
  puntoVenta: false,
  procesadorPago: false
};

const CreateUserForm = ({ onCreateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    login: '',
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
    perfil: '',
    activo: true,
    canales: { ...DEFAULT_CHANNELS },
    permisos: { ...DEFAULT_PERMISSIONS },
    metodosPago: { ...DEFAULT_PAYMENT_METHODS },
    recintos: []
  });

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectAllVenues, setSelectAllVenues] = useState(false);

  const profileOptions = [
    { value: 'tenant_admin', label: 'Administrador (Dueño)' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'taquilla', label: 'Taquilla' },
    { value: 'agencias', label: 'Agencias' },
    { value: 'call_center', label: 'Call Center' },
    { value: 'contenido_marketing', label: 'Contenido / Marketing' },
    { value: 'atencion_cliente', label: 'Atención al Cliente' },
    { value: 'vendedor_externo', label: 'Vendedor Externo' },
    { value: 'reportes', label: 'Reportes (Auditor)' }
  ];

  useEffect(() => {
    loadVenues();
  }, []);

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
    const allPermissions = Object.keys(DEFAULT_PERMISSIONS);
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
      const { data: userResponse, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { password_set: !!formData.password },
      });

      if (error) throw error;

      // Esperar un poco para que el trigger inserte en profiles
      await new Promise((res) => setTimeout(res, 1500));

      // Actualizamos los datos del perfil usando el ID del usuario recién creado
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          login: formData.login,
          nombre: formData.nombre,
          apellido: formData.apellido,
          tenant_id: formData.empresa,
          telefono: formData.telefono,
          role: formData.perfil,
          activo: formData.activo,
          canales: formData.canales,
          permisos: formData.permisos,
          metodospago: formData.metodosPago,
          recintos: formData.recintos
        })
        .eq('id', userResponse.user.id);

      if (profileError) throw profileError;

      // Obtener el nuevo perfil
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userResponse.user.id)
        .single();

      toast.success('Usuario creado correctamente');
      onCreateUser(newProfile);
    } catch (err) {
      console.error('Error al crear usuario:', err);
      toast.error('Error al crear usuario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasSelectedChannels = Object.values(formData.canales).some(channel => channel);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
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
            placeholder="ID del tenant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perfil *
          </label>
          <select
            value={formData.perfil}
            onChange={(e) => handleInputChange('perfil', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar perfil</option>
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
          <div className="flex items-center pt-2">
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
            Login / Email *
          </label>
          <input
            type="email"
            value={formData.login}
            onChange={(e) => {
              handleInputChange('login', e.target.value);
              handleInputChange('email', e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellido
          </label>
          <input
            type="text"
            value={formData.apellido}
            onChange={(e) => handleInputChange('apellido', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Apellido"
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
            placeholder="+58 412 1234567"
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
              id="create-boxOffice"
              checked={formData.canales.boxOffice}
              onChange={(e) => handleChannelChange('boxOffice', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-boxOffice" className="ml-2 text-sm text-gray-700">
              Box office
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="create-internet"
              checked={formData.canales.internet}
              onChange={(e) => handleChannelChange('internet', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-internet" className="ml-2 text-sm text-gray-700">
              Internet
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="create-marcaBlanca"
              checked={formData.canales.marcaBlanca}
              onChange={(e) => handleChannelChange('marcaBlanca', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-marcaBlanca" className="ml-2 text-sm text-gray-700">
              Marca blanca 1
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="create-test"
              checked={formData.canales.test}
              onChange={(e) => handleChannelChange('test', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-test" className="ml-2 text-sm text-gray-700">
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

      {/* Permissions Section - Collapsed by default */}
      <details className="border-t pt-6">
        <summary className="text-lg font-medium text-gray-900 mb-4 cursor-pointer">
          Permisos (Click para expandir)
        </summary>

        <div className="mb-4 mt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="create-selectAllPermissions"
              onChange={(e) => handleSelectAllPermissions(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-selectAllPermissions" className="ml-2 text-sm text-gray-700">
              Seleccionar todos los permisos
            </label>
          </div>
        </div>

        {/* Permissions groups - simplified for space */}
        <div className="space-y-4">
          {[
            { title: 'Administración del Sistema', perms: ['SYSTEM_ADMIN', 'TENANT_MANAGEMENT', 'USER_MANAGEMENT', 'BILLING_MANAGEMENT', 'SYSTEM_CONFIGURATION'] },
            { title: 'Administración de Tenant', perms: ['TENANT_ADMIN', 'TENANT_USERS', 'TENANT_SETTINGS', 'TENANT_BILLING'] },
            { title: 'Gestión de Eventos', perms: ['EVENT_CREATE', 'EVENT_EDIT', 'EVENT_DELETE', 'EVENT_PUBLISH', 'VENUE_MANAGEMENT'] },
            { title: 'Gestión de Ventas', perms: ['SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_CANCEL', 'SALES_REFUND', 'SALES_REPORTS'] },
            { title: 'Soporte al Cliente', perms: ['SUPPORT_TICKETS', 'CUSTOMER_DATA', 'SUPPORT_REPORTS'] },
            { title: 'Marketing', perms: ['MARKETING_CAMPAIGNS', 'EMAIL_MARKETING', 'ANALYTICS'] },
            { title: 'Finanzas', perms: ['FINANCE_VIEW', 'FINANCE_EDIT', 'INVOICE_MANAGEMENT', 'PAYMENT_PROCESSING'] },
            { title: 'Soporte Técnico', perms: ['TECHNICAL_SUPPORT', 'API_ACCESS', 'SYSTEM_LOGS'] }
          ].map((group, idx) => (
            <div key={idx}>
              <h5 className="text-md font-medium text-gray-800 mb-2">{group.title}</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {group.perms.map(perm => (
                  <div key={perm} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`create-${perm}`}
                      checked={formData.permisos[perm]}
                      onChange={(e) => handlePermissionChange(perm, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`create-${perm}`} className="ml-2 text-sm text-gray-700">
                      {perm.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Payment Methods Section */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Formas de pago</h4>

        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="create-selectAllPaymentMethods"
              onChange={(e) => handleSelectAllPaymentMethods(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-selectAllPaymentMethods" className="ml-2 text-sm text-gray-700">
              Seleccionar todos los métodos de pago
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
                id={`create-${method.key}`}
                checked={formData.metodosPago[method.key]}
                onChange={(e) => handlePaymentMethodChange(method.key, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`create-${method.key}`} className="ml-2 text-sm text-gray-700">
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
              id="create-selectAllVenues"
              checked={selectAllVenues}
              onChange={(e) => handleSelectAllVenues(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-selectAllVenues" className="ml-2 text-sm text-gray-700">
              Seleccionar todos los recintos
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-h-48 overflow-y-auto">
          {venues.map(venue => (
            <div key={venue.id} className="flex items-center">
              <input
                type="checkbox"
                id={`create-venue-${venue.id}`}
                checked={formData.recintos.includes(venue.id)}
                onChange={(e) => handleVenueChange(venue.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`create-venue-${venue.id}`} className="ml-2 text-sm text-gray-700 truncate">
                {venue.nombre}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
};

export default CreateUserForm;
