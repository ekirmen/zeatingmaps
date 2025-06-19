export const useEventoUIHandlers = (setEventoData, setMenuVisible, recintoSeleccionado, salaSeleccionada) => {
  const handleCreateEventClick = () => {
    if (recintoSeleccionado && salaSeleccionada) {
      setEventoData({
        nombre: '',
        activo: true,
        // ... resto de los datos iniciales
      });
      setMenuVisible(true);
    } else {
      alert('Por favor, selecciona un recinto y una sala');
    }
  };

  const handleEdit = (eventoId, eventos) => {
    const eventoParaEditar = eventos.find((evento) => evento._id === eventoId);
    setEventoData(eventoParaEditar);
    setMenuVisible(true);
  };

  return {
    handleCreateEventClick,
    handleEdit
  };
};