import React from 'react';

const EventsList = ({ 
  eventosFiltrados, 
  viewMode, 
  recintoSeleccionado,
  handleEdit,
  handleDelete,
  handleDuplicate
}) => {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'divide-y divide-gray-200'
      }
    >
      {eventosFiltrados.length > 0 ? (
        eventosFiltrados.map((evento) => (
          <div
            key={evento._id}
            className={
              viewMode === 'grid'
                ? 'border rounded shadow-sm overflow-hidden flex flex-col'
                : 'flex items-center justify-between py-3'
            }
          >
            {viewMode === 'grid' ? (
              <>
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {evento.imagenes?.banner ? (
                    <img
                      src={`http://localhost:5000${evento.imagenes.banner}`}
                      alt={evento.nombre}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-gray-500 text-sm">No image</div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between text-sm">
                  <div>
                    <h3 className="font-semibold truncate">{evento.nombre}</h3>
                    <p className="text-xs text-gray-500">{recintoSeleccionado?.nombre}</p>
                    <p className="text-xs text-gray-400">ID: {evento._id}</p>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                      onClick={() => handleEdit(evento._id)}
                    >
                      Editar
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      onClick={() => handleDelete(evento._id)}
                    >
                      Eliminar
                    </button>
                    <button
                      className="px-2 py-1 bg-gray-300 rounded"
                      onClick={() => handleDuplicate(evento._id)}
                    >
                      Duplicar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium">{evento.nombre}</p>
                  <p className="text-xs text-gray-500">Sector: {evento.sector}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={() => handleEdit(evento._id)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => handleDelete(evento._id)}
                  >
                    Eliminar
                  </button>
                  <button
                    className="px-2 py-1 bg-gray-300 rounded"
                    onClick={() => handleDuplicate(evento._id)}
                  >
                    Duplicar
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-sm text-gray-500 py-4">
          No hay eventos para este recinto y sala.
        </p>
      )}
    </div>
  );
};

export default EventsList;