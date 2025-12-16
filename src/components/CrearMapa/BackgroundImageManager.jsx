import React, { useState, useEffect } from 'react';
import {
  Button,
  Upload,
  message,
  Image,
  Space,
  Typography,
  Modal,
  List,
  Input,
  Tabs,
  Spin,
  Empty,
  Card
} from '../../utils/antdComponents';
import {
  UploadOutlined,
  DeleteOutlined,
  PictureOutlined,
  SearchOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Text, Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const BackgroundImageManager = ({
  onImageSelect,
  currentImage,
  onImageRemove,
  title = "Gestor de Im¡genes de Fondo",
  description = "Sube nuevas im¡genes o selecciona existentes del repositorio"
}) => {
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upload');

  useEffect(() => {
    if (modalVisible) {
      loadExistingImages();
    }
  }, [modalVisible]);

  const loadExistingImages = async () => {
    try {
      setLoadingImages(true);

      // Listar imágenes del bucket de productos en la carpeta mapas
      const { data, error } = await supabase.storage
        .from('productos')
        .list('mapas', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Filtrar solo archivos de imagen
      const imageFiles = data.filter(file =>
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      // Obtener URLs pºblicas para cada imagen
      const imagesWithUrls = imageFiles.map(file => ({
        name: file.name,
        path: `mapas/${file.name}`,
        size: file.metadata?.size || 0,
        created: file.created_at,
        url: supabase.storage
          .from('productos')
          .getPublicUrl(`mapas/${file.name}`).data.publicUrl
      }));

      setExistingImages(imagesWithUrls);
    } catch (error) {
      console.error('Error loading existing images:', error);
      message.error('Error al cargar im¡genes existentes');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {

        return false;
      }

      // Validar tama±o (10MB m¡ximo para mapas)
      if (file.size > 10 * 1024 * 1024) {
        message.error('La imagen debe pesar 10MB o menos');
        return false;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `mapas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      onImageSelect(publicUrl);
      message.success('Imagen subida correctamente');
      setModalVisible(false);
      return false; // Prevenir upload autom¡tico
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error al subir imagen');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (imageUrl) => {
    onImageSelect(imageUrl);
    setModalVisible(false);
    message.success('Imagen seleccionada como fondo');
  };

  const handleRemoveImage = () => {
    onImageRemove();
    message.success('Imagen de fondo removida');
  };

  const filteredImages = existingImages.filter(img =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Text strong>{title}</Text>
        <Text type="secondary" className="block text-sm">
          {description}
        </Text>
      </div>

      {currentImage ? (
        <div className="space-y-3">
          <div className="relative">
            <Image
              src={currentImage}
              alt="Imagen de fondo actual"
              className="rounded-lg border"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              size="small"
            />
          </div>
          <Text type="secondary" className="text-xs">
            Imagen actual del mapa
          </Text>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <PictureOutlined className="text-4xl text-gray-400 mb-2" />
          <Text type="secondary" className="block">
            No hay imagen de fondo seleccionada
          </Text>
        </div>
      )}

      <Space className="w-full">
        <Button
          icon={<UploadOutlined />}
          onClick={() => {
            setSelectedTab('upload');
            setModalVisible(true);
          }}
          className="flex-1"
        >
          Subir Nueva Imagen
        </Button>
        <Button
          icon={<FolderOpenOutlined />}
          onClick={() => {
            setSelectedTab('existing');
            setModalVisible(true);
          }}
          className="flex-1"
        >
          Seleccionar Existente
        </Button>
      </Space>

      <Modal
        title="Gestor de Im¡genes de Fondo"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Tabs activeKey={selectedTab} onChange={setSelectedTab}>
          <TabPane tab="Subir Nueva" key="upload">
            <div className="space-y-4">
              <Upload
                beforeUpload={handleImageUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading}
                  disabled={uploading}
                  className="w-full"
                  size="large"
                >
                  {uploading ? 'Subiendo...' : 'Seleccionar y Subir Imagen'}
                </Button>
              </Upload>

              <div className="text-xs text-gray-500 space-y-1">
                <div>-¢ Formatos soportados: JPG, PNG, GIF, WebP</div>
                <div>-¢ Tama±o m¡ximo: 10MB</div>
                <div>-¢ Resoluci³n recomendada: 1920x1080 o superior</div>
              </div>
            </div>
          </TabPane>

          <TabPane tab="Im¡genes Existentes" key="existing">
            <div className="space-y-4">
              <Search
                placeholder="Buscar im¡genes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
              />

              {loadingImages ? (
                <div className="text-center py-8">
                  <Spin size="large" />
                  <Text className="block mt-2">Cargando im¡genes...</Text>
                </div>
              ) : filteredImages.length === 0 ? (
                <Empty
                  description="No se encontraron im¡genes"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                  dataSource={filteredImages}
                  renderItem={(image) => (
                    <List.Item>
                      <Card
                        hoverable
                        size="small"
                        cover={
                          <Image
                            src={image.url}
                            alt={image.name}
                            className="cursor-pointer"
                            style={{ height: '120px', objectFit: 'cover' }}
                            onClick={() => handleImageSelect(image.url)}
                          />
                        }
                        actions={[
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleImageSelect(image.url)}
                          >
                            Seleccionar
                          </Button>
                        ]}
                      >
                        <Card.Meta
                          title={
                            <Text ellipsis className="text-sm">
                              {image.name}
                            </Text>
                          }
                          description={
                            <div className="text-xs text-gray-500">
                              <div>{formatFileSize(image.size)}</div>
                              <div>{formatDate(image.created)}</div>
                            </div>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default BackgroundImageManager;


