import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Slider, Switch, Divider, Space, Tooltip, Collapse, Checkbox } from 'antd';
import { message } from 'antd';
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
  SettingOutlined,
  EditOutlined,
  NumberOutlined,
  TableOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  BorderOutlined,
  StarOutlined,
  UserOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Panel } = Collapse;

// Componente para controles de fila de asientos
const ControlesFilaAsientos = ({ filaId, onAñadirSillas, direccion }) => {
  return (
    <div className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50">
      <div className="flex items-center space-x-1">
        {/* Flecha izquierda/arriba */}
        <Button
          size="small"
          icon={<span className="text-xs">←</span>}
          onClick={() => onAñadirSillas(filaId, 1, direccion === 'horizontal' ? 'izquierda' : 'arriba')}
          title={`Añadir silla a la ${direccion === 'horizontal' ? 'izquierda' : 'arriba'}`}
        />
        
        {/* Flecha derecha/abajo */}
        <Button
          size="small"
          icon={<span className="text-xs">→</span>}
          onClick={() => onAñadirSillas(filaId, 1, direccion === 'horizontal' ? 'derecha' : 'abajo')}
          title={`Añadir silla a la ${direccion === 'horizontal' ? 'derecha' : 'abajo'}`}
        />
        
        {/* Botón para añadir múltiples */}
        <Button
          size="small"
          icon={<span className="text-xs">+2</span>}
          onClick={() => onAñadirSillas(filaId, 2, direccion === 'horizontal' ? 'derecha' : 'abajo')}
          title="Añadir 2 sillas"
        />
      </div>
    </div>
  );
};

// Componente SeatsIoTooltip para filas de asientos
const SeatsIoTooltip = ({ 
  element, 
  onFlipHorizontal, 
  onFlipVertical, 
  onCurveChange, 
  onDuplicate, 
  onDelete,
  onClose 
}) => {
  const [curveValue, setCurveValue] = useState(50);
  
  if (!element || !element.esFila) return null;
  
  return (
    <div 
      className="seatsIoTooltip absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[200px]"
      style={{
        left: element.posicion.x + (element.width || 20) + 10,
        top: element.posicion.y - 50
      }}
    >
      <div className="space-y-2">
        {/* Voltear horizontalmente */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onFlipHorizontal}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-reflect-horinzotal text-blue-600">↔</i>
            </div>
            <span>Voltear horizontalmente</span>
          </div>
        </div>
        
        {/* Voltear verticalmente */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onFlipVertical}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-reflect-vertical text-blue-600">↕</i>
            </div>
            <span>Voltear verticalmente</span>
          </div>
        </div>
        
        {/* Control de curva */}
        <div className="control p-2">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon palco4icon-bend text-blue-600">⌒</i>
              </div>
              <span className="sliderLabel">Curva</span>
            </div>
            <div className="w-full">
              <Slider
                min={0}
                max={100}
                value={curveValue}
                onChange={(value) => {
                  setCurveValue(value);
                  onCurveChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}%`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Duplicar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDuplicate}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-copy text-green-600">📋</i>
            </div>
            <span>Duplicar</span>
          </div>
        </div>
        
        {/* Eliminar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDelete}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-delete text-red-600">🗑️</i>
            </div>
            <span>Eliminar</span>
          </div>
        </div>
      </div>
      
      {/* Botón para cerrar */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
};

// Componente MesaTooltip para mesas
const MesaTooltip = ({ 
  element, 
  onSideChange, 
  onChairsChange, 
  onWidthChange, 
  onHeightChange, 
  onRotationChange, 
  onDuplicate, 
  onDelete,
  onClose 
}) => {
  const [sideConfig, setSideConfig] = useState('twoSides');
  const [chairsCount, setChairsCount] = useState(8);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  if (!element || element.type !== 'mesa') return null;
  
  return (
    <div 
      className="seatsIoTooltip absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[250px]"
      style={{
        left: element.posicion.x + (element.width || 100) + 10,
        top: element.posicion.y - 50
      }}
    >
      <div className="space-y-3">
        {/* Configuración de lados */}
        <div className="control">
          <div className="btn-group btn-group-justified flex" role="group">
            <label className={`btn btn-default flex-1 text-center p-2 border rounded-l cursor-pointer ${sideConfig === 'oneSide' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              <input 
                type="radio" 
                name="sideOptions" 
                value="oneSide"
                checked={sideConfig === 'oneSide'}
                onChange={(e) => {
                  setSideConfig(e.target.value);
                  onSideChange(e.target.value);
                }}
                className="hidden"
              />
              <i className="palco4icon-table-square-one-lateral text-lg">⊓</i>
            </label>
            <label className={`btn btn-default flex-1 text-center p-2 border cursor-pointer ${sideConfig === 'twoSidesLateral' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              <input 
                type="radio" 
                name="sideOptions" 
                value="twoSidesLateral"
                checked={sideConfig === 'twoSidesLateral'}
                onChange={(e) => {
                  setSideConfig(e.target.value);
                  onSideChange(e.target.value);
                }}
                className="hidden"
              />
              <i className="palco4icon-table-square-lateral text-lg">⊔</i>
            </label>
            <label className={`btn btn-default flex-1 text-center p-2 border rounded-r cursor-pointer ${sideConfig === 'twoSides' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              <input 
                type="radio" 
                name="sideOptions" 
                value="twoSides"
                checked={sideConfig === 'twoSides'}
                onChange={(e) => {
                  setSideConfig(e.target.value);
                  onSideChange(e.target.value);
                }}
                className="hidden"
              />
              <i className="palco4icon-table-square text-lg">□</i>
            </label>
          </div>
        </div>
        
        {/* Control de número de sillas */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon text-blue-600 font-bold">{chairsCount}</i>
              </div>
              <span className="sliderLabel">Sillas</span>
            </div>
            <div className="w-full">
              <Slider
                min={2}
                max={12}
                value={chairsCount}
                onChange={(value) => {
                  setChairsCount(value);
                  onChairsChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Control de ancho */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon palco4icon-width-size text-blue-600">↔</i>
              </div>
              <span className="sliderLabel">Ancho</span>
            </div>
            <div className="w-full">
              <Slider
                min={50}
                max={200}
                value={width}
                onChange={(value) => {
                  setWidth(value);
                  onWidthChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}px`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Control de altura */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon palco4icon-height-size text-blue-600">↕</i>
              </div>
              <span className="sliderLabel">Altura</span>
            </div>
            <div className="w-full">
              <Slider
                min={50}
                max={200}
                value={height}
                onChange={(value) => {
                  setHeight(value);
                  onHeightChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}px`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Control de rotación */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon-replay text-blue-600">🔄</i>
              </div>
              <span className="sliderLabel">Rotación</span>
            </div>
            <div className="w-full">
              <Slider
                min={0}
                max={360}
                value={rotation}
                onChange={(value) => {
                  setRotation(value);
                  onRotationChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}°`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Duplicar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDuplicate}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-copy text-green-600">📋</i>
            </div>
            <span>Duplicar</span>
          </div>
        </div>
        
        {/* Eliminar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDelete}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-delete text-red-600">🗑️</i>
            </div>
            <span>Eliminar</span>
          </div>
        </div>
      </div>
      
      {/* Botón para cerrar */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
};

// Componente MesaRedondaTooltip para mesas circulares
const MesaRedondaTooltip = ({ 
  element, 
  onChairsChange, 
  onOpenSpacesChange, 
  onRadiusChange, 
  onRotationChange, 
  onDuplicate, 
  onDelete,
  onClose 
}) => {
  const [chairsCount, setChairsCount] = useState(6);
  const [openSpaces, setOpenSpaces] = useState(0);
  const [radius, setRadius] = useState(50);
  const [rotation, setRotation] = useState(0);
  
  if (!element || element.type !== 'mesa' || element.shape !== 'circle') return null;
  
  return (
    <div 
      className="seatsIoTooltip absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[250px]"
      style={{
        left: element.posicion.x + (element.radius || 50) + 10,
        top: element.posicion.y - 50
      }}
    >
      <div className="space-y-3">
        {/* Control de número de sillas */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon text-blue-600 font-bold">{chairsCount}</i>
              </div>
              <span className="sliderLabel">Sillas</span>
            </div>
            <div className="w-full">
              <Slider
                min={2}
                max={12}
                value={chairsCount}
                onChange={(value) => {
                  setChairsCount(value);
                  onChairsChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Control de espacios abiertos */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon text-blue-600 font-bold">{openSpaces}</i>
              </div>
              <span className="sliderLabel">Abrir espacios</span>
            </div>
            <div className="w-full">
              <Slider
                min={0}
                max={chairsCount - 1}
                value={openSpaces}
                onChange={(value) => {
                  setOpenSpaces(value);
                  onOpenSpacesChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Control de radio */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon palco4icon-square_shappe text-blue-600">⭕</i>
              </div>
              <span className="sliderLabel">Radio</span>
            </div>
            <div className="w-full">
              <Slider
                min={30}
                max={150}
                value={radius}
                onChange={(value) => {
                  setRadius(value);
                  onRadiusChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}px`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Control de rotación */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon-replay text-blue-600">🔄</i>
              </div>
              <span className="sliderLabel">Rotación</span>
            </div>
            <div className="w-full">
              <Slider
                min={0}
                max={360}
                value={rotation}
                onChange={(value) => {
                  setRotation(value);
                  onRotationChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}°`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Duplicar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDuplicate}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-copy text-green-600">📋</i>
            </div>
            <span>Duplicar</span>
          </div>
        </div>
        
        {/* Eliminar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDelete}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-delete text-red-600">🗑️</i>
            </div>
            <span>Eliminar</span>
          </div>
        </div>
      </div>
      
      {/* Botón para cerrar */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
};

// Componente TextoTooltip para textos
const TextoTooltip = ({ 
  element, 
  onLabelChange, 
  onFontSizeChange, 
  onColorChange, 
  onFrontTextChange, 
  onDuplicate, 
  onDelete,
  onClose 
}) => {
  const [labelValue, setLabelValue] = useState(element?.text || 'Nuevo Texto');
  const [fontSize, setFontSize] = useState(element?.fontSize || 16);
  const [textColor, setTextColor] = useState(element?.fill || '#000000');
  const [frontText, setFrontText] = useState(true);
  
  if (!element || element.type !== 'text') return null;
  
  return (
    <div 
      className="seatsIoTooltip absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[250px]"
      style={{
        left: element.posicion.x + (element.width || 100) + 10,
        top: element.posicion.y - 50
      }}
    >
      <div className="space-y-3">
        {/* Valor de etiqueta */}
        <div className="control text_wrapper">
          <label className="block text-sm font-medium text-gray-700 mb-2">Valor de etiqueta</label>
          <Input
            id="input-text-label"
            className="input_text"
            value={labelValue}
            onChange={(e) => {
              setLabelValue(e.target.value);
              onLabelChange(e.target.value);
            }}
            placeholder="Escribir texto..."
          />
        </div>
        
        {/* Tamaño de fuente */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon palco4icon-font text-blue-600">🔤</i>
              </div>
              <span className="sliderLabel">Tamaño de fuente</span>
            </div>
            <div className="w-full">
              <Slider
                min={8}
                max={72}
                value={fontSize}
                onChange={(value) => {
                  setFontSize(value);
                  onFontSizeChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}px`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Color de los textos */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon-paint text-blue-600">🎨</i>
              </div>
              <span className="sliderLabel">Color de los textos</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  onColorChange(e.target.value);
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500">{textColor}</span>
            </div>
          </div>
        </div>
        
        {/* Poner texto por delante */}
        <div className="control">
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-font text-blue-600">🔤</i>
            </div>
            <Checkbox
              name="checkboxLabel"
              id="checkboxLabel"
              checked={frontText}
              onChange={(e) => {
                setFrontText(e.target.checked);
                onFrontTextChange(e.target.checked);
              }}
            />
            <label className="checkboxLabel text-sm" htmlFor="checkboxLabel">
              Poner texto por delante
            </label>
          </div>
        </div>
        
        {/* Duplicar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDuplicate}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-copy text-green-600">📋</i>
            </div>
            <span>Duplicar</span>
          </div>
        </div>
        
        {/* Eliminar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDelete}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-delete text-red-600">🗑️</i>
            </div>
            <span>Eliminar</span>
          </div>
        </div>
      </div>
      
      {/* Botón para cerrar */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
};

// Componente FormaTooltip para formas
const FormaTooltip = ({ 
  element, 
  onStrokeWidthChange, 
  onStrokeColorChange, 
  onFillColorChange, 
  onDuplicate, 
  onDelete,
  onClose 
}) => {
  const [strokeWidth, setStrokeWidth] = useState(element?.strokeWidth || 2);
  const [strokeColor, setStrokeColor] = useState(element?.stroke || '#8B93A6');
  const [fillColor, setFillColor] = useState(element?.fill || '#FFFFFF');
  
  if (!element || (element.type !== 'circle' && element.type !== 'rect')) return null;
  
  return (
    <div 
      className="seatsIoTooltip absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[250px]"
      style={{
        left: element.posicion.x + (element.width || 100) + 10,
        top: element.posicion.y - 50
      }}
    >
      <div className="space-y-3">
        {/* Anchura del borde */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon-minus text-blue-600">➖</i>
              </div>
              <span className="sliderLabel">Anchura del borde</span>
            </div>
            <div className="w-full">
              <Slider
                min={0}
                max={20}
                value={strokeWidth}
                onChange={(value) => {
                  setStrokeWidth(value);
                  onStrokeWidthChange(value);
                }}
                className="w-full"
                tooltip={{
                  formatter: (value) => `${value}px`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Color del borde */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon-paint text-blue-600">🎨</i>
              </div>
              <span className="sliderLabel">Color del borde</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  onStrokeColorChange(e.target.value);
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500">{strokeColor}</span>
            </div>
          </div>
        </div>
        
        {/* Color de relleno */}
        <div className="control">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="icon-wrapper">
                <i className="palco4icon-paint text-blue-600">🎨</i>
              </div>
              <span className="sliderLabel">Color de relleno</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => {
                  setFillColor(e.target.value);
                  onFillColorChange(e.target.value);
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500">{fillColor}</span>
            </div>
          </div>
        </div>
        
        {/* Duplicar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDuplicate}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-copy text-green-600">📋</i>
            </div>
            <span>Duplicar</span>
          </div>
        </div>
        
        {/* Eliminar */}
        <div className="control hoverEffect cursor-pointer p-2 hover:bg-gray-100 rounded" onClick={onDelete}>
          <div className="flex items-center space-x-2">
            <div className="icon-wrapper">
              <i className="palco4icon palco4icon-delete text-red-600">🗑️</i>
            </div>
            <span>Eliminar</span>
          </div>
        </div>
      </div>
      
      {/* Botón para cerrar */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
};

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
  
  // Funciones básicas
  updateElementProperty,
  updateElementSize,
  duplicarElementos,
  crearSeccion,
  limpiarSeleccion,
  assignZoneToSelected,
  
  // Funciones de fila de asientos
  iniciarFilaAsientos,
  actualizarFilaAsientos,
  finalizarFilaAsientos,
  añadirSillasAFila,
  
  // Funciones existentes
  addMesa,
  addSillasToMesa,
  snapToGrid,
  setActiveMode,
  setNumSillas,
  setSillaShape,
  
  // Funciones para el tooltip
  setElements,
  handleSeatRowSelect,
  
  // Elementos del mapa
  elements,
  
  // Dirección de fila de asientos
  seatRowDirection
}) => {

  // Estados locales para los submenús
  const [showEditar, setShowEditar] = useState(false);
  const [showNumeracion, setShowNumeracion] = useState(false);
  const [showConfiguracion, setShowConfiguracion] = useState(false);
  const [showConfiguracionMesas, setShowConfiguracionMesas] = useState(false);

  // Estados para configuración
  const [mostrarNumeracionFilasWeb, setMostrarNumeracionFilasWeb] = useState(true);
  const [mostrarLineasFilaWeb, setMostrarLineasFilaWeb] = useState(true);
  const [seleccionarMesaCompleta, setSeleccionarMesaCompleta] = useState(true);
  const [comprarMesaNoAsientos, setComprarMesaNoAsientos] = useState(false);

  // Estados para numeración
  const [numeracionAsientosActiva, setNumeracionAsientosActiva] = useState(false);
  const [numeracionFilasMesasActiva, setNumeracionFilasMesasActiva] = useState(false);
  const [formatoNumeracionAsientos, setFormatoNumeracionAsientos] = useState('A1, A2, A3...');
  const [formatoNumeracionFilas, setFormatoNumeracionFilas] = useState('F1, F2, M1, M2...');

  // Estado para el tooltip de fila de asientos
  const [showSeatsIoTooltip, setShowSeatsIoTooltip] = useState(false);
  const [selectedSeatRow, setSelectedSeatRow] = useState(null);

  // Estado para el tooltip de mesas
  const [showMesaTooltip, setShowMesaTooltip] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);

  // ===== MANEJADORES DE EVENTOS =====

  const handleAddMesa = (tipo) => {
    addMesa(tipo);
    message.success(`Mesa ${tipo} agregada`);
  };

  const handleAddText = () => {
    const nuevoTexto = {
      _id: `texto_${Date.now()}`,
      type: 'text',
      text: 'Nuevo Texto',
      posicion: { x: 100, y: 100 },
      fontSize: 16,
      fill: '#000000'
    };
    // Aquí deberías tener una función para agregar elementos
    console.log('Agregar texto:', nuevoTexto);
  };

  const handleAddZonaNoNumerada = () => {
    const nuevaZona = {
      _id: `zona_${Date.now()}`,
      type: 'zona',
      nombre: 'Zona No Numerada',
      posicion: { x: 150, y: 150 },
      width: 200,
      height: 150,
      fill: 'rgba(255, 255, 0, 0.3)',
      stroke: '#FFD700',
      strokeWidth: 2
    };
    console.log('Agregar zona no numerada:', nuevaZona);
  };

  const handleAddForma = (tipo) => {
    const nuevaForma = {
      _id: `forma_${Date.now()}`,
      type: tipo,
      posicion: { x: 200, y: 200 },
      width: 100,
      height: 100,
      fill: 'rgba(0, 123, 255, 0.3)',
      stroke: '#007BFF',
      strokeWidth: 2
    };
    
    if (tipo === 'circle') {
      nuevaForma.radius = 50;
    }
    
    console.log('Agregar forma:', nuevaForma);
  };

  // Función para generar nombres de elementos según el formato activo
  const generarNombreElemento = (tipo, index) => {
    if (tipo === 'silla' && numeracionAsientosActiva) {
      // Generar nombre de silla según formato (ej: A1, A2, B1, B2...)
      const letra = String.fromCharCode(65 + Math.floor(index / 10)); // A, B, C...
      const numero = (index % 10) + 1;
      return `${letra}${numero}`;
    } else if ((tipo === 'mesa' || tipo === 'fila') && numeracionFilasMesasActiva) {
      // Generar nombre de fila/mesa según formato
      if (tipo === 'mesa') {
        return `M${index + 1}`; // M1, M2, M3...
      } else {
        return `F${index + 1}`; // F1, F2, F3...
      }
    }
    return null;
  };

  // Función para actualizar nombres de elementos existentes
  const actualizarNombresElementos = () => {
    if (!numeracionAsientosActiva && !numeracionFilasMesasActiva) return;
    
    setElements(prev => {
      const elementosActualizados = [...prev];
      
      // Contadores para cada tipo
      let contadorSillas = 0;
      let contadorMesas = 0;
      let contadorFilas = 0;
      
      elementosActualizados.forEach(elemento => {
        if (elemento.type === 'silla' && numeracionAsientosActiva) {
          elemento.nombre = generarNombreElemento('silla', contadorSillas);
          contadorSillas++;
        } else if (elemento.type === 'mesa' && numeracionFilasMesasActiva) {
          elemento.nombre = generarNombreElemento('mesa', contadorMesas);
          contadorMesas++;
        } else if (elemento.esFila && numeracionFilasMesasActiva) {
          elemento.nombre = generarNombreElemento('fila', contadorFilas);
          contadorFilas++;
        }
      });
      
      return elementosActualizados;
    });
  };

  // Efecto para actualizar nombres cuando cambia la configuración de numeración
  useEffect(() => {
    actualizarNombresElementos();
  }, [numeracionAsientosActiva, numeracionFilasMesasActiva, formatoNumeracionAsientos, formatoNumeracionFilas]);

  const handleAddFilaAsientos = () => {
    if (activeMode === 'fila-asientos') {
      // Si ya estamos en modo fila, cambiar a modo select
      setActiveMode('select');
      message.info('Modo selección activado - Haz clic en una fila existente para editarla');
    } else {
      // Activar modo fila de asientos
      iniciarFilaAsientos();
      message.info('Modo fila de asientos activado - Haz clic para crear la fila');
    }
  };

  // Funciones para el tooltip de fila de asientos
  const handleSeatRowSelectLocal = (element) => {
    if (element && element.esFila) {
      setSelectedSeatRow(element);
      setShowSeatsIoTooltip(true);
    }
  };

  const handleFlipHorizontal = () => {
    if (!selectedSeatRow) return;
    
    // Obtener todas las sillas de la fila
    const sillasFila = elements.filter(el => 
      el.type === 'silla' && el.filaId === selectedSeatRow.filaId
    );
    
    if (sillasFila.length === 0) return;
    
    // Calcular el centro de la fila
    const centroX = sillasFila.reduce((sum, silla) => sum + silla.posicion.x, 0) / sillasFila.length;
    
    // Voltear horizontalmente cada silla
    const nuevasPosiciones = sillasFila.map(silla => ({
      ...silla,
      posicion: {
        ...silla.posicion,
        x: centroX + (centroX - silla.posicion.x)
      }
    }));
    
    // Actualizar elementos
    setElements(prev => prev.map(el => {
      const sillaActualizada = nuevasPosiciones.find(s => s._id === el._id);
      return sillaActualizada || el;
    }));
    
    message.success('Fila volteada horizontalmente');
  };

  const handleFlipVertical = () => {
    if (!selectedSeatRow) return;
    
    // Obtener todas las sillas de la fila
    const sillasFila = elements.filter(el => 
      el.type === 'silla' && el.filaId === selectedSeatRow.filaId
    );
    
    if (sillasFila.length === 0) return;
    
    // Calcular el centro de la fila
    const centroY = sillasFila.reduce((sum, silla) => sum + silla.posicion.y, 0) / sillasFila.length;
    
    // Voltear verticalmente cada silla
    const nuevasPosiciones = sillasFila.map(silla => ({
      ...silla,
      posicion: {
        ...silla.posicion,
        y: centroY + (centroY - silla.posicion.y)
      }
    }));
    
    // Actualizar elementos
    setElements(prev => prev.map(el => {
      const sillaActualizada = nuevasPosiciones.find(s => s._id === el._id);
      return sillaActualizada || el;
    }));
    
    message.success('Fila volteada verticalmente');
  };

  const handleCurveChange = (curveValue) => {
    if (!selectedSeatRow) return;
    
    // Obtener todas las sillas de la fila
    const sillasFila = elements.filter(el => 
      el.type === 'silla' && el.filaId === selectedSeatRow.filaId
    );
    
    if (sillasFila.length === 0) return;
    
    // Ordenar sillas por posición
    const sillasOrdenadas = [...sillasFila].sort((a, b) => {
      if (seatRowDirection === 'horizontal') {
        return a.posicion.x - b.posicion.x;
      } else {
        return a.posicion.y - b.posicion.y;
      }
    });
    
    // Aplicar curva
    const nuevasPosiciones = sillasOrdenadas.map((silla, index) => {
      const progress = index / (sillasOrdenadas.length - 1); // 0 a 1
      const curveOffset = Math.sin(progress * Math.PI) * (curveValue / 10); // Ajustar intensidad
      
      if (seatRowDirection === 'horizontal') {
        return {
          ...silla,
          posicion: {
            ...silla.posicion,
            y: silla.posicion.y + curveOffset
          }
        };
      } else {
        return {
          ...silla,
          posicion: {
            ...silla.posicion,
            x: silla.posicion.x + curveOffset
          }
        };
      }
    });
    
    // Actualizar elementos
    setElements(prev => prev.map(el => {
      const sillaActualizada = nuevasPosiciones.find(s => s._id === el._id);
      return sillaActualizada || el;
    }));
  };

  const handleDuplicateSeatRow = () => {
    if (!selectedSeatRow) return;
    
    // Obtener todas las sillas de la fila
    const sillasFila = elements.filter(el => 
      el.type === 'silla' && el.filaId === selectedSeatRow.filaId
    );
    
    if (sillasFila.length === 0) return;
    
    // Crear nueva fila duplicada
    const nuevaFilaId = `fila_${Date.now()}`;
    const offset = 50; // Desplazamiento para la nueva fila
    
    const nuevasSillas = sillasFila.map((silla, index) => ({
      ...silla,
      _id: `silla_${Date.now()}_${index}`,
      filaId: nuevaFilaId,
      posicion: {
        x: silla.posicion.x + offset,
        y: silla.posicion.y + offset
      }
    }));
    
    setElements(prev => [...prev, ...nuevasSillas]);
    message.success('Fila duplicada correctamente');
  };

  const handleDeleteSeatRow = () => {
    if (!selectedSeatRow) return;
    
    // Obtener todas las sillas de la fila
    const sillasFila = elements.filter(el => 
      el.type === 'silla' && el.filaId === selectedSeatRow.filaId
    );
    
    if (sillasFila.length === 0) return;
    
    // Eliminar todas las sillas de la fila
    setElements(prev => prev.filter(el => 
      !(el.type === 'silla' && el.filaId === selectedSeatRow.filaId)
    ));
    
    setShowSeatsIoTooltip(false);
    setSelectedSeatRow(null);
    message.success('Fila eliminada correctamente');
  };

  const closeSeatsIoTooltip = () => {
    setShowSeatsIoTooltip(false);
    setSelectedSeatRow(null);
  };

  // Funciones para el tooltip de mesas
  const handleMesaSelect = (element) => {
    if (element && element.type === 'mesa') {
      setSelectedMesa(element);
      setShowMesaTooltip(true);
    }
  };

  const handleMesaSideChange = (sideConfig) => {
    if (!selectedMesa) return;
    
    // Actualizar la configuración de lados de la mesa
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, sideConfig };
      }
      return el;
    }));
    
    message.success(`Configuración de lados cambiada a: ${sideConfig}`);
  };

  const handleMesaChairsChange = (chairsCount) => {
    if (!selectedMesa) return;
    
    // Actualizar el número de sillas de la mesa
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, numSillas: chairsCount };
      }
      return el;
    }));
    
    message.success(`Número de sillas actualizado a: ${chairsCount}`);
  };

  const handleMesaWidthChange = (width) => {
    if (!selectedMesa) return;
    
    // Actualizar el ancho de la mesa
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, width };
      }
      return el;
    }));
  };

  const handleMesaHeightChange = (height) => {
    if (!selectedMesa) return;
    
    // Actualizar la altura de la mesa
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, height };
      }
      return el;
    }));
  };

  const handleMesaRotationChange = (rotation) => {
    if (!selectedMesa) return;
    
    // Actualizar la rotación de la mesa
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, rotation };
      }
      return el;
    }));
  };

  const handleDuplicateMesa = () => {
    if (!selectedMesa) return;
    
    // Crear nueva mesa duplicada
    const nuevaMesa = {
      ...selectedMesa,
      _id: `mesa_${Date.now()}`,
      posicion: {
        x: selectedMesa.posicion.x + 50,
        y: selectedMesa.posicion.y + 50
      }
    };
    
    setElements(prev => [...prev, nuevaMesa]);
    message.success('Mesa duplicada correctamente');
  };

  const handleDeleteMesa = () => {
    if (!selectedMesa) return;
    
    // Eliminar la mesa y sus sillas asociadas
    setElements(prev => prev.filter(el => 
      !(el._id === selectedMesa._id || (el.type === 'silla' && el.parentId === selectedMesa._id))
    ));
    
    setShowMesaTooltip(false);
    setSelectedMesa(null);
    message.success('Mesa eliminada correctamente');
  };

  const closeMesaTooltip = () => {
    setShowMesaTooltip(false);
    setSelectedMesa(null);
  };

  // Funciones para el tooltip de mesas redondas
  const handleMesaRedondaChairsChange = (chairsCount) => {
    if (!selectedMesa) return;
    
    // Actualizar el número de sillas de la mesa redonda
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, numSillas: chairsCount };
      }
      return el;
    }));
    
    message.success(`Número de sillas actualizado a: ${chairsCount}`);
  };

  const handleMesaRedondaOpenSpacesChange = (openSpaces) => {
    if (!selectedMesa) return;
    
    // Actualizar los espacios abiertos de la mesa redonda
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, openSpaces };
      }
      return el;
    }));
    
    message.success(`Espacios abiertos actualizados a: ${openSpaces}`);
  };

  const handleMesaRedondaRadiusChange = (radius) => {
    if (!selectedMesa) return;
    
    // Actualizar el radio de la mesa redonda
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, radius };
      }
      return el;
    }));
  };

  const handleMesaRedondaRotationChange = (rotation) => {
    if (!selectedMesa) return;
    
    // Actualizar la rotación de la mesa redonda
    setElements(prev => prev.map(el => {
      if (el._id === selectedMesa._id) {
        return { ...el, rotation };
      }
      return el;
    }));
  };

  // Funciones para el tooltip de textos
  const handleTextoLabelChange = (labelValue) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    // Actualizar el texto del elemento
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, text: labelValue };
      }
      return el;
    }));
  };

  const handleTextoFontSizeChange = (fontSize) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    // Actualizar el tamaño de fuente del texto
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, fontSize };
      }
      return el;
    }));
  };

  const handleTextoColorChange = (color) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    // Actualizar el color del texto
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, fill: color };
      }
      return el;
    }));
  };

  const handleTextoFrontTextChange = (frontText) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    // Actualizar la propiedad de texto por delante
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, frontText };
      }
      return el;
    }));
  };

  const handleTextoDuplicate = () => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    // Crear nuevo texto duplicado
    const nuevoTexto = {
      ...selectedElement,
      _id: `texto_${Date.now()}`,
      posicion: {
        x: selectedElement.posicion.x + 20,
        y: selectedElement.posicion.y + 20
      }
    };
    
    setElements(prev => [...prev, nuevoTexto]);
    message.success('Texto duplicado correctamente');
  };

  const handleTextoDelete = () => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    // Eliminar el texto
    setElements(prev => prev.filter(el => el._id !== selectedElement._id));
    message.success('Texto eliminado correctamente');
  };

  // Funciones para el tooltip de formas
  const handleFormaStrokeWidthChange = (strokeWidth) => {
    if (!selectedElement || (selectedElement.type !== 'circle' && selectedElement.type !== 'rect')) return;
    
    // Actualizar el ancho del borde de la forma
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, strokeWidth };
      }
      return el;
    }));
  };

  const handleFormaStrokeColorChange = (strokeColor) => {
    if (!selectedElement || (selectedElement.type !== 'circle' && selectedElement.type !== 'rect')) return;
    
    // Actualizar el color del borde de la forma
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, stroke: strokeColor };
      }
      return el;
    }));
  };

  const handleFormaFillColorChange = (fillColor) => {
    if (!selectedElement || (selectedElement.type !== 'circle' && selectedElement.type !== 'rect')) return;
    
    // Actualizar el color de relleno de la forma
    setElements(prev => prev.map(el => {
      if (el._id === selectedElement._id) {
        return { ...el, fill: fillColor };
      }
      return el;
    }));
  };

  const handleFormaDuplicate = () => {
    if (!selectedElement || (selectedElement.type !== 'circle' && selectedElement.type !== 'rect')) return;
    
    // Crear nueva forma duplicada
    const nuevaForma = {
      ...selectedElement,
      _id: `forma_${Date.now()}`,
      posicion: {
        x: selectedElement.posicion.x + 20,
        y: selectedElement.posicion.y + 20
      }
    };
    
    setElements(prev => [...prev, nuevaForma]);
    message.success('Forma duplicada correctamente');
  };

  const handleFormaDelete = () => {
    if (!selectedElement || (selectedElement.type !== 'circle' && selectedElement.type !== 'rect')) return;
    
    // Eliminar la forma
    setElements(prev => prev.filter(el => el._id !== selectedElement._id));
    message.success('Forma eliminada correctamente');
  };

  // Efecto para detectar cambios en selectedElement
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.esFila) {
        // Es una fila de asientos
        handleSeatRowSelectLocal(selectedElement);
        closeMesaTooltip(); // Cerrar tooltip de mesa si está abierto
      } else if (selectedElement.type === 'mesa') {
        // Es una mesa
        if (selectedElement.shape === 'circle') {
          // Mesa redonda
          setSelectedMesa(selectedElement);
          setShowMesaTooltip(true);
          closeSeatsIoTooltip(); // Cerrar tooltip de fila si está abierto
        } else {
          // Mesa rectangular
          handleMesaSelect(selectedElement);
          closeSeatsIoTooltip(); // Cerrar tooltip de fila si está abierto
        }
      } else if (selectedElement.type === 'text') {
        // Es un texto
        closeSeatsIoTooltip(); // Cerrar tooltip de fila si está abierto
        closeMesaTooltip(); // Cerrar tooltip de mesa si está abierto
        // El tooltip de texto se maneja directamente con selectedElement
      } else if (selectedElement.type === 'circle' || selectedElement.type === 'rect') {
        // Es una forma
        closeSeatsIoTooltip();
        closeMesaTooltip();
      } else {
        // Otro tipo de elemento
        closeSeatsIoTooltip();
        closeMesaTooltip();
      }
    } else {
      // No hay elemento seleccionado
      closeSeatsIoTooltip();
      closeMesaTooltip();
    }
  }, [selectedElement]);

  // ===== RENDERIZADO DE SUBMENÚS =====

  const renderSubmenuEditar = () => (
    <div className="ml-4 space-y-2">
      {/* Secciones */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Secciones</span>
        <Button 
          size="small" 
          icon={<ScissorOutlined />}
          onClick={crearSeccion}
          type={activeMode === 'section' ? 'primary' : 'default'}
        >
          Crear
        </Button>
      </div>

      {/* Filas de asientos */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Filas de asientos</span>
        <Button 
          size="small" 
          icon={<UserOutlined />}
          onClick={handleAddFilaAsientos}
          type={activeMode === 'fila-asientos' ? 'primary' : 'default'}
        >
          Crear
        </Button>
      </div>

      {/* Textos */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Textos</span>
        <Button 
          size="small" 
          icon={<FileTextOutlined />}
          onClick={handleAddText}
        >
          Agregar
        </Button>
      </div>

      {/* Zonas no numeradas */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Zonas no numeradas</span>
        <Button 
          size="small" 
          icon={<BorderOutlined />}
          onClick={handleAddZonaNoNumerada}
        >
          Crear
        </Button>
      </div>

      <Divider className="my-2" />

      {/* Formas */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Formas</span>
        
        {/* Elíptico */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Elíptico</span>
          <Button 
            size="small" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleAddForma('circle')}
          >
            Agregar
          </Button>
        </div>

        {/* Rectangular */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rectangular</span>
          <Button 
            size="small" 
            icon={<BorderOutlined />}
            onClick={() => handleAddForma('rect')}
          >
            Agregar
          </Button>
        </div>
      </div>

      <Divider className="my-2" />

      {/* Mesas */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Mesas</span>
        
        {/* Redondo */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Redondo</span>
          <Button 
            size="small" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleAddMesa('circle')}
          >
            Agregar
          </Button>
        </div>

        {/* Rectangular */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rectangular</span>
          <Button 
            size="small" 
            icon={<BorderOutlined />}
            onClick={() => handleAddMesa('rect')}
          >
            Agregar
          </Button>
        </div>

        {/* Forma personalizable */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Forma personalizable</span>
          <Button 
            size="small" 
            icon={<StarOutlined />}
            onClick={() => handleAddMesa('custom')}
          >
            Crear
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSubmenuNumeracion = () => (
    <div className="ml-4 space-y-3">
      {/* Numeración de asientos */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Numeración de asientos</span>
        <div className="flex items-center space-x-2">
          <Switch 
            size="small"
            checked={numeracionAsientosActiva}
            onChange={(checked) => {
              setNumeracionAsientosActiva(checked);
              if (checked) {
                // Activar numeración de asientos
                message.success('Numeración de asientos activada');
                // Aquí podrías agregar lógica para mostrar nombres de sillas
              } else {
                // Desactivar numeración de asientos
                message.info('Numeración de asientos desactivada');
              }
            }}
          />
          <span className="text-xs text-gray-500">Mostrar números</span>
        </div>
        {numeracionAsientosActiva && (
          <div className="space-y-2">
            <Input 
              size="small"
              placeholder="Formato: A1, A2, A3..."
              value={formatoNumeracionAsientos}
              onChange={(e) => setFormatoNumeracionAsientos(e.target.value)}
              className="text-xs"
            />
            <div className="text-xs text-gray-500">
              Las sillas mostrarán nombres según este formato
            </div>
          </div>
        )}
      </div>

      {/* Numeración de filas/mesas */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Numeración de filas/mesas</span>
        <div className="flex items-center space-x-2">
          <Switch 
            size="small"
            checked={numeracionFilasMesasActiva}
            onChange={(checked) => {
              setNumeracionFilasMesasActiva(checked);
              if (checked) {
                // Activar numeración de filas/mesas
                message.success('Numeración de filas/mesas activada');
                // Aquí podrías agregar lógica para mostrar nombres de filas y mesas
              } else {
                // Desactivar numeración de filas/mesas
                message.info('Numeración de filas/mesas desactivada');
              }
            }}
          />
          <span className="text-xs text-gray-500">Mostrar números</span>
        </div>
        {numeracionFilasMesasActiva && (
          <div className="space-y-2">
            <Input 
              size="small"
              placeholder="Formato: F1, F2, M1, M2..."
              value={formatoNumeracionFilas}
              onChange={(e) => setFormatoNumeracionFilas(e.target.value)}
              className="text-xs"
            />
            <div className="text-xs text-gray-500">
              Las filas y mesas mostrarán nombres según este formato
            </div>
          </div>
        )}
      </div>

      {/* Botón para aplicar numeración manualmente */}
      {(numeracionAsientosActiva || numeracionFilasMesasActiva) && (
        <div className="pt-2">
          <Button 
            size="small" 
            type="primary"
            onClick={actualizarNombresElementos}
            className="w-full"
          >
            Aplicar Numeración
          </Button>
          <div className="text-xs text-gray-500 mt-1 text-center">
            Actualiza nombres de elementos existentes
          </div>
        </div>
      )}

      {/* Información del estado actual */}
      {(numeracionAsientosActiva || numeracionFilasMesasActiva) && (
        <div className="pt-2 border-t border-gray-600">
          <div className="text-xs text-gray-400">
            <div className="font-medium mb-1">Estado actual:</div>
            {numeracionAsientosActiva && (
              <div>• Asientos: {formatoNumeracionAsientos}</div>
            )}
            {numeracionFilasMesasActiva && (
              <div>• Filas/Mesas: {formatoNumeracionFilas}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmenuConfiguracion = () => (
    <div className="ml-4 space-y-3">
      {/* Mostrar la numeración de filas en la web */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Mostrar la numeración de filas en la web</span>
        <Switch 
          size="small"
          checked={mostrarNumeracionFilasWeb}
          onChange={setMostrarNumeracionFilasWeb}
        />
      </div>

      {/* Mostrar las líneas de fila en la web */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Mostrar las líneas de fila en la web</span>
        <Switch 
          size="small"
          checked={mostrarLineasFilaWeb}
          onChange={setMostrarLineasFilaWeb}
        />
      </div>
    </div>
  );

  const renderSubmenuConfiguracionMesas = () => (
    <div className="ml-4 space-y-3">
      {/* Seleccionar mesa completa */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Seleccionar mesa completa</span>
        <Switch 
          size="small"
          checked={seleccionarMesaCompleta}
          onChange={setSeleccionarMesaCompleta}
        />
      </div>

      {/* Comprar cada mesa y no sus asientos */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Comprar cada mesa y no sus asientos</span>
        <Switch 
          size="small"
          checked={comprarMesaNoAsientos}
          onChange={setComprarMesaNoAsientos}
        />
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-gray-800 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-center">EDITOR DE MAPA</h2>

      {/* Información de la sala */}
      <div className="bg-gray-700 rounded-lg p-3 mb-4">
        <div className="text-sm text-gray-300">Sala: RD DANCE CLUB MARACAIBO</div>
        <div className="text-sm text-gray-300">Asientos: 245</div>
      </div>

      {/* Seleccionar */}
      <Seccion titulo="Seleccionar" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            type={activeMode === 'select' ? 'primary' : 'default'}
            onClick={() => setActiveMode('select')}
          >
            Seleccionar
          </Button>
          <Button 
            block 
            type={activeMode === 'edit' ? 'primary' : 'default'}
            onClick={() => setActiveMode('edit')}
          >
            Editar
          </Button>
        </div>
      </Seccion>

      {/* Editar */}
      <Seccion titulo="Editar" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            icon={<EditOutlined />}
            onClick={() => setShowEditar(!showEditar)}
            type={showEditar ? 'primary' : 'default'}
          >
            Editar {showEditar ? '▼' : '▶'}
          </Button>
          {showEditar && renderSubmenuEditar()}
        </div>
      </Seccion>

      {/* Numeración */}
      <Seccion titulo="Numeración" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            icon={<NumberOutlined />}
            onClick={() => setShowNumeracion(!showNumeracion)}
            type={showNumeracion ? 'primary' : 'default'}
          >
            Numeración {showNumeracion ? '▼' : '▶'}
          </Button>
          {showNumeracion && renderSubmenuNumeracion()}
        </div>
      </Seccion>

      {/* Zonas */}
      <Seccion titulo="Zonas" className="bg-gray-700">
        <div className="space-y-2">
          <Select
            placeholder="Seleccionar zona"
            className="w-full"
            value={selectedZone?.id}
            onChange={(value) => {
              const zona = zones.find(z => z.id === value);
              // Aquí deberías tener una función para seleccionar zona
              console.log('Zona seleccionada:', zona);
            }}
          >
            {zones.map(zona => (
              <Option key={zona.id} value={zona.id}>
                {zona.nombre}
              </Option>
            ))}
          </Select>
          <Button 
            block 
            onClick={() => assignZoneToSelected(selectedZone?.id)}
            disabled={!selectedZone}
          >
            Asignar zona
          </Button>
        </div>
      </Seccion>

      {/* Calidad */}
      <Seccion titulo="Calidad" className="bg-gray-700">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Ajustar a cuadrícula</span>
            <Button 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={snapToGrid}
            >
              Ajustar
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Limpiar duplicados</span>
            <Button 
              size="small" 
              icon={<ClearOutlined />}
              onClick={limpiarSeleccion}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Seccion>

      {/* Fondo */}
      <Seccion titulo="Fondo" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            icon={<PictureOutlined />}
            onClick={() => console.log('Cambiar fondo')}
          >
            Cambiar fondo
          </Button>
          <Button 
            block 
            icon={<LinkOutlined />}
            onClick={() => console.log('Importar imagen')}
          >
            Importar imagen
          </Button>
        </div>
      </Seccion>

      {/* Configuración */}
      <Seccion titulo="Configuración" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            icon={<SettingOutlined />}
            onClick={() => setShowConfiguracion(!showConfiguracion)}
            type={showConfiguracion ? 'primary' : 'default'}
          >
            Configuración {showConfiguracion ? '▼' : '▶'}
          </Button>
          {showConfiguracion && renderSubmenuConfiguracion()}
        </div>
      </Seccion>

      {/* Configuración mesas */}
      <Seccion titulo="Configuración mesas" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            icon={<TableOutlined />}
            onClick={() => setShowConfiguracionMesas(!showConfiguracionMesas)}
            type={showConfiguracionMesas ? 'primary' : 'default'}
          >
            Configuración mesas {showConfiguracionMesas ? '▼' : '▶'}
          </Button>
          {showConfiguracionMesas && renderSubmenuConfiguracionMesas()}
        </div>
      </Seccion>

      {/* Acciones rápidas */}
      <Seccion titulo="Acciones rápidas" className="bg-gray-700">
        <div className="space-y-2">
          <Button 
            block 
            icon={<CopyOutlined />}
            onClick={duplicarElementos}
            disabled={!selectedElement}
          >
            Duplicar
          </Button>
          <Button 
            block 
            danger
            icon={<DeleteOutlined />}
            onClick={() => console.log('Eliminar elemento')}
            disabled={!selectedElement}
          >
            Eliminar
          </Button>
        </div>
      </Seccion>

      {/* Configuración de sillas */}
      <Seccion titulo="Configuración de sillas" className="bg-gray-700">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-300">Número de sillas</label>
            <Input
              type="number"
              min="1"
              max="20"
              value={numSillas}
              onChange={(e) => setNumSillas(parseInt(e.target.value) || 4)}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-300">Forma de silla</label>
            <Select
              value={sillaShape}
              onChange={setSillaShape}
              className="w-full mt-1"
            >
              <Option value="rect">Rectangular</Option>
              <Option value="circle">Circular</Option>
              <Option value="custom">Personalizada</Option>
            </Select>
          </div>
        </div>
      </Seccion>
      <SeatsIoTooltip
        element={selectedSeatRow}
        onFlipHorizontal={handleFlipHorizontal}
        onFlipVertical={handleFlipVertical}
        onCurveChange={handleCurveChange}
        onDuplicate={handleDuplicateSeatRow}
        onDelete={handleDeleteSeatRow}
        onClose={closeSeatsIoTooltip}
      />
      
      <MesaRedondaTooltip
        element={selectedMesa}
        onChairsChange={handleMesaRedondaChairsChange}
        onOpenSpacesChange={handleMesaRedondaOpenSpacesChange}
        onRadiusChange={handleMesaRedondaRadiusChange}
        onRotationChange={handleMesaRedondaRotationChange}
        onDuplicate={handleDuplicateMesa}
        onDelete={handleDeleteMesa}
        onClose={closeMesaTooltip}
      />
      
      <TextoTooltip
        element={selectedElement}
        onLabelChange={handleTextoLabelChange}
        onFontSizeChange={handleTextoFontSizeChange}
        onColorChange={handleTextoColorChange}
        onFrontTextChange={handleTextoFrontTextChange}
        onDuplicate={handleTextoDuplicate}
        onDelete={handleTextoDelete}
        onClose={() => {}} // No necesitamos cerrar el tooltip de texto manualmente
      />

      {selectedElement && (selectedElement.type === 'circle' || selectedElement.type === 'rect') && (
        <FormaTooltip
          element={selectedElement}
          onStrokeWidthChange={handleFormaStrokeWidthChange}
          onStrokeColorChange={handleFormaStrokeColorChange}
          onFillColorChange={handleFormaFillColorChange}
          onDuplicate={handleFormaDuplicate}
          onDelete={handleFormaDelete}
          onClose={() => {}}
        />
      )}
    </div>
  );
};

export default MenuMapa;
