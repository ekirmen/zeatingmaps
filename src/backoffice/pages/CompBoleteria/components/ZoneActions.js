import { message } from 'antd';

export const createZoneActions = ({
  selectedFuncion,
  carrito,
  setCarrito,
  selectedClient,
  zoneQuantities,
  setZoneQuantities,
  appliedDiscount,
  getPrecioConDescuento
}) => {
  const handleAddZoneToCart = (detalle) => {
    const zonaId = detalle.zonaId || (typeof detalle.zona === 'object' ? detalle.zona._id : detalle.zona);
    const qty = parseInt(zoneQuantities[zonaId], 10);
    if (!qty || qty <= 0) return;

    if (!selectedClient) {
      message.info('Seleccione un cliente antes de agregar asientos');
    }

    const zonaNombre = detalle.zona?.nombre || detalle.zonaId || detalle.zona;
    const precio = getPrecioConDescuento(detalle);
    let tipoPrecio = 'normal';
    let descuentoNombre = '';

    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find(dt => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === zonaId;
      });
      if (d) {
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }

    const funcId = selectedFuncion?.id || selectedFuncion?._id;
    const funcFecha = selectedFuncion?.fechaCelebracion;
    const items = Array.from({ length: qty }).map((_, idx) => ({
      _id: `${zonaId}-${Date.now()}-${idx}`,
      nombre: '',
      nombreMesa: '',
      zona: zonaNombre,
      precio,
      tipoPrecio,
      descuentoNombre,
      funcionId: funcId,
      funcionFecha: funcFecha,
    }));
    setCarrito([...carrito, ...items]);
    setZoneQuantities(prev => ({ ...prev, [zonaId]: '' }));
  };

  const handleAddSingleZoneTicket = (zona) => {
    const zonaId = zona.id || zona._id;
    const zonaNombre = zona.nombre;
    const detalle = detallesPlantilla.find(d => {
      const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
      return id === zonaId;
    });
    if (!detalle) {
      message.error('Zona sin precio configurado');
      return;
    }

    if (!selectedClient) {
      message.info('Seleccione un cliente antes de agregar asientos');
    }

    const precio = getPrecioConDescuento(detalle);
    let tipoPrecio = 'normal';
    let descuentoNombre = '';

    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find(dt => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === zonaId;
      });
      if (d) {
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }

    const funcId = selectedFuncion?.id || selectedFuncion?._id;
    const funcFecha = selectedFuncion?.fechaCelebracion;
    const item = {
      _id: `${zonaId}-${Date.now()}`,
      nombre: '',
      nombreMesa: '',
      zona: zonaNombre,
      precio,
      tipoPrecio,
      descuentoNombre,
      funcionId: funcId,
      funcionFecha: funcFecha,
    };
    setCarrito([...carrito, item]);
  };

  return {
    handleAddZoneToCart,
    handleAddSingleZoneTicket
  };
}; 