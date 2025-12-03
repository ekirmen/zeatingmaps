import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Rect, Image } from 'react-konva';
import { Button, Card, Drawer, Badge, Tooltip, Space, Typography, Divider } from 'antd';
import { 
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, CompressOutlined,
  ShoppingCartOutlined, DeleteOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useSeatColors } from '../../hooks/useSeatColors';
import { useMapaSeatsSync } from '../../hooks/useMapaSeatsSync';
import VisualNotifications from '../../utils/VisualNotifications';
import resolveImageUrl from '../../utils/resolveImageUrl';

const { Text: AntText } = Typography;

const CompactSeatingMap = ({
  funcionId, mapa, onSeatToggle, onTableToggle, onAddToCart,
  selectedSeats = [], foundSeats = [], cartItems = [],
}) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [showSeatDetails, setShowSeatDetails] = useState(false);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapImage, setMapImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getSeatColor = useSeatColors();
  const syncedSeats = useMapaSeatsSync(mapa);

  // Load map image
  useEffect(() => {
    if (!mapa?.imagen_fondo) return setImageLoaded(true);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { setMapImage(img); setImageLoaded(true); };
    img.onerror = () => { console.warn('Error loading map background image'); setImageLoaded(true); };
    img.src = resolveImageUrl(mapa.imagen_fondo);
  }, [mapa?.imagen_fondo]);

  // Zoom
  const handleZoom = useCallback((direction) => {
    setStageScale(prev => {
      const newScale = direction === 'in' ? Math.min(prev * 1.2, 3) : Math.max(prev / 1.2, 0.5);
      if (stageRef.current) {
        const stage = stageRef.current;
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        setStagePosition({ x: centerX - centerX * newScale, y: centerY - centerY * newScale });
      }
      return newScale;
    });
  }, []);

  const resetZoom = useCallback(() => { setStageScale(1); setStagePosition({ x:0, y:0 }); }, []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);

  const handleSeatClick = useCallback((seat, event) => {
    event.cancelBubble = true;
    if (seat.estado === 'vendido' || seat.estado === 'bloqueado') {
      return VisualNotifications.show('seatBlocked', 'Este asiento no está disponible');
    }
    setSelectedSeatInfo(seat);
    setShowSeatDetails(true);
    VisualNotifications.show('seatSelected', `Asiento ${seat.nombre || seat._id} seleccionado`);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (selectedSeatInfo && onAddToCart) {
      onAddToCart(selectedSeatInfo);
      VisualNotifications.show('cartUpdated', 'Asiento agregado al carrito');
      setShowSeatDetails(false);
    }
  }, [selectedSeatInfo, onAddToCart]);

  // Dimensions
  const mapDimensions = useMemo(() => {
    if (!syncedSeats || syncedSeats.length === 0) return { width: 800, height: 600 };
    let maxX = 0, maxY = 0;
    syncedSeats.forEach(e => {
      const x = e.x || 0, y = e.y || 0;
      const w = e.width || e.radius || 0, h = e.height || e.radius || 0;
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });
    return { width: Math.max(800, maxX + 50), height: Math.max(600, maxY + 50) };
  }, [syncedSeats]);

  const renderSeat = useCallback((seat, index) => {
    const color = getSeatColor(seat);
    const isSelected = selectedSeats.some(s => s._id === seat._id);
    const isFound = foundSeats.some(s => s._id === seat._id);
    return (
      <Circle
        key={seat._id || index}
        x={seat.x || 0}
        y={seat.y || 0}
        radius={seat.radius || 15}
        fill={color}
        stroke={isSelected ? '#1890ff' : isFound ? '#52c41a' : '#000'}
        strokeWidth={isSelected ? 3 : isFound ? 2 : 1}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={5}
        onClick={e => handleSeatClick(seat, e)}
      />
    );
  }, [getSeatColor, selectedSeats, foundSeats, handleSeatClick]);

  const renderTable = useCallback((table, index) => {
    const isSelected = selectedSeats.some(s => s.mesa_id === table._id);
    const isFound = foundSeats.some(s => s.mesa_id === table._id);
    return (
      <Rect
        key={table._id || index}
        x={table.x || 0} y={table.y || 0}
        width={table.width || 100} height={table.height || 60}
        fill={isSelected ? '#1890ff' : isFound ? '#52c41a' : '#f0f0f0'}
        stroke={isSelected ? '#1890ff' : isFound ? '#52c41a' : '#000'}
        strokeWidth={isSelected ? 3 : isFound ? 2 : 1}
        cornerRadius={table.shape === 'circle' ? 50 : 5}
        onClick={e => onTableToggle && onTableToggle(table, e)}
      />
    );
  }, [selectedSeats, foundSeats, onTableToggle]);

  const renderMapElements = useCallback(() => syncedSeats?.map((el,i) => el.type==='mesa'? renderTable(el,i): renderSeat(el,i)), [syncedSeats, renderTable, renderSeat]);

  if (!imageLoaded) return <div>Cargando mapa...</div>;

  return (
    <div className="compact-seating-map">
      {/* Controls */}
      <div className="mobile-controls">
        <Space size="small">
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => handleZoom('in')} disabled={stageScale >= 3} />
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => handleZoom('out')} disabled={stageScale <= 0.5} />
          <Button size="small" icon={<ReloadOutlined />} onClick={resetZoom} />
          <Button size="small" icon={isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
          <Badge count={cartItems.length} size="small">
            <Button size="small" icon={<ShoppingCartOutlined />} onClick={() => setShowCartDrawer(true)} />
          </Badge>
        </Space>
      </div>

      {/* Stage */}
      <div ref={containerRef} className={`map-container ${isFullscreen?'fullscreen':''}`} style={{ width:'100%', height:isFullscreen?'100vh':'70vh' }}>
        <Stage ref={stageRef} width={mapDimensions.width} height={mapDimensions.height} scaleX={stageScale} scaleY={stageScale} x={stagePosition.x} y={stagePosition.y} draggable onDragEnd={e => setStagePosition({ x: e.target.x(), y: e.target.y() })}>
          <Layer>
            {mapImage && <Image image={mapImage} x={0} y={0} width={mapDimensions.width} height={mapDimensions.height} opacity={0.3} />}
            {renderMapElements()}
          </Layer>
        </Stage>
      </div>

      {/* Seat Drawer */}
      <Drawer title="Detalles del Asiento" placement="bottom" open={showSeatDetails} onClose={() => setShowSeatDetails(false)} height="auto">
        {selectedSeatInfo && (
          <Card size="small">
            <div className="flex justify-between items-center mb-3">
              <div>
                <AntText strong>Asiento: {selectedSeatInfo.nombre || selectedSeatInfo._id}</AntText><br/>
                <AntText type="secondary">Estado: {selectedSeatInfo.estado}</AntText>
              </div>
              <div><AntText strong className="text-lg">${selectedSeatInfo.precio || 0}</AntText></div>
            </div>
            <Divider />
            <Space>
              <Button onClick={() => setShowSeatDetails(false)}>Cancelar</Button>
              <Button type="primary" onClick={handleAddToCart} disabled={['vendido','bloqueado'].includes(selectedSeatInfo.estado)}>Agregar al Carrito</Button>
            </Space>
          </Card>
        )}
      </Drawer>

      {/* Cart Drawer */}
      <Drawer title="Carrito de Compras" placement="right" open={showCartDrawer} onClose={() => setShowCartDrawer(false)} width={300}>
        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><ShoppingCartOutlined className="text-4xl mb-2"/><p>Carrito vacío</p></div>
        ) : (
          <div className="space-y-2">
            {cartItems.map((item,i)=>(
              <Card key={i} size="small">
                <div className="flex justify-between items-center">
                  <div>
                    <AntText strong>{item.nombre || item._id}</AntText><br/>
                    <AntText type="secondary">${item.precio || 0}</AntText>
                  </div>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => VisualNotifications.show('cartUpdated','Asiento eliminado del carrito')} />
                </div>
              </Card>
            ))}
            <Divider />
            <div className="text-center">
              <AntText strong className="text-lg">Total: ${cartItems.reduce((sum,item)=>sum+(item.precio||0),0)}</AntText>
              <Button type="primary" className="w-full mt-2">Proceder al Pago</Button>
            </div>
          </div>
        )}
      </Drawer>

      <style jsx>{`
        .compact-seating-map { width:100%; height:100%; }
        .mobile-controls { position: sticky; top:0; z-index:10; background:white; padding:8px; border-bottom:1px solid #d9d9d9; margin-bottom:8px; }
        .map-container.fullscreen { position: fixed; top:0; left:0; z-index:1000; background:white; }
      `}</style>
    </div>
  );
};

export default CompactSeatingMap;
