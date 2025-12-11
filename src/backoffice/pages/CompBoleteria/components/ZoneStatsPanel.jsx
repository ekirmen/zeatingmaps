import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Tooltip, Badge } from '../../../../utils/antdComponents';
import { 
  UserOutlined, 
  LockOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DollarOutlined,
  EyeOutlined
} from '@ant-design/icons';

const ZoneStatsPanel = ({ 
  zonas, 
  zoneStats, 
  selectedZona, 
  onZonaSelect, 
  showPrices = true,
  showOccupancy = true,
  compact = false 
}) => {
  const getStatusColor = (status) => {
    switch (status) {

        return '#52c41a';
      case 'seleccionado':
        return '#ffd700';
      case 'vendido':
        return '#2d3748';
      case 'reservado':
        return '#805ad5';
      case 'bloqueado':
        return '#f56565';
      default:
        return '#52c41a';
    }
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return '#ff4d4f';
    if (percentage >= 70) return '#faad14';
    if (percentage >= 50) return '#1890ff';
    return '#52c41a';
  };

  const getOccupancyStatus = (percentage) => {
    if (percentage >= 90) return 'Cr­tico';
    if (percentage >= 70) return 'Alto';
    if (percentage >= 50) return 'Medio';
    return 'Bajo';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {zonas.map(zona => {
          const stats = zoneStats[zona.id] || { total: 0, disponibles: 0, precio: 0 };
          const ocupacion = stats.total > 0 ? Math.round(((stats.total - stats.disponibles) / stats.total) * 100) : 0;
          const isSelected = selectedZona?.id === zona.id;
          
          return (
            <Card
              key={zona.id}
              size="small"
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onZonaSelect(zona)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{zona.nombre}</span>
                    {isSelected && <Tag color="blue">Seleccionada</Tag>}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stats.disponibles}/{stats.total} disponibles
                  </div>
                  {showPrices && (
                    <div className="text-sm font-medium text-green-600">
                      ${stats.precio}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <Progress
                    type="circle"
                    size={40}
                    percent={ocupacion}
                    strokeColor={getOccupancyColor(ocupacion)}
                    format={() => `${ocupacion}%`}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {zonas.map(zona => {
        const stats = zoneStats[zona.id] || { 
          total: 0, 
          disponibles: 0, 
          seleccionados: 0, 
          vendidos: 0, 
          reservados: 0, 
          bloqueados: 0, 
          precio: 0 
        };
        const ocupacion = stats.total > 0 ? Math.round(((stats.total - stats.disponibles) / stats.total) * 100) : 0;
        const isSelected = selectedZona?.id === zona.id;
        
        return (
          <Card
            key={zona.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => onZonaSelect(zona)}
          >
            <div className="space-y-3">
              {/* Header de la zona */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-medium m-0">{zona.nombre}</h4>
                  {isSelected && <Tag color="blue">Seleccionada</Tag>}
                  <Tag color={getOccupancyColor(ocupacion)}>
                    {getOccupancyStatus(ocupacion)}
                  </Tag>
                </div>
                {showPrices && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${stats.precio}
                    </div>
                    <div className="text-sm text-gray-500">Precio</div>
                  </div>
                )}
              </div>

              {/* Barra de ocupaci³n */}
              {showOccupancy && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Ocupaci³n</span>
                    <span className="text-sm font-medium">{ocupacion}%</span>
                  </div>
                  <Progress
                    percent={ocupacion}
                    strokeColor={getOccupancyColor(ocupacion)}
                    showInfo={false}
                    size="small"
                  />
                </div>
              )}

              {/* Estad­sticas detalladas */}
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Statistic
                    title="Total"
                    value={stats.total}
                    prefix={<UserOutlined />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Disponibles"
                    value={stats.disponibles}
                    valueStyle={{ 
                      color: getStatusColor('disponible'),
                      fontSize: '16px'
                    }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Seleccionados"
                    value={stats.seleccionados}
                    valueStyle={{ 
                      color: getStatusColor('seleccionado'),
                      fontSize: '16px'
                    }}
                    prefix={<LockOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Vendidos"
                    value={stats.vendidos}
                    valueStyle={{ 
                      color: getStatusColor('vendido'),
                      fontSize: '16px'
                    }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
              </Row>

              {/* Estados adicionales */}
              {(stats.reservados > 0 || stats.bloqueados > 0) && (
                <div className="flex space-x-2">
                  {stats.reservados > 0 && (
                    <Badge
                      count={stats.reservados}
                      style={{ backgroundColor: getStatusColor('reservado') }}
                    >
                      <Tag color="purple">Reservados</Tag>
                    </Badge>
                  )}
                  {stats.bloqueados > 0 && (
                    <Badge
                      count={stats.bloqueados}
                      style={{ backgroundColor: getStatusColor('bloqueado') }}
                    >
                      <Tag color="red">Bloqueados</Tag>
                    </Badge>
                  )}
                </div>
              )}

              {/* Informaci³n adicional */}
              <div className="text-xs text-gray-500">
                <Tooltip title="Haz clic para seleccionar esta zona">
                  <EyeOutlined className="mr-1" />
                  Seleccionar zona para ver el mapa
                </Tooltip>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ZoneStatsPanel;


