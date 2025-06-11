import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Move formatPrice outside the component to make it reusable
const formatPrice = (price) => {
  return typeof price === 'number' ? price.toFixed(2) : '0.00';
};

const Cart = () => {
  const navigate = useNavigate();
  const [searchLocator, setSearchLocator] = useState('');
  const { cart, clearCart, removeFromCart, setCart } = useCart();

  const handleTicketSearch = async (locator) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/locator/${locator}`);
      if (!response.ok) {
        throw new Error('Ticket not found');
      }
      const ticketData = await response.json();
      setCart(ticketData.seats.map(seat => ({
        ...seat,
        precio: seat.precio || 0,
        nombreMesa: seat.mesa?.nombre || '',
        zona: seat.zona?._id || seat.zona,
        zonaNombre: seat.zona?.nombre || ''
      })));
      toast.success('Ticket found and loaded');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveSeat = (seatId) => {
    removeFromCart(seatId);
    toast.success('Seat removed from cart');
  };

  return (
    <div className="flex flex-col w-[350px] h-screen max-h-screen bg-white shadow-md p-4 border-l border-gray-200">
      <div className="flex flex-col gap-2 mb-4 border-b pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Shopping Cart</h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 transition"
              title="Clear cart"
            >
              <CloseOutlined />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by locator"
            value={searchLocator}
            onChange={(e) => setSearchLocator(e.target.value)}
            onPressEnter={() => handleTicketSearch(searchLocator)}
          />
          <Button
            icon={<SearchOutlined />}
            onClick={() => handleTicketSearch(searchLocator)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {cart.map((item) => (
          <div key={item._id} className="flex justify-between items-center bg-gray-100 p-2 rounded shadow-sm text-sm">
            <div className="flex flex-col gap-1 text-xs leading-tight">
              <span><strong>Seat:</strong> {item.nombre}</span>
              <span><strong>Table/Row:</strong> {item.nombreMesa}</span>
              <span><strong>Zone:</strong> {item.zonaNombre}</span>
              <span><strong>Price:</strong> ${formatPrice(item.precio)}</span>
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

      {cart.length > 0 && (
        <div className="mt-4 border-t pt-4 space-y-2 bg-white">
          <div className="text-right font-semibold text-lg">
            Total: ${formatPrice(cart.reduce((sum, item) => sum + (item.precio || 0), 0))}
          </div>
          <Button type="default" variant="outlined" block onClick={() => navigate('/store/pay')}>
            Proceed to Payment
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
