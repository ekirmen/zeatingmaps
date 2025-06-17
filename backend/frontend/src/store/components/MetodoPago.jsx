// src/components/MetodoPago.jsx
import React from 'react';

const MetodoPago = ({ metodosDisponibles, onSelect, selected }) => {
  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2">
        {metodosDisponibles.includes("stripe") && (
          <button 
            className={`${selected === 'stripe' ? 'bg-purple-700' : 'bg-purple-600'} text-white px-4 py-2 rounded`}
            onClick={() => onSelect('stripe')}
            aria-pressed={selected === 'stripe'}
          >
            Pagar con Stripe
          </button>
        )}
        {metodosDisponibles.includes("paypal") && (
          <button 
            className={`${selected === 'paypal' ? 'bg-yellow-600' : 'bg-yellow-500'} text-white px-4 py-2 rounded`}
            onClick={() => onSelect('paypal')}
            aria-pressed={selected === 'paypal'}
          >
            Pagar con PayPal
          </button>
        )}
        {metodosDisponibles.includes("transferencia") && (
          <button 
            className={`${selected === 'transferencia' ? 'bg-green-700' : 'bg-green-600'} text-white px-4 py-2 rounded`}
            onClick={() => onSelect('transferencia')}
            aria-pressed={selected === 'transferencia'}
          >
            Transferencia Bancaria
          </button>
        )}
      </div>
    </div>
  );
};

export default MetodoPago;
