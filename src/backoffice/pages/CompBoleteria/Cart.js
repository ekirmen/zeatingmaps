import React, { useMemo, useCallback, useState } from 'react';
import { Button, message, Dropdown, Menu, Modal, Card, Avatar } from 'antd';
import { AiOutlineClose, AiOutlineMore } from 'react-icons/ai';
import { createOrUpdateSeat, unlockSeat as updateSeatStatusInDB } from '../../services/supabaseSeats';
import { useSeatLockStore } from '../../../components/seatLockStore';
import { supabase } from '../../../supabaseClient';
import downloadTicket from '../../../utils/downloadTicket';

const Cart = ({
  carrito = [],
  setCarrito,
  onPaymentClick,
  setSelectedClient,
  selectedClient,
  selectedAffiliate,
  onSeatsUpdated,
  children,
}) => {
  // Ensure carrito is always an array to avoid runtime errors
  const safeCarrito = Array.isArray(carrito) ? carrito : [];
  const addRealtimeLock = useSeatLockStore(state => state.lockSeat);
  const removeRealtimeLock = useSeatLockStore(state => state.unlockSeat);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const subtotal = useMemo(
    () => safeCarrito.reduce((sum, item) => sum + (item.precio || 0), 0),
    [safeCarrito]
  );

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
    const seatsToBlock = safeCarrito.filter(i => i.isBlocked);

    try {
      if (seatsToBlock.length) {
        // Los asientos ya están bloqueados en tiempo real, solo actualizar en BD
        await Promise.all(
          seatsToBlock.map(seat => 
            createOrUpdateSeat(seat._id, { estado: 'bloqueado' })
          )
        );
        message.success('Asientos bloqueados correctamente');
      }
    } catch (error) {
      console.error('Error blocking seats:', error);
      message.error('Error al bloquear asientos');
    }
  }, [safeCarrito]);

  const handleDownloadAllTickets = useCallback(async () => {
    if (!safeCarrito.length) return;
    
    setDownloadingAll(true);
    try {
      const locators = [...new Set(safeCarrito.map(item => item.locator).filter(Boolean))];
      
      for (const locator of locators) {
        await downloadTicket(locator);
      }
      
      message.success('Tickets descargados correctamente');
    } catch (error) {
      console.error('Error downloading tickets:', error);
      message.error('Error al descargar tickets');
    } finally {
      setDownloadingAll(false);
    }
  }, [safeCarrito]);

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
        <h3 className="text-lg font-semibold">Carrito de Compras</h3>
        <div className="flex items-center gap-2">
          {safeCarrito.length > 0 && (
            <Dropdown overlay={menu} trigger={["click"]} visible={menuVisible} onVisibleChange={setMenuVisible} placement="bottomRight">
              <button className="text-gray-500 hover:text-gray-800" title="Opciones">
                <AiOutlineMore size={20} />
              </button>
            </Dropdown>
          )}
          {safeCarrito.length > 0 && (
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
              
              return (
                <Card key={groupKey} size="small" className="mb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.zona} - ${item.precio.toFixed(2)}
                      </div>
                      {item.tipoPrecio === 'descuento' && (
                        <div className="text-xs text-green-600">
                          Descuento: {item.descuentoNombre}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Cantidad: {item.cantidad}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.asientos.map(seat => {
                          const seatName = seat.nombre || seat.nombreMesa || 'Sin nombre';
                          const mesaName = seat.nombreMesa || seat.mesa_nombre || '';
                          return (
                            <div key={seat._id} className="text-xs">
                              {mesaName ? `${mesaName} - ${seatName}` : seatName}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSeat(groupKey)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      {safeCarrito.length > 0 && (
        <div className="mt-auto border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {selectedAffiliate && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Comisión ({selectedAffiliate.percentage}%):</span>
                <span>-${(subtotal * (selectedAffiliate.percentage / 100)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <Button
            type="primary"
            block
            className="mt-4"
            onClick={onPaymentClick}
            disabled={!selectedClient}
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
