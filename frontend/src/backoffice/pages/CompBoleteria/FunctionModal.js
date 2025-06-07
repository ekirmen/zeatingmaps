import React from 'react';
import { Modal, Table, Button } from 'antd';

const FunctionModal = ({
  visible,
  onCancel,
  funciones,
  onFunctionSelect,
}) => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'fechaCelebracion',
      render: (date) => new Date(date).toLocaleDateString(),
      // No ocultar columnas para móvil
    },
    {
      title: 'Room',
      dataIndex: ['sala', 'nombre'],
    },
    {
      title: 'Sale Period',
      render: (_, record) => (
        <span className="whitespace-nowrap">
          {new Date(record.inicioVenta).toLocaleDateString()} to{' '}
          {new Date(record.finVenta).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation(); // evita que dispare el click de fila
            onFunctionSelect(record);
          }}
          className="bg-blue-600 hover:bg-blue-700 border-none"
        >
          Select
        </Button>
      ),
      fixed: 'right',
      width: 100,
    },
  ];

  return (
    <Modal
      title="Select Function"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="90vw"
      bodyStyle={{ padding: 0 }}
      centered
      className="max-w-3xl mx-auto"
    >
      <div className="overflow-x-auto p-4">
        <Table
          dataSource={funciones}
          columns={columns}
          pagination={false}
          rowKey={(record) => record._id || record.key}
          size="middle"
          scroll={{ x: 'max-content' }}
          className="min-w-full"
          onRow={(record) => ({
            onClick: () => onFunctionSelect(record), // click fila selecciona función
            style: { cursor: 'pointer' },
          })}
        />
      </div>
    </Modal>
  );
};

export default FunctionModal;
