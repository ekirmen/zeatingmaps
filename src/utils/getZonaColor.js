// Función para generar colores únicos para las zonas del mapa
const zonaColors = [
  '#4CAF50', // Verde
  '#2196F3', // Azul
  '#FF9800', // Naranja
  '#9C27B0', // Púrpura
  '#F44336', // Rojo
  '#00BCD4', // Cian
  '#FFEB3B', // Amarillo
  '#795548', // Marrón
  '#607D8B', // Azul gris
  '#E91E63', // Rosa
  '#3F51B5', // Índigo
  '#009688', // Verde azulado
];

export const getZonaColor = (index = 0) => {
  const idx = Number.isInteger(index) ? index : 0;
  return zonaColors[idx % zonaColors.length];
};

export default getZonaColor;
