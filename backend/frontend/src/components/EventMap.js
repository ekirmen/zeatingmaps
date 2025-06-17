import React from 'react';

const EventMap = ({ latitude = 40.4168, longitude = -3.7038, zoom = 15, width = '100%', height = 300 }) => {
  const bbox = `${longitude - 0.005},${latitude - 0.003},${longitude + 0.005},${latitude + 0.003}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div style={{ width, height }} className="rounded shadow overflow-hidden">
      <iframe
        title="Event map"
        src={src}
        style={{ border: 0, width: '100%', height: '100%' }}
        loading="lazy"
      />
    </div>
  );
};

export default EventMap;
