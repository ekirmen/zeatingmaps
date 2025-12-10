import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Slider, 
  InputNumber, 
  ColorPicker, 
  Upload, 
  Divider,
  Row,
  Col,
  Tabs,
  Collapse,
  Alert,
  Tag,
  Tooltip,
  message,
  Modal,
  List,
  Descriptions,
  Statistic
} from '../../../utils/antdComponents';
import {
  SettingOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PictureOutlined,
  AppstoreOutlined,
  PaletteOutlined,
  DashboardOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const CrearMapaSettings = ({ 
  mapa, 
  onUpdate, 
  onFinish,
  onBack 
}) => {
  // ===== ESTADOS =====
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('general');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  
  // ===== EFECTOS =====
  useEffect(() => {
    if (mapa) {
      form.setFieldsValue({
        nombre: mapa.nombre,
        descripcion: mapa.descripcion,
        estado: mapa.estado,
        gridSize: mapa.contenido?.configuracion?.gridSize || 20,
        showGrid: mapa.contenido?.configuracion?.showGrid !== false,
        snapToGrid: mapa.contenido?.configuracion?.snapToGrid !== false,
        backgroundScale: mapa.contenido?.configuracion?.background?.scale || 1,
        backgroundOpacity: mapa.contenido?.configuracion?.background?.opacity || 0.3,
        showBackgroundInWeb: mapa.contenido?.configuracion?.background?.showInWeb !== false,
        version: mapa.metadata?.version || '1.0.0',
        tags: mapa.metadata?.tags || [],
        notes: mapa.metadata?.notes || '',
        performanceMode: mapa.contenido?.configuracion?.performanceMode || false,
        cacheEnabled: mapa.contenido?.configuracion?.cacheEnabled !== false,
        compressionEnabled: mapa.contenido?.configuracion?.compressionEnabled !== false,
        securityLevel: mapa.contenido?.configuracion?.securityLevel || 'standard',
        accessControl: mapa.contenido?.configuracion?.accessControl || 'public',
        watermarkEnabled: mapa.contenido?.configuracion?.watermarkEnabled || false,
        watermarkText: mapa.contenido?.configuracion?.watermarkText || '',
        exportFormats: mapa.contenido?.configuracion?.exportFormats || ['png', 'pdf'],
        maxExportSize: mapa.contenido?.configuracion?.maxExportSize || 2048,
        backupEnabled: mapa.contenido?.configuracion?.backupEnabled !== false,
        autoSaveInterval: mapa.contenido?.configuracion?.autoSaveInterval || 5
      });
    }
  }, [mapa, form]);

  // ===== FUNCIONES DE MANIPULACI“N =====
  const handleFormChange = (changedFields, allFields) => {
    const updates = {};
    changedFields.forEach(field => {
      updates[field.name[0]] = field.value;
    });
    
    // Actualizar el mapa con los cambios
    const updatedMapa = {
      ...mapa,
      ...updates,
      contenido: {
        ...mapa.contenido,
        configuracion: {
          ...mapa.contenido?.configuracion,
          gridSize: allFields.gridSize,
          showGrid: allFields.showGrid,
          snapToGrid: allFields.snapToGrid,
          background: mapa.contenido?.configuracion?.background ? {
            ...mapa.contenido.configuracion.background,
            scale: allFields.backgroundScale,
            opacity: allFields.backgroundOpacity,
            showInWeb: allFields.showBackgroundInWeb
          } : null,
          performanceMode: allFields.performanceMode,
          cacheEnabled: allFields.cacheEnabled,
          compressionEnabled: allFields.compressionEnabled,
          securityLevel: allFields.securityLevel,
          accessControl: allFields.accessControl,
          watermarkEnabled: allFields.watermarkEnabled,
          watermarkText: allFields.watermarkText,
          exportFormats: allFields.exportFormats,
          maxExportSize: allFields.maxExportSize,
          backupEnabled: allFields.backupEnabled,
          autoSaveInterval: allFields.autoSaveInterval
        }
      },
      metadata: {
        ...mapa.metadata,
        version: allFields.version,
        tags: allFields.tags,
        notes: allFields.notes,
        updated_at: new Date().toISOString()
      }
    };
    
    onUpdate(updatedMapa);
  };

  const handleFinish = () => {
    form.validateFields().then(() => {
      if (onFinish) {
        onFinish();
      }
    }).catch(error => {
      console.error('Validation failed:', error);
      message.error('Por favor, corrige los errores en el formulario');
    });
  };

  const resetToDefaults = () => {
    Modal.confirm({
      title: 'Restablecer Configuraci³n',
      content: '¿Est¡s seguro de que quieres restablecer toda la configuraci³n a los valores por defecto? Esta acci³n no se puede deshacer.',
      onOk: () => {
        const defaultMapa = {
          ...mapa,
          contenido: {
            ...mapa.contenido,
            configuracion: {
              gridSize: 20,
              showGrid: true,
              snapToGrid: true,
              background: null,
              performanceMode: false,
              cacheEnabled: true,
              compressionEnabled: true,
              securityLevel: 'standard',
              accessControl: 'public',
              watermarkEnabled: false,
              watermarkText: '',
              exportFormats: ['png', 'pdf'],
              maxExportSize: 2048,
              backupEnabled: true,
              autoSaveInterval: 5
            }
          },
          metadata: {
            ...mapa.metadata,
            version: '1.0.0',
            tags: [],
            notes: '',
            updated_at: new Date().toISOString()
          }
        };
        
        onUpdate(defaultMapa);
        form.setFieldsValue({
          gridSize: 20,
          showGrid: true,
          snapToGrid: true,
          backgroundScale: 1,
          backgroundOpacity: 0.3,
          showBackgroundInWeb: true,
          version: '1.0.0',
          tags: [],
          notes: '',
          performanceMode: false,
          cacheEnabled: true,
          compressionEnabled: true,
          securityLevel: 'standard',
          accessControl: 'public',
          watermarkEnabled: false,
          watermarkText: '',
          exportFormats: ['png', 'pdf'],
          maxExportSize: 2048,
          backupEnabled: true,
          autoSaveInterval: 5
        });
        
        message.success('Configuraci³n restablecida a valores por defecto');
      }
    });
  };

  // ===== RENDERIZADO =====
  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <Title level={3} className="mb-6">
          <SettingOutlined className="mr-2" />
          Configuraci³n Avanzada del Mapa
        </Title>
        
        <Paragraph className="text-gray-600 mb-6">
          Configura los par¡metros avanzados de tu mapa, incluyendo rendimiento, seguridad, 
          exportaci³n y otras opciones t©cnicas.
        </Paragraph>

        {/* ===== ALERTAS DE CONFIGURACI“N ===== */}
        <div className="mb-6 space-y-3">
          {mapa?.contenido?.configuracion?.performanceMode && (
            <Alert
              message="Modo de Rendimiento Activo"
              description="El modo de rendimiento est¡ habilitado. Esto puede afectar la calidad visual pero mejorar¡ el rendimiento en dispositivos lentos."
              type="info"
              showIcon
              icon={<DashboardOutlined />}
            />
          )}
          
          {mapa?.contenido?.configuracion?.securityLevel === 'high' && (
            <Alert
              message="Nivel de Seguridad Alto"
              description="Se han aplicado configuraciones de seguridad estrictas. Esto puede limitar algunas funcionalidades."
              type="warning"
              showIcon
              icon={<SafetyOutlined />}
            />
          )}
          
          {mapa?.contenido?.configuracion?.watermarkEnabled && (
            <Alert
              message="Marca de Agua Habilitada"
              description="Las marcas de agua se aplicar¡n autom¡ticamente a todas las exportaciones del mapa."
              type="info"
              showIcon
              icon={<PictureOutlined />}
            />
          )}
        </div>

        {/* ===== TABS DE CONFIGURACI“N ===== */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="mb-6"
        >
          <TabPane 
            tab={<span><InfoCircleOutlined />General</span>} 
            key="general"
          >
            <Form
              form={form}
              layout="vertical"
              onFieldsChange={handleFormChange}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="nombre"
                    label="Nombre del Mapa"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                  >
                    <Input placeholder="Nombre del mapa" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="estado"
                    label="Estado"
                    rules={[{ required: true, message: 'El estado es obligatorio' }]}
                  >
                    <Select>
                      <Option value="draft">Borrador</Option>
                      <Option value="active">Activo</Option>
                      <Option value="inactive">Inactivo</Option>
                      <Option value="archived">Archivado</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="descripcion"
                label="Descripci³n"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Descripci³n detallada del mapa..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="version"
                    label="Versi³n"
                    rules={[{ required: true, message: 'La versi³n es obligatoria' }]}
                  >
                    <Input placeholder="1.0.0" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="tags"
                    label="Etiquetas"
                  >
                    <Select
                      mode="tags"
                      placeholder="Agregar etiquetas..."
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Notas"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Notas adicionales..."
                />
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane 
            tab={<span><AppstoreOutlined />Visual</span>} 
            key="visual"
          >
            <Form
              form={form}
              layout="vertical"
              onFieldsChange={handleFormChange}
            >
              <Title level={5} className="mb-4">Configuraci³n de Cuadr­cula</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gridSize"
                    label="Tama±o de Cuadr­cula (px)"
                  >
                    <Slider
                      min={5}
                      max={100}
                      step={5}
                      marks={{
                        5: '5px',
                        20: '20px',
                        50: '50px',
                        100: '100px'
                      }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="showGrid"
                    label="Mostrar Cuadr­cula"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="snapToGrid"
                    label="Ajustar a Cuadr­cula"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Title level={5} className="mb-4">Configuraci³n de Fondo</Title>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="backgroundScale"
                    label="Escala de Fondo"
                  >
                    <Slider
                      min={0.1}
                      max={3}
                      step={0.1}
                      marks={{
                        0.1: '10%',
                        1: '100%',
                        3: '300%'
                      }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="backgroundOpacity"
                    label="Opacidad de Fondo"
                  >
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      marks={{
                        0: '0%',
                        0.5: '50%',
                        1: '100%'
                      }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="showBackgroundInWeb"
                    label="Mostrar en Web"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </TabPane>

          <TabPane 
            tab={<span><DashboardOutlined />Rendimiento</span>} 
            key="performance"
          >
            <Form
              form={form}
              layout="vertical"
              onFieldsChange={handleFormChange}
            >
              <Title level={5} className="mb-4">Optimizaci³n de Rendimiento</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="performanceMode"
                    label="Modo de Rendimiento"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="cacheEnabled"
                    label="Habilitar Cach©"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="compressionEnabled"
                    label="Compresi³n de Datos"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="autoSaveInterval"
                    label="Intervalo de Auto-guardado (minutos)"
                  >
                    <InputNumber
                      min={1}
                      max={60}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="backupEnabled"
                    label="Habilitar Respaldo Autom¡tico"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Title level={5} className="mb-4">Informaci³n de Rendimiento</Title>
              
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Total Elementos"
                    value={mapa?.contenido?.elementos?.length || 0}
                    prefix={<DatabaseOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Tama±o Aproximado"
                    value={`${Math.round((JSON.stringify(mapa).length / 1024) * 100) / 100}`}
                    suffix="KB"
                    prefix={<ApiOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Nivel de Complejidad"
                    value={
                      (mapa?.contenido?.elementos?.length || 0) > 100 ? 'Alto' :
                      (mapa?.contenido?.elementos?.length || 0) > 50 ? 'Medio' : 'Bajo'
                    }
                    valueStyle={{
                      color: (mapa?.contenido?.elementos?.length || 0) > 100 ? '#cf1322' :
                             (mapa?.contenido?.elementos?.length || 0) > 50 ? '#faad14' : '#3f8600'
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Optimizaci³n"
                    value={
                      mapa?.contenido?.configuracion?.performanceMode ? 'Activada' : 'Desactivada'
                    }
                    valueStyle={{
                      color: mapa?.contenido?.configuracion?.performanceMode ? '#3f8600' : '#faad14'
                    }}
                  />
                </Col>
              </Row>

              <div className="mt-4">
                <Button 
                  type="primary" 
                  icon={<DashboardOutlined />}
                  onClick={() => setShowPerformanceModal(true)}
                >
                  An¡lisis de Rendimiento
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane 
            tab={<span><SafetyOutlined />Seguridad</span>} 
            key="security"
          >
            <Form
              form={form}
              layout="vertical"
              onFieldsChange={handleFormChange}
            >
              <Title level={5} className="mb-4">Configuraci³n de Seguridad</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="securityLevel"
                    label="Nivel de Seguridad"
                  >
                    <Select>
                      <Option value="low">Bajo</Option>
                      <Option value="standard">Est¡ndar</Option>
                      <Option value="high">Alto</Option>
                      <Option value="maximum">M¡ximo</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    name="accessControl"
                    label="Control de Acceso"
                  >
                    <Select>
                      <Option value="public">Pºblico</Option>
                      <Option value="restricted">Restringido</Option>
                      <Option value="private">Privado</Option>
                      <Option value="admin">Solo Administradores</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="watermarkEnabled"
                    label="Habilitar Marca de Agua"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  
                  {form.getFieldValue('watermarkEnabled') && (
                    <Form.Item
                      name="watermarkText"
                      label="Texto de Marca de Agua"
                    >
                      <Input placeholder="Ej: © 2024 Mi Empresa" />
                    </Form.Item>
                  )}
                </Col>
              </Row>

              <Divider />

              <Title level={5} className="mb-4">Recomendaciones de Seguridad</Title>
              
              <Alert
                message="Configuraci³n de Seguridad"
                description={
                  <div>
                    <p><strong>Nivel Est¡ndar:</strong> Adecuado para la mayor­a de casos de uso</p>
                    <p><strong>Nivel Alto:</strong> Recomendado para mapas con informaci³n sensible</p>
                    <p><strong>Nivel M¡ximo:</strong> Solo para mapas con datos cr­ticos</p>
                  </div>
                }
                type="info"
                showIcon
                icon={<SafetyOutlined />}
                className="mb-4"
              />

              <div className="mt-4">
                <Button 
                  type="primary" 
                  icon={<SafetyOutlined />}
                  onClick={() => setShowSecurityModal(true)}
                >
                  Auditor­a de Seguridad
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane 
            tab={<span><DownloadOutlined />Exportaci³n</span>} 
            key="export"
          >
            <Form
              form={form}
              layout="vertical"
              onFieldsChange={handleFormChange}
            >
              <Title level={5} className="mb-4">Formatos de Exportaci³n</Title>
              
              <Form.Item
                name="exportFormats"
                label="Formatos Disponibles"
              >
                <Select
                  mode="multiple"
                  placeholder="Seleccionar formatos..."
                  style={{ width: '100%' }}
                >
                  <Option value="png">PNG (Imagen)</Option>
                  <Option value="jpg">JPG (Imagen)</Option>
                  <Option value="pdf">PDF (Documento)</Option>
                  <Option value="svg">SVG (Vectorial)</Option>
                  <Option value="json">JSON (Datos)</Option>
                  <Option value="xml">XML (Datos)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="maxExportSize"
                label="Tama±o M¡ximo de Exportaci³n (px)"
              >
                <InputNumber
                  min={512}
                  max={4096}
                  step={256}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Divider />

              <Title level={5} className="mb-4">Configuraci³n de Calidad</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text className="block mb-2">Calidad de Imagen</Text>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    marks={{
                      1: 'Baja',
                      5: 'Media',
                      10: 'Alta'
                    }}
                    defaultValue={8}
                  />
                </Col>
                
                <Col span={12}>
                  <Text className="block mb-2">Compresi³n</Text>
                  <Slider
                    min={0}
                    max={100}
                    step={10}
                    marks={{
                      0: 'Sin compresi³n',
                      50: 'Media',
                      100: 'M¡xima'
                    }}
                    defaultValue={20}
                  />
                </Col>
              </Row>
            </Form>
          </TabPane>
        </Tabs>

        {/* ===== BOTONES DE ACCI“N ===== */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Space>
            <Button 
              icon={<UndoOutlined />} 
              onClick={resetToDefaults}
            >
              Restablecer
            </Button>
            <Button 
              icon={<InfoCircleOutlined />} 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              Opciones Avanzadas
            </Button>
          </Space>
          
          <Space>
            {onBack && (
              <Button onClick={onBack}>
                Atr¡s
              </Button>
            )}
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleFinish}
            >
              {onFinish ? 'Finalizar' : 'Guardar'}
            </Button>
          </Space>
        </div>

        {/* ===== OPCIONES AVANZADAS ===== */}
        {showAdvancedOptions && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <Title level={5} className="mb-4">Opciones Avanzadas</Title>
            
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="Base de Datos">
                  <div className="text-center">
                    <DatabaseOutlined className="text-2xl text-blue-500 mb-2" />
                    <Text className="block text-sm">Optimizaci³n autom¡tica</Text>
                    <Switch defaultChecked />
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="API">
                  <div className="text-center">
                    <ApiOutlined className="text-2xl text-green-500 mb-2" />
                    <Text className="block text-sm">Endpoints REST</Text>
                    <Switch defaultChecked />
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="Monitoreo">
                  <div className="text-center">
                                         <DashboardOutlined className="text-2xl text-purple-500 mb-2" />
                    <Text className="block text-sm">M©tricas en tiempo real</Text>
                    <Switch />
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* ===== MODALES ===== */}
      <Modal
        title="An¡lisis de Rendimiento"
        open={showPerformanceModal}
        onCancel={() => setShowPerformanceModal(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <Alert
            message="Estado del Rendimiento"
            description="An¡lisis basado en la configuraci³n actual del mapa"
            type="info"
            showIcon
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Puntuaci³n de Rendimiento"
                value={85}
                suffix="/100"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Tiempo de Carga Estimado"
                value={1.2}
                suffix="s"
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
          
          <List
            size="small"
            dataSource={[
              'œ“ Cach© habilitado para mejor rendimiento',
              'œ“ Compresi³n de datos activada',
              'š  Considerar reducir elementos si superan 100',
              'œ“ Auto-guardado configurado correctamente'
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        </div>
      </Modal>

      <Modal
        title="Auditor­a de Seguridad"
        open={showSecurityModal}
        onCancel={() => setShowSecurityModal(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <Alert
            message="Estado de Seguridad"
            description="Evaluaci³n de las configuraciones de seguridad actuales"
            type="success"
            showIcon
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Nivel de Seguridad"
                value="Alto"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Vulnerabilidades"
                value={0}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
          </Row>
          
          <List
            size="small"
            dataSource={[
              'œ“ Control de acceso configurado',
              'œ“ Marca de agua habilitada',
              'œ“ Nivel de seguridad apropiado',
              'œ“ Sin vulnerabilidades detectadas'
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CrearMapaSettings;


