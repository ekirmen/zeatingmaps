import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text as KonvaText, Line, RegularPolygon, Image as KonvaImage } from 'react-konva';
import { Button, Space, message, InputNumber, Input, Select, Checkbox, Divider, Upload, Collapse, ColorPicker, Slider } from '../../utils/antdComponents';
import { fetchZonasPorSala } from '../../backoffice/services/apibackoffice';
import { ArrowLeftOutlined, SaveOutlined, ZoomInOutlined, ZoomOutOutlined, AimOutlined, PictureOutlined, EyeOutlined, EyeInvisibleOutlined, DownOutlined, UndoOutlined } from '@ant-design/icons';

const SeatingLite = ({ salaId, onSave, onCancel, initialMapa = null }) => {
  const [elements, setElements] = useState(Array.isArray(initialMapa?.contenido) ? initialMapa.contenido : []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isRightPanning, setIsRightPanning] = useState(false);
  const [rowMode, setRowMode] = useState(false);
  const [rowStart, setRowStart] = useState(null);
  const [rowLabel, setRowLabel] = useState('A');
  const [rowCount, setRowCount] = useState(10);
  const [rectSideCounts, setRectSideCounts] = useState({ top: 2, right: 2, bottom: 2, left: 2 });
  const [circleSeatsCount, setCircleSeatsCount] = useState(8);
  const [seatEmpty, setSeatEmpty] = useState(false);
  const [circleArc, setCircleArc] = useState('top');
  const [circleArcCount, setCircleArcCount] = useState(6);
  const [showTableLabels, setShowTableLabels] = useState(true);
  const [showSeatNumbers, setShowSeatNumbers] = useState(true);
  const [seatShape, setSeatShape] = useState('circle'); // 'circle' | 'rect' | 'butaca'
  const [rowPreview, setRowPreview] = useState(null);
  const [popupDrag, setPopupDrag] = useState({ isDragging: false, startPos: null, offset: { x: 0, y: 0 } });
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageElement, setBackgroundImageElement] = useState(null);
  const [seatSpacing, setSeatSpacing] = useState(25); // Espaciado entre sillas
  const [backgroundScale, setBackgroundScale] = useState(1); // Escala del fondo
  const [backgroundOpacity, setBackgroundOpacity] = useState(1); // Transparencia del fondo
  const [activeInput, setActiveInput] = useState(null); // Para activar inputs autom¡ticamente
  
  // Historial para Ctrl+Z
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;

  // Funci³n para guardar estado en el historial
  const saveToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newElements];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();

      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex]);

  // Funci³n para deshacer (Ctrl+Z)
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedIds([]);
    }
  }, [historyIndex, history]);

  // Funci³n para rehacer (Ctrl+Y)
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedIds([]);
    }
  }, [historyIndex, history]);

  // Manejar Ctrl+Z y Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Inicializar historial
  useEffect(() => {
    if (elements.length > 0 && history.length === 0) {
      setHistory([elements]);
      setHistoryIndex(0);
    }
  }, []);

  const getArcAngles = (arc) => {
    // Rango de ¡ngulos por arco (en radianes)
    switch (arc) {
      case 'top': return { start: -Math.PI / 2, end: Math.PI / 2 };
      case 'bottom': return { start: Math.PI / 2, end: (3 * Math.PI) / 2 };
      case 'right': return { start: 0, end: Math.PI };
      case 'left': return { start: Math.PI, end: 2 * Math.PI };
      default: return { start: 0, end: 2 * Math.PI };
    }
  };
  
  // Texto y formas
  const addTexto = useCallback(() => {
    const el = {
      _id: `txt_${Date.now()}`,
      type: 'texto',
      posicion: { x: 150, y: 150 },
      text: 'Texto',
      fontSize: 18,
      fill: '#333333',
      stroke: undefined,
      strokeWidth: 0
    };
    setElements(prev => {
      const newElements = [...prev, el];
      saveToHistory(newElements);
      return newElements;
    });
  }, [saveToHistory]);
  const addFormaRect = useCallback(() => {
    const el = {
      _id: `shape_${Date.now()}`,
      type: 'forma',
      kind: 'rect',
      posicion: { x: 200, y: 200 },
      width: 120,
      height: 80,
      rotation: 0,
      fill: '#eaeaea',
      stroke: '#999999',
      strokeWidth: 2
    };
    setElements(prev => {
      const newElements = [...prev, el];
      saveToHistory(newElements);
      return newElements;
    });
  }, [saveToHistory]);
  const addFormaCircle = useCallback(() => {
    const el = {
      _id: `shape_${Date.now()}`,
      type: 'forma',
      kind: 'circle',
      posicion: { x: 250, y: 250 },
      radius: 50,
      fill: '#eaeaea',
      stroke: '#999999',
      strokeWidth: 2
    };
    setElements(prev => {
      const newElements = [...prev, el];
      saveToHistory(newElements);
      return newElements;
    });
  }, [saveToHistory]);
  const addFormaTriangle = useCallback(() => {
    const el = {
      _id: `shape_${Date.now()}`,
      type: 'forma',
      kind: 'triangle',
      posicion: { x: 300, y: 300 },
      radius: 60,
      rotation: 0,
      fill: '#eaeaea',
      stroke: '#999999',
      strokeWidth: 2
    };
    setElements(prev => {
      const newElements = [...prev, el];
      saveToHistory(newElements);
      return newElements;
    });
  }, [saveToHistory]);

  // Funci³n para manejar la carga de imagen de fondo
  const handleBackgroundUpload = useCallback((file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Solo se permiten archivos de imagen!');
      return false;
    }
    
    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error('La imagen debe ser menor a 1MB!');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setBackgroundImage(img);
        setBackgroundImageElement({
          _id: `bg_${Date.now()}`,
          type: 'background',
          image: img,
          imageData: e.target.result, // Guardar como data URL
          width: Math.min(800, window.innerWidth - 320 - 80),
          height: Math.min(600, window.innerHeight - 80),
          x: 0,
          y: 0
        });
        message.success('Imagen de fondo cargada correctamente');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    return false; // Prevenir el comportamiento por defecto de Upload
  }, []);

  // Funci³n para remover el fondo
  const removeBackground = useCallback(() => {
    setBackgroundImage(null);
    setBackgroundImageElement(null);
    message.success('Fondo removido');
  }, []);

  const stageRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const selectedIdsRef = useRef([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState(null);
  const [selectRect, setSelectRect] = useState(null);

  useEffect(() => {
    // Cargar zonas
    const loadZonas = async () => {
      try {
        if (!salaId) return;
        const data = await fetchZonasPorSala(salaId);
        setZones(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error cargando zonas:', e);
        message.error('No se pudieron cargar las zonas');
      }
    };
    loadZonas();
  }, [salaId]);

  // Mantener selectedIdsRef actualizado
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    // Cargar meta config si viene embebida en elementos
    const meta = (elements || []).find(el => el.type === 'meta' && el.key === 'config');
    if (meta && meta.config) {
      if (meta.config.scale) setScale(meta.config.scale);
      if (meta.config.stagePos) setStagePos(meta.config.stagePos);
      if (typeof meta.config.gridSize === 'number') setGridSize(meta.config.gridSize);
      if (typeof meta.config.showGrid === 'boolean') setShowGrid(meta.config.showGrid);
      if (typeof meta.config.snapToGrid === 'boolean') setSnapToGrid(meta.config.snapToGrid);
      if (typeof meta.config.seatSpacing === 'number') setSeatSpacing(meta.config.seatSpacing);
      if (typeof meta.config.backgroundScale === 'number') setBackgroundScale(meta.config.backgroundScale);
      if (typeof meta.config.backgroundOpacity === 'number') setBackgroundOpacity(meta.config.backgroundOpacity);
      if (meta.config.backgroundImage) {
        setBackgroundImage(meta.config.backgroundImage.image);
        setBackgroundImageElement({
          _id: meta.config.backgroundImage._id,
          type: 'background',
          image: meta.config.backgroundImage.image,
          width: meta.config.backgroundImage.width,
          height: meta.config.backgroundImage.height,
          x: meta.config.backgroundImage.x,
          y: meta.config.backgroundImage.y
        });
      }
      // Opcional: eliminar meta del render
      setElements(prev => prev.filter(el => !(el.type === 'meta' && el.key === 'config')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar fondo desde elementos iniciales
  useEffect(() => {
    if (initialMapa?.contenido) {
      const bgElement = initialMapa.contenido.find(el => el.type === 'background');
      if (bgElement) {
        setBackgroundImageElement(bgElement);
        // Crear imagen desde data URL si existe
        if (bgElement.imageData) {
          const img = new window.Image();
          img.onload = () => {
            setBackgroundImage(img);
          };
          img.src = bgElement.imageData;
        }
      }
    }
  }, [initialMapa]);

  // Manejar redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.width(Math.min(800, window.innerWidth - 320 - 80));
        stageRef.current.height(Math.min(600, window.innerHeight - 80));
      }
      // Actualizar tama±o del fondo si existe
      if (backgroundImageElement) {
        setBackgroundImageElement(prev => ({
          ...prev,
          width: Math.min(800, window.innerWidth - 320 - 80),
          height: Math.min(600, window.innerHeight - 80)
        }));
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [backgroundImageElement]);

  // Manejar drag del popup de propiedades r¡pidas
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (popupDrag.isDragging && popupDrag.startPos) {
        const deltaX = e.clientX - popupDrag.startPos.x;
        const deltaY = e.clientY - popupDrag.startPos.y;
        const newX = popupDrag.offset.x + deltaX;
        const newY = popupDrag.offset.y + deltaY;
        setPopupDrag(prev => ({ 
          ...prev, 
          offset: { x: newX, y: newY },
          startPos: { x: e.clientX, y: e.clientY }
        }));
      }
    };

    const handleMouseUp = () => {
      if (popupDrag.isDragging) {
        setPopupDrag(prev => ({ ...prev, isDragging: false, startPos: null }));
      }
    };

    if (popupDrag.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [popupDrag.isDragging, popupDrag.startPos, popupDrag.offset]);

  const addMesaRect = useCallback(() => {
    const mesa = {
      _id: `mesa_${Date.now()}`,
      type: 'mesa',
      shape: 'rect',
      posicion: { x: 100 + (elements.length % 5) * 140, y: 120 + Math.floor(elements.length / 5) * 120 },
      width: 120,
      height: 80,
      rotation: 0,
      fill: '#f0f0f0',
      nombre: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`
    };
    setElements(prev => {
      const newElements = [...prev, mesa];
      saveToHistory(newElements);
      return newElements;
    });
  }, [elements, saveToHistory]);

  const addMesaCircle = useCallback(() => {
    const mesa = {
      _id: `shape_${Date.now()}`,
      type: 'mesa',
      shape: 'circle',
      posicion: { x: 200, y: 200 },
      radius: 60,
      rotation: 0,
      fill: '#f0f0f0',
      nombre: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`
    };
    setElements(prev => {
      const newElements = [...prev, mesa];
      saveToHistory(newElements);
      return newElements;
    });
  }, [elements, saveToHistory]);

  const addSilla = useCallback(() => {
    const baseX = 80 + (elements.length % 8) * 40;
    const baseY = 80 + Math.floor(elements.length / 8) * 40;
    const sillaBase = {
      _id: `silla_${Date.now()}`,
      type: 'silla',
      posicion: { x: baseX, y: baseY },
      shape: seatShape,
      fill: seatEmpty ? 'transparent' : '#00d6a4',
      stroke: seatEmpty ? '#d9d9d9' : undefined,
      empty: seatEmpty,
      state: 'available',
      numero: (elements.filter(e => e.type === 'silla').length + 1),
      nombre: ''
    };
    const silla = seatShape === 'circle'
      ? { ...sillaBase, radius: 10 }
      : seatShape === 'rect'
      ? { ...sillaBase, width: 20, height: 20 }
      : { ...sillaBase, width: 18, height: 14 }; // butaca
    setElements(prev => {
      const newElements = [...prev, silla];
      saveToHistory(newElements);
      return newElements;
    });
  }, [elements, seatEmpty, seatShape, saveToHistory]);

  const onDragEnd = useCallback((id, x, y) => {
    const nx = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const ny = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
    setElements(prev => {
      const curr = prev.find(el => el._id === id);
      if (!curr || !curr.posicion) return prev;
      const next = prev.map(el => el._id === id ? { ...el, posicion: { x: nx, y: ny } } : el);
      
      // Si se est¡ moviendo una silla y hay mºltiples sillas seleccionadas, mover el grupo con el mismo delta
      if (curr && curr.type === 'silla' && Array.isArray(selectedIdsRef.current) && selectedIdsRef.current.length > 1) {
        const dx = nx - (curr.posicion.x || 0);
        const dy = ny - (curr.posicion.y || 0);
        return next.map(el => {
          if (el._id !== id && selectedIdsRef.current.includes(el._id) && el.type === 'silla' && el.posicion) {
            const ex = (el.posicion.x || 0) + dx;
            const ey = (el.posicion.y || 0) + dy;
            return { ...el, posicion: { x: ex, y: ey } };
          }
          return el;
        });
      }
      
      // Si se est¡ moviendo cualquier elemento y hay mºltiples elementos seleccionados, mover el grupo
      if (Array.isArray(selectedIdsRef.current) && selectedIdsRef.current.length > 1 && selectedIdsRef.current.includes(id)) {
        const dx = nx - (curr.posicion.x || 0);
        const dy = ny - (curr.posicion.y || 0);
        return next.map(el => {
          if (el._id !== id && selectedIdsRef.current.includes(el._id) && el.posicion) {
            const ex = (el.posicion.x || 0) + dx;
            const ey = (el.posicion.y || 0) + dy;
            return { ...el, posicion: { x: ex, y: ey } };
          }
          return el;
        });
      }
      // Si se movi³ una mesa circular, reposicionar asientos adjuntos por arco/360
      if (curr && curr.type === 'mesa' && curr.shape === 'circle') {
        const mesa = next.find(el => el._id === id);
        if (!mesa || !mesa.posicion) return next;
        const cx = mesa.posicion.x;
        const cy = mesa.posicion.y;
        return next.map(seat => {
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.arc && seat.posicion) {
            const { start, end } = getArcAngles(seat.arc);
            const idx = seat.arcIndex || 0;
            const count = seat.arcCount || 1;
            const angle = start + (end - start) * ((idx + 1) / (count + 1));
            const r = (mesa.radius || 60) + seatSpacing;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.circleIndex != null && seat.circleCount && seat.posicion) {
            const angle = (seat.circleIndex * 2 * Math.PI) / seat.circleCount;
            const r = (mesa.radius || 60) + seatSpacing;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          return seat;
        });
      }
      // Si se movi³ una mesa rectangular, reposicionar sillas con sideIndex/sideCount
      if (curr && curr.type === 'mesa' && curr.shape === 'rect') {
        const mesa = next.find(el => el._id === id);
        if (!mesa || !mesa.posicion) return next;
        const w = mesa.width || 120;
        const h = mesa.height || 80;
        return next.map(seat => {
          if (seat.type !== 'silla' || seat.mesaId !== mesa._id || !seat.side || !seat.posicion) return seat;
          const count = seat.sideCount || 1;
          const idx = seat.sideIndex || 0;
          if (seat.side === 'top') {
            const xTop = mesa.posicion.x + (w / (count + 1)) * (idx + 1);
            const yTop = mesa.posicion.y - seatSpacing;
            return { ...seat, posicion: { x: xTop, y: yTop } };
          }
          if (seat.side === 'right') {
            const xR = mesa.posicion.x + w + seatSpacing;
            const yR = mesa.posicion.y + ((h / (count + 1)) * (idx + 1));
            return { ...seat, posicion: { x: xR, y: yR } };
          }
          if (seat.side === 'bottom') {
            const xB = mesa.posicion.x + (w / (count + 1)) * (idx + 1);
            const yB = mesa.posicion.y + h + seatSpacing;
            return { ...seat, posicion: { x: xB, y: yB } };
          }
          // left
          const xL = mesa.posicion.x - seatSpacing;
          const yL = mesa.posicion.y + ((h / (count + 1)) * (idx + 1));
          return { ...seat, posicion: { x: xL, y: yL } };
        });
      }
      const newElements = next;
      saveToHistory(newElements);
      return newElements;
    });
  }, [gridSize, snapToGrid, seatSpacing, saveToHistory]);

  
    setElements(prev => {
      const newElements = prev.filter(el => !selectedIds.includes(el._id));
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedIds([]);
  }, [selectedIds, saveToHistory]);

  
    setSelectedIds([]);
    saveToHistory([]);
  }, [saveToHistory]);

  const upsertMetaConfig = useCallback((list) => {
    const other = list.filter(el => !(el.type === 'meta' && el.key === 'config'));
    const meta = {
      _id: 'meta_config',
      type: 'meta',
      key: 'config',
      config: {
        scale,
        stagePos,
        gridSize,
        showGrid,
        snapToGrid,
        seatSpacing,
        backgroundScale,
        backgroundOpacity,
        backgroundImage: backgroundImageElement ? {
          _id: backgroundImageElement._id,
          type: 'background',
          width: backgroundImageElement.width,
          height: backgroundImageElement.height,
          x: backgroundImageElement.x,
          y: backgroundImageElement.y
        } : null
      }
    };
    return [...other, meta];
  }, [scale, stagePos, gridSize, showGrid, snapToGrid, seatSpacing, backgroundScale, backgroundOpacity, backgroundImageElement]);

  const handleSaveClick = useCallback(async () => {
    try {
      if (!Array.isArray(elements)) {
        throw new Error('El contenido del mapa debe ser un array');
      }
      let listWithMeta = upsertMetaConfig(elements);
      
      // A±adir el fondo al contenido si existe
      if (backgroundImageElement) {
        listWithMeta = [...listWithMeta, backgroundImageElement];
      }
      
      const payload = {
        nombre: 'Mapa de Sala',
        descripcion: '',
        estado: 'active',
        contenido: listWithMeta
      };
      await onSave(payload);
    } catch (err) {
      message.error(err.message || 'Error al guardar');
    }
  }, [elements, onSave, upsertMetaConfig, backgroundImageElement]);

  const assignZoneToSelection = useCallback(() => {
    if (!selectedIds?.length || !selectedZoneId) return;
    const zone = zones.find(z => String(z.id) === String(selectedZoneId));
    if (!zone) return;
    setElements(prev => {
      const newElements = prev.map(el => selectedIds.includes(el._id) ? { ...el, zona: { id: zone.id, nombre: zone.nombre, color: zone.color || '#999' } } : el);
      saveToHistory(newElements);
      return newElements;
    });
  }, [selectedIds, selectedZoneId, zones, saveToHistory]);

  // Funci³n helper para crear asientos base
  const createBaseSeat = useCallback((mesa, seq, extra = {}) => ({
    _id: `silla_${Date.now()}_${seq}`,
    type: 'silla',
    shape: seatShape,
    fill: seatEmpty ? 'transparent' : '#00d6a4',
    stroke: seatEmpty ? '#d9d9d9' : undefined,
    empty: seatEmpty,
    numero: seq,
    nombre: '',
    mesaId: mesa._id,
    zona: mesa.zona,
    ...extra
  }), [seatShape, seatEmpty]);

  const addSeatsToMesaAll = useCallback(() => {
    if (!selectedIds?.length) return;
    const mesa = elements.find(e => selectedIds.includes(e._id) && e.type === 'mesa');
    if (!mesa || !mesa.posicion) return;
    const nuevas = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    if (mesa.shape === 'rect') {
      // borrar existentes por lados para esta mesa para evitar duplicados
      let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && e.side));
      const { top, right, bottom, left } = rectSideCounts;
      const allPositions = [];
      
      // Calcular todas las posiciones
      // top
      for (let i = 0; i < top; i++) {
        const x = mesa.posicion.x + ((mesa.width || 120) / (top + 1)) * (i + 1);
        const y = mesa.posicion.y - seatSpacing;
        allPositions.push({ x, y, side: 'top', sideIndex: i, sideCount: top });
      }
      // right
      for (let i = 0; i < right; i++) {
        const x = mesa.posicion.x + (mesa.width || 120) + seatSpacing;
        const y = mesa.posicion.y + ((mesa.height || 80) / (right + 1)) * (i + 1);
        allPositions.push({ x, y, side: 'right', sideIndex: i, sideCount: right });
      }
      // bottom
      for (let i = 0; i < bottom; i++) {
        const x = mesa.posicion.x + ((mesa.width || 120) / (bottom + 1)) * (i + 1);
        const y = mesa.posicion.y + (mesa.height || 80) + seatSpacing;
        allPositions.push({ x, y, side: 'bottom', sideIndex: i, sideCount: bottom });
      }
      // left
      for (let i = 0; i < left; i++) {
        const x = mesa.posicion.x - seatSpacing;
        const y = mesa.posicion.y + ((mesa.height || 80) / (left + 1)) * (i + 1);
        allPositions.push({ x, y, side: 'left', sideIndex: i, sideCount: left });
      }
      
      // Ordenar todas las posiciones de izquierda a derecha
      allPositions.sort((a, b) => a.x - b.x);
      
      // Crear asientos con las posiciones ordenadas
      allPositions.forEach(pos => {
        const base = createBaseSeat(mesa, seq++, { 
          posicion: { x: pos.x, y: pos.y }, 
          side: pos.side, 
          sideIndex: pos.sideIndex, 
          sideCount: pos.sideCount 
        });
        nuevas.push(seatShape === 'circle' ? { ...base, radius: 10 } : seatShape === 'rect' ? { ...base, width: 20, height: 20 } : { ...base, width: 18, height: 14 });
      });
      setElements(base.concat(nuevas));
      message.success(`${nuevas.length} asientos agregados`);
      return;
    } else {
      // borrar existentes 360° para esta mesa
      let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && (e.circleIndex != null)));
      const cx = mesa.posicion.x;
      const cy = mesa.posicion.y;
      const r = (mesa.radius || 60) + 25;
      const count = circleSeatsCount;
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const base = createBaseSeat(mesa, seq++, { posicion: { x, y }, circleIndex: i, circleCount: count });
        nuevas.push(seatShape === 'circle' ? { ...base, radius: 10 } : seatShape === 'rect' ? { ...base, width: 20, height: 20 } : { ...base, width: 18, height: 14 });
      }
      setElements(base.concat(nuevas));
      message.success(`360°: ${nuevas.length} asientos`);
      return;
    }
  }, [selectedIds, elements, rectSideCounts, circleSeatsCount, createBaseSeat, seatSpacing]);

  const addSeatsToRectSide = useCallback((side) => {
    if (!selectedIds?.length) return;
    const mesa = elements.find(e => selectedIds.includes(e._id) && e.type === 'mesa' && e.shape === 'rect');
    if (!mesa || !mesa.posicion) return;
    const nuevas = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    const countMap = { top: rectSideCounts.top, right: rectSideCounts.right, bottom: rectSideCounts.bottom, left: rectSideCounts.left };
    const n = countMap[side] || 0;
    // quitar existentes de ese lado
    let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && e.side === side));
    // Calcular posiciones de izquierda a derecha
    const positions = [];
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0;
      if (side === 'top') {
        x = mesa.posicion.x + ((mesa.width || 120) / (n + 1)) * (i + 1); 
        y = mesa.posicion.y - seatSpacing;
      } else if (side === 'right') {
        x = mesa.posicion.x + (mesa.width || 120) + seatSpacing; 
        y = mesa.posicion.y + ((mesa.height || 80) / (n + 1)) * (i + 1);
      } else if (side === 'bottom') {
        x = mesa.posicion.x + ((mesa.width || 120) / (n + 1)) * (i + 1); 
        y = mesa.posicion.y + (mesa.height || 80) + seatSpacing;
      } else {
        x = mesa.posicion.x - seatSpacing; 
        y = mesa.posicion.y + ((mesa.height || 80) / (n + 1)) * (i + 1);
      }
      positions.push({ x, y, index: i });
    }
    
    // Ordenar posiciones de izquierda a derecha
    positions.sort((a, b) => a.x - b.x);
    
    // Crear asientos con las posiciones ordenadas
    positions.forEach((pos, i) => {
      const base = {
        _id: `silla_${Date.now()}_${seq}`,
        type: 'silla',
        posicion: { x: pos.x, y: pos.y },
        shape: seatShape,
        fill: seatEmpty ? 'transparent' : '#00d6a4',
        stroke: seatEmpty ? '#d9d9d9' : undefined,
        empty: seatEmpty,
        numero: seq++,
        nombre: '',
        mesaId: mesa._id,
        zona: mesa.zona,
        side,
        sideIndex: pos.index,
        sideCount: n
      };
      nuevas.push(seatShape === 'circle' ? { ...base, radius: 10 } : seatShape === 'rect' ? { ...base, width: 20, height: 20 } : { ...base, width: 18, height: 14 });
    });
    setElements(prev => {
      const newElements = base.concat(nuevas);
      saveToHistory(newElements);
      return newElements;
    });
    message.success(`${nuevas.length} asientos agregados en ${side}`);
  }, [selectedIds, elements, rectSideCounts, createBaseSeat, seatSpacing, saveToHistory]);

  const addSeatsToCircleArc = useCallback(() => {
    if (!selectedIds?.length) return;
    const mesa = elements.find(e => selectedIds.includes(e._id) && e.type === 'mesa' && e.shape === 'circle');
    if (!mesa || !mesa.posicion) return;
    // quitar existentes del mismo arco en esta mesa
    let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && e.arc === circleArc));
    const { start, end } = getArcAngles(circleArc);
    const nuevas = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    const cx = mesa.posicion.x;
    const cy = mesa.posicion.y;
    const r = (mesa.radius || 60) + seatSpacing;
    for (let i = 0; i < circleArcCount; i++) {
      const angle = start + (end - start) * ((i + 1) / (circleArcCount + 1));
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const base = createBaseSeat(mesa, seq++, { posicion: { x, y }, circleIndex: i, circleCount: circleArcCount });
      nuevas.push(seatShape === 'circle' ? { ...base, radius: 10 } : seatShape === 'rect' ? { ...base, width: 20, height: 20 } : { ...base, width: 18, height: 14 });
    }
    setElements(prev => {
      const newElements = base.concat(nuevas);
      saveToHistory(newElements);
      return newElements;
    });
    message.success(`${nuevas.length} asientos agregados en arco ${circleArc}`);
  }, [selectedIds, elements, circleArc, circleArcCount, createBaseSeat, seatSpacing, saveToHistory]);

  const handleStageContextMenu = useCallback((e) => {
    e.evt.preventDefault();
  }, []);

  const createRowSeatsFromDrag = useCallback((start, end) => {
    if (!start || !end) return;
    const count = Math.max(1, rowCount);
    const dx = (end.x - start.x) / (count);
    const dy = (end.y - start.y) / (count);
    const newSeats = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    for (let i = 0; i < count; i++) {
      const x = start.x + dx * (i + 0.5);
      const y = start.y + dy * (i + 0.5);
      const base = { _id: `silla_${Date.now()}_${seq}`, type: 'silla', posicion: { x, y }, shape: seatShape, fill: seatEmpty ? 'transparent' : '#00d6a4', stroke: seatEmpty ? '#d9d9d9' : undefined, empty: seatEmpty, numero: seq++, nombre: `${rowLabel}${i + 1}` };
      newSeats.push(seatShape === 'circle' ? { ...base, radius: 10 } : seatShape === 'rect' ? { ...base, width: 20, height: 20 } : { ...base, width: 18, height: 14 });
    }
    setElements(prev => {
      const newElements = [...prev, ...newSeats];
      saveToHistory(newElements);
      return newElements;
    });
    message.success(`Fila ${rowLabel} con ${count} asientos creada`);
  }, [rowCount, rowLabel, elements, seatEmpty, seatShape, saveToHistory]);

  const handleMouseDown = useCallback((e) => {
    if (rowMode) {
      const pos = e.target.getStage().getPointerPosition();
      setRowStart(pos);
      return;
    }
    // Right click for pan
    if (e.evt.button === 2) {
      setIsRightPanning(true);
      const stage = e.target.getStage();
      stage.draggable(true);
      return;
    }
    // Inicio selecci³n rectangular con bot³n izquierdo en el lienzo
    if (e.evt.button === 0 && e.target === e.target.getStage()) {
      const pos = e.target.getStage().getPointerPosition();
      setIsSelecting(true);
      setSelectStart(pos);
      setSelectRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  }, [rowMode]);

  const handleMouseUp = useCallback((e) => {
    if (rowMode && rowStart) {
      const pos = e.target.getStage().getPointerPosition();
      createRowSeatsFromDrag(rowStart, pos);
      setRowStart(null);
      setRowPreview(null);
      return;
    }
    if (isRightPanning) {
      const stage = e.target.getStage();
      stage.draggable(false);
      setIsRightPanning(false);
      // actualizar stagePos al terminar paneo
      setStagePos({ x: stage.x(), y: stage.y() });
      return;
    }
    if (isSelecting) {
      // Finalizar selecci³n rectangular
      const rect = selectRect;
      const x1 = Math.min(rect.x, rect.x + rect.w);
      const y1 = Math.min(rect.y, rect.y + rect.h);
      const x2 = Math.max(rect.x, rect.x + rect.w);
      const y2 = Math.max(rect.y, rect.y + rect.h);
      const newly = elements.filter(el => {
        if (!el.posicion) return false;
        const ex = el.posicion.x;
        const ey = el.posicion.y;
        return ex >= x1 && ex <= x2 && ey >= y1 && ey <= y2;
      }).map(el => el._id);
      setSelectedIds(newly);
      setIsSelecting(false);
      setSelectRect(null);
      setSelectStart(null);
    }
  }, [rowMode, rowStart, isRightPanning, createRowSeatsFromDrag, isSelecting, selectRect, elements]);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Tab') {
        ev.preventDefault();
        if (!selectedIds?.length) return;
        const el = elements.find(x => selectedIds.includes(x._id));
        if (!el) return;
        const newName = window.prompt('Nuevo nombre', el.nombre || '');
        if (newName !== null) {
          setElements(prev => prev.map(x => selectedIds.includes(x._id) ? { ...x, nombre: newName } : x));
        }
      }
      // Tecla Suprimir para eliminar elementos seleccionados
      if (ev.key === 'Delete' && selectedIds?.length) {
        ev.preventDefault();
        setElements(prev => prev.filter(el => !selectedIds.includes(el._id)));
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, elements]);

  const handleElementDblClick = useCallback((el) => {
    if (el.type === 'texto') {
      const newText = window.prompt('Nuevo texto', el.text || '');
      if (newText !== null) {
        setElements(prev => prev.map(x => x._id === el._id ? { ...x, text: newText } : x));
      }
      return;
    }
    const newName = window.prompt('Nuevo nombre', el.nombre || '');
    if (newName !== null) {
      setElements(prev => prev.map(x => x._id === el._id ? { ...x, nombre: newName } : x));
    }
  }, []);

  const updateSelectedProp = useCallback((prop, value) => {
    if (!selectedIds?.length) return;
    setElements(prev => {
      const next = prev.map(el => selectedIds.includes(el._id) ? { ...el, [prop]: value } : el);
      const mesa = next.find(el => selectedIds.includes(el._id) && el.type === 'mesa' && el.shape === 'circle');
      if (mesa && mesa.posicion && (prop === 'radius' || prop === 'posicion')) {
        const cx = mesa.posicion.x;
        const cy = mesa.posicion.y;
        return next.map(seat => {
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.arc && seat.posicion) {
            const { start, end } = getArcAngles(seat.arc);
            const idx = seat.arcIndex || 0;
            const count = seat.arcCount || 1;
            const angle = start + (end - start) * ((idx + 1) / (count + 1));
            const r = (mesa.radius || 60) + 25;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.circleIndex != null && seat.circleCount && seat.posicion) {
            const angle = (seat.circleIndex * 2 * Math.PI) / seat.circleCount;
            const r = (mesa.radius || 60) + 25;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          return seat;
        });
      }
      const mesaRect = next.find(el => selectedIds.includes(el._id) && el.type === 'mesa' && el.shape === 'rect');
      if (mesaRect && mesaRect.posicion && (prop === 'width' || prop === 'height' || prop === 'posicion')) {
        const w = mesaRect.width || 120;
        const h = mesaRect.height || 80;
        return next.map(seat => {
          if (seat.type !== 'silla' || seat.mesaId !== mesaRect._id || !seat.side || !seat.posicion) return seat;
          const count = seat.sideCount || 1;
          const idx = seat.sideIndex || 0;
          if (seat.side === 'top') {
            const xTop = mesaRect.posicion.x + (w / (count + 1)) * (idx + 1);
            const yTop = mesaRect.posicion.y - seatSpacing;
            return { ...seat, posicion: { x: xTop, y: yTop } };
          }
          if (seat.side === 'right') {
            const xR = mesaRect.posicion.x + w + seatSpacing;
            const yR = mesaRect.posicion.y + ((h / (count + 1)) * (idx + 1));
            return { ...seat, posicion: { x: xR, y: yR } };
          }
          return seat;
        });
      }
      const newElements = next;
      saveToHistory(newElements);
      return newElements;
    });
  }, [selectedIds, seatSpacing, saveToHistory]);

  const zoomIn = useCallback(() => setScale(s => Math.min(3, s + 0.1)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(0.2, s - 0.1)), []);

  const renderGrid = useCallback(() => {
    const lines = [];
    const maxW = 2000;
    const maxH = 1400;
    for (let x = 0; x <= maxW; x += gridSize) {
      lines.push(<Line key={`v${x}`} points={[x, 0, x, maxH]} stroke="#f0f0f0" strokeWidth={1} listening={false} />);
    }
    for (let y = 0; y <= maxH; y += gridSize) {
      lines.push(<Line key={`h${y}`} points={[0, y, 2000, y]} stroke="#f0f0f0" strokeWidth={1} listening={false} />);
    }
    return lines;
  }, [gridSize]);

  const addOneSeatRectSide = useCallback((mesa, side) => {
    const countExisting = elements.filter(e => e.type === 'silla' && e.mesaId === mesa._id && e.side === side).length;
    setRectSideCounts(prev => ({ ...prev, [side]: countExisting + 1 }));
    // Reusar funci³n de a±adir por lado que reequilibra
    setTimeout(() => addSeatsToRectSide(side), 0);
  }, [elements, addSeatsToRectSide]);

  const addOneSeatCircleArc = useCallback((mesa, arc) => {
    const countExisting = elements.filter(e => e.type === 'silla' && e.mesaId === mesa._id && e.arc === arc).length;
    setCircleArc(arc);
    setCircleArcCount(countExisting + 1);
    setTimeout(() => addSeatsToCircleArc(), 0);
  }, [elements, addSeatsToCircleArc]);

  const selectedEl = elements.find(e => selectedIds.includes(e._id)) || null;
  // Calcular posici³n del popup junto al elemento con auto-flip
  const computePopupStyle = () => {
    if (!selectedEl || !selectedEl.posicion || !stageRef.current || !canvasContainerRef.current) return { display: 'none' };
    const stage = stageRef.current;
    const container = canvasContainerRef.current;
    const scaleX = stage.scaleX();
    const scaleY = stage.scaleY();
    const sx = stage.x() || 0;
    const sy = stage.y() || 0;
    // centro del elemento
    let cx = selectedEl.posicion.x;
    let cy = selectedEl.posicion.y;
    if (selectedEl.type === 'mesa' && selectedEl.shape === 'rect') {
      cx = selectedEl.posicion.x + (selectedEl.width || 120) / 2;
      cy = selectedEl.posicion.y + (selectedEl.height || 80) / 2;
    }
    // convertir a coords de pantalla dentro del container considerando el zoom
    const px = cx * scaleX + sx;
    const py = cy * scaleY + sy;
    const margin = 10;
    const popupW = 320;
    const popupH = 160;
    let left = px + margin + popupDrag.offset.x;
    let top = py - popupH / 2 + popupDrag.offset.y;
    // auto-flip horizontal
    if (left + popupW > container.clientWidth) left = px - popupW - margin + popupDrag.offset.x;
    if (left < 0) left = margin + popupDrag.offset.x;
    // auto-flip vertical
    if (top < 0) top = py + margin + popupDrag.offset.y;
    if (top + popupH > container.clientHeight) top = container.clientHeight - popupH - margin + popupDrag.offset.y;
    return { 
      position: 'absolute', 
      left, 
      top, 
      background: 'white', 
      border: '1px solid #e5e7eb', 
      borderRadius: 8, 
      padding: 12, 
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)', 
      maxWidth: popupW, 
      zIndex: 10,
      cursor: popupDrag.isDragging ? 'grabbing' : 'grab',
      userSelect: 'none'
    };
  };

  const renderElement = useCallback((element) => {
    if (!element || !element.posicion) return null;
    const isSelected = selectedIds.includes(element._id);
    const commonProps = {
      key: element._id,
      x: element.posicion.x,
      y: element.posicion.y,
      draggable: !isRightPanning,
      onClick: (e) => {
        if (e.evt.shiftKey) {
          setSelectedIds(prev => prev.includes(element._id) ? prev.filter(id => id !== element._id) : [...prev, element._id]);
        } else {
          setSelectedIds([element._id]);
          // Activar input autom¡ticamente si es una silla
          if (element.type === 'silla') {
            setActiveInput('numero');
          }
        }
      },
      onDblClick: () => handleElementDblClick(element),
      onDragEnd: (e) => onDragEnd(element._id, e.target.x(), e.target.y())
    };
    const zoneStroke = element.zona?.color || (isSelected ? '#1890ff' : '#d9d9d9');
    if (element.type === 'texto') {
      return (
        <KonvaText
          key={element._id}
          x={element.posicion.x}
          y={element.posicion.y}
          text={element.text || 'Texto'}
          fontSize={element.fontSize || 18}
          fill={element.fill || '#333'}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth || 0}
          draggable={!isRightPanning}
          onClick={(e) => {
            if (e.evt.shiftKey) {
              setSelectedIds(prev => prev.includes(element._id) ? prev.filter(id => id !== element._id) : [...prev, element._id]);
            } else {
              setSelectedIds([element._id]);
              // Activar input autom¡ticamente si es una silla
              if (element.type === 'silla') {
                setActiveInput('numero');
              }
            }
          }}
          onDblClick={() => handleElementDblClick(element)}
          onDragEnd={(e) => onDragEnd(element._id, e.target.x(), e.target.y())}
        />
      );
    }
    if (element.type === 'forma') {
      if (element.kind === 'circle') {
        return (
          <Group {...commonProps}>
            <Circle radius={element.radius || 50} fill={element.fill || '#eaeaea'} stroke={element.stroke || '#999'} strokeWidth={element.strokeWidth || 2} />
          </Group>
        );
      }
      if (element.kind === 'triangle') {
        return (
          <Group {...commonProps}>
            <RegularPolygon sides={3} radius={element.radius || 60} fill={element.fill || '#eaeaea'} stroke={element.stroke || '#999'} strokeWidth={element.strokeWidth || 2} rotation={element.rotation || 0} />
          </Group>
        );
      }
      return (
        <Group {...commonProps}>
          <Rect width={element.width || 120} height={element.height || 80} fill={element.fill || '#eaeaea'} stroke={element.stroke || '#999'} strokeWidth={element.strokeWidth || 2} rotation={element.rotation || 0} />
        </Group>
      );
    }
    if (element.type === 'mesa') {
      if (element.shape === 'circle') {
        const r = element.radius || 60;
        return (
          <Group {...commonProps}>
            <Circle radius={r} fill={element.fill || '#f0f0f0'} stroke={zoneStroke} strokeWidth={isSelected ? 3 : 2} />
            {showTableLabels && (
              <KonvaText text={element.nombre || 'Mesa'} fontSize={element.labelSize || 14} fill={element.labelColor || '#333'} offsetX={((element.nombre || 'Mesa').length * (element.labelSize || 14)) / 4} x={0} y={-7} />
            )}
            {isSelected && (
              <>
                {/* Handles en cardinales para a±adir asientos por arco */}
                <Circle x={0} y={-r - 15} radius={6} fill="#1890ff" onClick={() => addOneSeatCircleArc(element, 'top')} />
                <Circle x={r + 15} y={0} radius={6} fill="#1890ff" onClick={() => addOneSeatCircleArc(element, 'right')} />
                <Circle x={0} y={r + 15} radius={6} fill="#1890ff" onClick={() => addOneSeatCircleArc(element, 'bottom')} />
                <Circle x={-r - 15} y={0} radius={6} fill="#1890ff" onClick={() => addOneSeatCircleArc(element, 'left')} />
              </>
            )}
          </Group>
        );
      }
      const w = element.width || 120;
      const h = element.height || 80;
      return (
        <Group {...commonProps}>
          <Rect width={w} height={h} fill={element.fill || '#f0f0f0'} stroke={zoneStroke} strokeWidth={isSelected ? 3 : 2} rotation={element.rotation || 0} />
          {showTableLabels && (
            <KonvaText text={element.nombre || 'Mesa'} fontSize={element.labelSize || 14} fill={element.labelColor || '#333'} offsetX={((element.nombre || 'Mesa').length * (element.labelSize || 14)) / 4} x={w/2} y={h/2 - (element.labelSize || 14)/2} />
          )}
          {isSelected && (
            <>
              {/* Handles en el centro de cada lado para a±adir asientos */}
              <Circle x={w / 2} y={-15} radius={6} fill="#1890ff" onClick={() => addOneSeatRectSide(element, 'top')} />
              <Circle x={w + 15} y={h / 2} radius={6} fill="#1890ff" onClick={() => addOneSeatRectSide(element, 'right')} />
              <Circle x={w / 2} y={h + 15} radius={6} fill="#1890ff" onClick={() => addOneSeatRectSide(element, 'bottom')} />
              <Circle x={-15} y={h / 2} radius={6} fill="#1890ff" onClick={() => addOneSeatRectSide(element, 'left')} />
            </>
          )}
        </Group>
      );
    }
    if (element.type === 'silla') {
      const seatStroke = element.stroke || (isSelected ? '#1890ff' : '#a8aebc');
      const seatOpacity = element.empty ? 0.5 : 1;
      const shapeToDraw = element.shape || seatShape || 'circle';
      if (shapeToDraw === 'circle') {
        return (
          <Group {...commonProps} opacity={seatOpacity}>
            <Circle radius={element.radius || 10} fill={element.fill || '#00d6a4'} stroke={seatStroke} strokeWidth={isSelected ? 3 : 2} />
            {showSeatNumbers && element.numero ? <KonvaText text={String(element.numero)} fontSize={10} fill="#333" x={-4} y={-4} /> : null}
          </Group>
        );
      }
      if (shapeToDraw === 'rect') {
        return (
          <Group {...commonProps} opacity={seatOpacity}>
            <Rect width={element.width || 20} height={element.height || 20} fill={element.fill || '#00d6a4'} stroke={seatStroke} strokeWidth={isSelected ? 3 : 2} />
            {showSeatNumbers && element.numero ? <KonvaText text={String(element.numero)} fontSize={10} fill="#333" x={-4} y={-4} /> : null}
          </Group>
        );
      }
      // butaca: rect con respaldo
      return (
        <Group {...commonProps} opacity={seatOpacity}>
          <Rect width={element.width || 18} height={element.height || 14} y={4} fill={element.fill || '#00d6a4'} stroke={seatStroke} strokeWidth={isSelected ? 3 : 2} />
          <Rect width={element.width || 18} height={6} y={-6} fill={element.fill || '#00d6a4'} stroke={seatStroke} strokeWidth={isSelected ? 3 : 2} />
          {showSeatNumbers && element.numero ? <KonvaText text={String(element.numero)} fontSize={9} fill="#333" x={-4} y={-2} /> : null}
        </Group>
      );
    }
    return null;
  }, [selectedIds, isRightPanning, handleElementDblClick, onDragEnd, addOneSeatRectSide, addOneSeatCircleArc, showTableLabels, showSeatNumbers, seatShape]);

  // Render
  return (
    <div className="h-screen flex flex-col">
      {/* Contenido principal */}
      <div className="flex-1 flex">
        {/* Panel lateral izquierdo */}
        <div className="w-80 border-r bg-white p-3 flex flex-col gap-2 overflow-y-auto">
          {/* Informaci³n de sala */}
          <div className="text-center pb-2 border-b">
            <h3 className="text-sm font-medium mb-1">Editar Mapa</h3>
            <span className="text-xs text-gray-500">Sala: {salaId}</span>
          </div>
          
          {/* Bot³n de guardar */}
          <Button type="primary" onClick={handleSaveClick} icon={<SaveOutlined />} block>
            Guardar Mapa
          </Button>
          
          {/* Botones de deshacer/rehacer */}
          <div className="flex gap-1">
            <Button 
              onClick={undo} 
              disabled={historyIndex <= 0}
              icon={<UndoOutlined />} 
              size="small"
              title="Ctrl+Z"
            >
              Deshacer
            </Button>
            <Button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1}
              icon={<UndoOutlined style={{ transform: 'scaleX(-1)' }} />} 
              size="small"
              title="Ctrl+Y"
            >
              Rehacer
            </Button>
          </div>
          
          <Button onClick={onCancel} icon={<ArrowLeftOutlined />} block>
            Volver
          </Button>
          <Divider />
          
          <Collapse 
            defaultActiveKey={[]} 
            ghost 
            size="small"
            expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
          >
            <Collapse.Panel header="Zonas" key="zones">
              <Space direction="vertical" size="small" className="w-full">
                <label htmlFor="zone-select" className="sr-only">Seleccionar zona</label>
                <Select
                  id="zone-select"
                  placeholder="Seleccione zona"
                  value={selectedZoneId}
                  onChange={setSelectedZoneId}
                  className="w-full"
                  options={(zones || []).map(z => ({ label: z.nombre, value: String(z.id) }))}
                  aria-label="Seleccionar zona"
                />
                <Button onClick={assignZoneToSelection} disabled={!selectedIds?.length || !selectedZoneId} block size="small">
                  Asignar a seleccionado
                </Button>
              </Space>
            </Collapse.Panel>

            <Collapse.Panel header="Herramientas" key="tools">
              <Space direction="vertical" size="small" className="w-full">
                <Button onClick={addMesaRect} block size="small">A±adir mesa cuadrada</Button>
                <Button onClick={addMesaCircle} block size="small">A±adir mesa redonda</Button>
                <Button onClick={addSilla} block size="small">A±adir silla suelta</Button>
                <Button onClick={addTexto} block size="small">A±adir texto</Button>
                <div className="grid grid-cols-3 gap-1">
                  <Button onClick={addFormaRect} size="small">Cuadrado</Button>
                  <Button onClick={addFormaCircle} size="small">C­rculo</Button>
                  <Button onClick={addFormaTriangle} size="small">Tri¡ngulo</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={seatEmpty} onChange={(e) => setSeatEmpty(e.target.checked)}>Asientos vac­os</Checkbox>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={showTableLabels} onChange={(e) => setShowTableLabels(e.target.checked)}>Mostrar nombres</Checkbox>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={showSeatNumbers} onChange={(e) => setShowSeatNumbers(e.target.checked)}>Mostrar nºmeros</Checkbox>
                </div>
                <div className="flex items-center gap-2">
                  <span>Forma silla:</span>
                  <Select value={seatShape} onChange={setSeatShape} options={[{value:'circle',label:'Redonda'},{value:'rect',label:'Cuadrada'},{value:'butaca',label:'Butaca'}]} size="small" style={{ width: 100 }} />
                </div>
                <Button onClick={() => setRowMode(m => !m)} type={rowMode ? 'primary' : 'default'} block size="small">
                  {rowMode ? 'Modo fila: activo' : 'Crear fila (arrastre)'}
                </Button>
                {rowMode && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">Fila:</span>
                    <Input value={rowLabel} onChange={e => setRowLabel(e.target.value)} size="small" style={{ width: 60 }} />
                    <span className="text-xs">Cant:</span>
                    <InputNumber min={1} max={200} value={rowCount} onChange={setRowCount} size="small" style={{ width: 60 }} />
                  </div>
                )}
              </Space>
            </Collapse.Panel>

            <Collapse.Panel header="Fondo y Grid" key="background">
              <Space direction="vertical" size="small" className="w-full">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={showGrid} 
                    onChange={(e) => setShowGrid(e.target.checked)}
                  >
                    Mostrar grid
                  </Checkbox>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} disabled={!showGrid}>
                    Snap to grid
                  </Checkbox>
                </div>
                {showGrid && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Tama±o:</span>
                    <InputNumber 
                      min={5} 
                      max={100} 
                      value={gridSize} 
                      onChange={setGridSize} 
                      size="small"
                      style={{ width: 60 }}
                    />
                  </div>
                )}
                <Divider />
                <div className="text-xs text-gray-600">Imagen de fondo:</div>
                <Upload
                  accept="image/*"
                  beforeUpload={handleBackgroundUpload}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button icon={<PictureOutlined />} block size="small">
                    Subir fondo
                  </Button>
                </Upload>
                {backgroundImageElement && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Tama±o:</span>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={backgroundScale}
                        onChange={setBackgroundScale}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Transparencia:</span>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={backgroundOpacity}
                        onChange={setBackgroundOpacity}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <Button onClick={removeBackground} danger size="small" block>
                      Remover fondo
                    </Button>
                  </>
                )}
              </Space>
            </Collapse.Panel>
          </Collapse>
        </div>

        {/* Canvas a la derecha - m¡s peque±o */}
        <div ref={canvasContainerRef} className="flex-1 bg-white relative" onContextMenu={(e) => e.preventDefault()}>
          <Stage
            ref={stageRef}
            width={Math.min(800, window.innerWidth - 320 - 80)}
            height={Math.min(600, window.innerHeight - 80)}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            onContextMenu={handleStageContextMenu}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={(e) => {
              const pos = e.target.getStage().getPointerPosition();
              if (rowMode && rowStart) {
                setRowPreview({ start: rowStart, end: pos });
              } else if (isSelecting && selectStart) {
                setSelectRect({ x: selectStart.x, y: selectStart.y, w: pos.x - selectStart.x, h: pos.y - selectStart.y });
              }
            }}
          >
            <Layer listening={false}>
              <Rect width={Math.min(800, window.innerWidth - 320 - 80)} height={Math.min(600, window.innerHeight - 80)} fill="#fff" />
              {backgroundImage && backgroundImageElement && (
                <KonvaImage
                  image={backgroundImage}
                  x={backgroundImageElement.x}
                  y={backgroundImageElement.y}
                  width={backgroundImageElement.width * backgroundScale}
                  height={backgroundImageElement.height * backgroundScale}
                  opacity={backgroundOpacity}
                  listening={false}
                />
              )}
              {showGrid && renderGrid()}
              {rowMode && rowPreview && (
                <>
                  <Line points={[rowPreview.start.x, rowPreview.start.y, rowPreview.end.x, rowPreview.end.y]} stroke="#00d6a4" strokeWidth={2} dash={[6, 6]} />
                  {/* marcas */}
                  {[...Array(Math.max(1, rowCount))].map((_, i) => {
                    const t = (i + 1) / (rowCount + 1);
                    const mx = rowPreview.start.x + (rowPreview.end.x - rowPreview.start.x) * t;
                    const my = rowPreview.start.y + (rowPreview.end.y - rowPreview.start.y) * t;
                    return <Circle key={`tick_${i}`} x={mx} y={my} radius={3} fill="#00d6a4" />
                  })}
                  {/* distancia */}
                  {(() => {
                    const dx = rowPreview.end.x - rowPreview.start.x;
                    const dy = rowPreview.end.y - rowPreview.start.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const label = `${Math.round(dist)} px | ${rowCount} sillas`;
                    const lx = (rowPreview.start.x + rowPreview.end.x) / 2;
                    const ly = (rowPreview.start.y + rowPreview.end.y) / 2;
                    return <KonvaText x={lx} y={ly - 18} text={label} fontSize={12} fill="#00d6a4" />
                  })()}
                </>
              )}
              {isSelecting && selectRect && (
                <Rect
                  x={Math.min(selectRect.x, selectRect.x + selectRect.w)}
                  y={Math.min(selectRect.y, selectRect.y + selectRect.h)}
                  width={Math.abs(selectRect.w)}
                  height={Math.abs(selectRect.h)}
                  stroke="#1890ff"
                  dash={[4, 4]}
                  strokeWidth={1}
                  fill="rgba(24,144,255,0.1)"
                />
              )}
            </Layer>
            <Layer>
              {elements.map(renderElement)}
            </Layer>
          </Stage>

          {/* Botones de zoom y centrar */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <Button.Group size="small">
              <Button onClick={zoomIn} icon={<ZoomInOutlined />} />
              <Button onClick={zoomOut} icon={<ZoomOutOutlined />} />
            </Button.Group>
            <Button 
              size="small"
              onClick={() => {
                setStagePos({ x: 0, y: 0 });
                setScale(1);
              }} 
              icon={<AimOutlined />}
            >
              Centrar
            </Button>
          </div>

          {/* Popup contextual de propiedades r¡pidas */}
          {selectedEl && (
            <div style={computePopupStyle()}>
              <div 
                className="font-medium mb-2 bg-gray-50 p-2 -m-2 mb-2 rounded-t cursor-grab" 
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => {
                  if (e.button === 0) { // Left click
                    e.stopPropagation();
                    setPopupDrag({ 
                      isDragging: true, 
                      startPos: { x: e.clientX, y: e.clientY }, 
                      offset: popupDrag.offset 
                    });
                  }
                }}
              >
                Propiedades r¡pidas
              </div>
              <Space direction="vertical" size="small" className="w-full">
                <Input placeholder="Nombre" value={selectedEl.nombre || ''} onChange={e => updateSelectedProp('nombre', e.target.value)} />
                
                {/* Propiedades espec­ficas por tipo */}
                {selectedEl.type === 'mesa' && selectedEl.shape === 'rect' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span>Ancho</span>
                      <InputNumber min={10} max={1000} value={selectedEl.width || 120} onChange={v => updateSelectedProp('width', v)} />
                      <span>Alto</span>
                      <InputNumber min={10} max={1000} value={selectedEl.height || 80} onChange={v => updateSelectedProp('height', v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Ancho</span>
                      <Slider
                        min={10}
                        max={1000}
                        value={selectedEl.width || 120}
                        onChange={v => updateSelectedProp('width', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Alto</span>
                      <Slider
                        min={10}
                        max={1000}
                        value={selectedEl.height || 80}
                        onChange={v => updateSelectedProp('height', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Rotaci³n</span>
                      <InputNumber min={-180} max={180} value={selectedEl.rotation || 0} onChange={v => updateSelectedProp('rotation', v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Rotaci³n</span>
                      <Slider
                        min={-180}
                        max={180}
                        value={selectedEl.rotation || 0}
                        onChange={v => updateSelectedProp('rotation', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tama±o nombre</span>
                      <InputNumber min={8} max={48} value={selectedEl.labelSize || 14} onChange={v => updateSelectedProp('labelSize', v)} />
                      <span>Color</span>
                      <ColorPicker 
                        value={selectedEl.labelColor || '#333333'} 
                        onChange={(color) => updateSelectedProp('labelColor', color.toHexString())}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tama±o nombre</span>
                      <Slider
                        min={8}
                        max={48}
                        value={selectedEl.labelSize || 14}
                        onChange={v => updateSelectedProp('labelSize', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    {/* Controles de asientos por lado */}
                    <div className="text-xs text-gray-600 mb-1">Asientos por lado:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">†‘</span>
                        <InputNumber size="small" min={0} max={20} value={rectSideCounts.top} onChange={(v) => setRectSideCounts(s => ({ ...s, top: v }))} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">†’</span>
                        <InputNumber size="small" min={0} max={20} value={rectSideCounts.right} onChange={(v) => setRectSideCounts(s => ({ ...s, right: v }))} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">†“</span>
                        <InputNumber size="small" min={0} max={20} value={rectSideCounts.bottom} onChange={(v) => setRectSideCounts(s => ({ ...s, bottom: v }))} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">†</span>
                        <InputNumber size="small" min={0} max={20} value={rectSideCounts.left} onChange={(v) => setRectSideCounts(s => ({ ...s, left: v }))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Espaciado:</span>
                      <InputNumber 
                        size="small" 
                        min={10} 
                        max={100} 
                        value={seatSpacing} 
                        onChange={setSeatSpacing}
                        style={{ width: 60 }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Espaciado:</span>
                      <Slider
                        min={10}
                        max={100}
                        value={seatSpacing}
                        onChange={setSeatSpacing}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <Button size="small" onClick={addSeatsToMesaAll} block>A±adir en todos los lados</Button>
                  </>
                )}
                
                {selectedEl.type === 'mesa' && selectedEl.shape === 'circle' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span>Radio</span>
                      <InputNumber min={10} max={1000} value={selectedEl.radius || 60} onChange={v => updateSelectedProp('radius', v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Radio</span>
                      <Slider
                        min={10}
                        max={1000}
                        value={selectedEl.radius || 60}
                        onChange={v => updateSelectedProp('radius', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tama±o nombre</span>
                      <InputNumber min={8} max={48} value={selectedEl.labelSize || 14} onChange={v => updateSelectedProp('labelSize', v)} />
                      <span>Color</span>
                      <ColorPicker 
                        value={selectedEl.labelColor || '#333333'} 
                        onChange={(color) => updateSelectedProp('labelColor', color.toHexString())}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Espaciado:</span>
                      <InputNumber 
                        size="small" 
                        min={10} 
                        max={100} 
                        value={seatSpacing} 
                        onChange={setSeatSpacing}
                        style={{ width: 60 }}
                      />
                    </div>
                    {/* Controles de asientos circulares */}
                    <div className="text-xs text-gray-600 mb-1">Asientos por arco:</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Arco:</span>
                      <Select 
                        value={circleArc} 
                        onChange={setCircleArc} 
                        options={[{value:'top',label:'Arriba'},{value:'right',label:'Derecha'},{value:'bottom',label:'Abajo'},{value:'left',label:'Izquierda'}]}
                        size="small"
                        style={{ width: 80 }}
                      />
                      <span className="text-xs">Cant:</span>
                      <InputNumber 
                        min={0} 
                        max={50} 
                        value={circleArcCount} 
                        onChange={setCircleArcCount}
                        size="small"
                        style={{ width: 50 }}
                      />
                      <Button size="small" onClick={addSeatsToCircleArc}>A±adir</Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">360°:</span>
                      <InputNumber 
                        min={0} 
                        max={60} 
                        value={circleSeatsCount} 
                        onChange={setCircleSeatsCount}
                        size="small"
                        style={{ width: 50 }}
                      />
                      <Button size="small" type="dashed" onClick={addSeatsToMesaAll}>A±adir</Button>
                    </div>
                  </>
                )}
                
                {selectedEl.type === 'silla' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span>N°</span>
                      <InputNumber 
                        min={1} 
                        max={9999} 
                        value={selectedEl.numero || 1} 
                        onChange={v => updateSelectedProp('numero', v)}
                        autoFocus={activeInput === 'numero'}
                        onFocus={() => setActiveInput('numero')}
                        onBlur={() => setActiveInput(null)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tama±o</span>
                      <InputNumber min={6} max={60} value={selectedEl.radius || selectedEl.width || 20} onChange={v => {
                        if (selectedEl.shape === 'circle') updateSelectedProp('radius', v); else { updateSelectedProp('width', v); updateSelectedProp('height', v); }
                      }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tama±o</span>
                      <Slider
                        min={6}
                        max={60}
                        value={selectedEl.radius || selectedEl.width || 20}
                        onChange={v => {
                          if (selectedEl.shape === 'circle') updateSelectedProp('radius', v); else { updateSelectedProp('width', v); updateSelectedProp('height', v); }
                        }}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                  </>
                )}
                
                {selectedEl.type === 'texto' && (
                  <>
                    <Input placeholder="Texto" value={selectedEl.text || ''} onChange={e => updateSelectedProp('text', e.target.value)} />
                    <div className="flex items-center gap-2">
                      <span>Tama±o</span>
                      <InputNumber min={8} max={200} value={selectedEl.fontSize || 18} onChange={v => updateSelectedProp('fontSize', v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tama±o</span>
                      <Slider
                        min={8}
                        max={200}
                        value={selectedEl.fontSize || 18}
                        onChange={v => updateSelectedProp('fontSize', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Color</span>
                      <ColorPicker 
                        value={selectedEl.fill || '#333333'} 
                        onChange={(color) => updateSelectedProp('fill', color.toHexString())}
                        size="small"
                      />
                    </div>
                  </>
                )}
                
                {selectedEl.type === 'forma' && (
                  <>
                    {selectedEl.kind === 'rect' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span>Ancho</span>
                          <InputNumber min={10} max={1000} value={selectedEl.width || 120} onChange={v => updateSelectedProp('width', v)} />
                          <span>Alto</span>
                          <InputNumber min={10} max={1000} value={selectedEl.height || 80} onChange={v => updateSelectedProp('height', v)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Ancho</span>
                          <Slider
                            min={10}
                            max={1000}
                            value={selectedEl.width || 120}
                            onChange={v => updateSelectedProp('width', v)}
                            style={{ width: 100 }}
                            size="small"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Alto</span>
                          <Slider
                            min={10}
                            max={1000}
                            value={selectedEl.height || 80}
                            onChange={v => updateSelectedProp('height', v)}
                            style={{ width: 100 }}
                            size="small"
                          />
                        </div>
                      </>
                    )}
                    {(selectedEl.kind === 'circle' || selectedEl.kind === 'triangle') && (
                      <div className="flex items-center gap-2">
                        <span>{selectedEl.kind === 'circle' ? 'Radio' : 'Tama±o'}</span>
                        <InputNumber min={5} max={1000} value={selectedEl.radius || 60} onChange={v => updateSelectedProp('radius', v)} />
                      </div>
                    )}
                    {(selectedEl.kind === 'circle' || selectedEl.kind === 'triangle') && (
                      <div className="flex items-center gap-2">
                        <span>{selectedEl.kind === 'circle' ? 'Radio' : 'Tama±o'}</span>
                        <Slider
                          min={5}
                          max={1000}
                          value={selectedEl.radius || 60}
                          onChange={v => updateSelectedProp('radius', v)}
                          style={{ width: 100 }}
                          size="small"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>Rotaci³n</span>
                      <InputNumber min={-180} max={180} value={selectedEl.rotation || 0} onChange={v => updateSelectedProp('rotation', v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Rotaci³n</span>
                      <Slider
                        min={-180}
                        max={180}
                        value={selectedEl.rotation || 0}
                        onChange={v => updateSelectedProp('rotation', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Relleno</span>
                      <ColorPicker 
                        value={selectedEl.fill || '#eaeaea'} 
                        onChange={(color) => updateSelectedProp('fill', color.toHexString())}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Borde</span>
                      <ColorPicker 
                        value={selectedEl.stroke || '#999999'} 
                        onChange={(color) => updateSelectedProp('stroke', color.toHexString())}
                        size="small"
                      />
                      <InputNumber min={0} max={20} value={selectedEl.strokeWidth || 2} onChange={v => updateSelectedProp('strokeWidth', v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Grosor borde</span>
                      <Slider
                        min={0}
                        max={20}
                        value={selectedEl.strokeWidth || 2}
                        onChange={v => updateSelectedProp('strokeWidth', v)}
                        style={{ width: 100 }}
                        size="small"
                      />
                    </div>
                  </>
                )}

                {/* Botones de acci³n */}
                <Divider />
                <div className="flex gap-2">
                  <Button size="small" onClick={() => {
                    // Copiar elemento
                    const newEl = { ...selectedEl, _id: `${selectedEl.type}_${Date.now()}` };
                    setElements(prev => {
                      const newElements = [...prev, newEl];
                      saveToHistory(newElements);
                      return newElements;
                    });
                    setSelectedIds([newEl._id]);
                  }}>Copiar</Button>
                  <Button size="small" danger onClick={() => {
                    setElements(prev => {
                      const newElements = prev.filter(el => !selectedIds.includes(el._id));
                      saveToHistory(newElements);
                      return newElements;
                    });
                    setSelectedIds([]);
                  }}>Eliminar</Button>
                </div>
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatingLite;




