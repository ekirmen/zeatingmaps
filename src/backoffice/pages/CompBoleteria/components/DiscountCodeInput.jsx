import React from 'react';

const DiscountCodeInput = ({ 
  discountCode, 
  setDiscountCode, 
  handleApplyDiscount, 
  appliedDiscount 
}) => {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        className="border p-1 rounded flex-1"
        placeholder="Código de descuento"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
      />
      <button
        type="button"
        onClick={handleApplyDiscount}
        className="px-3 py-1 bg-green-600 text-white rounded"
      >
        Aplicar
      </button>
      {appliedDiscount && (
        <span className="text-green-700 text-sm">{appliedDiscount.nombreCodigo}</span>
      )}
    </div>
  );
};

export default DiscountCodeInput; 
