import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Upload, 
  message, 
  Modal, 
  Image, 
  Space, 
  Popconfirm,
  Tag,
  Row,
  Col,
  Typography,
  Divider
} from '../../utils/antdComponents';
import { 
  AiOutlinePlus as PlusOutlined,
  AiOutlineEdit as EditOutlined,
  AiOutlineDelete as DeleteOutlined,
  AiOutlineEye as EyeOutlined,
  AiOutlineUpload as UploadOutlined,
  AiOutlineLink as LinkOutlined
} from 'react-icons/ai';
import { ImageService } from '../services/imageService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const ImageManager = ({ 
  entityId, 
  entityType = 'event', 
  onImagesChange,
  title = 'Gestor de Imágenes'
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    url: '',
    alt_text: '',
    tipo: 'galeria',
    orden: 0
  });

  const imageTypes = entityType === 'event' 
    ? [
        { value: 'principal', label: 'Principal', color: 'blue' },
        { value: 'galeria', label: 'Galería', color: 'green' },
        { value: 'banner', label: 'Banner', color: 'purple' }
      ]
    : [
        { value: 'principal', label: 'Principal', color: 'blue' },
        { value: 'galeria', label: 'Galería', color: 'green' },
        { value: 'exterior', label: 'Exterior', color: 'orange' },
        { value: 'interior', label: 'Interior', color: 'cyan' }
      ];

  useEffect(() => {
    if (entityId) {
      loadImages();
    }
  }, [entityId, entityType]);


    if (!entityId) return;
    
    setLoading(true);
    try {
      const imageData = entityType === 'event' 
        ? await ImageService.getEventImages(entityId)
        : await ImageService.getVenueImages(entityId);
      
      setImages(imageData);
      if (onImagesChange) {
        onImagesChange(imageData);
      }
    } catch (error) {
      message.error('Error cargando imágenes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    setEditingImage(null);
    setFormData({
      url: '',
      alt_text: '',
      tipo: 'galeria',
      orden: images.length + 1
    });
    setModalVisible(true);
  };

  const handleEditImage = (image) => {
    setEditingImage(image);
    setFormData({
      url: image.url,
      alt_text: image.alt_text || '',
      tipo: image.tipo,
      orden: image.orden
    });
    setModalVisible(true);
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const tableName = entityType === 'event' ? 'evento_imagenes' : 'recinto_imagenes';
      await ImageService.deleteImage(imageId, tableName);
      message.success('Imagen eliminada');
      loadImages();
    } catch (error) {
      message.error('Error eliminando imagen');
    }
  };

  const handleSaveImage = async () => {
    if (!formData.url.trim()) {
      message.error('La URL de la imagen es requerida');
      return;
    }

    if (!ImageService.isValidImageUrl(formData.url)) {
      message.error('URL de imagen no válida');
      return;
    }

    try {
      const tableName = entityType === 'event' ? 'evento_imagenes' : 'recinto_imagenes';
      
      if (editingImage) {
        await ImageService.updateImage(editingImage.id, formData, tableName);
        message.success('Imagen actualizada');
      } else {
        if (entityType === 'event') {
          await ImageService.addEventImage(entityId, formData);
        } else {
          await ImageService.addVenueImage(entityId, formData);
        }
        message.success('Imagen agregada');
      }
      
      setModalVisible(false);
      loadImages();
    } catch (error) {
      message.error('Error guardando imagen');
      console.error(error);
    }
  };

  
      await ImageService.reorderImages(newOrder, tableName);
      message.success('Orden actualizado');
      loadImages();
    } catch (error) {
      message.error('Error actualizando orden');
    }
  };

  const getTypeColor = (type) => {
    const typeConfig = imageTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'default';
  };

  const getTypeLabel = (type) => {
    const typeConfig = imageTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
  };

  return (
    <Card 
      title={title}
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddImage}
        >
          Agregar Imagen
        </Button>
      }
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {images.map((image, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={image.id}>
            <Card
              size="small"
              cover={
                <div style={{ height: 200, overflow: 'hidden' }}>
                  <Image
                    src={image.url}
                    alt={image.alt_text || 'Imagen'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={ImageService.getDefaultImageUrl(entityType)}
                    preview={{
                      mask: <EyeOutlined />,
                      maskClassName: 'custom-mask'
                    }}
                  />
                </div>
              }
              actions={[
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  onClick={() => handleEditImage(image)}
                  title="Editar"
                />,
                <Popconfirm
                  title="¿Eliminar esta imagen?"
                  description="Esta acción no se puede deshacer"
                  onConfirm={() => handleDeleteImage(image.id)}
                  okText="Sí"
                  cancelText="No"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    title="Eliminar"
                  />
                </Popconfirm>
              ]}
            >
              <div style={{ padding: '8px 0' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Tag color={getTypeColor(image.tipo)}>
                    {getTypeLabel(image.tipo)}
                  </Tag>
                  <Text strong>Orden: {image.orden}</Text>
                  {image.alt_text && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {image.alt_text}
                    </Text>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
        
        {images.length === 0 && (
          <Col span={24}>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Text type="secondary">No hay imágenes configuradas</Text>
              <br />
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={handleAddImage}
                style={{ marginTop: 16 }}
              >
                Agregar primera imagen
              </Button>
            </div>
          </Col>
        )}
      </Row>

      {/* Modal para agregar/editar imagen */}
      <Modal
        title={editingImage ? 'Editar Imagen' : 'Agregar Imagen'}
        open={modalVisible}
        onOk={handleSaveImage}
        onCancel={() => setModalVisible(false)}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>URL de la imagen *</Text>
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              prefix={<LinkOutlined />}
              suffix={
                formData.url && (
                  <Image
                    src={formData.url}
                    width={60}
                    height={40}
                    style={{ objectFit: 'cover' }}
                    fallback={ImageService.getDefaultImageUrl(entityType)}
                  />
                )
              }
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Ingresa la URL completa de la imagen (JPG, PNG, GIF, WebP)
            </Text>
          </div>

          <div>
            <Text strong>Texto alternativo</Text>
            <TextArea
              placeholder="Descripción de la imagen para accesibilidad"
              value={formData.alt_text}
              onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
              rows={3}
            />
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Tipo de imagen</Text>
              <Select
                value={formData.tipo}
                onChange={(value) => setFormData({ ...formData, tipo: value })}
                style={{ width: '100%', marginTop: 8 }}
              >
                {imageTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Tag color={type.color}>{type.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>Orden</Text>
              <Input
                type="number"
                min={1}
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
                style={{ marginTop: 8 }}
              />
            </Col>
          </Row>

          {formData.url && (
            <div style={{ textAlign: 'center' }}>
              <Text strong>Vista previa:</Text>
              <br />
              <Image
                src={formData.url}
                width={200}
                height={150}
                style={{ objectFit: 'cover', marginTop: 8 }}
                fallback={ImageService.getDefaultImageUrl(entityType)}
              />
            </div>
          )}
        </Space>
      </Modal>
    </Card>
  );
};

export default ImageManager;