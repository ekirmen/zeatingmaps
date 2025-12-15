import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Rect, Text as KonvaText, Line, Image, Group } from 'react-konva';
import { 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Tag, 
  Divider,
  Tabs,
  List,
  Descriptions,
  Collapse
} from '../../utils/antdComponents';
import {
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  TableOutlined,
  UserOutlined,
  SettingOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CompressOutlined,
  PrinterOutlined,
  FileImageOutlined,
  UndoOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// Constantes
const DEFAULT_DIMENSIONS = { width: 1200, height: 800 };
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_FACTOR = 1.2;

const CrearMapaPreview = ({ 
  mapa, 
  onEdit, 
  onNext,
  isModal = false 
}) => {
  // ===== ESTADOS =====
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('info');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [backgroundImageElement, setBackgroundImageElement] = useState(null);
  
  // ===== REFERENCIAS =====
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  // ===== MÉTODOS DE UTILIDAD =====
  const getMapDimensions = useCallback(() => {
    return mapa?.contenido?.configuracion?.dimensions || DEFAULT_DIMENSIONS;
  }, [mapa]);

  const getMapaStats = useMemo(() => {
    if (!mapa?.contenido?.elementos) return {};
    
    const elementos = mapa.contenido.elementos || [];
    const mesas = elementos.filter(el => el.type === 'mesa');
    const sillas = elementos.filter(el => el.type === 'silla');
    const conexiones = elementos.filter(el => el.type === 'conexion');
    const zonas = mapa.contenido.zonas || [];
    
    return {
      totalElementos: elementos.length,
      mesas: mesas.length,
      sillas: sillas.length,
      conexiones: conexiones.length,
      zonas: zonas.length,
      dimensiones: getMapDimensions()
    };
  }, [mapa, getMapDimensions]);

  // ===== EFECTOS =====
  useEffect(() => {
    const calculateScaleAndPosition = () => {
      if (!containerRef.current) return;
      
      const { width, height } = getMapDimensions();
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calcular escala para ajustar el mapa al contenedor
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const newScale = Math.min(scaleX, scaleY, 1); // No escalar más allá del 100%
      
      setScale(newScale);
      
      // Centrar el mapa
      const newX = (containerWidth - width * newScale) / 2;
      const newY = (containerHeight - height * newScale) / 2;
      setPosition({ x: newX, y: newY });
    };

    calculateScaleAndPosition();
    
    // Recalcular cuando cambia el tamaño de la ventana
    window.addEventListener('resize', calculateScaleAndPosition);
    return () => window.removeEventListener('resize', calculateScaleAndPosition);
  }, [mapa, getMapDimensions]);

  useEffect(() => {
    const imageUrl = mapa?.contenido?.configuracion?.background?.image;

    if (!imageUrl) {
      setBackgroundImageElement(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    const handleLoad = () => setBackgroundImageElement(img);
    const handleError = (error) => {
      console.error('Error loading preview background image:', error);
      setBackgroundImageElement(null);
    };
    
    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [mapa?.contenido?.configuracion?.background?.image]);

  // ===== FUNCIONES DE ZOOM =====
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * ZOOM_FACTOR, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / ZOOM_FACTOR, MIN_SCALE));
  }, []);

  const resetZoom = useCallback(() => {
    if (!containerRef.current) return;
    
    const { width, height } = getMapDimensions();
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    setScale(newScale);
    
    const newX = (containerWidth - width * newScale) / 2;
    const newY = (containerHeight - height * newScale) / 2;
    setPosition({ x: newX, y: newY });
  }, [getMapDimensions]);

  const toggleFullscreen = useCallback(() => {
    setShowFullscreen(prev => !prev);
  }, []);

  // ===== FUNCIONES DE EXPORTACIÓN =====
  const exportAsImage = useCallback(() => {
    if (!stageRef.current) return;
    
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png'
    });
    
    const link = document.createElement('a');
    link.download = `${mapa?.nombre || 'mapa'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [mapa?.nombre]);

  const printMapa = useCallback(() => {
    if (!stageRef.current) return;
    
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png'
    });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${mapa?.nombre || 'Mapa'}</title>
          <style>
            body { margin: 0; padding: 20px; }
            img { max-width: 100%; height: auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${mapa?.nombre || 'Mapa'}</h1>
            <p>${mapa?.descripcion || ''}</p>
          </div>
          <img src="${dataURL}" alt="${mapa?.nombre || 'Mapa'}" />
          <div class="footer">
            Generado el ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [mapa?.nombre, mapa?.descripcion]);

  // ===== RENDERIZADO DE ELEMENTOS =====
  const renderElement = useCallback((element) => {
    const baseProps = {
      key: element._id,
      x: element.posicion?.x || 0,
      y: element.posicion?.y || 0,
      listening: false
    };

    switch (element.type) {
      case 'mesa':
        return (
          <Group key={element._id} {...baseProps}>
            {element.shape === 'circle' ? (
              <Circle
                radius={element.radius || 60}
                fill={element.fill || '#f0f0f0'}
                stroke="#d9d9d9"
                strokeWidth={2}
                opacity={element.opacity || 1}
              />
            ) : (
              <Rect
                width={element.width || 120}
                height={element.height || 80}
                fill={element.fill || '#f0f0f0'}
                stroke="#d9d9d9"
                strokeWidth={2}
                opacity={element.opacity || 1}
                cornerRadius={element.cornerRadius || 0}
              />
            )}
            <KonvaText
              text={element.nombre || 'Mesa'}
              fontSize={14}
              fill="#333"
              align="center"
              width={element.width || 120}
              y={element.height ? element.height / 2 - 7 : 36}
            />
          </Group>
        );

      case 'silla':
        return (
          <Group key={element._id} {...baseProps}>
            {element.shape === 'circle' ? (
              <Circle
                radius={element.radius || 10}
                fill={element.fill || '#00d6a4'}
                stroke="#a8aebc"
                strokeWidth={2}
                opacity={element.opacity || 1}
              />
            ) : (
              <Rect
                width={element.width || 20}
                height={element.height || 20}
                fill={element.fill || '#00d6a4'}
                stroke="#a8aebc"
                strokeWidth={2}
                opacity={element.opacity || 1}
                cornerRadius={element.cornerRadius || 2}
              />
            )}
            {element.numero && (
              <KonvaText
                text={element.numero.toString()}
                fontSize={10}
                fill="#333"
                align="center"
                width={element.width || 20}
                y={element.height ? element.height / 2 - 5 : 7}
              />
            )}
          </Group>
        );

      case 'conexion':
        const startSeat = mapa.contenido.elementos?.find(el => el._id === element.startSeatId);
        const endSeat = mapa.contenido.elementos?.find(el => el._id === element.endSeatId);
        
        if (!startSeat || !endSeat) return null;
        
        const startX = startSeat.posicion?.x + (startSeat.width || 20) / 2;
        const startY = startSeat.posicion?.y + (startSeat.height || 20) / 2;
        const endX = endSeat.posicion?.x + (endSeat.width || 20) / 2;
        const endY = endSeat.posicion?.y + (endSeat.height || 20) / 2;
        
        return (
          <Line
            key={element._id}
            points={[startX, startY, endX, endY]}
            stroke={element.stroke || '#8b93a6'}
            strokeWidth={element.strokeWidth || 2}
            opacity={element.opacity || 0.6}
            dash={element.dash || [5, 5]}
          />
        );

      default:
        return null;
    }
  }, [mapa?.contenido?.elementos]);

  // ===== COMPONENTES RENDERIZADOS =====
  const InfoPanel = useMemo(() => (
    <div className="p-4">
      <Descriptions title="Detalles del Mapa" column={1} size="small">
        <Descriptions.Item label="Nombre">
          {mapa?.nombre || 'Sin nombre'}
        </Descriptions.Item>
        <Descriptions.Item label="Estado">
          <Tag color={mapa?.estado === 'active' ? 'green' : 'orange'}>
            {mapa?.estado === 'active' ? 'Activo' : 'Borrador'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Descripción">
          {mapa?.descripcion || 'Sin descripción'}
        </Descriptions.Item>
        <Descriptions.Item label="Dimensiones">
          {getMapaStats.dimensiones.width} x {getMapaStats.dimensiones.height} px
        </Descriptions.Item>
        <Descriptions.Item label="Versión">
          {mapa?.metadata?.version || '1.0.0'}
        </Descriptions.Item>
        <Descriptions.Item label="Creado">
          {mapa?.metadata?.created_at ? 
            new Date(mapa.metadata.created_at).toLocaleDateString() : 
            'N/A'
          }
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>Estadísticas</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Total Elementos"
            value={getMapaStats.totalElementos}
            prefix={<TableOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Mesas"
            value={getMapaStats.mesas}
            prefix={<TableOutlined />}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Sillas"
            value={getMapaStats.sillas}
            prefix={<UserOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Zonas"
            value={getMapaStats.zonas}
            prefix={<SettingOutlined />}
          />
        </Col>
      </Row>

      {mapa?.metadata?.tags?.length > 0 && (
        <>
          <Divider />
          <Title level={5}>Etiquetas</Title>
          <div className="flex flex-wrap gap-2">
            {mapa.metadata.tags.map((tag, index) => (
              <Tag key={index} color="blue">{tag}</Tag>
            ))}
          </div>
        </>
      )}

      {mapa?.metadata?.notes && (
        <>
          <Divider />
          <Title level={5}>Notas</Title>
          <Text className="text-gray-600">
            {mapa.metadata.notes}
          </Text>
        </>
      )}
    </div>
  ), [mapa, getMapaStats]);

  const ElementsPanel = useMemo(() => (
    <div className="p-4">
      <Title level={5}>Lista de Elementos</Title>
      
      <List
        size="small"
        dataSource={mapa?.contenido?.elementos || []}
        renderItem={(element, index) => (
          <List.Item>
            <div className="w-full">
              <div className="flex justify-between items-center">
                <Text strong>
                  {element.type === 'mesa' ? 'Mesa' : 
                   element.type === 'silla' ? 'Silla' : 
                   element.type === 'conexion' ? 'Conexión' : 
                   element.type}
                </Text>
                <Tag color={
                  element.type === 'mesa' ? 'blue' : 
                  element.type === 'silla' ? 'green' : 
                  element.type === 'conexion' ? 'purple' : 'default'
                }>
                  {index + 1}
                </Tag>
              </div>
              
              {element.nombre && (
                <Text className="text-sm text-gray-600 block">
                  {element.nombre}
                </Text>
              )}
              
              {element.numero && (
                <Text className="text-sm text-gray-600 block">
                  Número: {element.numero}
                </Text>
              )}
              
              <Text className="text-xs text-gray-500 block">
                Posición: ({element.posicion?.x || 0}, {element.posicion?.y || 0})
              </Text>
            </div>
          </List.Item>
        )}
      />
    </div>
  ), [mapa?.contenido?.elementos]);

  const ConfigPanel = useMemo(() => (
    <div className="p-4">
      <Title level={5}>Configuración del Mapa</Title>
      
      <Collapse defaultActiveKey={['grid', 'background']}>
        <Panel header="Cuadrícula" key="grid">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Tamaño">
              {mapa?.contenido?.configuracion?.gridSize || 20}px
            </Descriptions.Item>
            <Descriptions.Item label="Mostrar">
              {mapa?.contenido?.configuracion?.showGrid ? 'Sí' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Ajustar a cuadrícula">
              {mapa?.contenido?.configuracion?.snapToGrid ? 'Sí' : 'No'}
            </Descriptions.Item>
          </Descriptions>
        </Panel>
        
        <Panel header="Fondo" key="background">
          {mapa?.contenido?.configuracion?.background ? (
            <div>
              <img 
                src={mapa.contenido.configuracion.background.image} 
                alt="Fondo del mapa"
                className="w-full h-32 object-cover rounded mb-2"
              />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Escala">
                  {Math.round((mapa.contenido.configuracion.background.scale || 1) * 100)}%
                </Descriptions.Item>
                <Descriptions.Item label="Opacidad">
                  {Math.round((mapa.contenido.configuracion.background.opacity || 1) * 100)}%
                </Descriptions.Item>
                <Descriptions.Item label="Mostrar en web">
                  {mapa.contenido.configuracion.background.showInWeb ? 'Sí' : 'No'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ) : (
            <Text type="secondary">No hay imagen de fondo configurada</Text>
          )}
        </Panel>
      </Collapse>
    </div>
  ), [mapa]);

  // ===== RENDERIZADO PRINCIPAL =====
  if (!mapa) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <TableOutlined className="text-6xl text-gray-300 mb-4" />
          <Title level={4} className="text-gray-500">
            No hay mapa para mostrar
          </Title>
        </div>
      </div>
    );
  }

  return (
    <div className={showFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full flex flex-col'}>
      {/* ===== HEADER ===== */}
      <div className="bg-white border-b border-gray-200 p-4">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={3} className="mb-2">
              <EyeOutlined className="mr-2" />
              Vista Previa: {mapa.nombre || 'Mapa'}
            </Title>
            <Text type="secondary">
              {mapa.descripcion || 'Revisa cómo se verá tu mapa antes de publicarlo'}
            </Text>
          </Col>
          
          <Col>
            <Space>
              <Button 
                icon={<ZoomOutOutlined />} 
                onClick={zoomOut}
                title="Zoom out"
              />
              <Button 
                icon={<ZoomInOutlined />} 
                onClick={zoomIn}
                title="Zoom in"
              />
              <Button 
                icon={<UndoOutlined />} 
                onClick={resetZoom}
                title="Reset zoom"
              />
              <Button 
                icon={showFullscreen ? <CompressOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                title={showFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
              />
              {onEdit && (
                <Button 
                  icon={<EditOutlined />} 
                  onClick={onEdit}
                  type="primary"
                >
                  Editar
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===== PANEL IZQUIERDO - INFORMACIÓN ===== */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="h-full"
          >
            <TabPane 
              tab={<span><InfoCircleOutlined />Información</span>} 
              key="info"
            >
              {InfoPanel}
            </TabPane>

            <TabPane 
              tab={<span><TableOutlined />Elementos</span>} 
              key="elements"
            >
              {ElementsPanel}
            </TabPane>

            <TabPane 
              tab={<span><SettingOutlined />Configuración</span>} 
              key="config"
            >
              {ConfigPanel}
            </TabPane>
          </Tabs>
        </div>

        {/* ===== ÁREA DE VISUALIZACIÓN ===== */}
        <div className="flex-1 flex flex-col">
          {/* ===== BARRA DE HERRAMIENTAS ===== */}
          <div className="bg-white border-b border-gray-200 p-2">
            <div className="flex justify-between items-center">
              <div>
                <Text className="text-sm text-gray-600">
                  Zoom: {Math.round(scale * 100)}%
                </Text>
              </div>
              
              <Space>
                <Button 
                  icon={<FileImageOutlined />} 
                  onClick={exportAsImage}
                  size="small"
                >
                  Exportar Imagen
                </Button>
                <Button 
                  icon={<PrinterOutlined />} 
                  onClick={printMapa}
                  size="small"
                >
                  Imprimir
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  size="small"
                >
                  Descargar
                </Button>
                <Button 
                  icon={<ShareAltOutlined />} 
                  size="small"
                >
                  Compartir
                </Button>
              </Space>
            </div>
          </div>

          {/* ===== CANVAS DEL MAPA ===== */}
          <div 
            className="flex-1 bg-gray-50 overflow-hidden" 
            ref={containerRef}
          >
            {mapa?.contenido?.elementos?.length > 0 ? (
              <Stage
                ref={stageRef}
                width={containerRef.current?.clientWidth || 1200}
                height={containerRef.current?.clientHeight || 800}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
              >
                <Layer>
                  {/* Fondo */}
                  <Rect
                    width={getMapDimensions().width}
                    height={getMapDimensions().height}
                    fill="#ffffff"
                  />
                  
                  {/* Imagen de fondo */}
                  {backgroundImageElement && (
                    <Image
                      image={backgroundImageElement}
                      x={mapa.contenido.configuracion?.background?.position?.x || 0}
                      y={mapa.contenido.configuracion?.background?.position?.y || 0}
                      scaleX={mapa.contenido.configuracion?.background?.scale || 1}
                      scaleY={mapa.contenido.configuracion?.background?.scale || 1}
                      opacity={mapa.contenido.configuracion?.background?.opacity ?? 0.3}
                      listening={false}
                    />
                  )}
                  
                  {/* Elementos del mapa */}
                  {mapa.contenido.elementos.map(renderElement)}
                </Layer>
              </Stage>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <TableOutlined className="text-6xl text-gray-300 mb-4" />
                  <Title level={4} className="text-gray-500">
                    No hay elementos para mostrar
                  </Title>
                  <Text className="text-gray-400">
                    El mapa no contiene elementos configurados
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      {!isModal && onNext && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="text-center">
            <Button 
              type="primary" 
              size="large"
              onClick={onNext}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearMapaPreview;