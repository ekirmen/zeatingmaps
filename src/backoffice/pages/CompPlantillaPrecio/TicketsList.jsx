import React from "react";

const TicketsList = ({ tickets, onEdit, onDelete }) => {

    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entradas configuradas</h3>
        <p className="text-gray-500">
          Crea tu primera entrada usando el botón "Crear Entrada"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <div
          key={ticket._id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Información Principal */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {ticket.nombre_entrada || ticket.nombreEntrada || 'Sin nombre'}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tipo:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {ticket.tipo_producto || ticket.tipoProducto || ticket.tipo || 'No especificado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Cantidad:</span>
                        <span className="text-gray-800">
                          {ticket.min || 1} - {ticket.max || 10}
                        </span>
                      </div>
                      {ticket.iva && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">IVA:</span>
                          <span className="text-gray-800">
                            {ticket.iva}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(ticket)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
                  aria-label={`Editar ${ticket.nombre_entrada || ticket.nombreEntrada}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => onDelete(ticket._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
                  aria-label={`Eliminar ${ticket.nombre_entrada || ticket.nombreEntrada}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketsList;
