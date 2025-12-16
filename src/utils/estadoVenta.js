export const ESTADO_VENTA = {
  'a-la-venta': {
    label: 'A la venta',
    store: { icon: '✔', message: 'Entradas disponibles' },
    boleteria: { icon: '✔', message: 'Venta habilitada' }
  },
  'solo-taquilla': {
    label: 'Solo en taquilla',
    store: { icon: '✖', message: 'Compra solo en taquilla' },
    boleteria: { icon: '✔', message: 'Venta en boletería' }
  },
  'agotado': {
    label: 'Agotado',
    store: { icon: '✖', message: 'Entradas agotadas' },
    boleteria: { icon: '✔', message: 'Permite operaciones internas' }
  },
  'proximamente': {
    label: 'Próximamente',
    store: { icon: '📅', message: 'Pronto a la venta' },
    boleteria: { icon: '✔', message: 'Venta interna disponible' }
  },
  'proximamente-countdown': {
    label: 'Próximamente con cuenta atrás',
    store: { icon: '📅', message: 'Cuenta atrás activa' },
    boleteria: { icon: '✔', message: 'Venta interna disponible' }
  },
  'estado-personalizado': {
    label: 'Estado personalizado',
    store: { icon: '✖', message: 'No disponible en tienda' },
    boleteria: { icon: '✖', message: 'No disponible' }
  }
};

export function getEstadoVenta(estado) {
  return ESTADO_VENTA[estado] || ESTADO_VENTA['a-la-venta'];
}

export default getEstadoVenta;


