import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Upload, 
  Image, 
  Card, 
  Row, 
  Col, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  message,
  Space,
  Typography,
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import resolveImageUrl, { resolveEventImageWithTenant } from '../../utils/resolveImageUrl';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const EventForm = ({ 
  eventData = null, 
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const { currentTenant } = useTenant();
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState({});
  const [imageUrls, setImageUrls] = useState({});

  // Inicializar formulario con datos del evento
  useEffect(() => {
    if (eventData) {
      form.setFieldsValue({
        nombre: eventData.nombre,
        descripcion: eventData.descripcion,
        fecha_evento: eventData.fecha_evento ? new Date(eventData.fecha_evento) : null,
        ubicacion: eventData.ubicacion,
        precio: eventData.precio,
        activo: eventData.activo ?? true,
        recinto_id: eventData.recinto_id,
        sala_id: eventData.sala_id
      });

      // Cargar imágenes existentes
      if (eventData.imagenes) {
        try {
          const images = typeof eventData.imagenes === 'string' 
            ? JSON.parse(eventData.imagenes) 
            : eventData.imagenes;
          
          setImageUrls(images);
          
          // Generar previews para imágenes existentes
          const previews = {};
          Object.keys(images).forEach(key => {
            if (images[key]?.url) {
              const url = resolveEventImageWithTenant(eventData, key, currentTenant?.id);
              if (url) {
                previews[key] = url;
              }
            }
          });
          setPreviewImages(previews);
        } catch (error) {
          console.error('Error parsing event images:', error);
        }
      }
    }
  }, [eventData, form, currentTenant]);

  // Función para subir imagen al bucket del tenant
  const uploadImageToTenantBucket = async (file, imageType) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant ID available');
    }

    const bucketName = `tenant-${currentTenant.id}`;
    const eventId = eventData?.id || 'temp';
    const fileName = `${imageType}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${eventId}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        url: filePath,
        publicUrl: publicUrl,
        bucket: bucketName,
        fileName: fileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Manejar subida de imágenes
  const handleImageUpload = async (file, imageType) => {
    setUploading(true);
    try {
      const imageData = await uploadImageToTenantBucket(file, imageType);
      
      // Actualizar estado de imágenes
      setImageUrls(prev => ({
        ...prev,
        [imageType]: imageData
      }));

      // Actualizar preview
      setPreviewImages(prev => ({
        ...prev,
        [imageType]: imageData.publicUrl
      }));

      message.success(`${imageType} subida exitosamente`);
      return false; // Prevenir subida automática
    } catch (error) {
      message.error(`Error subiendo ${imageType}: ${error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Eliminar imagen
  const handleImageRemove = async (imageType) => {
    try {
      const imageData = imageUrls[imageType];
      if (imageData?.bucket && imageData?.url) {
        const { error } = await supabase.storage
          .from(imageData.bucket)
          .remove([imageData.url]);

        if (error) throw error;
      }

      // Actualizar estado
      setImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[imageType];
        return newUrls;
      });

      setPreviewImages(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[imageType];
        return newPreviews;
      });

      message.success(`${imageType} eliminada exitosamente`);
    } catch (error) {
      message.error(`Error eliminando ${imageType}: ${error.message}`);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (values) => {
    try {
      const eventData = {
        ...values,
        imagenes: imageUrls,
        tenant_id: currentTenant?.id,
        fecha_evento: values.fecha_evento?.toISOString()
      };

      await onSave(eventData);
    } catch (error) {
      console.error('Error saving event:', error);
      message.error('Error al guardar el evento');
    }
  };

  // Componente para subir imagen
  const ImageUploader = ({ imageType, label, required = false }) => (
    <Form.Item label={label}>
      <div style={{ marginBottom: 16 }}>
        {previewImages[imageType] && (
          <div style={{ marginBottom: 8 }}>
            <Image
              src={previewImages[imageType]}
              alt={`${imageType} preview`}
              style={{ maxWidth: 200, maxHeight: 150, objectFit: 'cover' }}
              preview={{
                mask: (
                  <Space>
                    <EyeOutlined />
                    <Text>Ver imagen</Text>
                  </Space>
                )
              }}
            />
          </div>
        )}
        
        <Space>
          <Upload
            beforeUpload={(file) => handleImageUpload(file, imageType)}
            showUploadList={false}
            accept="image/*"
            disabled={uploading}
          >
            <Button 
              icon={<UploadOutlined />} 
              loading={uploading}
              disabled={uploading}
            >
              Subir {label}
            </Button>
          </Upload>
          
          {previewImages[imageType] && (
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleImageRemove(imageType)}
            >
              Eliminar
            </Button>
          )}
        </Space>
      </div>
    </Form.Item>
  );

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          activo: true,
          precio: 0
        }}
      >
        <Title level={4}>
          {eventData ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nombre"
              label="Nombre del Evento"
              rules={[{ required: true, message: 'Por favor ingresa el nombre del evento' }]}
            >
              <Input placeholder="Ej: Concierto de Rock" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="fecha_evento"
              label="Fecha del Evento"
              rules={[{ required: true, message: 'Por favor selecciona la fecha' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                showTime
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="descripcion"
          label="Descripción"
          rules={[{ required: true, message: 'Por favor ingresa la descripción' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Describe el evento..."
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ubicacion"
              label="Ubicación"
              rules={[{ required: true, message: 'Por favor ingresa la ubicación' }]}
            >
              <Input placeholder="Ej: Estadio Nacional" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="precio"
              label="Precio Base"
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="recinto_id"
              label="Recinto"
            >
              <Select placeholder="Selecciona un recinto">
                {/* Aquí se cargarían los recintos disponibles */}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="sala_id"
              label="Sala"
            >
              <Select placeholder="Selecciona una sala">
                {/* Aquí se cargarían las salas disponibles */}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="activo"
          label="Evento Activo"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider>Imágenes del Evento</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <ImageUploader 
              imageType="banner" 
              label="Banner Principal" 
              required 
            />
          </Col>
          <Col span={8}>
            <ImageUploader 
              imageType="portada" 
              label="Imagen de Portada" 
            />
          </Col>
          <Col span={8}>
            <ImageUploader 
              imageType="obraImagen" 
              label="Imagen de Obra" 
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <ImageUploader 
              imageType="logoHorizontal" 
              label="Logo Horizontal" 
            />
          </Col>
          <Col span={8}>
            <ImageUploader 
              imageType="logoVertical" 
              label="Logo Vertical" 
            />
          </Col>
          <Col span={8}>
            <ImageUploader 
              imageType="bannerPublicidad" 
              label="Banner Publicidad" 
            />
          </Col>
        </Row>

        <Divider />

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={loading}
            >
              {eventData ? 'Actualizar Evento' : 'Crear Evento'}
            </Button>
            <Button onClick={onCancel}>
              Cancelar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EventForm;
