import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Input, 
  Switch, 
  Alert, 
  Space, 
  Typography,
  Divider,
  Row,
  Col,
  Form,
  InputNumber,
  Upload,
  message,
  Progress,
  Tag
} from 'antd';
import { 
  PrinterOutlined,
  SettingOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { 
  bocaPrinterService, 
  saveFormatConfig, 
  getFormatConfig,
  DEFAULT_FORMAT_CONFIG,
  BOCA_DEFAULT_TEMPLATE,
  BOCA_SMALL_TEMPLATE,
  BOCA_PREMIUM_TEMPLATE,
  applyBocaTemplate
} from '../services/bocaPrinterService';
import './PrinterConfig.css';
import TemplatePreview from './TemplatePreview';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PrinterConfig = () => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [printerStatus, setPrinterStatus] = useState(null);
  const [formatConfig, setFormatConfig] = useState(DEFAULT_FORMAT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [previewData, setPreviewData] = useState({
    eventName: 'EVENTO DE PRUEBA',
    eventDate: new Date().toLocaleDateString(),
    eventTime: '20:00',
    seatNumber: 'A1',
    zoneName: 'GENERAL',
    price: '25.00',
    ticketNumber: 'TKT-001',
    qrCode: 'TEST-TICKET-001'
  });

  useEffect(() => {
    loadFormatConfig();
  }, []);

  const loadFormatConfig = async () => {
    try {
      const config = await getFormatConfig();
      setFormatConfig(config);
    } catch (error) {
      console.error('Error loading format config:', error);
    }
  };

  const detectPrinters = async () => {
    try {
      setDetecting(true);
      const detectedPrinters = await bocaPrinterService.detectPrinters();
      setPrinters(detectedPrinters);
      
      if (detectedPrinters.length > 0) {
        message.success(`${detectedPrinters.length} impresora(s) detectada(s)`);
      } else {
        message.warning('No se detectaron impresoras Boca');
      }
    } catch (error) {
      console.error('Error detecting printers:', error);
      message.error('Error al detectar impresoras');
    } finally {
      setDetecting(false);
    }
  };

  const connectToPrinter = async (device) => {
    try {
      setLoading(true);
      const success = await bocaPrinterService.connectToPrinter(device);
      
      if (success) {
        setSelectedPrinter(device);
        setIsConnected(true);
        message.success('Impresora conectada exitosamente');
        
        // Obtener estado de la impresora
        const status = await bocaPrinterService.getPrinterStatus();
        setPrinterStatus(status);
      } else {
        message.error('Error al conectar con la impresora');
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      message.error('Error al conectar con la impresora');
    } finally {
      setLoading(false);
    }
  };

  const disconnectPrinter = () => {
    bocaPrinterService.disconnectPrinter();
    setSelectedPrinter(null);
    setIsConnected(false);
    setPrinterStatus(null);
    message.info('Impresora desconectada');
  };

  const testPrinter = async () => {
    try {
      setLoading(true);
      const success = await bocaPrinterService.testConnection();
      
      if (success) {
        message.success('Conexión de impresora exitosa');
      } else {
        message.error('Error en la conexión de impresora');
      }
    } catch (error) {
      console.error('Error testing printer:', error);
      message.error('Error al probar la impresora');
    } finally {
      setLoading(false);
    }
  };

  const printTestTicket = async () => {
    try {
      setLoading(true);
      
      const testTicketData = {
        eventName: 'EVENTO DE PRUEBA',
        eventDate: new Date().toLocaleDateString(),
        eventTime: '20:00',
        seatNumber: 'A1',
        zoneName: 'GENERAL',
        price: '25.00',
        ticketNumber: 'TEST-001',
        qrCode: 'TEST-TICKET-001'
      };

      const success = await bocaPrinterService.printTicket(testTicketData, formatConfig);
      
      if (success) {
        message.success('Ticket de prueba impreso exitosamente');
      } else {
        message.error('Error al imprimir ticket de prueba');
      }
    } catch (error) {
      console.error('Error printing test ticket:', error);
      message.error('Error al imprimir ticket de prueba');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      await saveFormatConfig(formatConfig);
      message.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateName) => {
    try {
      setLoading(true);
      const template = await applyBocaTemplate(templateName);
      setFormatConfig(template);
      message.success(`Plantilla ${templateName} aplicada exitosamente`);
    } catch (error) {
      console.error('Error applying template:', error);
      message.error('Error al aplicar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleFormatChange = (key, value) => {
    setFormatConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="printer-config">
      <Title level={2}>
        <PrinterOutlined /> Configuración de Impresora Boca
      </Title>

      {/* Detección de Impresoras */}
      <Card title="Detección de Impresoras" className="mb-4">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            onClick={detectPrinters}
            loading={detecting}
            icon={<SettingOutlined />}
          >
            Detectar Impresoras
          </Button>

          {printers.length > 0 && (
            <div>
              <Text strong>Impresoras Detectadas:</Text>
              <div className="mt-2">
                {printers.map((printer, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <Text>{printer.productName || `Impresora ${index + 1}`}</Text>
                    <Button 
                      size="small" 
                      onClick={() => connectToPrinter(printer)}
                      className="ml-2"
                    >
                      Conectar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPrinter && (
            <Alert
              message="Impresora Conectada"
              description={`${selectedPrinter.productName || 'Impresora Boca'} - ${isConnected ? 'Conectada' : 'Desconectada'}`}
              type="success"
              showIcon
              action={
                <Button size="small" onClick={disconnectPrinter}>
                  Desconectar
                </Button>
              }
            />
          )}
        </Space>
      </Card>

      {/* Estado de la Impresora */}
      {selectedPrinter && (
        <Card title="Estado de la Impresora" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Button 
                onClick={testPrinter}
                loading={loading}
                icon={<ExperimentOutlined />}
              >
                Probar Conexión
              </Button>
            </Col>
            <Col span={12}>
              <Button 
                onClick={printTestTicket}
                loading={loading}
                icon={<PrinterOutlined />}
                type="primary"
              >
                Imprimir Ticket de Prueba
              </Button>
            </Col>
          </Row>

          {printerStatus && (
            <div className="mt-4">
              <Space>
                <Tag color={printerStatus.connected ? 'green' : 'red'}>
                  {printerStatus.connected ? 'Conectada' : 'Desconectada'}
                </Tag>
                <Tag color={printerStatus.ready ? 'green' : 'red'}>
                  {printerStatus.ready ? 'Lista' : 'No Lista'}
                </Tag>
                <Tag color={printerStatus.paperStatus === 'OK' ? 'green' : 'red'}>
                  Papel: {printerStatus.paperStatus}
                </Tag>
              </Space>
            </div>
          )}
        </Card>
      )}

      {/* Plantillas Predefinidas */}
      <Card title="Plantillas Predefinidas" className="mb-4">
        <Alert
          message="Plantillas Listas para Boca"
          description="Selecciona una plantilla predefinida optimizada para impresoras Boca. Estas plantillas están configuradas con los mejores ajustes para cada tipo de evento."
          type="info"
          showIcon
          className="mb-4"
        />
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card 
              size="small" 
              hoverable
              className="template-card"
              onClick={() => applyTemplate('default')}
            >
              <div className="text-center">
                <Title level={5}>🎭 Estándar</Title>
                <Text type="secondary">80mm - Eventos normales</Text>
                <br />
                <Text type="secondary">Formato profesional</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              size="small" 
              hoverable
              className="template-card"
              onClick={() => applyTemplate('small')}
            >
              <div className="text-center">
                <Title level={5}>📱 Pequeño</Title>
                <Text type="secondary">58mm - Eventos pequeños</Text>
                <br />
                <Text type="secondary">Compacto y económico</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              size="small" 
              hoverable
              className="template-card"
              onClick={() => applyTemplate('premium')}
            >
              <div className="text-center">
                <Title level={5}>⭐ Premium</Title>
                <Text type="secondary">112mm - Eventos premium</Text>
                <br />
                <Text type="secondary">Máxima calidad</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Vista Previa */}
      <TemplatePreview 
        template={formatConfig} 
        ticketData={previewData}
      />

      {/* Configuración de Formato */}
      <Card title="Configuración de Formato" className="mb-4">
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item label="Ancho del Papel (mm)">
                <InputNumber
                  value={formatConfig.paperWidth}
                  onChange={(value) => handleFormatChange('paperWidth', value)}
                  min={58}
                  max={112}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Alto del Papel (mm)">
                <InputNumber
                  value={formatConfig.paperHeight}
                  onChange={(value) => handleFormatChange('paperHeight', value)}
                  min={100}
                  max={500}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item label="Margen Superior (mm)">
                <InputNumber
                  value={formatConfig.marginTop}
                  onChange={(value) => handleFormatChange('marginTop', value)}
                  min={0}
                  max={20}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Margen Inferior (mm)">
                <InputNumber
                  value={formatConfig.marginBottom}
                  onChange={(value) => handleFormatChange('marginBottom', value)}
                  min={0}
                  max={20}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Margen Izquierdo (mm)">
                <InputNumber
                  value={formatConfig.marginLeft}
                  onChange={(value) => handleFormatChange('marginLeft', value)}
                  min={0}
                  max={20}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item label="Tamaño de Fuente">
                <Select
                  value={formatConfig.fontSize}
                  onChange={(value) => handleFormatChange('fontSize', value)}
                >
                  <Option value="00">Normal</Option>
                  <Option value="01">Doble Alto</Option>
                  <Option value="02">Doble Ancho</Option>
                  <Option value="03">Doble Tamaño</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Alineación">
                <Select
                  value={formatConfig.alignment}
                  onChange={(value) => handleFormatChange('alignment', value)}
                >
                  <Option value="0">Izquierda</Option>
                  <Option value="1">Centro</Option>
                  <Option value="2">Derecha</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Encabezado">
            <TextArea
              value={formatConfig.header}
              onChange={(e) => handleFormatChange('header', e.target.value)}
              rows={3}
              placeholder="Texto del encabezado del ticket"
            />
          </Form.Item>

          <Form.Item label="Pie de Página">
            <TextArea
              value={formatConfig.footer}
              onChange={(e) => handleFormatChange('footer', e.target.value)}
              rows={3}
              placeholder="Texto del pie de página del ticket"
            />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item label="Mostrar Código QR">
                <Switch
                  checked={formatConfig.showQRCode}
                  onChange={(checked) => handleFormatChange('showQRCode', checked)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mostrar Código de Barras">
                <Switch
                  checked={formatConfig.showBarcode}
                  onChange={(checked) => handleFormatChange('showBarcode', checked)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div className="mt-4">
          <Button 
            type="primary" 
            onClick={saveConfig}
            loading={loading}
            icon={<SaveOutlined />}
          >
            Guardar Configuración
          </Button>
        </div>
      </Card>

      <Alert
        message="Información Importante"
        description="Asegúrate de que la impresora Boca esté conectada y encendida antes de realizar las pruebas. El sistema detectará automáticamente las impresoras Boca conectadas."
        type="info"
        showIcon
      />
    </div>
  );
};

export default PrinterConfig; 