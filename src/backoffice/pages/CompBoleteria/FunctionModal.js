import React from 'react';
import { Modal, Table, Button, Tag } from '../../../utils/antdComponents';
import formatDateString from '../../../utils/formatDateString';

const FunctionModal = ({
  visible,
  onCancel,
  funciones,
  onFunctionSelect,
}) => {
  // Funci³n para limpiar/normalizar la funci³n antes de enviarla

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

  const getPlantillaInfo = (funcion) => {
    if (funcion.plantilla?.nombre) {
      return funcion.plantilla.nombre;
    }
    return 'Sin plantilla';
  };

  const getSalaInfo = (funcion) => {
    if (typeof funcion.sala === 'object' && funcion.sala?.nombre) {
      return funcion.sala.nombre;
    }
    return '-”';
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fechaCelebracion',
      render: (date) => formatFecha(date),
      width: 120,
    },
    {
      title: 'Sala',
      dataIndex: 'sala',
      render: (_, record) => getSalaInfo(record),
      width: 100,
    },
    {
      title: 'Plantilla',
      dataIndex: 'plantilla',
      render: (_, record) => getPlantillaInfo(record),
      width: 150,
    },
    {
      title: 'Estado',
      render: (_, record) => {
        const now = new Date();
        const fechaCelebracion = new Date(record.fechaCelebracion);
        const inicioVenta = record.inicioVenta ? new Date(record.inicioVenta) : null;
        const finVenta = record.finVenta ? new Date(record.finVenta) : null;

        if (fechaCelebracion < now) {
          return <Tag color="red">Finalizada</Tag>;
        }
        
        if (inicioVenta && now < inicioVenta) {
          return <Tag color="orange">Pr³ximamente</Tag>;
        }
        
        if (finVenta && now > finVenta) {
          return <Tag color="red">Venta Cerrada</Tag>;
        }
        
        return <Tag color="green">En Venta</Tag>;
      },
      width: 100,
    },
    {
      title: 'Acciones',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onFunctionSelect(normalizeFunction(record));
          }}
        >
          Seleccionar
        </Button>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  return (
    <Modal
      title="Seleccionar Funci³n"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="80vw"
      styles={{ body: { padding: 0 } }}
      centered
      className="max-w-4xl mx-auto"
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


