import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TopBar = () => {
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userName = localStorage.getItem('userName') || 'Usuario';

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      {/* Marca o nombre */}
      <div className="text-lg font-semibold">
        🎟️ Tickera App
      </div>

      {/* Usuario y dropdown */}
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center gap-2"
        >
          {userName}
          <span className="text-sm">&#9660;</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-40 bg-white border rounded-md shadow-lg z-50">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
