import React from 'react';

const CartDebug = ({ carrito, setCarrito }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h4 className="font-bold mb-2">DEBUG - Carrito</h4>
      <div className="space-y-1">
        <div>Elementos: {carrito.length}</div>
        <div>IDs: {carrito.map(item => item._id).join(', ')}</div>
        <div>Total: ${carrito.reduce((sum, item) => sum + (item.precio || 0), 0).toFixed(2)}</div>
      </div>
      <button
        onClick={() => {
          console.log('Carrito actual:', carrito);
          setCarrito([]);
        }}
        className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs"
      >
        Limpiar Carrito
      </button>
    </div>
  );
};

export default CartDebug; 