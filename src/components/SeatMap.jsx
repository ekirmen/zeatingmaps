import React, { useState, useEffect } from "react";
import useSeatLocksArray from "../store/hooks/useSeatLocksArray";
import getCartSessionId from "../utils/getCartSessionId";
import "./SeatMap.css";

const SeatMap = ({ funcionId, onSeatToggle }) => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [loading, setLoading] = useState(true);

  useSeatLocksArray(funcionId, setSeats, getCartSessionId, false); // Firebase disabled

  useEffect(() => {
    if (!funcionId) return;

    // Using Supabase for seat management
    setSeats([]);
    setSelectedSeats({});
    setLoading(false);
  }, [funcionId]);

  const handleSeatSelect = (seatId) => {
    if (!seatId) return;
    // Seat selection logic using Supabase
    const currentSeat = seats.find((s) => s.id === seatId);
    if (!currentSeat) return;

    const isCurrentlySelected = selectedSeats[seatId];
    const newSelectedSeats = { ...selectedSeats };

    if (isCurrentlySelected) {
      delete newSelectedSeats[seatId];
    } else {
      newSelectedSeats[seatId] = currentSeat;
    }

    setSelectedSeats(newSelectedSeats);

    if (onSeatToggle) {
      const seatData = {
        id: currentSeat.id,
        name: currentSeat.name,
        status: isCurrentlySelected ? 'available' : 'selected',
        selected_by: null,
      };
      onSeatToggle(seatData);
    }
  };

  return (
    <div className="seat-map">
      <h2>Selección de Asientos</h2>
      {loading ? (
        <p>Cargando asientos...</p>
      ) : (
        <div className="seats-container">
          {seats.map((seat) => (
            <div
              key={seat.id}
              className={`seat ${seat.status}`}
              onClick={() => handleSeatSelect(seat.id)}
              title={
                seat.status === "selected"
                  ? `Seleccionado por ${seat.selected_by}`
                  : seat.name
              }
            >
              {seat.name || seat.id}
            </div>
          ))}
        </div>
      )}
      <div className="legend">
        <div className="legend-item">
          <div className="seat-sample available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample selected"></div>
          <span>Seleccionado</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample blocked"></div>
          <span>Bloqueado</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
