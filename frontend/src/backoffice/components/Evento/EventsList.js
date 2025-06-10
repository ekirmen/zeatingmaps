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
    <div className={`eventos-list ${viewMode}`}>
      {eventosFiltrados.length > 0 ? (
        eventosFiltrados.map((evento) => (
          <div key={evento._id} className="evento-item">
            {viewMode === 'grid' ? (
              <div className="evento-card">
                <div className="evento-image">
                  {evento.imagenes?.banner ? (
                    <img
                      src={`http://localhost:5000${evento.imagenes.banner}`}
                      alt={evento.nombre}
                    />
                  ) : (
                    <div className="placeholder-image">No image</div>
                  )}
                </div>
                <div className="evento-details">
                  <h3>{evento.nombre}</h3>
                  <p className="recinto-name">{recintoSeleccionado?.nombre}</p>
                  <p className="evento-id">ID: {evento._id}</p>
                  <div className="card-actions">
                    <button className="editar" onClick={() => handleEdit(evento._id)}>
                      Editar
                    </button>
                    <button className="eliminar" onClick={() => handleDelete(evento._id)}>
                      Eliminar
                    </button>
                    <button className="duplicar" onClick={() => handleDuplicate(evento._id)}>
                      Duplicar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="evento-info">
                <strong>{evento.nombre}</strong>
                <span>Sector: {evento.sector}</span>
                <div className="event-actions">
                  <button className="editar" onClick={() => handleEdit(evento._id)}>
                    Editar
                  </button>
                  <button className="eliminar" onClick={() => handleDelete(evento._id)}>
                    Eliminar
                  </button>
                  <button className="duplicar" onClick={() => handleDuplicate(evento._id)}>
                    Duplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No hay eventos para este recinto y sala.</p>
      )}
    </div>
  );
};

export default EventsList;