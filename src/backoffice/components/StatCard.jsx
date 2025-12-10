import React from 'react';
import { Card, Typography, Space } from '../../utils/antdComponents';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = '#3b82f6',
  subtitle,
  loading = false 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined style={{ color: '#10b981' }} />;
    if (trend === 'down') return <ArrowDownOutlined style={{ color: '#ef4444' }} />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#64748b';
  };

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s',
        cursor: 'pointer',
        ':hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
        }
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Text style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
              {title}
            </Text>
            {subtitle && (
              <div>
                <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {subtitle}
                </Text>
              </div>
            )}
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: '20px'
          }}>
            {icon}
          </div>
        </div>

        {/* Value */}
        <div>
          <Title level={2} style={{ margin: '8px 0 4px 0', color: '#1e293b' }}>
            {value}
          </Title>
        </div>

        {/* Trend */}
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {getTrendIcon()}
            <Text style={{ 
              color: getTrendColor(), 
              fontSize: '12px', 
              fontWeight: '500' 
            }}>
              {trendValue}
            </Text>
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              vs mes anterior
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default StatCard;


