import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Switch, Space, Typography, Divider, message } from '../../../../utils/antdComponents';
import { PlusOutlined, DeleteOutlined, DragOutlined, EyeOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableItem } from './SortableItem';
import { supabase } from '../../../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', icon: 'ðŸ“' },
  { value: 'email', label: 'Email', icon: 'ðŸ“§' },
  { value: 'phone', label: 'Tel©fono', icon: 'ðŸ“ž' },
  { value: 'select', label: 'Selector', icon: 'ðŸ“‹' },
  { value: 'textarea', label: 'rea de texto', icon: 'ðŸ“„' },
  { value: 'checkbox', label: 'Casilla', icon: '˜‘ï¸' },
  { value: 'radio', label: 'Bot³n radio', icon: 'ðŸ”˜' },
  { value: 'date', label: 'Fecha', icon: 'ðŸ“…' },
  { value: 'number', label: 'Nºmero', icon: 'ðŸ”¢' }
];

const CustomFormBuilder = ({ eventId, onSave, initialForm = null }) => {
  const [formConfig, setFormConfig] = useState({
    id: null,
    eventId: eventId,
    name: 'Formulario de Compra',
    description: 'Recopila informaci³n de tus clientes',
    fields: [],
    settings: {
      columns: 1,
      showProgress: true,
      requiredFields: true,
      collectEmail: true,
      collectPhone: true
    }
  });

  const [activeField, setActiveField] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (initialForm) {
      setFormConfig(initialForm);
    }
  }, [initialForm]);

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: type,
      label: `Campo ${formConfig.fields.length + 1}`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' ? ['Opci³n 1', 'Opci³n 2'] : [],
      validation: {
        minLength: null,
        maxLength: null,
        pattern: null
      },
      settings: {
        showLabel: true,
        showPlaceholder: true,
        defaultValue: ''
      }
    };

    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setActiveField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    setActiveField(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFormConfig(prev => ({
        ...prev,
        fields: arrayMove(prev.fields,
          prev.fields.findIndex(field => field.id === active.id),
          prev.fields.findIndex(field => field.id === over.id)
        )
      }));
    }
  };


  const renderFieldEditor = (field) => {
    if (!field) return null;

    return (
      <Card title={`Editar: ${field.label}`} size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            label="Etiqueta"
            placeholder="Etiqueta del campo"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
          />

          <Input
            label="Placeholder"
            placeholder="Texto de ayuda"
            value={field.placeholder}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
          />

          <Switch
            checked={field.required}
            onChange={(checked) => updateField(field.id, { required: checked })}
            checkedChildren="Requerido"
            unCheckedChildren="Opcional"
          />

          {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <Text strong>Opciones:</Text>
              {field.options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...field.options];
                    newOptions[index] = e.target.value;
                    updateField(field.id, { options: newOptions });
                  }}
                  style={{ marginBottom: 8 }}
                />
              ))}
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const newOptions = [...field.options, `Opci³n ${field.options.length + 1}`];
                  updateField(field.id, { options: newOptions });
                }}
              >
                Agregar opci³n
              </Button>
            </div>
          )}
        </Space>
      </Card>
    );
  };

  const renderFieldPreview = (field) => {
    const commonProps = {
      placeholder: field.placeholder,
      disabled: true,
      style: { width: '100%' }
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />;
      case 'email':
        return <Input {...commonProps} type="email" />;
      case 'phone':
        return <Input {...commonProps} type="tel" />;
      case 'select':
        return (
          <Select {...commonProps}>
            {field.options.map((option, index) => (
              <Option key={index} value={option}>{option}</Option>
            ))}
          </Select>
        );
      case 'textarea':
        return <Input.TextArea {...commonProps} rows={3} />;
      case 'checkbox':
        return <Switch disabled />;
      case 'radio':
        return (
          <div>
            {field.options.map((option, index) => (
              <div key={index}>
                <input type="radio" disabled /> {option}
              </div>
            ))}
          </div>
        );
      case 'date':
        return <Input {...commonProps} type="date" />;
      case 'number':
        return <Input {...commonProps} type="number" />;
      default:
        return <Input {...commonProps} />;
    }
  };

  const handleSave = async () => {
    try {
      // Validar formulario
      if (formConfig.fields.length === 0) {
        message.warning('Agrega al menos un campo al formulario');
        return;
      }

      // Guardar en base de datos
      const { data, error } = await supabase
        .from('custom_forms')
        .upsert({
          id: formConfig.id,
          event_id: eventId,
          name: formConfig.name,
          description: formConfig.description,
          fields: formConfig.fields,
          settings: formConfig.settings,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      message.success('Formulario guardado correctamente');
      onSave && onSave(data);
    } catch (error) {
      console.error('Error saving form:', error);
      message.error('Error al guardar el formulario');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={3}>Constructor de Formularios</Title>
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Editar' : 'Vista previa'}
          </Button>
          <Button type="primary" onClick={handleSave}>
            Guardar Formulario
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel de campos */}
        <div className="lg:col-span-1">
          <Card title="Campos disponibles" size="small">
            <div className="space-y-2">
              {FIELD_TYPES.map(type => (
                <Button
                  key={type.value}
                  block
                  onClick={() => addField(type.value)}
                  icon={<span>{type.icon}</span>}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Editor de campo activo */}
          {activeField && renderFieldEditor(
            formConfig.fields.find(f => f.id === activeField)
          )}
        </div>

        {/* rea de construcci³n */}
        <div className="lg:col-span-2">
          <Card title="Formulario" size="small">
            <div className="space-y-4">
              <Input
                placeholder="Nombre del formulario"
                value={formConfig.name}
                onChange={(e) => setFormConfig(prev => ({ ...prev, name: e.target.value }))}
              />

              <Input.TextArea
                placeholder="Descripci³n del formulario"
                value={formConfig.description}
                onChange={(e) => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />

              <Divider />

              {previewMode ? (
                // Vista previa
                <div className="space-y-4">
                  {formConfig.fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Text strong>{field.label}</Text>
                      {renderFieldPreview(field)}
                    </div>
                  ))}
                </div>
              ) : (
                // Modo edici³n
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={formConfig.fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {formConfig.fields.map(field => (
                        <SortableItem key={field.id} id={field.id}>
                          <Card
                            size="small"
                            className={`cursor-pointer ${activeField === field.id ? 'border-blue-500' : ''}`}
                            onClick={() => setActiveField(field.id)}
                            extra={
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeField(field.id);
                                }}
                              />
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <DragOutlined className="text-gray-400" />
                              <span>{FIELD_TYPES.find(t => t.value === field.type)?.icon}</span>
                              <Text>{field.label}</Text>
                              {field.required && <Text type="danger">*</Text>}
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomFormBuilder;


