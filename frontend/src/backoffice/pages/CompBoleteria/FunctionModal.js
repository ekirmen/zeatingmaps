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
      title: 'Time',
      dataIndex: 'fechaCelebracion',
      render: (date) =>
        new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          type="default"
          variant="outlined"
          block
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

  const grouped = funciones.reduce((acc, f) => {
    const dateKey = new Date(f.fechaCelebracion).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(f);
    return acc;
  }, {});

  return (
    <Modal
      title="Select Function"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="90vw"
      styles={{ body: { padding: 0 } }}
      centered
      className="max-w-3xl mx-auto"
    >
      <div className="overflow-x-auto p-4 space-y-6">
        {Object.entries(grouped).map(([date, funcs]) => (
          <div key={date} className="space-y-2">
            <h4 className="font-semibold">{date}</h4>
            <Table
              dataSource={funcs}
              columns={columns}
              pagination={false}
              rowKey={(record) => record._id || record.key}
              size="middle"
              scroll={{ x: 'max-content' }}
              className="min-w-full"
              onRow={(record) => ({
                onClick: () => onFunctionSelect(record),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default FunctionModal;
