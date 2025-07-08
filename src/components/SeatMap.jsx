import React, { useState, useEffect } from "react";
import { getDatabaseInstance } from "../services/firebaseClient";
import { ref, onValue, off, update } from "firebase/database";
import normalizeSeatId from "../utils/normalizeSeatId";
import useSeatLocksArray from "../store/hooks/useSeatLocksArray";
import getCartSessionId from "../utils/getCartSessionId";
import normalizeSeatStatus from "../utils/normalizeSeatStatus";
import "./SeatMap.css";

const SeatMap = ({ funcionId }) => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [loading, setLoading] = useState(true);
  const [firebaseEnabled, setFirebaseEnabled] = useState(true); // Assume Firebase enabled

  useSeatLocksArray(funcionId, setSeats, getCartSessionId, firebaseEnabled);

  useEffect(() => {
    if (!funcionId) return;

    const dbPromise = getDatabaseInstance();

    let seatsRef;
    let unsubscribe;

    const fetchSeats = async () => {
      try {
        setLoading(true);
        const db = await dbPromise;
        if (!db) {
          setLoading(false);
          return;
        }
        seatsRef = ref(db, `seats/${funcionId}`);

        const handler = (snapshot) => {
          const data = snapshot.val() || {};
          const seatsArray = Object.entries(data).map(([key, seat]) => ({
            id: key,
            ...seat,
            status: normalizeSeatStatus(seat.status),
          }));

          const selectedMap = {};
          seatsArray.forEach((seat) => {
            if (seat.status === "selected" || seat.status === "blocked" || seat.status === "bloqueado") {
              selectedMap[seat.id] = {
                id: seat.id,
                status: seat.status,
                selectedBy: seat.selected_by || null,
              };
            }
          });

          setSeats(seatsArray);
          setSelectedSeats(selectedMap);
          setLoading(false);
        };

        onValue(seatsRef, handler);
        unsubscribe = () => off(seatsRef, "value", handler);
      } catch (err) {
        console.error("Error fetching seats from Firebase:", err);
        setLoading(false);
      }
    };

    fetchSeats();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [funcionId]);

  const handleSeatSelect = async (seatId) => {
    if (!seatId) return;
    try {
      const currentSeat = seats.find((s) => s.id === seatId);
      const sessionId = getCartSessionId();

      if (!currentSeat) return;

      // Check if seat is locked by another session
      if (
        (currentSeat.status === "blocked" || currentSeat.status === "bloqueado") ||
        (currentSeat.status === "selected" && currentSeat.selected_by !== sessionId)
      ) {
        alert("Este asiento ya está seleccionado por otro usuario");
        return;
      }

      const isCurrentlySelected =
        selectedSeats[seatId] && selectedSeats[seatId].selectedBy === sessionId;
      const newStatus = isCurrentlySelected ? "available" : "selected";

      const db = await getDatabaseInstance();
      if (!db) return;

      const seatRef = ref(db, `seats/${funcionId}/${seatId}`);

      // Update seat status and selected_by in Firebase Realtime Database
      await update(seatRef, {
        status: newStatus,
        selected_by: isCurrentlySelected ? null : sessionId,
        selected_at: isCurrentlySelected ? null : new Date().toISOString(),
      });

      // Lock or unlock seat in Firebase Realtime Database
      if (firebaseEnabled) {
        if (isCurrentlySelected) {
          // Unlock seat
          const lockRef = ref(db, `in-cart/${funcionId}/${normalizeSeatId(seatId)}`);
          await update(lockRef, null);
        } else {
          // Lock seat
          const lockRef = ref(db, `in-cart/${funcionId}/${normalizeSeatId(seatId)}`);
          await update(lockRef, {
            status: "bloqueado",
            session_id: sessionId,
            seatDetails: {
              // Add any seat details if needed
            },
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes lock expiry
          });
        }
      }
    } catch (err) {
      console.error("Error al seleccionar asiento:", err);
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
