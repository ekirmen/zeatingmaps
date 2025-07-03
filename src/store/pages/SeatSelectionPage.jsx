import React from 'react';
import SeatMap from '../../components/SeatMap';
import { useParams } from 'react-router-dom';

const SeatSelectionPage = () => {
  const { funcionId } = useParams();

  return (
    <div className="seat-selection-page">
      <h1>Selección de Asientos</h1>
      <SeatMap funcionId={funcionId} />
    </div>
  );
};

export default SeatSelectionPage;
