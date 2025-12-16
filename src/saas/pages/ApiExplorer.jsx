import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Spin,
  Tabs,
  Form,
  message,
  Collapse,
  Badge,
  Tooltip,
  Modal
} from '../../utils/antdComponents';
import {
  ApiOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ApiExplorer = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [requestData, setRequestData] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

  // Lista de endpoints disponibles
  const endpoints = [
    {
      category: 'Grid Sale',
      name: 'Load Zonas',
      method: 'POST',
      url: '/api/grid-sale/load-zonas',
      description: 'Cargar zonas y precios para venta en modo grid',
      sampleData: {
        evento: {
          recinto: 67,
          sala: 52
        }
      }
    },
    {
      category: 'Grid Sale',
      name: 'Validate Sale',
      method: 'POST',
      url: '/api/grid-sale/validate-sale',
      description: 'Validar una venta antes de procesarla',
      sampleData: {
        items: [
          { zona_id: 22, precio: 10, cantidad: 2 }
        ],
        evento: { id: 'test-event' },
        funcion: { id: 'test-function' }
      }
    },
    {
      category: 'Events',
      name: 'List Events',
      method: 'GET',
      url: '/api/events/list',
      description: 'Listar todos los eventos',
      sampleData: {
        tenant_id: 'test-tenant',
        limit: 10,
        offset: 0
      }
    },
    {
      category: 'Events',
      name: 'Get Event by Slug',
      method: 'GET',
      url: '/api/events/get-by-slug',
      description: 'Obtener evento por su slug',
      sampleData: {
        slug: 'test-event'
      }
    },
    {
      category: 'SaaS',
      name: 'Dashboard Stats',
      method: 'GET',
      url: '/api/saas/dashboard-stats',
      description: 'Estad­sticas del dashboard SaaS',
      sampleData: {
        tenant_id: 'test-tenant',
        period: '30d'
      }
    },
    {
      category: 'SaaS',
      name: 'User Management',
      method: 'GET',
      url: '/api/saas/user-management',
      description: 'Gestionar usuarios de tenants',
      sampleData: {
        tenant_id: 'test-tenant',
        limit: 10
      }
    },
    {
      category: 'Analytics',
      name: 'Sales Report',
      method: 'GET',
      url: '/api/analytics/sales-report',
      description: 'Reportes de ventas',
      sampleData: {
        tenant_id: 'test-tenant',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      }
    },
    {
      category: 'Payment',
      name: 'Test Stripe Connection',
      method: 'POST',
      url: '/api/payment/test-stripe-connection',
      description: 'Probar conexi³n con Stripe',
      sampleData: {
        test: true
      }
    },
    {
      category: 'Payment',
      name: 'Test PayPal Connection',
      method: 'POST',
      url: '/api/payment/test-paypal-connection',
      description: 'Probar conexi³n con PayPal',
      sampleData: {
        test: true
      }
    },
  ];

  // Funci³n para ejecutar un endpoint
  const executeEndpoint = async (endpoint) => {
    setLoading(true);
    setSelectedEndpoint(endpoint.name);

    try {
      const url = `https://sistema.veneventos.com${endpoint.url}`;
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      // Agregar body para POST requests
      if (endpoint.method === 'POST' && endpoint.sampleData) {
        options.body = JSON.stringify(endpoint.sampleData);
      }

      // Agregar query params para GET requests
      let finalUrl = url;
      if (endpoint.method === 'GET' && endpoint.sampleData) {
        const params = new URLSearchParams(endpoint.sampleData);
        finalUrl = `${url}?${params}`;
      }

      const startTime = Date.now();
      const response = await fetch(finalUrl, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const data = await response.json();

      const result = {
        id: Date.now(),
        endpoint: endpoint.name,
        method: endpoint.method,
        url: finalUrl,
        status: response.status,
        success: response.ok,
        responseTime: responseTime,
        data: data,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [result, ...prev]);
      setResponseData(data);
      setActiveTab('2');

      if (response.ok) {
        message.success(`œ… ${endpoint.name} ejecutado correctamente`);
      } else {
        message.error(`Œ ${endpoint.name} fall³: ${data.message || 'Error desconocido'}`);
      }

    } catch (error) {
      const result = {
        id: Date.now(),
        endpoint: endpoint.name,
        method: endpoint.method,
        url: `https://sistema.veneventos.com${endpoint.url}`,
        status: 0,
        success: false,
        responseTime: 0,
        data: { error: error.message },
        timestamp: new Date().toISOString()
      };

      setResults(prev => [result, ...prev]);
      setResponseData({ error: error.message });
      setActiveTab('2');
      message.error(`Œ Error ejecutando ${endpoint.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funci³n para ejecutar todos los endpoints
  const executeAllEndpoints = async () => {
    setLoading(true);
    setResults([]);

    for (const endpoint of endpoints) {
      await executeEndpoint(endpoint);
      // Peque±a pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
    message.success('ðŸŽ‰ Todos los endpoints han sido ejecutados');
  };

  // Funci³n para copiar al portapapeles
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('ðŸ“‹ Copiado al portapapeles');
  };

  // Funci³n para formatear JSON

  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  // Columnas de la tabla de resultados
  const columns = [
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (text, record) => (
        <Space>
          <Tag color={record.method === 'GET' ? 'blue' : 'green'}>
            {record.method}
          </Tag>
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Badge
          status={record.success ? 'success' : 'error'}
          text={
            <Space>
              {record.success ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              )}
              {status}
            </Space>
          }
        />
      )
    },
    {
      title: 'Tiempo (ms)',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time) => (
        <Text code>{time}ms</Text>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver respuesta">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setResponseData(record.data);
                setActiveTab('2');
              }}
            />
          </Tooltip>
          <Tooltip title="Copiar URL">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => copyToClipboard(record.url)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Agrupar endpoints por categor­a
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <ApiOutlined /> API Explorer
        </Title>
        <Paragraph>
          Herramienta para probar y explorar todos los endpoints de la API de VeeEventos.
        </Paragraph>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="ðŸ§ª Testing" key="1">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card>
                  <Space>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={executeAllEndpoints}
                      loading={loading}
                    >
                      Ejecutar Todos
                    </Button>
                    <Text type="secondary">
                      {endpoints.length} endpoints disponibles
                    </Text>
                  </Space>
                </Card>
              </Col>

              <Col span={24}>
                <Collapse>
                  {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
                    <Panel
                      header={
                        <Space>
                          <Badge count={categoryEndpoints.length} />
                          <Text strong>{category}</Text>
                        </Space>
                      }
                      key={category}
                    >
                      <Row gutter={[16, 16]}>
                        {categoryEndpoints.map((endpoint, index) => (
                          <Col xs={24} sm={12} md={8} key={index}>
                            <Card
                              size="small"
                              hoverable
                              actions={[
                                <Button
                                  type="primary"
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => executeEndpoint(endpoint)}
                                  loading={loading && selectedEndpoint === endpoint.name}
                                >
                                  Ejecutar
                                </Button>
                              ]}
                            >
                              <Card.Meta
                                title={
                                  <Space>
                                    <Tag color={endpoint.method === 'GET' ? 'blue' : 'green'}>
                                      {endpoint.method}
                                    </Tag>
                                    {endpoint.name}
                                  </Space>
                                }
                                description={endpoint.description}
                              />
                              <Divider />
                              <Text code style={{ fontSize: '12px' }}>
                                {endpoint.url}
                              </Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Panel>
                  ))}
                </Collapse>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="ðŸ“Š Resultados" key="2">
            <Card>
              <Space style={{ marginBottom: 16 }}>
                <Title level={4}>Resultados de Pruebas</Title>
                <Badge count={results.length} />
                {results.length > 0 && (
                  <Button
                    onClick={() => setResults([])}
                    size="small"
                  >
                    Limpiar
                  </Button>
                )}
              </Space>

              {results.length === 0 ? (
                <Alert
                  message="No hay resultados"
                  description="Ejecuta algunos endpoints para ver los resultados aqu­."
                  type="info"
                  showIcon
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={results}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="ðŸ“‹ Respuesta" key="3">
            <Card>
              <Title level={4}>šltima Respuesta</Title>
              {responseData ? (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(formatJson(responseData))}
                    >
                      Copiar JSON
                    </Button>
                  </Space>
                  <TextArea
                    value={formatJson(responseData)}
                    rows={20}
                    readOnly
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              ) : (
                <Alert
                  message="No hay respuesta"
                  description="Ejecuta un endpoint para ver la respuesta aqu­."
                  type="info"
                  showIcon
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="ðŸ“š Documentaci³n" key="4">
            <Card>
              <Title level={4}>Documentaci³n de la API</Title>
              <Paragraph>
                Esta herramienta te permite probar todos los endpoints de la API de VeeEventos
                de forma interactiva. Cada endpoint est¡ documentado con ejemplos de uso.
              </Paragraph>

              <Title level={5}>Categor­as de Endpoints:</Title>
              <ul>
                <li><strong>Grid Sale:</strong> Endpoints para venta de entradas en modo grid</li>
                <li><strong>Events:</strong> Gesti³n de eventos</li>
                <li><strong>SaaS:</strong> Funcionalidades del panel SaaS</li>
                <li><strong>Analytics:</strong> Reportes y estad­sticas</li>
                <li><strong>Payment:</strong> Integraci³n con pasarelas de pago</li>
                <li><strong>Health:</strong> Verificaci³n del estado del sistema</li>
              </ul>

              <Title level={5}>C³mo usar:</Title>
              <ol>
                <li>Selecciona un endpoint de la lista</li>
                <li>Haz clic en "Ejecutar" para probarlo</li>
                <li>Ve los resultados en la pesta±a "Resultados"</li>
                <li>Revisa la respuesta detallada en "Respuesta"</li>
              </ol>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ApiExplorer;


