import React, { useState } from 'react';
import { Input, Button, Tabs, Table, message, Card, Tag, Space, Typography, Divider } from 'antd';
import { SearchOutlined, UserOutlined, FileTextOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { fetchPaymentByLocator, fetchPaymentsByUserEmail } from '../services/apibackoffice';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const EnhancedPaymentSearch = ({ onPaymentSelect, onUserSelect }) => {
  const [activeTab, setActiveTab] = useState('locator');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Búsqueda por localizador
  const handleLocatorSearch = async () => {
    if (!searchValue.trim()) {
      message.warning('Por favor ingrese un localizador');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPaymentByLocator(searchValue.trim());
      
      if (result.error) {
        message.error('Error al buscar el localizador');
        setSearchResults(null);
        return;
      }

      if (result.data) {
        setSearchResults([result.data]);
        setUserInfo(result.data.user);
        message.success('Localizador encontrado');
      } else {
        setSearchResults([]);
        setUserInfo(null);
        message.info('No se encontró ningún pago con ese localizador');
      }
    } catch (error) {
      console.error('Error en búsqueda por localizador:', error);
      message.error('Error al realizar la búsqueda');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda por email
  const handleEmailSearch = async () => {
    if (!searchValue.trim()) {
      message.warning('Por favor ingrese un email');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPaymentsByUserEmail(searchValue.trim());
      
      if (result.error) {
        message.error('Error al buscar por email');
        setSearchResults(null);
        setUserInfo(null);
        return;
      }

      if (result.data && result.data.length > 0) {
        setSearchResults(result.data);
        setUserInfo(result.user);
        message.success(`${result.data.length} pagos encontrados para ${result.user.login}`);
      } else {
        setSearchResults([]);
        setUserInfo(null);
        message.info('No se encontraron pagos para ese email');
      }
    } catch (error) {
      console.error('Error en búsqueda por email:', error);
      message.error('Error al realizar la búsqueda');
      setSearchResults(null);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Manejar búsqueda según la pestaña activa
  const handleSearch = () => {
    if (activeTab === 'locator') {
      handleLocatorSearch();
    } else {
      handleEmailSearch();
    }
  };

  // Seleccionar pago
  const handlePaymentSelect = (payment) => {
    if (onPaymentSelect) {
      onPaymentSelect(payment);
    }
  };

  // Seleccionar usuario
  const handleUserSelect = () => {
    if (onUserSelect && userInfo) {
      onUserSelect(userInfo);
    }
  };

  // Columnas para la tabla de resultados
  const columns = [
    {
      title: 'Localizador',
      dataIndex: 'locator',
      key: 'locator',
      render: (locator) => (
        <Tag color="blue" icon={<FileTextOutlined />}>
          {locator}
        </Tag>
      ),
    },
    {
      title: 'Evento',
      dataIndex: 'event',
      key: 'event',
      render: (event) => event?.nombre || 'N/A',
    },
    {
      title: 'Función',
      dataIndex: 'funcion',
      key: 'funcion',
      render: (funcion) => (
        <div>
          <div>{funcion?.evento?.nombre || 'N/A'}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {funcion?.fecha_celebracion ? new Date(funcion.fecha_celebracion).toLocaleDateString() : 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Asientos',
      dataIndex: 'seatsCount',
      key: 'seatsCount',
      render: (count) => (
        <Tag color="green">
          {count} asiento{count !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${amount?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const normalized = (status || '').toLowerCase();
        const color = ['pagado', 'completed'].includes(normalized)
          ? 'green'
          : ['reservado', 'reserved', 'pending'].includes(normalized)
            ? 'orange'
            : 'red';
        const text = ['pagado', 'completed'].includes(normalized)
          ? 'Pagado'
          : ['reservado', 'reserved', 'pending'].includes(normalized)
            ? 'Reservado'
            : 'Pendiente';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => handlePaymentSelect(record)}
          >
            Seleccionar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Búsqueda de Pagos" style={{ marginBottom: 16 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              Buscar por Localizador
            </span>
          } 
          key="locator"
        >
          <div style={{ marginBottom: 16 }}>
            <Text>Ingrese el localizador del pago para encontrar los detalles específicos.</Text>
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              Buscar por Email
            </span>
          } 
          key="email"
        >
          <div style={{ marginBottom: 16 }}>
            <Text>Ingrese el email del usuario para ver todos sus pagos y reservas.</Text>
          </div>
        </TabPane>
      </Tabs>

      <div style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder={activeTab === 'locator' ? 'Ingrese localizador...' : 'Ingrese email...'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearch}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            Buscar
          </Button>
        </Space.Compact>
      </div>

      {/* Información del usuario (solo para búsqueda por email) */}
      {userInfo && activeTab === 'email' && (
        <Card 
          size="small" 
          style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}
          title={
            <Space>
              <UserOutlined />
              Información del Usuario
            </Space>
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div><strong>Email:</strong> {userInfo.login}</div>
              {userInfo.empresa && <div><strong>Empresa:</strong> {userInfo.empresa}</div>}
              {userInfo.telefono && <div><strong>Teléfono:</strong> {userInfo.telefono}</div>}
            </div>
            <Button 
              type="default" 
              onClick={handleUserSelect}
              icon={<UserOutlined />}
            >
              Seleccionar Usuario
            </Button>
          </div>
        </Card>
      )}

      {/* Resultados de la búsqueda */}
      {searchResults !== null && (
        <div>
          <Divider>
            <Title level={4}>
              {activeTab === 'locator' ? 'Resultado de Búsqueda' : 'Pagos Encontrados'}
            </Title>
          </Divider>
          
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No se encontraron resultados
            </div>
          ) : (
            <Table
              dataSource={searchResults}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default EnhancedPaymentSearch;
