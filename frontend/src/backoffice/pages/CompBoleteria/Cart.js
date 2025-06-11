import React from 'react';
import { Button, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { setSeatsBlocked } from '../../services/apibackoffice';

const Cart = ({ carrito, setCarrito, onPaymentClick, setSelectedClient, children }) => {
  const handleTicketSearch = async (locator) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/locator/${locator}`);
      if (response.ok) {
        const payment = await response.json();

        setCarrito(
          payment.seats.map((seat) => ({
            ...seat,
            precio: seat.precio || 0,
            nombreMesa: seat.mesa?.nombre || '',
            zona: seat.zona?.nombre || '',
          }))
        );

        if (payment.user) {
          const userResponse = await fetch(`http://localhost:5000/api/users/${payment.user}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setSelectedClient(userData);
          }
        }

        message.success('Ticket found and loaded');
      } else {
        message.error('Ticket not found');
      }
    } catch (error) {
      console.error('Error searching ticket:', error);
      message.error('Error searching ticket');
    }
  };

  const handleRemoveSeat = (seatId) => {
    setCarrito(carrito.filter((item) => item._id !== seatId));
    message.success('Seat removed from cart');
  };

  const clearCart = () => {
    setCarrito([]);
    message.success('Cart cleared');
  };

  const handleBlockAction = async () => {
    const seatsToBlock = carrito
      .filter(i => i.action === 'block')
      .map(i => i._id);
    const seatsToUnblock = carrito
      .filter(i => i.action === 'unblock')
      .map(i => i._id);

    try {
      if (seatsToBlock.length) {
        await setSeatsBlocked(seatsToBlock, true);
      }
      if (seatsToUnblock.length) {
        await setSeatsBlocked(seatsToUnblock, false);
      }
      const hasBlock = seatsToBlock.length > 0;
      message.success(hasBlock ? 'Seats blocked' : 'Seats unblocked');
      setCarrito([]);
    } catch (error) {
      console.error('Error updating seats:', error);
      message.error('Error updating seats');
    }
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  return (
    <div className="bg-white shadow-md rounded-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold">Shopping Cart</h3>
        {carrito.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 transition"
            title="Clear cart"
          >
            <CloseOutlined />
          </button>
        )}
      </div>

      {/* Scrollable Item List */}
      <div className="max-h-[430px] overflow-y-auto space-y-2 pr-1">
        {carrito.map((item) => (
          <div
            key={item._id}
            className="flex justify-between items-start bg-gray-100 p-2 rounded shadow-sm text-sm"
          >
            <div className="truncate text-xs leading-tight">
              <strong>Seat:</strong> {item.nombre} &nbsp;|&nbsp;
              <strong>Table:</strong> {item.nombreMesa} &nbsp;|&nbsp;
              <strong>Zone:</strong> {item.zona}
              {item.action === 'block' && (
                <span className="text-red-600"> &nbsp;|&nbsp; Bloquear</span>
              )}
              {item.action === 'unblock' && (
                <span className="text-green-600"> &nbsp;|&nbsp; Desbloquear</span>
              )}
              {!item.action && (
                <>
                  &nbsp;|&nbsp; <strong>Price:</strong> ${formatPrice(item.precio)}
                </>
              )}
            </div>
            <button
              onClick={() => handleRemoveSeat(item._id)}
              className="text-gray-400 hover:text-red-500"
            >
              <CloseOutlined />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      {carrito.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2">
          {!carrito.some(i => i.action) && (
            <>
              <div className="text-right font-semibold text-lg">
                Total: ${formatPrice(carrito.reduce((sum, item) => sum + (item.precio || 0), 0))}
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
