import { message } from 'antd';

export const createSeatHandlers = ({
  selectedFuncion,
  carrito,
  setCarrito,
  selectedClient,
  blockMode,
  abonoMode,
  zonas,
  detallesPlantilla,
  appliedDiscount,
  funciones,
  selectedFuncionEventId,
  lockSeat,
  unlockSeat,
  isSeatLocked,
  isSeatLockedByMe,
  handleSeatAnimation,
  abonoSeats
}) => {
  const handleSeatClick = (seat, table) => {
    const currentFuncId = selectedFuncion?.id || selectedFuncion?._id;
    const currentFuncIdNum = typeof currentFuncId === 'object'
      ? (currentFuncId?.id || currentFuncId?._id)
      : currentFuncId;
    const zonaId = seat.zona;
    const zonaObj = Array.isArray(zonas) ? zonas.find(z => (z.id || z._id) === zonaId) : null;

    // Cliente opcional - se puede seleccionar después
    // if (!selectedClient) {
    //   message.info('Seleccione un cliente antes de agregar asientos');
    //   return;
    // }

    // Modo bloqueo - permite seleccionar asientos para bloquearlos
    if (blockMode) {
      // Verificar que el asiento no esté vendido, reservado o anulado
      if (seat.estado === 'pagado' || seat.estado === 'reservado' || seat.estado === 'anulado') {
        message.warning(`No se puede bloquear un asiento ${seat.estado}`);
        return;
      }

      // Verificar si ya está bloqueado por otro usuario
      if (isSeatLocked(seat._id, currentFuncIdNum) && !isSeatLockedByMe(seat._id, currentFuncIdNum)) {
        message.warning('Este asiento ya está siendo seleccionado por otro usuario');
        return;
      }

      const blockedExists = Array.isArray(carrito) ? carrito.find(i => i._id === seat._id && i.isBlocked) : null;
      
      if (blockedExists) {
        // Desbloquear asiento
        console.log('🔓 Intentando desbloquear asiento:', seat._id, 'para función:', currentFuncId);
        setCarrito(carrito.filter(i => !(i._id === seat._id && i.isBlocked)));
        unlockSeat(seat._id, currentFuncIdNum).then((result) => {
          console.log('✅ Asiento desbloqueado exitosamente:', result);
          message.success('Asiento desbloqueado');
        }).catch(err => {
          console.error('❌ Error al desbloquear asiento:', err);
          message.error('Error al desbloquear el asiento');
        });
      } else {
        // Bloquear asiento
        console.log('🔒 Intentando bloquear asiento:', seat._id, 'para función:', currentFuncId);
        lockSeat(seat._id, currentFuncIdNum).then((result) => {
          console.log('✅ Asiento bloqueado exitosamente:', result);
          setCarrito([
            ...carrito,
            {
              _id: seat._id,
              nombre: seat.nombre,
              nombreMesa: table.nombre,
              zona: zonaObj?.nombre || seat.zona,
              isBlocked: true,
              funcionId: currentFuncIdNum,
              funcionFecha: selectedFuncion?.fechaCelebracion,
              precio: 0, // Los asientos bloqueados no tienen precio
            },
          ]);
          message.success('Asiento bloqueado correctamente');
        }).catch(err => {
          console.error('❌ Error al bloquear asiento:', err);
          message.error('Error al bloquear el asiento');
        });
      }
      return;
    }

    // Verificar si el asiento ya existe en el carrito (modo normal)
    const exists = Array.isArray(carrito) ? carrito.find(
      (i) =>
        i._id === seat._id &&
        (abonoMode ? i.abonoGroup : i.funcionId === currentFuncIdNum)
    ) : null;

    // Determine pricing from the selected plantilla
    const detalle = Array.isArray(detallesPlantilla) ? detallesPlantilla.find(d => {
      const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
      return id === zonaId;
    }) : null;
    
    if (!detalle) {
      message.error('Zona sin precio configurado');
      return;
    }

    const basePrice = detalle.precio || 0;
    let finalPrice = basePrice;
    let tipoPrecio = 'normal';
    let descuentoNombre = '';

    if (appliedDiscount?.detalles) {
      const d = Array.isArray(appliedDiscount.detalles) ? appliedDiscount.detalles.find(dt => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === zonaId;
      }) : null;
      if (d) {
        if (d.tipo === 'porcentaje') {
          finalPrice = Math.max(0, basePrice - (basePrice * d.valor) / 100);
        } else {
          finalPrice = Math.max(0, basePrice - d.valor);
        }
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }

    if (exists) {
      console.log('Removiendo asiento del carrito:', seat._id);
      if (abonoMode) {
        const groupId = `abono-${seat._id}`;
        setCarrito(carrito.filter(i => i.abonoGroup !== groupId));
        } else {
          setCarrito(
            carrito.filter(
              (i) => !(i._id === seat._id && i.funcionId === currentFuncIdNum)
            )
          );
        }
    } else {
      console.log('Agregando asiento al carrito:', seat._id, seat.nombre);
      if (abonoMode) {
        const groupId = `abono-${seat._id}`;
        const currentEventId = selectedFuncionEventId
          || selectedFuncion?.evento_id
          || selectedFuncion?.evento
          || selectedFuncion?.eventoId;

        const abonoFunciones = Array.isArray(funciones)
          ? funciones.filter((f) => {
              const funcionEventId = f.evento_id || f.evento || f.eventoId;
              return currentEventId ? funcionEventId === currentEventId : true;
            })
          : [];

        const targetFunciones = abonoFunciones.length > 0 ? abonoFunciones : funciones;

        const items = targetFunciones.map(f => ({
          _id: seat._id,
          nombre: seat.nombre,
          nombreMesa: table.nombre,
          zona: zonaObj?.nombre || seat.zona,
          precio: finalPrice,
          tipoPrecio,
          descuentoNombre,
          funcionId: f.id || f._id,
          funcionFecha: f.fechaCelebracion,
          abonoGroup: groupId,
        }));
        setCarrito([...carrito, ...items]);
      } else {
        const newSeat = {
          _id: seat._id,
          nombre: seat.nombre,
          nombreMesa: table.nombre,
          zona: zonaObj?.nombre || seat.zona,
          precio: finalPrice,
          tipoPrecio,
          descuentoNombre,
          funcionId: currentFuncIdNum,
          funcionFecha: selectedFuncion?.fechaCelebracion,
        };
        
        setCarrito([...carrito, newSeat]);
        console.log('Asiento agregado exitosamente. Carrito actual:', [...carrito, newSeat].length, 'elementos');
        
        // Trigger animation
        handleSeatAnimation(newSeat);
      }
    }
  };

  const handleSelectCompleteTable = (table) => {
    // Cliente opcional - se puede seleccionar después
    // if (!selectedClient) {
    //   message.info('Seleccione un cliente antes de agregar asientos');
    //   return;
    // }

    const currentFuncId = selectedFuncion?.id || selectedFuncion?._id;
    const availableZonas = zonas.map(z => z.id || z._id);
    const availableSeats = table.sillas.filter(silla => {
      const seatZonaId = typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
      const isAvailable = availableZonas?.includes(seatZonaId) || !availableZonas;
      const isAbono = abonoMode && abonoSeats.includes(silla._id);
      const abonoRestriction = abonoMode && abonoSeats.length > 0 ? isAbono : true;
      return silla.estado === 'disponible' && isAvailable && abonoRestriction;
    });

    if (availableSeats.length === 0) {
      message.warning('No hay asientos disponibles en esta mesa');
      return;
    }

    const seatsToAdd = [];
    availableSeats.forEach(seat => {
      const zonaId = seat.zona;
      const zonaObj = Array.isArray(zonas) ? zonas.find(z => (z.id || z._id) === zonaId) : null;
      
      // Determine pricing from the selected plantilla
      const detalle = Array.isArray(detallesPlantilla) ? detallesPlantilla.find(d => {
        const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
        return id === zonaId;
      }) : null;
      
      if (!detalle) {
        message.error(`Zona ${zonaObj?.nombre || zonaId} sin precio configurado`);
        return;
      }

      const basePrice = detalle.precio || 0;
      let finalPrice = basePrice;
      let tipoPrecio = 'normal';
      let descuentoNombre = '';

      if (appliedDiscount?.detalles) {
        const d = Array.isArray(appliedDiscount.detalles) ? appliedDiscount.detalles.find(dt => {
          const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
          return id === zonaId;
        }) : null;
        if (d) {
          if (d.tipo === 'porcentaje') {
            finalPrice = Math.max(0, basePrice - (basePrice * d.valor) / 100);
          } else {
            finalPrice = Math.max(0, basePrice - d.valor);
          }
          tipoPrecio = 'descuento';
          descuentoNombre = appliedDiscount.nombreCodigo;
        }
      }

      seatsToAdd.push({
        _id: seat._id,
        nombre: seat.nombre,
        nombreMesa: table.nombre,
        zona: zonaObj?.nombre || seat.zona,
        precio: finalPrice,
        tipoPrecio,
        descuentoNombre,
        funcionId: currentFuncId,
        funcionFecha: selectedFuncion?.fechaCelebracion,
      });
    });

    setCarrito([...carrito, ...seatsToAdd]);
    message.success(`${seatsToAdd.length} asientos de la mesa "${table.nombre}" agregados al carrito`);
  };

  return {
    handleSeatClick,
    handleSelectCompleteTable
  };
}; 