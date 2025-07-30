import React, { useMemo, useCallback, useState } from 'react';
import { Button, message, Dropdown, Menu, Modal } from 'antd';
import { AiOutlineClose, AiOutlineMore } from 'react-icons/ai';
import { createOrUpdateSeat, unlockSeat as updateSeatStatusInDB } from '../../services/supabaseSeats';
import { useSeatLockStore } from '../../../components/seatLockStore';
import { supabase } from '../../services/supabaseClient';
import downloadTicket from '../../../utils/downloadTicket';

const Cart = ({
  carrito,
  setCarrito,
  onPaymentClick,
  setSelectedClient,
  selectedAffiliate,
  onSeatsUpdated,
  children,
}) => {
  const addRealtimeLock = useSeatLockStore(state => state.lockSeat);
  const removeRealtimeLock = useSeatLockStore(state => state.unlockSeat);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const subtotal = useMemo(
    () => carrito.reduce((sum, item) => sum + (item.precio || 0), 0),
    [carrito]
  );

  const total = useMemo(() => {
    const commission = selectedAffiliate
      ? (selectedAffiliate.base || 0) + subtotal * ((selectedAffiliate.percentage || 0) / 100)
      : 0;
    return subtotal - commission;
  }, [subtotal, selectedAffiliate]);

  const groupedByFunction = useMemo(() => {
    return carrito.reduce((acc, item) => {
      const key = item.funcionId || 'default';
      if (!acc[key]) {
        acc[key] = { fecha: item.funcionFecha, items: [] };
      }
      acc[key].items.push(item);
      return acc;
    }, {});
  }, [carrito]);

  const handleRemoveSeat = useCallback((id) => {
    setCarrito(
      carrito.filter(
        (item) => (item.abonoGroup || `${item._id}-${item.funcionId || ''}`) !== id
      )
    );
    message.success('Asiento eliminado del carrito');
  }, [carrito, setCarrito]);

  const clearCart = useCallback(() => {
    setCarrito([]);
    message.success('Carrito limpiado');
  }, [setCarrito]);

  const handleBlockAction = useCallback(async () => {
    const seatsToBlock = carrito.filter(i => i.action === 'block');
    const seatsToUnblock = carrito.filter(i => i.action === 'unblock');

    try {
      if (seatsToBlock.length) {
        await Promise.all(
          seatsToBlock.map(async (item) => {
            const updates = { bloqueado: true, status: 'bloqueado' };
            await createOrUpdateSeat(item._id, item.funcionId, item.zona, updates);
            await addRealtimeLock(item._id);
          })
        );
        if (onSeatsUpdated) onSeatsUpdated(seatsToBlock.map(i => i._id), 'bloqueado');
      }

      if (seatsToUnblock.length) {
        await Promise.all(
          seatsToUnblock.map(async (item) => {
            await updateSeatStatusInDB(item._id, item.funcionId);
            await removeRealtimeLock(item._id);
          })
        );
        if (onSeatsUpdated) onSeatsUpdated(seatsToUnblock.map(i => i._id), 'disponible');
      }

      const hasBlock = seatsToBlock.length > 0;
      message.success(hasBlock ? 'Asientos bloqueados' : 'Asientos desbloqueados');
      setCarrito([]);
    } catch (error) {
      console.error('Error actualizando asientos:', error);
      message.error('Error al actualizar los asientos');
    }
  }, [carrito, addRealtimeLock, removeRealtimeLock, onSeatsUpdated, setCarrito]);

  const formatPrice = useCallback((price) => (
    typeof price === 'number' ? price.toFixed(2) : '0.00'
  ), []);

  // --- MENU DE DESCARGA ---
  const handleDownloadSelected = async () => {
    if (!selectedSeat) {
      message.info('Selecciona un asiento para descargar su ticket');
      return;
    }
    await downloadTicket(selectedSeat.locator);
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      // Descargar todos los tickets y combinarlos en un solo PDF
      // Por simplicidad, descarga uno a uno (puedes mejorar con merge real de PDFs)
      for (const item of carrito) {
        await downloadTicket(item.locator);
      }
      message.success('Todos los tickets descargados');
    } catch (err) {
      message.error('Error al descargar los tickets');
    }
    setDownloadingAll(false);
  };

  const menu = (
    <Menu onClick={({ key }) => {
      setMenuVisible(false);
      if (key === 'downloadSelected') handleDownloadSelected();
      if (key === 'downloadAll') handleDownloadAll();
    }}>
      <Menu.Item key="downloadSelected" disabled={!selectedSeat}>
        Descargar ticket seleccionado
      </Menu.Item>
      <Menu.Item key="downloadAll" disabled={carrito.length === 0 || downloadingAll}>
        Descargar todos los tickets
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="bg-white shadow-md rounded-md p-4">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold">Carrito de Compras</h3>
        <div className="flex items-center gap-2">
          {carrito.length > 0 && (
            <Dropdown overlay={menu} trigger={["click"]} visible={menuVisible} onVisibleChange={setMenuVisible} placement="bottomRight">
              <button className="text-gray-500 hover:text-gray-800" title="Opciones">
                <AiOutlineMore size={20} />
              </button>
            </Dropdown>
          )}
          {carrito.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 transition"
              title="Limpiar carrito"
            >
              <AiOutlineClose />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[430px] overflow-y-auto space-y-2 pr-1">
        {Object.entries(groupedByFunction).map(([fid, group], idx) => (
          <div key={fid} className="space-y-1">
            <div className="text-xs font-medium text-gray-600">
              {`Función ${idx + 1}: `}
              {group.fecha ? new Date(group.fecha).toLocaleString() : ''}
            </div>
            {group.items.map((item) => (
              <div
                key={item.abonoGroup || `${item._id}-${item.funcionId || ''}`}
                className={`flex justify-between items-start bg-gray-50 p-2 rounded shadow-sm text-sm ${selectedSeat && selectedSeat._id === item._id ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setSelectedSeat(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="truncate text-xs leading-tight">
                  {item.nombreMesa || item.nombre || 'Asiento'}
                  <div className="text-gray-500">{item.zona}</div>
                  <div>${formatPrice(item.precio)}</div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleRemoveSeat(item.abonoGroup || `${item._id}-${item.funcionId || ''}`);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <AiOutlineClose />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2">
          {!carrito.some(i => i.action) ? (
            <>
              {selectedAffiliate && (
                <div className="text-right text-sm">
                  Com. Ref {selectedAffiliate.user.login}: -${formatPrice(total - subtotal)}
                </div>
              )}
              <div className="text-right font-semibold text-lg">
                Total: ${formatPrice(total)}
              </div>
              <Button type="primary" block onClick={onPaymentClick}>
                Proceder al Pago
              </Button>
            </>
          ) : (
            <Button
              type="default"
              danger={carrito.some(i => i.action === 'block')}
              block
              onClick={handleBlockAction}
            >
              {carrito.some(i => i.action === 'block')
                ? 'Confirmar Bloqueo'
                : 'Confirmar Desbloqueo'}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default Cart;
