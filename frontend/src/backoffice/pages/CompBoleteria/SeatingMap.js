import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Rect, Text, Label, Tag } from "react-konva";

const SeatingMap = ({
  mapa,
  onSeatClick,
  selectedZona,
  availableZonas,
  blockMode = false,
}) => {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });

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
    const isAvailable = availableZonas?.includes(silla.zona);
    const isSelected = selectedZona && selectedZona._id === silla.zona;

    const colorMap = {
      pagado: "#9ca3af",
      reservado: "#ef4444",
      bloqueado: blockMode ? "red" : "#9ca3af",
      disponible: silla.color || "#60a5fa",
    };

    const baseFill = colorMap[silla.estado] || colorMap["disponible"];
    const fill = isSelected && silla.estado === "disponible" ? "#facc15" : baseFill;
    // When blockMode is active allow selecting any seat regardless of zone
    const canSelect = blockMode || ((isAvailable || isSelected) && silla.estado !== "bloqueado");

    return (
      <Circle
        key={silla._id}
        x={silla.posicion.x}
        y={silla.posicion.y}
        radius={scale < 1 ? 6 : 10}
        fill={fill}
        stroke={isSelected ? "#f97316" : "#1f2937"}
        strokeWidth={isSelected ? 2 : 1}
        onClick={() => {
          if (canSelect) onSeatClick(silla, mesa);
        }}
        onTap={() => {
          if (canSelect) onSeatClick(silla, mesa);
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = canSelect ? "pointer" : "not-allowed";
          setTooltip({
            visible: true,
            x: silla.posicion.x + 10,
            y: silla.posicion.y - 10,
            text: `${silla.nombre} (${silla.estado || "disponible"})`,
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
    return (
      <React.Fragment key={mesa._id}>
        <TableShape
          x={mesa.posicion.x}
          y={mesa.posicion.y}
          width={mesa.width}
          height={mesa.height}
          radius={mesa.type === "circle" ? mesa.width / 2 : 0}
          fill="#ffffff"
          stroke="#4b5563"
          strokeWidth={2}
        />
        <Text
          x={mesa.posicion.x - 20}
          y={mesa.posicion.y - 10}
          text={mesa.nombre}
          fontSize={scale < 1 ? 10 : 12}
          fill="#374151"
          fontStyle="bold"
        />
        {mesa.sillas.map((silla) => renderSeat(silla, mesa))}
      </React.Fragment>
    );
  };

  const stageWidth = window.innerWidth < 640 ? window.innerWidth * 0.95 : window.innerWidth * 0.6;
  const stageHeight = window.innerWidth < 640 ? window.innerHeight * 0.6 : window.innerHeight * 0.7;

  return (
    <div className="seating-map mx-auto p-2 bg-white rounded-lg shadow-md w-full max-w-screen-lg h-[60vh] sm:h-[70vh]">
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
