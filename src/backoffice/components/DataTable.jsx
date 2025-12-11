import React from 'react';
import { Table, Card, Space, Button, Input, Select, Typography } from '../../utils/antdComponents';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

const DataTable = ({
  title,
  dataSource,
  columns,
  loading = false,
  pagination = {},
  onSearch,
  onRefresh,
  onAdd,
  searchPlaceholder = "Buscar...",
  addButtonText = "Agregar",
  showSearch = true,
  showAdd = true,
  showRefresh = true,
  extra,
  ...tableProps

  return (
    <Card
      title={title}
      style={{
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
      }}
      bodyStyle={{ padding: '0' }}
      extra={
        <Space>
          {extra}
          {showRefresh && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              Actualizar
            </Button>
          )}
          {showAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
            >
              {addButtonText}
            </Button>
          )}
        </Space>
      }
    >
      {/* Search Bar */}
      {showSearch && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Search
              placeholder={searchPlaceholder}
              onSearch={onSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              {dataSource?.length || 0} registros encontrados
            </Text>
          </Space>
        </div>
      )}

      {/* Table */}
      <Table
        dataSource={dataSource}
        columns={columns}
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} de ${total} registros`,
          ...pagination,
        }}
        style={{
          borderRadius: '0 0 12px 12px',
        }}
        rowKey={(record) => record.id || record._id}
        {...tableProps}
      />
    </Card>
  );
};

export default DataTable;


