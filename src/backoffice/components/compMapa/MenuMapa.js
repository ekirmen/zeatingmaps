import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ZonasDropdown from './ZonasDropdown';

const Seccion = ({ titulo, children, defaultOpen = false }) => {
  const [abierto, setAbierto] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-md shadow mb-3">
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
  zoneSeatCounts,
  selectedZoneId,
  setSelectedZoneId,
  sillaShape,
  setSillaShape,
  assignZoneToSelected,
  deleteSelectedElements,
  snapToGrid,
  toggleNumeracion,
  addTextElement,
  addRectangleElement,
  addEllipseElement,
  addLineElement,
  startChairRowMode,
  salaInfo,
  totalAsientos,
  elements,
  setSelectedIds,
  limpiarSillasDuplicadas,
  copiarElementos,
  pegarElementos,
  duplicarElementos,
  crearSeccion,
  formaPersonalizable,
}) => {
  const [activeMode, setActiveMode] = useState('select');
  const [activeTab, setActiveTab] = useState('edit');

  return (
    <aside className="w-80 h-screen bg-gray-100 p-4 overflow-y-auto flex flex-col space-y-4">
      <h3 className="text-2xl font-bold mb-2 text-center">🛠 Editor de Mapa</h3>

      {/* Info Sala */}
      <div className="text-sm bg-white rounded-md shadow p-3 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Sala</span>
          <span className="font-semibold">{salaInfo?.nombre || 'Cargando...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Asientos</span>
          <span className="font-semibold">{totalAsientos}</span>
        </div>
      </div>

      {/* Propiedades del Elemento Seleccionado */}
      {selectedElement && (
        <Seccion titulo="Propiedades del Elemento" defaultOpen={true}>
          <div className="space-y-3">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre:</label>
              <input
                type="text"
                value={selectedElement.nombre || ''}
                onChange={(e) => updateElementProperty(selectedElement._id, 'nombre', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Nombre del elemento"
              />
            </div>
            
            {/* Propiedades de Posición */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Posición X:</label>
                <input
                  type="number"
                  value={selectedElement.posicion?.x || 0}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'posicion', {
                    ...selectedElement.posicion,
                    x: parseInt(e.target.value) || 0
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Posición Y:</label>
                <input
                  type="number"
                  value={selectedElement.posicion?.y || 0}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'posicion', {
                    ...selectedElement.posicion,
                    y: parseInt(e.target.value) || 0
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Propiedades de Tamaño */}
            {selectedElement.type === 'rect' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ancho:</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedElement.width || 120}
                    onChange={(e) => updateElementSize(selectedElement._id, parseInt(e.target.value) || 120, selectedElement.height || 80)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alto:</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedElement.height || 80}
                    onChange={(e) => updateElementSize(selectedElement._id, selectedElement.width || 120, parseInt(e.target.value) || 80)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            )}

            {selectedElement.type === 'circle' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Radio:</label>
                <input
                  type="number"
                  min="1"
                  value={selectedElement.radius || 60}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'radius', parseInt(e.target.value) || 60)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Rotación */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rotación:</label>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={selectedElement.rotation || 0}
                onChange={(e) => updateElementProperty(selectedElement._id, 'rotation', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{selectedElement.rotation || 0}°</div>
            </div>

            {/* Zona */}
            {selectedElement.type === 'mesa' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Zona:</label>
                <select
                  value={selectedElement.zonaId || ''}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'zonaId', e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Sin zona</option>
                  {zonas.map(zona => (
                    <option key={zona.id} value={zona.id}>{zona.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Número de silla */}
            {selectedElement.type === 'silla' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Número:</label>
                <input
                  type="number"
                  min="1"
                  value={selectedElement.numero || ''}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'numero', parseInt(e.target.value) || '')}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Acciones del Elemento */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <button
                onClick={duplicarElementos}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                🔄 Duplicar
              </button>
              <button
                onClick={deleteSelectedElements}
                className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </Seccion>
      )}

      {/* Modos principales */}
      <div className="bg-white rounded-md shadow p-3">
        <h4 className="font-semibold text-gray-700 mb-3">Modos de Edición</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveMode('select')}
            className={`p-2 rounded text-sm transition-colors ${
              activeMode === 'select' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Seleccionar y mover elementos"
          >
            👆 Seleccionar
          </button>
          <button
            onClick={() => setActiveMode('edit')}
            className={`p-2 rounded text-sm transition-colors ${
              activeMode === 'edit' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Editar propiedades y redimensionar"
          >
            ✏️ Editar
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <strong>Seleccionar:</strong> Mover elementos, seleccionar múltiples<br/>
          <strong>Editar:</strong> Cambiar propiedades, redimensionar
        </div>
        
        {/* Información sobre navegación */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Navegación del Mapa</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>🖱️ <strong>Botón central:</strong> Paneo del mapa</div>
            <div>🔍 <strong>Rueda:</strong> Zoom in/out</div>
            <div>👆 <strong>Botón izquierdo:</strong> Seleccionar elementos</div>
            <div>👆👆 <strong>Doble clic en mesa:</strong> Seleccionar grupo completo</div>
          </div>
        </div>
      </div>

      {/* Tabs principales */}
      <div className="bg-white rounded-md shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'edit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => setActiveTab('numeracion')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'numeracion'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔢 Numeración
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚙️ Config
          </button>
        </div>

        {/* Contenido del tab Editar */}
        {activeTab === 'edit' && (
          <div className="p-4 space-y-4">
            {/* Secciones */}
            <Seccion titulo="Secciones" defaultOpen={true}>
              {activeMode === 'section' ? (
                <div className="space-y-2">
                  <button
                    className="w-full p-2 bg-red-600 text-white rounded text-sm"
                    onClick={() => {
                      setActiveMode('select');
                      setIsCreatingSection(false);
                      setSectionPoints([]);
                    }}
                  >
                    ❌ Cancelar Creación de Sección
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Haz clic en el mapa para crear puntos de sección
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setActiveMode('section')}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  📐 Crear Sección
                </button>
              )}
            </Seccion>

            {/* Filas de asientos */}
            <Seccion titulo="Filas de Asientos">
              <button
                onClick={() => {
                  setActiveMode('row');
                  startChairRowMode();
                }}
                className={`w-full p-2 rounded text-sm transition-colors ${
                  activeMode === 'row' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🪑 Crear Fila de Asientos
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Haz clic y arrastra para crear filas
              </p>
            </Seccion>

            {/* Zonas no numeradas */}
            <Seccion titulo="Zonas No Numeradas">
              <div className="space-y-2">
                <button
                  onClick={() => addEllipseElement()}
                  className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  ⭕ Zona Redonda
                </button>
                <button
                  onClick={() => addRectangleElement()}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  ◼ Zona Rectangular
                </button>
                <button
                  onClick={() => setActiveMode('freeform')}
                  className={`w-full p-2 rounded text-sm transition-colors ${
                    activeMode === 'freeform' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🎨 Forma Personalizable
                </button>
              </div>
            </Seccion>

            {/* Mesas */}
            <Seccion titulo="Mesas">
              <div className="space-y-2">
                <button
                  onClick={() => addMesa('circle')}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  ⭕ Mesa Redonda
                </button>
                <button
                  onClick={() => addMesa('rect')}
                  className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  ◼ Mesa Rectangular
                </button>
              </div>
            </Seccion>

            {/* Formas */}
            <Seccion titulo="Formas">
              <div className="space-y-2">
                <button
                  onClick={() => addEllipseElement()}
                  className="w-full p-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  ⭕ Elíptico
                </button>
                <button
                  onClick={() => addRectangleElement()}
                  className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  ◼ Rectangular
                </button>
                <button
                  onClick={() => addLineElement()}
                  className="w-full p-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                >
                  ➖ Línea
                </button>
              </div>
            </Seccion>

            {/* Textos */}
            <Seccion titulo="Textos">
              <button
                onClick={() => addTextElement()}
                className="w-full p-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm"
              >
                📝 Añadir Texto
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Haz clic en el mapa para colocar texto
              </p>
            </Seccion>

            {/* Acciones */}
            <Seccion titulo="Acciones">
              <div className="space-y-2">
                <button
                  onClick={copiarElementos}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  📋 Copiar
                </button>
                <button
                  onClick={pegarElementos}
                  className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  📋 Pegar
                </button>
                <button
                  onClick={crearSeccion}
                  className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  📐 Crear Sección
                </button>
                <button
                  onClick={formaPersonalizable}
                  className="w-full p-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                >
                  🎨 Forma Personalizable
                </button>
              </div>
            </Seccion>
          </div>
        )}

        {/* Contenido del tab Numeración */}
        {activeTab === 'numeracion' && (
          <div className="p-4 space-y-4">
            <Seccion titulo="Mostrar Numeración">
              <button
                onClick={toggleNumeracion}
                className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              >
                🆔 Mostrar Numeración
              </button>
              <div className="space-y-2 mt-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="showSeatLabels" className="rounded" />
                  <label htmlFor="showSeatLabels" className="text-sm text-gray-700">
                    Numeración de asientos (nombre de la silla)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="showObjectLabels" className="rounded" />
                  <label htmlFor="showObjectLabels" className="text-sm text-gray-700">
                    Numeración de grupos (mesas y filas)
                  </label>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <strong>Asientos:</strong> Muestra el nombre/número de cada silla individual<br/>
                  <strong>Grupos:</strong> Muestra el nombre del grupo (mesa o fila) que contiene las sillas
                </div>
              </div>
            </Seccion>
          </div>
        )}

        {/* Contenido del tab Configuración */}
        {activeTab === 'config' && (
          <div className="p-4 space-y-4">
            <Seccion titulo="Configuración Web">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="showRowLabelsRendered" className="rounded" />
                  <label htmlFor="showRowLabelsRendered" className="text-sm text-gray-700">
                    Mostrar numeración de filas en la web
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="showRowLinesRendered" className="rounded" />
                  <label htmlFor="showRowLinesRendered" className="text-sm text-gray-700">
                    Mostrar líneas de fila en la web
                  </label>
                </div>
              </div>
            </Seccion>

            <Seccion titulo="Configuración Mesas">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="bookWholeTables" className="rounded" />
                  <label htmlFor="bookWholeTables" className="text-sm text-gray-700">
                    Seleccionar mesa completa
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="bookWholeTableNotSeats" className="rounded" disabled />
                  <label htmlFor="bookWholeTableNotSeats" className="text-sm text-gray-500">
                    Comprar cada mesa y no sus asientos
                  </label>
                </div>
              </div>
            </Seccion>
          </div>
        )}
      </div>

      {/* Zonas y ajustes */}
      <Seccion titulo="Zonas y Ajustes">
        <label className="font-semibold text-sm text-gray-700">Zona:</label>
        <ZonasDropdown
          zonas={zonas}
          zoneSeatCounts={zoneSeatCounts}
          selectedZoneId={selectedZoneId}
          onChange={setSelectedZoneId}
        />
        <button
          onClick={assignZoneToSelected}
          className="w-full p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition mt-2"
        >
          🎯 Asignar Zona a Selección
        </button>
        <button
          onClick={snapToGrid}
          className="w-full p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition mt-2"
        >
          📏 Ajustar a Cuadrícula
        </button>
        <button
          onClick={limpiarSillasDuplicadas}
          className="w-full p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition mt-2"
        >
          🧹 Limpiar Sillas Duplicadas
        </button>
      </Seccion>

      {/* Herramientas de selección */}
      <Seccion titulo="Herramientas de Selección">
        <div className="space-y-2">
          <button
            onClick={() => {
              const mesasIds = elements.filter(el => el.type === 'mesa').map(el => el._id);
              setSelectedIds(mesasIds);
            }}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            📋 Seleccionar Todas las Mesas
          </button>
          <button
            onClick={() => {
              const sillasIds = elements.filter(el => el.type === 'silla').map(el => el._id);
              setSelectedIds(sillasIds);
            }}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            🪑 Seleccionar Todas las Sillas
          </button>
          <button
            onClick={() => {
              setSelectedIds([]);
              setSelectedElement(null);
            }}
            className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ❌ Limpiar Selección
          </button>
        </div>
      </Seccion>

      {/* Configuración de sillas */}
      <Seccion titulo="Configuración de Sillas">
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
          className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mt-2"
        >
          ➕ Añadir Sillas a Mesa
        </button>
      </Seccion>

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
