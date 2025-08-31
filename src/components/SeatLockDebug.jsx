import React from 'react';
import { useSeatLockStore } from './seatLockStore';

const SeatLockDebug = ({ funcionId }) => {
  const { 
    lockedSeats, 
    lockedTables, 
    channel, 
    subscribeToFunction,
    unsubscribe 
  } = useSeatLockStore();

  const handleSubscribe = () => {
    if (funcionId) {
      subscribeToFunction(funcionId);
    }
  };

  const handleUnsubscribe = () => {
    unsubscribe();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Debug Seat Locks</h3>
      
      <div className="text-xs space-y-1">
        <div>Funcion ID: {funcionId || 'N/A'}</div>
        <div>Channel: {channel?.topic || 'None'}</div>
        <div>Locked Seats: {lockedSeats?.length || 0}</div>
        <div>Locked Tables: {lockedTables?.length || 0}</div>
        
        {lockedSeats?.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Seats:</div>
            {lockedSeats.map((lock, i) => (
              <div key={i} className="ml-2">
                {lock.seat_id} - {lock.status} ({lock.session_id?.slice(0, 8)})
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 flex gap-2">
        <button 
          onClick={handleSubscribe}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
        >
          Subscribe
        </button>
        <button 
          onClick={handleUnsubscribe}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded"
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
};

export default SeatLockDebug;
