import React, { useState } from 'react';
import { useSeatLockStore } from './seatLockStore';
import { useTheme } from '../contexts/ThemeContext';

const SeatLockDebug = ({ funcionId }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { 
    lockedSeats, 
    lockedTables, 
    channel, 
    subscribeToFunction,
    unsubscribe 
  } = useSeatLockStore();
  
  const { theme } = useTheme();

  const handleSubscribe = () => {
    if (funcionId) {
      subscribeToFunction(funcionId);
    }
  };

  const handleUnsubscribe = () => {
    unsubscribe();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
          title="Show Debug Panel"
        >
          🔍
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">🔍 Debug Seat Locks</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-lg font-bold"
          title="Close Debug Panel"
        >
          ×
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div>Funcion ID: {funcionId || 'N/A'}</div>
        <div>Channel: {channel?.topic || 'None'}</div>
        <div>Locked Seats: {lockedSeats?.length || 0}</div>
        <div>Locked Tables: {lockedTables?.length || 0}</div>
        
        <div className="mt-2 font-semibold">🎨 Theme Colors:</div>
        <div>Available: <span style={{color: theme.seatAvailable}}>●</span> {theme.seatAvailable}</div>
        <div>Selected Me: <span style={{color: theme.seatSelectedMe}}>●</span> {theme.seatSelectedMe}</div>
        <div>Selected Other: <span style={{color: theme.seatSelectedOther}}>●</span> {theme.seatSelectedOther}</div>
        <div>Blocked: <span style={{color: theme.seatBlocked}}>●</span> {theme.seatBlocked}</div>
        <div>Sold: <span style={{color: theme.seatSold}}>●</span> {theme.seatSold}</div>
        <div>Reserved: <span style={{color: theme.seatReserved}}>●</span> {theme.seatReserved}</div>
        
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
      
      <div className="mt-2 text-xs">
        <div className="font-semibold">🧪 Test Colors:</div>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <div style={{backgroundColor: theme.seatAvailable, color: 'white', padding: '2px', borderRadius: '2px', textAlign: 'center'}}>Available</div>
          <div style={{backgroundColor: theme.seatSelectedMe, color: 'white', padding: '2px', borderRadius: '2px', textAlign: 'center'}}>Selected Me</div>
          <div style={{backgroundColor: theme.seatSelectedOther, color: 'white', padding: '2px', borderRadius: '2px', textAlign: 'center'}}>Selected Other</div>
          <div style={{backgroundColor: theme.seatBlocked, color: 'white', padding: '2px', borderRadius: '2px', textAlign: 'center'}}>Blocked</div>
          <div style={{backgroundColor: theme.seatSold, color: 'white', padding: '2px', borderRadius: '2px', textAlign: 'center'}}>Sold</div>
          <div style={{backgroundColor: theme.seatReserved, color: 'white', padding: '2px', borderRadius: '2px', textAlign: 'center'}}>Reserved</div>
        </div>
        
        <div className="mt-2 font-semibold">🔍 Debug Info:</div>
        <div className="text-xs">
          <div>Session ID: {lockedSeats?.[0]?.session_id?.slice(0, 8) || 'N/A'}</div>
          <div>Total Locks: {lockedSeats?.length || 0}</div>
          <div>Channel Status: {channel?.topic ? 'Connected' : 'Disconnected'}</div>
        </div>
      </div>
    </div>
  );
};

export default SeatLockDebug;
