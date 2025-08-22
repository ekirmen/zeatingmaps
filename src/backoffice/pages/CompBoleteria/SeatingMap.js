import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Stage, Layer, Circle, Rect, Text, Label, Tag } from "react-konva";
import { useSeatLockStore } from "../../../components/seatLockStore";
import { message } from "antd"; // Added message import
import { Button, Popover } from "antd"; // Added Button and Popover imports
import { ZoomInOutlined, ZoomOutOutlined, InfoCircleOutlined } from "@ant-design/icons"; // Added icons

const SeatingMap = ({
  mapa,
  onSeatClick,
  selectedZona,
  availableZonas,
  blockMode = false,
  abonoMode = false,
  abonoSeats = [],
  tempBlocks = [],
  containerRef,
  onSelectCompleteTable, // Nueva prop para seleccionar mesa completa
}) => {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [hoveredTable, setHoveredTable] = useState(null);
  const [showSeatLegend, setShowSeatLegend] = useState(false);
  
  // Obtener funciones de seat lock
  const { isSeatLocked, isSeatLockedByMe } = useSeatLockStore();

  // Memoizar el mapa de colores para evitar re-creación
  const colorMap = useMemo(() => ({
    pagado: "#9ca3af",
    reservado: "#ef4444",
    anulado: "#9ca3af",
    bloqueado: "#dc2626", // Rojo para asientos bloqueados
    disponible: "#60a5fa",
  }), []);

  // Memoizar el ID de la zona seleccionada
  const selectedZonaId = useMemo(() => 
    selectedZona ? selectedZona._id || selectedZona.id : null,
    [selectedZona]
  );

  useEffect(() => {
    const stage = stageRef.current;
    const container = stage?.container();

    const handleWheel = (e) => {
      e.preventDefault();
      const scaleBy = 1.1;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const newScale = Math.min(Math.max(e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.5), 5);

      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    };

    container?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container?.removeEventListener("wheel", handleWheel);
    };
  }, [scale, position]);

  const handleDragEnd = useCallback((e) => {
    setPosition(e.target.position());
  }, []);

  const renderSeat = useCallback((silla, mesa) => {
    // Debug: Log de cada asiento que se intenta renderizar
    console.log('🪑 Renderizando asiento:', {
      id: silla._id,
      nombre: silla.nombre,
      numero: silla.numero,
      posicion: silla.posicion,
      zona: silla.zona,
      estado: silla.estado
    });
    
    // Obtener coordenadas de la silla
    const sillaX = silla.posicion?.x || silla.x || 0;
    const sillaY = silla.posicion?.y || silla.y || 0;
    const sillaRadius = silla.radius || 10;
    
    const seatZonaId =
      typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
    // En modo bloqueo, permitir selección de cualquier asiento disponible
    // Si no hay zonas disponibles o no hay zonas configuradas, permitir todos los asientos
    const isAvailable = blockMode ? true : 
      (availableZonas && availableZonas.length > 0) ? 
        (availableZonas.includes(seatZonaId) || !seatZonaId) : 
        true; // Si no hay zonas configuradas, permitir todos los asientos
    
    // Debug: Log de la lógica de disponibilidad
    console.log('🎯 [renderSeat] Lógica de disponibilidad:', {
      sillaId: silla._id,
      seatZonaId,
      availableZonas,
      availableZonasLength: availableZonas?.length || 0,
      isAvailable,
      blockMode,
      abonoMode
    });
    
    const isAbono = abonoMode && abonoSeats.includes(silla._id);
    const isSelected = selectedZonaId && selectedZonaId === seatZonaId;

    // Mejorar la lógica de colores para mostrar claramente los asientos disponibles
    const isTempBlock = tempBlocks.includes(silla._id);
    let baseFill = isTempBlock ? "red" : colorMap[silla.estado] || colorMap["disponible"];
    
    // Si hay una zona seleccionada, mostrar en gris los asientos de otras zonas
    if (selectedZonaId && seatZonaId !== selectedZonaId && silla.estado === "disponible") {
      baseFill = "#d1d5db"; // Gris claro para asientos no disponibles
    }
    
    const fill = isSelected && silla.estado === "disponible" && !isTempBlock ? "#facc15" : baseFill;
    
    // When blockMode is active allow selecting any seat regardless of zone
    // When abonoMode is active but the list of available seats failed to load
    // allow selection by default. Only restrict when abonoSeats has entries.
    const abonoRestriction = abonoMode && abonoSeats.length > 0 ? isAbono : true;
    const canSelect = silla.estado === "disponible" && (isAvailable || !availableZonas) && abonoRestriction;

    const isLocked = isSeatLocked(silla._id);
    const isLockedByMe = isSeatLockedByMe(silla._id);

    const handleClick = () => {
      if (!canSelect) return;
      
      if (isLocked && !isLockedByMe) {
        message.warning("Este asiento está bloqueado por otro usuario");
        return;
      }
      
      if (onSeatClick) {
        onSeatClick(silla, mesa);
      }
    };

    const handleMouseEnter = () => {
      const tooltipText = `${silla.nombre || silla.numero || 'Asiento'} - ${silla.estado || 'disponible'}`;
      setTooltip({
        visible: true,
        x: sillaX + 20,
        y: sillaY - 20,
        text: tooltipText
      });
    };

    const handleMouseLeave = () => {
      setTooltip({ visible: false, x: 0, y: 0, text: "" });
    };

    return (
      <Circle
        key={silla._id}
        x={sillaX}
        y={sillaY}
        radius={sillaRadius}
        fill={fill}
        stroke={isLockedByMe ? "#f59e0b" : isSelected ? "#000" : "#1976D2"}
        strokeWidth={isSelected || isLockedByMe ? 3 : 1}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        listening={canSelect}
        opacity={isLocked && !isLockedByMe ? 0.5 : 1}
      />
    );
  }, [availableZonas, abonoMode, abonoSeats, selectedZonaId, tempBlocks, colorMap, isSeatLocked, isSeatLockedByMe, onSeatClick]);

  const renderTable = useCallback((mesa) => {
    // Debug: Log de cada mesa que se intenta renderizar
    console.log('🪑 Renderizando mesa:', {
      id: mesa._id,
      nombre: mesa.nombre,
      tipo: mesa.type,
      shape: mesa.shape,
      posicion: mesa.posicion,
      sillas: mesa.sillas?.length || 0
    });

    // Determinar si es una mesa válida
    const isTable = mesa.type === 'mesa' || mesa.shape || (mesa.sillas && mesa.sillas.length > 0);
    
    // Obtener coordenadas de la mesa
    const mesaX = mesa.posicion?.x || mesa.x || 0;
    const mesaY = mesa.posicion?.y || mesa.y || 0;
    const mesaWidth = mesa.width || 120;
    const mesaHeight = mesa.height || 80;
    const mesaRadius = mesa.radius || (mesa.shape === 'circle' ? Math.min(mesaWidth, mesaHeight) / 2 : 0);

    // Determinar la forma de la mesa
    const TableShape = mesa.shape === 'circle' ? Circle : Rect;
    const tableProps = mesa.shape === 'circle' ? {
      x: mesaX + mesaWidth / 2,
      y: mesaY + mesaHeight / 2,
      radius: mesaRadius,
      isTable
    } : {
      x: mesaX,
      y: mesaY,
      width: mesaWidth,
      height: mesaHeight,
      isTable
    };

    const availableSeats = mesa.sillas?.filter(silla => {
      const seatZonaId = typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
      const isAvailable = availableZonas?.includes(seatZonaId) || !availableZonas;
      const isAbono = abonoMode && abonoSeats.includes(silla._id);
      const abonoRestriction = abonoMode && abonoSeats.length > 0 ? isAbono : true;
      return silla.estado === 'disponible' && isAvailable && abonoRestriction;
    }) || [];

    return (
      <React.Fragment key={mesa._id}>
        {/* Renderizar mesa si tiene sillas o es una mesa válida */}
        {isTable && (
          <>
            <TableShape
              {...tableProps}
              fill={hoveredTable === mesa._id ? "#f3f4f6" : "#ffffff"}
              stroke={hoveredTable === mesa._id ? "#3b82f6" : "#4b5563"}
              strokeWidth={hoveredTable === mesa._id ? 3 : 2}
              onMouseEnter={() => setHoveredTable(mesa._id)}
              onMouseLeave={() => setHoveredTable(null)}
            />
            <Text
              x={mesaX - 20}
              y={mesaY - 10}
              text={mesa.nombre || `Mesa ${mesa._id}`}
              fontSize={scale < 1 ? 10 : 12}
              fill="#374151"
              fontStyle="bold"
            />
          </>
        )}
        
        {/* Renderizar asientos */}
        {mesa.sillas && mesa.sillas.map((silla) => renderSeat(silla, mesa))}
        
        {/* Botón "Mesa completa" solo para mesas */}
        {isTable && hoveredTable === mesa._id && availableSeats.length > 0 && onSelectCompleteTable && (
          <Label
            x={mesaX + mesaWidth / 2 - 40}
            y={mesaY + mesaHeight + 5}
          >
            <Tag fill="#3b82f6" opacity={0.9} />
            <Text
              text="Mesa completa"
              fontSize={10}
              fill="white"
              padding={5}
              onClick={() => onSelectCompleteTable(mesa)}
            />
          </Label>
        )}
      </React.Fragment>
    );
  }, [availableZonas, abonoMode, abonoSeats, hoveredTable, scale, renderSeat, onSelectCompleteTable]);

  // Debug: Log del mapa recibido
  console.log('🎨 SeatingMap recibió:', {
    mapa: mapa ? 'Sí' : 'No',
    contenido: mapa?.contenido?.length || 0,
    zonas: mapa?.contenido?.map(z => ({
      id: z._id,
      nombre: z.nombre,
      asientos: z.sillas?.length || 0
    })) || []
  });

  // Debug adicional para verificar si el mapa tiene contenido válido
  if (mapa?.contenido) {
    console.log('🔍 Detalle del contenido del mapa:', {
      tipo: typeof mapa.contenido,
      esArray: Array.isArray(mapa.contenido),
      longitud: mapa.contenido.length,
      primerElemento: mapa.contenido[0] ? {
        id: mapa.contenido[0]._id,
        nombre: mapa.contenido[0].nombre,
        tipo: mapa.contenido[0].type,
        shape: mapa.contenido[0].shape,
        sillas: mapa.contenido[0].sillas?.length || 0,
        posicion: mapa.contenido[0].posicion || mapa.contenido[0].x ? { x: mapa.contenido[0].x, y: mapa.contenido[0].y } : null
      } : null
    });
    
    // Debug detallado de cada elemento
    mapa.contenido.forEach((elemento, index) => {
      console.log(`🔍 Elemento ${index + 1}:`, {
        id: elemento._id,
        nombre: elemento.nombre,
        tipo: elemento.type,
        shape: elemento.shape,
        posicion: elemento.posicion,
        x: elemento.x,
        y: elemento.y,
        width: elemento.width,
        height: elemento.height,
        radius: elemento.radius,
        sillas: elemento.sillas ? {
          cantidad: elemento.sillas.length,
          primerSilla: elemento.sillas[0] ? {
            id: elemento.sillas[0]._id,
            nombre: elemento.sillas[0].nombre,
            numero: elemento.sillas[0].numero,
            posicion: elemento.sillas[0].posicion,
            x: elemento.sillas[0].x,
            y: elemento.sillas[0].y,
            estado: elemento.sillas[0].estado
          } : null
        } : null
      });
    });
    
    // Contar total de asientos
    const totalAsientos = mapa.contenido.reduce((total, elemento) => {
      return total + (elemento.sillas?.length || 0);
    }, 0);
    
    console.log(`🎯 [SeatingMap] Total de asientos en el mapa: ${totalAsientos}`);
    
    if (totalAsientos === 0) {
      console.warn('⚠️ [SeatingMap] ¡ADVERTENCIA! No se encontraron asientos en el mapa');
    }
  }

  const stageWidth = window.innerWidth < 640 ? window.innerWidth * 0.95 : window.innerWidth * 0.6;
  const stageHeight = window.innerWidth < 640 ? window.innerHeight * 0.6 : window.innerHeight * 0.7;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button
          type="primary"
          size="small"
          onClick={() => setScale(scale + 0.2)}
          icon={<ZoomInOutlined />}
        />
        <Button
          type="primary"
          size="small"
          onClick={() => setScale(Math.max(0.5, scale - 0.2))}
          icon={<ZoomOutOutlined />}
        />
        <Button
          type="default"
          size="small"
          onClick={() => setScale(1)}
        >
          Reset
        </Button>
        
        {/* Menú informativo de Estado de Asientos */}
        <Popover
          content={
            <div className="p-3 space-y-2 min-w-48">
              <div className="font-semibold text-sm border-b pb-2 mb-2">Estado de Asientos</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Seleccionado por mí</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Bloqueado por mí</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs">Bloqueado por otro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs">Vendido/Reservado</span>
                </div>
              </div>
            </div>
          }
          title="Leyenda de Estados"
          trigger="hover"
          placement="left"
        >
          <Button
            type="default"
            size="small"
            icon={<InfoCircleOutlined />}
            className="w-full"
          >
            Estado de Asientos
          </Button>
        </Popover>
      </div>

      {/* Debug temporal - mostrar datos del mapa */}
      {mapa && (
        <div style={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          background: 'rgba(0,0,0,0.9)', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          fontSize: '12px',
          maxWidth: '500px',
          maxHeight: '400px',
          overflow: 'auto',
          zIndex: 1000,
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '10px', borderBottom: '1px solid #666', paddingBottom: '5px' }}>
            <strong>�� DEBUG - Estructura del Mapa</strong>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>📊 Información General:</strong>
          </div>
          <div>• ID del mapa: {mapa.id}</div>
          <div>• Nombre: {mapa.nombre}</div>
          <div>• Sala ID: {mapa.sala_id}</div>
          <div>• Tenant ID: {mapa.tenant_id}</div>
          
          <div style={{ marginTop: '10px', marginBottom: '8px' }}>
            <strong>🏷️ Zonas Disponibles:</strong>
          </div>
          <div>• Zonas configuradas: {availableZonas?.length || 0}</div>
          <div>• Zona seleccionada: {selectedZonaId || 'Ninguna'}</div>
          <div>• Modo bloqueo: {blockMode ? '✅ Activado' : '❌ Desactivado'}</div>
          <div>• Modo abono: {abonoMode ? '✅ Activado' : '❌ Desactivado'}</div>
          
          <div style={{ marginTop: '10px', marginBottom: '8px' }}>
            <strong>📋 Contenido del Mapa:</strong>
          </div>
          <div>• Tipo: {typeof mapa.contenido}</div>
          <div>• Es array: {Array.isArray(mapa.contenido) ? '✅ Sí' : '❌ No'}</div>
          <div>• Elementos: {mapa.contenido?.length || 0}</div>
          
          {/* Contar total de asientos */}
          {mapa.contenido && Array.isArray(mapa.contenido) && (
            <div style={{ marginTop: '8px', padding: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>
                🎯 Total de Asientos: {mapa.contenido.reduce((total, elemento) => total + (elemento.sillas?.length || 0), 0)}
              </div>
            </div>
          )}

          {mapa.contenido && Array.isArray(mapa.contenido) && mapa.contenido.map((item, index) => (
            <div key={index} style={{ 
              marginTop: '12px', 
              padding: '8px', 
              border: '1px solid #666', 
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontWeight: 'bold', color: '#4ade80' }}>
                🎯 Elemento {index + 1}:
              </div>
              <div>• ID: {item._id || 'Sin ID'}</div>
              <div>• Nombre: {item.nombre || 'Sin nombre'}</div>
              <div>• Tipo: {item.type || 'Sin tipo'}</div>
              <div>• Shape: {item.shape || 'Sin shape'}</div>
              <div>• Posición: ({item.posicion?.x || item.x || 'N/A'}, {item.posicion?.y || item.y || 'N/A'})</div>
              <div>• Dimensiones: {item.width || 'N/A'} x {item.height || 'N/A'}</div>
              <div>• Radio: {item.radius || 'N/A'}</div>
              <div>• Sillas: {item.sillas?.length || 0}</div>
              
              {item.sillas && item.sillas.length > 0 && (
                <div style={{ marginLeft: '15px', marginTop: '8px', padding: '5px', border: '1px solid #444', borderRadius: '3px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>🪑 Primeras 3 sillas:</div>
                  {item.sillas.slice(0, 3).map((silla, sillaIndex) => (
                    <div key={sillaIndex} style={{ marginLeft: '10px', fontSize: '11px' }}>
                      • Silla {sillaIndex + 1}: ID={silla._id}, Nombre={silla.nombre || silla.numero}, 
                      Pos=({silla.posicion?.x || silla.x}, {silla.posicion?.y || silla.y}), 
                      Estado={silla.estado || 'N/A'}
                    </div>
                  ))}
                  {item.sillas.length > 3 && (
                    <div style={{ marginLeft: '10px', fontSize: '11px', color: '#9ca3af' }}>
                      ... y {item.sillas.length - 3} sillas más
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {(!mapa.contenido || !Array.isArray(mapa.contenido)) && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px', 
              border: '1px solid #ef4444', 
              borderRadius: '4px',
              background: 'rgba(239,68,68,0.2)',
              color: '#fca5a5'
            }}>
              ⚠️ El contenido del mapa no es un array válido
            </div>
          )}
        </div>
      )}

      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {mapa?.contenido?.map(renderTable)}
          
          {/* Tooltip */}
          {tooltip.visible && (
            <Label x={tooltip.x} y={tooltip.y}>
              <Tag fill="#1f2937" opacity={0.9} />
              <Text
                text={tooltip.text}
                fontSize={12}
                fill="white"
                padding={5}
              />
            </Label>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default SeatingMap;
