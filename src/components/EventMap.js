import React from 'react';

const EventMap = ({ mapa, toggleSillaEnCarrito }) => {
  if (!mapa || !mapa.contenido) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg shadow-inner text-gray-600">
        Cargando mapa de asientos...
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-full overflow-auto font-inter">
      {mapa.contenido.map((elemento) => (
        <div
          key={elemento.id || elemento._id || elemento.nombre}
          className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
        >
          {elemento.nombre && (
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{elemento.nombre}</h3>
          )}

          {elemento.sillas && elemento.sillas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {elemento.sillas.map((silla) => {
                const isUnavailable = ['reservado', 'pagado', 'bloqueado'].includes(silla?.estado);
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
                  seatColorStyle = { backgroundColor: silla.color };
                }

                return (
                  <button
                    key={silla.id || silla._id || silla.numero}
                    className={seatClasses}
                    style={seatColorStyle}
                    aria-label={seatLabel}
                    disabled={isUnavailable}
                    onClick={() => toggleSillaEnCarrito(silla)}
                    type="button"
                  >
                    {silla.numero}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventMap;
