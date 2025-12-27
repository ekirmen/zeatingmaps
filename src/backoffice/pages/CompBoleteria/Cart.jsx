import React, { useMemo, useCallback, useState } from 'react';
import { Button, message, Dropdown, Menu, Card } from '../../../utils/antdComponents';
import { X, MoreHorizontal } from 'lucide-react';
import downloadTicket from '../../../utils/downloadTicket';

const formatCurrency = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
};

const getNumericPrice = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const Cart = ({
  carrito = [],
  setCarrito,
  onPaymentClick,
  onShowPaymentModal,
  selectedClient,
  selectedAffiliate,
  onShowUserSearch,
  children,
  blockMode = false,
  onApplyLockActions
}) => {
  // Ensure carrito is always an array to avoid runtime errors
  const safeCarrito = Array.isArray(carrito) ? carrito : [];
  const [menuVisible, setMenuVisible] = useState(false);

  const handleRemoveLockItem = useCallback((seatId) => {
    const normalizedId = seatId?.toString();
    setCarrito(
      safeCarrito.filter(item => (item._id || item.sillaId || item.id)?.toString() !== normalizedId)
    );
    message.success('Asiento quitado del modo bloqueo/desbloqueo');
  }, [safeCarrito, setCarrito]);

  const handleApplyLockActions = useCallback(() => {
    if (onApplyLockActions) {
      onApplyLockActions();
    } else {
      message.warning('No se configuró la acción para aplicar bloqueos.');
    }
  }, [onApplyLockActions]);

  const lockActionItems = useMemo(
    () => safeCarrito.filter(item => item.lockAction),
    [safeCarrito]
  );
  const hasLockActions = lockActionItems.length > 0;

  const subtotal = useMemo(() => {
    return safeCarrito.reduce((sum, item) => {
      const price = getNumericPrice(item.precio ?? item.precio_total);
      return sum + price;
    }, 0);
  }, [safeCarrito]);

  const total = useMemo(() => {
    const commission = selectedAffiliate
      ? (selectedAffiliate.base || 0) + subtotal * ((selectedAffiliate.percentage || 0) / 100)
      : 0;
    return subtotal - commission;
  }, [subtotal, selectedAffiliate]);

  const groupedByFunction = useMemo(() => {
    return safeCarrito.reduce((acc, item) => {
      const key = item.funcionId || 'default';
      if (!acc[key]) {
        acc[key] = { fecha: item.funcionFecha, items: [] };
      }

      const precioValue = getNumericPrice(item.precio ?? item.precio_total);

      // Agrupar por zona y precio
      const existingGroup = acc[key].items.find(group =>
        group.zona === item.zona &&
        group.precio === precioValue &&
        group.tipoPrecio === item.tipoPrecio &&
        group.descuentoNombre === item.descuentoNombre
      );

      if (existingGroup) {
        existingGroup.cantidad += 1;
        existingGroup.asientos.push({
          _id: item._id,
          nombre: item.nombre,
          nombreMesa: item.nombreMesa,
          locator: item.locator,
          buyerName: item.buyerName,
          buyerEmail: item.buyerEmail,
          status: item.status
        });
      } else {
        acc[key].items.push({
          zona: item.zona,
          precio: precioValue,
          tipoPrecio: item.tipoPrecio,
          descuentoNombre: item.descuentoNombre,
          cantidad: 1,
          asientos: [{
            _id: item._id,
            nombre: item.nombre,
            nombreMesa: item.nombreMesa,
            locator: item.locator,
            buyerName: item.buyerName,
            buyerEmail: item.buyerEmail,
            status: item.status
          }]
        });
      }

      return acc;
    }, {});
  }, [safeCarrito]);

  const handleRemoveSeat = useCallback((groupKey) => {
    // groupKey es una combinación de zona, precio y tipo
    const [zona, precio, tipoPrecio, descuentoNombre] = groupKey.split('|');

    setCarrito(
      safeCarrito.filter(
        (item) => !(
          item.zona === zona &&
          item.precio === parseFloat(precio) &&
          item.tipoPrecio === tipoPrecio &&
          item.descuentoNombre === descuentoNombre
        )
      )
    );
    message.success('Asientos eliminados del carrito');
  }, [safeCarrito, setCarrito]);

  const clearCart = useCallback(() => {
    setCarrito([]);
    message.success('Carrito limpiado');
  }, [setCarrito]);

  const handleBlockAction = useCallback(async () => {
    if (!safeCarrito.length) {
      message.warning('No hay asientos en el carrito');
      return;
    }

    // Import seat lock store to check status
    const { isSeatLocked } = await import('../../../components/seatLockStore').then(m => m.useSeatLockStore.getState());

    // Check each seat and determine action
    const updatedCarrito = await Promise.all(
      safeCarrito.map(async (item) => {
        const seatId = item._id || item.sillaId || item.id;
        const funcionId = item.funcionId;

        // Check if seat is currently locked
        const isLocked = await isSeatLocked(seatId, funcionId);

        // Set lockAction based on current status
        return {
          ...item,
          lockAction: isLocked ? 'unlock' : 'block'
        };
      })
    );

    setCarrito(updatedCarrito);
    setMenuVisible(false);

    const hasBlocks = updatedCarrito.some(item => item.lockAction === 'block');
    const hasUnlocks = updatedCarrito.some(item => item.lockAction === 'unlock');

    if (hasBlocks && hasUnlocks) {
      message.info('Asientos marcados para bloquear y desbloquear según su estado actual');
    } else if (hasBlocks) {
      message.info('Asientos marcados para bloquear');
    } else {
      message.info('Asientos marcados para desbloquear');
    }
  }, [safeCarrito, setCarrito]);

  const handleDownloadAllTickets = useCallback(async () => {
    if (!safeCarrito.length) return;

    try {
      const locators = [...new Set(safeCarrito.map(item => item.locator).filter(Boolean))];

      for (const locator of locators) {
        await downloadTicket(locator);
      }

      message.success('Tickets descargados correctamente');
    } catch (error) {
      console.error('Error downloading tickets:', error);
      message.error('Error al descargar tickets');
    }
  }, [safeCarrito]);

  const handlePaymentClick = onPaymentClick || onShowPaymentModal;

  const menu = (
    <Menu>
      <Menu.Item key="block" onClick={handleBlockAction}>
        Bloquear Asientos
      </Menu.Item>
      <Menu.Item key="download" onClick={handleDownloadAllTickets}>
        Descargar Todos los Tickets
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h3 className="text-lg font-semibold">Carrito de Compras</h3>
          {safeCarrito.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {safeCarrito.length} elemento{safeCarrito.length !== 1 ? 's' : ''} seleccionado{safeCarrito.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {safeCarrito.length > 0 && !hasLockActions && (
            <Dropdown overlay={menu} trigger={["click"]} visible={menuVisible} onVisibleChange={setMenuVisible} placement="bottomRight">
              <button className="text-gray-500 hover:text-gray-800" title="Opciones">
                <MoreHorizontal size={20} />
              </button>
            </Dropdown>
          )}
          {safeCarrito.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 transition"
              title="Limpiar carrito"
            >
              <X />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 relative">
        {hasLockActions ? (
          lockActionItems.map(item => {
            const actionLabel = item.lockAction === 'block' ? 'Bloquear' : 'Desbloquear';
            const actionColor = item.lockAction === 'block' ? 'text-red-600' : 'text-green-600';
            const seatName = item.nombre || item.sillaId || item._id || 'Asiento';
            const mesaName = item.nombreMesa || item.mesa_nombre || '';
            const seatId = item._id || item.sillaId || item.id;

            return (
              <Card key={`${item.lockAction}-${seatId}`} size="small" className="mb-2 border-dashed border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-1">
                    <div className={`text-xs font-semibold ${actionColor}`}>
                      {actionLabel} - {item.nombreZona || item.zona}
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {mesaName ? `${mesaName} - ${seatName}` : seatName}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Estado actual: {(item.estadoActual || 'desconocido').toString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveLockItem(seatId)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    —
                  </button>
                </div>
              </Card>
            );
          })
        ) : (
          <>
            {/* Indicador de scroll cuando hay muchos elementos */}
            {safeCarrito.length > 10 && (
              <div className="absolute top-0 right-2 z-10 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {safeCarrito.length} asientos
              </div>
            )}
            {Object.entries(groupedByFunction).map(([fid, group], idx) => {
              // Get function name from first item in group
              const firstItem = safeCarrito.find(item => (item.funcionId || 'default') === fid);
              const funcionNombre = firstItem?.funcionNombre || '';

              return (
                <div key={fid} className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🎭</span>
                      <div className="flex-1">
                        {funcionNombre && (
                          <div className="font-bold text-gray-800 mb-0.5">
                            {funcionNombre}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-600">
                          {group.fecha ? new Date(group.fecha).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Fecha no disponible'}
                        </div>
                      </div>
                      <div className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {group.items.reduce((sum, item) => sum + item.cantidad, 0)} asientos
                      </div>
                    </div>
                  </div>>
                  {group.items.map((item) => {
                    const groupKey = `${item.zona}|${item.precio}|${item.tipoPrecio}|${item.descuentoNombre}`;

                    return (
                      <Card key={groupKey} size="small" className="mb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              <span className="text-blue-600">ðŸ“</span>
                              <span>{item.zona}</span>
                              <span className="text-gray-400">|</span>
                              <span className="font-bold text-green-600">${formatCurrency(item.precio)}</span>
                            </div>
                            {item.tipoPrecio === 'descuento' && (
                              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <span>ðŸŽ‰</span>
                                <span>Descuento: {item.descuentoNombre}</span>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <span>ðŸ“Š</span>
                              <span>Cantidad: {item.cantidad}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {item.asientos.length <= 5 ? (
                                // Mostrar todos los asientos si son 5 o menos
                                item.asientos.map(seat => {
                                  const seatName = seat.nombre || seat.sillaId || 'Asiento';
                                  const mesaName = seat.nombreMesa || seat.mesa_nombre || seat.nombreMesa || '';

                                  // Mostrar información más clara del boleto
                                  if (mesaName) {
                                    return (
                                      <div key={seat._id} className="text-xs flex items-center gap-1">
                                        <span className="text-blue-600">ðŸŽ«</span>
                                        <span className="font-medium">{mesaName} - {seatName}</span>
                                        {(seat.locator || seat.buyerName || seat.buyerEmail) && (
                                          <span className="text-[11px] text-gray-500">
                                            {seat.locator && <span className="mr-1">ðŸ”– {seat.locator}</span>}
                                            {seat.buyerName && <span className="mr-1">ðŸ‘¤ {seat.buyerName}</span>}
                                            {seat.buyerEmail && <span className="text-gray-400">({seat.buyerEmail})</span>}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div key={seat._id} className="text-xs flex items-center gap-1">
                                        <span className="text-green-600">ðŸŽ«</span>
                                        <span className="font-medium">{seatName}</span>
                                        {(seat.locator || seat.buyerName || seat.buyerEmail) && (
                                          <span className="text-[11px] text-gray-500">
                                            {seat.locator && <span className="mr-1">ðŸ”– {seat.locator}</span>}
                                            {seat.buyerName && <span className="mr-1">ðŸ‘¤ {seat.buyerName}</span>}
                                            {seat.buyerEmail && <span className="text-gray-400">({seat.buyerEmail})</span>}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                })
                              ) : (
                                // Mostrar resumen si hay más de 5 asientos
                                <div className="text-xs flex items-center gap-1">
                                  <span className="text-green-600">ðŸŽ«</span>
                                  <span className="font-medium">
                                    {item.asientos.slice(0, 3).map(seat => {
                                      const seatName = seat.nombre || seat.sillaId || 'Asiento';
                                      const mesaName = seat.nombreMesa || seat.mesa_nombre || seat.nombreMesa || '';
                                      return mesaName ? `${mesaName}-${seatName}` : seatName;
                                    }).join(', ')}
                                    {item.asientos.length > 3 && ` y ${item.asientos.length - 3} más...`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSeat(groupKey)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            —
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
          </>
        )}
      </div>

      {safeCarrito.length > 0 && hasLockActions && (
        <div className="mt-auto border-t pt-3 space-y-2">
          <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-100 rounded p-2">
            {blockMode
              ? 'Modo bloqueo/desbloqueo activo. Aplica los cambios cuando termines de seleccionar.'
              : 'Estos asientos se aplicarán como bloqueo/desbloqueo al confirmar.'}
          </div>
          <Button type="primary" block className="h-12 text-base font-semibold" onClick={handleApplyLockActions}>
            Aplicar bloqueo/desbloqueo
          </Button>
        </div>
      )}

      {safeCarrito.length > 0 && !hasLockActions && (
        <div className="mt-auto border-t pt-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>ðŸ›’</span>
                <span>Subtotal:</span>
              </span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {selectedAffiliate && (
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <span>ðŸ’¸</span>
                  <span>Comisión ({selectedAffiliate.percentage}%):</span>
                </span>
                <span className="text-red-600">-${(subtotal * (selectedAffiliate.percentage / 100)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-3 text-lg">
              <span className="flex items-center gap-2">
                <span>ðŸ’°</span>
                <span>Total:</span>
              </span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="primary"
            block
            className="mt-4 h-12 text-base font-semibold"
            onClick={selectedClient ? handlePaymentClick : onShowUserSearch}
            disabled={selectedClient ? !handlePaymentClick : false}
            icon={selectedClient ? <span>ðŸ’ó</span> : <span>ðŸ‘¤</span>}
          >
            {selectedClient ? 'Procesar Pago' : 'Seleccionar Cliente'}
          </Button>
        </div>
      )}

      {children}
    </div>
  );
};

export default Cart;


