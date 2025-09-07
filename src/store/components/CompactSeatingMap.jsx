import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Circle, Rect, Text, Line, Image } from 'react-konva';
import { Button, Card, Drawer, Badge, Tooltip, Space, Typography, Divider } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  FullscreenOutlined,
  CompressOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useSeatColors } from '../../hooks/useSeatColors';
import { useMapaSeatsSync } from '../../hooks/useMapaSeatsSync';
import VisualNotifications from '../../utils/VisualNotifications';
import resolveImageUrl from '../../utils/resolveImageUrl';

const { Text: AntText } = Typography;

const CompactSeatingMap = ({
  funcionId,
  mapa,
  lockSeat,
  unlockSeat,
  lockTable,
  unlockTable,
  isSeatLocked,
  isSeatLockedByMe,
  isTableLocked,
  isTableLockedByMe,
  isAnySeatInTableLocked,
  areAllSeatsInTableLockedByMe,
  onSeatToggle,
  onTableToggle,
  onSeatInfo,
  foundSeats = [],
  selectedSeats = [],
  onAddToCart,
  cartItems = []
}) => {
  const channel = useSeatLockStore(state => state.channel);
  const lockedSeatsState = useSeatLockStore(state => state.lockedSeats);
  const lockSeatStore = useSeatLockStore(state => state.lockSeat);
  const unlockSeatStore = useSeatLockStore(state => state.unlockSeat);

  // Estados para móvil
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [showSeatDetails, setShowSeatDetails] = useState(false);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapImage, setMapImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const stageRef = useRef(null);
  const containerRef = useRef(null);

  // Hook para colores de asientos
  const getSeatColor = useSeatColors();

  // Hook para sincronizar asientos del mapa
  const syncedSeats = useMapaSeatsSync(mapa);

  // Cargar imagen de fondo
  useEffect(() => {
    if (mapa?.imagen_fondo) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setMapImage(img);
        setImageLoaded(true);
      };
      img.onerror = () => {
        console.warn('Error loading map background image');
        setImageLoaded(true);
      };
      img.src = resolveImageUrl(mapa.imagen_fondo);
    } else {
      setImageLoaded(true);
    }
  }, [mapa?.imagen_fondo]);

  // Función para manejar zoom
  const handleZoom = useCallback((direction) => {
    const newScale = direction === 'in' 
      ? Math.min(stageScale * 1.2, 3) 
      : Math.max(stageScale / 1.2, 0.5);
    
    setStageScale(newScale);
    
    // Centrar el zoom
    if (stageRef.current) {
      const stage = stageRef.current;
      const centerX = stage.width() / 2;
      const centerY = stage.height() / 2;
      
      setStagePosition({
        x: centerX - (centerX * newScale),
        y: centerY - (centerY * newScale)
      });
    }
  }, [stageScale]);

  // Función para resetear zoom
  const resetZoom = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  // Función para alternar pantalla completa
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Función para manejar clic en asiento
  const handleSeatClick = useCallback((seat, event) => {
    event.cancelBubble = true;
    
    if (seat.estado === 'vendido' || seat.estado === 'bloqueado') {
      VisualNotifications.show('seatBlocked', 'Este asiento no está disponible');
      return;
    }

    // Mostrar detalles del asiento
    setSelectedSeatInfo(seat);
    setShowSeatDetails(true);
    
    // Notificación visual
    VisualNotifications.show('seatSelected', `Asiento ${seat.nombre || seat._id} seleccionado`);
  }, []);

  // Función para agregar al carrito
  const handleAddToCart = useCallback(() => {
    if (selectedSeatInfo && onAddToCart) {
      onAddToCart(selectedSeatInfo);
      VisualNotifications.show('cartUpdated', 'Asiento agregado al carrito');
      setShowSeatDetails(false);
    }
  }, [selectedSeatInfo, onAddToCart]);

  // Renderizar asiento individual
  const renderSeat = useCallback((seat, index) => {
    const color = getSeatColor(seat);
    const isSelected = selectedSeats.some(s => s._id === seat._id);
    const isFound = foundSeats.some(s => s._id === seat._id);
    
    return (
      <Circle
        key={`seat-${seat._id || index}`}
        x={seat.x || 0}
        y={seat.y || 0}
        radius={seat.radius || 15}
        fill={color}
        stroke={isSelected ? '#1890ff' : isFound ? '#52c41a' : '#000'}
        strokeWidth={isSelected ? 3 : isFound ? 2 : 1}
        onClick={(e) => handleSeatClick(seat, e)}
        onTap={(e) => handleSeatClick(seat, e)}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
      />
    );
  }, [getSeatColor, selectedSeats, foundSeats, handleSeatClick]);

  // Renderizar mesa
  const renderTable = useCallback((table, index) => {
    const isSelected = selectedSeats.some(s => s.mesa_id === table._id);
    const isFound = foundSeats.some(s => s.mesa_id === table._id);
    
    return (
      <Rect
        key={`table-${table._id || index}`}
        x={table.x || 0}
        y={table.y || 0}
        width={table.width || 100}
        height={table.height || 60}
        fill={isSelected ? '#1890ff' : isFound ? '#52c41a' : '#f0f0f0'}
        stroke={isSelected ? '#1890ff' : isFound ? '#52c41a' : '#000'}
        strokeWidth={isSelected ? 3 : isFound ? 2 : 1}
        cornerRadius={table.shape === 'circle' ? 50 : 5}
        onClick={(e) => onTableToggle && onTableToggle(table, e)}
        onTap={(e) => onTableToggle && onTableToggle(table, e)}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.2}
      />
    );
  }, [selectedSeats, foundSeats, onTableToggle]);

  // Renderizar elementos del mapa
  const renderMapElements = useCallback(() => {
    if (!syncedSeats || syncedSeats.length === 0) return null;

    return syncedSeats.map((elemento, index) => {
      if (elemento.type === 'mesa') {
        return renderTable(elemento, index);
      } else if (elemento.type === 'silla') {
        return renderSeat(elemento, index);
      }
      return null;
    });
  }, [syncedSeats, renderTable, renderSeat]);

  // Calcular dimensiones del mapa
  const mapDimensions = useMemo(() => {
    if (!syncedSeats || syncedSeats.length === 0) {
      return { width: 800, height: 600 };
    }

    let maxX = 0;
    let maxY = 0;
    let minX = 0;
    let minY = 0;

    syncedSeats.forEach(elemento => {
      const x = elemento.x || 0;
      const y = elemento.y || 0;
      const width = elemento.width || elemento.radius || 0;
      const height = elemento.height || elemento.radius || 0;

      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
    });

    return {
      width: Math.max(800, (maxX - minX) + 100),
      height: Math.max(600, (maxY - minY) + 100)
    };
  }, [syncedSeats]);

  return (
    <div className="compact-seating-map">
      {/* Controles móviles */}
      <div className="mobile-controls">
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            onClick={() => handleZoom('in')}
            disabled={stageScale >= 3}
          />
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            onClick={() => handleZoom('out')}
            disabled={stageScale <= 0.5}
          />
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={resetZoom}
          />
          <Button
            size="small"
            icon={isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
          <Badge count={cartItems.length} size="small">
            <Button
              size="small"
              icon={<ShoppingCartOutlined />}
              onClick={() => setShowCartDrawer(true)}
            />
          </Badge>
        </Space>
      </div>

      {/* Mapa de asientos */}
      <div 
        ref={containerRef}
        className={`map-container ${isFullscreen ? 'fullscreen' : ''}`}
        style={{
          width: '100%',
          height: isFullscreen ? '100vh' : '70vh',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Stage
          ref={stageRef}
          width={mapDimensions.width}
          height={mapDimensions.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable
          onDragEnd={(e) => {
            setStagePosition({ x: e.target.x(), y: e.target.y() });
          }}
        >
          <Layer>
            {/* Imagen de fondo */}
            {mapImage && (
              <Image
                image={mapImage}
                x={0}
                y={0}
                width={mapDimensions.width}
                height={mapDimensions.height}
                opacity={0.3}
              />
            )}
            
            {/* Elementos del mapa */}
            {renderMapElements()}
          </Layer>
        </Stage>
      </div>

      {/* Drawer de detalles del asiento */}
      <Drawer
        title="Detalles del Asiento"
        placement="bottom"
        open={showSeatDetails}
        onClose={() => setShowSeatDetails(false)}
        height="auto"
        className="seat-details-drawer"
      >
        {selectedSeatInfo && (
          <div className="seat-details">
            <Card size="small">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <AntText strong>Asiento: {selectedSeatInfo.nombre || selectedSeatInfo._id}</AntText>
                  <br />
                  <AntText type="secondary">Estado: {selectedSeatInfo.estado}</AntText>
                </div>
                <div className="text-right">
                  <AntText strong className="text-lg">
                    ${selectedSeatInfo.precio || 0}
                  </AntText>
                </div>
              </div>
              
              <Divider />
              
              <div className="flex justify-between">
                <Button onClick={() => setShowSeatDetails(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleAddToCart}
                  disabled={selectedSeatInfo.estado === 'vendido' || selectedSeatInfo.estado === 'bloqueado'}
                >
                  Agregar al Carrito
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Drawer del carrito */}
      <Drawer
        title="Carrito de Compras"
        placement="right"
        open={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        width={300}
        className="cart-drawer"
      >
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCartOutlined className="text-4xl mb-2" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cartItems.map((item, index) => (
                <Card key={index} size="small">
                  <div className="flex justify-between items-center">
                    <div>
                      <AntText strong>{item.nombre || item._id}</AntText>
                      <br />
                      <AntText type="secondary">${item.precio || 0}</AntText>
                    </div>
                    <Button 
                      size="small" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        // Lógica para eliminar del carrito
                        VisualNotifications.show('cartUpdated', 'Asiento eliminado del carrito');
                      }}
                    />
                  </div>
                </Card>
              ))}
              
              <Divider />
              
              <div className="text-center">
                <AntText strong className="text-lg">
                  Total: ${cartItems.reduce((sum, item) => sum + (item.precio || 0), 0)}
                </AntText>
                <br />
                <Button type="primary" className="w-full mt-2">
                  Proceder al Pago
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Estilos CSS */}
      <style jsx>{`
        .compact-seating-map {
          width: 100%;
          height: 100%;
        }
        
        .mobile-controls {
          position: sticky;
          top: 0;
          z-index: 10;
          background: white;
          padding: 8px;
          border-bottom: 1px solid #d9d9d9;
          margin-bottom: 8px;
        }
        
        .map-container {
          background: #f5f5f5;
        }
        
        .map-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          background: white;
        }
        
        .seat-details-drawer .ant-drawer-body {
          padding: 16px;
        }
        
        .cart-drawer .ant-drawer-body {
          padding: 16px;
        }
        
        @media (max-width: 768px) {
          .mobile-controls {
            padding: 4px;
          }
          
          .map-container {
            height: 60vh;
          }
        }
      `}</style>
    </div>
  );
};

export default CompactSeatingMap;
