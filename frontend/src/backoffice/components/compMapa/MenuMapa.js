import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ZonasDropdown from './ZonasDropdown';

const Seccion = ({ titulo, children }) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="bg-white rounded-md shadow">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex justify-between items-center px-4 py-2 border-b font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200"
      >
        <span>{titulo}</span>
        {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {abierto && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};

const Menu = ({
  addMesa,
  addSillasToMesa,
  selectedElement,
  numSillas,
  setNumSillas,
  handleSave,
  updateElementProperty,
  updateElementSize,
  zonas,
  selectedZoneId,
  setSelectedZoneId,
  sillaShape,
  setSillaShape,
  assignZoneToSelected,
  deleteSelectedElements,
  snapToGrid,
  toggleNumeracion,
  // Accept the new graphical element functions as props
  addTextElement,
  addRectangleElement,
  addEllipseElement,
  addLineElement,
  startChairRowMode,
}) => {
  return (
    <aside className="w-72 h-screen bg-gray-100 p-4 overflow-y-auto flex flex-col space-y-6">
      <h3 className="text-2xl font-bold mb-2 text-center">🛠 Editor de Mapa</h3>

      {/* Info Sala */}
      <div className="text-sm bg-white rounded-md shadow p-3 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Sala</span>
          <span className="font-semibold">HOTEL HESPERIA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Asientos</span>
          <span className="font-semibold">1710</span>
        </div>
      </div>

      {/* Mesas y sillas */}
      <Seccion titulo="Mesas y Sillas">
        <button
          onClick={() => addMesa('circle')}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ➕ Mesa Redonda
        </button>
        <button
          onClick={() => addMesa('rect')}
          className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          ➕ Mesa Cuadrada
        </button>
        <button
          onClick={startChairRowMode}
          className="w-full p-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 mt-2"
        >
          ➕ Fila de Sillas
        </button>

        <div>
          <label className="block mb-1 font-semibold text-gray-700"># de Sillas:</label>
          <input
            type="number"
            min={1}
            value={numSillas}
            onChange={(e) => setNumSillas(parseInt(e.target.value, 10) || 1)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold text-gray-700">Forma Sillas:</label>
          <select
            value={sillaShape}
            onChange={(e) => setSillaShape(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="rect">Cuadradas</option>
            <option value="circle">Redondas</option>
          </select>
        </div>

        <button
          onClick={() => {
            if (!selectedElement || !selectedElement._id) {
              alert('Selecciona primero una mesa para añadir sillas.');
              return;
            }
            addSillasToMesa(selectedElement._id, numSillas, sillaShape);
          }}
          className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          ➕ Añadir Sillas a Mesa
        </button>
      </Seccion>

      {/* Zona y acciones */}
      <Seccion titulo="Zonas y Ajustes">
        <label className="font-semibold text-sm text-gray-700">Zona:</label>
        <ZonasDropdown
          zonas={zonas}
          selectedZoneId={selectedZoneId}
          onChange={setSelectedZoneId}
        />
        <button
          onClick={toggleNumeracion}
          className="w-full p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          🆔 Numeración
        </button>
        <button
          onClick={assignZoneToSelected}
          className="w-full p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          🎯 Asignar Zona a Selección
        </button>
        <button
          onClick={snapToGrid}
          className="w-full p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
        >
          📏 Ajustar a Cuadrícula
        </button>
      </Seccion>

    

      {/* Formas y texto */}
      <Seccion titulo="Elementos Gráficos">
        <button
          onClick={addTextElement} // Connect to the prop
          className="w-full p-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          ➕ Añadir Texto
        </button>
        <button
          onClick={addRectangleElement} // Connect to the prop
          className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          ◼ Añadir Rectángulo
        </button>
        <button
          onClick={addEllipseElement} // Connect to the prop
          className="w-full p-2 bg-amber-500 text-white rounded hover:bg-amber-600"
        >
          ⭕ Añadir Elipse
        </button>
        <button
          onClick={addLineElement} // Connect to the prop
          className="w-full p-2 bg-lime-500 text-white rounded hover:bg-lime-600"
        >
          ➖ Añadir Línea
        </button>
      </Seccion>

      {/* Editor propiedades */}
      {/* La edición de elementos se realiza ahora mediante un popup flotante */}

      {/* Guardar */}
      <Seccion titulo="Herramientas">
        <button
          onClick={handleSave}
          className="w-full p-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          💾 Guardar
        </button>
      </Seccion>
    </aside>
  );
};

export default Menu;
