import React from 'react';
import { Button, message } from 'antd';
import { AiOutlineClose } from 'react-icons/ai';
import { updateSeat } from '../../services/supabaseSeats';
import { supabase } from '../../services/supabaseClient';

const Cart = ({ carrito, setCarrito, onPaymentClick, setSelectedClient, selectedAffiliate, children }) => {
  const handleTicketSearch = async (locator) => {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*, user:profiles(*), seats, funciones(fecha)')
        .eq('locator', locator)
        .single();

      if (error || !payment) {
        message.error('Ticket not found');
        return;
      }

      setCarrito(
        payment.seats.map((seat) => ({
          ...seat,
          precio: seat.precio || 0,
          nombreMesa: seat.mesa?.nombre || '',
          zona: seat.zona?.nombre || '',
          funcionFecha: payment.funciones?.fecha || null,
          funcionId: payment.funcion,
        }))
      );

      if (payment.user) {
        setSelectedClient(payment.user);
      }

      message.success('Ticket found and loaded');
    } catch (error) {
      console.error('Error searching ticket:', error);
      message.error('Error searching ticket');
    }
  };

  const handleRemoveSeat = (id) => {
    setCarrito(
      carrito.filter(
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
    const seatsToBlock = carrito.filter(i => i.action === 'block').map(i => i._id);
    const seatsToUnblock = carrito.filter(i => i.action === 'unblock').map(i => i._id);

    try {
      if (seatsToBlock.length) {
        await Promise.all(
          seatsToBlock.map(id =>
            updateSeat(id, { bloqueado: true, estado: 'bloqueado' })
          )
        );
      }
      if (seatsToUnblock.length) {
        await Promise.all(
          seatsToUnblock.map(id =>
            updateSeat(id, { bloqueado: false, estado: 'disponible' })
          )
        );
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

  const subtotal = carrito.reduce((sum, item) => sum + (item.precio || 0), 0);

  const groupedByFunction = carrito.reduce((acc, item) => {
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

  return (
    <div className="bg-white shadow-md rounded-md">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold">Shopping Cart</h3>
        {carrito.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 transition"
            title="Clear cart"
          >
            <AiOutlineClose  />
          </button>
        )}
      </div>

      <div className="max-h-[430px] overflow-y-auto space-y-2 pr-1">
        {Object.entries(groupedByFunction).map(([fid, group]) => (
          <div key={fid} className="space-y-1">
            <div className="text-xs font-medium">
              {group.fecha ? new Date(group.fecha).toLocaleString() : ''}
            </div>
            {group.items.map((item) => (
              <div
                key={item.abonoGroup || `${item._id}-${item.funcionId || ''}`}
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
                  onClick={() => handleRemoveSeat(`${item._id}-${item.funcionId || ''}`)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <AiOutlineClose  />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2">
          {!carrito.some(i => i.action) && (
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
          {carrito.some(i => i.action) && (
            <Button
              type="default"
              danger={carrito.some(i => i.action === 'block')}
              block
              onClick={handleBlockAction}
            >
              {carrito.some(i => i.action === 'block') ? 'Bloquear' : 'Desbloquear'}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default Cart;
