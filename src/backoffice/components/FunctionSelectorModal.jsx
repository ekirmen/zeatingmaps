import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Tag, Space, message } from '../../utils/antdComponents';
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

/**
 * Modal para seleccionar funciones directamente sin filtrar por recinto/evento
 */
const FunctionSelectorModal = ({ visible, onClose, onSelect }) => {
    const [loading, setLoading] = useState(false);
    const [functions, setFunctions] = useState([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (visible) {
            loadFunctions();
        }
    }, [visible]);

    const loadFunctions = async () => {
        try {
            setLoading(true);
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('funciones')
                .select(`
          id,
          fecha_celebracion,
          inicio_venta,
          fin_venta,
          visible_en_boleteria,
          evento:eventos(id, nombre),
          sala:salas(id, nombre),
          recinto:recintos!sala_id(id, nombre)
        `)
                .eq('activo', true)
                .eq('visible_en_boleteria', true)
                .gte('fin_venta', now)
                .order('fecha_celebracion', { ascending: true });

            if (error) throw error;

            setFunctions(data || []);
        } catch (error) {
            console.error('Error loading functions:', error);
            message.error('Error al cargar las funciones');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (record) => {
        onSelect(record);
        onClose();
    };

    const filteredFunctions = functions.filter(func => {
        const searchLower = searchText.toLowerCase();
        const eventoNombre = func.evento?.nombre || '';
        const salaNombre = func.sala?.nombre || '';
        const recintoNombre = func.recinto?.nombre || '';
        const fecha = new Date(func.fecha_celebracion).toLocaleDateString('es-ES');

        return (
            eventoNombre.toLowerCase().includes(searchLower) ||
            salaNombre.toLowerCase().includes(searchLower) ||
            recintoNombre.toLowerCase().includes(searchLower) ||
            fecha.includes(searchLower)
        );
    });

    const columns = [
        {
            title: 'Evento',
            dataIndex: ['evento', 'nombre'],
            key: 'evento',
            width: '30%',
            render: (text) => <strong>{text || 'Sin nombre'}</strong>
        },
        {
            title: 'Recinto / Sala',
            key: 'location',
            width: '25%',
            render: (_, record) => (
                <div>
                    <div>{record.recinto?.nombre || 'N/A'}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.sala?.nombre || 'N/A'}</div>
                </div>
            )
        },
        {
            title: 'Fecha Celebración',
            dataIndex: 'fecha_celebracion',
            key: 'fecha',
            width: '20%',
            render: (fecha) => {
                const d = new Date(fecha);
                return (
                    <Space direction="vertical" size={0}>
                        <span>{d.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                            {d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </Space>
                );
            }
        },
        {
            title: 'Fin Venta',
            dataIndex: 'fin_venta',
            key: 'fin_venta',
            width: '15%',
            render: (fecha) => {
                const d = new Date(fecha);
                const now = new Date();
                const isExpiringSoon = (d - now) < (7 * 24 * 60 * 60 * 1000); // 7 días

                return (
                    <Tag color={isExpiringSoon ? 'orange' : 'green'}>
                        {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </Tag>
                );
            }
        },
        {
            title: 'Acción',
            key: 'action',
            width: '10%',
            render: (_, record) => (
                <a onClick={() => handleSelect(record)}>Seleccionar</a>
            )
        }
    ];

    return (
        <Modal
            title={
                <Space>
                    <CalendarOutlined />
                    <span>Seleccionar Función</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            bodyStyle={{ padding: '16px' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Input
                    placeholder="Buscar por evento, recinto, sala o fecha..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />

                <Table
                    columns={columns}
                    dataSource={filteredFunctions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showTotal: (total) => `${total} funciones disponibles`
                    }}
                    size="small"
                    onRow={(record) => ({
                        onClick: () => handleSelect(record),
                        style: { cursor: 'pointer' }
                    })}
                />
            </Space>
        </Modal>
    );
};

export default FunctionSelectorModal;
