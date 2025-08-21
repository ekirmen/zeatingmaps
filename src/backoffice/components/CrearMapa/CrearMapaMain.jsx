/**
 * Editor principal de mapas de asientos - Versión 5.1.0
 * ADAPTADO A LA BASE DE DATOS REAL DEL USUARIO
 * 
 * Esquema real:
 * - zonas: id, nombre, aforo, color, numerada, sala_id, tenant_id
 * - Conecta a Supabase para datos reales
 * - Sistema de zonas dinámico basado en BD
 * - ESTABILIDAD COMPLETA DEL CANVAS KONVA
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Image, Group, RegularPolygon, Star, Transformer } from 'react-konva';
import { Select, message, Button, Input, ColorPicker, Space, Divider, Spin } from 'antd';
import { supabase } from '../../../config/supabase';

const CrearMapaMain = ({ salaId, onSave, onCancel, initialMapa, tenantId }) => {
  // ===== REFS =====
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  // ===== ESTADOS PRINCIPALES =====
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMode, setActiveMode] = useState('select'); // 'select', 'pan', 'add'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ===== ESTADOS DE ZOOM Y PAN =====
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minScale] = useState(0.1);
  const [maxScale] = useState(5);
  
  // ===== ESTADOS DE ZONAS (BASADO EN TU TABLA zonas) =====
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [loadingZones, setLoadingZones] = useState(true);
  
  // ===== ESTADOS DE CONFIGURACIÓN =====
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMesaNames, setShowMesaNames] = useState(true);
  const [showTransformer, setShowTransformer] = useState(true);
  
  // ===== ESTADOS DE HERRAMIENTAS =====
  const [textInput, setTextInput] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  const [textFontSize, setTextFontSize] = useState(60);
  const [rectangleWidth, setRectangleWidth] = useState(120);
  const [rectangleHeight, setRectangleHeight] = useState(36);
  const [circleRadius, setCircleRadius] = useState(23.87);
  
  // ===== ESTADOS DE PANELES =====
  const [showZonesPanel, setShowZonesPanel] = useState(true);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);

  // ===== ESTADOS DE ESTABILIZACIÓN DEL CANVAS =====
  const [canvasStable, setCanvasStable] = useState(true);
  const [lastRenderTime, setLastRenderTime] = useState(Date.now());
  const [idCounter, setIdCounter] = useState(0);

  // ===== FUNCIONES DE CARGA DE ZONAS DESDE SUPABASE =====
  const loadZonesFromDatabase = useCallback(async () => {
    try {
      setLoadingZones(true);
      
      let query = supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', salaId);
      
      // Si hay tenant_id, filtrar por él
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data: zonesData, error } = await query;
      
      if (error) {
        console.error('Error cargando zonas:', error);
        message.error('Error cargando zonas desde la base de datos');
        return;
      }
      
      if (zonesData && zonesData.length > 0) {
        setZones(zonesData);
        setSelectedZoneId(zonesData[0].id); // Seleccionar primera zona por defecto
        message.success(`${zonesData.length} zonas cargadas desde la base de datos`);
      } else {
        // Si no hay zonas, crear algunas por defecto
        const defaultZones = [
          {
            id: 1,
            nombre: 'ZONA 1',
            aforo: 50,
            color: '#049cfb',
            numerada: true,
            sala_id: salaId,
            tenant_id: tenantId
          },
          {
            id: 2,
            nombre: 'ZONA 2',
            aforo: 100,
            color: '#05ffc1',
            numerada: true,
            sala_id: salaId,
            tenant_id: tenantId
          }
        ];
        setZones(defaultZones);
        setSelectedZoneId(1);
        message.info('No se encontraron zonas. Se crearon zonas por defecto.');
      }
    } catch (error) {
      console.error('Error en loadZonesFromDatabase:', error);
      message.error('Error cargando zonas');
    } finally {
      setLoadingZones(false);
      setLoading(false);
    }
  }, [salaId, tenantId]);

  // ===== FUNCIONES DE ESTABILIZACIÓN DEL CANVAS =====
  const stabilizeCanvas = useCallback(() => {
    if (stageRef.current) {
      setCanvasStable(false);
      
      // Forzar re-renderizado del canvas
      stageRef.current.batchDraw();
      const layers = stageRef.current.getLayers();
      layers.forEach(layer => layer.batchDraw());
      
      // Simular proceso de estabilización
      setTimeout(() => {
        setCanvasStable(true);
        setLastRenderTime(Date.now());
        message.success('Canvas estabilizado');
      }, 300);
    }
  }, []);

  const forceCanvasUpdate = useCallback(() => {
    if (stageRef.current) {
      stageRef.current.batchDraw();
      setLastRenderTime(Date.now());
      message.info('Canvas actualizado');
    }
  }, []);

  const resetCanvas = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSelectedIds([]);
    stabilizeCanvas();
    message.info('Canvas reseteado');
  }, [stabilizeCanvas]);

  // ===== FUNCIONES DE ELEMENTOS =====
  const addElement = useCallback((type, properties) => {
    const newId = idCounter + 1;
    const newElement = {
      _id: newId,
      type,
      ...properties
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    setIdCounter(newId);
    stabilizeCanvas();
    
    return newElement;
  }, [elements, idCounter, stabilizeCanvas]);

  // ===== FUNCIONES DE MESAS =====
  const addMesa = useCallback((tipo = 'rectangular') => {
    const selectedZone = zones.find(z => z.id === selectedZoneId);
    if (!selectedZone) {
      message.warning('Selecciona una zona antes de agregar una mesa');
      return;
    }
    
    const zoneColor = selectedZone.color || '#8BC34A';
    
    if (tipo === 'rectangular') {
      const mesa = addElement('mesa', {
        center: { x: 100, y: 100 },
        width: rectangleWidth,
        height: rectangleHeight,
        label: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`,
        type: 'rectangular',
        objectType: 'table',
        layout: 'twoSides',
        zonaId: selectedZoneId,
        zona: {
          id: selectedZone.id,
          nombre: selectedZone.nombre,
          color: zoneColor,
          aforo: selectedZone.aforo,
          numerada: selectedZone.numerada
        },
        uuid: `uuid${Date.now()}`,
        seats: [],
        rotationAngle: 0
      });
      
      setSelectedIds([mesa._id]);
      message.success('Mesa rectangular agregada');
    } else {
      const mesa = addElement('mesa', {
        center: { x: 100, y: 100 },
        radius: circleRadius,
        label: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`,
        type: 'round',
        objectType: 'table',
        zonaId: selectedZoneId,
        zona: {
          id: selectedZone.id,
          nombre: selectedZone.nombre,
          color: zoneColor,
          aforo: selectedZone.aforo,
          numerada: selectedZone.numerada
        },
        uuid: `uuid${Date.now()}`,
        seats: [],
        rotationAngle: 0,
        openSpaces: 0
      });
      
      setSelectedIds([mesa._id]);
      message.success('Mesa circular agregada');
    }
  }, [addElement, elements, selectedZoneId, zones, rectangleWidth, rectangleHeight, circleRadius]);

  // ===== FUNCIONES DE ASIENTOS =====
  const addSeatsToMesa = useCallback((mesaId, count = 8) => {
    const mesa = elements.find(e => e._id === mesaId);
    if (!mesa) return;

    const seats = [];
    const mesaCenter = mesa.center;
    const isCircular = mesa.type === 'round';
    let currentIdCounter = idCounter;
    
    if (isCircular) {
      // Asientos en círculo
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count;
        const radius = mesa.radius + 15; // 15px fuera de la mesa
        
        currentIdCounter += 1;
        seats.push({
          x: mesaCenter.x + radius * Math.cos(angle),
          y: mesaCenter.y + radius * Math.sin(angle),
          label: (i + 1).toString(),
          zonaId: mesa.zonaId,
          id: currentIdCounter
        });
      }
    } else {
      // Asientos en rectángulo
      const seatsPerSide = Math.ceil(count / 2);
      const seatSpacing = 30;
      
      // Lado izquierdo
      for (let i = 0; i < seatsPerSide; i++) {
        currentIdCounter += 1;
        seats.push({
          x: mesaCenter.x - mesa.width / 2 - 15,
          y: mesaCenter.y - mesa.height / 2 + (i * seatSpacing),
          label: (i + 1).toString(),
          zonaId: mesa.zonaId,
          id: currentIdCounter
        });
      }
      
      // Lado derecho
      for (let i = 0; i < seatsPerSide; i++) {
        currentIdCounter += 1;
        seats.push({
          x: mesaCenter.x + mesa.width / 2 + 15,
          y: mesaCenter.y - mesa.height / 2 + (i * seatSpacing),
          label: (i + seatsPerSide + 1).toString(),
          zonaId: mesa.zonaId,
          id: currentIdCounter
        });
      }
    }

    const newElements = elements.map(el =>
      el._id === mesaId ? { ...el, seats } : el
    );
    
    setElements(newElements);
    setIdCounter(currentIdCounter);
    stabilizeCanvas();
    message.success(`${seats.length} asientos agregados a la mesa`);
  }, [elements, idCounter, stabilizeCanvas]);

  // ===== FUNCIONES PARA AGREGAR ASIENTOS DESDE LA INTERFAZ =====
  const [showAddSeatsModal, setShowAddSeatsModal] = useState(false);
  const [selectedMesaForSeats, setSelectedMesaForSeats] = useState(null);
  const [seatsCount, setSeatsCount] = useState(8);

  const openAddSeatsModal = useCallback((mesaId) => {
    const mesa = elements.find(e => e._id === mesaId);
    if (!mesa) return;
    
    setSelectedMesaForSeats(mesa);
    setSeatsCount(8);
    setShowAddSeatsModal(true);
  }, [elements]);

  const handleAddSeats = useCallback(() => {
    if (selectedMesaForSeats && seatsCount > 0) {
      addSeatsToMesa(selectedMesaForSeats._id, seatsCount);
      setShowAddSeatsModal(false);
      setSelectedMesaForSeats(null);
    }
  }, [selectedMesaForSeats, seatsCount, addSeatsToMesa]);

  const removeSeatsFromMesa = useCallback((mesaId) => {
    const newElements = elements.map(el =>
      el._id === mesaId ? { ...el, seats: [] } : el
    );
    
    setElements(newElements);
    stabilizeCanvas();
    message.success('Asientos removidos de la mesa');
  }, [elements, stabilizeCanvas]);

  const duplicateMesa = useCallback((mesaId) => {
    const mesa = elements.find(e => e._id === mesaId);
    if (!mesa) return;

    const newMesa = {
      ...mesa,
      _id: idCounter + 1,
      center: { x: mesa.center.x + 150, y: mesa.center.y },
      label: `${mesa.label} (copia)`,
      seats: [] // Sin asientos en la copia
    };

    const newElements = [...elements, newMesa];
    setElements(newElements);
    setIdCounter(idCounter + 1);
    setSelectedIds([newMesa._id]);
    stabilizeCanvas();
    message.success('Mesa duplicada exitosamente');
  }, [elements, idCounter, stabilizeCanvas]);

  // ===== FUNCIONES DE ASIENTOS INDIVIDUALES =====
  const addSingleSeat = useCallback((mesaId, x, y) => {
    const mesa = elements.find(e => e._id === mesaId);
    if (!mesa) return;

    const newSeat = {
      x,
      y,
      label: (mesa.seats?.length || 0) + 1,
      zonaId: mesa.zonaId,
      id: idCounter + 1
    };

    const newSeats = [...(mesa.seats || []), newSeat];
    const newElements = elements.map(el =>
      el._id === mesaId ? { ...el, seats: newSeats } : el
    );
    
    setElements(newElements);
    setIdCounter(idCounter + 1);
    stabilizeCanvas();
    message.success('Asiento individual agregado');
  }, [elements, idCounter, stabilizeCanvas]);

  const removeSingleSeat = useCallback((mesaId, seatId) => {
    const mesa = elements.find(e => e._id === mesaId);
    if (!mesa) return;

    const newSeats = mesa.seats?.filter(seat => seat.id !== seatId) || [];
    const newElements = elements.map(el =>
      el._id === mesaId ? { ...el, seats: newSeats } : el
    );
    
    setElements(newElements);
    stabilizeCanvas();
    message.success('Asiento removido');
  }, [elements, stabilizeCanvas]);

  // ===== FUNCIONES DE CONFIGURACIÓN DE ASIENTOS =====
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [selectedMesaForLayout, setSelectedMesaForLayout] = useState(null);
  const [layoutType, setLayoutType] = useState('1');
  const [layoutSeatsCount, setLayoutSeatsCount] = useState(8);
  
  // Estado para confirmación de eliminación de asientos
  const [showDeleteSeatModal, setShowDeleteSeatModal] = useState(false);
  const [seatToDelete, setSeatToDelete] = useState(null);

  const openLayoutModal = useCallback((mesaId) => {
    const mesa = elements.find(e => e._id === mesaId);
    if (!mesa) return;
    
    setSelectedMesaForLayout(mesa);
    setLayoutType(mesa.type === 'round' ? '1' : '2');
    setLayoutSeatsCount(8);
    setShowLayoutModal(true);
  }, [elements]);

  const handleConfigureLayout = useCallback(() => {
    if (selectedMesaForLayout && layoutSeatsCount > 0) {
      addSeatsToMesa(selectedMesaForLayout._id, layoutSeatsCount);
      setShowLayoutModal(false);
      setSelectedMesaForLayout(null);
    }
  }, [selectedMesaForLayout, layoutSeatsCount, addSeatsToMesa]);

  // Función para confirmar eliminación de asiento
  const confirmDeleteSeat = useCallback((mesaId, seatId, seatLabel) => {
    setSeatToDelete({ mesaId, seatId, seatLabel });
    setShowDeleteSeatModal(true);
  }, []);

  const handleDeleteSeat = useCallback(() => {
    if (seatToDelete) {
      removeSingleSeat(seatToDelete.mesaId, seatToDelete.seatId);
      setShowDeleteSeatModal(false);
      setSeatToDelete(null);
    }
  }, [seatToDelete, removeSingleSeat]);

  // ===== FUNCIONES DE FILAS =====
  const addRow = useCallback((label = 'A', seatCount = 26, startX = 100, startY = 100) => {
    const selectedZone = zones.find(z => z.id === selectedZoneId);
    if (!selectedZone) {
      message.warning('Selecciona una zona antes de agregar una fila');
      return;
    }
    
    const seats = [];
    let currentIdCounter = idCounter;
    for (let i = 0; i < seatCount; i++) {
      currentIdCounter += 1;
      seats.push({
        x: startX + (i * 20), // 20px entre asientos
        y: startY,
        label: (seatCount - i).toString(), // Numeración descendente
        zonaId: selectedZoneId,
        id: currentIdCounter
      });
    }

    const row = addElement('row', {
      label,
      seats,
      curve: 0,
      chairSpacing: 4,
      objectType: 'row',
      uuid: `uuid${Date.now()}`,
      zonaId: selectedZoneId,
      zona: {
        id: selectedZone.id,
        nombre: selectedZone.nombre,
        color: selectedZone.color,
        aforo: selectedZone.aforo,
        numerada: selectedZone.numerada
      }
    });
    
    setSelectedIds([row._id]);
    setIdCounter(currentIdCounter);
    message.success(`Fila ${label} agregada con ${seatCount} asientos`);
  }, [addElement, selectedZoneId, zones, idCounter, stabilizeCanvas]);

  // ===== FUNCIONES DE TEXTO =====
  const addTexto = useCallback(() => {
    const texto = addElement('texto', {
      text: textInput || 'ESCENARIO',
      centerX: 100,
      centerY: 100,
      rotationAngle: 0,
      fontSize: textFontSize,
      textColor: 'rgb(246, 248, 253)',
      textAboveEverything: 0,
      objectType: 'text'
    });
    
    setSelectedIds([texto._id]);
    setIsAddingText(false);
    setTextInput('');
    message.success('Texto agregado');
  }, [addElement, textInput, textFontSize]);

  // ===== FUNCIONES DE FORMAS =====
  const addShape = useCallback((type = 'rectangle') => {
    const selectedZone = zones.find(z => z.id === selectedZoneId);
    if (!selectedZone) {
      message.warning('Selecciona una zona antes de agregar una forma');
      return;
    }
    
    if (type === 'rectangle') {
      const shape = addElement('shape', {
        strokeWidth: 3,
        strokeColor: '#8b93a6',
        fillColor: selectedZone.color || '#ffffff',
        rotationAngle: 0,
        center: { x: 100, y: 100 },
        objectType: 'shapedObject',
        uuid: `uuid${Date.now()}`,
        type: 'rectangle',
        width: rectangleWidth,
        height: rectangleHeight,
        cornerRadius: 4,
        zonaId: selectedZoneId
      });
      
      setSelectedIds([shape._id]);
      message.success('Rectángulo agregado');
    }
  }, [addElement, selectedZoneId, zones, rectangleWidth, rectangleHeight]);

  // ===== FUNCIONES DE SELECCIÓN =====
  const handleElementClick = useCallback((elementId) => {
    if (activeMode === 'select') {
      setSelectedIds(prev => 
        prev.includes(elementId) 
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    }
  }, [activeMode]);

  const handleElementRightClick = useCallback((e, elementId) => {
    e.evt.preventDefault();
    // Implementar menú contextual si es necesario
  }, []);

  // ===== FUNCIONES DE MANIPULACIÓN =====
  const deleteSelectedElements = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }

    const newElements = elements.filter(el => !selectedIds.includes(el._id));
    setElements(newElements);
    setSelectedIds([]);
    stabilizeCanvas();
    message.success(`${selectedIds.length} elemento(s) eliminado(s)`);
  }, [selectedIds, elements, stabilizeCanvas]);

  const updateElementProperty = useCallback((elementId, property, value) => {
    const newElements = elements.map(el =>
      el._id === elementId ? { ...el, [property]: value } : el
    );
    setElements(newElements);
    stabilizeCanvas();
  }, [elements, stabilizeCanvas]);

  // ===== FUNCIONES DE ZOOM Y PAN =====
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = scale;
    const pointer = stageRef.current.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newScale = Math.min(Math.max(e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, minScale), maxScale);

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [scale, position, minScale, maxScale]);

  const handleMouseDown = useCallback((e) => {
    if (activeMode === 'pan') {
      stageRef.current.draggable(true);
    }
  }, [activeMode]);

  const handleMouseUp = useCallback((e) => {
    if (activeMode === 'pan') {
      stageRef.current.draggable(false);
    }
  }, [activeMode]);

  // ===== FUNCIONES DE SNAP TO GRID =====
  const snapToGridPosition = useCallback((position) => {
    if (!snapToGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  // ===== FUNCIONES DE EXPORTACIÓN =====
  const exportToSeatmapFormat = useCallback(() => {
    const seatmapData = {
      categories: {
        list: zones.map(zone => ({
          label: zone.nombre,
          color: zone.color,
          catId: zone.id
        })),
        listGA: []
      },
      idCounter: idCounter,
      name: "Mapa de Asientos",
      sectionScaleFactor: 170,
      showAllButtons: false,
      showRowLabels: false,
      showRowLines: true,
      subChart: {
        height: 600,
        width: 800,
        snapOffset: { x: 0, y: 0 },
        tables: elements.filter(e => e.type === 'mesa'),
        texts: elements.filter(e => e.type === 'texto'),
        rows: elements.filter(e => e.type === 'row'),
        shapes: elements.filter(e => e.type === 'shape'),
        booths: [],
        generalAdmissionAreas: []
      }
    };

    const dataStr = JSON.stringify(seatmapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seatmap_${salaId}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('Mapa exportado en formato seatmap');
  }, [zones, idCounter, elements, salaId]);

  // ===== FUNCIONES DE RENDERIZADO =====
  const renderElements = useCallback(() => {
    if (!Array.isArray(elements) || elements.length === 0) {
      return null;
    }

    return elements.map(element => {
      if (!element || !element._id) {
        return null;
      }

      const isSelected = selectedIds.includes(element._id);
      const strokeColor = isSelected ? '#FF6B6B' : '#000000';
      const strokeWidth = isSelected ? 3 : 1;

      // Renderizar mesa
      if (element.type === 'mesa') {
        if (element.type === 'round') {
          return (
            <Group key={element._id}>
              <Circle
                x={element.center.x}
                y={element.center.y}
                radius={element.radius}
                fill={element.zona?.color || '#ffffff'}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                rotation={element.rotationAngle || 0}
                onClick={() => handleElementClick(element._id)}
                onTap={() => handleElementClick(element._id)}
                onContextMenu={(e) => handleElementRightClick(e, element._id)}
                draggable={activeMode === 'select'}
                onDragEnd={(e) => {
                  const newCenter = { x: e.target.x(), y: e.target.y() };
                  const newElements = elements.map(el =>
                    el._id === element._id ? { ...el, center: newCenter } : el
                  );
                  setElements(newElements);
                  stabilizeCanvas();
                }}
              />
              
              {/* Asientos de la mesa */}
              {element.seats && element.seats.map(seat => (
                <Circle
                  key={seat.id}
                  x={seat.x}
                  y={seat.y}
                  radius={8}
                  fill="#60a5fa"
                  stroke="#000"
                  strokeWidth={1}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    confirmDeleteSeat(element._id, seat.id, seat.label);
                  }}
                />
              ))}
              
              {/* Etiqueta de la mesa */}
              <Text
                text={element.label}
                x={element.center.x - 20}
                y={element.center.y - 10}
                fontSize={12}
                fill="#000"
                align="center"
                listening={false}
              />

              {/* Contador de asientos */}
              <Text
                text={`${element.seats?.length || 0} asientos`}
                x={element.center.x - 25}
                y={element.center.y + element.radius + 20}
                fontSize={10}
                fill="#666"
                align="center"
                listening={false}
              />
            </Group>
          );
        } else {
          return (
            <Group key={element._id}>
              <Rect
                x={element.center.x - element.width / 2}
                y={element.center.y - element.height / 2}
                width={element.width}
                height={element.height}
                fill={element.zona?.color || '#ffffff'}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                rotation={element.rotationAngle || 0}
                onClick={() => handleElementClick(element._id)}
                onTap={() => handleElementClick(element._id)}
                onContextMenu={(e) => handleElementRightClick(e, element._id)}
                draggable={activeMode === 'select'}
                onDragEnd={(e) => {
                  const newCenter = { x: e.target.x(), y: e.target.y() };
                  const newElements = elements.map(el =>
                    el._id === element._id ? { ...el, center: newCenter } : el
                  );
                  setElements(newElements);
                  stabilizeCanvas();
                }}
              />
              
              {/* Asientos de la mesa */}
              {element.seats && element.seats.map(seat => (
                <Circle
                  key={seat.id}
                  x={seat.x}
                  y={seat.y}
                  radius={8}
                  fill="#60a5fa"
                  stroke="#000"
                  strokeWidth={1}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    confirmDeleteSeat(element._id, seat.id, seat.label);
                  }}
                />
              ))}
              
              {/* Etiqueta de la mesa */}
              <Text
                text={element.label}
                x={element.center.x - 20}
                y={element.center.y - 10}
                fontSize={12}
                fill="#000"
                align="center"
                listening={false}
              />

              {/* Contador de asientos */}
              <Text
                text={`${element.seats?.length || 0} asientos`}
                x={element.center.x - 25}
                y={element.center.y + element.height / 2 + 20}
                fontSize={10}
                fill="#666"
                align="center"
                listening={false}
              />
            </Group>
          );
        }
      }

      // Renderizar fila
      if (element.type === 'row') {
        return (
          <Group key={element._id}>
            {/* Asientos de la fila */}
            {element.seats && element.seats.map(seat => (
              <Circle
                key={seat.id}
                x={seat.x}
                y={seat.y}
                radius={8}
                fill="#60a5fa"
                stroke="#000"
                strokeWidth={1}
                onClick={(e) => {
                  e.cancelBubble = true;
                  confirmDeleteSeat(element._id, seat.id, seat.label);
                }}
              />
            ))}
            
            {/* Etiqueta de la fila */}
            <Text
              text={element.label}
              x={element.seats[0]?.x - 20 || 0}
              y={element.seats[0]?.y - 20 || 0}
              fontSize={14}
              fill="#000"
              fontStyle="bold"
              listening={false}
            />

            {/* Contador de asientos */}
            <Text
              text={`${element.seats?.length || 0} asientos`}
              x={element.seats[0]?.x - 20 || 0}
              y={element.seats[0]?.y + 20 || 0}
              fontSize={10}
              fill="#666"
              listening={false}
            />
          </Group>
        );
      }

      // Renderizar texto
      if (element.type === 'texto') {
        return (
          <Text
            key={element._id}
            x={element.centerX}
            y={element.centerY}
            text={element.text}
            fontSize={element.fontSize}
            fill={element.textColor}
            rotation={element.rotationAngle || 0}
            align="center"
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const newElements = elements.map(el =>
                el._id === element._id ? { 
                  ...el, 
                  centerX: e.target.x(), 
                  centerY: e.target.y() 
                } : el
              );
              setElements(newElements);
              stabilizeCanvas();
            }}
          />
        );
      }

      // Renderizar forma
      if (element.type === 'shape') {
        if (element.type === 'rectangle') {
          return (
            <Rect
              key={element._id}
              x={element.center.x - element.width / 2}
              y={element.center.y - element.height / 2}
              width={element.width}
              height={element.height}
              fill={element.fillColor}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth}
              cornerRadius={element.cornerRadius}
              rotation={element.rotationAngle || 0}
              onClick={() => handleElementClick(element._id)}
              onTap={() => handleElementClick(element._id)}
              draggable={activeMode === 'select'}
              onDragEnd={(e) => {
                const newCenter = { x: e.target.x(), y: e.target.y() };
                const newElements = elements.map(el =>
                  el._id === element._id ? { ...el, center: newCenter } : el
                );
                setElements(newElements);
                stabilizeCanvas();
              }}
            />
          );
        }
      }

      return null;
    }).filter(Boolean);
  }, [elements, selectedIds, activeMode, handleElementClick, handleElementRightClick, removeSingleSeat, stabilizeCanvas]);

  // ===== EFECTOS =====
  useEffect(() => {
    // Cargar zonas desde la base de datos al montar el componente
    loadZonesFromDatabase();
  }, [loadZonesFromDatabase]);

  useEffect(() => {
    if (initialMapa && initialMapa.contenido) {
      setElements(initialMapa.contenido);
    }
  }, [initialMapa]);

  useEffect(() => {
    if (transformerRef.current && selectedIds.length > 0) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedIds[0]}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedIds]);

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.batchDraw();
      const layers = stageRef.current.getLayers();
      layers.forEach(layer => layer.batchDraw());
      setLastRenderTime(Date.now());
    }
  }, [elements, showGrid]);

  // ===== RENDERIZADO =====
  if (loading || loadingZones) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-lg text-gray-600">
            {loadingZones ? 'Cargando zonas desde la base de datos...' : 'Cargando editor de mapas...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <p className="text-lg text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel lateral izquierdo */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Panel: Zonas */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowZonesPanel(!showZonesPanel)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              🎯 Zonas ({zones.length})
            </button>
            <div className={`p-3 border-t border-gray-200 ${showZonesPanel ? 'block' : 'hidden'}`}>
              <div className="space-y-2">
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedZoneId === zone.id ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'
                    }`}
                    onClick={() => setSelectedZoneId(zone.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zone.color || '#cccccc' }}
                      />
                      <span className="font-medium">{zone.nombre}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {zone.aforo || 0} asientos • {zone.numerada ? 'Numerada' : 'No numerada'}
                    </div>
                  </div>
                ))}
              </div>
              
              {zones.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No hay zonas configuradas para esta sala
                </div>
              )}
            </div>
          </div>

          {/* Panel: Herramientas */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowToolsPanel(!showToolsPanel)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-green-100 text-green-700 hover:bg-green-200"
            >
              🛠️ Herramientas
            </button>
            <div className={`p-3 border-t border-gray-200 ${showToolsPanel ? 'block' : 'hidden'}`}>
              <div className="space-y-2">
                <button
                  onClick={() => addMesa('rectangular')}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  disabled={!selectedZoneId}
                >
                  🏗️ Mesa Rectangular
                </button>
                <button
                  onClick={() => addMesa('round')}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  disabled={!selectedZoneId}
                >
                  🔵 Mesa Circular
                </button>
                <button
                  onClick={() => addRow('A', 26)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  disabled={!selectedZoneId}
                >
                  📊 Fila A (26 asientos)
                </button>
                <button
                  onClick={() => setIsAddingText(true)}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  📝 Texto
                </button>
                <button
                  onClick={() => addShape('rectangle')}
                  className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                  disabled={!selectedZoneId}
                >
                  ⬜ Rectángulo
                </button>
                
                {/* Configuración de herramientas */}
                <Divider className="my-2" />
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ancho Mesa:</label>
                    <Input
                      type="number"
                      value={rectangleWidth}
                      onChange={(e) => setRectangleWidth(Number(e.target.value))}
                      size="small"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Alto Mesa:</label>
                    <Input
                      type="number"
                      value={rectangleHeight}
                      onChange={(e) => setRectangleHeight(Number(e.target.value))}
                      size="small"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Radio Mesa:</label>
                    <Input
                      type="number"
                      value={circleRadius}
                      onChange={(e) => setCircleRadius(Number(e.target.value))}
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel: Gestión de Asientos */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              🪑 Gestión de Asientos
            </button>
            <div className={`p-3 border-t border-gray-200 ${showPropertiesPanel ? 'block' : 'hidden'}`}>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  Selecciona una mesa para gestionar sus asientos
                </div>
                
                {selectedIds.length > 0 && elements.find(e => e._id === selectedIds[0] && e.type === 'mesa') && (
                  <div className="space-y-2">
                    <button
                      onClick={() => openAddSeatsModal(selectedIds[0])}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      ➕ Agregar Asientos
                    </button>
                    <button
                      onClick={() => openLayoutModal(selectedIds[0])}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      ⚙️ Configurar Layout
                    </button>
                    <button
                      onClick={() => removeSeatsFromMesa(selectedIds[0])}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      🗑️ Remover Todos los Asientos
                    </button>
                    <button
                      onClick={() => duplicateMesa(selectedIds[0])}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      📋 Duplicar Mesa
                    </button>
                  </div>
                )}
                
                {selectedIds.length === 0 && (
                  <div className="text-center text-gray-500 py-2">
                    Selecciona una mesa para gestionar asientos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel: Acciones */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-3">
              <div className="space-y-2">
                <button
                  onClick={() => onSave && onSave(elements)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  💾 Guardar
                </button>
                <button
                  onClick={exportToSeatmapFormat}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  📤 Exportar Seatmap
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ❌ Cancelar
                </button>
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="text-xs text-gray-500 mb-2">🔧 Herramientas de Canvas</div>
                  <button
                    onClick={stabilizeCanvas}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm mb-2"
                  >
                    🔄 Estabilizar Canvas
                  </button>
                  <button
                    onClick={resetCanvas}
                    className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm mb-2"
                  >
                    🎯 Reset Canvas
                  </button>
                  <button
                    onClick={forceCanvasUpdate}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    ⚡ Forzar Actualización
                  </button>
                </div>
                
                {/* Indicadores de estado */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="text-xs text-gray-500 mb-2">📊 Estado del Canvas</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Estable:</span>
                      <span className={canvasStable ? 'text-green-600' : 'text-red-600'}>
                        {canvasStable ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Último render:</span>
                      <span className="text-gray-600">
                        {new Date(lastRenderTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elementos:</span>
                      <span className="text-gray-600">{elements.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zona activa:</span>
                      <span className="text-gray-600">
                        {zones.find(z => z.id === selectedZoneId)?.nombre || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total asientos:</span>
                      <span className="text-gray-600">
                        {elements.reduce((total, el) => total + (el.seats?.length || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área de trabajo principal */}
      <div className="flex-1 flex flex-col">
        {/* Canvas principal */}
        <div className="flex-1 p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4 h-full">
            {/* Canvas de Konva */}
            <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
              <Stage
                ref={stageRef}
                width={800}
                height={600}
                style={{ background: '#f8fafc' }}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                <Layer>
                  {/* Grid de fondo */}
                  {showGrid && (
                    <Group>
                      {Array.from({ length: Math.ceil(800 / gridSize) }, (_, i) => (
                        <Line
                          key={`v${i}`}
                          points={[i * gridSize, 0, i * gridSize, 600]}
                          stroke="#e2e8f0"
                          strokeWidth={1}
                        />
                      ))}
                      {Array.from({ length: Math.ceil(600 / gridSize) }, (_, i) => (
                        <Line
                          key={`h${i}`}
                          points={[0, i * gridSize, 800, i * gridSize]}
                          stroke="#e2e8f0"
                          strokeWidth={1}
                        />
                      ))}
                    </Group>
                  )}
                  
                  {/* Elementos del mapa */}
                  {renderElements()}
                  
                  {/* Transformador para elementos seleccionados */}
                  {showTransformer && selectedIds.length > 0 && (
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        return newBox.width < 5 || newBox.height < 5 ? oldBox : newBox;
                      }}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>

             {/* Modal para agregar texto */}
       {isAddingText && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg w-96">
             <h3 className="text-lg font-semibold mb-4">Agregar Texto</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Texto:</label>
                 <Input
                   value={textInput}
                   onChange={(e) => setTextInput(e.target.value)}
                   placeholder="Ej: ESCENARIO"
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Tamaño de fuente:</label>
                 <Input
                   type="number"
                   value={textFontSize}
                   onChange={(e) => setTextFontSize(Number(e.target.value))}
                 />
               </div>
               <div className="flex space-x-2">
                 <Button onClick={addTexto} type="primary">
                   Agregar
                 </Button>
                 <Button onClick={() => setIsAddingText(false)}>
                   Cancelar
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Modal para agregar asientos */}
       {showAddSeatsModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg w-96">
             <h3 className="text-lg font-semibold mb-4">
               Agregar Asientos a {selectedMesaForSeats?.label}
             </h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Cantidad de asientos:</label>
                 <Input
                   type="number"
                   value={seatsCount}
                   onChange={(e) => setSeatsCount(Number(e.target.value))}
                   min={1}
                   max={20}
                 />
               </div>
               <div className="flex space-x-2">
                 <Button onClick={handleAddSeats} type="primary">
                   Agregar
                 </Button>
                 <Button onClick={() => setShowAddSeatsModal(false)}>
                   Cancelar
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Modal para configurar layout de asientos */}
       {showLayoutModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg w-96">
             <h3 className="text-lg font-semibold mb-4">
               Configurar Layout de Asientos para {selectedMesaForLayout?.label}
             </h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-600 mb-1">Tipo de layout:</label>
                 <Select
                   value={layoutType}
                   onChange={setLayoutType}
                   className="w-full"
                 >
                   <Select.Option value="1">Círculo (para mesas circulares)</Select.Option>
                   <Select.Option value="2">Dos lados (para mesas rectangulares)</Select.Option>
                   <Select.Option value="3">Personalizado</Select.Option>
                 </Select>
               </div>
               {layoutType !== '3' && (
                 <div>
                   <label className="block text-sm text-gray-600 mb-1">Cantidad de asientos:</label>
                   <Input
                     type="number"
                     value={layoutSeatsCount}
                     onChange={(e) => setLayoutSeatsCount(Number(e.target.value))}
                     min={1}
                     max={20}
                   />
                 </div>
               )}
               <div className="flex space-x-2">
                 <Button onClick={handleConfigureLayout} type="primary" disabled={layoutType === '3'}>
                   Configurar
                 </Button>
                 <Button onClick={() => setShowLayoutModal(false)}>
                   Cancelar
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Modal para confirmar eliminación de asiento */}
       {showDeleteSeatModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg w-96">
             <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
             <div className="space-y-4">
               <p className="text-gray-600">
                 ¿Estás seguro de que quieres eliminar el asiento {seatToDelete?.seatLabel}?
               </p>
               <div className="flex space-x-2">
                 <Button onClick={handleDeleteSeat} type="primary" danger>
                   Eliminar
                 </Button>
                 <Button onClick={() => setShowDeleteSeatModal(false)}>
                   Cancelar
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default CrearMapaMain;
