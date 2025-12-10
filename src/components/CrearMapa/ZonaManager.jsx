import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  ColorPicker, 
  Switch, 
  Space, 
  Tag, 
  List, 
  Popconfirm,
  message,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  Badge
} from '../../utils/antdComponents';
import { createZona, updateZona, deleteZona } from '../../backoffice/services/apibackoffice';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ZonaManager = ({ 
  zonas = [], 
  onZonasChange, 
  selectedElements = [], 
  onAssignZone,
  salaId
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingZona, setEditingZona] = useState(null);
  const [form] = Form.useForm();

  // ===== ESTADOS =====
  const [zonasList, setZonasList] = useState(zonas);

  // ===== EFECTOS =====
  useEffect(() => {
    setZonasList(zonas);
  }, [zonas]);

  // ===== FUNCIONES =====
  const showModal = (zona = null) => {
    setEditingZona(zona);
    if (zona) {
      form.setFieldsValue({
        nombre: zona.nombre,
        aforo: zona.aforo,
        color: zona.color || '#1890ff',
        numerada: zona.numerada || false,
        descripcion: zona.descripcion || ''
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingZona(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      let nuevaZona;
      
      if (editingZona) {
        // Editar zona existente
        const zonaActualizada = await updateZona(editingZona.id, {
          ...values,
          updated_at: new Date().toISOString()
        });
        
        const zonasActualizadas = zonasList.map(z => 
          z.id === editingZona.id ? zonaActualizada : z
        );
        setZonasList(zonasActualizadas);
        message.success('Zona actualizada exitosamente');
        
        if (onZonasChange) {
          onZonasChange(zonasActualizadas);
        }
      } else {
        // Crear nueva zona
        const zonaCreada = await createZona({
          ...values,
          sala_id: salaId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        setZonasList([...zonasList, zonaCreada]);
        message.success('Zona creada exitosamente');
        
        if (onZonasChange) {
          onZonasChange([...zonasList, zonaCreada]);
        }
      }
      
      handleCancel();
    } catch (error) {
      message.error('Error al guardar la zona');
      console.error('Error saving zona:', error);
    }
  };

  const handleDeleteZona = async (zonaId) => {
    try {
      await deleteZona(zonaId);
      
      const zonasActualizadas = zonasList.filter(z => z.id !== zonaId);
      setZonasList(zonasActualizadas);
      
      if (onZonasChange) {
        onZonasChange(zonasActualizadas);
      }
      
      message.success('Zona eliminada exitosamente');
    } catch (error) {
      message.error('Error al eliminar la zona');
      console.error('Error deleting zona:', error);
    }
  };

  const handleAssignZone = (zonaId) => {
    if (selectedElements.length === 0) {
      message.warning('Selecciona elementos para asignar la zona');
      return;
    }
    
    if (onAssignZone) {
      onAssignZone(zonaId, selectedElements);
      message.success(`Zona asignada a ${selectedElements.length} elementos`);
    }
  };

  // ===== RENDERIZADO =====
  return (
    <>
      {/* ===== BOT“N PARA ABRIR MODAL ===== */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal()}
        className="mb-4"
      >
        Gestionar Zonas
      </Button>

      {/* ===== LISTA DE ZONAS ===== */}
      <div className="mb-4">
        <Title level={5}>Zonas Disponibles</Title>
        <List
          dataSource={zonasList}
          renderItem={(zona) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => showModal(zona)}
                  title="Editar zona"
                />,
                <Popconfirm
                  key="delete"
                  title="¿Eliminar esta zona?"
                  description="Esta acci³n no se puede deshacer"
                  onConfirm={() => handleDeleteZona(zona.id)}
                  okText="S­"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    title="Eliminar zona"
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: zona.color || '#1890ff',
                      borderRadius: '50%',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                }
                title={
                  <Space>
                    <Text strong>{zona.nombre}</Text>
                    {zona.numerada && (
                      <Badge count="N" style={{ backgroundColor: '#52c41a' }} />
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary">
                      Aforo: {zona.aforo || 'Sin l­mite'}
                    </Text>
                    {zona.descripcion && (
                      <Text type="secondary">{zona.descripcion}</Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {/* ===== ASIGNACI“N DE ZONAS ===== */}
      {selectedElements.length > 0 && (
        <Card size="small" className="mb-4">
          <Title level={6}>Asignar Zona a Elementos Seleccionados</Title>
          <Text type="secondary" className="mb-3 block">
            {selectedElements.length} elementos seleccionados
          </Text>
          <Space wrap>
            {zonasList.map(zona => (
              <Button
                key={zona.id}
                size="small"
                onClick={() => handleAssignZone(zona.id)}
                style={{
                  backgroundColor: zona.color,
                  borderColor: zona.color,
                  color: 'white'
                }}
              >
                {zona.nombre}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* ===== MODAL DE CREACI“N/EDICI“N ===== */}
      <Modal
        title={editingZona ? 'Editar Zona' : 'Crear Nueva Zona'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            color: '#1890ff',
            numerada: false
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="nombre"
                label="Nombre de la Zona"
                rules={[
                  { required: true, message: 'El nombre es obligatorio' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                ]}
              >
                <Input placeholder="Ej: Platea, Palco, VIP" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="aforo"
                label="Aforo M¡ximo"
              >
                <Input 
                  type="number" 
                  min={1}
                  placeholder="Sin l­mite"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="color"
                label="Color de la Zona"
              >
                <ColorPicker 
                  showText
                  presets={[
                    {
                      label: 'Colores Recomendados',
                      colors: [
                        '#1890ff', '#52c41a', '#faad14', '#f5222d',
                        '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
                      ]
                    }
                  ]}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="numerada"
                label="Asientos Numerados"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="descripcion"
            label="Descripci³n"
          >
            <TextArea 
              rows={3}
              placeholder="Descripci³n opcional de la zona..."
            />
          </Form.Item>

          <div className="text-right">
            <Space>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingZona ? 'Actualizar' : 'Crear'} Zona
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ZonaManager;


