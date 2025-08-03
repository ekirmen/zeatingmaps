import React, { useMemo, useCallback, useState } from 'react';
import { Button, message, Dropdown, Menu, Modal } from 'antd';
import { AiOutlineClose, AiOutlineMore } from 'react-icons/ai';
import { createOrUpdateSeat, unlockSeat as updateSeatStatusInDB } from '../../services/supabaseSeats';
import { useSeatLockStore } from '../../../components/seatLockStore';
import { supabase } from '../../../supabaseClient';
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
      
      // Agrupar por zona y precio
      const existingGroup = acc[key].items.find(group => 
        group.zona === item.zona && 
        group.precio === item.precio &&
        group.tipoPrecio === item.tipoPrecio &&
        group.descuentoNombre === item.descuentoNombre
      );
      
      if (existingGroup) {
        existingGroup.cantidad += 1;
        existingGroup.asientos.push({
          _id: item._id,
          nombre: item.nombre,
          nombreMesa: item.nombreMesa
        });
      } else {
        acc[key].items.push({
          zona: item.zona,
          precio: item.precio,
          tipoPrecio: item.tipoPrecio,
          descuentoNombre: item.descuentoNombre,
          cantidad: 1,
          asientos: [{
            _id: item._id,
            nombre: item.nombre,
            nombreMesa: item.nombreMesa
          }]
        });
      }
      
      return acc;
    }, {});
  }, [carrito]);

  const handleRemoveSeat = useCallback((groupKey) => {
    // groupKey es una combinación de zona, precio y tipo
    const [zona, precio, tipoPrecio, descuentoNombre] = groupKey.split('|');
    
    setCarrito(
      carrito.filter(
        (item) => !(
          item.zona === zona && 
          item.precio === parseFloat(precio) &&
          item.tipoPrecio === tipoPrecio &&
          item.descuentoNombre === descuentoNombre
        )
      )
    );
    message.success('Asientos eliminados del carrito');
  }, [carrito, setCarrito]);

  const clearCart = useCallback(() => {
    setCarrito([]);
    message.success('Carrito limpiado');
  }, [setCarrito]);

  const handleBlockAction = useCallback(async () => {
    const seatsToBlock = carrito.filter(i => i.isBlocked);

    try {
      if (seatsToBlock.length) {
        // Los asientos ya están bloqueados en tiempo real, solo actualizar en BD
        await Promise.all(
          seatsToBlock.map(async (item) => {
            const updates = { 
              bloqueado: true, 
              status: 'bloqueado',
              updated_at: new Date().toISOString()
            };
            await createOrUpdateSeat(item._id, item.funcionId, item.zona, updates);
          })
        );
        
        if (onSeatsUpdated) onSeatsUpdated(seatsToBlock.map(i => i._id), 'bloqueado');
        message.success(`${seatsToBlock.length} asientos bloqueados permanentemente`);
        setCarrito([]);
      } else {
        message.info('No hay asientos para bloquear');
      }
    } catch (error) {
      console.error('Error bloqueando asientos:', error);
      message.error('Error al bloquear los asientos');
    }
  }, [carrito, onSeatsUpdated, setCarrito]);

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
            {group.items.map((item) => {
              const groupKey = `${item.zona}|${item.precio}|${item.tipoPrecio}|${item.descuentoNombre}`;
              const isBlocked = item.isBlocked;
              
              return (
                <div
                  key={groupKey}
                  className={`flex justify-between items-start p-3 rounded shadow-sm text-sm transition-colors ${
                    isBlocked 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {isBlocked && '🔒 '}
                      {item.cantidad} {item.cantidad === 1 ? 'asiento' : 'asientos'} - {item.zona}
                      {isBlocked && ' (BLOQUEADO)'}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {item.asientos.map((asiento, idx) => (
                        <span key={asiento._id} className="inline-block mr-2">
                          {asiento.nombreMesa || asiento.nombre || 'Asiento'}
                        </span>
                      ))}
                    </div>
                    {!isBlocked ? (
                      <div className="text-green-600 font-semibold mt-1">
                        ${formatPrice(item.precio)} {item.cantidad > 1 && `× ${item.cantidad} = $${formatPrice(item.precio * item.cantidad)}`}
                      </div>
                    ) : (
                      <div className="text-red-600 font-semibold mt-1">
                        🔒 Bloqueado permanentemente
                      </div>
                    )}
                    {item.tipoPrecio === 'descuento' && !isBlocked && (
                      <div className="text-orange-600 text-xs mt-1">
                        Descuento: {item.descuentoNombre}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveSeat(groupKey);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-2 p-1"
                    title={isBlocked ? "Eliminar bloqueo" : "Eliminar grupo"}
                  >
                    <AiOutlineClose />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2">
          {!carrito.some(i => i.isBlocked) ? (
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
              danger
              block
              onClick={handleBlockAction}
            >
              🔒 Bloquear Asientos ({carrito.filter(i => i.isBlocked).length})
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default Cart;
