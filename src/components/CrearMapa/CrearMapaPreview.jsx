import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text as KonvaText, Line, Image, Group } from 'react-konva';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Tag, 
  Divider,
  Tooltip,
  Badge,
  Alert,
  Tabs,
  List,
  Descriptions,
  Collapse
} from 'antd';
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

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const CrearMapaPreview = ({ 
  mapa, 
  onEdit, 
  onNext,
  isModal = false 
}) => {
  // ===== ESTADOS =====
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('visual');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [backgroundImageElement, setBackgroundImageElement] = useState(null);
  
  // ===== REFERENCIAS =====
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  // ===== EFECTOS =====
  useEffect(() => {
    if (containerRef.current && mapa?.contenido?.configuracion?.dimensions) {
      const { width, height } = mapa.contenido.configuracion.dimensions;
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
    }
  }, [mapa, containerRef.current]);

  useEffect(() => {
    const imageUrl = mapa?.contenido?.configuracion?.background?.image;

    if (!imageUrl) {
      setBackgroundImageElement(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBackgroundImageElement(img);
    img.onerror = (error) => {
      console.error('Error loading preview background image:', error);
      setBackgroundImageElement(null);
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [mapa?.contenido?.configuracion?.background?.image]);

  // Verificar que el mapa tenga dimensiones válidas
  const getMapDimensions = () => {
    if (mapa?.contenido?.configuracion?.dimensions) {
      return mapa.contenido.configuracion.dimensions;
    }
    // Valores por defecto si no hay dimensiones
    return { width: 1200, height: 800 };
  };

  // ===== FUNCIONES DE ZOOM =====
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetZoom = () => {
    if (containerRef.current) {
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
    }
  };

  const toggleFullscreen = () => {
    setShowFullscreen(!showFullscreen);
  };

  // ===== FUNCIONES DE EXPORTACIÓN =====
  const exportAsImage = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png'
      });
      
      const link = document.createElement('a');
      link.download = `${mapa.nombre || 'mapa'}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printMapa = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png'
      });
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${mapa.nombre || 'Mapa'}</title>
            <style>
              body { margin: 0; padding: 20px; }
              img { max-width: 100%; height: auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${mapa.nombre || 'Mapa'}</h1>
              <p>${mapa.descripcion || ''}</p>
            </div>
            <img src="${dataURL}" alt="${mapa.nombre || 'Mapa'}" />
            <div class="footer">
              Generado el ${new Date().toLocaleDateString()}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ===== RENDERIZADO DE ELEMENTOS =====
  const renderElement = (element) => {
    const baseProps = {
      key: element._id,
      x: element.posicion.x,
      y: element.posicion.y,
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
        const startSeat = mapa.contenido.elementos.find(el => el._id === element.startSeatId);
        const endSeat = mapa.contenido.elementos.find(el => el._id === element.endSeatId);
        if (!startSeat || !endSeat) return null;
        
        return (
          <Line
            key={element._id}
            points={[
              startSeat.posicion.x + (startSeat.width || 20) / 2,
              startSeat.posicion.y + (startSeat.height || 20) / 2,
              endSeat.posicion.x + (endSeat.width || 20) / 2,
              endSeat.posicion.y + (endSeat.height || 20) / 2
            ]}
            stroke={element.stroke || '#8b93a6'}
            strokeWidth={element.strokeWidth || 2}
            opacity={element.opacity || 0.6}
            dash={element.dash || [5, 5]}
          />
        );

      case 'background': {
        if (backgroundImageElement) {
          return null;
        }

        const imageSource = element.image;
        if (!imageSource) {
          return null;
        }

        const position = element.position || mapa.contenido?.configuracion?.background?.position || { x: 0, y: 0 };
        const scaleValue = element.scale || mapa.contenido?.configuracion?.background?.scale || 1;
        const opacityValue = element.opacity ?? mapa.contenido?.configuracion?.background?.opacity ?? 0.3;

        return (
          <Image
            key={element._id}
            image={imageSource}
            x={position?.x || 0}
            y={position?.y || 0}
            scaleX={scaleValue}
            scaleY={scaleValue}
            opacity={opacityValue}
            listening={false}
          />
        );
      }
      default:
        return null;
    }
  };

  // ===== ESTADÍSTICAS DEL MAPA =====
  const getMapaStats = () => {
    if (!mapa?.contenido?.elementos) return {};
    
    const elementos = mapa.contenido.elementos;
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
  };

  const stats = getMapaStats();

  // ===== RENDERIZADO PRINCIPAL =====
  return (
    <div className={showFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}>
      {/* ===== HEADER ===== */}
      <div className="bg-white border-b border-gray-200 p-4">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={3} className="mb-2">
              <EyeOutlined className="mr-2" />
              Vista Previa: {mapa?.nombre || 'Mapa'}
            </Title>
            <Text type="secondary">
              {mapa?.descripcion || 'Revisa cómo se verá tu mapa antes de publicarlo'}
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
                    {stats.dimensiones.width} x {stats.dimensiones.height} px
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
                      value={stats.totalElementos}
                      prefix={<TableOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Mesas"
                      value={stats.mesas}
                      prefix={<TableOutlined />}
                    />
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Sillas"
                      value={stats.sillas}
                      prefix={<UserOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Zonas"
                      value={stats.zonas}
                      prefix={<SettingOutlined />}
                    />
                  </Col>
                </Row>

                {mapa?.metadata?.tags && mapa.metadata.tags.length > 0 && (
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
            </TabPane>

            <TabPane 
              tab={<span><TableOutlined />Elementos</span>} 
              key="elements"
            >
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
            </TabPane>

            <TabPane 
              tab={<span><SettingOutlined />Configuración</span>} 
              key="config"
            >
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
            {mapa?.contenido?.elementos ? (
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
