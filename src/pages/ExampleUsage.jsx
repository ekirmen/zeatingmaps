import React from 'react';
import { ProtectedRoute, usePermissions } from '../components/Sidebar';
import { hasPermission, canAccessFunctionality } from '../utils/roleBasedAccess';

// Ejemplo de uso del sistema de control de acceso basado en roles

// Página de ejemplo que muestra diferentes formas de usar el sistema
const ExampleUsage = ({ user }) => {
  // Usar el hook de permisos
  const { 
    checkPermission, 
    checkMultiplePermissions, 
    checkAnyPermission,
    role,
    readableRole 
  } = usePermissions(user);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Ejemplo de Control de Acceso</h1>
      
      {/* Información del usuario */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Información del Usuario</h2>
        <p><strong>Rol:</strong> {readableRole}</p>
        <p><strong>Rol técnico:</strong> {role}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>

      {/* Ejemplos de verificación de permisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Verificación individual de permisos */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Verificación Individual</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Dashboard:</span>
              <span className={checkPermission('dashboard') ? 'text-green-600' : 'text-red-600'}>
                {checkPermission('dashboard') ? '✅ Permitido' : '❌ Denegado'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Gestión de Usuarios:</span>
              <span className={checkPermission('gestión_de_usuarios') ? 'text-green-600' : 'text-red-600'}>
                {checkPermission('gestión_de_usuarios') ? '✅ Permitido' : '❌ Denegado'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Panel SaaS:</span>
              <span className={checkPermission('panel_saas') ? 'text-green-600' : 'text-red-600'}>
                {checkPermission('panel_saas') ? '✅ Permitido' : '❌ Denegado'}
              </span>
            </div>
          </div>
        </div>

        {/* Verificación múltiple de permisos */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Verificación Múltiple</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Dashboard + Actividad:</span>
              <span className={checkMultiplePermissions(['dashboard', 'actividad']) ? 'text-green-600' : 'text-red-600'}>
                {checkMultiplePermissions(['dashboard', 'actividad']) ? '✅ Todos' : '❌ Faltan'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Al menos uno (Ventas/CRM):</span>
              <span className={checkAnyPermission(['ventas', 'crm']) ? 'text-green-600' : 'text-red-600'}>
                {checkAnyPermission(['ventas', 'crm']) ? '✅ Al menos uno' : '❌ Ninguno'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplos de contenido condicional */}
      <div className="mt-6 space-y-4">
        
        {/* Contenido solo para super admins */}
        {hasPermission(user, 'gestión_de_tenants') && (
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-purple-800">Panel de Super Administrador</h3>
            <p className="text-purple-700">Este contenido solo es visible para super administradores.</p>
            <button className="mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              Gestionar Tenants
            </button>
          </div>
        )}

        {/* Contenido solo para tenant admins */}
        {hasPermission(user, 'usuarios_del_tenant') && (
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-800">Panel de Tenant Admin</h3>
            <p className="text-green-700">Este contenido solo es visible para administradores de tenant.</p>
            <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Gestionar Usuarios del Tenant
            </button>
          </div>
        )}

        {/* Contenido solo para event managers */}
        {hasPermission(user, 'crear_eventos') && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-800">Panel de Gestor de Eventos</h3>
            <p className="text-blue-700">Este contenido solo es visible para gestores de eventos.</p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Crear Nuevo Evento
            </button>
          </div>
        )}

        {/* Contenido solo para usuarios con permisos de ventas */}
        {canAccessFunctionality(user, 'ver_ventas') && (
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-orange-800">Panel de Ventas</h3>
            <p className="text-orange-700">Este contenido solo es visible para usuarios con permisos de ventas.</p>
            <button className="mt-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
              Ver Reporte de Ventas
            </button>
          </div>
        )}
      </div>

      {/* Ejemplo de botones condicionales */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Botones Condicionales</h3>
        
        <div className="flex flex-wrap gap-2">
          {hasPermission(user, 'gestión_de_recintos') && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Gestionar Recintos
            </button>
          )}
          
          {hasPermission(user, 'gestión_de_facturación') && (
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Gestionar Facturación
            </button>
          )}
          
          {hasPermission(user, 'soporte_técnico') && (
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              Soporte Técnico
            </button>
          )}
          
          {hasPermission(user, 'analytics') && (
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Ver Analytics
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Ejemplo de cómo proteger una ruta completa
const ProtectedExamplePage = ({ user }) => {
  return (
    <ProtectedRoute user={user} requiredPermission="dashboard">
      <ExampleUsage user={user} />
    </ProtectedRoute>
  );
};

// Ejemplo de cómo usar en un componente de formulario
const ConditionalFormFields = ({ user }) => {
  return (
    <div className="space-y-4">
      {/* Campos básicos siempre visibles */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>

      {/* Campos solo para usuarios con permisos específicos */}
      {hasPermission(user, 'gestión_de_facturación') && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Información de Facturación</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
      )}

      {hasPermission(user, 'configuración_del_sistema') && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Configuración del Sistema</label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            <option>Opción 1</option>
            <option>Opción 2</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default ExampleUsage;
export { ProtectedExamplePage, ConditionalFormFields };
