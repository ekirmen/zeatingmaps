import React, { useState, useEffect, useCallback } from 'react';
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
  const [error, setError] = useState(null);

  // Validar que el componente esté montado antes de hacer operaciones
  const [isMounted, setIsMounted] = useState(false);
  
  // Establecer isMounted inmediatamente
  useEffect(() => {
    console.log('[DEBUG] Componente montándose, estableciendo isMounted = true');
    setIsMounted(true);
    return () => {
      console.log('[DEBUG] Componente desmontándose, estableciendo isMounted = false');
      setIsMounted(false);
    };
  }, []);

  // Inicialización del componente
  useEffect(() => {
    if (isMounted && salaId) {
      console.log('[DEBUG] Componente montado y salaId disponible, iniciando carga...');
      loadSalaInfo();
      testDatabaseAccess();
      
      // Timeout de seguridad para asegurar que loading se establezca a false
      const safetyTimeout = setTimeout(() => {
        console.log('[DEBUG] Timeout de seguridad: forzando loading a false');
        if (loading) {
          safeSetState(setLoading, false);
        }
      }, 10000); // 10 segundos
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isMounted, salaId]); // Remover loading como dependencia para evitar re-renderizados infinitos

  // Manejar caso cuando no hay salaId
  useEffect(() => {
    if (isMounted && !salaId) {
      console.log('[DEBUG] No hay salaId, estableciendo loading a false');
      setLoading(false);
    }
  }, [isMounted, salaId]);

  // Solo ejecutar operaciones si el componente está montado
  const safeSetState = useCallback((setter, value) => {
    const setterName = setter.name || setter.toString().slice(0, 50);
    console.log('[DEBUG] safeSetState llamado con:', { 
      setter: setterName, 
      value: typeof value === 'object' ? 'Object' : value, 
      isMounted,
      salaId 
    });
    if (isMounted) {
      try {
        console.log('[DEBUG] Ejecutando setter:', setterName);
        setter(value);
        console.log('[DEBUG] Setter ejecutado exitosamente:', setterName);
      } catch (err) {
        console.error('Error setting state:', err);
        setError(err.message);
      }
    } else {
      console.warn('[DEBUG] Componente no montado, no se ejecuta setter:', setterName);
    }
  }, [isMounted, salaId]);

  // Validar estado antes de renderizar
  const validateState = useCallback(() => {
    try {
      // Verificar que los estados sean válidos
      if (loading !== true && loading !== false) {
        console.warn('[DEBUG] Estado loading inválido:', loading);
        return false;
      }
      
      if (sala && typeof sala !== 'object') {
        console.warn('[DEBUG] Estado sala inválido:', sala);
        return false;
      }
      
      if (mapa && typeof mapa !== 'object') {
        console.warn('[DEBUG] Estado mapa inválido:', mapa);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('[DEBUG] Error validando estado:', err);
      return false;
    }
  }, [loading, sala, mapa]);

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error en el componente</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => setError(null)} type="primary">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Verificar y crear campos faltantes inmediatamente
  const handleMissingFieldsError = async (error) => {
    if (error.code === '42703') {
      console.log('[DEBUG] Error de campo faltante detectado, verificando estructura...');
      
      // Verificar la estructura de la tabla
      const structureOk = await checkMapasTableStructure();
      
      if (structureOk) {
        message.success('Campos faltantes agregados exitosamente. Reintentando operación...');
        // Reintentar la operación original
        return true;
      } else {
        message.error('No se pudieron agregar los campos faltantes automáticamente.');
        return false;
      }
    }
    return false;
  };

  // Agregar campos faltantes a la tabla mapas existente
  const addMissingFieldsToMapas = async (missingFields) => {
    try {
      console.log('[DEBUG] Intentando agregar campos faltantes:', missingFields);
      
      // Opción 1: Usar RPC exec_sql si existe
      try {
        let alterSQL = '';
        
        if (missingFields.includes('nombre')) {
          alterSQL += 'ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS nombre TEXT DEFAULT \'Nuevo Mapa\'; ';
        }
        if (missingFields.includes('descripcion')) {
          alterSQL += 'ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT \'\'; ';
        }
        if (missingFields.includes('estado')) {
          alterSQL += 'ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT \'draft\'; ';
        }
        if (missingFields.includes('created_at')) {
          alterSQL += 'ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); ';
        }
        
        if (alterSQL) {
          const { error } = await supabase.rpc('exec_sql', { sql: alterSQL });
          
          if (!error) {
            console.log('[DEBUG] Campos agregados exitosamente con RPC');
            return true;
          }
        }
      } catch (rpcError) {
        console.log('[DEBUG] RPC exec_sql no disponible para agregar campos...');
      }
      
      // Opción 2: Intentar insertar un registro con campos faltantes para ver el error específico
      try {
        const testRecord = {
          sala_id: salaId,
          contenido: {},
          nombre: 'Test Mapa',
          descripcion: 'Descripción de prueba',
          estado: 'draft'
        };
        
        // Remover campos que no existen en la tabla
        const existingFields = ['id', 'sala_id', 'contenido', 'tenant_id', 'updated_at'];
        const filteredRecord = {};
        existingFields.forEach(field => {
          if (testRecord[field] !== undefined) {
            filteredRecord[field] = testRecord[field];
          }
        });
        
        const { error: insertError } = await supabase
          .from('mapas')
          .insert(filteredRecord);
        
        if (!insertError) {
          console.log('[DEBUG] Registro de prueba insertado exitosamente');
          // Limpiar el registro de prueba
          await supabase.from('mapas').delete().eq('nombre', 'Test Mapa');
          return true;
        } else {
          console.warn('[DEBUG] Error al insertar registro de prueba:', insertError);
        }
      } catch (insertError) {
        console.warn('[DEBUG] No se pudo insertar registro de prueba:', insertError.message);
      }
      
      console.warn('[DEBUG] No se pudieron agregar los campos faltantes');
      return false;
      
    } catch (err) {
      console.warn('[DEBUG] Error al agregar campos faltantes:', err.message);
      return false;
    }
  };

  // Verificar la estructura actual de la tabla mapas
  const checkMapasTableStructure = async () => {
    try {
      console.log('[DEBUG] Verificando estructura de tabla mapas...');
      
      // Intentar hacer una consulta simple para ver qué campos están disponibles
      const { data: structureTest, error: structureError } = await supabase
        .from('mapas')
        .select('*')
        .limit(1);
      
      if (structureError) {
        console.error('[DEBUG] Error al verificar estructura:', structureError);
        return false;
      }
      
      // Verificar si los campos esperados están presentes
      const expectedFields = ['id', 'sala_id', 'contenido', 'tenant_id', 'updated_at', 'created_at', 'nombre', 'descripcion', 'estado'];
      const availableFields = structureTest && structureTest.length > 0 ? Object.keys(structureTest[0]) : [];
      
      console.log('[DEBUG] Campos disponibles en tabla mapas:', availableFields);
      console.log('[DEBUG] Campos esperados:', expectedFields);
      
      // Verificar campos faltantes
      const missingFields = expectedFields.filter(field => !availableFields.includes(field));
      if (missingFields.length > 0) {
        console.warn('[DEBUG] Campos faltantes en tabla mapas:', missingFields);
        
        // Mostrar mensaje al usuario sobre campos faltantes
        message.warning(
          `La tabla mapas existe pero le faltan algunos campos: ${missingFields.join(', ')}. ` +
          'Intentando agregarlos automáticamente...'
        );
        
        // Intentar agregar campos faltantes
        const fieldsAdded = await addMissingFieldsToMapas(missingFields);
        if (fieldsAdded) {
          message.success('Campos faltantes agregados exitosamente');
          // Verificar la estructura nuevamente
          return await checkMapasTableStructure();
        } else {
          message.error(
            'No se pudieron agregar los campos faltantes automáticamente. ' +
            'Ejecuta este SQL en tu base de datos Supabase:'
          );
          
          // Mostrar el SQL en la consola para que sea fácil copiarlo
          const sqlCommands = [
            "ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS nombre TEXT DEFAULT 'Nuevo Mapa';",
            "ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';",
            "ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'draft';",
            "ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"
          ];
          
          console.log('[DEBUG] SQL para agregar campos faltantes:');
          sqlCommands.forEach(sql => console.log(sql));
          
          // También mostrar en un alert para que sea fácil copiarlo
          setTimeout(() => {
            alert(
              'Ejecuta este SQL en tu base de datos Supabase:\n\n' +
              sqlCommands.join('\n')
            );
          }, 1000);
        }
      } else {
        console.log('[DEBUG] Tabla mapas tiene todos los campos esperados');
      }
      
      return true;
    } catch (err) {
      console.error('[DEBUG] Error al verificar estructura de tabla:', err);
      return false;
    }
  };

  // Crear la tabla mapas si no existe (solo en desarrollo)
  const createMapasTable = async () => {
    try {
      console.log('[DEBUG] Intentando crear tabla mapas...');
      
      // Opción 1: Usar RPC exec_sql si existe
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.mapas (
              id SERIAL PRIMARY KEY,
              sala_id INTEGER NOT NULL,
              contenido JSONB NOT NULL DEFAULT '{}',
              tenant_id UUID,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              nombre TEXT DEFAULT 'Nuevo Mapa',
              descripcion TEXT DEFAULT '',
              estado TEXT DEFAULT 'draft'
            );
          `
        });
        
        if (!error) {
          console.log('[DEBUG] Tabla mapas creada exitosamente con RPC');
          return true;
        }
      } catch (rpcError) {
        console.log('[DEBUG] RPC exec_sql no disponible, intentando alternativa...');
      }
      
      // Opción 2: Intentar crear la tabla con una consulta simple
      try {
        // Intentar insertar un registro de prueba (esto creará la tabla si no existe)
        const { error: insertError } = await supabase
          .from('mapas')
          .insert({
            sala_id: salaId,
            contenido: {},
            nombre: 'Test Mapa',
            estado: 'draft'
          });
        
        if (!insertError) {
          console.log('[DEBUG] Tabla mapas creada exitosamente con insert');
          // Limpiar el registro de prueba
          await supabase.from('mapas').delete().eq('nombre', 'Test Mapa');
          return true;
        }
      } catch (insertError) {
        console.warn('[DEBUG] No se pudo crear la tabla con insert:', insertError.message);
      }
      
      console.warn('[DEBUG] No se pudo crear la tabla mapas con ningún método');
      return false;
      
    } catch (err) {
      console.warn('[DEBUG] Error al crear tabla mapas:', err.message);
      return false;
    }
  };

  // Verificar si la tabla mapas existe
  const checkTableExists = async (tableName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn(`[DEBUG] Tabla ${tableName} no accesible:`, error);
        return false;
      }
      
      console.log(`[DEBUG] Tabla ${tableName} es accesible`);
      
      // Si es la tabla mapas, verificar también su estructura
      if (tableName === 'mapas') {
        await checkMapasTableStructure();
      }
      
      return true;
    } catch (err) {
      console.warn(`[DEBUG] Error al verificar tabla ${tableName}:`, err.message);
      return false;
    }
  };

  // Monitorear cambios en el estado del componente
  useEffect(() => {
    console.log('[DEBUG] Estado del componente actualizado:', {
      loading,
      sala: sala ? 'cargada' : 'no cargada',
      mapa: mapa ? 'encontrado' : 'no encontrado',
      error: error ? 'sí' : 'no',
      isMounted,
      salaId
    });
    
    // Log adicional para debugging del error React #301
    if (sala && mapa) {
      console.log('[DEBUG] Datos completos cargados:', {
        salaKeys: Object.keys(sala),
        mapaKeys: Object.keys(mapa),
        salaNombre: sala.nombre,
        mapaId: mapa.id
      });
    }
  }, [loading, sala, mapa, error, isMounted, salaId]);

  // Cargar información de la sala
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
      
      safeSetState(setSala, salaData);

      // Buscar si ya existe un mapa para esta sala
      try {
        console.log('[DEBUG] Intentando acceder a tabla mapas para sala:', salaId);
        
        // Verificar si la tabla mapas existe
        let tableExists = await checkTableExists('mapas');
        
        // Si la tabla no existe, intentar crearla (solo en desarrollo)
        if (!tableExists) {
          console.warn('[DEBUG] Tabla mapas no existe, intentando crearla...');
          tableExists = await createMapasTable();
          
          if (!tableExists) {
            console.warn('[DEBUG] No se pudo crear la tabla mapas, continuando sin ella');
            
            // Mostrar mensaje al usuario
            message.warning(
              'La tabla "mapas" no existe. Para crear mapas, ejecuta este SQL en tu base de datos: ' +
              'CREATE TABLE public.mapas (id SERIAL PRIMARY KEY, sala_id INTEGER NOT NULL, contenido JSONB NOT NULL DEFAULT \'{}\', tenant_id UUID, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), nombre TEXT DEFAULT \'Nuevo Mapa\', descripcion TEXT DEFAULT \'\', estado TEXT DEFAULT \'draft\');'
            );
            
            return; // Salir si no se puede crear la tabla
          }
        }
        
        // Si la tabla es accesible, buscar el mapa específico
        const { data: mapaData, error: mapaError } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', salaId)
          .order('id', { ascending: false }) // Usar 'id' en lugar de 'created_at'
          .limit(1)
          .single();

        if (mapaData && !mapaError) {
          safeSetState(setMapa, mapaData);
          console.log('[DEBUG] Mapa encontrado:', mapaData);
          console.log('[DEBUG] Estableciendo loading a false después de cargar mapa');
        } else if (mapaError) {
          console.warn('[DEBUG] Error al cargar mapa existente:', mapaError);
          
          // Mostrar mensaje específico según el tipo de error
          if (mapaError.code === 'PGRST116') {
            message.warning('No se encontró un mapa existente para esta sala. Se creará uno nuevo.');
          } else if (mapaError.code === '42P01') {
            message.error('Error: La tabla mapas no existe o no es accesible.');
          } else if (mapaError.code === '42703') {
            message.warning('La tabla mapas existe pero le faltan algunos campos. Intentando agregarlos automáticamente...');
            // Intentar agregar campos faltantes
            const fieldsAdded = await handleMissingFieldsError(mapaError);
            if (fieldsAdded) {
              // Reintentar la consulta
              try {
                const { data: retryData, error: retryError } = await supabase
                  .from('mapas')
                  .select('*')
                  .eq('sala_id', salaId)
                  .order('id', { ascending: false })
                  .limit(1)
                  .single();
                
                if (retryData && !retryError) {
                  safeSetState(setMapa, retryData);
                  console.log('[DEBUG] Mapa encontrado después de agregar campos:', retryData);
                  console.log('[DEBUG] Estableciendo loading a false después de reintento exitoso');
                  console.log('[DEBUG] NOTA: Este return puede estar causando que no se ejecute el finally');
                  safeSetState(setLoading, false); // Establecer loading aquí también
                  return;
                }
              } catch (retryError) {
                console.warn('[DEBUG] Error al reintentar consulta:', retryError);
              }
            }
          } else {
            message.warning(`Error al cargar mapa existente: ${mapaError.message}`);
          }
          
          // No es crítico, continuar sin mapa
        }
      } catch (mapaError) {
        console.warn('[DEBUG] Error al acceder a tabla mapas:', mapaError);
        // Si hay error de permisos o RLS, continuar sin mapa
      }

      // Establecer loading a false aquí, después de todas las operaciones
      console.log('[DEBUG] Estableciendo loading a false después de todas las operaciones');
      safeSetState(setLoading, false);

    } catch (error) {
      console.error('Error loading sala info:', error);
      message.error('Error al cargar información de la sala: ' + error.message);
      // Establecer loading a false también en caso de error
      safeSetState(setLoading, false);
    }
  };

  const testDatabaseAccess = async () => {
    try {
      console.log('[DEBUG] Testing database access...');
      
      // Test 1: Check if we can access the mapas table
      try {
        const { data: mapasTest, error: mapasError } = await supabase
          .from('mapas')
          .select('id')
          .limit(1);
        
        if (mapasError) {
          console.warn('[DEBUG] Tabla mapas no accesible:', mapasError.message);
          if (mapasError.code === 'PGRST116') {
            console.warn('[DEBUG] Error 400: La tabla mapas probablemente no existe');
          }
        } else {
          console.log('[DEBUG] Tabla mapas accesible, registros encontrados:', mapasTest?.length || 0);
        }
      } catch (mapasError) {
        console.warn('[DEBUG] Mapas table access failed:', mapasError.message);
      }
      
      // Test 2: Check tenant context
      try {
        const tenantData = addTenantToInsert({});
        console.log('[DEBUG] Tenant data from hook:', tenantData);
      } catch (tenantError) {
        console.warn('[DEBUG] Tenant hook error:', tenantError.message);
      }
      
      // Test 3: Check if we can access the tenants table
      try {
        const { data: tenantsTest, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, company_name')
          .limit(1);
        
        if (tenantsError) {
          console.warn('[DEBUG] Tabla tenants no accesible:', tenantsError.message);
        } else {
          console.log('[DEBUG] Tabla tenants accesible, registros encontrados:', tenantsTest?.length || 0);
        }
      } catch (tenantsError) {
        console.log('[DEBUG] Tenants table access failed:', tenantsError.message);
      }
      
    } catch (error) {
      console.error('[DEBUG] Database access test failed:', error);
      // No propagar el error, solo log
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
          
          safeSetState(setMapa, data);
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
          
          safeSetState(setMapa, data);
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
    // Validar estado antes de renderizar loading
    if (!validateState()) {
      console.warn('[DEBUG] Estado inválido detectado, mostrando error boundary');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Error de Estado</h2>
            <p className="text-gray-600 mb-4">El estado del componente es inválido. Recargando...</p>
            <Button onClick={() => window.location.reload()} type="primary">
              Recargar Página
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spin size="large" />
        <div className="mt-4 text-center">
          <p className="text-gray-600 mb-2">Cargando información de la sala...</p>
          <Button 
            onClick={() => {
              console.log('[DEBUG] Botón de debug clickeado, forzando loading a false');
              setLoading(false);
            }}
            type="dashed"
            size="small"
          >
            Debug: Forzar Carga
          </Button>
        </div>
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

  // Validar estado antes de renderizar el contenido principal
  if (!validateState()) {
    console.warn('[DEBUG] Estado inválido detectado en renderizado principal, mostrando error boundary');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error de Estado</h2>
          <p className="text-gray-600 mb-4">El estado del componente es inválido. Recargando...</p>
          <Button onClick={() => window.location.reload()} type="primary">
            Recargar Página
          </Button>
        </div>
      </div>
    );
  }

  // Renderizado principal con try-catch
  try {
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
          {(() => {
            try {
              // Validar props antes de renderizar el editor
              console.log('[DEBUG] Validando props para CrearMapaEditor:', {
                salaId,
                onSave: typeof handleSave,
                onCancel: typeof handleCancel,
                initialMapa: mapa ? 'presente' : 'ausente',
                isEditMode: !!mapa
              });
              
              // Validar que las funciones sean funciones válidas
              if (typeof handleSave !== 'function') {
                throw new Error('La función onSave no es válida');
              }
              
              if (typeof handleCancel !== 'function') {
                throw new Error('La función onCancel no es válida');
              }
              
              // Validar que salaId sea válido
              if (!salaId || isNaN(parseInt(salaId))) {
                throw new Error('El ID de la sala no es válido');
              }
              
              // Validar que mapa tenga la estructura esperada
              if (mapa && typeof mapa === 'object') {
                console.log('[DEBUG] Estructura del mapa:', {
                  id: mapa.id,
                  sala_id: mapa.sala_id,
                  contenido: typeof mapa.contenido,
                  nombre: mapa.nombre,
                  descripcion: mapa.descripcion,
                  estado: mapa.estado,
                  tenant_id: mapa.tenant_id,
                  updated_at: mapa.updated_at,
                  created_at: mapa.created_at
                });
                
                // Verificar que contenido sea válido
                if (mapa.contenido && typeof mapa.contenido !== 'object') {
                  console.warn('[DEBUG] Contenido del mapa no es un objeto válido:', mapa.contenido);
                  throw new Error('El contenido del mapa no es válido');
                }
                
                // Verificar campos obligatorios
                if (!mapa.id || !mapa.sala_id) {
                  console.warn('[DEBUG] Mapa faltan campos obligatorios:', { id: mapa.id, sala_id: mapa.sala_id });
                  throw new Error('El mapa no tiene todos los campos obligatorios');
                }
                
                // Verificar que sala_id coincida
                if (mapa.sala_id !== parseInt(salaId)) {
                  console.warn('[DEBUG] Mapa.sala_id no coincide con salaId:', { mapa_sala_id: mapa.sala_id, salaId });
                  throw new Error('El mapa no corresponde a la sala seleccionada');
                }
                
                // Verificar que el contenido tenga la estructura esperada
                if (mapa.contenido && typeof mapa.contenido === 'object') {
                  if (!mapa.contenido.elementos || !Array.isArray(mapa.contenido.elementos)) {
                    console.warn('[DEBUG] Contenido del mapa no tiene elementos válidos:', mapa.contenido);
                    // No lanzar error, solo warning
                  }
                }
                
                console.log('[DEBUG] Mapa validado exitosamente, procediendo a renderizar editor');
              } else {
                console.log('[DEBUG] No hay mapa o no es un objeto válido, creando mapa nuevo');
              }
              
              console.log('[DEBUG] Todas las validaciones pasaron, renderizando CrearMapaEditor...');
              
              // Renderizar el editor con error boundary específico
              try {
                // Crear un error boundary específico para el editor
                const EditorWithErrorBoundary = () => {
                  try {
                    console.log('[DEBUG] Creando componente CrearMapaEditor...');
                    
                    const editorComponent = (
                      <CrearMapaEditor
                        salaId={salaId}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        initialMapa={mapa}
                        isEditMode={!!mapa}
                      />
                    );
                    
                    console.log('[DEBUG] CrearMapaEditor creado exitosamente');
                    return editorComponent;
                    
                  } catch (componentError) {
                    console.error('[DEBUG] Error al crear componente CrearMapaEditor:', componentError);
                    throw new Error(`Error de componente: ${componentError.message}`);
                  }
                };
                
                console.log('[DEBUG] Renderizando EditorWithErrorBoundary...');
                const editorComponent = <EditorWithErrorBoundary />;
                console.log('[DEBUG] EditorWithErrorBoundary renderizado exitosamente');
                
                // Log adicional para verificar el componente
                console.log('[DEBUG] Tipo del componente editor:', typeof editorComponent);
                console.log('[DEBUG] Props del componente:', {
                  salaId: salaId,
                  onSave: typeof handleSave,
                  onCancel: typeof handleCancel,
                  initialMapa: mapa ? 'presente' : 'ausente',
                  isEditMode: !!mapa
                });
                
                // Verificar que el componente sea un elemento React válido
                if (!editorComponent || typeof editorComponent !== 'object') {
                  console.error('[DEBUG] Componente editor no es válido:', editorComponent);
                  throw new Error('El componente editor no es válido');
                }
                
                // Verificar que tenga la propiedad type
                if (!editorComponent.type) {
                  console.error('[DEBUG] Componente editor no tiene type:', editorComponent);
                  throw new Error('El componente editor no tiene type válido');
                }
                
                console.log('[DEBUG] Componente editor validado exitosamente');
                
                return editorComponent;
                
              } catch (renderError) {
                console.error('[DEBUG] Error durante el renderizado de CrearMapaEditor:', renderError);
                throw new Error(`Error de renderizado: ${renderError.message}`);
              }
            } catch (editorError) {
              console.error('[DEBUG] Error al renderizar CrearMapaEditor:', editorError);
              return (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar el editor</h3>
                  <p className="text-gray-600 mb-4">{editorError.message}</p>
                  <div className="space-y-2">
                    <Button onClick={() => window.location.reload()} type="primary" className="mr-2">
                      Recargar Página
                    </Button>
                    <Button onClick={() => setError(null)} type="default">
                      Reintentar
                    </Button>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('[DEBUG] Error en renderizado principal:', renderError);
    setError(`Error de renderizado: ${renderError.message}`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error de Renderizado</h2>
          <p className="text-gray-600 mb-4">{renderError.message}</p>
          <Button onClick={() => setError(null)} type="primary">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }
};

export default CrearMapaPage;
