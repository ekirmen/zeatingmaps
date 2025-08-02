import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Stage, Layer, Circle, Rect, Text, Label, Tag } from "react-konva";
import { useSeatLockStore } from "../../../components/seatLockStore";
import { message } from "antd"; // Added message import

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
      posicion: silla.posicion,
      zona: silla.zona,
      estado: silla.estado
    });
    
    const seatZonaId =
      typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
    const isAvailable = availableZonas?.includes(seatZonaId);
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
      
      // Verificar si el asiento está bloqueado por otro usuario
      if (isLocked && !isLockedByMe) {
        console.log("Asiento bloqueado por otro usuario");
        message.warning('Este asiento está bloqueado por otro usuario');
        return;
      }
      
      // Verificar si el asiento está vendido o reservado
      if (silla.estado === 'pagado' || silla.estado === 'reservado') {
        console.log("Asiento ya vendido o reservado");
        message.warning('Este asiento ya está vendido o reservado');
        return;
      }
      
      onSeatClick(silla, mesa);
    };

    const handleMouseEnter = () => {
      if (canSelect) {
        setTooltip({
          visible: true,
          x: silla.posicion.x + 20,
          y: silla.posicion.y - 10,
          text: `${silla.nombre} - ${silla.estado}`,
        });
      }
    };

    const handleMouseLeave = () => {
      setTooltip({ visible: false, x: 0, y: 0, text: "" });
    };

    return (
      <Circle
        key={silla._id}
        x={silla.posicion.x}
        y={silla.posicion.y}
        radius={silla.width ? silla.width / 2 : 10}
        fill={fill}
        stroke={isLocked ? "#dc2626" : "#374151"}
        strokeWidth={isLocked ? 3 : 1}
        opacity={canSelect ? 1 : 0.5}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTap={handleClick}
      />
    );
  }, [availableZonas, abonoMode, abonoSeats, selectedZonaId, tempBlocks, colorMap, isSeatLocked, isSeatLockedByMe, onSeatClick]);

  const renderTable = useCallback((mesa) => {
    const TableShape = mesa.type === "circle" ? Circle : Rect;
    const availableSeats = mesa.sillas.filter(silla => {
      const seatZonaId = typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
      const isAvailable = availableZonas?.includes(seatZonaId) || !availableZonas;
      const isAbono = abonoMode && abonoSeats.includes(silla._id);
      const abonoRestriction = abonoMode && abonoSeats.length > 0 ? isAbono : true;
      return silla.estado === 'disponible' && isAvailable && abonoRestriction;
    });

    return (
      <React.Fragment key={mesa._id}>
        {/* Renderizar mesa/zona solo si no es tipo 'zona' */}
        {mesa.type !== 'zona' && (
          <>
            <TableShape
              x={mesa.posicion.x}
              y={mesa.posicion.y}
              width={mesa.width}
              height={mesa.height}
              radius={mesa.type === "circle" ? mesa.width / 2 : 0}
              fill={hoveredTable === mesa._id ? "#f3f4f6" : "#ffffff"}
              stroke={hoveredTable === mesa._id ? "#3b82f6" : "#4b5563"}
              strokeWidth={hoveredTable === mesa._id ? 3 : 2}
              onMouseEnter={() => setHoveredTable(mesa._id)}
              onMouseLeave={() => setHoveredTable(null)}
            />
            <Text
              x={mesa.posicion.x - 20}
              y={mesa.posicion.y - 10}
              text={mesa.nombre}
              fontSize={scale < 1 ? 10 : 12}
              fill="#374151"
              fontStyle="bold"
            />
          </>
        )}
        
        {/* Renderizar asientos */}
        {mesa.sillas.map((silla) => renderSeat(silla, mesa))}
        
        {/* Botón "Mesa completa" solo para mesas */}
        {mesa.type !== 'zona' && hoveredTable === mesa._id && availableSeats.length > 0 && onSelectCompleteTable && (
          <Label
            x={mesa.posicion.x + mesa.width / 2 - 40}
            y={mesa.posicion.y + mesa.height + 5}
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
        sillas: mapa.contenido[0].sillas?.length || 0
      } : null
    });
  }

  const stageWidth = window.innerWidth < 640 ? window.innerWidth * 0.95 : window.innerWidth * 0.6;
  const stageHeight = window.innerWidth < 640 ? window.innerHeight * 0.6 : window.innerHeight * 0.7;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Debug temporal - mostrar datos del mapa */}
      {mapa && (
        <div style={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px', 
          fontSize: '12px',
          maxWidth: '300px',
          maxHeight: '200px',
          overflow: 'auto',
          zIndex: 1000
        }}>
          <div><strong>Debug - Datos del mapa:</strong></div>
          <div>Contenido: {mapa.contenido?.length || 0} elementos</div>
          {mapa.contenido?.[0] && (
            <div>
              <div>Primer elemento: {mapa.contenido[0].nombre}</div>
              <div>Asientos: {mapa.contenido[0].sillas?.length || 0}</div>
              {mapa.contenido[0].sillas?.[0] && (
                <div>
                  <div>Primer asiento: {mapa.contenido[0].sillas[0].nombre}</div>
                  <div>Posición: ({mapa.contenido[0].sillas[0].posicion?.x}, {mapa.contenido[0].sillas[0].posicion?.y})</div>
                </div>
              )}
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
