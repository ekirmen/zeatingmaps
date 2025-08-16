import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import CrearMapaEditor from '../components/CrearMapa/CrearMapaEditor';

const { Title, Text } = Typography;

const CrearMapaPage = () => {
  const { salaId } = useParams();
  const navigate = useNavigate();
  
  const [sala, setSala] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar información de la sala
  useEffect(() => {
    if (salaId) {
      loadSalaInfo();
    } else {
      setLoading(false);
    }
  }, [salaId]);

  const loadSalaInfo = async () => {
    try {
      setLoading(true);
      
      // Obtener información de la sala
      const { data: salaData, error: salaError } = await supabase
        .from('salas')
        .select(`
          *,
          recintos (
            id,
            nombre,
            direccion
          )
        `)
        .eq('id', salaId)
        .single();

      if (salaError) throw salaError;
      
      setSala(salaData);

      // Buscar si ya existe un mapa para esta sala
      const { data: mapaData, error: mapaError } = await supabase
        .from('mapas')
        .select('*')
        .eq('sala_id', salaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (mapaData && !mapaError) {
        setMapa(mapaData);
      }

    } catch (error) {
      console.error('Error loading sala info:', error);
      message.error('Error al cargar información de la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (mapaData) => {
    try {
      setSaving(true);
      
      if (mapa?.id) {
        // Actualizar mapa existente
        const { error } = await supabase
          .from('mapas')
          .update({
            nombre: mapaData.nombre,
            descripcion: mapaData.descripcion,
            contenido: mapaData.contenido,
            estado: mapaData.estado,
            updated_at: new Date().toISOString()
          })
          .eq('id', mapa.id);

        if (error) throw error;
        message.success('Mapa actualizado exitosamente');
      } else {
        // Crear nuevo mapa
        const { data, error } = await supabase
          .from('mapas')
          .insert({
            nombre: mapaData.nombre,
            descripcion: mapaData.descripcion,
            sala_id: salaId,
            contenido: mapaData.contenido,
            estado: mapaData.estado
          })
          .select()
          .single();

        if (error) throw error;
        
        setMapa(data);
        message.success('Mapa creado exitosamente');
      }

      // Redirigir a la página de plano
      navigate('/dashboard/plano');
      
    } catch (error) {
      console.error('Error saving mapa:', error);
      message.error('Error al guardar el mapa');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/plano');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!salaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty 
          description="No se ha seleccionado una sala"
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard/plano')}>
              Volver a Plano
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleCancel}
              type="text"
              size="large"
            >
              Volver
            </Button>
            <div>
              <Title level={3} className="mb-1">
                {mapa ? 'Editar Mapa' : 'Crear Nuevo Mapa'}
              </Title>
              {sala && (
                <Text type="secondary">
                  Sala: {sala.nombre} - Recinto: {sala.recintos?.nombre}
                </Text>
              )}
            </div>
          </div>
          
          <Space>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => {
                // TODO: Implementar vista previa
                message.info('Vista previa próximamente');
              }}
            >
              Vista Previa
            </Button>
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => {
                // El guardado se maneja desde el editor
                message.info('Usa el botón Guardar del editor');
              }}
            >
              Guardar
            </Button>
          </Space>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <CrearMapaEditor
          salaId={salaId}
          onSave={handleSave}
          onCancel={handleCancel}
          initialMapa={mapa}
          isEditMode={!!mapa}
        />
      </div>
    </div>
  );
};

export default CrearMapaPage;
