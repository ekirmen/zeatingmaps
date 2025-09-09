import React, { useState, useEffect } from 'react';
import { Card, List, Input, Select, Typography, Space, Tag, Button, Drawer, Divider, Steps, Collapse } from 'antd';
import { 
  BookOutlined, 
  SearchOutlined, 
  FileTextOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DocumentationCenter = () => {
  const [documentation, setDocumentation] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'getting-started', label: 'Primeros pasos' },
    { value: 'events', label: 'Gestión de eventos' },
    { value: 'tickets', label: 'Sistema de boletos' },
    { value: 'payments', label: 'Pagos y facturación' },
    { value: 'users', label: 'Usuarios y permisos' },
    { value: 'technical', label: 'Configuración técnica' },
    { value: 'troubleshooting', label: 'Solución de problemas' }
  ];

  const difficultyColors = {
    beginner: 'green',
    intermediate: 'orange',
    advanced: 'red'
  };

  useEffect(() => {
    loadDocumentation();
    loadTutorials();
  }, []);

  const loadDocumentation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documentation')
        .select('*')
        .eq('is_published', true)
        .order('category, order_index');

      if (error) throw error;
      setDocumentation(data || []);
    } catch (error) {
      console.error('Error loading documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('interactive_tutorials')
        .select('*')
        .eq('is_published', true)
        .order('category, order_index');

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Error loading tutorials:', error);
    }
  };

  const filteredDocs = documentation.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openDocument = (doc) => {
    setSelectedDoc(doc);
    setDrawerVisible(true);
  };

  const renderDocumentationItem = (doc) => (
    <List.Item
      key={doc.id}
      actions={[
        <Button 
          type="link" 
          icon={<FileTextOutlined />}
          onClick={() => openDocument(doc)}
        >
          Leer
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
        title={
          <Space>
            <Text strong>{doc.title}</Text>
            <Tag color="blue">{doc.category}</Tag>
          </Space>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }}>
              {doc.content.replace(/<[^>]*>/g, '')} {/* Remove HTML tags */}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {doc.section && `${doc.section} • `}
              Actualizado: {new Date(doc.updated_at).toLocaleDateString('es-ES')}
            </Text>
          </div>
        }
      />
    </List.Item>
  );

  const renderTutorialItem = (tutorial) => (
    <List.Item
      key={tutorial.id}
      actions={[
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={() => openDocument(tutorial)}
        >
          Iniciar
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<PlayCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />}
        title={
          <Space>
            <Text strong>{tutorial.title}</Text>
            <Tag color={difficultyColors[tutorial.difficulty]}>
              {tutorial.difficulty}
            </Tag>
          </Space>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }}>
              {tutorial.description}
            </Paragraph>
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ClockCircleOutlined /> {tutorial.estimated_time} min
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <UserOutlined /> {tutorial.steps?.length || 0} pasos
              </Text>
            </Space>
          </div>
        }
      />
    </List.Item>
  );

  const renderTutorialSteps = (steps) => {
    if (!steps || !Array.isArray(steps)) return null;

    return (
      <Steps
        direction="vertical"
        size="small"
        items={steps.map((step, index) => ({
          title: step.title,
          description: step.description,
          status: 'wait'
        }))}
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BookOutlined style={{ marginRight: '8px' }} />
          Centro de Documentación
        </Title>
        <Text type="secondary">
          Encuentra guías, tutoriales y soluciones para usar el sistema
        </Text>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Search
            placeholder="Buscar en documentación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 200 }}
          >
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>
                {cat.label}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Documentación */}
        <div style={{ flex: 1 }}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Guías y Documentación</span>
                <Tag>{filteredDocs.length}</Tag>
              </Space>
            }
            loading={loading}
          >
            <List
              dataSource={filteredDocs}
              renderItem={renderDocumentationItem}
              locale={{ emptyText: 'No se encontró documentación' }}
            />
          </Card>
        </div>

        {/* Tutoriales */}
        <div style={{ flex: 1 }}>
          <Card
            title={
              <Space>
                <PlayCircleOutlined />
                <span>Tutoriales Interactivos</span>
                <Tag color="green">{filteredTutorials.length}</Tag>
              </Space>
            }
          >
            <List
              dataSource={filteredTutorials}
              renderItem={renderTutorialItem}
              locale={{ emptyText: 'No se encontraron tutoriales' }}
            />
          </Card>
        </div>
      </div>

      {/* Drawer para mostrar contenido */}
      <Drawer
        title={selectedDoc?.title}
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            {selectedDoc?.difficulty && (
              <Tag color={difficultyColors[selectedDoc.difficulty]}>
                {selectedDoc.difficulty}
              </Tag>
            )}
            {selectedDoc?.estimated_time && (
              <Text type="secondary">
                <ClockCircleOutlined /> {selectedDoc.estimated_time} min
              </Text>
            )}
          </Space>
        }
      >
        {selectedDoc && (
          <div>
            <Paragraph>
              {selectedDoc.description}
            </Paragraph>
            
            <Divider />
            
            {selectedDoc.steps ? (
              <div>
                <Title level={4}>Pasos del tutorial:</Title>
                {renderTutorialSteps(selectedDoc.steps)}
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: selectedDoc.content }}
                style={{ lineHeight: '1.6' }}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DocumentationCenter;
