import React, { useState, useEffect } from 'react';
import { Modal, Table, Card, Row, Col, Button, Tooltip, Progress } from '../../../utils/antdComponents';
import {
  BookOutlined,
  DollarOutlined,
  TicketOutlined,
  GlobalOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  FullscreenOutlined,
  CaretUpOutlined
} from '@ant-design/icons';
import { supabase } from '../../../supabaseClient';

const mobileStyles = `
  @media screen and (max-width: 640px) {
    .ant-modal-body { padding: 12px !important; }
    .event-status-map-wrapper {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
    }
  }
  .bar-grey { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; width: 100%; position: relative; }
  .bar-grey .sold { background-color: #1890ff; height: 100%; }
  .bar-grey .completed { background-color: #52c41a; }
  
  .summary_box {
    padding: 20px;
    border-radius: 8px;
    color: white;
    position: relative;
    overflow: hidden;
    height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .summary_box.sold { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  .summary_box.income { background: linear-gradient(135deg, #a8e063 0%, #56ab2f 100%); }
  .summary_box.tickets { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); }
  .summary_box.visits { background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); }
  
  .summary_box .title { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
  .summary_box .value-text { font-size: 24px; font-weight: bold; }
  .summary_box .icon-bg { position: absolute; right: -10px; bottom: -10px; font-size: 80px; opacity: 0.2; transform: rotate(-15deg); }
  
  .sticky-tabs-container {
      display: flex;
      overflow-x: auto;
      gap: 10px;
      padding-bottom: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
  }
  .sticky-tab {
      padding: 8px 16px;
      border-radius: 20px;
      background: #f5f5f5;
      color: #666;
      cursor: pointer;
      white-space: nowrap;
      font-size: 13px;
      transition: all 0.3s;
  }
  .sticky-tab.active {
      background: #722ed1;
      color: white;
      font-weight: 500;
  }
  .sticky-tab:hover:not(.active) {
      background: #e6e6e6;
  }
`;

const TabContentActividadTotal = ({ stats }) => (
  <div className="activity-tab">
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <div className="summary_box sold">
          <div className="title">Total operaciones</div>
          <div className="value-text">{stats.totalSales} ventas</div>
          {/* Icons disabled to ensure build stability */}
        </div>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <div className="summary_box income" style={{ background: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)' }}>
          <div className="title">Total ventas</div>
          <div className="value-text">${stats.totalAmount}</div>
          {/* Icons disabled to ensure build stability */}
        </div>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <div className="summary_box tickets">
          <div className="title">Total entradas</div>
          <div className="value-text">{stats.totalTickets}</div>
          {/* Icons disabled to ensure build stability */}
        </div>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <div className="summary_box visits">
          <div className="title">Total visitas</div>
          <div className="value-text">{stats.totalVisits}</div>
          {/* Icons disabled to ensure build stability */}
        </div>
      </Col>
    </Row>

    <div className="mt-8">
      <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-400">
        {/* Icons disabled */}
        <p>Gráficos detallados disponibles en próxima actualización</p>
      </div>
    </div>
  </div>
);

const TabContentEstadosZonas = () => (
  <div className="tab-extended">
    <h4 className="text-lg font-semibold mb-3">Estado general</h4>
    <div className="bg-gray-100 rounded-lg p-2 mb-6">
      <div className="flex h-4 rounded overflow-hidden">
        <div className="bg-blue-500" style={{ width: '78.4%' }}></div>
        <div className="bg-red-500" style={{ width: '4.6%' }}></div>
        <div className="bg-gray-300 flex-1"></div>
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-600">
        <span>Vendido: 78.4%</span>
        <span>Bloqueado: 4.6%</span>
      </div>
    </div>

    <Table
      dataSource={[
        { key: '1', zone: 'GENERAL', aforo: 300, blocked: 12, released: 208, avail: 80, percent: 69.33 },
        { key: '2', zone: 'VIP', aforo: 200, blocked: 11, released: 184, avail: 5, percent: 92.00 },
      ]}
      columns={[
        { title: 'Zona', dataIndex: 'zone', key: 'zone' },
        { title: 'Aforo', dataIndex: 'aforo', key: 'aforo', align: 'right' },
        { title: 'Emitidas', dataIndex: 'released', key: 'released', align: 'right' },
        { title: 'Disp.', dataIndex: 'avail', key: 'avail', align: 'right' },
        {
          title: 'Estado', key: 'status', render: (_, record) => (
            <div className="w-24">
              <div className="text-xs text-right mb-1">{record.percent}%</div>
              <div className="bar-grey"><div className="sold" style={{ width: `${record.percent}%` }}></div></div>
            </div>
          )
        }
      ]}
      pagination={false}
      size="small"
    />
  </div>
);

const TabContentPagos = () => (
  <div>
    <Table
      dataSource={[
        { key: '1', method: 'Fee procesador', tx: 106, amount: 3777.96, percent: 80.92 },
        { key: '2', method: 'Paypal', tx: 10, amount: 1477.71, percent: 100 },
      ]}
      columns={[
        { title: 'Método de pago', dataIndex: 'method' },
        { title: 'Transacciones', dataIndex: 'tx', align: 'right' },
        { title: 'Importe', dataIndex: 'amount', align: 'right' },
        { title: '% Acept.', dataIndex: 'percent', align: 'right', render: (val) => `${val}%` },
      ]}
      size="small"
    />
  </div>
);

const TabContentAccesos = () => (
  <div>
    <div className="mb-6">
      <h4 className="font-semibold mb-2">Asistencia Total</h4>
      <div className="flex h-8 bg-gray-200 rounded-full overflow-hidden relative">
        <div className="bg-green-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: '93.6%' }}>
          93.6%
        </div>
      </div>
    </div>

    <Table
      dataSource={[
        { key: '1', zone: 'VIP', entries: 174, pending: 10, percent: 94.5 },
        { key: '2', zone: 'GENERAL', entries: 193, pending: 15, percent: 92.7 },
      ]}
      columns={[
        { title: 'Zona', dataIndex: 'zone' },
        { title: 'Dentro', dataIndex: 'entries' },
        { title: 'Pendientes', dataIndex: 'pending' },
        {
          title: 'Progreso', key: 'prog', render: (_, r) => (
            <div className="w-24">
              <div className="bar-grey"><div className="completed" style={{ width: `${r.percent}%`, backgroundColor: '#52c41a' }}></div></div>
            </div>
          )
        }
      ]}
    />
  </div>
);

const EventInfoModal = ({ visible, onClose, selectedFuncion }) => {
  const [activeTab, setActiveTab] = useState('10');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalTickets: 0,
    totalVisits: 0
  });

  useEffect(() => {
    if (visible && selectedFuncion?.id) {
      fetchEventStats();
    }
  }, [visible, selectedFuncion?.id]);

  const fetchEventStats = async () => {
    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('id, total_amount, seats, status')
        .eq('funcion_id', selectedFuncion.id)
        .in('status', ['completed', 'pagado']);

      const totalSales = transactions?.length || 0;
      const totalAmount = transactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0) || 0;

      let totalTickets = 0;
      transactions?.forEach(t => {
        if (t.seats) {
          if (typeof t.seats === 'string') {
            try {
              const parsed = JSON.parse(t.seats);
              totalTickets += Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) { }
          } else if (Array.isArray(t.seats)) {
            totalTickets += t.seats.length;
          }
        }
      });

      setStats({
        totalSales,
        totalAmount,
        totalTickets,
        totalVisits: 854
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: '1', label: 'Últimas horas' },
    { id: '10', label: 'Actividad total' },
    { id: '2', label: 'Estados zonas' },
    { id: '3', label: 'Estado productos' },
    { id: '4', label: 'Historial de pagos' },
    { id: '5', label: 'Pagos confirmados' },
    { id: '6', label: 'Estado del plano' },
    { id: '8', label: 'Control de accesos' },
  ];

  return (
    <>
      <style>{mobileStyles}</style>
      <Modal
        open={visible}
        onCancel={onClose}
        width={1000}
        style={{ top: 20 }}
        className="dashboard-modal"
        title={
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-full hidden sm:block">
                {/* Icon disabled */}
                <span className="text-purple-600 text-xl font-bold">#</span>
              </div>
              <div>
                <h3 className="text-lg font-bold m-0">{selectedFuncion?.nombre || 'Información del Evento'}</h3>
                <div className="text-gray-500 text-xs flex items-center gap-2">
                  <span>{selectedFuncion?.recinto || 'Recinto Principal'}</span>
                  <span className="text-gray-300">|</span>
                  <span>{new Date(selectedFuncion?.fecha || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {/* Mobile-only header elements disabled */}
            <div className="flex items-center gap-3">
              <Button shape="circle" size="small">?</Button>
            </div>
          </div>
        }
      >
        <div className="dashboard-content">
          <div className="sticky-tabs-container dragscroll">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`sticky-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="tab-content-wrapper min-h-[400px]">
            {(activeTab === '10' || activeTab === '1') && (
              <TabContentActividadTotal stats={stats} />
            )}
            {activeTab === '2' && <TabContentEstadosZonas />}
            {activeTab === '5' && <TabContentPagos />}
            {activeTab === '8' && <TabContentAccesos />}

            {['3', '4', '6'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p>Información disponible próximamente</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EventInfoModal;
