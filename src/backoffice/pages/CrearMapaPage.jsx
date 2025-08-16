import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import CrearMapaEditor from '../components/CrearMapa/CrearMapaEditor';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const { Title, Text } = Typography;

const CrearMapaPage = () => {
  const { salaId } = useParams();
  const navigate = useNavigate();
  const { addTenantToInsert } = useTenantFilter();
  
  const [sala, setSala] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar información de la sala
  useEffect(() => {
    if (salaId) {
      loadSalaInfo();
      // Test database access
      testDatabaseAccess();
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

  const testDatabaseAccess = async () => {
    try {
      console.log('[DEBUG] Testing database access...');
      
      // Test 1: Check if we can access the mapas table
      const { data: mapasTest, error: mapasError } = await supabase
        .from('mapas')
        .select('*')
        .limit(1);
      
      console.log('[DEBUG] Mapas table access test:', { data: mapasTest, error: mapasError });
      
      // Test 2: Check the table structure
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'mapas' })
        .catch(() => ({ data: null, error: 'RPC not available' }));
      
      console.log('[DEBUG] Table structure test:', { data: tableInfo, error: tableError });
      
      // Test 3: Check tenant context
      const tenantData = addTenantToInsert({});
      console.log('[DEBUG] Tenant data from hook:', tenantData);
      
      // Test 4: Check if we can access the tenants table
      const { data: tenantsTest, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, company_name')
        .limit(1);
      
      console.log('[DEBUG] Tenants table access test:', { data: tenantsTest, error: tenantsError });
      
    } catch (error) {
      console.error('[DEBUG] Database access test failed:', error);
    }
  };

  const handleSave = async (mapaData) => {
    try {
      setSaving(true);
      
      // Debug: Check authentication and tenant
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[DEBUG] Current user:', user);
      console.log('[DEBUG] Auth error:', authError);
      
      if (authError || !user) {
        throw new Error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
      }
      
      console.log('[DEBUG] Current tenant from hook:', addTenantToInsert({}));
      
      // Prepare base data
      const baseData = {
        nombre: mapaData.nombre || 'Mapa de Sala',
        descripcion: mapaData.descripcion || '',
        contenido: mapaData.contenido || [],
        estado: mapaData.estado || 'activo'
      };
      
      // Ensure required fields are present
      if (!baseData.nombre) {
        throw new Error('El nombre del mapa es obligatorio');
      }
      
      if (!Array.isArray(baseData.contenido)) {
        throw new Error('El contenido del mapa debe ser un array');
      }
      
      if (mapa?.id) {
        // Actualizar mapa existente
        const updateData = addTenantToInsert({
          ...baseData,
          updated_at: new Date().toISOString()
        });
        
        console.log('[DEBUG] Update data with tenant:', updateData);
        
        const { error } = await supabase
          .from('mapas')
          .update(updateData)
          .eq('id', mapa.id);

        if (error) {
          console.error('[DEBUG] Update error details:', error);
          throw error;
        }
        message.success('Mapa actualizado exitosamente');
      } else {
        // Crear nuevo mapa
        const insertData = addTenantToInsert({
          ...baseData,
          sala_id: salaId
        });
        
        console.log('[DEBUG] Insert data with tenant:', insertData);
        
        // If no tenant_id is available, try without it (fallback)
        if (!insertData.tenant_id) {
          console.warn('[DEBUG] No tenant_id available, trying without it');
          const fallbackData = { ...insertData };
          delete fallbackData.tenant_id;
          
          const { data, error } = await supabase
            .from('mapas')
            .insert(fallbackData)
            .select()
            .single();

          if (error) {
            console.error('[DEBUG] Fallback insert error:', error);
            throw new Error(`Error al crear mapa: ${error.message}. Si el problema persiste, contacte al administrador.`);
          }
          
          setMapa(data);
          message.success('Mapa creado exitosamente (sin tenant asignado)');
        } else {
          const { data, error } = await supabase
            .from('mapas')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('[DEBUG] Insert error details:', error);
            throw error;
          }
          
          setMapa(data);
          message.success('Mapa creado exitosamente');
        }
      }

      // Redirigir a la página de plano
      navigate('/dashboard/plano');
      
    } catch (error) {
      console.error('Error saving mapa:', error);
      message.error('Error al guardar el mapa: ' + error.message);
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
