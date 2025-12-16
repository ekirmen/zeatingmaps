/**
 * Web Worker para cálculos pesados relacionados con asientos
 * - Cálculo de distancias entre asientos
 * - Procesamiento de datos de asientos
 * - Cálculo de zonas y precios
 * - Filtrado y ordenamiento de grandes listas de asientos
 */

// Manejar mensajes del hilo principal
self.onmessage = function (e) {
  const { type, payload } = e.data;

  try {
    let result;

    switch (type) {
      case 'CALCULATE_DISTANCES':
        result = calculateDistances(payload.seats, payload.referencePoint);
        break;

      case 'PROCESS_SEATS_DATA':
        result = processSeatsData(payload.seats, payload.options);
        break;

      case 'CALCULATE_ZONES':
        result = calculateZones(payload.seats);
        break;

      case 'FILTER_AND_SORT_SEATS':
        result = filterAndSortSeats(payload.seats, payload.filters, payload.sortBy);
        break;

      case 'CALCULATE_SEAT_GROUPS':
        result = calculateSeatGroups(payload.seats, payload.groupSize);
        break;

      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }

    // Enviar resultado de vuelta al hilo principal
    self.postMessage({
      success: true,
      type,
      result
    });
  } catch (error) {
    // Enviar error de vuelta al hilo principal
    self.postMessage({
      success: false,
      type,
      error: error.message
    });
  }
};

/**
 * Calcular distancias desde un punto de referencia a todos los asientos
 */
function calculateDistances(seats, referencePoint) {



  return seats.map(seat => {
    const distance = calculateDistance(
      { x: seat.x || seat.posX || 0, y: seat.y || seat.posY || 0 },
      referencePoint
    );
    return {
      ...seat,
      distance
    };
  });
}

/**
 * Calcular distancia euclidiana entre dos puntos
 */
function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Procesar datos de asientos (normalizar, calcular propiedades, etc.)
 */
function processSeatsData(seats, options = {}) {
  if (!seats || seats.length === 0) {
    return [];
  }

  const {
    normalizePositions = true,
    calculateBounds = true,
    groupByZone = false
  } = options;

  let processedSeats = seats.map(seat => ({
    ...seat,
    _id: seat._id || seat.id || seat.sillaId,
    nombre: seat.nombre || seat.numero || `Asiento ${seat._id || seat.id}`,
    precio: parseFloat(seat.precio) || 0,
    x: normalizePositions ? parseFloat(seat.x || seat.posX || 0) : (seat.x || seat.posX || 0),
    y: normalizePositions ? parseFloat(seat.y || seat.posY || 0) : (seat.y || seat.posY || 0),
    zonaId: seat.zonaId || seat.zona?.id,
    nombreZona: seat.nombreZona || seat.zona?.nombre || 'General'
  }));

  if (calculateBounds) {
    const bounds = calculateSeatsBounds(processedSeats);
    processedSeats = processedSeats.map(seat => ({
      ...seat,
      bounds
    }));
  }

  if (groupByZone) {
    return groupSeatsByZone(processedSeats);
  }

  return processedSeats;
}

/**
 * Calcular límites (bounds) de los asientos
 */
function calculateSeatsBounds(seats) {
  if (!seats || seats.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  const xs = seats.map(s => s.x).filter(x => typeof x === 'number');
  const ys = seats.map(s => s.y).filter(y => typeof y === 'number');

  if (xs.length === 0 || ys.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

/**
 * Agrupar asientos por zona
 */
function groupSeatsByZone(seats) {
  const grouped = {};

  seats.forEach(seat => {
    const zoneId = seat.zonaId || 'general';
    if (!grouped[zoneId]) {
      grouped[zoneId] = {
        zonaId: zoneId,
        nombreZona: seat.nombreZona || 'General',
        seats: []
      };
    }
    grouped[zoneId].seats.push(seat);
  });

  return Object.values(grouped);
}

/**
 * Calcular zonas a partir de asientos
 */
function calculateZones(seats) {
  if (!seats || seats.length === 0) {
    return [];
  }

  const zonesMap = new Map();

  seats.forEach(seat => {
    const zoneId = seat.zonaId || seat.zona?.id || 'general';
    const zoneName = seat.nombreZona || seat.zona?.nombre || 'General';

    if (!zonesMap.has(zoneId)) {
      zonesMap.set(zoneId, {
        id: zoneId,
        nombre: zoneName,
        asientos: [],
        precioMinimo: Infinity,
        precioMaximo: 0,
        totalAsientos: 0,
        asientosDisponibles: 0
      });
    }

    const zone = zonesMap.get(zoneId);
    zone.asientos.push(seat);
    zone.totalAsientos++;

    const precio = parseFloat(seat.precio) || 0;
    if (precio > 0) {
      zone.precioMinimo = Math.min(zone.precioMinimo, precio);
      zone.precioMaximo = Math.max(zone.precioMaximo, precio);
    }

    // Considerar disponible si no está vendido/reservado
    if (!seat.vendido && !seat.reservado && seat.disponible !== false) {
      zone.asientosDisponibles++;
    }
  });

  // Convertir Map a Array y limpiar valores infinitos
  return Array.from(zonesMap.values()).map(zone => ({
    ...zone,
    precioMinimo: zone.precioMinimo === Infinity ? 0 : zone.precioMinimo
  }));
}

/**
 * Filtrar y ordenar asientos
 */
function filterAndSortSeats(seats, filters = {}, sortBy = null) {
  if (!seats || seats.length === 0) {
    return [];
  }

  let filtered = seats;

  // Aplicar filtros
  if (filters.disponible !== undefined) {
    filtered = filtered.filter(seat => {
      if (filters.disponible) {
        return !seat.vendido && !seat.reservado && seat.disponible !== false;
      }
      return true;
    });
  }

  if (filters.zonaId) {
    filtered = filtered.filter(seat =>
      seat.zonaId === filters.zonaId || seat.zona?.id === filters.zonaId
    );
  }

  if (filters.precioMin !== undefined) {
    filtered = filtered.filter(seat => {
      const precio = parseFloat(seat.precio) || 0;
      return precio >= filters.precioMin;
    });
  }

  if (filters.precioMax !== undefined) {
    filtered = filtered.filter(seat => {
      const precio = parseFloat(seat.precio) || 0;
      return precio <= filters.precioMax;
    });
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(seat => {
      const nombre = (seat.nombre || seat.numero || '').toLowerCase();
      const zona = (seat.nombreZona || seat.zona?.nombre || '').toLowerCase();
      return nombre.includes(searchLower) || zona.includes(searchLower);
    });
  }

  // Aplicar ordenamiento
  if (sortBy) {
    filtered = sortSeats(filtered, sortBy);
  }

  return filtered;
}

/**
 * Ordenar asientos según criterio
 */
function sortSeats(seats, sortBy) {
  const sorted = [...seats];

  switch (sortBy) {
    case 'precio-asc':
      sorted.sort((a, b) => {
        const precioA = parseFloat(a.precio) || 0;
        const precioB = parseFloat(b.precio) || 0;
        return precioA - precioB;
      });
      break;

    case 'precio-desc':
      sorted.sort((a, b) => {
        const precioA = parseFloat(a.precio) || 0;
        const precioB = parseFloat(b.precio) || 0;
        return precioB - precioA;
      });
      break;

    case 'nombre-asc':
      sorted.sort((a, b) => {
        const nombreA = (a.nombre || a.numero || '').toLowerCase();
        const nombreB = (b.nombre || b.numero || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
      break;

    case 'zona-asc':
      sorted.sort((a, b) => {
        const zonaA = (a.nombreZona || a.zona?.nombre || '').toLowerCase();
        const zonaB = (b.nombreZona || b.zona?.nombre || '').toLowerCase();
        return zonaA.localeCompare(zonaB);
      });
      break;

    default:
      // Sin ordenamiento
      break;
  }

  return sorted;
}

/**
 * Calcular grupos de asientos (para sugerencias de asientos juntos)
 */
function calculateSeatGroups(seats, groupSize) {
  if (!seats || seats.length === 0 || !groupSize || groupSize < 2) {
    return [];
  }

  // Filtrar solo asientos disponibles
  const availableSeats = seats.filter(seat =>
    !seat.vendido && !seat.reservado && seat.disponible !== false
  );

  if (availableSeats.length < groupSize) {
    return [];
  }

  // Agrupar por zona primero
  const zonesMap = new Map();
  availableSeats.forEach(seat => {
    const zoneId = seat.zonaId || seat.zona?.id || 'general';
    if (!zonesMap.has(zoneId)) {
      zonesMap.set(zoneId, []);
    }
    zonesMap.get(zoneId).push(seat);
  });

  const groups = [];

  // Para cada zona, encontrar grupos de asientos cercanos
  zonesMap.forEach((zoneSeats, zoneId) => {
    // Ordenar asientos por posición (y primero, luego x)
    const sorted = zoneSeats.sort((a, b) => {
      const yDiff = (a.y || 0) - (b.y || 0);
      if (yDiff !== 0) return yDiff;
      return (a.x || 0) - (b.x || 0);
    });

    // Buscar grupos consecutivos
    for (let i = 0; i <= sorted.length - groupSize; i++) {
      const group = sorted.slice(i, i + groupSize);
      // Verificar que los asientos estén en la misma fila (misma y, x consecutivos)
      const firstY = group[0].y || 0;
      const allSameRow = group.every(seat => Math.abs((seat.y || 0) - firstY) < 10);

      if (allSameRow) {
        groups.push({
          zoneId,
          seats: group,
          precioTotal: group.reduce((sum, seat) => sum + (parseFloat(seat.precio) || 0), 0),
          precioPromedio: group.reduce((sum, seat) => sum + (parseFloat(seat.precio) || 0), 0) / group.length
        });
      }
    }
  });

  // Ordenar grupos por precio total (ascendente)
  groups.sort((a, b) => a.precioTotal - b.precioTotal);

  return groups;
}

