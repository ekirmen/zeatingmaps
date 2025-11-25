import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const { Option } = Select;
const { Title, Text } = Typography;

const emptyPackage = {
  id: null,
  nombre: '',
  descripcion: '',
  precio: 0,
  stock_total: 0,
  stock_disponible: 0,
  vendidos: 0,
  imagen_url: '',
  productos_ids: [],
  recinto_id: null,
  sala_id: null,
  evento_id: null,
  activo: true,
};

const emptyTemplate = {
  id: null,
  nombre: '',
  descripcion: '',
  precio: 0,
  stock_total: 0,
  imagen_url: '',
  recinto_id: null,
  sala_id: null,
  evento_id: null,
};

const Paquetes = () => {
  const { addTenantFilter, addTenantToInsert } = useTenantFilter();
  const [recintos, setRecintos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [eventos, setEventos] = useState([]);

  const [selectedRecinto, setSelectedRecinto] = useState(null);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedEvento, setSelectedEvento] = useState(null);

  const [paquetes, setPaquetes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingPaquete, setEditingPaquete] = useState(null);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState(null);

  const [plantillas, setPlantillas] = useState([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateForm] = Form.useForm();
  const [editingTemplate, setEditingTemplate] = useState(null);

  const filtroDescripcion = useMemo(() => {
    if (selectedEvento) return 'Evento';
    if (selectedSala) return 'Sala';
    if (selectedRecinto) return 'Recinto';
    return 'Todos';
  }, [selectedEvento, selectedSala, selectedRecinto]);

  useEffect(() => {
    loadRecintos();
    loadProductos();
  }, []);

  useEffect(() => {
    if (selectedRecinto) {
      const recintoObj = recintos.find(r => `${r.id}` === `${selectedRecinto}`);
      setSalas(recintoObj?.salas || []);
    } else {
      setSalas([]);
    }
    setSelectedSala(null);
    setSelectedEvento(null);
  }, [selectedRecinto, recintos]);

  useEffect(() => {
    loadEventos();
  }, [selectedSala, selectedRecinto]);

  useEffect(() => {
    loadPaquetes();
    loadPlantillas();
  }, [selectedRecinto, selectedSala, selectedEvento]);

  const loadRecintos = async () => {
    try {
      const { data, error } = await supabase
        .from('recintos')
        .select('id, nombre, salas ( id, nombre )')
        .order('nombre');
      if (error) throw error;
      setRecintos(data || []);
    } catch (err) {
      console.error('Error cargando recintos', err);
      message.error('No se pudieron cargar los recintos');
    }
  };

  const loadEventos = async () => {
    try {
      const query = supabase.from('eventos').select('id, nombre, sala_id, recinto_id').order('nombre');
      const { data, error } = await addTenantFilter(query);
      if (error) throw error;
      let filtered = data || [];
      if (selectedSala) {
        filtered = filtered.filter(e => `${e.sala_id}` === `${selectedSala}`);
      } else if (selectedRecinto) {
        filtered = filtered.filter(e => `${e.recinto_id}` === `${selectedRecinto}`);
      }
      setEventos(filtered);
    } catch (err) {
      console.error('Error cargando eventos', err);
      message.error('No se pudieron cargar los eventos');
    }
  };

  const loadProductos = async () => {
    try {
      const { data, error } = await addTenantFilter(
        supabase
          .from('productos')
          .select('id, nombre, descripcion, categoria')
          .order('nombre')
      );
      if (error) throw error;
      setProductos(data || []);
    } catch (err) {
      console.error('Error cargando productos', err);
    }
  };

  const loadPaquetes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('paquetes')
        .select('*')
        .order('created_at', { ascending: false });

      query = addTenantFilter(query);

      if (selectedRecinto) query = query.eq('recinto_id', selectedRecinto);
      if (selectedSala) query = query.eq('sala_id', selectedSala);
      if (selectedEvento) query = query.eq('evento_id', selectedEvento);

      const { data, error } = await query;
      if (error) throw error;
      setPaquetes(data || []);
    } catch (err) {
      console.error('Error cargando paquetes', err);
      message.error('No se pudieron cargar los paquetes');
      setPaquetes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlantillas = async () => {
    try {
      let query = supabase.from('plantillas_paquetes').select('*').order('created_at', { ascending: false });
      query = addTenantFilter(query);
      if (selectedRecinto) query = query.eq('recinto_id', selectedRecinto);
      if (selectedSala) query = query.eq('sala_id', selectedSala);
      if (selectedEvento) query = query.eq('evento_id', selectedEvento);

      const { data, error } = await query;
      if (error) throw error;
      setPlantillas(data || []);
    } catch (err) {
      console.error('Error cargando plantillas de paquetes', err);
      setPlantillas([]);
    }
  };

  const openCreateModal = () => {
    setEditingPaquete(null);
    setSelectedPlantillaId(null);
    form.setFieldsValue({ ...emptyPackage, recinto_id: selectedRecinto || null, sala_id: selectedSala || null, evento_id: selectedEvento || null });
    setModalVisible(true);
  };

  const openEditModal = (paquete) => {
    setEditingPaquete(paquete);
    setSelectedPlantillaId(null);
    form.setFieldsValue({
      ...paquete,
      productos_ids: paquete.productos_ids || [],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = addTenantToInsert({
        ...values,
        stock_disponible: values.stock_disponible ?? values.stock_total,
        vendidos: values.vendidos ?? 0,
        productos_ids: values.productos_ids || [],
        activo: values.activo !== false,
      });

      if (editingPaquete) {
        const { error } = await supabase.from('paquetes').update(payload).eq('id', editingPaquete.id);
        if (error) throw error;
        message.success('Paquete actualizado');
      } else {
        const { error } = await supabase.from('paquetes').insert(payload);
        if (error) throw error;
        message.success('Paquete creado');
      }
      setModalVisible(false);
      loadPaquetes();
    } catch (err) {
      console.error('Error guardando paquete', err);
      message.error(err.message || 'No se pudo guardar el paquete');
    }
  };

  const handleDelete = async (paqueteId) => {
    Modal.confirm({
      title: '¿Eliminar paquete?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const { error } = await supabase.from('paquetes').delete().eq('id', paqueteId);
          if (error) throw error;
          message.success('Paquete eliminado');
          loadPaquetes();
        } catch (err) {
          console.error('Error eliminando paquete', err);
          message.error('No se pudo eliminar el paquete');
        }
      },
    });
  };

  const openTemplateModal = (plantilla) => {
    setEditingTemplate(plantilla || null);
    templateForm.setFieldsValue({
      ...(plantilla || emptyTemplate),
      recinto_id: selectedRecinto || plantilla?.recinto_id || null,
      sala_id: selectedSala || plantilla?.sala_id || null,
      evento_id: selectedEvento || plantilla?.evento_id || null,
    });
    setTemplateModalVisible(true);
  };

  const applyPlantillaToForm = (plantilla, { keepEditing = false } = {}) => {
    if (!plantilla) return;

    if (!keepEditing) {
      setEditingPaquete(null);
    }
    setSelectedPlantillaId(plantilla.id);
    setSelectedRecinto(plantilla.recinto_id || null);
    setSelectedSala(plantilla.sala_id || null);
    setSelectedEvento(plantilla.evento_id || null);

    form.setFieldsValue({
      nombre: plantilla.nombre || '',
      descripcion: plantilla.descripcion || '',
      precio: plantilla.precio || 0,
      stock_total: plantilla.stock_total || 0,
      stock_disponible: plantilla.stock_total || 0,
      vendidos: 0,
      imagen_url: plantilla.imagen_url || '',
      recinto_id: plantilla.recinto_id || null,
      sala_id: plantilla.sala_id || null,
      evento_id: plantilla.evento_id || null,
      productos_ids: [],
    });

    setModalVisible(true);
  };

  const handlePlantillaChange = (plantillaId) => {
    setSelectedPlantillaId(plantillaId || null);

    if (!plantillaId) {
      const baseValues = editingPaquete
        ? { ...editingPaquete, productos_ids: editingPaquete.productos_ids || [] }
        : { ...emptyPackage, recinto_id: selectedRecinto || null, sala_id: selectedSala || null, evento_id: selectedEvento || null };

      form.setFieldsValue({
        ...baseValues,
        productos_ids: baseValues.productos_ids || [],
      });
      return;
    }

    const plantilla = plantillas.find((p) => `${p.id}` === `${plantillaId}`);
    if (plantilla) {
      applyPlantillaToForm(plantilla, { keepEditing: true });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      const payload = addTenantToInsert({
        ...values,
        stock_total: values.stock_total || 0,
      });
      if (editingTemplate) {
        const { error } = await supabase.from('plantillas_paquetes').update(payload).eq('id', editingTemplate.id);
        if (error) throw error;
        message.success('Plantilla actualizada');
      } else {
        const { error } = await supabase.from('plantillas_paquetes').insert(payload);
        if (error) throw error;
        message.success('Plantilla creada');
      }
      setTemplateModalVisible(false);
      loadPlantillas();
    } catch (err) {
      console.error('Error guardando plantilla de paquete', err);
      message.error(err.message || 'No se pudo guardar la plantilla');
    }
  };

  const paqueteColumns = [
    {
      title: 'Paquete',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary">{record.descripcion || 'Sin descripción'}</Text>
        </Space>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => `$${Number(precio || 0).toFixed(2)}`,
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>Existente: {record.stock_total ?? 0}</Text>
          <Text type="secondary">Disponible: {record.stock_disponible ?? 0}</Text>
          <Text type="secondary">Vendidos: {record.vendidos ?? 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>{activo ? 'Activo' : 'Inactivo'}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4">
        <Title level={2} className="mb-1">Paquetes</Title>
        <Text type="secondary">
          Crea paquetes con productos y plantillas de precios específicas por recinto, sala y evento
        </Text>
      </div>

      <Card className="mb-4">
        <Space wrap>
          <Select
            placeholder="Selecciona recinto"
            value={selectedRecinto}
            onChange={(value) => setSelectedRecinto(value)}
            style={{ minWidth: 220 }}
            allowClear
          >
            {recintos.map((r) => (
              <Option key={r.id} value={r.id}>{r.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Selecciona sala"
            value={selectedSala}
            onChange={(value) => setSelectedSala(value)}
            style={{ minWidth: 200 }}
            allowClear
            disabled={!selectedRecinto}
          >
            {salas.map((s) => (
              <Option key={s.id} value={s.id}>{s.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Selecciona evento"
            value={selectedEvento}
            onChange={(value) => setSelectedEvento(value)}
            style={{ minWidth: 220 }}
            allowClear
            disabled={!selectedSala && !selectedRecinto}
            showSearch
            optionFilterProp="children"
          >
            {eventos.map((e) => (
              <Option key={e.id} value={e.id}>{e.nombre}</Option>
            ))}
          </Select>

          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Crear paquete
          </Button>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex justify-between items-center">
                <div>
                  <Title level={4} className="mb-0">Paquetes disponibles</Title>
                  <Text type="secondary">Filtrando por: {filtroDescripcion}</Text>
                </div>
              </div>
            }
          >
            <Table
              dataSource={paquetes}
              columns={paqueteColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <Title level={4} className="mb-0">Plantillas de precios de paquetes</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openTemplateModal(null)}>
                  Nueva plantilla
                </Button>
              </div>
            }
          >
            {plantillas.length === 0 ? (
              <Text type="secondary">No hay plantillas configuradas para este contexto.</Text>
            ) : (
              <Space direction="vertical" className="w-full">
                {plantillas.map((plantilla) => (
                  <Card key={plantilla.id} size="small" className="shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <Text strong>{plantilla.nombre}</Text>
                        <div className="text-sm text-gray-500">{plantilla.descripcion || 'Sin descripción'}</div>
                        <div className="text-sm text-gray-600 mt-1">Precio base: ${Number(plantilla.precio || 0).toFixed(2)}</div>
                      </div>
                      <Space>
                        <Button onClick={() => applyPlantillaToForm(plantilla)}>Usar</Button>
                        <Button icon={<EditOutlined />} onClick={() => openTemplateModal(plantilla)} />
                      </Space>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>

          <Divider />

          <Card>
            <Title level={5}>Cómo funciona</Title>
            <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
              <li>Busca por recinto, sala y evento para ver los paquetes específicos.</li>
              <li>Crea paquetes combinando productos existentes y define stock disponible.</li>
              <li>Las plantillas de precios permiten reutilizar configuraciones entre funciones.</li>
            </ul>
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingPaquete ? 'Editar paquete' : 'Crear paquete'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText={editingPaquete ? 'Actualizar' : 'Crear'}
        width={720}
      >
        <Form form={form} layout="vertical" initialValues={emptyPackage}>
          <Form.Item label="Plantilla de paquete">
            <Select
              allowClear
              placeholder="Selecciona una plantilla para precargar"
              value={selectedPlantillaId}
              onChange={handlePlantillaChange}
              options={plantillas.map((p) => ({ value: p.id, label: p.nombre }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre"
                rules={[{ required: true, message: 'Ingresa el nombre del paquete' }]}
              >
                <Input placeholder="Nombre del paquete" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="precio"
                label="Precio"
                rules={[{ required: true, message: 'Ingresa el precio' }]}
              >
                <InputNumber prefix="$" min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={3} placeholder="Describe el paquete" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="stock_total" label="Cantidad existente" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stock_disponible" label="Disponibles" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="vendidos" label="Vendidos" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="imagen_url" label="Imagen (URL)">
            <Input prefix={<PictureOutlined />} placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="recinto_id" label="Recinto">
                <Select allowClear placeholder="Recinto" onChange={(val) => setSelectedRecinto(val)}>
                  {recintos.map((r) => (
                    <Option key={r.id} value={r.id}>{r.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sala_id" label="Sala">
                <Select allowClear placeholder="Sala" onChange={(val) => setSelectedSala(val)} disabled={!selectedRecinto}>
                  {salas.map((s) => (
                    <Option key={s.id} value={s.id}>{s.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="evento_id" label="Evento">
                <Select allowClear placeholder="Evento" showSearch optionFilterProp="children">
                  {eventos.map((e) => (
                    <Option key={e.id} value={e.id}>{e.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="productos_ids" label="Productos incluidos">
            <Select
              mode="multiple"
              allowClear
              placeholder="Selecciona productos para incluir"
              optionFilterProp="children"
            >
              {productos.map((p) => (
                <Option key={p.id} value={p.id}>{p.nombre} {p.categoria ? `(${p.categoria})` : ''}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingTemplate ? 'Editar plantilla de paquete' : 'Crear plantilla de paquete'}
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        onOk={handleSaveTemplate}
        okText={editingTemplate ? 'Actualizar' : 'Crear'}
      >
        <Form form={templateForm} layout="vertical" initialValues={emptyTemplate}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'Ingresa el nombre de la plantilla' }]}
          >
            <Input placeholder="Ej: Paquete familiar" />
          </Form.Item>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Describe el objetivo de la plantilla" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="precio" label="Precio sugerido" rules={[{ type: 'number', min: 0 }]}> 
                <InputNumber prefix="$" min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock_total" label="Stock base" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="imagen_url" label="Imagen (URL)">
            <Input prefix={<PictureOutlined />} placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="recinto_id" label="Recinto">
                <Select allowClear placeholder="Recinto">
                  {recintos.map((r) => (
                    <Option key={r.id} value={r.id}>{r.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sala_id" label="Sala">
                <Select allowClear placeholder="Sala" disabled={!selectedRecinto}>
                  {salas.map((s) => (
                    <Option key={s.id} value={s.id}>{s.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="evento_id" label="Evento">
                <Select allowClear placeholder="Evento" showSearch optionFilterProp="children">
                  {eventos.map((e) => (
                    <Option key={e.id} value={e.id}>{e.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Paquetes;
