import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Switch, 
  InputNumber, 
  Upload, 
  message, 
  Space, 
  Typography,
  Divider,
  Row,
  Col,
  Alert,
  Tabs
} from 'antd';
import { 
  SaveOutlined,
  PrinterOutlined,
  FileTextOutlined,
  PictureOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { saveFormatConfig, getFormatConfig, DEFAULT_FORMAT_CONFIG } from '../services/bocaPrinterService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const FormatoEntrada = () => {
  const [form] = Form.useForm();
  const [formatConfig, setFormatConfig] = useState(DEFAULT_FORMAT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [currentValues, setCurrentValues] = useState(DEFAULT_FORMAT_CONFIG);

  useEffect(() => {
    loadFormatConfig();
  }, []);

  const loadFormatConfig = async () => {
    try {
      const config = await getFormatConfig();
      setFormatConfig(config);
      setCurrentValues(config);
      form.setFieldsValue(config);
    } catch (error) {
      console.error('Error loading format config:', error);
      message.error('Error al cargar la configuración');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      console.log('Saving values:', values);
      
      await saveFormatConfig(values);
      setFormatConfig(values);
      setCurrentValues(values);
      message.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving format config:', error);
      message.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (changedFields, allFields) => {
    const values = form.getFieldsValue();
    setCurrentValues(values);
    console.log('Form changed:', values);
  };

  const handlePreview = () => {
    const values = form.getFieldsValue();
    console.log('Generating preview with values:', values);
    
    setPreviewData({
      eventName: 'EVENTO DE PRUEBA',
      eventDate: new Date().toLocaleDateString(),
      eventTime: '20:00',
      seatNumber: 'A1',
      zoneName: 'GENERAL',
      price: '25.00',
      ticketNumber: 'TKT-001',
      qrCode: 'TEST-TICKET-001'
    });
  };

  const generatePreviewText = () => {
    if (!previewData) return '';

    const values = currentValues; // Usar los valores actuales del formulario
    let preview = '';

    // Aplicar configuración de alineación
    const alignmentClass = values.alignment === '0' ? 'text-left' : 
                          values.alignment === '1' ? 'text-center' : 'text-right';

    // Aplicar configuración de tamaño de fuente
    const fontSizeClass = values.fontSize === '00' ? 'text-sm' :
                         values.fontSize === '01' ? 'text-lg' :
                         values.fontSize === '02' ? 'text-xl' : 'text-2xl';

    // Encabezado
    if (values.header) {
      preview += `${values.header}\n`;
    }

    // Separador
    preview += `${'─'.repeat(40)}\n`;

    // Datos del ticket
    preview += `Evento: ${previewData.eventName}\n`;
    preview += `Fecha: ${previewData.eventDate}\n`;
    preview += `Hora: ${previewData.eventTime}\n`;
    preview += `Asiento: ${previewData.seatNumber}\n`;
    preview += `Zona: ${previewData.zoneName}\n`;
    preview += `Precio: $${previewData.price}\n`;
    preview += `Ticket #: ${previewData.ticketNumber}\n`;

    // Código QR si está habilitado
    if (values.showQRCode) {
      preview += `\nQR Code: ${previewData.qrCode}\n`;
    }

    // Código de barras si está habilitado
    if (values.showBarcode) {
      preview += `Barcode: ||||| ||||| ||||| |||||\n`;
    }

    // Separador
    preview += `${'─'.repeat(40)}\n`;

    // Pie de página
    if (values.footer) {
      preview += `${values.footer}\n`;
    }

    return preview;
  };

  return (
    <div className="formato-entrada-page">
      <Title level={2}>
        <FileTextOutlined /> Configuración de Formato de Entrada
      </Title>

      <Alert
        message="Configuración de Impresora Boca"
        description="Configura el formato de los tickets que se imprimirán en la impresora Boca. Ajusta el tamaño del papel, márgenes, fuentes y contenido."
        type="info"
        showIcon
        className="mb-6"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onValuesChange={handleFormChange}
        initialValues={formatConfig}
      >
        <Tabs defaultActiveKey="1">
          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                Configuración Básica
              </span>
            } 
            key="1"
          >
            <Card title="Configuración de Papel" className="mb-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label="Ancho del Papel (mm)"
                    name="paperWidth"
                    rules={[{ required: true, message: 'Ingresa el ancho del papel' }]}
                  >
                    <InputNumber
                      min={58}
                      max={112}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Alto del Papel (mm)"
                    name="paperHeight"
                    rules={[{ required: true, message: 'Ingresa el alto del papel' }]}
                  >
                    <InputNumber
                      min={100}
                      max={500}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Form.Item
                    label="Margen Superior (mm)"
                    name="marginTop"
                  >
                    <InputNumber
                      min={0}
                      max={20}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Margen Inferior (mm)"
                    name="marginBottom"
                  >
                    <InputNumber
                      min={0}
                      max={20}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Margen Izquierdo (mm)"
                    name="marginLeft"
                  >
                    <InputNumber
                      min={0}
                      max={20}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Margen Derecho (mm)"
                    name="marginRight"
                  >
                    <InputNumber
                      min={0}
                      max={20}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Configuración de Texto" className="mb-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label="Tamaño de Fuente"
                    name="fontSize"
                  >
                    <Select>
                      <Option value="00">Normal</Option>
                      <Option value="01">Doble Alto</Option>
                      <Option value="02">Doble Ancho</Option>
                      <Option value="03">Doble Tamaño</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Alineación"
                    name="alignment"
                  >
                    <Select>
                      <Option value="0">Izquierda</Option>
                      <Option value="1">Centro</Option>
                      <Option value="2">Derecha</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Contenido del Ticket
              </span>
            } 
            key="2"
          >
            <Card title="Encabezado y Pie de Página" className="mb-4">
              <Form.Item
                label="Encabezado del Ticket"
                name="header"
                help="Texto que aparecerá al inicio del ticket"
              >
                <TextArea
                  rows={4}
                  placeholder="Ejemplo: BOLETERÍA SISTEMA&#10;Dirección: Calle Principal #123&#10;Teléfono: (555) 123-4567"
                />
              </Form.Item>

              <Form.Item
                label="Pie de Página del Ticket"
                name="footer"
                help="Texto que aparecerá al final del ticket"
              >
                <TextArea
                  rows={4}
                  placeholder="Ejemplo: Gracias por su compra&#10;Disfrute del evento&#10;No se permiten devoluciones"
                />
              </Form.Item>
            </Card>

            <Card title="Elementos Adicionales" className="mb-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label="Mostrar Código QR"
                    name="showQRCode"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Mostrar Código de Barras"
                    name="showBarcode"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <PrinterOutlined />
                Vista Previa
              </span>
            } 
            key="3"
          >
            <Card title="Vista Previa del Ticket" className="mb-4">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  onClick={handlePreview}
                  icon={<PrinterOutlined />}
                >
                  Generar Vista Previa
                </Button>

                {previewData && (
                  <div className="preview-container">
                    <div className="preview-ticket">
                      <pre className="preview-text">
                        {generatePreviewText()}
                      </pre>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </TabPane>
        </Tabs>

        <div className="mt-6">
          <Button 
            type="primary" 
            size="large"
            onClick={handleSave}
            loading={loading}
            icon={<SaveOutlined />}
          >
            Guardar Configuración
          </Button>
        </div>
      </Form>

      <style jsx>{`
        .preview-container {
          margin-top: 16px;
        }
        
        .preview-ticket {
          background: #f5f5f5;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 16px;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .preview-text {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default FormatoEntrada;