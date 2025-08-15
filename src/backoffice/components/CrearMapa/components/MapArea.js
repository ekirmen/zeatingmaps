import React from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { Input } from 'react-konva';
import { Mesa, Silla } from '../../compMapa/MesaSilla';

const MapArea = ({
  elements,
  selectedElements,
  zoom,
  stagePosition,
  isPanning,
  selectionRect,
  drawingPoints,
  showGrid,
  gridSize,
  numerationMode,
  editingElement,
  editingValue,
  setEditingValue,
  handleElementClick,
  handleElementDragEnd,
  handlePanStart,
  handlePanMove,
  handlePanEnd,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleStageClick,
  handleStageContextMenu,
  startEditing,
  saveEditing,
  cancelEditing,
  renderRowIndicators,
  getSeatColor,
  getZonaColor,
  getBorderColor,
  selectedZone,
  isInZoneMode,
  zonesFromDashboard,
  renderDashboardZones,
  stageRef
}) => {
  // Renderizar elementos del mapa
  const renderElements = () => {
    try {
      let elementsToRender = elements;
      if (isInZoneMode && selectedZone) {
        const zone = elements.find(el => el.id === selectedZone);
        if (zone) {
          elementsToRender = elements.filter(element => {
            if (element.id === selectedZone) return true;
            if (element.type !== 'zone') {
              return element.x >= zone.x &&
                     element.x <= zone.x + zone.width &&
                     element.y >= zone.y &&
                     element.y <= zone.y + zone.height;
            }
            return false;
          });
        }
      }

      return elementsToRender.map((element) => {
        const isSelected = selectedElements.includes(element.id);
        
        switch (element.type) {
          case 'silla':
            return (
              <Group key={element.id}>
                <Silla
                  silla={element}
                  isSelected={isSelected}
                  onClick={() => handleElementClick(element.id)}
                  onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                  getSeatColor={getSeatColor}
                  getZonaColor={getZonaColor}
                  getBorderColor={getBorderColor}
                  showZones={true}
                  selectedZone={selectedZone}
                  showConnections={true}
                  connectionStyle="dashed"
                />
                
                {/* Modo edición de numeración de asientos */}
                {numerationMode === 'seats' && (
                  <Group>
                    <Rect
                      x={element.x - 5}
                      y={element.y - 25}
                      width={element.width + 10}
                      height={20}
                      fill="rgba(255, 255, 255, 0.95)"
                      stroke="#667eea"
                      strokeWidth={1}
                      cornerRadius={4}
                    />
                    {editingElement?.id === element.id ? (
                      <Group>
                        <Input
                          x={element.x - 2}
                          y={element.y - 23}
                          width={element.width + 6}
                          height={16}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          style={{
                            fontSize: '12px',
                            textAlign: 'center',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent'
                          }}
                        />
                      </Group>
                    ) : (
                      <Text
                        x={element.x}
                        y={element.y - 20}
                        text={element.numero || ''}
                        fontSize={12}
                        fill="#667eea"
                        fontStyle="bold"
                        align="center"
                        width={element.width}
                        onClick={() => startEditing(element)}
                        cursor="pointer"
                      />
                    )}
                  </Group>
                )}
              </Group>
            );

          case 'mesa':
            return (
              <Group key={element.id}>
                <Mesa
                  mesa={element}
                  isSelected={isSelected}
                  onClick={() => handleElementClick(element.id)}
                  onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                  getSeatColor={getSeatColor}
                  getZonaColor={getZonaColor}
                  getBorderColor={getBorderColor}
                  showZones={true}
                  selectedZone={selectedZone}
                  showConnections={true}
                  connectionStyle="dashed"
                />
                
                {/* Modo edición de nombres de mesas */}
                {numerationMode === 'tables' && (
                  <Group>
                    <Rect
                      x={element.x - 10}
                      y={element.y - 30}
                      width={element.width + 20}
                      height={25}
                      fill="rgba(255, 255, 255, 0.95)"
                      stroke="#667eea"
                      strokeWidth={1}
                      cornerRadius={6}
                    />
                    {editingElement?.id === element.id ? (
                      <Group>
                        <Input
                          x={element.x - 8}
                          y={element.y - 28}
                          width={element.width + 16}
                          height={21}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          style={{
                            fontSize: '12px',
                            textAlign: 'center',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent'
                          }}
                        />
                      </Group>
                    ) : (
                      <Text
                        x={element.x}
                        y={element.y - 25}
                        text={element.nombre || ''}
                        fontSize={12}
                        fill="#667eea"
                        fontStyle="bold"
                        align="center"
                        width={element.width}
                        onClick={() => startEditing(element)}
                        cursor="pointer"
                      />
                    )}
                  </Group>
                )}
              </Group>
            );

          case 'text':
            return (
              <Text
                key={element.id}
                x={element.x}
                y={element.y}
                text={element.text}
                fontSize={element.fontSize}
                fill={element.color}
                isSelected={isSelected}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                draggable
              />
            );

          case 'zone':
            return (
              <Rect
                key={element.id}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                fill={element.color + '20'}
                stroke={element.color}
                strokeWidth={2}
                isSelected={isSelected}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                draggable
              />
            );

          case 'shape':
            if (element.shapeType === 'circle') {
              return (
                <Circle
                  key={element.id}
                  x={element.x + element.width / 2}
                  y={element.y + element.height / 2}
                  radius={element.width / 2}
                  fill={element.color}
                  stroke="#000"
                  strokeWidth={2}
                  isSelected={isSelected}
                  onClick={() => handleElementClick(element.id)}
                  onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                  draggable
                />
              );
            } else {
              return (
                <Rect
                  key={element.id}
                  x={element.x}
                  y={element.y}
                  width={element.width}
                  height={element.height}
                  fill={element.color}
                  stroke="#000"
                  strokeWidth={2}
                  isSelected={isSelected}
                  onClick={() => handleElementClick(element.id)}
                  onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                  draggable
                />
              );
            }

          default:
            return null;
        }
      });
    } catch (error) {
      console.error('Error renderizando elementos:', error);
      return null;
    }
  };

  // Renderizar grid
  const renderGrid = () => {
    if (!showGrid) return null;
    
    try {
      const gridLines = [];
      const stageWidth = 2000;
      const stageHeight = 2000;
      
      // Líneas verticales
      for (let i = 0; i <= stageWidth; i += gridSize) {
        gridLines.push(
          <Line
            key={`v-${i}`}
            points={[i, 0, i, stageHeight]}
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
        );
      }
      
      // Líneas horizontales
      for (let i = 0; i <= stageHeight; i += gridSize) {
        gridLines.push(
          <Line
            key={`h-${i}`}
            points={[0, i, stageWidth, i]}
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
        );
      }
      
      return gridLines;
    } catch (error) {
      console.error('Error renderizando grid:', error);
      return null;
    }
  };

  return (
    <div className="map-area">
      {/* Stage de Konva */}
      <Stage
        ref={stageRef}
        width={window.innerWidth - 380}
        height={window.innerHeight - 100}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePosition.x}
        y={stagePosition.y}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onWheel={(e) => {
          e.evt.preventDefault();
          const scaleBy = 1.1;
          const stage = e.target.getStage();
          const oldScale = stage.scaleX();
          const pointer = stage.getPointerPosition();
          
          const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
          };
          
          const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
          
          stage.scale({ x: newScale, y: newScale });
          
          const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          };
          stage.position(newPos);
          stage.batchDraw();
        }}
        onContextMenu={handleStageContextMenu}
        onClick={handleStageClick}
        onMouseDown={handlePanStart}
        onMousemove={handlePanMove}
        onMouseup={handlePanEnd}
      >
        <Layer>
          {/* Zonas del dashboard */}
          {renderDashboardZones()}
          
          {/* Elementos del mapa */}
          {renderElements()}
          
          {/* Grid */}
          {renderGrid()}
          
          {/* Línea de dibujo para zonas */}
          {drawingPoints.length === 2 && (
            <Line
              points={[drawingPoints[0].x, drawingPoints[0].y, drawingPoints[1].x, drawingPoints[1].y]}
              stroke="#ff0000"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}

          {/* Rectángulo de selección */}
          {selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              stroke="#667eea"
              strokeWidth={2}
              dash={[5, 5]}
              fill="rgba(102, 126, 234, 0.1)"
            />
          )}

          {/* Indicadores de filas para edición */}
          {renderRowIndicators}
        </Layer>
      </Stage>
    </div>
  );
};

export default MapArea;
