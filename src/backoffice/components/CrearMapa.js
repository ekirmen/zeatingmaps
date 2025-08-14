import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Text, Ellipse, Line } from 'react-konva';
import { Mesa, Silla } from './compMapa/MesaSilla';
import Grid from './compMapa/Grid';
import Zonas from './compMapa/Zonas';
import Menu from './compMapa/MenuMapa';
import EditPopup from './compMapa/EditPopup';
import FilaPopup from './compMapa/FilaPopup';
import AdvancedEditPopup from './compMapa/AdvancedEditPopup';
import { useCrearMapa } from '../hooks/useCrearMapa';
import { fetchZonasPorSala, fetchSalaById } from '../services/apibackoffice';
import { message, Switch, Button, Progress } from 'antd';
import { syncSeatsForSala } from '../services/apibackoffice';
import { useSeatColors } from '../../hooks/useSeatColors';

const CrearMapa = () => {
  const { salaId } = useParams();

  const {
    elements, setElements,
    selectedIds, setSelectedIds,
    showZones, setShowZones,
    selectedZone, setSelectedZone,
    selectedElement,
    setSelectedElement,
    numSillas, setNumSillas,
    zoom, setZoom,
    stageRef,
    stageSize,
    selectionRect,

    addMesa,
    addSillasToMesa,
    selectElement,
    updateElementProperty,
    updateElementSize,
    zoomIn,
    zoomOut,
    handleWheelZoom,
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
    limpiarSillasDuplicadas,
    resetZoom,
    copiarElementos,
    pegarElementos,
    duplicarElementos,
    crearSeccion,
    formaPersonalizable,
  } = useCrearMapa();


  const { getSeatColor, getZonaColor, getBorderColor } = useSeatColors();

  const [sillaShape, setSillaShape] = useState('rect');
  const [loadedZonas, setLoadedZonas] = useState([]);
  const [salaInfo, setSalaInfo] = useState(null);
  const [showNumeracion, setShowNumeracion] = useState(false);
  const [addingChairRow, setAddingChairRow] = useState(false);
  const [rowStart, setRowStart] = useState(null);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    if (!salaId) return;
    const cargarDatos = async () => {
      try {
        // Cargar zonas y información de la sala en paralelo
        const [zonasData, salaData] = await Promise.all([
          fetchZonasPorSala(salaId),
          fetchSalaById(salaId)
        ]);
        setLoadedZonas(zonasData);
        setSalaInfo(salaData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };
    cargarDatos();
  }, [salaId]);

  const zoneSeatCounts = useMemo(() => {
    const counts = {};
    elements.forEach((el) => {
      if (el.type === 'silla' && el.zonaId) {
        counts[el.zonaId] = (counts[el.zonaId] || 0) + 1;
      }
    });
    return counts;
  }, [elements]);

  // Calcular total de asientos
  const totalAsientos = useMemo(() => {
    return Object.values(zoneSeatCounts).reduce((sum, count) => sum + count, 0);
  }, [zoneSeatCounts]);

  // Calcular estadísticas de validación
  const validationStats = useMemo(() => {
    const stats = {
      unlabeledSeats: 0,
      unlabeledRows: 0,
      unlabeledTables: 0,
      duplicateSeats: 0,
      uncategorizedSeats: 0,
      uncategorizedZones: 0
    };

    elements.forEach(el => {
      if (el.type === 'silla') {
        if (!el.numero || el.numero === '') {
          stats.unlabeledSeats++;
        }
        if (!el.zonaId) {
          stats.uncategorizedSeats++;
        }
      } else if (el.type === 'mesa') {
        if (!el.nombre || el.nombre === '') {
          stats.unlabeledTables++;
        }
      }
    });

    // Detectar sillas duplicadas
    const sillas = elements.filter(el => el.type === 'silla');
    const posiciones = new Set();
    sillas.forEach(silla => {
      const posKey = `${silla.posicion?.x},${silla.posicion?.y}`;
      if (posiciones.has(posKey)) {
        stats.duplicateSeats++;
      } else {
        posiciones.add(posKey);
      }
    });

    return stats;
  }, [elements]);

  const moverElementosSeleccionados = (deltaX, deltaY) => {
    setElements(prev =>
      prev.map(el => {
        if (selectedIds.includes(el._id) || (el.type === 'silla' && selectedIds.includes(el.parentId))) {
          const posicionActual = el.posicion || { x: 0, y: 0 };
          return {
            ...el,
            posicion: {
              x: posicionActual.x + deltaX,
              y: posicionActual.y + deltaY,
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

    if (selectedIds.includes(id)) {
      const posicionActual = dragged.posicion || { x: 0, y: 0 };
      const deltaX = newX - posicionActual.x;
      const deltaY = newY - posicionActual.y;
      moverElementosSeleccionados(deltaX, deltaY);
    } else {
      updateElementProperty(id, 'posicion', { x: newX, y: newY });
    }

    if (chairUpdates.length > 0) {
      chairUpdates.forEach(ch =>
        updateElementProperty(ch._id, 'posicion', ch.posicion)
      );
    }

    // Guardar automáticamente después del arrastre
    console.log('[onDragEndElement] Guardando automáticamente después del arrastre...');
    setTimeout(() => {
      handleSaveWithProgress();
    }, 500); // Pequeño delay para evitar múltiples guardados
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

  const handleSync = async () => {
    if (!salaId) return;
    try {
      setSyncLoading(true);
      await syncSeatsForSala(salaId, { deleteMissing });
      message.success('Seats sincronizados correctamente');
    } catch (e) {
      console.error('Sync error', e);
      message.error(e.message || 'Error al sincronizar');
    } finally {
      setSyncLoading(false);
    }
  };

  const toggleNumeracion = () => {
    setShowNumeracion(!showNumeracion);
  };

  // Función para guardar con progreso
  const handleSaveWithProgress = async () => {
    setIsSaving(true);
    setSavingProgress(0);
    
    // Simular progreso
    const progressInterval = setInterval(() => {
      setSavingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await handleSave();
      setSavingProgress(100);
      setLastSavedAt(new Date());
      message.success('Mapa guardado correctamente');
      
      setTimeout(() => {
        setSavingProgress(0);
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error al guardar:', error);
      message.error('Error al guardar el mapa');
      setSavingProgress(0);
      setIsSaving(false);
    }
  };

  // Debug: mostrar información de elementos solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('[CrearMapa] Elementos totales:', elements?.length || 0);
    console.log('[CrearMapa] Zonas cargadas:', loadedZonas?.length || 0);
    console.log('[CrearMapa] Stage size:', stageSize);
    console.log('[CrearMapa] Zoom:', zoom);
    console.log('[CrearMapa] Selected IDs:', selectedIds?.length || 0);
  }

  return (
    <div className="flex h-screen" data-testid="crear-mapa">
      {/* Panel de información superior derecho */}
      <div className="fixed top-4 right-4 z-20 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="topRightInfo" id="topRightInfo">
          <div className="labelingMessages" id="labelingMessages">
            <label className="error-title-message font-semibold text-red-600 mb-2 block">Acciones pendientes</label>
            
            {validationStats.unlabeledSeats > 0 && (
              <div id="numberOfUnlabeledSeats" className="mb-2">
                <span className="strong font-medium">{validationStats.unlabeledSeats}</span> Asientos sin numeración &nbsp; 
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  <i className="fas fa-eye"></i>
                </a>
              </div>
            )}
            
            {validationStats.unlabeledTables > 0 && (
              <div id="numberOfUnlabeledTables" className="mb-2">
                <span className="strong font-medium">{validationStats.unlabeledTables}</span> Mesas sin numeración
              </div>
            )}
            
            {validationStats.duplicateSeats > 0 && (
              <div id="numberOfDuplicateSeats" className="mb-2">
                <span className="strong font-medium">{validationStats.duplicateSeats}</span> Asientos duplicados
              </div>
            )}
            
            {validationStats.uncategorizedSeats > 0 && (
              <div id="numberOfUncategorizedSeats" className="mb-2">
                <span className="strong font-medium">{validationStats.uncategorizedSeats}</span> asientos sin zona
              </div>
            )}
            
            {validationStats.uncategorizedZones > 0 && (
              <div id="numberOfUncategorizedGaZones" className="mb-2">
                <span className="strong font-medium">{validationStats.uncategorizedZones}</span> Zona no numerada sin zona asignada
              </div>
            )}
          </div>
          
          {selectedIds.length > 0 && (
            <div className="selectedMessage mt-3 pt-3 border-t" id="objectsInSelectionMessage">
              <span className="strong font-medium">{selectedIds.length}</span> Objetos seleccionados
            </div>
          )}
        </div>
      </div>

      <Menu
        addMesa={addMesa}
        addSillasToMesa={addSillasToMesa}
        selectedElement={selectedElement}
        numSillas={numSillas}
        setNumSillas={setNumSillas}
        handleSave={handleSaveWithProgress}
        updateElementProperty={updateElementProperty}
        updateElementSize={updateElementSize}
        zonas={loadedZonas}
        zoneSeatCounts={zoneSeatCounts}
        selectedZoneId={selectedZone ? String(selectedZone.id) : ''}
        setSelectedZoneId={(zoneId) => {
          const numericId = parseInt(zoneId, 10);
          const zona = loadedZonas.find((z) => z.id === numericId);
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
        addChairRow={addChairRow}
        startChairRowMode={startChairRowMode}
        snapToGrid={snapToGrid}
        toggleNumeracion={toggleNumeracion}
        salaInfo={salaInfo}
        totalAsientos={totalAsientos}
        // Nuevas props para funcionalidades avanzadas
        elements={elements}
        setSelectedIds={setSelectedIds}
        limpiarSillasDuplicadas={limpiarSillasDuplicadas}
        copiarElementos={copiarElementos}
        pegarElementos={pegarElementos}
        duplicarElementos={duplicarElementos}
        crearSeccion={crearSeccion}
        formaPersonalizable={formaPersonalizable}
      />

      <div className="flex-1 relative">
        {/* Barra de acciones de sincronización */}
        <div className="absolute top-2 left-2 z-10 bg-white border rounded shadow px-3 py-2 flex items-center gap-3">
          <span>Eliminar obsoletos</span>
          <Switch checked={deleteMissing} onChange={setDeleteMissing} />
          <Button type="primary" loading={syncLoading} onClick={handleSync}>
            Sincronizar seats
          </Button>
          
          {/* Botón de prueba para crear mesa */}
          <Button 
            type="default" 
            onClick={() => {
              console.log('[CrearMapa] Creando mesa de prueba...');
              addMesa('rect');
            }}
          >
            Crear Mesa Prueba
          </Button>
          
          {/* Botón de debug para ver elementos */}
          <Button 
            type="default" 
            onClick={() => {
              console.log('[CrearMapa] Debug - Elementos actuales:', elements);
              console.log('[CrearMapa] Debug - Sillas:', elements.filter(el => el.type === 'silla'));
              console.log('[CrearMapa] Debug - Mesas:', elements.filter(el => el.type === 'mesa'));
            }}
          >
            🐛 Debug Elementos
          </Button>
        </div>

        {/* Barra de progreso de guardado */}
        {isSaving && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-white border rounded shadow px-4 py-2 min-w-64">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Guardando mapa...</span>
              <Progress percent={savingProgress} size="small" />
            </div>
          </div>
        )}

        {/* Mensaje de último guardado */}
        {lastSavedAt && !isSaving && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-green-100 border border-green-300 rounded px-3 py-1">
            <span className="text-sm text-green-700">
              ✅ Mapa guardado: {lastSavedAt.toLocaleTimeString()}
            </span>
          </div>
        )}

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

            {useMemo(() => elements.map((element) => {
              const isSelected = selectedIds.includes(element._id);
              const elementZone = loadedZonas.find(z => z.id === element.zonaId);
              // Usar sistema de colores automático
              const strokeColor = getBorderColor(isSelected, elementZone);

              switch (element.type) {
                case 'mesa':
                  console.log('[CrearMapa] Renderizando mesa:', element);
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
                      x={element.posicion?.x || 0}
                      y={element.posicion?.y || 0}
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
                      x={element.posicion?.x || 0}
                      y={element.posicion?.y || 0}
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
                      x={element.posicion?.x || 0}
                      y={element.posicion?.y || 0}
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
                        const posicionActual = element.posicion || { x: 0, y: 0 };
                        const deltaX = newX - posicionActual.x;
                        const deltaY = newY - posicionActual.y;
                        const newPoints = element.points.map((p, i) =>
                          i % 2 === 0 ? p + deltaX : p + deltaY
                        );
                        updateElementProperty(element._id, 'posicion', { x: newX, y: newY });
                        updateElementProperty(element._id, 'points', newPoints);
                      }}
                    />
                  );
                case 'silla':
                  // Usar sistema de colores automático para asientos
                  const seatColor = getSeatColor(element, elementZone, isSelected, selectedIds);
                  return (
                    <Silla
                      key={element._id}
                      _id={element._id}
                      shape={element.shape}
                      x={element.posicion?.x || 0}
                      y={element.posicion?.y || 0}
                      width={element.width}
                      height={element.height}
                      numero={element.numero}
                      nombre={element.nombre}
                      fila={element.fila}
                      selected={isSelected}
                      onSelect={selectElement}
                      onDragEnd={onDragEndElement}
                      zonaId={element.zonaId}
                      zonas={loadedZonas}
                      fill={seatColor} // Color automático
                      stroke={strokeColor} // Borde automático
                    />
                  );
                default:
                  return null;
              }
            }), [elements, selectedIds, loadedZonas, selectElement, onDragEndElement, updateElementProperty, updateElementSize])}

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
        
        {/* Controles de zoom mejorados */}
        <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition-all duration-200 hover:scale-110"
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            onClick={zoomOut}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition-all duration-200 hover:scale-110"
            title="Zoom Out"
          >
            🔍-
          </button>
          <button
            onClick={() => {
              resetZoom();
              centerView();
            }}
            className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 shadow-lg transition-all duration-200 hover:scale-110"
            title="Reset Zoom"
          >
            🎯
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
        {showNumeracion && selectedElement && (
          <FilaPopup
            element={selectedElement}
            onChange={updateElementProperty}
            onClose={() => setShowNumeracion(false)}
          />
        )}
        {selectedElement && (
          <AdvancedEditPopup
            element={selectedElement}
            onUpdate={updateElementProperty}
            onClose={() => setSelectedElement(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CrearMapa;
