import React from 'react';
import { Modal, Table, Button } from 'antd';
import formatDateString from '../../../utils/formatDateString';

const FunctionModal = ({
  visible,
  onCancel,
  funciones,
  onFunctionSelect,
}) => {
  // Función para limpiar/normalizar la función antes de enviarla
  const normalizeFunction = (funcion) => {
    return {
      ...funcion,
      sala: typeof funcion.sala === 'object' && funcion.sala !== null
        ? funcion.sala.id || funcion.sala._id
        : funcion.sala,
    };
  };

  const formatFecha = (date) => {
    return formatDateString(date);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'fechaCelebracion',
      render: (date) => formatFecha(date),
    },
    {
      title: 'Room',
      dataIndex: ['sala', 'nombre'],
      render: (_, record) => {
        if (typeof record.sala === 'object' && record.sala !== null) {
          return record.sala.nombre || '—';
        }
        return '—';
      },
    },
    {
      title: 'Sale Period',
      render: (_, record) => (
        <span className="whitespace-nowrap">
          {formatFecha(record.inicioVenta)} to{' '}
          {formatFecha(record.finVenta)}
        </span>
      ),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Button
          type="default"
          block
          onClick={(e) => {
            e.stopPropagation();
            onFunctionSelect(normalizeFunction(record));
          }}
          className="bg-blue-600 hover:bg-blue-700 border-none text-white"
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
      styles={{ body: { padding: 0 } }}
      centered
      className="max-w-3xl mx-auto"
    >
      <div className="overflow-x-auto p-4">
        <Table
          dataSource={funciones}
          columns={columns}
          pagination={false}
          rowKey={(record) => record._id || record.id || record.key}
          size="middle"
          scroll={{ x: 'max-content' }}
          className="min-w-full"
          onRow={(record) => ({
            onClick: () => onFunctionSelect(normalizeFunction(record)),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
    </Modal>
  );
};

export default FunctionModal;
