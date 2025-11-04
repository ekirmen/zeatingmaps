import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  message, 
  Space, 
  Typography,
  Select,
  Switch,
  Tag,
  Row,
  Col,
  Popconfirm,
  Tabs,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TicketOutlined,
  ChairOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenantFilter } from '../../hooks/useTenantFilter';
import { useRecinto } from '../contexts/RecintoContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PlantillasCupos = () => {
  const { addTenantFilter, getTenantId } = useTenantFilter();
  const { recintos } = useRecinto();
  const [plantillas, setPlantillas] = useState([]);
  const [cupos, setCupos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [form] = Form.useForm();
  const [recintoSeleccionado, setRecintoSeleccionado] = useState(null);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [selectedZona, setSelectedZona] = useState(null);
  const [selectedButacas, setSelectedButacas] = useState([]);
  const [cuposAsignados, setCuposAsignados] = useState({}); // { zonaId: { cupoId: [butacaIds] } }

  useEffect(() => {
    loadCupos();
    loadRecintos();
  }, []);

  useEffect(() => {
    if (recintoSeleccionado) {
      loadSalas(recintoSeleccionado);
    }
  }, [recintoSeleccionado]);

  useEffect(() => {
    if (salaSeleccionada) {
      loadZonas(salaSeleccionada);
      loadPlantillas();
    }
  }, [salaSeleccionada]);

  const loadRecintos = async () => {
    // Los recintos ya vienen del contexto
  };

  const loadSalas = async (recintoId) => {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('recinto_id', recintoId)
        .order('nombre');

      if (error) throw error;
      setSalas(data || []);
    } catch (error) {
      console.error('Error loading salas:', error);
      message.error('Error al cargar salas');
    }
  };

  const loadZonas = async (salaId) => {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', salaId)
        .order('nombre');

      if (error) throw error;
      setZonas(data || []);
    } catch (error) {
      console.error('Error loading zonas:', error);
      message.error('Error al cargar zonas');
    }
  };

  const loadCupos = async () => {
    try {
      let query = supabase
        .from('cupos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      query = addTenantFilter(query);

      const { data, error } = await query;

      if (error) throw error;
      setCupos(data || []);
    } catch (error) {
      console.error('Error loading cupos:', error);
      message.error('Error al cargar cupos');
    }
  };

  const loadPlantillas = async () => {
    if (!recintoSeleccionado || !salaSeleccionada) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('plantillas_cupos')
        .select('*')
        .eq('recinto_id', recintoSeleccionado)
        .eq('sala_id', salaSeleccionada);

      query = addTenantFilter(query);

      const { data, error } = await query;

      if (error) throw error;

      // Procesar cupos asignados
      const processedPlantillas = (data || []).map(plantilla => ({
        ...plantilla,
        cupos_array: Array.isArray(plantilla.cupos) 
          ? plantilla.cupos 
          : (typeof plantilla.cupos === 'string' ? JSON.parse(plantilla.cupos || '[]') : [])
      }));

      setPlantillas(processedPlantillas);
    } catch (error) {
      console.error('Error loading plantillas:', error);
      message.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      const plantillaData = {
        nombre: values.nombre,
        recinto_id: recintoSeleccionado,
        sala_id: salaSeleccionada,
        cupos: values.cupos || [],
        activo: values.activo !== undefined ? values.activo : true,
        tenant_id: getTenantId() || null
      };

      if (editingPlantilla) {
        const { error } = await supabase
          .from('plantillas_cupos')
          .update(plantillaData)
          .eq('id', editingPlantilla.id);

        if (error) throw error;
        message.success('Plantilla actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('plantillas_cupos')
          .insert([plantillaData]);

        if (error) throw error;
        message.success('Plantilla creada exitosamente');
      }

      setModalVisible(false);
      setEditingPlantilla(null);
      form.resetFields();
      loadPlantillas();
    } catch (error) {
      console.error('Error saving plantilla:', error);
      message.error('Error al guardar plantilla');
    }
  };

  const handleEdit = (plantilla) => {
    setEditingPlantilla(plantilla);
    form.setFieldsValue({
      nombre: plantilla.nombre,
      cupos: Array.isArray(plantilla.cupos) 
        ? plantilla.cupos 
        : (typeof plantilla.cupos === 'string' ? JSON.parse(plantilla.cupos || '[]') : []),
      activo: plantilla.activo !== false
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('plantillas_cupos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Plantilla eliminada exitosamente');
      loadPlantillas();
    } catch (error) {
      console.error('Error deleting plantilla:', error);
      message.error('Error al eliminar plantilla. Asegúrate de que no esté en uso en ninguna función.');
    }
  };

  const handleAsignarZonaNoNumerada = async (zonaId, cupoId, cantidad) => {
    if (!editingPlantilla) return;

    try {
      const { error } = await supabase
        .from('cupos_zonas_no_numeradas')
        .upsert({
          plantilla_cupos_id: editingPlantilla.id,
          zona_id: zonaId,
          cupo_id: cupoId,
          cantidad_entradas: cantidad,
          sobreaforo: 0
        }, {
          onConflict: 'plantilla_cupos_id,zona_id,cupo_id'
        });

      if (error) throw error;
      message.success('Cupo asignado a zona exitosamente');
    } catch (error) {
      console.error('Error asignando cupo a zona:', error);
      message.error('Error al asignar cupo a zona');
    }
  };

  const handleAsignarButacas = async (zonaId, cupoId, butacaIds) => {
    if (!editingPlantilla) return;

    try {
      // Eliminar asignaciones previas de estas butacas
      await supabase
        .from('cupos_butacas')
        .delete()
        .eq('plantilla_cupos_id', editingPlantilla.id)
        .in('butaca_id', butacaIds);

      // Crear nuevas asignaciones
      const asignaciones = butacaIds.map(butacaId => ({
        plantilla_cupos_id: editingPlantilla.id,
        zona_id: zonaId,
        cupo_id: cupoId,
        butaca_id: butacaId,
        bloqueado: false
      }));

      const { error } = await supabase
        .from('cupos_butacas')
        .insert(asignaciones);

      if (error) throw error;
      message.success(`${butacaIds.length} butacas asignadas al cupo exitosamente`);
      setMapaVisible(false);
      setSelectedButacas([]);
    } catch (error) {
      console.error('Error asignando butacas:', error);
      message.error('Error al asignar butacas');
    }
  };

  const getCupoNombre = (cupoId) => {
    const cupo = cupos.find(c => c.id === cupoId);
    return cupo ? cupo.nombre : `Cupo ${cupoId}`;
  };

  const getZonaNombre = (zonaId) => {
    const zona = zonas.find(z => z.id === zonaId);
    return zona ? zona.nombre : `Zona ${zonaId}`;
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Recinto',
      key: 'recinto',
      render: (_, record) => {
        const recinto = recintos.find(r => r.id === record.recinto_id);
        return recinto ? recinto.nombre : '—';
      }
    },
    {
      title: 'Sala',
      key: 'sala',
      render: (_, record) => {
        const sala = salas.find(s => s.id === record.sala_id);
        return sala ? sala.nombre : '—';
      }
    },
    {
      title: 'Cupos',
      dataIndex: 'cupos_array',
      key: 'cupos',
      render: (cuposArray) => (
        <Space wrap>
          {cuposArray && cuposArray.length > 0 ? (
            cuposArray.map(cupoId => {
              const cupo = cupos.find(c => c.id === cupoId);
              return cupo ? (
                <Tag key={cupoId} color={cupo.color || '#4ECDC4'}>
                  {cupo.nombre}
                </Tag>
              ) : null;
            })
          ) : (
            <Text type="secondary">Sin cupos asignados</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'} icon={activo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {activo ? 'Activa' : 'Inactiva'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="default"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setEditingPlantilla(record);
              setModalVisible(true);
              // Cargar asignaciones existentes
              loadAsignaciones(record.id);
            }}
          >
            Configurar Zonas
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar esta plantilla?"
            description="Esta acción no se puede deshacer. Asegúrate de que no esté en uso en ninguna función."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const loadAsignaciones = async (plantillaId) => {
    try {
      // Cargar asignaciones de zonas no numeradas
      const { data: zonasNoNumeradas, error: error1 } = await supabase
        .from('cupos_zonas_no_numeradas')
        .select('*')
        .eq('plantilla_cupos_id', plantillaId);

      // Cargar asignaciones de butacas
      const { data: butacas, error: error2 } = await supabase
        .from('cupos_butacas')
        .select('*')
        .eq('plantilla_cupos_id', plantillaId);

      if (error1 || error2) throw error1 || error2;

      // Procesar asignaciones
      const asignaciones = {};
      zonasNoNumeradas?.forEach(zn => {
        if (!asignaciones[zn.zona_id]) asignaciones[zn.zona_id] = {};
        asignaciones[zn.zona_id][zn.cupo_id] = { tipo: 'no_numerada', cantidad: zn.cantidad_entradas };
      });

      butacas?.forEach(b => {
        if (!asignaciones[b.zona_id]) asignaciones[b.zona_id] = {};
        if (!asignaciones[b.zona_id][b.cupo_id]) {
          asignaciones[b.zona_id][b.cupo_id] = { tipo: 'numerada', butacas: [] };
        }
        asignaciones[b.zona_id][b.cupo_id].butacas.push(b.butaca_id);
      });

      setCuposAsignados(asignaciones);
    } catch (error) {
      console.error('Error loading asignaciones:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">Plantillas de Cupos</Title>
              <Text type="secondary">
                Crea plantillas que agrupan cupos para facilitar su aplicación a sesiones.
                Asigna cupos a zonas numeradas (butacas específicas) o no numeradas (aforo general).
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setEditingPlantilla(null);
                form.resetFields();
                setModalVisible(true);
              }}
              disabled={!recintoSeleccionado || !salaSeleccionada}
            >
              Crear Plantilla
            </Button>
          </div>
        </Card>

        {/* Selectores de Recinto y Sala */}
        <Card className="mb-6">
          <Row gutter={16}>
            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recinto</label>
                <Select
                  placeholder="Selecciona un recinto"
                  value={recintoSeleccionado}
                  onChange={(value) => {
                    setRecintoSeleccionado(value);
                    setSalaSeleccionada(null);
                    setSalas([]);
                    setZonas([]);
                    setPlantillas([]);
                  }}
                  style={{ width: '100%' }}
                >
                  {recintos.map(recinto => (
                    <Option key={recinto.id} value={recinto.id}>
                      {recinto.nombre}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
                <Select
                  placeholder="Selecciona una sala"
                  value={salaSeleccionada}
                  onChange={(value) => {
                    setSalaSeleccionada(value);
                    setPlantillas([]);
                  }}
                  style={{ width: '100%' }}
                  disabled={!recintoSeleccionado}
                >
                  {salas.map(sala => (
                    <Option key={sala.id} value={sala.id}>
                      {sala.nombre}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Tabla de Plantillas */}
        {recintoSeleccionado && salaSeleccionada && (
          <Card>
            <Table
              columns={columns}
              dataSource={plantillas}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} plantilla${total !== 1 ? 's' : ''}`
              }}
            />
          </Card>
        )}

        {/* Modal de Crear/Editar Plantilla */}
        <Modal
          title={editingPlantilla ? 'Editar Plantilla de Cupos' : 'Crear Nueva Plantilla de Cupos'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingPlantilla(null);
            form.resetFields();
            setCuposAsignados({});
          }}
          onOk={() => form.submit()}
          okText={editingPlantilla ? 'Actualizar' : 'Crear'}
          cancelText="Cancelar"
          width={1000}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              activo: true
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Nombre de la Plantilla"
                  name="nombre"
                  rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                >
                  <Input placeholder="Ej: Cupos Noche Para Salsa" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Cupos"
                  name="cupos"
                  rules={[{ required: true, message: 'Debes seleccionar al menos un cupo' }]}
                  tooltip="Selecciona los cupos que formarán parte de esta plantilla"
                >
                  <Select
                    mode="multiple"
                    placeholder="Selecciona uno o más cupos"
                    allowClear
                  >
                    {cupos.map(cupo => (
                      <Option key={cupo.id} value={cupo.id}>
                        <Space>
                          <div 
                            style={{ 
                              width: 16, 
                              height: 16, 
                              backgroundColor: cupo.color || '#4ECDC4',
                              borderRadius: 4,
                              display: 'inline-block'
                            }} 
                          />
                          {cupo.nombre}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Estado"
              name="activo"
              valuePropName="checked"
            >
              <Switch checkedChildren="Activa" unCheckedChildren="Inactiva" />
            </Form.Item>

            {/* Configuración de Zonas */}
            {editingPlantilla && form.getFieldValue('cupos') && form.getFieldValue('cupos').length > 0 && (
              <>
                <Divider />
                <Title level={5}>Configuración de Zonas</Title>
                <Text type="secondary" className="block mb-4">
                  Asigna cupos a zonas numeradas (butacas específicas) o no numeradas (aforo general)
                </Text>

                <Tabs defaultActiveKey="no_numeradas">
                  <TabPane 
                    tab={
                      <span>
                        <TicketOutlined /> Zonas No Numeradas
                      </span>
                    } 
                    key="no_numeradas"
                  >
                    <div className="space-y-4">
                      {zonas.filter(z => !z.numerada).map(zona => (
                        <Card key={zona.id} size="small" title={zona.nombre}>
                          {form.getFieldValue('cupos')?.map(cupoId => {
                            const asignacion = cuposAsignados[zona.id]?.[cupoId];
                            return (
                              <div key={cupoId} className="mb-4">
                                <Space align="baseline">
                                  <Text strong>{getCupoNombre(cupoId)}:</Text>
                                  <InputNumber
                                    min={0}
                                    defaultValue={asignacion?.cantidad || 0}
                                    placeholder="Cantidad de entradas"
                                    style={{ width: 150 }}
                                    onPressEnter={(e) => {
                                      const cantidad = parseInt(e.target.value) || 0;
                                      handleAsignarZonaNoNumerada(zona.id, cupoId, cantidad);
                                    }}
                                  />
                                  <Button
                                    type="primary"
                                    size="small"
                                    onClick={(e) => {
                                      const input = e.target.closest('.mb-4').querySelector('input');
                                      const cantidad = parseInt(input?.value) || 0;
                                      handleAsignarZonaNoNumerada(zona.id, cupoId, cantidad);
                                    }}
                                  >
                                    Guardar
                                  </Button>
                                </Space>
                              </div>
                            );
                          })}
                        </Card>
                      ))}
                      {zonas.filter(z => !z.numerada).length === 0 && (
                        <Text type="secondary">No hay zonas no numeradas en esta sala</Text>
                      )}
                    </div>
                  </TabPane>

                  <TabPane 
                    tab={
                      <span>
                        <ChairOutlined /> Zonas Numeradas
                      </span>
                    } 
                    key="numeradas"
                  >
                    <div className="space-y-4">
                      {zonas.filter(z => z.numerada).map(zona => (
                        <Card key={zona.id} size="small" title={zona.nombre}>
                          <Select
                            placeholder="Selecciona un cupo para asignar butacas"
                            style={{ width: '100%', marginBottom: 16 }}
                            onChange={(cupoId) => {
                              setSelectedZona(zona.id);
                              // Aquí se abriría el mapa para seleccionar butacas
                              message.info('Funcionalidad de selección de butacas en el mapa próximamente');
                            }}
                          >
                            {form.getFieldValue('cupos')?.map(cupoId => (
                              <Option key={cupoId} value={cupoId}>
                                {getCupoNombre(cupoId)}
                              </Option>
                            ))}
                          </Select>
                          <Text type="secondary" className="block">
                            {cuposAsignados[zona.id] ? 
                              Object.entries(cuposAsignados[zona.id]).map(([cupoId, data]) => {
                                if (data.tipo === 'numerada') {
                                  return (
                                    <div key={cupoId}>
                                      {getCupoNombre(cupoId)}: {data.butacas?.length || 0} butacas asignadas
                                    </div>
                                  );
                                }
                                return null;
                              }).filter(Boolean).length > 0 ? null : 'No hay butacas asignadas'
                              : 'No hay butacas asignadas'
                            }
                          </Text>
                        </Card>
                      ))}
                      {zonas.filter(z => z.numerada).length === 0 && (
                        <Text type="secondary">No hay zonas numeradas en esta sala</Text>
                      )}
                    </div>
                  </TabPane>
                </Tabs>
              </>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default PlantillasCupos;

