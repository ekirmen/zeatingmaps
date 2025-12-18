import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, message, Spin, Empty } from '../../utils/antdComponents';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import CrearMapaEditor from '../../components/CrearMapa/CrearMapaEditor';
import SeatingLite from '../components/CrearMapa/SeatingLite';
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

  // Validar que el componente est© montado antes de hacer operaciones
  const [isMounted, setIsMounted] = useState(false);

  // Establecer isMounted inmediatamente
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Inicializaci³n del componente
  useEffect(() => {
    if (isMounted && salaId) {
      loadSalaInfo();
      testDatabaseAccess();

      // Timeout de seguridad para asegurar que loading se establezca a false
      const safetyTimeout = setTimeout(() => {
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
      setLoading(false);
    }
  }, [isMounted, salaId]);

  // Solo ejecutar operaciones si el componente est¡ montado
  const safeSetState = useCallback((setter, value) => {
    const setterName = setter.name || setter.toString().slice(0, 50);
    if (isMounted) {
      try {
        setter(value);
      } catch (err) {
        console.error('Error setting state:', err);
        setError(err.message);
      }
    } else {
    }
  }, [isMounted, salaId]);

  // Validar estado antes de renderizar
  const validateState = useCallback(() => {
    try {
      // Verificar que los estados sean v¡lidos
      if (loading !== true && loading !== false) {
        return false;
      }

      if (sala && typeof sala !== 'object') {
        return false;
      }

      if (mapa && typeof mapa !== 'object') {
        return false;
      }

      return true;
    } catch (err) {
      console.error('[DEBUG] Error en validateState:', err);
      return false;
    }
  }, [loading, sala, mapa]);

  // Monitorear cambios en el estado del componente
  useEffect(() => {
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

  // Log adicional para verificar re-renderizados
  useEffect(() => {
    console.log('[DEBUG] Componente re-renderizado, timestamp:', Date.now());
  });

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
      // Verificar la estructura de la tabla
      const structureOk = await checkMapasTableStructure();

      if (structureOk) {
        message.success('Campos faltantes agregados exitosamente. Reintentando operaci³n...');
        // Reintentar la operaci³n original
        return true;
      } else {
        message.error('No se pudieron agregar los campos faltantes autom¡ticamente.');
        return false;
      }
    }
    return false;
  };

  // Agregar campos faltantes a la tabla mapas existente
  const addMissingFieldsToMapas = async (missingFields) => {
    try {
      // Opci³n 1: Usar RPC exec_sql si existe
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
        if (missingFields.includes('imagen_fondo')) {
          alterSQL += 'ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS imagen_fondo TEXT; ';
        }
        if (missingFields.includes('created_at')) {
          alterSQL += 'ALTER TABLE public.mapas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); ';
        }

        if (alterSQL) {
          const { error } = await supabase.rpc('exec_sql', { sql: alterSQL });

          if (!error) {
            return true;
          }
        }
      } catch (rpcError) {
      }

      // Opci³n 2: Intentar insertar un registro con campos faltantes para ver el error espec­fico
      try {
        const testRecord = {
          sala_id: salaId,
          contenido: {},
          nombre: 'Test Mapa',
          descripcion: 'Descripci³n de prueba',
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
          // Limpiar el registro de prueba
          await supabase.from('mapas').delete().eq('nombre', 'Test Mapa');
          return true;
        } else {
        }
      } catch (insertError) {
      }
      return false;

    } catch (err) {
      return false;
    }
  };

  // Verificar la estructura actual de la tabla mapas
  const checkMapasTableStructure = async () => {
    try {
      // Validar columnas mediante un SELECT completo
      const fullProjection = 'id,sala_id,contenido,tenant_id,updated_at,created_at,nombre,descripcion,estado,imagen_fondo';
      const { data, error } = await supabase
        .from('mapas')
        .select(fullProjection)
        .limit(1);

      // Si no hay error, las columnas existen (aunque no haya filas)
      if (!error) {
        return true;
      }

      // Si hay error de columna faltante (42703), intentar autocorregir
      if (error.code === '42703') {
        console.warn('[DEBUG] Columnas faltantes detectadas (42703):', error.message);
        message.warning('La tabla mapas existe pero faltan columnas. Intentando agregarlas autom¡ticamente...');
        // Intentar agregar las columnas opcionales comunes
        const fieldsToTry = ['created_at', 'nombre', 'descripcion', 'estado'];
        const added = await addMissingFieldsToMapas(fieldsToTry);
        if (added) {
          // Reintentar la validaci³n
          const retry = await supabase.from('mapas').select(fullProjection).limit(1);
          if (!retry.error) {
            message.success('Campos faltantes agregados exitosamente');
            return true;
          }
        }
        message.error('No se pudieron agregar todas las columnas requeridas autom¡ticamente.');
        return false;
      }

      console.error('[DEBUG] Error no esperado al verificar estructura:', error);
      return false;
    } catch (err) {
      console.error('[DEBUG] Error al verificar estructura de tabla:', err);
      return false;
    }
  };

  // Crear la tabla mapas si no existe (solo en desarrollo)
  const createMapasTable = async () => {
    try {
      // Opci³n 1: Usar RPC exec_sql si existe
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
          return true;
        }
      } catch (rpcError) {
      }

      // Opci³n 2: Intentar crear la tabla con una consulta simple
      try {
        // Intentar insertar un registro de prueba (esto crear¡ la tabla si no existe)
        const { error: insertError } = await supabase
          .from('mapas')
          .insert({
            sala_id: salaId,
            contenido: {},
            nombre: 'Test Mapa',
            estado: 'draft'
          });

        if (!insertError) {
          // Limpiar el registro de prueba
          await supabase.from('mapas').delete().eq('nombre', 'Test Mapa');
          return true;
        }
      } catch (insertError) {
      }
      return false;

    } catch (err) {
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
        return false;
      }
      // Si es la tabla mapas, verificar tambi©n su estructura
      if (tableName === 'mapas') {
        await checkMapasTableStructure();
      }

      return true;
    } catch (err) {
      return false;
    }
  };

  // Cargar informaci³n de la sala
  const loadSalaInfo = async () => {
    try {
      setLoading(true);

      // Obtener informaci³n de la sala
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
        // Verificar si la tabla mapas existe
        let tableExists = await checkTableExists('mapas');

        // Si la tabla no existe, intentar crearla (solo en desarrollo)
        if (!tableExists) {
          tableExists = await createMapasTable();

          if (!tableExists) {
            // Mostrar mensaje al usuario
            message.warning(
              'La tabla "mapas" no existe. Para crear mapas, ejecuta este SQL en tu base de datos: ' +
              'CREATE TABLE public.mapas (id SERIAL PRIMARY KEY, sala_id INTEGER NOT NULL, contenido JSONB NOT NULL DEFAULT \'{}\', tenant_id UUID, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), nombre TEXT DEFAULT \'Nuevo Mapa\', descripcion TEXT DEFAULT \'\', estado TEXT DEFAULT \'draft\');'
            );

            return; // Salir si no se puede crear la tabla
          }
        }

        // Si la tabla es accesible, buscar el mapa espec­fico
        const { data: mapaData, error: mapaError } = await supabase
          .from('mapas')
          .select('id,sala_id,contenido,tenant_id,updated_at,created_at,nombre,descripcion,estado,imagen_fondo')
          .eq('sala_id', salaId)
          .order('id', { ascending: false }) // Usar 'id' en lugar de 'created_at'
          .limit(1)
          .single();

        if (mapaData && !mapaError) {
          safeSetState(setMapa, mapaData);
        } else if (mapaError) {
          // Mostrar mensaje espec­fico segºn el tipo de error
          if (mapaError.code === 'PGRST116') {
            message.warning('No se encontr³ un mapa existente para esta sala. Se crear¡ uno nuevo.');
          } else if (mapaError.code === '42P01') {
            message.error('Error: La tabla mapas no existe o no es accesible.');
          } else if (mapaError.code === '42703') {
            message.warning('La tabla mapas existe pero le faltan algunos campos. Intentando agregarlos autom¡ticamente...');
            // Intentar agregar campos faltantes
            const fieldsAdded = await handleMissingFieldsError(mapaError);
            if (fieldsAdded) {
              // Reintentar la consulta
              try {
                const { data: retryData, error: retryError } = await supabase
                  .from('mapas')
                  .select('id,sala_id,contenido,tenant_id,updated_at,created_at,nombre,descripcion,estado,imagen_fondo')
                  .eq('sala_id', salaId)
                  .order('id', { ascending: false })
                  .limit(1)
                  .single();

                if (retryData && !retryError) {
                  safeSetState(setMapa, retryData);
                  safeSetState(setLoading, false); // Establecer loading aqu­ tambi©n
                  return;
                }
              } catch (retryError) {
              }
            }
          } else {
            message.warning(`Error al cargar mapa existente: ${mapaError.message}`);
          }

          // No es cr­tico, continuar sin mapa
        }
      } catch (mapaError) {
        // Si hay error de permisos o RLS, continuar sin mapa
      }

      // Establecer loading a false aqu­, despu©s de todas las operaciones
      safeSetState(setLoading, false);

    } catch (error) {
      console.error('Error loading sala info:', error);
      message.error('Error al cargar informaci³n de la sala: ' + error.message);
      // Establecer loading a false tambi©n en caso de error
      safeSetState(setLoading, false);
    }
  };

  const testDatabaseAccess = async () => {
    try {
      // Test 1: Check if we can access the mapas table
      try {
        const { data: mapasTest, error: mapasError } = await supabase
          .from('mapas')
          .select('id')
          .limit(1);

        if (mapasError) {
          if (mapasError.code === 'PGRST116') {
          }
        } else {
        }
      } catch (mapasError) {
      }

      // Test 2: Check tenant context
      try {
        const tenantData = addTenantToInsert({});
      } catch (tenantError) {
      }

      // Test 3: Check if we can access the tenants table
      try {
        const { data: tenantsTest, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, company_name')
          .limit(1);

        if (tenantsError) {
        } else {
        }
      } catch (tenantsError) {
      }

    } catch (error) {
      console.error('[DEBUG] Database access test failed:', error);
      // No propagar el error, solo log
    }
  };

  // Valida que el tenant_id exista realmente en la tabla tenants; si no, retorna null
  const ensureValidTenantId = async (maybeTenantId) => {
    try {
      if (!maybeTenantId) {
        return null;
      }
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', maybeTenantId)
        .maybeSingle();
      if (error || !data?.id) {
        return null;
      }
      return data.id;
    } catch (e) {
      return null;
    }
  };

  // Obtiene el tenant_id del usuario autenticado (profiles) o del hook; lanza error si no existe
  const getCurrentTenantId = async (userId) => {
    // 1) Intentar desde profiles
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single();
      if (!profileError && profile?.tenant_id) {
        return profile.tenant_id;
      }
    } catch (_) { }
    // 2) Intentar desde el hook
    try {
      const fromHook = addTenantToInsert({});
      if (fromHook?.tenant_id) return fromHook.tenant_id;
    } catch (_) { }
    throw new Error('No se pudo determinar el tenant del usuario.');
  };

  const handleSave = async (mapaData) => {
    try {
      setSaving(true);

      // Debug: Check authentication and tenant
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuario no autenticado. Por favor, inicie sesi³n nuevamente.');
      }

      // Obtener tenant del usuario (obligatorio)
      const userTenantId = await getCurrentTenantId(user.id);
      const validTenantId = await ensureValidTenantId(userTenantId);
      if (!validTenantId) {
        throw new Error('Tu cuenta no tiene un tenant v¡lido asociado.');
      }

      // --- OPTIMIZATION START ---
      // Logica local para extraer imagen de fondo (similar a transformarParaGuardar)
      let finalContenido = mapaData.contenido || [];
      let finalImagenFondo = null;

      if (Array.isArray(finalContenido)) {
        const bgElement = finalContenido.find(el => el.type === 'background');
        if (bgElement) {
          // Extract data
          finalImagenFondo = bgElement.imageData || bgElement.imageUrl || null;

          // Replace with light version in JSON
          const lightBg = {
            ...bgElement,
            imageData: null,
            imageUrl: null,
            _isBackgroundRef: true
          };

          finalContenido = finalContenido.map(el => el.type === 'background' ? lightBg : el);
        }
      }
      // --- OPTIMIZATION END ---

      // Prepare base data
      const baseData = {
        nombre: mapaData.nombre || 'Mapa de Sala',
        descripcion: mapaData.descripcion || '',
        contenido: finalContenido,
        estado: mapaData.estado || 'activo',
        tenant_id: validTenantId,
        imagen_fondo: finalImagenFondo // Save to column
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
        const updateData = {
          ...baseData,
          updated_at: new Date().toISOString()
        };

        console.log('[DEBUG] Update data (final) with imagen_fondo:', !!updateData.imagen_fondo);

        const { error } = await supabase
          .from('mapas')
          .update(updateData)
          .eq('id', mapa.id);

        if (error) {
          console.error('[DEBUG] Update error details:', error);
          throw error;
        }
        message.success('Mapa actualizado exitosamente');

        // Update local state to reflect change immediately (including new optimization)
        setMapa(prev => ({ ...prev, ...updateData }));

      } else {
        // Crear nuevo mapa
        const insertData = {
          ...baseData,
          sala_id: salaId
        };

        console.log('[DEBUG] Insert data (pre-ejecuci³n) with imagen_fondo:', !!insertData.imagen_fondo);

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

      // Permanecer en la p¡gina de creaci³n tras guardar segºn petici³n

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
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Error de Estado</h2>
            <p className="text-gray-600 mb-4">El estado del componente es inv¡lido. Recargando...</p>
            <Button onClick={() => window.location.reload()} type="primary">
              Recargar P¡gina
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spin size="large" />
        <div className="mt-4 text-center">
          <p className="text-gray-600 mb-2">Cargando informaci³n de la sala...</p>
          <Button
            onClick={() => {
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error de Estado</h2>
          <p className="text-gray-600 mb-4">El estado del componente es inv¡lido. Recargando...</p>
          <Button onClick={() => window.location.reload()} type="primary">
            Recargar P¡gina
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
              {/* Botones de vista previa/guardar removidos a petici³n */}
            </Space>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <SeatingLite
            salaId={salaId}
            onSave={handleSave}
            onCancel={handleCancel}
            initialMapa={
              mapa
                ? {
                  contenido: Array.isArray(mapa?.contenido)
                    ? mapa.contenido
                    : Array.isArray(mapa?.contenido?.elementos)
                      ? mapa.contenido.elementos
                      : []
                }
                : null
            }
          />
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


