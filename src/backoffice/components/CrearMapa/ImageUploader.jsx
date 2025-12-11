import React, { useState } from 'react';
import { Button, Upload, message, Image, Space, Typography } from '../../../utils/antdComponents';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../../supabaseClient';

const { Text } = Typography;

const ImageUploader = ({ 
  onImageUpload, 
  currentImage, 
  onImageRemove,
  title = "Imagen de Fondo",
  description = "Sube una imagen para usar como fondo del mapa"
}) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {

        return;
      }
      
      // Validar tama±o (10MB m¡ximo para mapas)
      if (file.size > 10 * 1024 * 1024) {
        message.error('La imagen debe pesar 10MB o menos');
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `mapas/${Date.now()}.${fileExt}`;
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

      onImageUpload(publicUrl);
      message.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageRemove();
    message.success('Imagen removida');
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
              alt="Imagen de fondo"
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
        <Upload
          beforeUpload={(file) => {
            handleImageUpload(file);
            return false;
          }}
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
            {uploading ? 'Subiendo...' : 'Subir Imagen de Fondo'}
          </Button>
        </Upload>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <div>-¢ Formatos soportados: JPG, PNG, GIF, WebP</div>
        <div>-¢ Tama±o m¡ximo: 10MB</div>
        <div>-¢ Resoluci³n recomendada: 1920x1080 o superior</div>
      </div>
    </div>
  );
};

export default ImageUploader;


