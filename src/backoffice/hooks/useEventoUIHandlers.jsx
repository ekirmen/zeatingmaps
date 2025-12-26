// hooks/useEventoUIHandlers.js
export const useEventoUIHandlers = (
  setEventoData,
  setMenuVisible,
  recintoSeleccionado,
  salaSeleccionada
) => {
  const handleCreateEventClick = () => {
    if (recintoSeleccionado && salaSeleccionada) {
      setEventoData({
        nombre: '',
        activo: 'true',
        recinto: recintoSeleccionado,
        sala: salaSeleccionada,
        fecha: null,
        descripcion: '',
        videoUrl: '',
        imagenes: [],
        plantilla: null,
        configuracion: {},
        boletas: [],
        opcionesAvanzadas: {},
        created_at: new Date().toISOString(),
      });
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
