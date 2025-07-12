import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VenueMap = ({ recintoInfo }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!recintoInfo || !recintoInfo.lat || !recintoInfo.lon) {
      return;
    }

    // Initialize map only once
    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map('venue-map', {
      center: [recintoInfo.lat, recintoInfo.lon],
      zoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([recintoInfo.lat, recintoInfo.lon]).addTo(map)
      .bindPopup(recintoInfo.nombre || 'Recinto')
      .openPopup();

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [recintoInfo]);

  return (
    <div
      id="venue-map"
      style={{ height: '300px', width: '100%' }}
      className="rounded-md shadow-md"
    />
  );
};

export default VenueMap;
