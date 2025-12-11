import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Steps, 
  message, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Divider,
  Row,
  Col,
  Alert,
  Progress,
  Tag,
  Tooltip,
  Badge
} from '../../utils/antdComponents';
import './CrearMapa.css';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
  DownloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import CrearMapaEditor from './CrearMapaEditor';
import CrearMapaPreview from './CrearMapaPreview';
import CrearMapaSettings from './CrearMapaSettings';
import CrearMapaValidation from './CrearMapaValidation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CrearMapaMain = ({ 
  salaId, 
  onSave, 
  onCancel,
  initialMapa = null,
  isEditMode = false 
}) => {
  // ===== ESTADOS PRINCIPALES =====
  const [currentStep, setCurrentStep] = useState(0);
  const [mapa, setMapa] = useState(() => {
    // Crear un mapa por defecto seguro
    const defaultMapa = {
      id: null,
      nombre: 'Nuevo Mapa',
      descripcion: '',
      sala_id: salaId,
      contenido: {
        elementos: [],
        zonas: [],
        configuracion: {
          gridSize: 20,
          showGrid: true,
          snapToGrid: true,
          background: null,
          dimensions: { width: 1200, height: 800 }
        }
      },
      estado: 'draft',
      metadata: {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: 'Usuario',
        tags: [],
        notes: ''
      }
    };

    // Si hay un mapa inicial, fusionarlo con el por defecto

      return {
        ...defaultMapa,
        ...initialMapa,
        contenido: {
          ...defaultMapa.contenido,
          ...(initialMapa.contenido || {}),
          elementos: Array.isArray(initialMapa.contenido?.elementos) ? initialMapa.contenido.elementos : [],
          zonas: Array.isArray(initialMapa.contenido?.zonas) ? initialMapa.contenido.zonas : [],
          configuracion: {
            ...defaultMapa.contenido.configuracion,
            ...(initialMapa.contenido?.configuracion || {})
          }
        }
      };
    }

    return defaultMapa;
  });

  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // ===== ESTADOS DE VALIDACI“N =====
  const [validationResults, setValidationResults] = useState({
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  });
  
  // ===== ESTADOS DE PROGRESO =====
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // ===== PASOS DEL WIZARD =====
  const steps = [
    {
      title: 'Configuraci³n B¡sica',
      description: 'Informaci³n del mapa',
      icon: <InfoCircleOutlined />,
      content: 'basic'
    },
    {
      title: 'Dise±o del Mapa',
      description: 'Editor visual',
      icon: <EditOutlined />,
      content: 'editor'
    },
    {
      title: 'Validaci³n',
      description: 'Verificar integridad',
      icon: <CheckCircleOutlined />,
      content: 'validation'
    },
    {
      title: 'Vista Previa',
      description: 'Revisar resultado',
      icon: <EyeOutlined />,
      content: 'preview'
    },
    {
      title: 'Configuraci³n Avanzada',
      description: 'Ajustes finales',
      icon: <SettingOutlined />,
      content: 'settings'
    }
  ];

  // ===== EFECTOS =====
  useEffect(() => {
    if (initialMapa) {
      setMapa(initialMapa);
      setCurrentStep(1); // Ir directamente al editor si es edici³n
    }
  }, [initialMapa]);

  useEffect(() => {
    // Calcular progreso basado en el paso actual y validaci³n
    let progressValue = (currentStep / (steps.length - 1)) * 100;
    
    if (currentStep >= 2 && validationResults.isValid) {
      progressValue += 20; // Bonus por validaci³n exitosa
    }
    
    setProgress(Math.min(progressValue, 100));
  }, [currentStep, validationResults.isValid, steps.length]);

  // ===== FUNCIONES DE NAVEGACI“N =====
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  // ===== FUNCIONES DE VALIDACI“N =====
  const validateMapa = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simular proceso de validaci³n
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const results = await CrearMapaValidation.validate(mapa);
      setValidationResults(results);
      
      if (results.isValid) {
        message.success('Mapa validado exitosamente');
        nextStep();
      } else {
        message.warning('El mapa tiene algunos problemas que deben corregirse');
      }
    } catch (error) {
      message.error('Error durante la validaci³n');
      console.error('Validation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== FUNCIONES DE GUARDADO =====
  const handleSave = async (mapaData) => {
    try {
      const mapaToSave = {
        ...mapaData,
        metadata: {
          ...mapaData.metadata,
          updated_at: new Date().toISOString(),
          version: mapaData.metadata.version || '1.0.0'
        }
      };
      
      if (onSave) {
        await onSave(mapaToSave);
      }
      
      setMapa(mapaToSave);
      message.success('Mapa guardado exitosamente');
      
      // Ir al siguiente paso si no es el ºltimo
      if (currentStep < steps.length - 1) {
        nextStep();
      }
    } catch (error) {
      message.error('Error al guardar el mapa');
      console.error('Save error:', error);
    }
  };

  const handleFinalSave = async () => {
    try {
      const finalMapa = {
        ...mapa,
        estado: 'active',
        metadata: {
          ...mapa.metadata,
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        }
      };
      
      if (onSave) {
        await onSave(finalMapa);
      }
      
      message.success('Mapa publicado exitosamente');
      onCancel(); // Cerrar el editor
    } catch (error) {
      message.error('Error al publicar el mapa');
      console.error('Final save error:', error);
    }
  };

  // ===== RENDERIZADO DE CONTENIDO POR PASO =====
  const renderStepContent = () => {
    switch (steps[currentStep].content) {
      case 'basic':
        return (
          <CrearMapaBasicConfig
            mapa={mapa}
            onUpdate={setMapa}
            onNext={nextStep}
          />
        );
      
      case 'editor':
        return (
          <CrearMapaEditor
            salaId={salaId}
            initialMapa={mapa}
            onSave={handleSave}
            onCancel={() => setCurrentStep(currentStep - 1)}
            isEditMode={isEditMode}
          />
        );
      
      case 'validation':
        return (
          <CrearMapaValidation
            mapa={mapa}
            results={validationResults}
            onValidate={validateMapa}
            onNext={nextStep}
            isProcessing={isProcessing}
            progress={progress}
          />
        );
      
      case 'preview':
        return (
          <CrearMapaPreview
            mapa={mapa}
            onEdit={() => setCurrentStep(1)}
            onNext={nextStep}
          />
        );
      
      case 'settings':
        return (
          <CrearMapaSettings
            mapa={mapa}
            onUpdate={setMapa}
            onFinish={handleFinalSave}
            onBack={() => setCurrentStep(currentStep - 1)}
          />
        );
      
      default:
        return null;
    }
  };

  // ===== RENDERIZADO PRINCIPAL =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ===== HEADER ===== */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-8">
        <div className="max-w-7xl mx-auto">
          <Row gutter={24} align="middle">
            <Col flex="auto">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl text-white">ðŸŽ¨</span>
                </div>
                <div>
                  <Title level={1} className="mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {isEditMode ? 'Editar Mapa' : 'Crear Nuevo Mapa'}
                  </Title>
                  <Text className="text-lg text-gray-600">
                    {isEditMode ? 'Modifica la configuraci³n y dise±o del mapa existente' : 'Dise±a y configura un nuevo mapa para tu sala'}
                  </Text>
                </div>
              </div>
            </Col>
            
            <Col>
              <Space size="middle">
                <Button 
                  icon={<EyeOutlined />}
                  onClick={() => setShowPreview(true)}
                  title="Vista previa r¡pida"
                  size="large"
                  className="btn-gradient-primary shadow-custom hover-lift"
                >
                  Vista Previa
                </Button>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={() => setShowSettings(true)}
                  title="Configuraci³n avanzada"
                  size="large"
                  className="btn-gradient-success shadow-custom hover-lift"
                >
                  Configuraci³n
                </Button>
                <Button 
                  onClick={onCancel}
                  size="large"
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancelar
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      {/* ===== PROGRESS BAR ===== */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{Math.round(progress)}%</span>
              </div>
              <div>
                <Text className="text-base font-semibold text-gray-800">
                  Progreso del Mapa
                </Text>
                <Text className="text-sm text-gray-500">
                  Paso {currentStep + 1} de {steps.length}
                </Text>
              </div>
            </div>
            <div className="text-right">
              <Text className="text-sm text-gray-500">
                {progress === 100 ? (
                  <span className="text-green-600 font-semibold">ðŸŽ‰ ¡Listo para publicar!</span>
                ) : (
                  <span className="text-blue-600">ðŸš€ Continuando...</span>
                )}
              </Text>
            </div>
          </div>
          <Progress 
            percent={progress} 
            status={progress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#3b82f6',
              '50%': '#8b5cf6',
              '100%': '#10b981',
            }}
            strokeWidth={12}
            showInfo={false}
            className="custom-progress"
          />
        </div>
      </div>

      {/* ===== STEPS NAVIGATION ===== */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Flujo de Creaci³n del Mapa
            </Text>
            <Text className="text-sm text-gray-600">
              Sigue estos pasos para crear un mapa completo y profesional
            </Text>
          </div>
          <Steps 
            current={currentStep} 
            onChange={goToStep}
            items={steps}
            progressDot
            responsive={true}
            className="custom-steps"
          />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 crear-mapa-content">
          {renderStepContent()}
        </div>
      </div>

      {/* ===== FOOTER NAVIGATION ===== */}
      <div className="bg-white shadow-lg border-t border-gray-200 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              {currentStep > 0 && (
                <Button 
                  onClick={prevStep}
                  size="large"
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 px-6"
                >
                  † Anterior
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                {validationResults.isValid && (
                  <Tag color="success" icon={<CheckCircleOutlined />} className="px-3 py-1 text-sm font-medium">
                    œ… Validado - ¡Perfecto!
                  </Tag>
                )}
                {validationResults.errors.length > 0 && (
                  <Tag color="error" icon={<ExclamationCircleOutlined />} className="px-3 py-1 text-sm font-medium">
                    Œ {validationResults.errors.length} errores
                  </Tag>
                )}
                {validationResults.warnings.length > 0 && (
                  <Tag color="warning" icon={<ExclamationCircleOutlined />} className="px-3 py-1 text-sm font-medium">
                    š ï¸ {validationResults.warnings.length} advertencias
                  </Tag>
                )}
                {validationResults.suggestions.length > 0 && (
                  <Tag color="processing" icon={<InfoCircleOutlined />} className="px-3 py-1 text-sm font-medium">
                    ðŸ’¡ {validationResults.suggestions.length} sugerencias
                  </Tag>
                )}
              </div>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  type="primary" 
                  onClick={nextStep}
                                         disabled={currentStep === 1 && !(mapa?.contenido?.elementos && Array.isArray(mapa.contenido.elementos) && mapa.contenido.elementos.length > 0)}
                  size="large"
                  className="btn-gradient-primary shadow-custom hover-lift px-8 py-2 h-12 text-base font-semibold"
                >
                  Siguiente †’
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleFinalSave}
                  disabled={!validationResults.isValid}
                  size="large"
                  className="btn-gradient-success shadow-custom hover-lift px-8 py-2 h-12 text-base font-semibold"
                >
                  ðŸš€ Publicar Mapa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALES ===== */}
      <Modal
        title="Vista Previa del Mapa"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        <CrearMapaPreview
          mapa={mapa}
          onEdit={() => {
            setShowPreview(false);
            setCurrentStep(1);
          }}
        />
      </Modal>

      <Modal
        title="Configuraci³n Avanzada"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={null}
        width="80%"
      >
        <CrearMapaSettings
          mapa={mapa}
          onUpdate={setMapa}
          onFinish={() => setShowSettings(false)}
        />
      </Modal>
    </div>
  );
};

// ===== COMPONENTES AUXILIARES =====



  const handleFinish = (values) => {
    onUpdate({
      ...mapa,
      ...values,
      metadata: {
        ...mapa.metadata,
        updated_at: new Date().toISOString()
      }
    });
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-custom">
          <span className="text-4xl text-white">ðŸŽ¨</span>
        </div>
        <Title level={1} className="mb-4 text-gradient">
          ¡Bienvenido al Creador de Mapas!
        </Title>
        <Title level={3} className="mb-3 text-gray-700">
          Configuraci³n B¡sica del Mapa
        </Title>
        <Text className="text-lg text-gray-600 max-w-2xl mx-auto">
          Comienza creando tu mapa de asientos personalizado. Define la informaci³n fundamental y luego pasa al editor visual donde podr¡s dise±ar la distribuci³n perfecta.
        </Text>
      </div>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={mapa}
        onFinish={handleFinish}
        className="space-y-6"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nombre"
              label="Nombre del Mapa"
              rules={[{ required: true, message: 'El nombre es obligatorio' }]}
            >
              <Input placeholder="Ej: Mapa Principal - Sala A" />
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
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="descripcion"
          label="Descripci³n"
        >
          <TextArea 
            rows={4} 
            placeholder="Describe el prop³sito y caracter­sticas del mapa..."
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['contenido', 'configuracion', 'dimensions', 'width']}
              label="Ancho del Mapa (px)"
              rules={[{ required: true, message: 'El ancho es obligatorio' }]}
            >
              <Input type="number" min={400} max={2000} />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name={['contenido', 'configuracion', 'dimensions', 'height']}
              label="Alto del Mapa (px)"
              rules={[{ required: true, message: 'El alto es obligatorio' }]}
            >
              <Input type="number" min={300} max={1500} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name={['metadata', 'tags']}
          label="Etiquetas"
        >
          <Select
            mode="tags"
            placeholder="Agregar etiquetas..."
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name={['metadata', 'notes']}
          label="Notas"
        >
          <TextArea 
            rows={3} 
            placeholder="Notas adicionales sobre el mapa..."
          />
        </Form.Item>

        <div className="text-center pt-6">
          <Button 
            type="primary" 
            size="large" 
            htmlType="submit"
            className="btn-gradient-primary shadow-custom hover-lift px-12 py-3 h-14 text-lg font-semibold"
          >
            ðŸŽ¨ Continuar al Editor
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CrearMapaMain;


