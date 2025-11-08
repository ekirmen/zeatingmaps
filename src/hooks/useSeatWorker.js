/**
 * Hook para usar el Web Worker de cálculos de asientos
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import seatWorkerService from '../utils/seatWorkerService';

/**
 * Hook para procesar asientos usando Web Worker
 */
export const useSeatWorker = (seats, options = {}) => {
  const [processedSeats, setProcessedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);

  const processSeats = useCallback(async () => {
    if (!seats || seats.length === 0) {
      setProcessedSeats([]);
      return;
    }

    // Si hay menos de 50 asientos, procesar en el hilo principal (overhead del worker no vale la pena)
    if (seats.length < 50) {
      setProcessedSeats(seats);
      return;
    }

    if (processingRef.current) {
      return; // Ya hay un procesamiento en curso
    }

    try {
      processingRef.current = true;
      setLoading(true);
      setError(null);

      const result = await seatWorkerService.processSeatsData(seats, options);
      setProcessedSeats(result);
    } catch (err) {
      console.error('[useSeatWorker] Error procesando asientos:', err);
      setError(err);
      // Fallback: usar asientos sin procesar
      setProcessedSeats(seats);
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }, [seats, options]);

  useEffect(() => {
    processSeats();
  }, [processSeats]);

  return { processedSeats, loading, error, reprocess: processSeats };
};

/**
 * Hook para calcular zonas usando Web Worker
 */
export const useZonesWorker = (seats) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateZones = useCallback(async () => {
    if (!seats || seats.length === 0) {
      setZones([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await seatWorkerService.calculateZones(seats);
      setZones(result);
    } catch (err) {
      console.error('[useZonesWorker] Error calculando zonas:', err);
      setError(err);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [seats]);

  useEffect(() => {
    calculateZones();
  }, [calculateZones]);

  return { zones, loading, error, recalculate: calculateZones };
};

/**
 * Hook para filtrar y ordenar asientos usando Web Worker
 */
export const useFilteredSeatsWorker = (seats, filters = {}, sortBy = null) => {
  const [filteredSeats, setFilteredSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filterAndSort = useCallback(async () => {
    if (!seats || seats.length === 0) {
      setFilteredSeats([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await seatWorkerService.filterAndSortSeats(seats, filters, sortBy);
      setFilteredSeats(result);
    } catch (err) {
      console.error('[useFilteredSeatsWorker] Error filtrando asientos:', err);
      setError(err);
      // Fallback: filtrar en el hilo principal
      let filtered = seats;
      if (filters.disponible) {
        filtered = filtered.filter(s => !s.vendido && !s.reservado);
      }
      setFilteredSeats(filtered);
    } finally {
      setLoading(false);
    }
  }, [seats, filters, sortBy]);

  useEffect(() => {
    filterAndSort();
  }, [filterAndSort]);

  return { filteredSeats, loading, error, refilter: filterAndSort };
};

