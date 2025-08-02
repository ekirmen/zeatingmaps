import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Rect, Text, Label, Tag } from "react-konva";
import { useSeatLockStore } from "../../../components/seatLockStore";

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

  const handleDragEnd = (e) => {
    setPosition(e.target.position());
  };

  const renderSeat = (silla, mesa) => {
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
    const selectedZonaId = selectedZona ? selectedZona._id || selectedZona.id : null;
    const isSelected = selectedZonaId && selectedZonaId === seatZonaId;

    // Mejorar la lógica de colores para mostrar claramente los asientos disponibles
    const colorMap = {
      pagado: "#9ca3af",
      reservado: "#ef4444",
      anulado: "#9ca3af",
      bloqueado: "#dc2626", // Rojo para asientos bloqueados
      disponible: silla.color || "#60a5fa",
    };

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
    
    // En modo bloqueo, solo permitir seleccionar asientos disponibles (no vendidos, reservados o anulados)
    const canSelect = blockMode 
      ? silla.estado === 'disponible' || silla.estado === 'bloqueado'
      : ((isAvailable || isSelected) && silla.estado !== "bloqueado" && abonoRestriction);

    return (
      <Circle
        key={silla._id}
        x={silla.posicion.x}
        y={silla.posicion.y}
        radius={scale < 1 ? 6 : 10}
        fill={fill}
        stroke={isAbono ? "#4ade80" : isSelected ? "#f97316" : "#1f2937"}
        strokeWidth={isSelected || isAbono ? 2 : 1}
        onClick={() => {
          if (canSelect) onSeatClick(silla, mesa);
        }}
        onTap={() => {
          if (canSelect) onSeatClick(silla, mesa);
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = canSelect ? "pointer" : "not-allowed";
          
                     // Mejorar el tooltip con información de zona y bloqueo
           const zonaInfo = typeof silla.zona === "object" ? silla.zona.nombre : silla.zona;
           const statusInfo = silla.estado || "disponible";
           const availabilityInfo = canSelect ? "Disponible" : "No disponible";
           const lockInfo = isSeatLocked(silla._id) ? "\n🔒 Bloqueado por otro usuario" : "";
           
           setTooltip({
             visible: true,
             x: silla.posicion.x + 10,
             y: silla.posicion.y - 10,
             text: `${silla.nombre}\nZona: ${zonaInfo}\nEstado: ${statusInfo}\n${availabilityInfo}${lockInfo}`,
           });
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "default";
          setTooltip({ ...tooltip, visible: false });
        }}
      />
    );
  };

  const renderTable = (mesa) => {
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
            y={mesa.posicion.y - 30}
          >
            <Tag
              fill="#3b82f6"
              opacity={0.9}
              cornerRadius={4}
              padding={4}
            />
            <Text
              text="Mesa completa"
              fontSize={10}
              fill="white"
              padding={4}
              onClick={() => onSelectCompleteTable(mesa)}
              onTap={() => onSelectCompleteTable(mesa)}
            />
          </Label>
        )}
      </React.Fragment>
    );
  };

  const stageWidth = window.innerWidth < 640 ? window.innerWidth * 0.95 : window.innerWidth * 0.6;
  const stageHeight = window.innerWidth < 640 ? window.innerHeight * 0.6 : window.innerHeight * 0.7;

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

  return (
    <div
      ref={containerRef}
      className="seating-map mx-auto p-2 bg-white rounded-lg shadow-md w-full max-w-screen-lg h-[60vh] sm:h-[70vh]"
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        draggable
        onDragEnd={handleDragEnd}
        scale={{ x: scale, y: scale }}
        position={position}
        style={{ touchAction: "none" }}
      >
        <Layer>
          {mapa?.contenido.map(renderTable)}
          {tooltip.visible && (
            <Label x={tooltip.x} y={tooltip.y}>
              <Tag fill="black" opacity={0.75} cornerRadius={4} />
              <Text text={tooltip.text} fontSize={12} fill="white" padding={4} />
            </Label>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default SeatingMap;
