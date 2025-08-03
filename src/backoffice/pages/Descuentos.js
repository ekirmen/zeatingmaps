import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Assuming this path is correct for your public client
import { Input, Button, DatePicker, Select, Form, Table, Space, Tag, message } from 'antd';
import moment from 'moment'; // For date handling with Ant Design DatePicker

const { Option } = Select;

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [maxUsos, setMaxUsos] = useState('');
  const [eventos, setEventos] = useState([]); // Used in select
  const [zonas, setZonas] = useState([]);     // Used in zoneDetails and UI
  const [zoneDetails, setZoneDetails] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm(); // Ant Design Form instance

  useEffect(() => {
    fetchDescuentos();
    fetchEventos();
  }, []);

  useEffect(() => {
    // Sync form fields with state when editingId or form values change
    if (editingId) {
      form.setFieldsValue({
        codigo,
        fechaInicio: fechaInicio ? moment(fechaInicio) : null,
        fechaFinal: fechaFinal ? moment(fechaFinal) : null,
        eventoId,
        maxUsos,
      });
    } else {
      form.resetFields();
    }
  }, [editingId, codigo, fechaInicio, fechaFinal, eventoId, maxUsos, form]);


  const fetchDescuentos = async () => {
    const { data, error } = await supabase.from('descuentos').select('*, evento:eventos (nombre), detalles:detalles_descuento (*, zona:zonas (nombre))'); // Corrected join to 'zonas' table
    if (error) {
      console.error('Error al cargar descuentos:', error);
      message.error('Error al cargar descuentos');
      return;
    }
    setDescuentos(data);
  };

  const fetchEventos = async () => {
    const { data, error } = await supabase.from('eventos').select('id, nombre'); // Select only necessary fields
    if (error) {
      console.error('Error al cargar eventos:', error);
      message.error('Error al cargar eventos');
      return;
    }
    setEventos(data);
  };

  useEffect(() => {
    const loadZonas = async () => {
      if (!eventoId) {
        setZonas([]);
        setZoneDetails({}); // Clear zone details when event changes
        return;
      }
      const { data: evento, error: eventoError } = await supabase.from('eventos').select('sala').eq('id', eventoId).single();
      if (eventoError) {
        console.error('Error al cargar sala del evento:', eventoError);
        message.error('Error al cargar sala del evento');
        setZonas([]);
        setZoneDetails({});
        return;
      }
      if (evento?.sala) {
        const { data, error } = await supabase.from('zonas').select('id, nombre').eq('sala', evento.sala); // Select id and nombre
        if (!error) {
          setZonas(data);
        } else {
          console.error('Error al cargar zonas:', error);
          message.error('Error al cargar zonas');
          setZonas([]);
        }
      } else {
        setZonas([]);
        setZoneDetails({});
      }
    };
    loadZonas();
  }, [eventoId]);

  const handleSubmit = async (values) => { // Receive values from Ant Design Form
    const detalles = Object.entries(zoneDetails).map(([zonaId, det]) => ({ zona: zonaId, tipo: det.tipo, valor: Number(det.cantidad) }));
    const dto = {
      nombreCodigo: values.codigo,
      fechaInicio: values.fechaInicio ? values.fechaInicio.toISOString() : null, // Convert moment object to ISO string
      fechaFinal: values.fechaFinal ? values.fechaFinal.toISOString() : null,   // Convert moment object to ISO string
      evento: values.eventoId,
      maxUsos: values.maxUsos ? Number(values.maxUsos) : 0,
    };
    
    try {
      if (editingId) {
        const { error } = await supabase.from('descuentos').update(dto).eq('id', editingId);
        if (error) throw error;
        await supabase.from('detalles_descuento').delete().eq('descuento', editingId);
        await supabase.from('detalles_descuento').insert(detalles.map(d => ({ ...d, descuento: editingId })));
        message.success('Descuento actualizado');
      } else {
        const { data, error } = await supabase.from('descuentos').insert([dto]).select().single();
        if (error) throw error;
        await supabase.from('detalles_descuento').insert(detalles.map(d => ({ ...d, descuento: data.id })));
        message.success('Descuento creado');
      }
      fetchDescuentos();
      resetForm();
    } catch (error) {
      console.error('Error al guardar descuento:', error);
      message.error(`Error al guardar descuento: ${error.message}`);
    }
  };

  const resetForm = () => {
    setCodigo('');
    setFechaInicio('');
    setFechaFinal('');
    setEventoId('');
    setMaxUsos('');
    setZoneDetails({});
    setEditingId(null);
    form.resetFields(); // Reset Ant Design form fields
  };

  const handleEdit = (d) => {
    setCodigo(d.nombreCodigo);
    setFechaInicio(d.fechaInicio ? moment(d.fechaInicio) : null); // Convert to moment object
    setFechaFinal(d.fechaFinal ? moment(d.fechaFinal) : null);   // Convert to moment object
    setEventoId(d.evento?.id || d.evento);
    setMaxUsos(d.maxUsos ?? '');
    const detalles = {};
    (d.detalles || []).forEach(dt => {
      const id = dt.zona?.id || dt.zona;
      detalles[id] = { tipo: dt.tipo, cantidad: dt.valor };
    });
    setZoneDetails(detalles);
    setEditingId(d.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    try {
      await supabase.from('detalles_descuento').delete().eq('descuento', id);
      await supabase.from('descuentos').delete().eq('id', id);
      fetchDescuentos();
      message.success('Descuento eliminado');
    } catch (error) {
      console.error('Error al eliminar descuento:', error);
      message.error(`Error al eliminar descuento: ${error.message}`);
    }
  };

  const toggleZona = (zonaId) => {
    setZoneDetails(prev => {
      if (prev[zonaId]) {
        const { [zonaId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [zonaId]: { tipo: 'monto', cantidad: '' } };
    });
  };

  const handleZoneDetailChange = (zonaId, field, value) => {
    setZoneDetails(prev => ({
      ...prev,
      [zonaId]: {
        ...prev[zonaId],
        [field]: value
      }
    }));
  };

  const columns = [
    { title: 'Código', dataIndex: 'nombreCodigo', key: 'nombreCodigo' },
    { title: 'Evento', dataIndex: ['evento', 'nombre'], key: 'eventoNombre', render: text => text || 'N/A' },
    { title: 'Inicio', dataIndex: 'fechaInicio', key: 'fechaInicio', render: text => text ? moment(text).format('YYYY-MM-DD') : 'N/A' },
    { title: 'Fin', dataIndex: 'fechaFinal', key: 'fechaFinal', render: text => text ? moment(text).format('YYYY-MM-DD') : 'N/A' },
    { title: 'Usos Max.', dataIndex: 'maxUsos', key: 'maxUsos' },
    {
      title: 'Detalles',
      key: 'detalles',
      render: (_, record) => (
        <Space size="small">
          {(record.detalles || []).map(det => (
            <Tag key={det.zona?.id || det.zona} color={det.tipo === 'monto' ? 'blue' : 'green'}>
              {det.zona?.nombre || 'Zona'} {det.tipo === 'porcentaje' ? `${det.valor}%` : `$${det.valor}`}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>Editar</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>Eliminar</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Descuentos</h1>
      
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <Form.Item
          name="codigo"
          label="Código de Descuento"
          rules={[{ required: true, message: 'Por favor, ingrese el código' }]}
        >
          <Input value={codigo} onChange={e => setCodigo(e.target.value)} />
        </Form.Item>
        
        <Form.Item
          name="eventoId"
          label="Evento Asociado"
          rules={[{ required: true, message: 'Por favor, seleccione un evento' }]}
        >
          <Select
            placeholder="Seleccione un evento"
            value={eventoId}
            onChange={value => setEventoId(value)}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {eventos.map(evento => (
              <Option key={evento.id} value={evento.id}>{evento.nombre}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="fechaInicio"
          label="Fecha de Inicio"
          rules={[{ required: true, message: 'Por favor, seleccione la fecha de inicio' }]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm" value={fechaInicio ? moment(fechaInicio) : null} onChange={date => setFechaInicio(date)} />
        </Form.Item>

        <Form.Item
          name="fechaFinal"
          label="Fecha Final"
          rules={[{ required: true, message: 'Por favor, seleccione la fecha final' }]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm" value={fechaFinal ? moment(fechaFinal) : null} onChange={date => setFechaFinal(date)} />
        </Form.Item>

        <Form.Item
          name="maxUsos"
          label="Usos Máximos"
          rules={[{ type: 'number', message: 'Debe ser un número' }]}
        >
          <Input type="number" value={maxUsos} onChange={e => setMaxUsos(e.target.value)} />
        </Form.Item>

        <h3 className="text-lg font-semibold mt-6 mb-4">Detalles por Zona</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {zonas.map(zona => (
            <div key={zona.id} className="border p-4 rounded-md">
              <input
                type="checkbox"
                checked={!!zoneDetails[zona.id]}
                onChange={() => toggleZona(zona.id)}
                className="mr-2"
              />
              <label className="font-medium">{zona.nombre}</label>
              {zoneDetails[zona.id] && (
                <div className="mt-2">
                  <Select
                    value={zoneDetails[zona.id].tipo}
                    onChange={value => handleZoneDetailChange(zona.id, 'tipo', value)}
                    className="w-full mb-2"
                  >
                    <Option value="monto">Monto Fijo</Option>
                    <Option value="porcentaje">Porcentaje</Option>
                  </Select>
                  <Input
                    type="number"
                    value={zoneDetails[zona.id].cantidad}
                    onChange={e => handleZoneDetailChange(zona.id, 'cantidad', e.target.value)}
                    placeholder="Cantidad"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" className="w-full">
            {editingId ? 'Actualizar Descuento' : 'Crear Descuento'}
          </Button>
          {editingId && (
            <Button onClick={resetForm} className="w-full mt-2">
              Cancelar Edición
            </Button>
          )}
        </Form.Item>
      </Form>

      <h2 className="text-2xl font-bold mb-4">Listado de Descuentos</h2>
      <Table 
        dataSource={descuentos} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default Descuentos;
