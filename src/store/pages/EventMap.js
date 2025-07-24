// EventMap.js - Improved Styling and Accessibility
import React from 'react';

function EventMap({ mapa, toggleSillaEnCarrito }) {
  // Add defensive checks before trying to access nested properties or map over arrays
  if (!mapa || !mapa.contenido) {
    // You can render a loading spinner, a placeholder, or just return null
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg shadow-inner text-gray-600">
        Cargando mapa de asientos...
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-full overflow-auto font-inter">
      {/* Iterate over the main content elements of the map */}
      {mapa.contenido.map((elemento) => (
        <div
          key={elemento.id || elemento._id || elemento.nombre}
          className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
        >
          {elemento.nombre && (
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{elemento.nombre}</h3>
          )}

          {/* Ensure 'sillas' array exists before mapping */}
          {elemento.sillas && elemento.sillas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {elemento.sillas.map((silla) => {
                const isUnavailable = ['reservado', 'pagado', 'seleccionado', 'bloqueado'].includes(silla?.estado);
                const isSelected = silla.selected;

                let seatClasses = `
                  relative w-10 h-10 flex items-center justify-center text-sm font-medium rounded-md cursor-pointer
                  transition-all duration-200 ease-in-out
                  border-2
                `;
                let seatLabel = `Asiento ${silla.numero || 'sin número'}`;
                let seatColorStyle = {};

                if (isSelected) {
                  seatClasses += ' bg-blue-600 text-white border-blue-700 shadow-md transform scale-105';
                  seatLabel += ', seleccionado';
                } else if (isUnavailable) {
                  seatClasses += ' bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-70';
                  seatLabel += `, ${silla.estado}`;
                } else {
                  seatClasses += ' bg-green-500 text-white border-green-600 hover:bg-green-600 hover:border-green-700';
                  seatLabel += ', disponible';
                  seatColorStyle = { backgroundColor: silla.color }; // Apply base color if available and not selected/unavailable
                }

                return (
                  <div
                    key={silla._id || silla.id}
                    className={seatClasses}
                    style={seatColorStyle} // Apply dynamic background color
                    onClick={() => !isUnavailable && toggleSillaEnCarrito(silla, elemento)}
                    role="button"
                    aria-label={seatLabel}
                    title={seatLabel}
                  >
                    {silla.numero}
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 bg-blue-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add other elements like mesas if they exist in your map structure */}
          {elemento.mesas && elemento.mesas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {elemento.mesas.map((mesa) => (
                <div
                  key={mesa.id || mesa._id}
                  className="p-4 bg-yellow-200 text-yellow-800 rounded-lg shadow-md border border-yellow-300 font-semibold text-center"
                  role="region"
                  aria-label={`Mesa ${mesa.nombre || 'sin nombre'}`}
                >
                  Mesa {mesa.nombre}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default EventMap;
