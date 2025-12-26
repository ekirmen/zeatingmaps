import React from 'react';
import { message } from '../../../../utils/antdComponents';

const ModeControls = ({ 
  blockMode, 
  setBlockMode, 
  abonoMode, 
  setAbonoMode, 
  setCarrito, 
  carrito 
}) => {
  const handleBlockModeChange = (e) => {
    setBlockMode(e.target.checked);
    if (e.target.checked) {
      message.info('Modo bloqueo activado: Selecciona asientos para bloquearlos');
    } else {
      // Limpiar asientos bloqueados del carrito al desactivar
      setCarrito(prev => prev.filter(item => !item.isBlocked));
      message.info('Modo bloqueo desactivado');
    }
  };

  return (
    <div className="flex gap-2 items-center mb-4">
      <label className="text-sm flex items-center gap-1">
        <input
          type="checkbox"
          checked={blockMode}
          onChange={handleBlockModeChange}
        />
        ðŸ”’ Bloquear asientos
      </label>
      <label className="ml-4 text-sm flex items-center gap-1">
        <input
          type="checkbox"
          checked={abonoMode}
          onChange={e => setAbonoMode(e.target.checked)}
        />
        Modo abono
      </label>
    </div>
  );
};

export default ModeControls; 

