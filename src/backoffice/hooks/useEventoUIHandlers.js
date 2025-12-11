// hooks/useEventoUIHandlers.js
export 
      setMenuVisible(true);
    } else {
      alert('Por favor, selecciona un recinto y una sala');
    }
  };

  const handleEdit = (eventoId, eventos) => {
    const eventoParaEditar = eventos.find((evento) => evento.id === eventoId); // cambiado _id por id
    if (eventoParaEditar) {
      setEventoData(eventoParaEditar);
      setMenuVisible(true);
    } else {
      alert('Evento no encontrado');
    }
  };

  return {
    handleCreateEventClick,
    handleEdit,
  };
};
