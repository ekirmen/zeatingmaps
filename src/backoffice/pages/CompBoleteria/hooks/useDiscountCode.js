import { useState } from 'react';
import { message } from '../../../../utils/antdComponents';
import { fetchDescuentoPorCodigo } from '../../../../store/services/apistore';

const useDiscountCode = () => {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      const data = await fetchDescuentoPorCodigo(encodeURIComponent(discountCode.trim()));
      const now = Date.now();
      if (data.fechaInicio && new Date(data.fechaInicio).getTime() > now) {
        throw new Error('Descuento no disponible aún');
      }
      if (data.fechaFinal && new Date(data.fechaFinal).getTime() < now) {
        throw new Error('Descuento expirado');
      }
      setAppliedDiscount(data);
      message.success('Descuento aplicado');
    } catch (err) {
      setAppliedDiscount(null);
      message.error(err.message || 'Código inválido');
    }
  };

  const getPrecioConDescuento = (detalle) => {
    let price = detalle.precio || 0;
    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find((dt) => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === detalle.zonaId || id === detalle.zona?._id;
      });
      if (d) {
        if (d.tipo === 'porcentaje') {
          price = Math.max(0, price - (price * d.valor) / 100);
        } else {
          price = Math.max(0, price - d.valor);
        }
      }
    }
    return price;
  };

  return {
    discountCode,
    setDiscountCode,
    appliedDiscount,
    setAppliedDiscount,
    handleApplyDiscount,
    getPrecioConDescuento
  };
};

export default useDiscountCode;
