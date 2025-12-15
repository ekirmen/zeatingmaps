/**
 * Sistema de Afiliados - Replanteado desde Abonos
 * Gestiona programas de afiliados con links ºnicos, comisiones y dashboard
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Space,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Tabs,
  Badge,
  Switch,
  Typography,
} from '../../utils/antdComponents';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  LinkOutlined,
  DollarOutlined,
  BarChartOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text } = Typography;

const Afiliados = () => {
  const { currentTenant } = useTenant();
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAfiliado, setEditingAfiliado] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalAfiliados: 0,
    totalComisiones: 0,
    totalVentas: 0,
    ventasMes: 0,
  });

  useEffect(() => {
    loadAfiliados();
    loadStats();
  }, [currentTenant]);

  const loadAfiliados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('afiliados')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAfiliados(data || []);
    } catch (error) {
      console.error('Error cargando afiliados:', error);
      message.error('Error al cargar afiliados');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: ventas, error } = await supabase
        .from('transacciones')
        .select('*, afiliado:afiliado_id(*)')
        .eq('tenant_id', currentTenant?.id)
        .not('afiliado_id', 'is', null);

      if (error) throw error;

      const totalVentas = ventas?.length || 0;
      const totalComisiones = ventas?.reduce((sum, v) => sum + (v.comision_afiliado || 0), 0) || 0;
      const mesActual = new Date().getMonth();
      const ventasMes =
        ventas?.filter(v => {
          return fecha.getMonth() === mesActual;
        }).length || 0;

      setStats({
        totalAfiliados: afiliados.length,
        totalComisiones,
        totalVentas,
        ventasMes,
      });
    } catch (error) {
      console.error('Error cargando estad­sticas:', error);
    }
  };

  const generateAffiliateLink = afiliadoId => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/store?ref=${afiliadoId}`;
  };

  const handleCreate = () => {
    setEditingAfiliado(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = afiliado => {
    setEditingAfiliado(afiliado);
    form.setFieldsValue(afiliado);
    setIsModalVisible(true);
  };

  const handleDelete = async id => {
    Modal.confirm({
      title: '¿Eliminar afiliado?',
      content: 'Esta acci³n no se puede deshacer.',
      onOk: async () => {
        try {
          const { error } = await supabase.from('afiliados').delete().eq('id', id);

          if (error) throw error;
          message.success('Afiliado eliminado');
          loadAfiliados();
        } catch (error) {
          console.error('Error eliminando afiliado:', error);
          message.error('Error al eliminar afiliado');
        }
      },
    });
  };

  const handleCopyLink = afiliadoId => {
    const link = generateAffiliateLink(afiliadoId);
    navigator.clipboard.writeText(link);
    message.success('Link copiado al portapapeles');
  };

  const handleSubmit = async values => {
    try {
      const data = {
        ...values,
        tenant_id: currentTenant?.id,
        link_afiliado: editingAfiliado?.link_afiliado || `ref_${Date.now()}`,
        activo: values.activo !== undefined ? values.activo : true,
      };

      if (editingAfiliado) {
        const { error } = await supabase
          .from('afiliados')
          .update(data)
          .eq('id', editingAfiliado.id);

        if (error) throw error;
        message.success('Afiliado actualizado');
      } else {
        const { error } = await supabase.from('afiliados').insert([data]).select().single();

        if (error) throw error;
        message.success('Afiliado creado');
      }

      setIsModalVisible(false);
      form.resetFields();
      loadAfiliados();
      loadStats();
    } catch (error) {
      console.error('Error guardando afiliado:', error);
      message.error('Error al guardar afiliado');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Comisi³n (%)',
      dataIndex: 'comision_porcentaje',
      key: 'comision_porcentaje',
      render: value => `${value || 0}%`,
    },
    {
      title: 'Link Afiliado',
      key: 'link',
      render: (_, record) => (
        <Space>
          <Tooltip title={generateAffiliateLink(record.id)}>
            <Text
              copyable={{
                text: generateAffiliateLink(record.id),
                onCopy: () => handleCopyLink(record.id),
              }}
              style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {generateAffiliateLink(record.id).substring(0, 30)}...
            </Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: activo => (
        <Tag color={activo ? 'green' : 'red'}>{activo ? 'Activo' : 'Inactivo'}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Copiar Link">
            <Button type="link" icon={<CopyOutlined />} onClick={() => handleCopyLink(record.id)} />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Programa de Afiliados</h1>
        <p className="text-gray-600">Gestiona tus afiliados, comisiones y links de referencia</p>
      </div>

      {/* Estad­sticas */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Afiliados"
              value={stats.totalAfiliados}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Comisiones"
              value={stats.totalComisiones}
              prefix={<DollarOutlined />}
              precision={2}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Ventas"
              value={stats.totalVentas}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ventas este Mes"
              value={stats.ventasMes}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Afiliados */}
      <Card
        title="Afiliados"
        extra={
          <Button type="primary" icon={<UserAddOutlined />} onClick={handleCreate}>
            Nuevo Afiliado
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={afiliados}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        title={editingAfiliado ? 'Editar Afiliado' : 'Nuevo Afiliado'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'Ingresa el nombre' }]}
          >
            <Input placeholder="Nombre del afiliado" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Ingresa el email' },
              { type: 'email', message: 'Email inv¡lido' },
            ]}
          >
            <Input placeholder="email@ejemplo.com" />
          </Form.Item>

          <Form.Item
            name="comision_porcentaje"
            label="Comisi³n (%)"
            rules={[
              { required: true, message: 'Ingresa el porcentaje de comisi³n' },
              { type: 'number', min: 0, max: 100, message: 'Debe estar entre 0 y 100' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="5" min={0} max={100} suffix="%" />
          </Form.Item>

          <Form.Item name="descripcion" label="Descripci³n">
            <TextArea rows={3} placeholder="Descripci³n del afiliado (opcional)" />
          </Form.Item>

          <Form.Item name="activo" label="Estado" valuePropName="checked">
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Afiliados;
