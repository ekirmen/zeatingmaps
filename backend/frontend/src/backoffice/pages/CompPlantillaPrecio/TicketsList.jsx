import React from "react";

const TicketsList = ({ tickets, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <div
          key={ticket._id}
          className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex flex-col space-y-1 text-gray-800">
            <span className="font-semibold text-lg">{ticket.producto}</span>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Min: {ticket.min}</span>
              <span>Max: {ticket.max}</span>
              <span>Tipo: {ticket.tipoProducto || ticket.tipo}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(ticket._id)}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              aria-label={`Editar ${ticket.producto}`}
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(ticket._id)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
              aria-label={`Eliminar ${ticket.producto}`}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketsList;
