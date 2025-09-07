import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  message, 
  Spin,
  Select,
  Input
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CopyOutlined,
  SettingOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import EmailTemplateEditor from '../components/EmailTemplateEditor';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const EmailTemplates = () => {
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  const reportTypes = [
    { value: 'sales', label: 'Ventas', color: 'blue' },
    { value: 'events', label: 'Eventos', color: 'green' },
    { value: 'users', label: 'Usuarios', color: 'purple' },
    { value: 'payments', label: 'Pagos', color: 'orange' },
    { value: 'products', label: 'Productos', color: 'cyan' },
    { value: 'promociones', label: 'Promociones', color: 'magenta' },
    { value: 'carritos', label: 'Carritos', color: 'volcano' }
  ];

  useEffect(() => {
    loadTemplates();
  }, [currentTenant?.id]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      message.error('Error al cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setModalVisible(true);
  };

  const handleCopy = async (template) => {
    try {
      setLoading(true);
      const newTemplate = {
        ...template,
        id: undefined,
        nombre: `${template.nombre} (Copia)`,
        es_predeterminado: false,
        created_at: undefined,
        updated_at: undefined
      };

      const { error } = await supabase
        .from('email_templates')
        .insert(newTemplate);

      if (error) throw error;
      message.success('Plantilla copiada correctamente');
      loadTemplates();
    } catch (error) {
      console.error('Error copying template:', error);
      message.error('Error al copiar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template) => {
    Modal.confirm({
      title: '¿Estás seguro?',
      content: `¿Quieres eliminar la plantilla "${template.nombre}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('id', template.id);

          if (error) throw error;
          message.success('Plantilla eliminada correctamente');
          loadTemplates();
        } catch (error) {
          console.error('Error deleting template:', error);
          message.error('Error al eliminar la plantilla');
        }
      }
    });
  };

  const handleSetDefault = async (template) => {
    try {
      setLoading(true);
      
      // First, unset all other defaults for this report type
      await supabase
        .from('email_templates')
        .update({ es_predeterminado: false })
        .eq('tenant_id', currentTenant?.id)
        .eq('tipo_reporte', template.tipo_reporte);

      // Then set this one as default
      const { error } = await supabase
        .from('email_templates')
        .update({ es_predeterminado: true })
        .eq('id', template.id);

      if (error) throw error;
      message.success('Plantilla establecida como predeterminada');
      loadTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      message.error('Error al establecer la plantilla predeterminada');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesReportType = reportTypeFilter === 'all' || template.tipo_reporte === reportTypeFilter;
    const matchesSearch = template.nombre.toLowerCase().includes(searchValue.toLowerCase());
    return matchesReportType && matchesSearch;
  });

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.es_predeterminado && <Tag color="gold">Predeterminada</Tag>}
          {!record.activo && <Tag color="red">Inactiva</Tag>}
        </Space>
      )
    },
    {
      title: 'Tipo de Reporte',
      dataIndex: 'tipo_reporte',
      key: 'tipo_reporte',
      render: (tipo) => {
        const reportType = reportTypes.find(rt => rt.value === tipo);
        return (
          <Tag color={reportType?.color}>
            {reportType?.label}
          </Tag>
        );
      }
    },
    {
      title: 'Versión',
      dataIndex: 'version',
      key: 'version',
      render: (version) => <Text code>{version}</Text>
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>
          {activo ? 'ACTIVA' : 'INACTIVA'}
        </Tag>
      )
    },
    {
      title: 'Creada',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
            title="Copiar"
          />
          {!record.es_predeterminado && (
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleSetDefault(record)}
              title="Establecer como Predeterminada"
            />
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title="Eliminar"
          />
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>
          <BgColorsOutlined className="mr-2" />
          Plantillas de Email
        </Title>
        <Text type="secondary">Diseña y personaliza las plantillas de email para tus reportes programados</Text>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text strong>Tipo de Reporte:</Text>
            <Select
              value={reportTypeFilter}
              onChange={setReportTypeFilter}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="all">Todos</Option>
              {reportTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Buscar:</Text>
            <Search
              placeholder="Buscar plantillas..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              style={{ marginTop: 24 }}
            >
              Nueva Plantilla
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <div className="text-center">
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {templates.length}
              </Title>
              <Text type="secondary">Total Plantillas</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="text-center">
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {templates.filter(t => t.activo).length}
              </Title>
              <Text type="secondary">Plantillas Activas</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="text-center">
              <Title level={3} style={{ margin: 0, color: '#faad14' }}>
                {templates.filter(t => t.es_predeterminado).length}
              </Title>
              <Text type="secondary">Plantillas Predeterminadas</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTemplates}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} plantillas`
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTemplate(null);
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 1200 }}
      >
        <EmailTemplateEditor
          templateId={editingTemplate?.id}
          reportType={editingTemplate?.tipo_reporte}
          onSave={() => {
            setModalVisible(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
          onCancel={() => {
            setModalVisible(false);
            setEditingTemplate(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default EmailTemplates;
