// src/store/pages/Cart.js

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { AiOutlineClose } from 'react-icons/ai';
import { createOrUpdateSeat, unlockSeat as unlockSupabaseSeat } from '../../backoffice/services/supabaseSeats';
import { lockSeat, unlockSeat as unlockFirebaseSeat } from '../../backoffice/services/seatLocks';
import { supabase } from '../../supabaseClient';

const Cart = ({ carrito, setCarrito, onPaymentClick, setSelectedClient, selectedAffiliate, onSeatsUpdated, children }) => {
  const currentCart = carrito || []; 

  const [selectedFunctionId, setSelectedFunctionId] = useState('');

  // Removed unused handleTicketSearch function

  const handleRemoveSeat = (id) => {
    setCarrito(
      currentCart.filter( 
        (item) => (item.abonoGroup || `${item._id}-${item.funcionId || ''}`) !== id
      )
    );
    message.success('Seat removed from cart');
  };

  const clearCart = () => {
    setCarrito([]);
    message.success('Cart cleared');
  };

  const handleBlockAction = async () => {
    const seatsToBlock = currentCart.filter(i => i.action === 'block'); 
    const seatsToUnblock = currentCart.filter(i => i.action === 'unblock'); 

    try {
      if (seatsToBlock.length) {
        await Promise.all(
          seatsToBlock.map(async (item) => {
            const updates = { bloqueado: true, status: 'bloqueado' };
            await createOrUpdateSeat(item._id, item.funcionId, item.zona, updates);
            await lockSeat(item._id, 'bloqueado', item.funcionId);
          })
        );
        if (onSeatsUpdated) onSeatsUpdated(seatsToBlock.map(i => i._id), 'bloqueado');
      }

      if (seatsToUnblock.length) {
        await Promise.all(
          seatsToUnblock.map(async (item) => {
            await unlockSupabaseSeat(item._id, item.funcionId);
            await unlockFirebaseSeat(item._id, item.funcionId);
          })
        );
        if (onSeatsUpdated) onSeatsUpdated(seatsToUnblock.map(i => i._id), 'disponible');
      }

      const hasBlock = seatsToBlock.length > 0;
      message.success(hasBlock ? 'Seats blocked' : 'Seats unblocked');
      setCarrito([]);
    } catch (error) {
      console.error('Error updating seats:', error);
      message.error('Error updating seats');
    }
  };

  const formatPrice = (price) => (typeof price === 'number' ? price.toFixed(2) : '0.00');

  const subtotal = currentCart.reduce((sum, item) => sum + (item.precio || 0), 0); 

  const groupedByFunction = currentCart.reduce((acc, item) => {
    const key = item.funcionId || 'default';
    if (!acc[key]) {
      acc[key] = { fecha: item.funcionFecha, items: [] };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  const commission = selectedAffiliate
    ? (selectedAffiliate.base || 0) + subtotal * ((selectedAffiliate.percentage || 0) / 100)
    : 0;
  const total = subtotal - commission;

  const functionsInCart = Object.entries(groupedByFunction).map(([fid, group]) => ({
    id: fid,
    fecha: group.fecha
  }));

  // Show all items regardless of selectedFunctionId
  const filteredGroup = { items: currentCart };

  return (
    <div className="bg-white shadow-md rounded-md">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold">Shopping Cart</h3>
        {(currentCart.length > 0 || selectedFunctionId) && ( 
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 transition"
            title="Clear cart"
          >
            <AiOutlineClose />
          </button>
        )}
      </div>

      {functionsInCart.length > 1 && (
        <select
          className="mb-4 p-2 border rounded-md w-full max-w-xs"
          value={selectedFunctionId}
          onChange={(e) => setSelectedFunctionId(e.target.value)}
        >
          <option value="">Selecciona una función</option>
          {functionsInCart.map(func => (
            <option key={func.id} value={func.id}>
              {func.fecha ? new Date(func.fecha).toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : func.id}
            </option>
          ))}
        </select>
      )}

      <div className="max-h-[430px] overflow-y-auto space-y-2 pr-1">
      {currentCart.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No seats selected. Please select a function and seats.</div>
      ) : (
        filteredGroup.items.map((item) => (
          <div
            key={item.abonoGroup || (item._id && item.funcionId ? `${item._id}-${item.funcionId}` : `${item.nombre}-${item.nombreMesa}-${item.zona}-${item.precio}-${Math.random()}`)}
            className="flex justify-between items-start bg-gray-100 p-2 rounded shadow-sm text-sm"
          >
            <div className="truncate text-xs leading-tight">
              {item.nombre ? (
                <>
                  <strong>Seat:</strong> {item.nombre} &nbsp;|&nbsp;
                  <strong>Table:</strong> {item.nombreMesa} &nbsp;|&nbsp;
                  <strong>Zone:</strong> {item.zona}
                </>
              ) : (
                <>
                  <strong>Zone Ticket:</strong> {item.zona}
                </>
              )}
              {item.action === 'block' && <span className="text-red-600"> &nbsp;|&nbsp; Bloquear</span>}
              {item.action === 'unblock' && <span className="text-green-600"> &nbsp;|&nbsp; Desbloquear</span>}
              {!item.action && (
                <>
                  &nbsp;|&nbsp; <strong>Price:</strong> ${formatPrice(item.precio || 0)}
                  {item.tipoPrecio === 'descuento' && (
                    <span className="text-green-600"> &nbsp;|&nbsp; {item.descuentoNombre}</span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => handleRemoveSeat(item.abonoGroup || `${item._id}-${item.funcionId || ''}`)}
              className="text-gray-400 hover:text-red-500"
            >
              <AiOutlineClose />
            </button>
          </div>
        ))
      )}
      </div>

      {(currentCart.length > 0 || selectedFunctionId) && ( 
        // FIX: Wrap these two conditional blocks in a single React Fragment
        <> 
          <div className="mt-4 border-t pt-4 space-y-2">
            {!currentCart.some(i => i.action) && ( 
              <>
                {selectedAffiliate && (
                  <div className="text-right text-sm">
                    Com.Ref {selectedAffiliate.user.login}: -${formatPrice(commission)}
                  </div>
                )}
                <div className="text-right font-semibold text-lg">
                  Total: ${formatPrice(total)}
                </div>
                <Button type="default" variant="outlined" block onClick={onPaymentClick}>
                  Proceed to Payment
                </Button>
              </>
            )}
            {currentCart.some(i => i.action) && ( 
              <Button
                type="default"
                danger={currentCart.some(i => i.action === 'block')} 
                block
                onClick={handleBlockAction}
              >
                {currentCart.some(i => i.action === 'block') ? 'Bloquear' : 'Desbloquear'} 
              </Button>
            )}
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
