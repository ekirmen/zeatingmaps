import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { AiOutlineClose } from 'react-icons/ai';
import { useCartStore } from '../cartStore';

// Temporizador para expiración del carrito
const Timer = ({ expiresAt }) => {
    const [remainingTime, setRemainingTime] = useState(expiresAt ? expiresAt - Date.now() : 0);

    useEffect(() => {
        if (!expiresAt) {
            setRemainingTime(0);
            return;
        }

        const interval = setInterval(() => {
            const timeLeft = expiresAt - Date.now();
            setRemainingTime(timeLeft > 0 ? timeLeft : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt || remainingTime <= 0) return null;

    const minutes = Math.floor((remainingTime / 1000) / 60);
    const seconds = Math.floor((remainingTime / 1000) % 60);

    return (
        <div className="text-right text-sm text-red-500 font-mono">
            Expira en: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
};

const Cart = () => {
    const navigate = useNavigate();
    const { cart, cartExpiration, toggleSeat, clearCart } = useCartStore();

    const formatPrice = (price) =>
        typeof price === 'number' ? price.toFixed(2) : '0.00';

    const subtotal = cart.reduce((sum, item) => sum + (item.precio || 0), 0);

    return (
        <div className="bg-white shadow-md rounded-md p-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-semibold">Shopping Cart</h3>
                <Timer expiresAt={cartExpiration} />
            </div>

            <div className="max-h-[430px] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                        No seats selected.
                    </div>
                ) : (
                    cart.map((item) => (
                        <div
                            key={item.sillaId}
                            className="flex justify-between items-center bg-gray-100 p-2 rounded shadow-sm text-sm"
                        >
                            <div className="flex-grow">
                                <div className="truncate text-xs leading-tight">
                                    <strong>Seat:</strong> {item.nombre} &nbsp;|&nbsp;
                                    <strong>Zone:</strong> {item.nombreZona || 'N/A'}
                                </div>
                                <div className="text-xs">
                                    <strong>Price:</strong> ${formatPrice(item.precio || 0)}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSeat(item)}
                                className="text-gray-400 hover:text-red-500 ml-2"
                                title="Remove seat"
                            >
                                <AiOutlineClose />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {cart.length > 0 && (
                <div className="mt-4 border-t pt-4 space-y-2">
                    <div className="text-right font-semibold text-lg">
                        Total: ${formatPrice(subtotal)}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            type="primary"
                            block
                            onClick={() => {
                                navigate('/store/payment', {
                                    state: {
                                        carrito: cart,
                                        funcionId: cart[0]?.functionId || cart[0]?.funcionId || null,
                                    },
                                });
                            }}
                        >
                            Proceed to Payment
                        </Button>

                        <Button
                            danger
                            block
                            onClick={clearCart}
                            title="Vaciar carrito"
                        >
                            Vaciar carrito
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
