import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Text, Ellipse, Line } from 'react-konva';
import { Mesa, Silla } from './compMapa/MesaSilla';
import Grid from './compMapa/Grid';
import Zonas from './compMapa/Zonas';
import Menu from './compMapa/MenuMapa';
import EditPopup from './compMapa/EditPopup';
import { useCrearMapa } from '../hooks/useCrearMapa';
import { useMapaZoomStage } from '../hooks/useMapaZoomStage';
import { fetchZonasPorSala, updateMesa } from '../services/apibackoffice';

const CrearMapa = () => {
  const { salaId } = useParams();

  const {
    elements, setElements,
    selectedIds,
    showZones, setShowZones,
    selectedZone, setSelectedZone,
    selectedElement,
    setSelectedElement,
    numSillas, setNumSillas,
    zoom, setZoom,
    stageRef,
    selectionRect,

    addMesa,
    addSillasToMesa,
    selectElement,
    updateElementProperty,
    updateElementSize,
    zoomIn,
    zoomOut,
    handleSave,
    assignZoneToSelected,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    deleteSelectedElements,
    addTextElement,
    addRectangleElement,
    addEllipseElement,
    addLineElement,
    addChairRow,
    snapToGrid,
  } = useCrearMapa();

  const { stageSize, handleWheelZoom } = useMapaZoomStage(zoom, setZoom);

  const [sillaShape, setSillaShape] = useState('rect');
  const [loadedZonas, setLoadedZonas] = useState([]);
  const [loadingZonas, setLoadingZonas] = useState(false);

  const [addingChairRow, setAddingChairRow] = useState(false);
  const [rowStart, setRowStart] = useState(null);

  useEffect(() => {
    if (!salaId) return;
    const cargarZonas = async () => {
      setLoadingZonas(true);
      try {
        const zonasData = await fetchZonasPorSala(salaId);
        setLoadedZonas(zonasData);
      } catch (err) {
        console.error('Error al cargar zonas:', err);
      } finally {
        setLoadingZonas(false);
      }
    };
    cargarZonas();
  }, [salaId]);

  const moverElementosSeleccionados = (deltaX, deltaY) => {
    setElements(prev =>
      prev.map(el => {
        if (selectedIds.includes(el._id) || (el.type === 'silla' && selectedIds.includes(el.parentId))) {
          return {
            ...el,
            posicion: {
              x: el.posicion.x + deltaX,
              y: el.posicion.y + deltaY,
            }
          };
        }
        return el;
      })
    );
  };

  const onDragEndElement = (e, id, newPos, chairUpdates = []) => {
    const dragged = elements.find(el => el._id === id);
    if (!dragged) return;

    const newX = newPos?.x ?? e.target.x();
    const newY = newPos?.y ?? e.target.y();

    // Si el elemento forma parte de la selección, mover todos los seleccionados
    if (selectedIds.includes(id)) {
      const deltaX = newX - dragged.posicion.x;
      const deltaY = newY - dragged.posicion.y;
      moverElementosSeleccionados(deltaX, deltaY);
    } else {
      // Si no está seleccionado, solo actualizamos su posición
      updateElementProperty(id, 'posicion', { x: newX, y: newY });
    }

    // Actualizar posiciones de sillas si se proporcionaron
    if (chairUpdates.length > 0) {
      chairUpdates.forEach(ch =>
        updateElementProperty(ch._id, 'posicion', ch.posicion)
      );
    }

    // La posición se guardará al presionar el botón de guardar
  };

  const startChairRowMode = () => {
    setAddingChairRow(true);
    setRowStart(null);
  };

  const stageMouseDown = (e) => {
    if (addingChairRow) {
      if (!rowStart) {
        const pos = e.target.getStage().getPointerPosition();
        setRowStart(pos);
      }
      return;
    }
    handleMouseDown(e);
  };

  const stageMouseMove = (e) => {
    if (addingChairRow && rowStart) {
      return;
    }
    handleMouseMove(e);
  };

  const stageMouseUp = (e) => {
    if (addingChairRow && rowStart) {
      const pos = e.target.getStage().getPointerPosition();
      addChairRow(rowStart, pos);
      setAddingChairRow(false);
      setRowStart(null);
      return;
    }
    handleMouseUp(e);
  };

  return (
    <div className="flex h-screen">
      <Menu
        addMesa={addMesa}
        addSillasToMesa={addSillasToMesa}
        selectedElement={selectedElement}
        numSillas={numSillas}
        setNumSillas={setNumSillas}
        handleSave={handleSave}
        updateElementProperty={updateElementProperty}
        updateElementSize={updateElementSize}
        zonas={loadedZonas}
        selectedZoneId={selectedZone?._id || ''}
        setSelectedZoneId={(zoneId) => {
          const zona = loadedZonas.find((z) => z._id === zoneId);
          setSelectedZone(zona || null);
        }}
        setShowZones={setShowZones}
        sillaShape={sillaShape}
        setSillaShape={setSillaShape}
        assignZoneToSelected={assignZoneToSelected}
        deleteSelectedElements={deleteSelectedElements}
        addTextElement={addTextElement}
        addRectangleElement={addRectangleElement}
        addEllipseElement={addEllipseElement}
        addLineElement={addLineElement}
        startChairRowMode={startChairRowMode}
        snapToGrid={snapToGrid}
      />

      <div className="flex-1 relative">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={zoom}
          scaleY={zoom}
          onWheel={handleWheelZoom}
          onMouseDown={stageMouseDown}
          onMouseMove={stageMouseMove}
          onMouseUp={stageMouseUp}
        >
          <Layer>
            <Grid width={stageSize.width / zoom} height={stageSize.height / zoom} gridSize={20} />
            {showZones && <Zonas zonas={loadedZonas} />}

            {elements.map((element) => {
              const isSelected = selectedIds.includes(element._id);
              const elementZone = loadedZonas.find(z => z._id === element.zonaId);
              const strokeColor = isSelected ? 'blue' : elementZone?.color || 'black';

              switch (element.type) {
                case 'mesa':
                  return (
                    <Mesa
                      key={element._id}
                      {...element}
                      selected={isSelected}
                      onSelect={selectElement}
                      onDragEnd={onDragEndElement}
                      onChairDragEnd={(e, sillaId) => onDragEndElement(e, sillaId)}
                      zonas={loadedZonas}
                      selectedIds={selectedIds}
                      elements={elements}
                    />
                  );
                case 'text':
                  return (
                    <Text
                      key={element._id}
                      id={element._id}
                      x={element.posicion.x}
                      y={element.posicion.y}
                      text={element.text}
                      fontSize={element.fontSize}
                      fill={element.fill}
                      draggable={element.draggable}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2 : 0}
                      onClick={() => selectElement(element)}
                      onTap={() => selectElement(element)}
                      onDragEnd={(e) => updateElementProperty(element._id, 'posicion', {
                        x: e.target.x(),
                        y: e.target.y(),
                      })}
                    />
                  );
                case 'rect':
                  return (
                    <Rect
                      key={element._id}
                      id={element._id}
                      x={element.posicion.x}
                      y={element.posicion.y}
                      width={element.width}
                      height={element.height}
                      fill={element.fill}
                      stroke={strokeColor}
                      strokeWidth={element.strokeWidth + (isSelected ? 1 : 0)}
                      draggable={element.draggable}
                      onClick={() => selectElement(element)}
                      onTap={() => selectElement(element)}
                      onDragEnd={(e) => updateElementProperty(element._id, 'posicion', {
                        x: e.target.x(),
                        y: e.target.y(),
                      })}
                    />
                  );
                case 'ellipse':
                  return (
                    <Ellipse
                      key={element._id}
                      id={element._id}
                      x={element.posicion.x}
                      y={element.posicion.y}
                      radiusX={element.radiusX}
                      radiusY={element.radiusY}
                      fill={element.fill}
                      stroke={strokeColor}
                      strokeWidth={element.strokeWidth + (isSelected ? 1 : 0)}
                      draggable={element.draggable}
                      onClick={() => selectElement(element)}
                      onTap={() => selectElement(element)}
                      onDragEnd={(e) => updateElementProperty(element._id, 'posicion', {
                        x: e.target.x(),
                        y: e.target.y(),
                      })}
                    />
                  );
                case 'line':
                  return (
                    <Line
                      key={element._id}
                      id={element._id}
                      points={element.points}
                      stroke={strokeColor}
                      strokeWidth={element.strokeWidth + (isSelected ? 1 : 0)}
                      draggable={element.draggable}
                      onClick={() => selectElement(element)}
                      onTap={() => selectElement(element)}
                      onDragEnd={(e) => {
                        const newX = e.target.x();
                        const newY = e.target.y();
                        const deltaX = newX - element.posicion.x;
                        const deltaY = newY - element.posicion.y;
                        const newPoints = element.points.map((p, i) =>
                          i % 2 === 0 ? p + deltaX : p + deltaY
                        );
                        updateElementProperty(element._id, 'posicion', { x: newX, y: newY });
                        updateElementProperty(element._id, 'points', newPoints);
                      }}
                    />
                  );
                case 'silla':
                  return (
                    <Silla
                      key={element._id}
                      _id={element._id}
                      shape={element.shape}
                      x={element.posicion.x}
                      y={element.posicion.y}
                      width={element.width}
                      height={element.height}
                      numero={element.numero}
                      nombre={element.nombre}
                      selected={isSelected}
                      onSelect={selectElement}
                      onDragEnd={onDragEndElement}
                      zonaId={element.zonaId}
                      zonas={loadedZonas}
                    />
                  );
                default:
                  return null;
              }
            })}

            {selectionRect?.visible && (
              <Rect
                x={Math.min(selectionRect.x1, selectionRect.x2)}
                y={Math.min(selectionRect.y1, selectionRect.y2)}
                width={Math.abs(selectionRect.x2 - selectionRect.x1)}
                height={Math.abs(selectionRect.y2 - selectionRect.y1)}
                fill="rgba(0, 0, 255, 0.2)"
                stroke="blue"
                strokeWidth={1}
              />
            )}
          </Layer>
        </Stage>
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            🔍
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            🔎
          </button>
        </div>
        {selectedElement && (
          <EditPopup
            element={selectedElement}
            zoom={zoom}
            onNameChange={updateElementProperty}
            onSizeChange={updateElementSize}
            onDelete={deleteSelectedElements}
            onClose={() => setSelectedElement(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CrearMapa;
