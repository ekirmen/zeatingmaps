import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  List, 
  Tag, 
  Progress, 
  Alert, 
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip,
  Collapse
} from '../../utils/antdComponents';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BugOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const CrearMapaValidation = ({ 
  mapa, 
  results, 
  onValidate, 
  onNext, 
  isProcessing, 
  progress 
}) => {
  const [validationStats, setValidationStats] = useState({
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0,
    suggestions: 0
  });

  // ===== VALIDACIONES =====
  const validationRules = [
    {
      id: 'basic_info',
      name: 'Informaci³n B¡sica',
      description: 'Verificar que el mapa tenga informaci³n b¡sica completa',
      validate: (mapa) => {
        const errors = [];
        const warnings = [];
        
        if (!mapa.nombre || mapa.nombre.trim().length < 3) {
          errors.push('El nombre del mapa debe tener al menos 3 caracteres');
        }
        
        if (!mapa.descripcion || mapa.descripcion.trim().length < 10) {
          warnings.push('Se recomienda agregar una descripci³n m¡s detallada');
        }
        
        if (!mapa.contenido?.configuracion?.dimensions?.width || 
            !mapa.contenido?.configuracion?.dimensions?.height) {
          errors.push('Las dimensiones del mapa son obligatorias');
        }
        
        return { errors, warnings };
      }
    },
    
    {
      id: 'elements_structure',
      name: 'Estructura de Elementos',
      description: 'Verificar que los elementos del mapa est©n correctamente estructurados',
      validate: (mapa) => {
        const errors = [];
        const warnings = [];
        
        if (!mapa.contenido?.elementos || mapa.contenido.elementos.length === 0) {
          errors.push('El mapa debe contener al menos un elemento');
          return { errors, warnings };
        }
        
        const elementos = mapa.contenido.elementos;
        
        // Verificar que cada elemento tenga ID ºnico
        const ids = elementos.map(el => el._id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          errors.push('Hay elementos con IDs duplicados');
        }
        
        // Verificar que cada elemento tenga posici³n v¡lida
        elementos.forEach((el, index) => {
          if (!el.posicion || typeof el.posicion.x !== 'number' || typeof el.posicion.y !== 'number') {
            errors.push(`Elemento ${index + 1} no tiene posici³n v¡lida`);
          }
          
          if (el.posicion && (el.posicion.x < 0 || el.posicion.y < 0)) {
            warnings.push(`Elemento ${index + 1} tiene posici³n negativa`);
          }
        });
        
        return { errors, warnings };
      }
    },
    
    {
      id: 'mesas_sillas',
      name: 'Mesas y Sillas',
      description: 'Verificar la configuraci³n de mesas y sillas',
      validate: (mapa) => {
        const errors = [];
        const warnings = [];
        
        const elementos = mapa.contenido?.elementos || [];
        const mesas = elementos.filter(el => el.type === 'mesa');
        const sillas = elementos.filter(el => el.type === 'silla');
        
        if (mesas.length === 0) {
          warnings.push('No hay mesas configuradas en el mapa');
        }
        
        if (sillas.length === 0) {
          warnings.push('No hay sillas configuradas en el mapa');
        }
        
        // Verificar que las sillas tengan mesa padre v¡lida
        sillas.forEach((silla, index) => {
          if (silla.parentId) {
            const mesaPadre = mesas.find(m => m._id === silla.parentId);
            if (!mesaPadre) {
              errors.push(`Silla ${index + 1} referencia una mesa inexistente`);
            }
          }
        });
        
        // Verificar que las mesas tengan dimensiones v¡lidas
        mesas.forEach((mesa, index) => {
          if (mesa.shape === 'rect') {
            if (!mesa.width || !mesa.height || mesa.width <= 0 || mesa.height <= 0) {
              errors.push(`Mesa ${index + 1} tiene dimensiones inv¡lidas`);
            }
          } else if (mesa.shape === 'circle') {
            if (!mesa.radius || mesa.radius <= 0) {
              errors.push(`Mesa ${index + 1} tiene radio inv¡lido`);
            }
          }
        });
        
        return { errors, warnings };
      }
    },
    
    {
      id: 'zones_configuration',
      name: 'Configuraci³n de Zonas',
      description: 'Verificar la configuraci³n de zonas y precios',
      validate: (mapa) => {
        const errors = [];
        const warnings = [];
        
        const zonas = mapa.contenido?.zonas || [];
        const elementos = mapa.contenido?.elementos || [];
        
        if (zonas.length === 0) {
          warnings.push('No hay zonas configuradas');
        }
        
        // Verificar que los elementos asignados a zonas existan
        elementos.forEach((el, index) => {
          if (el.zonaId) {
            const zona = zonas.find(z => z.id === el.zonaId || z._id === el.zonaId);
            if (!zona) {
              errors.push(`Elemento ${index + 1} est¡ asignado a una zona inexistente`);
            }
          }
        });
        
        return { errors, warnings };
      }
    },
    
    {
      id: 'performance_optimization',
      name: 'Optimizaci³n de Rendimiento',
      description: 'Verificar aspectos de rendimiento y optimizaci³n',
      validate: (mapa) => {
        const errors = [];
        const warnings = [];
        
        const elementos = mapa.contenido?.elementos || [];
        
        if (elementos.length > 1000) {
          warnings.push('El mapa tiene muchos elementos, esto puede afectar el rendimiento');
        }
        
        // Verificar elementos fuera de los l­mites del mapa
        const dimensions = mapa.contenido?.configuracion?.dimensions;
        if (dimensions) {
          elementos.forEach((el, index) => {
            if (el.posicion) {
              const maxX = dimensions.width;
              const maxY = dimensions.height;
              
              if (el.posicion.x > maxX || el.posicion.y > maxY) {
                warnings.push(`Elemento ${index + 1} est¡ fuera de los l­mites del mapa`);
              }
            }
          });
        }
        
        return { errors, warnings };
      }
    },
    
    {
      id: 'accessibility',
      name: 'Accesibilidad',
      description: 'Verificar aspectos de accesibilidad y usabilidad',
      validate: (mapa) => {
        const errors = [];
        const warnings = [];
        
        const elementos = mapa.contenido?.elementos || [];
        
        // Verificar que las sillas tengan nºmeros
        const sillas = elementos.filter(el => el.type === 'silla');
        sillas.forEach((silla, index) => {
          if (!silla.numero) {
            warnings.push(`Silla ${index + 1} no tiene nºmero asignado`);
          }
        });
        
        // Verificar que las mesas tengan nombres
        const mesas = elementos.filter(el => el.type === 'mesa');
        mesas.forEach((mesa, index) => {
          if (!mesa.nombre || mesa.nombre.trim().length === 0) {
            warnings.push(`Mesa ${index + 1} no tiene nombre asignado`);
          }
        });
        
        return { errors, warnings };
      }
    }
  ];

  // ===== FUNCI“N DE VALIDACI“N PRINCIPAL =====
  const validateMapa = async () => {
    if (onValidate) {
      await onValidate();
    }
  };

  // ===== EFECTOS =====
  useEffect(() => {
    if (results && results.errors && results.warnings) {
      const totalChecks = validationRules.length;
      const passedChecks = totalChecks - results.errors.length;
      const failedChecks = results.errors.length;
      const warnings = results.warnings.length;
      const suggestions = results.suggestions ? results.suggestions.length : 0;
      
      setValidationStats({
        totalChecks,
        passedChecks,
        failedChecks,
        warnings,
        suggestions
      });
    }
  }, [results, validationRules.length]);

  // ===== RENDERIZADO =====
  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <Title level={3} className="mb-6">
          <SafetyOutlined className="mr-2" />
          Validaci³n del Mapa
        </Title>
        
        <Paragraph className="text-gray-600 mb-6">
          Antes de publicar el mapa, es importante verificar que todo est© correctamente configurado. 
          La validaci³n revisar¡ la integridad, estructura y configuraci³n del mapa.
        </Paragraph>

        {/* ===== ESTADSTICAS DE VALIDACI“N ===== */}
        {results && results.errors && (
          <Row gutter={16} className="mb-6">
            <Col span={4}>
              <Statistic
                title="Total de Verificaciones"
                value={validationStats.totalChecks}
                prefix={<InfoCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Verificaciones Exitosas"
                value={validationStats.passedChecks}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Errores"
                value={validationStats.failedChecks}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Advertencias"
                value={validationStats.warnings}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Sugerencias"
                value={validationStats.suggestions}
                valueStyle={{ color: '#1890ff' }}
                prefix={<InfoCircleOutlined />}
              />
            </Col>
          </Row>
        )}

        {/* ===== BOT“N DE VALIDACI“N ===== */}
        <div className="text-center mb-6">
          <Button
            type="primary"
            size="large"
            icon={<SafetyOutlined />}
            onClick={validateMapa}
            loading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? 'Validando...' : 'Iniciar Validaci³n'}
          </Button>
        </div>

        {/* ===== PROGRESO DE VALIDACI“N ===== */}
        {isProcessing && (
          <div className="mb-6">
            <Text className="block mb-2">Progreso de validaci³n:</Text>
            <Progress 
              percent={progress} 
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        )}

        {/* ===== RESULTADOS DE VALIDACI“N ===== */}
        {results && (results.errors || results.warnings || results.suggestions) && (
          <div className="space-y-4">
            {/* ===== ERRORES ===== */}
            {results.errors && results.errors.length > 0 && (
              <Alert
                message={`${results.errors.length} Error(es) Encontrado(s)`}
                description="Estos problemas deben corregirse antes de continuar:"
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                className="mb-4"
              />
            )}

            {/* ===== ADVERTENCIAS ===== */}
            {results.warnings && results.warnings.length > 0 && (
              <Alert
                message={`${results.warnings.length} Advertencia(s)`}
                description="Estos problemas no impiden continuar pero se recomienda corregirlos:"
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                className="mb-4"
              />
            )}

            {/* ===== SUGERENCIAS ===== */}
            {results.suggestions && results.suggestions.length > 0 && (
              <Alert
                message={`${results.suggestions.length} Sugerencia(s)`}
                description="Estas mejoras pueden hacer tu mapa m¡s efectivo:"
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                className="mb-4"
              />
            )}

            {/* ===== LISTA DETALLADA ===== */}
            <Collapse defaultActiveKey={['errors']} className="mb-4">
              {results.errors && results.errors.length > 0 && (
                <Panel 
                  header={
                    <span>
                      <ExclamationCircleOutlined className="text-red-500 mr-2" />
                      Errores ({results.errors.length})
                    </span>
                  } 
                  key="errors"
                >
                  <List
                    dataSource={results.errors}
                    renderItem={(error, index) => (
                      <List.Item>
                        <Space>
                          <Tag color="red" icon={<BugOutlined />}>
                            Error {index + 1}
                          </Tag>
                          <Text>{error}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Panel>
              )}

              {results.warnings && results.warnings.length > 0 && (
                <Panel 
                  header={
                    <span>
                      <WarningOutlined className="text-yellow-500 mr-2" />
                      Advertencias ({results.warnings.length})
                    </span>
                  } 
                  key="warnings"
                >
                  <List
                    dataSource={results.warnings}
                    renderItem={(warning, index) => (
                      <List.Item>
                        <Space>
                          <Tag color="orange" icon={<WarningOutlined />}>
                            Advertencia {index + 1}
                          </Tag>
                          <Text>{warning}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Panel>
              )}

              {results.suggestions && results.suggestions.length > 0 && (
                <Panel 
                  header={
                    <span>
                      <InfoCircleOutlined className="text-blue-500 mr-2" />
                      Sugerencias ({results.suggestions.length})
                    </span>
                  } 
                  key="suggestions"
                >
                  <List
                    dataSource={results.suggestions}
                    renderItem={(suggestion, index) => (
                      <List.Item>
                        <Space>
                          <Tag color="blue" icon={<InfoCircleOutlined />}>
                            Sugerencia {index + 1}
                          </Tag>
                          <Text>{suggestion}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Panel>
              )}
            </Collapse>

            {/* ===== RESUMEN ===== */}
            <Card className="bg-gray-50">
              <div className="text-center">
                {results.isValid ? (
                  <div>
                    <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
                    <Title level={4} className="text-green-600">
                      ¡Validaci³n Exitosa!
                    </Title>
                    <Text className="text-gray-600">
                      Tu mapa ha pasado todas las verificaciones cr­ticas y est¡ listo para continuar.
                    </Text>
                    <div className="mt-4">
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<CheckOutlined />}
                        onClick={onNext}
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ExclamationCircleOutlined className="text-6xl text-red-500 mb-4" />
                    <Title level={4} className="text-red-600">
                      Validaci³n Fallida
                    </Title>
                    <Text className="text-gray-600">
                      Hay errores que deben corregirse antes de continuar. 
                      Revisa la lista de errores arriba.
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ===== REGLAS DE VALIDACI“N ===== */}
        <Divider />
        <div className="mt-6">
          <Title level={4} className="mb-4">
            <InfoCircleOutlined className="mr-2" />
            Reglas de Validaci³n
          </Title>
          
          <Collapse defaultActiveKey={['0']}>
            {validationRules.map((rule, index) => (
              <Panel 
                header={
                  <span>
                    <SafetyOutlined className="mr-2" />
                    {rule.name}
                  </span>
                } 
                key={index}
              >
                <Text className="text-gray-600 mb-2 block">
                  {rule.description}
                </Text>
                
                {results && results.errors && (
                  <div className="mt-2">
                    {results.errors.some(error => 
                      error.includes(rule.name.toLowerCase()) || 
                      error.includes(rule.id)
                    ) ? (
                      <Tag color="red" icon={<ExclamationCircleOutlined />}>
                        Fall³ validaci³n
                      </Tag>
                    ) : (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Pas³ validaci³n
                      </Tag>
                    )}
                  </div>
                )}
              </Panel>
            ))}
          </Collapse>
        </div>
      </Card>
    </div>
  );
};

// ===== FUNCI“N DE VALIDACI“N ESTTICA =====
CrearMapaValidation.validate = async (mapa) => {
  // Simular validaci³n as­ncrona
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const errors = [];
  const warnings = [];
  const suggestions = [];
  
  // Validaci³n b¡sica
  if (!mapa.nombre || mapa.nombre.trim().length < 3) {
    errors.push('El nombre del mapa debe tener al menos 3 caracteres');
  }
  
  if (!mapa.contenido?.elementos || mapa.contenido.elementos.length === 0) {
    errors.push('El mapa debe contener al menos un elemento');
  }
  
  // Validaci³n de elementos
  if (mapa.contenido?.elementos) {
    const elementos = mapa.contenido.elementos;
    
    elementos.forEach((el, index) => {
      if (!el.posicion || typeof el.posicion.x !== 'number' || typeof el.posicion.y !== 'number') {
        errors.push(`Elemento ${index + 1} no tiene posici³n v¡lida`);
      }
      
      if (el.type === 'silla' && !el.numero) {
        warnings.push(`Silla ${index + 1} no tiene nºmero asignado`);
      }
      
      if (el.type === 'mesa' && (!el.nombre || el.nombre.trim().length === 0)) {
        warnings.push(`Mesa ${index + 1} no tiene nombre asignado`);
      }
    });
    
    // Sugerencias
    if (elementos.length > 50) {
      suggestions.push('Considera agrupar elementos similares para mejor organizaci³n');
    }
    
    if (!mapa.contenido.zonas || mapa.contenido.zonas.length === 0) {
      suggestions.push('Agregar zonas puede ayudar a organizar mejor el mapa');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

export default CrearMapaValidation;


