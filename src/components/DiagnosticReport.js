import React, { useState } from 'react';
import { Card, Collapse, Tag, Alert, List, Typography, Space, Button, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  SettingOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Title } = Typography;

const DiagnosticReport = ({ report, onRefresh, showDetails = false }) => {
  const [expandedPanels, setExpandedPanels] = useState(showDetails ? ['summary', 'actions'] : ['summary']);

  if (!report) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OK':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'ADVERTENCIA':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'CRÍTICO':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRÍTICA':
        return 'red';
      case 'ALTA':
        return 'orange';
      case 'MEDIA':
        return 'blue';
      case 'BAJA':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK':
        return 'success';
      case 'ADVERTENCIA':
        return 'warning';
      case 'CRÍTICO':
        return 'error';
      default:
        return 'info';
    }
  };

  const renderTableAccess = () => {
    if (!report.details?.tableAccess) return null;

    return (
      <div>
        <Title level={5}>Acceso a Tablas</Title>
        <Space wrap>
          {Object.entries(report.details.tableAccess).map(([tableName, access]) => (
            <Tooltip 
              key={tableName} 
              title={`${access.canAccess ? 'Accesible' : 'No accesible'} - ${access.responseTime || 'N/A'}ms`}
            >
              <Tag 
                color={access.canAccess ? 'green' : 'red'}
                icon={access.canAccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {tableName}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      </div>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!report.details?.performanceMetrics) return null;

    const { performanceMetrics } = report.details;
    
    return (
      <div>
        <Title level={5}>Métricas de Rendimiento</Title>
        <Space direction="vertical" size="small">
          <Text>
            <DatabaseOutlined /> Tablas accesibles: {performanceMetrics.accessibleTables}/{performanceMetrics.totalTables}
          </Text>
          <Text>
            <SettingOutlined /> Tiempo promedio de respuesta: {Math.round(performanceMetrics.averageResponseTime)}ms
          </Text>
        </Space>
      </div>
    );
  };

  const renderActions = () => {
    if (!report.actions || report.actions.length === 0) return null;

    return (
      <Panel header={<><BugOutlined /> Acciones Recomendadas</>} key="actions">
        <List
          dataSource={report.actions}
          renderItem={(action, index) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={getPriorityColor(action.priority)}>
                      {action.priority}
                    </Tag>
                    {action.action}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">{action.description}</Text>
                    <List
                      size="small"
                      dataSource={action.steps}
                      renderItem={(step, stepIndex) => (
                        <List.Item style={{ padding: '4px 0' }}>
                          <Text>{stepIndex + 1}. {step}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Panel>
    );
  };

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          Reporte de Diagnóstico
          {onRefresh && (
            <Tooltip title="Actualizar diagnóstico">
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Alert
        message={`Estado: ${report.summary.overallStatus}`}
        description={
          <Space direction="vertical" size="small">
            <Text>
              {getStatusIcon(report.summary.overallStatus)} 
              {report.summary.errorCount > 0 && ` ${report.summary.errorCount} error(es)`}
              {report.summary.warningCount > 0 && ` ${report.summary.warningCount} advertencia(s)`}
            </Text>
            <Text type="secondary">
              Generado: {new Date(report.summary.timestamp).toLocaleString()}
            </Text>
          </Space>
        }
        type={getStatusColor(report.summary.overallStatus)}
        showIcon={false}
        style={{ marginBottom: 16 }}
      />

      <Collapse 
        activeKey={expandedPanels} 
        onChange={setExpandedPanels}
        ghost
      >
        <Panel header={<><InfoCircleOutlined /> Resumen</>} key="summary">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {renderTableAccess()}
            {renderPerformanceMetrics()}
            
            {report.details?.systemHealth && (
              <div>
                <Title level={5}>Salud del Sistema</Title>
                <Space>
                  <Tag color={report.details.systemHealth.canAccessEventos ? 'green' : 'red'}>
                    {report.details.systemHealth.canAccessEventos ? 'Eventos accesibles' : 'Eventos no accesibles'}
                  </Tag>
                  {report.details.systemHealth.hasEventos && (
                    <Tag color="green">Con eventos</Tag>
                  )}
                </Space>
              </div>
            )}
            
            {report.details?.salaExists && (
              <div>
                <Title level={5}>Estado de la Sala</Title>
                <Space>
                  <Tag color={report.details.salaExists.exists ? 'green' : 'red'}>
                    {report.details.salaExists.exists ? 'Existe' : 'No existe'}
                  </Tag>
                  {report.details.salaExists.data && (
                    <>
                      <Tag color={report.details.salaExists.data.tenant_id ? 'green' : 'orange'}>
                        {report.details.salaExists.data.tenant_id ? 'Con tenant' : 'Sin tenant'}
                      </Tag>
                      <Tag color={report.details.salaExists.data.estado === 'activa' ? 'green' : 'orange'}>
                        {report.details.salaExists.data.estado || 'N/A'}
                      </Tag>
                    </>
                  )}
                </Space>
              </div>
            )}

            {report.details?.mapaExists && (
              <div>
                <Title level={5}>Estado del Mapa</Title>
                <Space>
                  <Tag color={report.details.mapaExists.exists ? 'green' : 'red'}>
                    {report.details.mapaExists.exists ? 'Existe' : 'No existe'}
                  </Tag>
                  {report.details.mapaExists.data && (
                    <>
                      <Tag color={report.details.mapaExists.data.hasContent ? 'green' : 'orange'}>
                        {report.details.mapaExists.data.hasContent ? 'Con contenido' : 'Sin contenido'}
                      </Tag>
                      <Tag color={report.details.mapaExists.data.hasTenantId ? 'green' : 'orange'}>
                        {report.details.mapaExists.data.hasTenantId ? 'Con tenant' : 'Sin tenant'}
                      </Tag>
                      {report.details.mapaExists.data.contentLength > 0 && (
                        <Tag color={report.details.mapaExists.data.contentLength > 100000 ? 'orange' : 'green'}>
                          {Math.round(report.details.mapaExists.data.contentLength / 1024)}KB
                        </Tag>
                      )}
                    </>
                  )}
                </Space>
              </div>
            )}

            {report.details?.realtimeStatus && (
              <div>
                <Title level={5}>Estado de Realtime</Title>
                <Space>
                  <Tag color={report.details.realtimeStatus.hasChannels ? 'green' : 'orange'}>
                    {report.details.realtimeStatus.channelCount} canal(es)
                  </Tag>
                  {report.details.realtimeStatus.channels?.map((channel, index) => (
                    <Tag key={index} color={channel.state === 'SUBSCRIBED' ? 'green' : 'orange'}>
                      {channel.topic}: {channel.state}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Panel>

        {renderActions()}

        {report.tests && report.tests.length > 0 && (
          <Panel header={<><DatabaseOutlined /> Pruebas de Consulta</>} key="tests">
            <List
              dataSource={report.tests}
              renderItem={(test, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={test.success ? 'green' : 'red'}>
                          {test.success ? 'ÉXITO' : 'FALLO'}
                        </Tag>
                        {test.name}
                      </Space>
                    }
                    description={
                      test.error ? (
                        <Text type="danger">Error: {test.error}</Text>
                      ) : (
                        <Text type="success">Consulta exitosa</Text>
                      )
                    }
                  />
                </List.Item>
              )}
            />
          </Panel>
        )}
      </Collapse>
    </Card>
  );
};

export default DiagnosticReport;
