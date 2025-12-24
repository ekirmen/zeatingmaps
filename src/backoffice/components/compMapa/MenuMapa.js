import React from 'react';
import { Button, Input, Select, Slider, Switch, Divider, Space, Tooltip } from '../../../utils/antdComponents';
import { 
  CopyOutlined, 
  DeleteOutlined, 
  ScissorOutlined, 
  ClearOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  PictureOutlined,
  LinkOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Option } = Select;

// Componente Sección reutilizable
const Seccion = ({ titulo, children, className = "" }) => (
  <div className={`bg-white rounded-md shadow p-3 mb-3 ${className}`}>
    <h4 className="font-semibold text-gray-700 mb-3">{titulo}</h4>
    {children}
  </div>
);

const MenuMapa = ({
  // Estados básicos
  selectedElement,
  activeMode,
  sectionPoints,
  isCreatingSection,
  zones,
  selectedZone,
  numSillas,
  sillaShape,
  
  // Nuevos estados de escalado
  selectedScale,
  showScaleControls,
  scaleSystem,
  
  // Nuevos estados de asientos
  selectedSeatState,
  seatStates,
  
  // Nuevos estados de conexiones
  showConnections,
  connectionStyle,
  connectionThreshold,
  
  // Nuevos estados de fondo
  backgroundImage,
  backgroundScale,
  backgroundOpacity,
  showBackgroundInWeb,
  backgroundSystem,
  
  // Funciones básicas
  updateElementProperty,
  updateElementSize,
  duplicarElementos,
  crearSeccion,
  limpiarSeleccion,
  assignZoneToSelected,
  
  // Nuevas funciones de escalado
  scaleElement,
  scaleSelectedElements,
  
  // Nuevas funciones de estados de asientos
  changeSeatState,
  changeSelectedSeatsState,
  changeMesaSeatsState,
  setSelectedSeatState,
  
  // Nuevas funciones de conexiones
  autoConnectSeats,
  createManualConnection,
  removeConnections,
  changeConnectionStyle,
  
  // Nuevas funciones de coordenadas precisas
  precisePositioning,
  snapToCustomGrid,
  
  // Nuevas funciones de fondo
  setBackgroundImage,
  updateBackground,
  removeBackground,
  
  // Funciones existentes
  addMesa,
  addSillasToMesa,
  snapToGrid,
  setActiveMode,
  setNumSillas,
  setSillaShape
}) => {

  // ===== MANEJADORES DE EVENTOS =====
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundScaleChange = (value) => {
    updateBackground({ scale: value / 100 });
  };

  const handleBackgroundOpacityChange = (value) => {
    updateBackground({ opacity: value / 100 });
  };

  const handleShowBackgroundInWebChange = (checked) => {
    updateBackground({ showInWeb: checked });
  };

  const handleSnapToCustomGrid = (gridSize) => {
    snapToCustomGrid(gridSize);
  };

  const handleScaleChange = (scaleFactor) => {
    if (selectedElement) {
      scaleElement(selectedElement._id, scaleFactor);
    } else {
      scaleSelectedElements(scaleFactor);
    }
  };

  const handleSeatStateChange = (newState) => {
    if (selectedElement && selectedElement.type === 'silla') {
      changeSeatState(selectedElement._id, newState);
    } else {
      changeSelectedSeatsState(newState);
    }
  };

  const handleConnectionStyleChange = (newStyle) => {
    changeConnectionStyle(newStyle);
  };

  return (
    <div className="w-80 bg-gray-50 p-4 overflow-y-auto h-full">
      {/* ===== PROPIEDADES DEL ELEMENTO ===== */}
      {selectedElement && (
        <Seccion titulo="Propiedades del Elemento">
          <div className="space-y-3">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre:</label>
              <Input
                value={selectedElement.nombre || ''}
                onChange={(e) => updateElementProperty(selectedElement._id, 'nombre', e.target.value)}
                placeholder="Nombre del elemento"
                className="text-sm"
              />
            </div>

            {/* Ancho y Largo */}
            {selectedElement.type === 'rect' || selectedElement.type === 'mesa' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ancho:</label>
                  <Input
                    type="number"
                    value={selectedElement.width || 120}
                    onChange={(e) => updateElementSize(selectedElement._id, parseInt(e.target.value) || 120, selectedElement.height || 80)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Largo:</label>
                  <Input
                    type="number"
                    value={selectedElement.height || 80}
                    onChange={(e) => updateElementSize(selectedElement._id, selectedElement.width || 120, parseInt(e.target.value) || 80)}
                    className="text-sm"
                  />
                </div>
              </>
            ) : selectedElement.type === 'circle' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Radio:</label>
                <Input
                  type="number"
                  value={selectedElement.radius || 60}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'radius', parseInt(e.target.value) || 60)}
                  className="text-sm"
                />
              </div>
            ) : null}

            {/* Escala */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Escala: {((selectedElement.scale || 1) * 100).toFixed(0)}%
              </label>
              <Slider
                min={scaleSystem.min * 100}
                max={scaleSystem.max * 100}
                step={scaleSystem.step * 100}
                value={(selectedElement.scale || 1) * 100}
                onChange={handleScaleChange}
                className="w-full"
              />
            </div>

            {/* Rotación */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Rotación: {selectedElement.rotation || 0}°
              </label>
              <Slider
                min={0}
                max={360}
                value={selectedElement.rotation || 0}
                onChange={(value) => updateElementProperty(selectedElement._id, 'rotation', value)}
                className="w-full"
              />
            </div>

            {/* Zona (solo para mesas) */}
            {selectedElement.type === 'mesa' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Zona:</label>
                <Select
                  value={selectedElement.zonaId || undefined}
                  onChange={(value) => updateElementProperty(selectedElement._id, 'zonaId', value)}
                  placeholder="Seleccionar zona"
                  className="w-full"
                  allowClear
                >
                  {zones.map(zone => (
                    <Option key={zone.id} value={zone.id}>
                      {zone.nombre} ({zone.tipo === 'numerada' ? 'Numerada' : 'No numerada'})
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            {/* Número (solo para sillas) */}
            {selectedElement.type === 'silla' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Número:</label>
                <Input
                  type="number"
                  value={selectedElement.numero || ''}
                  onChange={(e) => updateElementProperty(selectedElement._id, 'numero', parseInt(e.target.value) || '')}
                  className="text-sm"
                />
              </div>
            )}

            {/* Estado (solo para sillas) */}
            {selectedElement.type === 'silla' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado:</label>
                <Select
                  value={selectedElement.state || 'available'}
                  onChange={handleSeatStateChange}
                  className="w-full"
                >
                  {Object.entries(seatStates).map(([state, config]) => (
                    <Option key={state} value={state}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: config.fill }}
                        />
                        {state === 'available' && 'Disponible'}
                        {state === 'selected' && 'Seleccionado'}
                        {state === 'occupied' && 'Ocupado'}
                        {state === 'blocked' && 'Bloqueado'}
                        {state === 'reserved' && 'Reservado'}
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button 
                type="primary" 
                icon={<CopyOutlined />}
                onClick={duplicarElementos}
                className="flex-1"
              >
                Duplicar
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => {/* Implementar eliminación */}}
                className="flex-1"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Seccion>
      )}

      {/* ===== CONTROLES DE ESCALADO ===== */}
      <Seccion titulo="Controles de Escalado">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mostrar controles de escala</span>
            <Switch 
              checked={showScaleControls}
              onChange={(checked) => {/* Implementar setShowScaleControls */}}
            />
          </div>
          
          {showScaleControls && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Escala Global: {(selectedScale * 100).toFixed(0)}%
                </label>
                <Slider
                  min={scaleSystem.min * 100}
                  max={scaleSystem.max * 100}
                  step={scaleSystem.step * 100}
                  value={selectedScale * 100}
                  onChange={handleScaleChange}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  size="small"
                  onClick={() => handleScaleChange(0.5)}
                >
                  50%
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleScaleChange(1.0)}
                >
                  100%
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleScaleChange(2.0)}
                >
                  200%
                </Button>
              </div>
            </>
          )}
        </div>
      </Seccion>

      {/* ===== ESTADOS DE ASIENTOS ===== */}
      <Seccion titulo="Estados de Asientos">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado Seleccionado:</label>
            <Select
              value={selectedSeatState}
              onChange={setSelectedSeatState}
              className="w-full"
            >
              {Object.entries(seatStates).map(([state, config]) => (
                <Option key={state} value={state}>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: config.fill }}
                    />
                    {state === 'available' && 'Disponible'}
                    {state === 'selected' && 'Seleccionado'}
                    {state === 'occupied' && 'Ocupado'}
                    {state === 'blocked' && 'Bloqueado'}
                    {state === 'reserved' && 'Reservado'}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="small"
              onClick={() => changeSelectedSeatsState(selectedSeatState)}
            >
              Aplicar a Seleccionados
            </Button>
            <Button 
              size="small"
              onClick={() => {/* Implementar cambio de estado por mesa */}}
            >
              Aplicar por Mesa
            </Button>
          </div>
        </div>
      </Seccion>

      {/* ===== CONEXIONES INTELIGENTES ===== */}
      <Seccion titulo="Conexiones Inteligentes">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mostrar conexiones</span>
            <Switch 
              checked={showConnections}
              onChange={(checked) => {/* Implementar setShowConnections */}}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estilo de conexiones:</label>
            <Select
              value={connectionStyle}
              onChange={handleConnectionStyleChange}
              className="w-full"
            >
              <Option value="solid">Línea sólida</Option>
              <Option value="dashed">Línea punteada</Option>
              <Option value="dotted">Línea de puntos</Option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Umbral de conexión: {connectionThreshold}px
            </label>
            <Slider
              min={20}
              max={100}
              value={connectionThreshold}
              onChange={(value) => {/* Implementar setConnectionThreshold */}}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {/* Implementar conexión manual */}}
            >
              Conectar Manual
            </Button>
            <Button 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {/* Implementar remover conexiones */}}
            >
              Remover
            </Button>
          </div>
        </div>
      </Seccion>

      {/* ===== COORDENADAS PRECISAS ===== */}
      <Seccion titulo="Coordenadas Precisas">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ajustar a cuadrícula:</label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="small"
                onClick={() => handleSnapToCustomGrid(5)}
              >
                5px
              </Button>
              <Button 
                size="small"
                onClick={() => handleSnapToCustomGrid(10)}
              >
                10px
              </Button>
              <Button 
                size="small"
                onClick={() => handleSnapToCustomGrid(20)}
              >
                20px
              </Button>
              <Button 
                size="small"
                onClick={() => handleSnapToCustomGrid(50)}
              >
                50px
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            ðŸ’á <strong>Consejo:</strong> Usa cuadrículas más pequeñas para mayor precisión
          </div>
        </div>
      </Seccion>

      {/* ===== FONDO DEL MAPA ===== */}
      <Seccion titulo="Fondo del Mapa">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen de fondo:</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="background-upload"
              />
              <label htmlFor="background-upload" className="cursor-pointer">
                <div className="text-gray-500">
                  <div className="text-2xl mb-2">ðŸ–¼ï¸</div>
                  <div className="text-sm">Haz clic para seleccionar imagen</div>
                  <div className="text-xs text-gray-400 mt-1">o arrastra y suelta aquí</div>
                </div>
              </label>
            </div>
          </div>
          
          {backgroundImage && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={showBackgroundInWeb}
                    onChange={handleShowBackgroundInWebChange}
                  />
                  <span className="text-sm text-gray-700">
                    Mostrar imagen de fondo en la venta
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Escalar imagen: {backgroundScale * 100}%
                  </label>
                  <Slider
                    min={25}
                    max={200}
                    step={25}
                    value={backgroundScale * 100}
                    onChange={handleBackgroundScaleChange}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Opacidad: {backgroundOpacity * 100}%
                  </label>
                  <Slider
                    min={10}
                    max={100}
                    step={10}
                    value={backgroundOpacity * 100}
                    onChange={handleBackgroundOpacityChange}
                    className="w-full"
                  />
                </div>
              </div>
              
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={removeBackground}
                className="w-full"
                size="small"
              >
                ðŸ—‘ï¸ Quitar imagen de fondo
              </Button>
            </>
          )}
          
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            ðŸ’á <strong>Consejo:</strong> Las imágenes más grandes son más fáciles de pintar encima
          </div>
        </div>
      </Seccion>

      {/* ===== ZONAS Y AJUSTES ===== */}
      <Seccion titulo="Zonas y Ajustes">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zona seleccionada:</label>
            <Select
              value={selectedZone?.id || undefined}
              onChange={(value) => {
                const zona = zones.find(z => z.id === value);
                // Implementar setSelectedZone
              }}
              placeholder="Seleccionar zona"
              className="w-full"
              allowClear
            >
              {zones.map(zone => (
                <Option key={zone.id} value={zone.id}>
                  {zone.nombre} ({zone.tipo === 'numerada' ? 'Numerada' : 'No numerada'})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Número de sillas:</label>
            <Input
              type="number"
              value={numSillas}
              onChange={(e) => setNumSillas(parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de silla:</label>
            <Select
              value={sillaShape}
              onChange={setSillaShape}
              className="w-full"
            >
              <Option value="rect">Rectangular</Option>
              <Option value="circle">Circular</Option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              type="primary"
              onClick={() => addMesa('rect')}
              className="w-full"
            >
              Mesa Cuadrada
            </Button>
            <Button 
              type="primary"
              onClick={() => addMesa('circle')}
              className="w-full"
            >
              Mesa Circular
            </Button>
          </div>

          {selectedZone && (
            <Button 
              onClick={() => {
                if (selectedElement && selectedElement.type === 'mesa') {
                  addSillasToMesa(selectedElement._id, numSillas, sillaShape);
                }
              }}
              className="w-full"
              disabled={!selectedElement || selectedElement.type !== 'mesa'}
            >
              Agregar {numSillas} Sillas
            </Button>
          )}
        </div>
      </Seccion>

      {/* ===== ACCIONES ===== */}
      <Seccion titulo="Acciones">
        <div className="space-y-2">
          <Button 
            type={activeMode === 'section' ? 'primary' : 'default'}
            icon={<ScissorOutlined />}
            onClick={crearSeccion}
            className="w-full"
          >
            {isCreatingSection ? 'Cancelar Creación de Sección' : 'Crear Sección'}
          </Button>
          
          <Button 
            icon={<ClearOutlined />}
            onClick={limpiarSeleccion}
            className="w-full"
          >
            Limpiar Selección
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={snapToGrid}
            className="w-full"
          >
            Ajustar a Cuadrícula
          </Button>
          
          <Button 
            icon={<SettingOutlined />}
            onClick={() => {/* Implementar configuración avanzada */}}
            className="w-full"
          >
            Configuración Avanzada
          </Button>
        </div>
      </Seccion>

      {/* ===== INFORMACI“N DE NAVEGACI“N ===== */}
      <Seccion titulo="Navegación del Mapa">
        <div className="text-xs text-gray-600 space-y-1">
          <div>ðŸ–ñï¸ <strong>Botón central:</strong> Paneo del mapa</div>
          <div>ðŸ” <strong>Rueda:</strong> Zoom in/out</div>
          <div>ðŸ‘† <strong>Botón izquierdo:</strong> Seleccionar elementos</div>
          <div>ðŸ‘†ðŸ‘† <strong>Doble clic en mesa:</strong> Seleccionar grupo completo</div>
          <div>Œ¨ï¸ <strong>Ctrl + Click:</strong> Selección múltiple</div>
          <div>ðŸ“ <strong>Shift + Arrastrar:</strong> Selección rectangular</div>
        </div>
      </Seccion>
    </div>
  );
};

export default MenuMapa;


