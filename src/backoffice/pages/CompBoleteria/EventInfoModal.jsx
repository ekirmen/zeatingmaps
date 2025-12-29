import React, { useState, useEffect } from 'react';
import { Modal, Card, Statistic, Row, Col } from '../../../utils/antdComponents';
import { ShoppingOutlined, DollarOutlined, TicketOutlined, GlobalOutlined } from '@ant-design/icons';
import { supabase } from '../../../supabaseClient';

const EventInfoModal = ({ visible, onClose, selectedFuncion }) => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalAmount: 0,
        totalTickets: 0,
        totalVisits: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && selectedFuncion?.id) {
            fetchEventStats();
        }
    }, [visible, selectedFuncion?.id]);

    const fetchEventStats = async () => {
        setLoading(true);
        try {
            // Fetch payment transactions for this function
            const { data: transactions, error } = await supabase
                .from('payment_transactions')
                .select('id, total_amount, seats, status')
                .eq('funcion_id', selectedFuncion.id)
                .in('status', ['completed', 'pagado']);

            if (error) throw error;

            // Calculate stats
            const totalSales = transactions?.length || 0;
            const totalAmount = transactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0) || 0;

            // Count total tickets
            let totalTickets = 0;
            transactions?.forEach(t => {
                if (t.seats) {
                    if (typeof t.seats === 'string') {
                        try {
                            const parsed = JSON.parse(t.seats);
                            totalTickets += Array.isArray(parsed) ? parsed.length : 0;
                        } catch (e) {
                            // ignore
                        }
                    } else if (Array.isArray(t.seats)) {
                        totalTickets += t.seats.length;
                    }
                }
            });

            setStats({
                totalSales,
                totalAmount,
                totalTickets,
                totalVisits: 0 // TODO: Implement visits tracking
            });
        } catch (error) {
            console.error('[EventInfo] Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    return (
        <Modal
            title={
                <div>
                    <span className="text-lg font-semibold">📊 Información del Evento</span>
                    {selectedFuncion && (
                        <div className="text-sm text-gray-500 mt-1">
                            {selectedFuncion.nombre || 'Función'} - {new Date(selectedFuncion.fecha).toLocaleDateString('es-ES')}
                        </div>
                    )}
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            style={{ top: 20 }}
        >
            <div className="space-y-4">
                {/* Summary Boxes */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <Statistic
                                title={<span className="text-gray-700 font-medium">Total Operaciones</span>}
                                value={stats.totalSales}
                                suffix="ventas"
                                prefix={<ShoppingOutlined className="text-blue-600" />}
                                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                            <Statistic
                                title={<span className="text-gray-700 font-medium">Total Ventas</span>}
                                value={stats.totalAmount}
                                formatter={(value) => formatCurrency(value)}
                                prefix={<DollarOutlined className="text-green-600" />}
                                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <Statistic
                                title={<span className="text-gray-700 font-medium">Entradas Vendidas</span>}
                                value={stats.totalTickets}
                                prefix={<TicketOutlined className="text-purple-600" />}
                                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                            <Statistic
                                title={<span className="text-gray-700 font-medium">Total Visitas</span>}
                                value={stats.totalVisits}
                                prefix={<GlobalOutlined className="text-orange-600" />}
                                valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Charts Placeholder */}
                <Card className="mt-4">
                    <div className="text-center text-gray-500 py-8">
                        <p className="text-lg font-medium">📈 Gráficos de Ventas</p>
                        <p className="text-sm mt-2">Próximamente: Gráficos de ventas por hora, canal y tendencias</p>
                    </div>
                </Card>
            </div>
        </Modal>
    );
};

export default EventInfoModal;
