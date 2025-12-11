import React from 'react';
import { Layer } from 'react-konva';
import SeatWithTooltip from './SeatWithTooltipCore.jsx';


  return (
    <Layer>
      {seats.map((s, idx) => (
        <SeatWithTooltip key={s._id || idx} seat={s} x={(s._computed && s._computed.x) || s.x || 0} y={(s._computed && s._computed.y) || s.y || 0} onClick={onSeatClick} />
      ))}
    </Layer>
  );
}
