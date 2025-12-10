import React from 'react';
import { Form, Input, Button, Typography, Space, Card } from '../../../utils/antdComponents';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CrearMapaBasicConfig = ({ mapa, onUpdate, onNext }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    const updatedMapa = {
      ...mapa,
      nombre: values.nombre,
      descripcion: values.descripcion,
      metadata: {
        ...mapa.metadata,
        notes: values.notes || ''
      }
    };
    
    onUpdate(updatedMapa);
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

      <Card className="shadow-lg border-0">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            nombre: mapa.nombre || '',
            descripcion: mapa.descripcion || '',
            notes: mapa.metadata?.notes || ''
          }}
          className="space-y-6"
        >
          <Form.Item
            label="Nombre del Mapa"
            name="nombre"
            rules={[
              { required: true, message: 'Por favor ingresa el nombre del mapa' },
              { min: 3, message: 'El nombre debe tener al menos 3 caracteres' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="Ej: Mapa Principal - Sala A"
              className="text-lg"
            />
          </Form.Item>

          <Form.Item
            label="Descripci³n"
            name="descripcion"
            rules={[
              { required: true, message: 'Por favor ingresa una descripci³n' },
              { min: 10, message: 'La descripci³n debe tener al menos 10 caracteres' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Describe el prop³sito y caracter­sticas del mapa..."
              className="text-base"
            />
          </Form.Item>

          <Form.Item
            label="Notas Adicionales"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Informaci³n adicional, instrucciones especiales, etc..."
              className="text-base"
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
      </Card>
    </div>
  );
};

export default CrearMapaBasicConfig;


