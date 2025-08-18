import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text as KonvaText, Line, RegularPolygon } from 'react-konva';
import { Button, Space, message, InputNumber, Input, Select, Checkbox, Divider } from 'antd';
import { fetchZonasPorSala } from '../../services/apibackoffice';

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
    setElements(prev => [...prev, el]);
  }, []);
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
    setElements(prev => [...prev, el]);
  }, []);
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
    setElements(prev => [...prev, el]);
  }, []);
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
    setElements(prev => [...prev, el]);
  }, []);

  const stageRef = useRef(null);
  const canvasContainerRef = useRef(null);
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

  useEffect(() => {
    // Cargar meta config si viene embebida en elementos
    const meta = (elements || []).find(el => el.type === 'meta' && el.key === 'config');
    if (meta && meta.config) {
      if (meta.config.scale) setScale(meta.config.scale);
      if (meta.config.stagePos) setStagePos(meta.config.stagePos);
      if (typeof meta.config.gridSize === 'number') setGridSize(meta.config.gridSize);
      if (typeof meta.config.showGrid === 'boolean') setShowGrid(meta.config.showGrid);
      if (typeof meta.config.snapToGrid === 'boolean') setSnapToGrid(meta.config.snapToGrid);
      // Opcional: eliminar meta del render
      setElements(prev => prev.filter(el => !(el.type === 'meta' && el.key === 'config')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setElements(prev => [...prev, mesa]);
  }, [elements]);

  const addMesaCircle = useCallback(() => {
    const mesa = {
      _id: `mesa_${Date.now()}`,
      type: 'mesa',
      shape: 'circle',
      posicion: { x: 200, y: 200 },
      radius: 60,
      rotation: 0,
      fill: '#f0f0f0',
      nombre: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`
    };
    setElements(prev => [...prev, mesa]);
  }, [elements]);

  const addSilla = useCallback(() => {
    const baseX = 80 + (elements.length % 8) * 40;
    const baseY = 80 + Math.floor(elements.length / 8) * 40;
    const silla = {
      _id: `silla_${Date.now()}`,
      type: 'silla',
      posicion: { x: baseX, y: baseY },
      shape: 'circle',
      radius: 10,
      fill: seatEmpty ? 'transparent' : '#00d6a4',
      stroke: seatEmpty ? '#d9d9d9' : undefined,
      empty: seatEmpty,
      state: 'available',
      numero: (elements.filter(e => e.type === 'silla').length + 1),
      nombre: ''
    };
    setElements(prev => [...prev, silla]);
  }, [elements, seatEmpty]);

  const onDragEnd = useCallback((id, x, y) => {
    const nx = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const ny = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
    setElements(prev => {
      const curr = prev.find(el => el._id === id);
      const next = prev.map(el => el._id === id ? { ...el, posicion: { x: nx, y: ny } } : el);
      // Si se movió una mesa circular, reposicionar asientos adjuntos por arco/360
      if (curr && curr.type === 'mesa' && curr.shape === 'circle') {
        const mesa = next.find(el => el._id === id);
        const cx = mesa.posicion.x;
        const cy = mesa.posicion.y;
        return next.map(seat => {
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.arc) {
            const { start, end } = getArcAngles(seat.arc);
            const idx = seat.arcIndex || 0;
            const count = seat.arcCount || 1;
            const angle = start + (end - start) * ((idx + 1) / (count + 1));
            const r = (mesa.radius || 60) + 25;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.circleIndex != null && seat.circleCount) {
            const angle = (seat.circleIndex * 2 * Math.PI) / seat.circleCount;
            const r = (mesa.radius || 60) + 25;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          return seat;
        });
      }
      // Si se movió una mesa rectangular, reposicionar sillas con sideIndex/sideCount
      if (curr && curr.type === 'mesa' && curr.shape === 'rect') {
        const mesa = next.find(el => el._id === id);
        const w = mesa.width || 120;
        const h = mesa.height || 80;
        return next.map(seat => {
          if (seat.type !== 'silla' || seat.mesaId !== mesa._id || !seat.side) return seat;
          const count = seat.sideCount || 1;
          const idx = seat.sideIndex || 0;
          if (seat.side === 'top') {
            const xTop = mesa.posicion.x + (w / (count + 1)) * (idx + 1);
            const yTop = mesa.posicion.y - 25;
            return { ...seat, posicion: { x: xTop, y: yTop } };
          }
          if (seat.side === 'right') {
            const xR = mesa.posicion.x + w + 25;
            const yR = mesa.posicion.y + (h / (count + 1)) * (idx + 1);
            return { ...seat, posicion: { x: xR, y: yR } };
          }
          if (seat.side === 'bottom') {
            const xB = mesa.posicion.x + (w / (count + 1)) * (idx + 1);
            const yB = mesa.posicion.y + h + 25;
            return { ...seat, posicion: { x: xB, y: yB } };
          }
          // left
          const xL = mesa.posicion.x - 25;
          const yL = mesa.posicion.y + (h / (count + 1)) * (idx + 1);
          return { ...seat, posicion: { x: xL, y: yL } };
        });
      }
      return next;
    });
  }, [gridSize, snapToGrid]);

  const handleDelete = useCallback(() => {
    if (!selectedIds?.length) return;
    setElements(prev => prev.filter(el => !selectedIds.includes(el._id)));
    setSelectedIds([]);
  }, [selectedIds]);

  const handleClear = useCallback(() => {
    setElements([]);
    setSelectedIds([]);
  }, []);

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
        snapToGrid
      }
    };
    return [...other, meta];
  }, [scale, stagePos, gridSize, showGrid, snapToGrid]);

  const handleSaveClick = useCallback(async () => {
    try {
      if (!Array.isArray(elements)) {
        throw new Error('El contenido del mapa debe ser un array');
      }
      const listWithMeta = upsertMetaConfig(elements);
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
  }, [elements, onSave, upsertMetaConfig]);

  const assignZoneToSelection = useCallback(() => {
    if (!selectedIds?.length || !selectedZoneId) return;
    const zone = zones.find(z => String(z.id) === String(selectedZoneId));
    if (!zone) return;
    setElements(prev => prev.map(el => selectedIds.includes(el._id) ? { ...el, zona: { id: zone.id, nombre: zone.nombre, color: zone.color || '#999' } } : el));
  }, [selectedIds, selectedZoneId, zones]);

  const addSeatsToMesaAll = useCallback(() => {
    if (!selectedIds?.length) return;
    const mesa = elements.find(e => selectedIds.includes(e._id) && e.type === 'mesa');
    if (!mesa) return;
    const nuevas = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    const baseSeat = (extra) => ({
      _id: `silla_${Date.now()}_${seq}`,
      type: 'silla',
      shape: 'circle',
      radius: 10,
      fill: seatEmpty ? 'transparent' : '#00d6a4',
      stroke: seatEmpty ? '#d9d9d9' : undefined,
      empty: seatEmpty,
      numero: seq++,
      nombre: '',
      mesaId: mesa._id,
      zona: mesa.zona,
      ...extra
    });
    if (mesa.shape === 'rect') {
      // borrar existentes por lados para esta mesa para evitar duplicados
      let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && e.side));
      const { top, right, bottom, left } = rectSideCounts;
      // top
      for (let i = 0; i < top; i++) {
        const x = mesa.posicion.x + ((mesa.width || 120) / (top + 1)) * (i + 1);
        const y = mesa.posicion.y - 25;
        nuevas.push(baseSeat({ posicion: { x, y }, side: 'top', sideIndex: i, sideCount: top }));
      }
      // right
      for (let i = 0; i < right; i++) {
        const x = mesa.posicion.x + (mesa.width || 120) + 25;
        const y = mesa.posicion.y + ((mesa.height || 80) / (right + 1)) * (i + 1);
        nuevas.push(baseSeat({ posicion: { x, y }, side: 'right', sideIndex: i, sideCount: right }));
      }
      // bottom
      for (let i = 0; i < bottom; i++) {
        const x = mesa.posicion.x + ((mesa.width || 120) / (bottom + 1)) * (i + 1);
        const y = mesa.posicion.y + (mesa.height || 80) + 25;
        nuevas.push(baseSeat({ posicion: { x, y }, side: 'bottom', sideIndex: i, sideCount: bottom }));
      }
      // left
      for (let i = 0; i < left; i++) {
        const x = mesa.posicion.x - 25;
        const y = mesa.posicion.y + ((mesa.height || 80) / (left + 1)) * (i + 1);
        nuevas.push(baseSeat({ posicion: { x, y }, side: 'left', sideIndex: i, sideCount: left }));
      }
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
        nuevas.push(baseSeat({ posicion: { x, y }, circleIndex: i, circleCount: count }));
      }
      setElements(base.concat(nuevas));
      message.success(`360°: ${nuevas.length} asientos`);
      return;
    }
  }, [selectedIds, elements, rectSideCounts, circleSeatsCount, seatEmpty]);

  const addSeatsToRectSide = useCallback((side) => {
    if (!selectedIds?.length) return;
    const mesa = elements.find(e => selectedIds.includes(e._id) && e.type === 'mesa' && e.shape === 'rect');
    if (!mesa) return;
    const nuevas = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    const countMap = { top: rectSideCounts.top, right: rectSideCounts.right, bottom: rectSideCounts.bottom, left: rectSideCounts.left };
    const n = countMap[side] || 0;
    // quitar existentes de ese lado
    let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && e.side === side));
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0;
      if (side === 'top') {
        x = mesa.posicion.x + ((mesa.width || 120) / (n + 1)) * (i + 1); y = mesa.posicion.y - 25;
      } else if (side === 'right') {
        x = mesa.posicion.x + (mesa.width || 120) + 25; y = mesa.posicion.y + ((mesa.height || 80) / (n + 1)) * (i + 1);
      } else if (side === 'bottom') {
        x = mesa.posicion.x + ((mesa.width || 120) / (n + 1)) * (i + 1); y = mesa.posicion.y + (mesa.height || 80) + 25;
      } else {
        x = mesa.posicion.x - 25; y = mesa.posicion.y + ((mesa.height || 80) / (n + 1)) * (i + 1);
      }
      nuevas.push({
        _id: `silla_${Date.now()}_${seq}`,
        type: 'silla',
        posicion: { x, y },
        shape: 'circle',
        radius: 10,
        fill: seatEmpty ? 'transparent' : '#00d6a4',
        stroke: seatEmpty ? '#d9d9d9' : undefined,
        empty: seatEmpty,
        numero: seq++,
        nombre: '',
        mesaId: mesa._id,
        zona: mesa.zona,
        side,
        sideIndex: i,
        sideCount: n
      });
    }
    setElements(base.concat(nuevas));
    message.success(`${nuevas.length} asientos agregados en ${side}`);
  }, [selectedIds, elements, rectSideCounts, seatEmpty]);

  const getArcAngles = (arc) => {
    // Rango de ángulos por arco (en radianes)
    switch (arc) {
      case 'top': return { start: -Math.PI / 2, end: Math.PI / 2 };
      case 'bottom': return { start: Math.PI / 2, end: (3 * Math.PI) / 2 };
      case 'right': return { start: 0, end: Math.PI };
      case 'left': return { start: Math.PI, end: 2 * Math.PI };
      default: return { start: 0, end: 2 * Math.PI };
    }
  };

  const addSeatsToCircleArc = useCallback(() => {
    if (!selectedIds?.length) return;
    const mesa = elements.find(e => selectedIds.includes(e._id) && e.type === 'mesa' && e.shape === 'circle');
    if (!mesa) return;
    // quitar existentes del mismo arco en esta mesa
    let base = elements.filter(e => !(e.type === 'silla' && e.mesaId === mesa._id && e.arc === circleArc));
    const { start, end } = getArcAngles(circleArc);
    const nuevas = [];
    let seq = elements.filter(e => e.type === 'silla').length + 1;
    const cx = mesa.posicion.x;
    const cy = mesa.posicion.y;
    const r = (mesa.radius || 60) + 25;
    for (let i = 0; i < circleArcCount; i++) {
      const angle = start + (end - start) * ((i + 1) / (circleArcCount + 1));
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      nuevas.push({
        _id: `silla_${Date.now()}_${seq}`,
        type: 'silla',
        posicion: { x, y },
        shape: 'circle',
        radius: 10,
        fill: seatEmpty ? 'transparent' : '#00d6a4',
        stroke: seatEmpty ? '#d9d9d9' : undefined,
        empty: seatEmpty,
        numero: seq++,
        nombre: '',
        mesaId: mesa._id,
        zona: mesa.zona,
        arc: circleArc,
        arcIndex: i,
        arcCount: circleArcCount
      });
    }
    setElements(base.concat(nuevas));
    message.success(`${nuevas.length} asientos agregados en arco ${circleArc}`);
  }, [selectedIds, elements, circleArc, circleArcCount, seatEmpty]);

  const handleStageContextMenu = useCallback((e) => {
    e.evt.preventDefault();
  }, []);

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
    // Inicio selección rectangular con botón izquierdo en el lienzo
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
      // Finalizar selección rectangular
      const rect = selectRect;
      const x1 = Math.min(rect.x, rect.x + rect.w);
      const y1 = Math.min(rect.y, rect.y + rect.h);
      const x2 = Math.max(rect.x, rect.x + rect.w);
      const y2 = Math.max(rect.y, rect.y + rect.h);
      const newly = elements.filter(el => {
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
      if (mesa && (prop === 'radius' || prop === 'posicion')) {
        const cx = mesa.posicion.x;
        const cy = mesa.posicion.y;
        return next.map(seat => {
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.arc) {
            const { start, end } = getArcAngles(seat.arc);
            const idx = seat.arcIndex || 0;
            const count = seat.arcCount || 1;
            const angle = start + (end - start) * ((idx + 1) / (count + 1));
            const r = (mesa.radius || 60) + 25;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          if (seat.type === 'silla' && seat.mesaId === mesa._id && seat.circleIndex != null && seat.circleCount) {
            const angle = (seat.circleIndex * 2 * Math.PI) / seat.circleCount;
            const r = (mesa.radius || 60) + 25;
            return { ...seat, posicion: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } };
          }
          return seat;
        });
      }
      const mesaRect = next.find(el => selectedIds.includes(el._id) && el.type === 'mesa' && el.shape === 'rect');
      if (mesaRect && (prop === 'width' || prop === 'height' || prop === 'posicion')) {
        const w = mesaRect.width || 120;
        const h = mesaRect.height || 80;
        return next.map(seat => {
          if (seat.type !== 'silla' || seat.mesaId !== mesaRect._id || !seat.side) return seat;
          const count = seat.sideCount || 1;
          const idx = seat.sideIndex || 0;
          if (seat.side === 'top') {
            const xTop = mesaRect.posicion.x + (w / (count + 1)) * (idx + 1);
            const yTop = mesaRect.posicion.y - 25;
            return { ...seat, posicion: { x: xTop, y: yTop } };
          }
          if (seat.side === 'right') {
            const xR = mesaRect.posicion.x + w + 25;
            const yR = mesaRect.posicion.y + (h / (count + 1)) * (idx + 1);
            return { ...seat, posicion: { x: xR, y: yR } };
          }
          if (seat.side === 'bottom') {
            const xB = mesaRect.posicion.x + (w / (count + 1)) * (idx + 1);
            const yB = mesaRect.posicion.y + h + 25;
            return { ...seat, posicion: { x: xB, y: yB } };
          }
          const xL = mesaRect.posicion.x - 25;
          const yL = mesaRect.posicion.y + (h / (count + 1)) * (idx + 1);
          return { ...seat, posicion: { x: xL, y: yL } };
        });
      }
      return next;
    });
  }, [selectedIds]);

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
    // Reusar función de añadir por lado que reequilibra
    setTimeout(() => addSeatsToRectSide(side), 0);
  }, [elements, addSeatsToRectSide]);

  const addOneSeatCircleArc = useCallback((mesa, arc) => {
    const countExisting = elements.filter(e => e.type === 'silla' && e.mesaId === mesa._id && e.arc === arc).length;
    setCircleArc(arc);
    setCircleArcCount(countExisting + 1);
    setTimeout(() => addSeatsToCircleArc(), 0);
  }, [elements, addSeatsToCircleArc]);

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
      newSeats.push({ _id: `silla_${Date.now()}_${seq}`, type: 'silla', posicion: { x, y }, shape: 'rect', width: 20, height: 20, fill: seatEmpty ? 'transparent' : '#00d6a4', stroke: seatEmpty ? '#d9d9d9' : undefined, empty: seatEmpty, numero: seq++, nombre: `${rowLabel}${i + 1}` });
    }
    setElements(prev => [...prev, ...newSeats]);
    message.success(`Fila ${rowLabel} con ${count} asientos creada`);
  }, [rowCount, rowLabel, elements, seatEmpty]);

  const renderElement = useCallback((element) => {
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
            <KonvaText text={element.nombre || 'Mesa'} fontSize={14} fill="#333" x={-40} y={-r - 20} />
            {isSelected && (
              <>
                {/* Handles en cardinales para añadir asientos por arco */}
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
          <KonvaText text={element.nombre || 'Mesa'} fontSize={14} fill="#333" x={4} y={-18} />
          {isSelected && (
            <>
              {/* Handles en el centro de cada lado para añadir asientos */}
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
      if (element.shape === 'circle') {
        return (
          <Group {...commonProps} opacity={seatOpacity}>
            <Circle radius={element.radius || 10} fill={element.fill || '#00d6a4'} stroke={seatStroke} strokeWidth={isSelected ? 3 : 2} />
            {element.numero ? <KonvaText text={String(element.numero)} fontSize={10} fill="#333" x={-4} y={-4} /> : null}
          </Group>
        );
      }
      return (
        <Group {...commonProps} opacity={seatOpacity}>
          <Rect width={element.width || 20} height={element.height || 20} fill={element.fill || '#00d6a4'} stroke={seatStroke} strokeWidth={isSelected ? 3 : 2} />
          {element.numero ? <KonvaText text={String(element.numero)} fontSize={10} fill="#333" x={-4} y={-4} /> : null}
        </Group>
      );
    }
    return null;
  }, [selectedIds, isRightPanning, handleElementDblClick, onDragEnd, addOneSeatRectSide, addOneSeatCircleArc]);

  const selectedEl = elements.find(e => selectedIds.includes(e._id)) || null;
  // Calcular posición del popup junto al elemento con auto-flip
  const computePopupStyle = () => {
    if (!selectedEl || !stageRef.current || !canvasContainerRef.current) return { display: 'none' };
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
    // convertir a coords de pantalla dentro del container
    const px = cx * scaleX + sx;
    const py = cy * scaleY + sy;
    const margin = 10;
    const popupW = 320;
    const popupH = 160;
    let left = px + margin;
    let top = py - popupH / 2;
    // auto-flip horizontal
    if (left + popupW > container.clientWidth) left = px - popupW - margin;
    if (left < 0) left = margin;
    // auto-flip vertical
    if (top < 0) top = py + margin;
    if (top + popupH > container.clientHeight) top = container.clientHeight - popupH - margin;
    return { position: 'absolute', left, top, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.08)', maxWidth: popupW, zIndex: 10 };
  };

  // Render
  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* Panel lateral izquierdo */}
      <div className="w-80 border-r bg-white p-3 flex flex-col gap-4">
        <div>
          <div className="font-medium mb-2">Zonas</div>
          <Space direction="vertical" size="small" className="w-full">
            <Select
              placeholder="Seleccione zona"
              value={selectedZoneId}
              onChange={setSelectedZoneId}
              className="w-full"
              options={(zones || []).map(z => ({ label: z.nombre, value: String(z.id) }))}
            />
            <Button onClick={assignZoneToSelection} disabled={!selectedIds?.length || !selectedZoneId} block>
              Asignar a seleccionado
            </Button>
          </Space>
        </div>

        <Divider />

        <div>
          <div className="font-medium mb-2">Herramientas</div>
          <Space direction="vertical" size="small" className="w-full">
            <Button onClick={addMesaRect} block>Añadir mesa cuadrada</Button>
            <Button onClick={addMesaCircle} block>Añadir mesa redonda</Button>
            <Button onClick={addSilla} block>Añadir silla suelta</Button>
            <Button onClick={addTexto} block>Añadir texto</Button>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={addFormaRect}>Cuadrado</Button>
              <Button onClick={addFormaCircle}>Círculo</Button>
              <Button onClick={addFormaTriangle}>Triángulo</Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={seatEmpty} onChange={(e) => setSeatEmpty(e.target.checked)}>Asientos vacíos (transparentes)</Checkbox>
            </div>
            <Button onClick={() => setRowMode(m => !m)} type={rowMode ? 'primary' : 'default'} block>
              {rowMode ? 'Modo fila: activo' : 'Crear fila de asientos (arrastre)'}
            </Button>
            <div className="flex items-center gap-2">
              <span className="w-16">Fila</span>
              <Input value={rowLabel} onChange={e => setRowLabel(e.target.value)} />
              <span>Cantidad</span>
              <InputNumber min={1} max={200} value={rowCount} onChange={setRowCount} />
            </div>
          </Space>
        </div>

        <Divider />

        <div>
          <div className="font-medium mb-2">Asientos a mesa (rectángulo)</div>
          <Space direction="vertical" size="small" className="w-full">
            <div className="text-xs text-gray-600">Lados (top/right/bottom/left)</div>
            <div className="flex items-center gap-2">
              <InputNumber min={0} max={20} value={rectSideCounts.top} onChange={(v) => setRectSideCounts(s => ({ ...s, top: v }))} />
              <InputNumber min={0} max={20} value={rectSideCounts.right} onChange={(v) => setRectSideCounts(s => ({ ...s, right: v }))} />
              <InputNumber min={0} max={20} value={rectSideCounts.bottom} onChange={(v) => setRectSideCounts(s => ({ ...s, bottom: v }))} />
              <InputNumber min={0} max={20} value={rectSideCounts.left} onChange={(v) => setRectSideCounts(s => ({ ...s, left: v }))} />
            </div>
            <Space size="small" wrap>
              <Button onClick={() => addSeatsToRectSide('top')}>Añadir lado arriba</Button>
              <Button onClick={() => addSeatsToRectSide('right')}>Añadir lado derecha</Button>
              <Button onClick={() => addSeatsToRectSide('bottom')}>Añadir lado abajo</Button>
              <Button onClick={() => addSeatsToRectSide('left')}>Añadir lado izquierda</Button>
              <Button type="dashed" onClick={addSeatsToMesaAll}>Añadir en todos los lados</Button>
            </Space>
          </Space>
        </div>

        <Divider />

        <div>
          <div className="font-medium mb-2">Asientos a mesa (redonda)</div>
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center gap-2">
              <span>Arco</span>
              <Select value={circleArc} onChange={setCircleArc} options={[{value:'top',label:'Arriba'},{value:'right',label:'Derecha'},{value:'bottom',label:'Abajo'},{value:'left',label:'Izquierda'}]} />
              <span>Cantidad</span>
              <InputNumber min={0} max={50} value={circleArcCount} onChange={setCircleArcCount} />
              <Button onClick={addSeatsToCircleArc}>Añadir arco</Button>
            </div>
            <div className="flex items-center gap-2">
              <span>360°</span>
              <InputNumber min={0} max={60} value={circleSeatsCount} onChange={setCircleSeatsCount} />
              <Button type="dashed" onClick={addSeatsToMesaAll}>Añadir 360°</Button>
            </div>
          </Space>
        </div>

        <Divider />

        <div>
          <div className="font-medium mb-2">Propiedades seleccionadas</div>
          {selectedEl ? (
            <Space direction="vertical" size="small" className="w-full">
              <Input placeholder="Nombre" value={selectedEl.nombre || ''} onChange={e => updateSelectedProp('nombre', e.target.value)} />
              {selectedEl.type === 'texto' && (
                <>
                  <Input placeholder="Texto" value={selectedEl.text || ''} onChange={e => updateSelectedProp('text', e.target.value)} />
                  <div className="flex items-center gap-2">
                    <span>Tamaño</span>
                    <InputNumber min={8} max={200} value={selectedEl.fontSize || 18} onChange={v => updateSelectedProp('fontSize', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Color</span>
                    <Input placeholder="#333333" value={selectedEl.fill || ''} onChange={e => updateSelectedProp('fill', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Borde</span>
                    <Input placeholder="#000000" value={selectedEl.stroke || ''} onChange={e => updateSelectedProp('stroke', e.target.value)} />
                    <InputNumber min={0} max={10} value={selectedEl.strokeWidth || 0} onChange={v => updateSelectedProp('strokeWidth', v)} />
                  </div>
                </>
              )}
              {selectedEl.type === 'mesa' && selectedEl.shape === 'rect' && (
                <>
                  <div className="flex items-center gap-2">
                    <span>Ancho</span>
                    <InputNumber min={10} max={1000} value={selectedEl.width || 120} onChange={v => updateSelectedProp('width', v)} />
                    <span>Alto</span>
                    <InputNumber min={10} max={1000} value={selectedEl.height || 80} onChange={v => updateSelectedProp('height', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Rotación</span>
                    <InputNumber min={-180} max={180} value={selectedEl.rotation || 0} onChange={v => updateSelectedProp('rotation', v)} />
                  </div>
                </>
              )}
              {selectedEl.type === 'mesa' && selectedEl.shape === 'circle' && (
                <div className="flex items-center gap-2">
                  <span>Radio</span>
                  <InputNumber min={10} max={1000} value={selectedEl.radius || 60} onChange={v => updateSelectedProp('radius', v)} />
                </div>
              )}
              {selectedEl.type === 'forma' && selectedEl.kind === 'rect' && (
                <>
                  <div className="flex items-center gap-2">
                    <span>Ancho</span>
                    <InputNumber min={10} max={1000} value={selectedEl.width || 120} onChange={v => updateSelectedProp('width', v)} />
                    <span>Alto</span>
                    <InputNumber min={10} max={1000} value={selectedEl.height || 80} onChange={v => updateSelectedProp('height', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Rotación</span>
                    <InputNumber min={-180} max={180} value={selectedEl.rotation || 0} onChange={v => updateSelectedProp('rotation', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Relleno</span>
                    <Input placeholder="#eaeaea" value={selectedEl.fill || ''} onChange={e => updateSelectedProp('fill', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Borde</span>
                    <Input placeholder="#999999" value={selectedEl.stroke || ''} onChange={e => updateSelectedProp('stroke', e.target.value)} />
                    <InputNumber min={0} max={20} value={selectedEl.strokeWidth || 2} onChange={v => updateSelectedProp('strokeWidth', v)} />
                  </div>
                </>
              )}
              {selectedEl.type === 'forma' && (selectedEl.kind === 'circle' || selectedEl.kind === 'triangle') && (
                <>
                  <div className="flex items-center gap-2">
                    <span>{selectedEl.kind === 'circle' ? 'Radio' : 'Tamaño'}</span>
                    <InputNumber min={5} max={1000} value={selectedEl.radius || 60} onChange={v => updateSelectedProp('radius', v)} />
                  </div>
                  {selectedEl.kind === 'triangle' && (
                    <div className="flex items-center gap-2">
                      <span>Rotación</span>
                      <InputNumber min={-180} max={180} value={selectedEl.rotation || 0} onChange={v => updateSelectedProp('rotation', v)} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>Relleno</span>
                    <Input placeholder="#eaeaea" value={selectedEl.fill || ''} onChange={e => updateSelectedProp('fill', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Borde</span>
                    <Input placeholder="#999999" value={selectedEl.stroke || ''} onChange={e => updateSelectedProp('stroke', e.target.value)} />
                    <InputNumber min={0} max={20} value={selectedEl.strokeWidth || 2} onChange={v => updateSelectedProp('strokeWidth', v)} />
                  </div>
                </>
              )}
              {selectedEl.type === 'silla' && (
                <>
                  <div className="flex items-center gap-2">
                    <span>Número</span>
                    <InputNumber min={1} max={9999} value={selectedEl.numero || 1} onChange={v => updateSelectedProp('numero', v)} />
                  </div>
                  <Input placeholder="Nombre asiento" value={selectedEl.nombre || ''} onChange={e => updateSelectedProp('nombre', e.target.value)} />
                  <div className="flex items-center gap-2">
                    <span>Tamaño</span>
                    <InputNumber min={6} max={60} value={selectedEl.radius || selectedEl.width || 20} onChange={v => {
                      if (selectedEl.shape === 'circle') updateSelectedProp('radius', v); else { updateSelectedProp('width', v); updateSelectedProp('height', v); }
                    }} />
                  </div>
                </>
              )}
            </Space>
          ) : (
            <div className="text-xs text-gray-500">Nada seleccionado</div>
          )}
        </div>
      </div>
      {/* Canvas a la derecha */}
      <div ref={canvasContainerRef} className="flex-1 bg-white relative" onContextMenu={(e) => e.preventDefault()}>
        <Stage
          ref={stageRef}
          width={Math.max(1200, window.innerWidth - 80 - 320)}
          height={Math.max(700, window.innerHeight - 240)}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          onContextMenu={handleStageContextMenu}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={(e) => {
            if (!isSelecting || !selectStart) return;
            const pos = e.target.getStage().getPointerPosition();
            setSelectRect({ x: selectStart.x, y: selectStart.y, w: pos.x - selectStart.x, h: pos.y - selectStart.y });
          }}
        >
          <Layer listening={false}>
            <Rect width={2000} height={1400} fill="#fff" />
            {showGrid && renderGrid()}
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

        {selectedEl && (
          <div style={computePopupStyle()}>
            <div className="font-medium mb-2">Propiedades rápidas</div>
            <Space direction="vertical" size="small" className="w-full">
              <Input placeholder="Nombre" value={selectedEl.nombre || ''} onChange={e => updateSelectedProp('nombre', e.target.value)} />
              {selectedEl.type === 'mesa' && selectedEl.shape === 'rect' && (
                <div className="flex items-center gap-2">
                  <span>Ancho</span>
                  <InputNumber min={10} max={1000} value={selectedEl.width || 120} onChange={v => updateSelectedProp('width', v)} />
                  <span>Alto</span>
                  <InputNumber min={10} max={1000} value={selectedEl.height || 80} onChange={v => updateSelectedProp('height', v)} />
                </div>
              )}
              {selectedEl.type === 'mesa' && selectedEl.shape === 'circle' && (
                <div className="flex items-center gap-2">
                  <span>Radio</span>
                  <InputNumber min={10} max={1000} value={selectedEl.radius || 60} onChange={v => updateSelectedProp('radius', v)} />
                </div>
              )}
              {selectedEl.type === 'silla' && (
                <div className="flex items-center gap-2">
                  <span>N°</span>
                  <InputNumber min={1} max={9999} value={selectedEl.numero || 1} onChange={v => updateSelectedProp('numero', v)} />
                </div>
              )}
              {selectedEl.type === 'texto' && (
                <div className="flex items-center gap-2">
                  <span>Size</span>
                  <InputNumber min={8} max={200} value={selectedEl.fontSize || 18} onChange={v => updateSelectedProp('fontSize', v)} />
                </div>
              )}
              {/* Mini menús */}
              {selectedEl.type === 'mesa' && selectedEl.shape === 'rect' && (
                <Space size="small" wrap>
                  <Button size="small" onClick={() => addSeatsToRectSide('top')}>Lado arriba</Button>
                  <Button size="small" onClick={() => addSeatsToRectSide('right')}>Lado derecha</Button>
                  <Button size="small" onClick={() => addSeatsToRectSide('bottom')}>Lado abajo</Button>
                  <Button size="small" onClick={() => addSeatsToRectSide('left')}>Lado izquierda</Button>
                </Space>
              )}
              {selectedEl.type === 'mesa' && selectedEl.shape === 'circle' && (
                <Space size="small" wrap>
                  <Button size="small" onClick={() => { setCircleArc('top'); addSeatsToCircleArc(); }}>Arco arriba</Button>
                  <Button size="small" onClick={() => { setCircleArc('right'); addSeatsToCircleArc(); }}>Arco derecha</Button>
                  <Button size="small" onClick={() => { setCircleArc('bottom'); addSeatsToCircleArc(); }}>Arco abajo</Button>
                  <Button size="small" onClick={() => { setCircleArc('left'); addSeatsToCircleArc(); }}>Arco izquierda</Button>
                </Space>
              )}
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingLite;


