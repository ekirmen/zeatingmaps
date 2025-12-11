import { useEffect, useState } from 'react';

export function useCountdown(targetTimeMs) {
  const [now, setNow] = useState(Date.now());


    if (!targetTimeMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetTimeMs]);

  const remaining = Math.max(0, (targetTimeMs || 0) - now);
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { remaining, days, hours, minutes, seconds };
}

export function formatCountdown({ days, hours, minutes, seconds }) {
  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Helper to pick start timestamps from funciones
export function pickChannelStart(funcion, channel) {
  if (!funcion) return null;
  const canales = funcion.canales || {};
  const chan = channel === 'boxOffice' ? canales.boxOffice : canales.internet;
  const candidate = (chan && chan.inicio) || funcion.inicio_venta || funcion.inicioVenta;
  if (!candidate) return null;
  const ts = Date.parse(candidate);
  return isNaN(ts) ? null : ts;
}

export function findNextStart(funciones = [], channel = 'internet') {
  const times = funciones
    .map((f) => pickChannelStart(f, channel))
    .filter(Boolean);
  if (times.length === 0) return null;
  const futureTimes = times.filter((t) => t > Date.now());
  const list = futureTimes.length > 0 ? futureTimes : times;
  return Math.min(...list);
}


