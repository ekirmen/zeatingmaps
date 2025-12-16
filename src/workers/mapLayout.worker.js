/* eslint-disable no-restricted-globals */
// Web Worker para procesar layout de mapas/asientos fuera del main thread
self.addEventListener('message', (e) => {
  const { mapElements = [], stageSize = {} } = e.data || {};

  try {
    const processed = mapElements.map(elemento => {
      if (!elemento) return elemento;

      if (elemento.type === 'mesa' && Array.isArray(elemento.sillas)) {
        const mesa = { ...elemento };
        const cx = (mesa.posicion?.x || 0);
        const cy = (mesa.posicion?.y || 0);
        const radius = mesa.radio || 50;
        const total = mesa.sillas.length;
        mesa.sillas = mesa.sillas.map((silla, idx) => {
          const angle = (idx * 360) / total;
          const rad = (angle * Math.PI) / 180;
          const x = cx + Math.cos(rad) * radius;
          const y = cy + Math.sin(rad) * radius;
          return { ...silla, _computed: { x, y, angle } };
        });
        return mesa;
      }

      // For zones/fila/grada, we can compute bounding boxes or keep as-is
      if (elemento.type === 'zona' || elemento.type === 'fila' || elemento.type === 'grada') {
        return { ...elemento, _computed: { x: elemento.posicion?.x || 0, y: elemento.posicion?.y || 0 } };
      }

      return elemento;
    });

    self.postMessage({ success: true, processed });
  } catch (err) {
    self.postMessage({ success: false, error: err?.message || String(err) });
  }
});
