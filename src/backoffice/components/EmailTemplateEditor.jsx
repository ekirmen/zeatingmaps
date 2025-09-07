import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  Select, 
  ColorPicker, 
  Button, 
  Space, 
  Typography, 
  Divider, 
  Upload, 
  Modal, 
  message, 
  Spin,
  Tabs,
  Switch,
  InputNumber,
  Collapse
} from 'antd';
import { 
  PaletteOutlined, 
  UploadOutlined, 
  SaveOutlined, 
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const EmailTemplateEditor = ({ 
  templateId, 
  reportType, 
  onSave, 
  onCancel 
}) => {
  const { currentTenant } = useTenant();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [template, setTemplate] = useState(null);
  const [designConfig, setDesignConfig] = useState({
    header: {
      backgroundColor: '#1890ff',
      textColor: '#ffffff',
      logo: null,
      title: 'Reporte de Ventas',
      subtitle: null
    },
    body: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.6'
    },
    footer: {
      backgroundColor: '#f5f5f5',
      textColor: '#666666',
      text: '© 2024 Tu Empresa. Todos los derechos reservados.',
      links: []
    },
    colors: {
      primary: '#1890ff',
      secondary: '#52c41a',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    layout: {
      maxWidth: '600px',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  });

  const reportTypes = [
    { value: 'sales', label: 'Ventas' },
    { value: 'events', label: 'Eventos' },
    { value: 'users', label: 'Usuarios' },
    { value: 'payments', label: 'Pagos' },
    { value: 'products', label: 'Productos' },
    { value: 'promociones', label: 'Promociones' },
    { value: 'carritos', label: 'Carritos' }
  ];

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      // Set default values for new template
      form.setFieldsValue({
        nombre: `Plantilla ${reportTypes.find(rt => rt.value === reportType)?.label || 'Personalizada'}`,
        tipo_reporte: reportType,
        activo: true,
        es_predeterminado: false
      });
    }
  }, [templateId, reportType]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('tenant_id', currentTenant?.id)
        .single();

      if (error) throw error;

      setTemplate(data);
      setDesignConfig(data.configuracion_diseno || designConfig);
      
      form.setFieldsValue({
        nombre: data.nombre,
        tipo_reporte: data.tipo_reporte,
        activo: data.activo,
        es_predeterminado: data.es_predeterminado
      });
    } catch (error) {
      console.error('Error loading template:', error);
      message.error('Error al cargar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      const templateData = {
        ...values,
        tenant_id: currentTenant?.id,
        configuracion_diseno: designConfig,
        updated_at: new Date().toISOString()
      };

      if (templateId) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', templateId);

        if (error) throw error;
        message.success('Plantilla actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;
        message.success('Plantilla creada correctamente');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      message.error('Error al guardar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const updateDesignConfig = (section, field, value) => {
    setDesignConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const generatePreview = () => {
    return `
      <div style="
        max-width: ${designConfig.layout.maxWidth};
        margin: 0 auto;
        padding: ${designConfig.layout.padding};
        background-color: ${designConfig.body.backgroundColor};
        border-radius: ${designConfig.layout.borderRadius};
        box-shadow: ${designConfig.layout.boxShadow};
        font-family: ${designConfig.body.fontFamily};
        font-size: ${designConfig.body.fontSize};
        line-height: ${designConfig.body.lineHeight};
        color: ${designConfig.body.textColor};
      ">
        <!-- Header -->
        <div style="
          background-color: ${designConfig.header.backgroundColor};
          color: ${designConfig.header.textColor};
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
          margin-bottom: 20px;
        ">
          ${designConfig.header.logo ? `<img src="${designConfig.header.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
          <h1 style="margin: 0; font-size: 24px;">${designConfig.header.title}</h1>
          ${designConfig.header.subtitle ? `<p style="margin: 10px 0 0 0; opacity: 0.9;">${designConfig.header.subtitle}</p>` : ''}
        </div>

        <!-- Body Content -->
        <div style="padding: 20px 0;">
          <h2 style="color: ${designConfig.colors.primary};">Resumen del Reporte</h2>
          <p>Este es un ejemplo de cómo se verá el contenido del reporte con la configuración actual.</p>
          
          <div style="
            background-color: ${designConfig.colors.success}20;
            border-left: 4px solid ${designConfig.colors.success};
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          ">
            <strong>Estadísticas Principales:</strong>
            <ul style="margin: 10px 0;">
              <li>Total de ventas: $1,234.56</li>
              <li>Número de transacciones: 45</li>
              <li>Período: Enero 2024</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          background-color: ${designConfig.footer.backgroundColor};
          color: ${designConfig.footer.textColor};
          padding: 15px;
          border-radius: 0 0 8px 8px;
          text-align: center;
          font-size: 12px;
          margin-top: 20px;
        ">
          ${designConfig.footer.text}
        </div>
      </div>
    `;
  };

  const renderColorPicker = (section, field, label) => (
    <Form.Item label={label}>
      <ColorPicker
        value={designConfig[section]?.[field]}
        onChange={(color) => updateDesignConfig(section, field, color.toHexString())}
        showText
      />
    </Form.Item>
  );

  const renderDesignSection = (title, section) => (
    <Panel header={title} key={section}>
      <Row gutter={16}>
        <Col span={12}>
          {renderColorPicker(section, 'backgroundColor', 'Color de Fondo')}
        </Col>
        <Col span={12}>
          {renderColorPicker(section, 'textColor', 'Color de Texto')}
        </Col>
      </Row>
      
      {section === 'header' && (
        <>
          <Form.Item label="Título">
            <Input
              value={designConfig.header.title}
              onChange={(e) => updateDesignConfig('header', 'title', e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Subtítulo">
            <Input
              value={designConfig.header.subtitle}
              onChange={(e) => updateDesignConfig('header', 'subtitle', e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Logo URL">
            <Input
              value={designConfig.header.logo}
              onChange={(e) => updateDesignConfig('header', 'logo', e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
            />
          </Form.Item>
        </>
      )}
      
      {section === 'body' && (
        <>
          <Form.Item label="Fuente">
            <Select
              value={designConfig.body.fontFamily}
              onChange={(value) => updateDesignConfig('body', 'fontFamily', value)}
            >
              <Option value="Arial, sans-serif">Arial</Option>
              <Option value="Helvetica, sans-serif">Helvetica</Option>
              <Option value="Georgia, serif">Georgia</Option>
              <Option value="Times New Roman, serif">Times New Roman</Option>
              <Option value="Verdana, sans-serif">Verdana</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tamaño de Fuente">
                <InputNumber
                  value={parseInt(designConfig.body.fontSize)}
                  onChange={(value) => updateDesignConfig('body', 'fontSize', `${value}px`)}
                  min={10}
                  max={24}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Altura de Línea">
                <InputNumber
                  value={parseFloat(designConfig.body.lineHeight)}
                  onChange={(value) => updateDesignConfig('body', 'lineHeight', value.toString())}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
      
      {section === 'footer' && (
        <Form.Item label="Texto del Footer">
          <Input.TextArea
            value={designConfig.footer.text}
            onChange={(e) => updateDesignConfig('footer', 'text', e.target.value)}
            rows={3}
          />
        </Form.Item>
      )}
    </Panel>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre de la Plantilla"
                rules={[{ required: true, message: 'Por favor ingresa el nombre de la plantilla' }]}
              >
                <Input placeholder="Mi Plantilla Personalizada" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tipo_reporte"
                label="Tipo de Reporte"
                rules={[{ required: true, message: 'Por favor selecciona el tipo de reporte' }]}
              >
                <Select>
                  {reportTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="activo"
                label="Activa"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="es_predeterminado"
                label="Plantilla Predeterminada"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={4}>
            <PaletteOutlined className="mr-2" />
            Configuración de Diseño
          </Title>

          <Collapse defaultActiveKey={['header', 'body']}>
            {renderDesignSection('Encabezado', 'header')}
            {renderDesignSection('Cuerpo', 'body')}
            {renderDesignSection('Pie de Página', 'footer')}
            
            <Panel header="Colores del Sistema" key="colors">
              <Row gutter={16}>
                <Col span={8}>
                  {renderColorPicker('colors', 'primary', 'Color Primario')}
                </Col>
                <Col span={8}>
                  {renderColorPicker('colors', 'secondary', 'Color Secundario')}
                </Col>
                <Col span={8}>
                  {renderColorPicker('colors', 'success', 'Color de Éxito')}
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  {renderColorPicker('colors', 'warning', 'Color de Advertencia')}
                </Col>
                <Col span={8}>
                  {renderColorPicker('colors', 'error', 'Color de Error')}
                </Col>
                <Col span={8}>
                  {renderColorPicker('colors', 'info', 'Color de Información')}
                </Col>
              </Row>
            </Panel>

            <Panel header="Layout" key="layout">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Ancho Máximo">
                    <InputNumber
                      value={parseInt(designConfig.layout.maxWidth)}
                      onChange={(value) => updateDesignConfig('layout', 'maxWidth', `${value}px`)}
                      min={400}
                      max={800}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Padding">
                    <InputNumber
                      value={parseInt(designConfig.layout.padding)}
                      onChange={(value) => updateDesignConfig('layout', 'padding', `${value}px`)}
                      min={10}
                      max={50}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Border Radius">
                    <InputNumber
                      value={parseInt(designConfig.layout.borderRadius)}
                      onChange={(value) => updateDesignConfig('layout', 'borderRadius', `${value}px`)}
                      min={0}
                      max={20}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Sombra">
                    <Input
                      value={designConfig.layout.boxShadow}
                      onChange={(e) => updateDesignConfig('layout', 'boxShadow', e.target.value)}
                      placeholder="0 2px 8px rgba(0,0,0,0.1)"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>
          </Collapse>

          <Divider />

          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
            >
              {templateId ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => setPreviewVisible(true)}
            >
              Vista Previa
            </Button>
            <Button onClick={onCancel}>
              Cancelar
            </Button>
          </Space>
        </Form>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Vista Previa de la Plantilla"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div 
          dangerouslySetInnerHTML={{ 
            __html: generatePreview() 
          }} 
        />
      </Modal>
    </div>
  );
};

export default EmailTemplateEditor;
