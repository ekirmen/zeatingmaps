import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Rect, Path, Group, Text } from 'react-konva';
import useImage from 'use-image';
import { Spin } from '../utils/antdComponents';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from '../utils/antdComponents';
import { useSeatColors } from '../hooks/useSeatColors';
import logger from '../utils/logger';

// --- Helper Components ---

const URLImage = ({ src, x, y, width, height, opacity, ...props }) => {
    const [img] = useImage(src, 'anonymous');
    return (
        <KonvaImage
            image={img}
            x={x}
            y={y}
            width={width}
            height={height}
            opacity={opacity}
            {...props}
        />
    );
};

const SeatShape = memo(({ seat, color, borderColor, size, isSelected, onClick, blockMode = false, blockAction = null }) => {
    // Determine shape based on seat type or default to Circle
    const x = seat.posicion?.x ?? seat.x ?? 0;
    const y = seat.posicion?.y ?? seat.y ?? 0;
    const radius = (seat.radio ?? size ?? 20) / 2;
    const width = seat.ancho ?? size ?? 20;
    const height = seat.alto ?? size ?? 20;

    // Visual feedback for selection and block mode
    let strokeWidth = isSelected ? 3 : 1;
    let stroke = isSelected ? '#1890ff' : (borderColor || '#ccc');

    // Override stroke for block mode
    if (blockMode) {
        if (blockAction === 'block') {
            stroke = '#ef4444'; // Red for block mode
            strokeWidth = 3;
        } else if (blockAction === 'unlock') {
            stroke = '#22c55e'; // Green for unlock mode
            strokeWidth = 3;
        }
    }

    // Label settings
    const fontSize = 10;
    const labelText = seat.nombre || seat.label || '';

    // Calculate center for text positioning
    let centerX, centerY;

    let ShapeComponent;

    if (seat.tipo === 'rect' || seat.type === 'rect') {
        centerX = x + width / 2;
        centerY = y + height / 2;

        ShapeComponent = (
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                stroke={stroke}
                strokeWidth={strokeWidth}
                cornerRadius={4}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor="#1890ff"
            />
        );
    } else {
        centerX = x + radius;
        centerY = y + radius;

        ShapeComponent = (
            <Circle
                x={centerX}
                y={centerY}
                radius={radius}
                fill={color}
                stroke={stroke}
                strokeWidth={strokeWidth}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor="#1890ff"
            />
        );
    }

    // Interaction handlers
    const handleEvents = {
        onClick: (e) => {
            e.cancelBubble = true;
            onClick?.(seat);
        },
        onTap: (e) => {
            e.cancelBubble = true;
            onClick?.(seat);
        },
        onMouseEnter: (e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'pointer';
        },
        onMouseLeave: (e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
        }
    };

    return (
        <Group {...handleEvents}>
            {ShapeComponent}
            {labelText && (
                <Text
                    x={centerX - 20} // Approximate centering
                    y={y - fontSize - 2} // Above the seat
                    width={40} // Constrain width to avoid huge text
                    text={labelText}
                    fontSize={fontSize}
                    fill="#333"
                    align="center"
                    listening={false} // Allow clicks to pass through to the shape/Group
                />
            )}
        </Group>
    );
});

// --- Main Component ---

const SeatingMapOptimized = ({
    mapa,
    funcionId,
    selectedSeats = [], // Array/Set of IDs
    lockedSeats = [],   // Array of lock objects
    onSeatClick,        // Handler: (seat) => void
    modoVenta = false,   // True = Store, False = Backoffice
    loading = false,
    showLegend = false,
    blockMode = false,   // Block mode flag
    blockAction = null,  // 'block' or 'unlock'
    // Adapter props to handle legacy calls/unused props securely
    ...restProps
}) => {
    // Basic Legend Component
    const MapLegend = () => (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            pointerEvents: 'none' // Click through purely visual
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 16, height: 16, backgroundColor: '#4CAF50', borderRadius: '4px' }} />
                <span>Disponible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 16, height: 16, backgroundColor: '#ffd700', borderRadius: '4px', border: '1px solid #e0c000' }} />
                <span>Tu Selección</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Blue for "Other" in standard theme */}
                <div style={{ width: 16, height: 16, backgroundColor: '#2196F3', borderRadius: '4px' }} />
                <span>Selección de otro</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 16, height: 16, backgroundColor: '#2d3748', borderRadius: '4px' }} />
                <span>Ocupado / Vendido</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 16, height: 16, backgroundColor: '#805ad5', borderRadius: '4px' }} />
                <span>Reservado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 16, height: 16, backgroundColor: '#f56565', borderRadius: '4px' }} />
                <span>Bloqueado</span>
            </div>
        </div>
    );
    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Normalize IDs for easy lookup
    const selectedSeatIds = useMemo(() => {
        if (selectedSeats instanceof Set) return selectedSeats;
        const ids = new Set();
        if (Array.isArray(selectedSeats)) {
            selectedSeats.forEach(s => {
                if (typeof s === 'string' || typeof s === 'number') ids.add(String(s));
                else if (s?.id || s?._id || s?.sillaId) ids.add(String(s.id || s._id || s.sillaId));
            });
        }
        return ids;
    }, [selectedSeats]);

    const lockedSeatIds = useMemo(() => {
        const ids = new Set();
        if (Array.isArray(lockedSeats)) {
            lockedSeats.forEach(l => {
                if (l.seat_id) ids.add(String(l.seat_id));
            });
        }
        return ids;
    }, [lockedSeats]);

    // Extract seats from map content
    const seats = useMemo(() => {
        if (!mapa?.contenido) return [];

        // Handle different content structures
        const rawContent = Array.isArray(mapa.contenido)
            ? mapa.contenido
            : (mapa.contenido.elementos || []);

        const extractedSeats = [];

        // Helper to process seat
        const processSeat = (s) => ({
            ...s,
            _id: String(s._id || s.id),
            // Ensure positioning exists
            x: s.posicion?.x ?? s.x ?? 0,
            y: s.posicion?.y ?? s.y ?? 0
        });

        rawContent.forEach(el => {
            // Single seat
            if (el.type === 'silla') {
                extractedSeats.push(processSeat(el));
            }
            // Group of seats (mesa, fila)
            else if (Array.isArray(el.sillas) && el.sillas.length > 0) {
                el.sillas.forEach(s => extractedSeats.push(processSeat(s)));
            }
        });

        return extractedSeats;
    }, [mapa]);

    // Extract tables (mesas) - purely visual
    const tables = useMemo(() => {
        if (!mapa?.contenido) return [];

        const rawContent = Array.isArray(mapa.contenido)
            ? mapa.contenido
            : (mapa.contenido.elementos || []);

        return rawContent.filter(el => {
            const type = (el.type || '').toLowerCase();
            // Check if it's a mesa (visual container)
            return type.includes('mesa');
        }).map(m => ({
            ...m,
            x: m.posicion?.x ?? m.x ?? 0,
            y: m.posicion?.y ?? m.y ?? 0,
            width: m.width ?? m.ancho ?? 100,
            height: m.height ?? m.alto ?? 100,
            radius: m.radius ?? 50
        }));
    }, [mapa]);

    // Calculate Map Bounds for centering/padding
    const mapBounds = useMemo(() => {
        if (seats.length === 0 && tables.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        const updateBounds = (x, y, w, h) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w;
            if (y + h > maxY) maxY = y + h;
        };

        seats.forEach(s => updateBounds(s.x, s.y, s.ancho || 30, s.alto || 30));
        tables.forEach(t => updateBounds(t.x, t.y, t.width, t.height));

        // Pad
        minX -= 50; minY -= 50;
        maxX += 50; maxY += 50;

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }, [seats, tables]);

    // Color hook
    const { getSeatColor, getBorderColor } = useSeatColors(funcionId);

    // --- Resize Observer for Container ---
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                    // Force redraw to ensure Konva updates its internal hit graph dimensions
                    if (stageRef.current) {
                        stageRef.current.batchDraw();
                    }
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // --- Zoom / Pan handlers ---

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        // Point to zoom into
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        // Limit scale
        const clampedScale = Math.min(Math.max(newScale, 0.2), 5); // Allow more zoom in (5x)

        setScale(clampedScale);
        setPosition({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
    };

    const handleZoomIn = () => {
        setScale(s => Math.min(s * 1.2, 5));
    };

    const handleZoomOut = () => {
        setScale(s => Math.max(s / 1.2, 0.2));
    };

    const handleResetZoom = () => {
        // Center map in container
        const scaleX = dimensions.width / mapBounds.width;
        const scaleY = dimensions.height / mapBounds.height;
        const fitScale = Math.min(scaleX, scaleY, 1); // Fit to screen, max 1 (don't zoom in initially)

        setScale(fitScale);
        setPosition({
            x: (dimensions.width - mapBounds.width * fitScale) / 2 - mapBounds.minX * fitScale,
            y: (dimensions.height - mapBounds.height * fitScale) / 2 - mapBounds.minY * fitScale
        });
    };

    // Initial centering
    useEffect(() => {
        // Only center if we haven't touched simple placement yet (or if map changed drastically)
        // For now, center on first load or map change
        if (mapBounds.width > 0) {
            handleResetZoom();
        }
    }, [mapBounds, dimensions.width, dimensions.height]); // Adding dims here ensures re-center on resize if needed? Maybe too aggressive.
    // Actually, we usually want to center once. But if container resizes (e.g. sidebar value), re-centering is nice.

    // --- Click Logic ---

    const handleSeatInteraction = useCallback((seat) => {
        // Simple direct handler
        if (onSeatClick) {
            onSeatClick(seat);
        } else {
            console.warn('[SeatingMapOptimized] No onSeatClick handler provided', seat);
        }
    }, [onSeatClick]);



    // Determine Background Image
    const backgroundImage = mapa?.imagen_fondo || null;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} ref={containerRef}>

            {/* Controls Toolbar */}
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 100,
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <Button icon={<ZoomInOutlined />} size="small" onClick={handleZoomIn} title="Zoom In" />
                <Button icon={<ZoomOutOutlined />} size="small" onClick={handleZoomOut} title="Zoom Out" />
                <Button icon={<ReloadOutlined />} size="small" onClick={handleResetZoom} title="Reset View" />
            </div>

            <Stage
                width={dimensions.width}
                height={dimensions.height}
                draggable
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                ref={stageRef}
                onDragEnd={(e) => {
                    setPosition({ x: e.target.x(), y: e.target.y() });
                }}
                // Critical for touch devices
                hitGraphEnabled={true}
                tapDistance={15} // Tolerance for tap vs drag
                style={{ cursor: 'move' }}
            >
                <Layer>
                    {/* Background Image / Color */}
                    {/* If no image, maybe a subtle grid or bg color? */}
                    {/* <Rect x={mapBounds.minX - 500} y={mapBounds.minY - 500} width={mapBounds.width + 1000} height={mapBounds.height + 1000} fill="#f9fafb" listening={false} /> */}

                    {backgroundImage && (
                        <URLImage
                            src={backgroundImage}
                            x={0}
                            y={0}
                        // Background images in this system are usually sized to fit expected coordinate system or just 0,0
                        // Assuming standard size or auto-size. 
                        // If background has specific dimensions stored in mapa, use them.
                        // Fallback: If map content is 800x600, maybe bg is too? 
                        // Usually bg is just placed at 0,0.
                        />
                    )}

                    {/* Tables */}
                    <Group>
                        {tables.map(table => (
                            <React.Fragment key={table._id || table.id}>
                                {table.radius ? (
                                    <Circle
                                        x={table.x + table.radius}
                                        y={table.y + table.radius}
                                        radius={table.radius}
                                        fill="#e5e7eb"
                                        stroke="#d1d5db"
                                        strokeWidth={1}
                                        listening={false} // Tables mostly decoration
                                    />
                                ) : (
                                    <Rect
                                        x={table.x}
                                        y={table.y}
                                        width={table.width}
                                        height={table.height}
                                        fill="#e5e7eb"
                                        stroke="#d1d5db"
                                        strokeWidth={1}
                                        cornerRadius={8}
                                        listening={false}
                                    />
                                )}
                                {/* Table Label if exists */}
                                {table.nombre && (
                                    <Text
                                        x={table.x}
                                        y={table.y + (table.height || table.radius * 2) / 2 - 10}
                                        width={table.width || table.radius * 2}
                                        text={table.nombre}
                                        fontSize={12}
                                        align="center"
                                        fill="#6b7280"
                                        listening={false}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </Group>

                    {/* Seats */}
                    <Group>
                        {seats.map(seat => {
                            const isSelected = selectedSeatIds.has(seat._id);
                            // const isLocked = lockedSeatIds.has(seat._id); // Not strictly needing visual lock if color handles it

                            // Resolve color
                            // If seat has 'estado', use it. Or use lock status.
                            // But we should use getSeatColor which usually handles logic.
                            // Note: 'lockedSeats' prop might be needed inside getSeatColor logic if hook not updated.
                            // But typically hook internal checks 'seat.estado'.
                            // We need to merge passed 'lockedSeats' into 'seat.estado' if not already done by parent.

                            // For robustness, let's assume 'seat.estado' is reliable OR calculate color manually if needed.
                            // The 'getSeatColor' hook usually takes the seat object which includes 'estado'.

                            // Pass all state to getSeatColor to ensure realtime updates work
                            const color = getSeatColor(
                                seat,
                                null,
                                isSelected,
                                selectedSeatIds,
                                lockedSeats
                            );
                            const border = getBorderColor(seat, isSelected);

                            return (
                                <SeatShape
                                    key={seat._id}
                                    seat={seat}
                                    color={color}
                                    borderColor={border}
                                    isSelected={isSelected}
                                    onClick={handleSeatInteraction}
                                    blockMode={blockMode}
                                    blockAction={blockAction}
                                />
                            );
                        })}
                    </Group>
                </Layer>
            </Stage>

            {/* Loading Overlay */}
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(2px)'
                }}>
                    <Spin size="large" tip="Procesando..." />
                </div>
            )}

            {showLegend && <MapLegend />}
        </div>
    );
};

export { URLImage as BackgroundImage }; // Export URLImage as BackgroundImage for compatibility

export default memo(SeatingMapOptimized);
