const getZonaColor = (zonaId, zonas = []) => {
  const zona = zonas.find(z => (z.id || z._id) === zonaId);
  return zona?.color;
};

export default getZonaColor;
